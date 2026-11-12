import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');

test('all six gold-and-gem plaques have no leafy side decorations',()=>{
 for(const f of ['ornate-nav-163.svg','ornate-nav-sapphire-163.svg','ornate-nav-emerald-163.svg','ornate-nav-ruby-163.svg','ornate-nav-aquamarine-163.svg','ornate-nav-citrine-163.svg']){
  const svg=read('../web/public/art/'+f);
  assert.match(svg,/<svg\b/);
  assert.match(svg,/href="#stone"/);
  assert.doesNotMatch(svg,/(?:id|href)="#?leaf"/);
 }
});

test('equipment number fields support 4 digits with two-column mobile layout',()=>{
 const css=read('../web/test164-overrides.css');
 assert.match(css,/#equipmentEditor \.equipment-table tr/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/#equipmentEditor \.equipment-table td input\[type="number"\]/);
 assert.match(css,/width:100%!important/);
 assert.match(css,/#equipmentEditor input\[data-draft-key="body"\]/);
});

test('Store captures original roller at 4x and crops the die instead of a tiny full-canvas screenshot',()=>{
 const src=read('../scripts/make-test164-dice-previews.cjs');
 assert.match(src,/deviceScaleFactor:4/);
 assert.match(src,/cropWidth/);
 assert.match(src,/frame\.toDataURL\('image\/png'\)/);
 assert.doesNotMatch(src,/canvas\.screenshot\(\{path:output/);
 const css=read('../web/test164-overrides.css');
 assert.match(css,/button\.ok-hit\[data-store-dice\]::before/);
 assert.match(css,/background-size:cover!important/);
});

test('roller meshes, textures and result logic are retained as original',()=>{
 const roller=read('../web/dice-tabletop.js');
 assert.match(roller,/export function playTabletopRoll/);
 assert.match(roller,/drawD20TexturedFace/);
 assert.match(roller,/canvas\.width!==pxW/);
});
