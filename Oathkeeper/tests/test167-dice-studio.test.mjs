import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('authoritative 3D rolling engine remains byte-for-byte unchanged',()=>{
 const sha=execFileSync('git',['hash-object','web/dice-tabletop.js'],{cwd:root,encoding:'utf8'}).trim();
 assert.equal(sha,'b79543b170783f0fb4bdff1541d73ae6a4014bba');
 const roll=read('../web/dice-tabletop.js');
 assert.match(roll,/export function playTabletopRoll/);
 assert.match(roll,/drawDie\(ctx,die,x,y,size,t,finished,palette,getArtwork/);
 assert.match(roll,/drawD20TexturedFace/);
});

test('fixed-pose studio draws with original face projections and no RNG',()=>{
 const addon=read('../scripts/test167-studio-renderer-addon.mjs');
 assert.match(addon,/drawDie\(ctx,die,124,78,size,1,true,palette,art\)/);
 assert.match(addon,/canvas\.width=logicalWidth\*scale/);
 assert.match(addon,/canvas\.height=logicalHeight\*scale/);
 assert.match(addon,/liveD20Texture\(skin\)/);
 assert.doesNotMatch(addon,/(?:rollDice|Math\.random|secureWord|uniformIndex)\s*\(/);
 const generator=read('../scripts/make-test167-studio-dice.cjs');
 assert.match(generator,/Buffer\.concat\(\[original,Buffer\.from/);
 assert.match(generator,/assert\.equal\(hash\(fs\.readFileSync\(source\)\),shaOriginal/);
 assert.match(generator,/assert\.equal\(data\.length,99\)/);
 assert.match(generator,/path\.join\(output,skin\)/);
 assert.match(generator,/992,700/);
 assert.match(generator,/b\[0\]>24&&b\[1\]>18&&b\[2\]<968&&b\[3\]<682/);
});

test('full Store, bundle and character Dice selection stay wired to one visual master',()=>{
 const css=read('../scripts/apply-test-166.py');
 const banner=read('../web/test166-bundle-overlay.js');
 for(const match of ['.dice-applied-skin','data-store-bundle-dice','data-store-dice','data-die']){
  assert(css.includes(match),'Shared source not referenced for '+match);
 }
 assert.match(banner,/test166-dice\/'\+slug\+'\/d20.png/);
 const workflow=read('../../.github/workflows/build-test-167.yml');
 assert.match(workflow,/branches: \[TEST-BRANCH-167\]/);
 assert.match(workflow,/versionCode 167/);
 assert.match(workflow,/applicationIdSuffix "\.test167"/);
 assert.match(workflow,/make-test167-studio-dice.cjs/);
 assert.match(workflow,/audit-test-167.cjs/);
 assert.match(workflow,/Oathkeeper-TEST-BRANCH-167\.apk/);
});
