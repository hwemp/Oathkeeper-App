import test from 'node:test';
import assert from 'node:assert/strict';
import {stat,readFile} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';
import {SELECTED_DICE} from '../web/store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from '../web/store-background-catalog.js';
import {BUNDLE_OFFERS} from '../web/store-bundles.js';
import {storePage} from '../web/store-ui.js';
test('approved app remains separate from clearly named test app',async()=>{
 const gradle=await readFile(new URL('../android/app/build.gradle',import.meta.url),'utf8');
 assert(gradle.includes('applicationIdSuffix ".test"'));
 assert(gradle.includes('versionNameSuffix "-TEST-158"'));
});
test('Store images are derived directly from exact Build 144 source artwork',async()=>{
 for(const x of SELECTED_APP_ICONS){
  assert.match(x.imagePath,/\/preview-\d{2}\.webp$/);
  assert((await stat(new URL('../web/public'+x.imagePath,import.meta.url))).size>5000);
 }
 for(const x of SELECTED_DICE){
  assert.equal(x.imagePath,'/art/store-dice/'+x.slug+'.webp');
  assert((await stat(new URL('../web/public'+x.imagePath,import.meta.url))).size>100);
  assert(storePage(x.slug).includes('src="'+x.imagePath+'"'));
 }
});
test('golden coffer and dragon treasure offers remain unchanged',()=>{
 assert.deepEqual(BUNDLE_OFFERS.map(x=>[x.id,x.priceCents]),[['golden-coffer',500],['dragons-treasure',1000]]);
});

test('10 approved vector backgrounds render at the correct frame ratio',async()=>{
 assert.equal(SELECTED_BACKGROUNDS.length,10);
 for(const x of SELECTED_BACKGROUNDS){
  assert.match(x.imagePath,/\/store-backgrounds\/[^/]+\.svg$/);
  const svg=await readFile(new URL('../web/public'+x.imagePath,import.meta.url),'utf8');
  assert.match(svg,/width="1600" height="1125"/);
 }
});
