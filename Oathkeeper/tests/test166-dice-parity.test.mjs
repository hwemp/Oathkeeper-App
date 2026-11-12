import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const skins=['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
const sides=[3,4,6,8,10,12,20,50,100];

test('visual references are captured for all ten sets and every selectable die geometry',()=>{
 const generator=read('../scripts/make-test166-dice-previews.cjs');
 assert.match(generator,/sidesList=\[3,4,6,8,10,12,20,50,100\]/);
 assert.match(generator,/for\(const slug of \['default',\.\.\.skins\]\)/);
 assert.match(generator,/deviceScaleFactor:4/);
 assert.match(generator,/el\.getBoundingClientRect\(\)/);
 assert.match(generator,/canvas\.evaluate/);
 assert.match(generator,/frame\.toDataURL\('image\/png'\)/);
 assert.doesNotMatch(generator,/canvas\.screenshot\(\{path:output/);
 for(const s of skins)assert.ok(generator.includes("'"+s+"'"));
 assert.match(generator,/record\.length,99/);
});

test('build-only parity mapping covers store, bundle, D3-D100 selector, and selected cosmetic',()=>{
 const source=read('../scripts/apply-test-166.py');
 assert.match(source,/test166-dice-parity\.css/);
 for(const name of ['data-store-dice','data-store-bundle-dice','data-applied-dice','data-store-atlas-index','data-die'])
  assert.ok(source.includes(name),'Parity script missing '+name);
 for(const n of sides)assert.match(source,new RegExp('(?:^|[^0-9])'+n+'(?:,|\\))'));
 assert.match(source,/pointer-events:none!important/);
});

test('test166 output is isolated from official application and previous test builds',()=>{
 const workflow=read('../../.github/workflows/build-test-166.yml');
 assert.match(workflow,/branches: \[TEST-BRANCH-166\]/);
 assert.match(workflow,/versionCode 166/);
 assert.match(workflow,/applicationIdSuffix "\.test166"/);
 assert.match(workflow,/make-test166-dice-previews/);
 assert.match(workflow,/audit-test-166/);
 assert.match(workflow,/test166-dice-parity\.css/);
 assert.match(workflow,/Oathkeeper-TEST-BRANCH-166\.apk/);
});

test('existing original dice engine source is the unchanged authority',()=>{
 const roller=read('../web/dice-tabletop.js');
 const dice=read('../web/dice.js');
 assert.match(roller,/export function playTabletopRoll/);
 assert.match(roller,/drawD20TexturedFace/);
 assert.match(roller,/imageSmoothingQuality='high'/);
 assert.match(dice,/crypto\.getRandomValues/);
});
