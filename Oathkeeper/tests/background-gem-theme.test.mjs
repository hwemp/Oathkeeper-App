import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BACKGROUND_GEMS,gemForBackground,selectedBackgroundSlug,updateGemTheme,repairMissingBackgroundPreviews} from '../web/ornate-gem-theme.js';
const css=readFileSync(new URL('../web/ornate-buttons.css',import.meta.url),'utf8');
const catalog=readFileSync(new URL('../web/store-background-catalog.js',import.meta.url),'utf8');
test('all ten backgrounds have intentional and distinct gemstone mappings',()=>{
  assert.equal(Object.keys(BACKGROUND_GEMS).length,10);
  const slugs=[...catalog.matchAll(/"slug": "([^"]+)"/g)].map(m=>m[1]);
  assert.equal(slugs.length,10);
  assert.deepEqual(slugs.sort(),Object.keys(BACKGROUND_GEMS).sort());
  assert.equal(gemForBackground('moonlit-citadel'),'sapphire');
  assert.equal(gemForBackground('dragons-crag'),'ruby');
  assert.equal(gemForBackground('elder-grove'),'emerald');
  assert.equal(gemForBackground('shadow-marsh'),'amethyst');
  assert.equal(gemForBackground('eternal-keep'),'citrine');
  assert.equal(gemForBackground('unknown'),'sapphire');
});
test('every gemstone variant is a vector and is used by the same overlay',()=>{
 for(const gem of new Set(Object.values(BACKGROUND_GEMS))){
   const svg=readFileSync(new URL('../web/public/art/ornate-'+gem+'.svg',import.meta.url),'utf8');
   assert.match(svg,/<svg\b/); assert.match(svg,/<linearGradient/);
   assert.match(css,new RegExp('data-oath-gem-theme="'+gem+'"'));
 }
 assert.match(css,/var\(--oath-button-gem-image\)/);
 assert.match(css,/pointer-events:\s*none/);
 assert.doesNotMatch(css,/\b(?:image-rendering|object-fit|animation)\s*:/);
});
test('previews change gem locally without applying a paid background',()=>{
 let attrs={};
 const applied={
   getAttribute:key=>key==='data-store-paid-background'?'elder-grove':null,
   style:{getPropertyValue:()=>''}
 };
 const btn={getAttribute:key=>key==='data-store-background'?'dragons-crag':null};
 const store={querySelector:selector=>selector.includes('[data-store-background]')?btn:null};
 const doc={
   querySelector:selector=>selector==='.store-page'?store:null,
   body:applied,
   documentElement:{getAttribute:key=>attrs[key],setAttribute:(key,v)=>attrs[key]=v}
 };
 assert.equal(selectedBackgroundSlug(doc),'dragons-crag');
 assert.equal(updateGemTheme(doc),'ruby');
 assert.equal(attrs['data-oath-gem-theme'],'ruby');
 store.querySelector=()=>null;
 assert.equal(updateGemTheme(doc),'emerald'); // after leaving preview, verified applied background wins
});

test('missing frozen preview fallback uses ten original separate SVGs, no raster enlargement',()=>{
 for(const slug of Object.keys(BACKGROUND_GEMS)){
   const svg=readFileSync(new URL('../web/public/art/store-backgrounds/'+slug+'.svg',import.meta.url),'utf8');
   assert.match(svg,/<svg\b/);
 }
 assert.match(repairMissingBackgroundPreviews.toString(),/\.svg/);
});
