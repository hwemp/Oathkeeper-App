import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('the approved gold scrollwork and tall diamond-gem shape comes from one frame source',()=>{
 const svg=read('../web/public/art/oath170-button-master.svg');
 assert.match(svg,/viewBox="0 0 420 260"/);
 assert.match(svg,/<use href="#gemstone"/);
 assert.match(svg,/id="flourish"/);
 assert.match(svg,/__THEME__/);
 assert.match(svg,/__GLOW__/);
 const apply=read('../scripts/apply-test170-buttons.py');
 assert.match(apply,/for theme,\(light,mid,dark\) in COLORS.items/);
 assert.match(apply,/for selected in \(False,True\)/);
 assert.match(apply,/ET.fromstring\(svg\)/);
});
test('selected state uses the glowing master; active theme controls gem material',()=>{
 const css=read('../web/test170-reference-buttons.css');
 for(const theme of ['amethyst','sapphire','emerald','ruby','aquamarine','citrine']){
  assert(css.includes('test170-buttons/'+theme+'-normal.svg'));
  assert(css.includes('test170-buttons/'+theme+'-selected.svg'));
 }
 assert.match(css,/aria-current="page"/);
 assert.match(css,/oath170-reference-selected/);
 assert.match(css,/drop-shadow/);
 const theme=read('../web/ornate-gem-theme.js');
 assert.match(theme,/"moonlit-citadel":"amethyst"/);
 assert.match(theme,/return BACKGROUND_GEMS\[key\] \|\| "amethyst"/);
});
test('no duplicate button pseudo ornaments and safe text positioning',()=>{
 const css=read('../web/test170-reference-buttons.css');
 assert.match(css,/button.oath170-reference-button::before/);
 assert.match(css,/display:none!important/);
 assert.match(css,/menu-options button.oath170-reference-button/);
 assert.match(css,/overflow-wrap:normal/);
 assert.match(css,/white-space:normal/);
 assert.match(css,/#journalEditor button.oath170-reference-button/);
});
test('state synchronizer does not modify Store/launcher/dice items or spam DOM mutations',()=>{
 const js=read('../web/test170-button-states.js');
 assert.match(js,/MutationObserver/);
 assert.match(js,/button.classList.contains\('oath170-reference-button'\)/);
 assert.match(js,/button.classList.contains\('oath170-reference-selected'\) !==/);
 assert.match(js,/button.closest\('\.ok-exact-store/);
 assert.match(js,/data-coin-change/);
 assert.match(js,/aria-current/);
});
test('TEST 170 retains approved 169 engine and uses independent Android package',()=>{
 const wf=read('../../.github/workflows/build-test-170.yml');
 assert.match(wf,/branches: \[TEST-BRANCH-170\]/);
 assert.match(wf,/versionCode 170/);
 assert.match(wf,/applicationIdSuffix "\.test170"/);
 assert.match(wf,/python scripts\/apply-test170-buttons.py/);
 assert.match(wf,/node scripts\/audit-test170-reference.cjs/);
 assert.match(wf,/Oathkeeper-TEST-BRANCH-170\.apk/);
 assert.doesNotMatch(wf,/python scripts\/apply-test-168.py/);
});
