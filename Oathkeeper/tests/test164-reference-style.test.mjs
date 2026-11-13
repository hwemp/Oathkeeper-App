import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../web/test164-overrides.css',import.meta.url),'utf8');
test('global 163 gemstones are removed before selective 164 placement',()=>{
 assert.match(css,/:where\(button,a\.button,\[role="button"\]\)::after/);
 assert.match(css,/content:none!important/);
 assert.match(css,/#nav button::before/);
 assert.match(css,/#appMenu \.menu-options button/);
 assert.match(css,/\.store-themed-footer button::after/);
});
test('notification and equipment X are plain with preserved gold border',()=>{
 assert.match(css,/\.notification-bell::before/);
 assert.match(css,/#equipmentEditor \[data-draft-remove\]/);
 assert.match(css,/border:2px solid #cba663/);
});
test('visual master mapping covers 10 animated dice and 10 launcher icons',()=>{
 for(const s of ['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'])
   assert.ok(css.includes('test164-dice/'+s+'.png'));
 for(const n of ['01','02','04','05','06','07','08','11','12','14']){
   assert.ok(css.includes('icon-'+n+'.webp'));
   assert.ok(!css.includes('launcher-'+n+'.webp'), 'no obsolete Store icon alias');
 }
});
