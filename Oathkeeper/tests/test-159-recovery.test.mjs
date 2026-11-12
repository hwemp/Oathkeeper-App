import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {storePage} from '../web/store-ui.js';
import {SELECTED_DICE} from '../web/store-dice-catalog.js';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';
import {BUNDLE_OFFERS} from '../web/store-bundles.js';
test('TEST 159 preserves all ten approved Build 144 dice designs and adds skin-matched 3D preview',()=>{
 assert.equal(SELECTED_DICE.length,10);
 for(const die of SELECTED_DICE){
  const page=storePage(die.slug);
  assert.match(page,/id="storeDiceTabletop"/);
  assert.match(page,new RegExp('data-store-dice-demo="'+die.slug+'"'));
  assert.match(page,new RegExp('data-store-preview-roll="'+die.slug+'"'));
  assert.match(page,/Replay 3D Dice Animation/);
  assert.match(page,/data-store-atlas-index=/);
 }
});
test('TEST 159 uses the original 144 art, prices, and user-approved bundle choices',()=>{
 assert(SELECTED_APP_ICONS.every(x=>x.imagePath.endsWith('.webp')&&!x.imagePath.includes('preview-')));
 assert.deepEqual(BUNDLE_OFFERS.map(x=>[x.id,x.priceCents]),[['golden-coffer',500],['dragons-treasure',1000]]);
 const bundle=storePage('elvenleaf',{category:'bundles'});
 assert.match(bundle,/Golden Coffer/);
 assert.match(bundle,/Dragon&#39;s Treasure/);
 assert.match(bundle,/store-themed-footer/);
 assert.doesNotMatch(bundle,/type="checkbox"/);
});
test('TEST 159 animation calls the existing 3D engine and does not touch randomness',async()=>{
 const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(app,/stopStoreDicePreview=playTabletopRoll\(stage,\{sides:20,quantity:1,rolls:\[\{value:20\}\],total:20\},\(\)=>\{\},skin\)/);
 assert.match(app,/if\(tab==='Store'&&storeCategory==='dice'\)previewStoreDiceAnimation\(\)/);
 assert.match(app,/diceAnimationRestoreVersion!==152/);
});
test('TEST 159 package uses isolated Android debug ID',async()=>{
 const gradle=await readFile(new URL('../android/app/build.gradle',import.meta.url),'utf8');
 assert.match(gradle,/versionCode 159/);
 assert.match(gradle,/applicationIdSuffix "\.test159"/);
});
