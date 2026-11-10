import { MessageChannel } from 'node:worker_threads';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { readFile } from 'node:fs/promises';

async function setup(origin = '', handler = async () => ({ user: null, uploadsEnabled: false, storageUsed: 0, storageLimit: null })) {
  const result = await build({ stdin: { contents: "import {mountCommunity,unmountCommunity} from './web/community-ui/main.tsx'; import {act} from 'react'; import {api,serviceOrigin} from './web/community-ui/service.ts'; window.testApp={mountCommunity,unmountCommunity,act,api,serviceOrigin};", resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, format: 'iife', jsx: 'automatic', loader: { '.css': 'empty' }, define: { 'import.meta.env.VITE_COMMUNITY_URL': JSON.stringify(origin), 'process.env.NODE_ENV': '"development"' } });
  const dom = new JSDOM('<div id="communityRoot"></div>', { url: 'https://localhost', runScripts: 'outside-only' });
  const w = dom.window, requests = [];
  const channels=[];w.MessageChannel=class extends MessageChannel{constructor(){super();channels.push(this)}};
  w.IS_REACT_ACT_ENVIRONMENT = true;
  w.AbortSignal = AbortSignal;
  w.setInterval = () => 0; w.clearInterval = () => {};
  w.fetch = async (url, options) => { requests.push({ url, options }); return Response.json(await handler(url, options)); };
  w.open = () => { throw new Error('Community must stay in the app'); };
  w.eval(result.outputFiles[0].text);
  const app = w.testApp, q = selector => w.document.querySelector(selector);
  const click = async text => { if(['Posts','Friends','Messages','Groups','Account'].includes(text)){await app.act(async()=>app.mountCommunity(q('#communityRoot'),text==='Account',text));return;} const b = [...w.document.querySelectorAll('button')].find(x => x.textContent === text); assert(b, text); await app.act(async () => b.click()); };
  await app.act(async () => app.mountCommunity(q('#communityRoot')));
  return { w, app, requests, q, click, close: async () => { await app.act(async()=>app.unmountCommunity()); channels.forEach(c=>{c.port1.close();c.port2.close()});dom.window.close(); } };
}

test('unconfigured community stays in-app, shows sections, never requests a website or fake sign-in', async () => {
  const t = await setup();
  try {
    assert.match(t.q('#communityRoot').textContent, /has not launched/);
    for (const section of ['Friends','Messages','Groups','Account','Posts']) {
      await t.click(section);
      assert(!t.q('#communityRoot').textContent.includes('Oathkeeper community'), section);
      assert(!t.q('#communityRoot').textContent.includes('has not launched'), section);
    }
    assert.equal(t.requests.length, 0);
    assert.equal(t.q('input[type=url]'), null);
    await t.click('Account');
    assert([...t.w.document.querySelectorAll('button')].find(b => b.textContent==='Log in').disabled);
  } finally { await t.close(); }
});

test('configured community uses credentialed API and signs out inside the app', async () => {
  let signedIn = true;
  const t = await setup('https://community.example', async (url, options) => {
    const path = new URL(url).pathname;
    if(path.endsWith('/logout')){signedIn=false;return {ok:true};}
    if(path.endsWith('/session'))return {user:signedIn?{id:'user-1',username:'harrison',moderator:false}:null,uploadsEnabled:false,storageUsed:0,storageLimit:null};
    if(path.endsWith('/groups'))return {groups:[],invitations:[]};
    return [];
  });
  try {
    await t.click('Account');
    assert.match(t.q('#communityRoot').textContent,/Signed in as harrison/);
    await t.click('Sign out');
    assert.match(t.q('#communityRoot').textContent,/Welcome back/);
    assert(t.requests.some(r=>r.url.endsWith('/logout')&&r.options.method==='POST'));
    for(const r of t.requests){assert.equal(r.options.credentials,'include');assert.equal(r.options.headers['X-Oathkeeper-Request'],'1');assert.equal(new URL(r.url).origin,'https://community.example');}
  } finally { await t.close(); }
});

test('API failures are visible and service origins reject insecure or credentialed addresses',async()=>{
  const t=await setup();
  try{
    for(const url of ['http://example.com','https://user:pass@example.com','https://example.com/path','https://example.com/?token=x'])assert.throws(()=>t.app.serviceOrigin(url));
    await assert.rejects(t.app.api('/session'),/not available yet/);
  }finally{await t.close()}
  const failure=await setup('https://community.example',()=>{throw new Error('offline')});
  try{assert.match(failure.q('[role=alert]').textContent,/unavailable/)}finally{await failure.close()}
});

test('mobile shell mounts community and account locally without website launch or URL field', async()=>{
  const source=await readFile('web/app.js','utf8');
  assert(source.includes("mountCommunity($('#communityRoot'),tab==='Account',tab)"));
  assert(!source.includes('openCommunity'));
  assert(!source.includes('communityAddress'));
  const config=JSON.parse(await readFile('capacitor.config.json','utf8'));
  assert.equal(config.plugins.CapacitorHttp.enabled,true);
});
