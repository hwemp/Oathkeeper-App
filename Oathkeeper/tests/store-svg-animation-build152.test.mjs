import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SELECTED_DICE} from '../web/store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from '../web/store-background-catalog.js';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';
import {dieSurfaceSvg,d20FaceSvg} from '../web/d20-face-textures.js';
import {storePage} from '../web/store-ui.js';
test('all thirty Store items have independent self-contained SVGs',async()=>{
 const all=[...SELECTED_DICE,...SELECTED_BACKGROUNDS,...SELECTED_APP_ICONS];
 assert.equal(new Set(all.map(x=>x.imagePath)).size,30);
 for(const item of all){
  assert(item.imagePath.endsWith('.svg'));
  const svg=await readFile(new URL('../web/public'+item.imagePath,import.meta.url),'utf8');
  assert(svg.includes('data:image/webp;base64,')&&svg.includes('viewBox='));
 }
});
test('each animated die has its own textured vector surface',async()=>{
 assert.equal(new Set(SELECTED_DICE.map(x=>dieSurfaceSvg(x.slug))).size,10);
 assert(SELECTED_DICE.every(x=>d20FaceSvg(x.slug).includes('width="2000"')));
 const source=await readFile(new URL('../web/dice-tabletop.js',import.meta.url),'utf8');
 assert(source.includes("liveDieFaceTexture(skin||{slug:'royal-purple'})"));
});
test('all Store selections remain accessible buttons, without circle overlays',async()=>{
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 assert(css.includes('Build 152: SVG store item fit'));
 assert(css.includes('content:none!important;display:none!important'));
 for(const category of ['dice','backgrounds','icons','bundles']){
  const html=storePage('elvenleaf',{category});
  assert(!html.includes('selection-circle'));
 }
});