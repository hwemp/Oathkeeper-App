import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
const result=await build({entryPoints:['web/app.js'],bundle:true,write:false,format:'esm',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.VITE_COMMUNITY_URL':'""','import.meta.url':'"https://localhost/app.js"','process.env.NODE_ENV':'"production"'}});
async function shell(saved,consent=true){const dom=new JSDOM(html,{url:'https://localhost',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;w.structuredClone=structuredClone;w.AbortSignal=AbortSignal;Object.defineProperty(w,'crypto',{value:webcrypto});let copied='';Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async s=>{copied=s}}});if(saved)w.localStorage.setItem('oathkeeper-v1',JSON.stringify(saved));if(consent)w.localStorage.setItem('oathkeeper-terms-acceptance',JSON.stringify({version:'2026-11-10-v1',accepted:true,tier:'adult',at:'2026-11-10T00:00:00Z'}));await w.eval('(async()=>{'+result.outputFiles[0].text+'})()');const q=s=>w.document.querySelector(s),click=s=>{const b=q(s);assert(b,s);b.click()},input=(s,v,kind='input')=>{const e=q(s);assert(e,s);e.value=v;e.dispatchEvent(new w.Event(kind,{bubbles:true}))};await new Promise(r=>setTimeout(r,0));return {w,q,click,input,saved:()=>JSON.parse(w.localStorage.getItem('oathkeeper-v1')),copied:()=>copied,close:async()=>{await new Promise(r=>setTimeout(r,0));w.close()}};}
test('full app preserves character data while recording rolls and restoring stats',async()=>{let s=await shell();let saved;try{s.click('[data-tab="Dice"]');s.input('#diceQuantity','3');s.input('#diceModifier','-2');s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));saved=s.saved();assert.equal(saved.rollHistory.length,1);assert.equal(saved.rollHistory[0].values.length,3);assert.equal(saved.name,'Ecclesyus Ha Kawa');assert.equal(saved.hp,15);assert.match(s.q('.roll-statistics').textContent,/Individual dice/);assert.equal(saved.rollHistory[0].modifier,-2)}finally{await s.close()}s=await shell(saved);try{s.click('[data-tab="Dice"]');assert.equal(s.saved().rollHistory.length,1);assert.match(s.q('.roll-statistics').textContent,/Observed official D20/)}finally{await s.close()}});
test('DM workflow persists placement, notes, initiative, damage and round advance',async()=>{const s=await shell();try{s.click('[data-tab="DM"]');s.click('[data-dm-section="Session"]');s.input('[data-dm="title"]','Combined campaign');s.input('[data-dm="placement"]','tab','change');assert(s.q('#nav [data-tab="DM"]'));s.click('[data-dm-section="Campaign"]');s.input('[data-dm-note="NPCs & factions"]','The hidden ally');s.click('[data-dm-section="Encounter"]');const form=s.q('#dmAdd');form.elements.name.value='Paladin';form.elements.maxhp.value='20';form.elements.initiative.value='15';form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(s.saved().dm.combatants.length,1);s.click('[data-dm-action="next"]');assert.equal(s.saved().dm.round,1);s.input('[id^="dm-amount-"]','7');s.click('[data-dm-action="damage"]');assert.equal(s.saved().dm.combatants[0].hp,13);s.click('[data-dm-action="next"]');assert.equal(s.saved().dm.round,2);assert.equal(s.saved().dm.notes['NPCs & factions'],'The hidden ally');assert.equal(s.saved().name,'Ecclesyus Ha Kawa')}finally{await s.close()}});
test('invalid history recovery preserves a valid DM workspace and character notes',async()=>{let s=await shell(),saved;try{s.click('[data-tab="DM"]');s.click('[data-dm-section="Session"]');s.input('[data-dm="title"]','Keep this');saved=s.saved();saved.rollHistory=[{invalid:true}];saved.notes='Keep character journal'}finally{await s.close()}s=await shell(saved);try{assert.equal(s.saved().dm.title,'Keep this');assert.equal(s.saved().notes,'Keep character journal');assert.deepEqual(s.saved().rollHistory,[])}finally{await s.close()}});
test('Support drafts redact credentials and do not attach character or DM notes',async()=>{const s=await shell();try{s.click('[data-tab="Support"]');assert.equal(s.q('a[href^="mailto:"]').textContent,'ecclesyus@gmail.com');s.input('#supportDescription','Dice broke. password=privatevalue access_token=privatekey');s.click('[data-support="copy"]');await new Promise(r=>setTimeout(r,0));assert(!s.copied().includes('privatevalue'));assert(!s.copied().includes('privatekey'));assert(!s.copied().includes('Messianic'));assert.match(s.copied(),/^Oathkeeper support report/);assert.doesNotMatch(s.copied(),/ChatGPT|OpenAI|AI assistance/i);assert.equal(s.q('[data-support="approve"]'),null);assert.equal(s.q('#supportAuto').checked,false)}finally{await s.close()}});
test('Store follows Friends and stays empty; notices appear only in About rather than Dice or recurring footer',async()=>{const s=await shell();try{const menu=[...s.q('#appMenu .menu-options').querySelectorAll('button[data-tab]')].map(b=>b.dataset.tab);assert.equal(menu[menu.indexOf('Friends')+1],'Store');s.click('[data-tab="Store"]');assert.equal(s.q('#view').textContent.trim(),'Store');assert.equal(s.q('#view button'),null);s.click('[data-tab="Dice"]');assert(!s.q('#view').textContent.includes('Artwork does not affect'));assert.equal(s.q('footer'),null);assert.equal(s.q('.die-face-overlay'),null);s.click('[data-tab="Settings"]');s.click('[data-tab="About"]');assert.match(s.q('#view').textContent,/Artwork does not affect/);assert.match(s.q('#view').textContent,/Personal homebrew profile/);assert.match(s.q('#view').textContent,/ecclesyus@gmail.com/)}finally{await s.close()}});

test('first-launch terms block app until the truthful age declaration is accepted',async()=>{
 const s=await shell(null,false);
 try{
  assert.equal(s.q('#termsGate').hidden,false);
  assert.equal(s.q('main').inert,true);
  assert.equal(s.q('#termsAccept').disabled,true);
  s.input('#termsAge','under13','change');s.q('#termsAgree').click();
  assert.equal(s.q('#termsAccept').disabled,true);
  s.input('#termsAge','teen','change');
  assert.equal(s.q('#termsAccept').disabled,false);
  s.click('#termsAccept');
  assert.equal(s.q('#termsGate').hidden,true);
  assert.equal(s.q('main').inert,false);
  assert.equal(JSON.parse(s.w.localStorage.getItem('oathkeeper-terms-acceptance')).tier,'teen');
  s.click('[data-tab="Messages"]');
  assert.match(s.q('#view').textContent,/Community access unavailable/);
 }finally{await s.close()}
});
test('dice animation is off by default and may be enabled from Settings without changing roll totals',async()=>{
 const s=await shell();try{
  s.click('[data-tab="Settings"]');
  assert.equal(s.q('[data-k="diceAnimation"]').checked,false);
  s.q('[data-k="diceAnimation"]').click();
  assert.equal(s.saved().diceAnimation,true);
  s.click('[data-tab="Dice"]');
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  assert(s.q('.dice-page.roll-animated'));
  assert.equal(s.saved().rollHistory.length,1);
 }finally{await s.close()}
});
test('DM Overview summarizes character abilities and environment',async()=>{
 const s=await shell();try{
  s.click('[data-tab="DM"]');
  assert.match(s.q('#view').textContent,/Player characters & stats/);
  s.click('[data-dm-section="Session"]');
  s.input('[data-dm="environment.location"]','Silverkeep');
  s.click('[data-dm-section="Encounter"]');
  const form=s.q('#dmAdd');
  form.elements.name.value='Ranger';
  form.elements.str.value='16';
  form.elements.dex.value='18';
  form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  s.click('[data-dm-section="Overview"]');
  assert.match(s.q('#view').textContent,/Silverkeep/);
  assert.match(s.q('#view').textContent,/Ranger/);
  assert.match(s.q('#view').textContent,/STR 16/);
  assert.equal(s.saved().dm.combatants[0].dex,18);
 }finally{await s.close()}
});
