import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { storePage } from '../web/store-ui.js';

test('approved store reference: exact atlas grid, without overscale/crop transforms', async () => {
  const css = await readFile(new URL('../web/fantasy.css', import.meta.url), 'utf8');
  const approved = css.slice(css.indexOf('/* Approved 10 Nov 2026 Oathkeeper store references.'));
  assert(approved.includes('background-size:500% 200%!important'));
  assert.doesNotMatch(approved,/565% 226%|scale\(1\.15\)|translateY\(-5%\)/);
  assert.match(approved,/\.store-background-preview-image\{[\s\S]*?object-fit:contain!important/);
  assert.match(approved,/\.store-icon-preview-image\{[\s\S]*?object-fit:contain!important/);
  assert.match(approved,/\.store-preview-pane,\.store-background-preview-pane,\.store-icon-preview-pane\{[\s\S]*?grid-template-columns:minmax\(0,1fr\)/);
});
test('approved store reference: category artwork and full-size previews', () => {
  for (const category of ['dice','backgrounds','icons','bundles']) {
    const page = storePage('elvenleaf', { category });
    if(category!=='bundles')assert.match(page,/class="store-hero-title"/);else assert.match(page,/bundle-reference-art/);
    assert.match(page,/data-store-category="dice"/);
    assert.match(page,/data-store-category="backgrounds"/);
    assert.match(page,/data-store-category="icons"/);
    assert.match(page,/data-store-category="bundles"/);
    assert.match(page,/class="store-themed-footer/);
    assert.match(page,new RegExp('data-store-build="'+(category==='bundles'?'153':'149')+'"'));
  }
  const backgrounds=storePage('elvenleaf',{category:'backgrounds'});
  assert.match(backgrounds,/style="--store-preview-backdrop:url\(&quot;\/art\/store-backgrounds-hd\/moonlit-citadel.svg&quot;\)"/);
  assert.match(backgrounds,/class="store-background-preview-title">Moonlit Citadel</);
  const icons=storePage('elvenleaf',{category:'icons'});
  assert.match(icons,/App Icons Collection/);
  assert.match(icons,/10 Alternate Icons · All Free/);
});

test('store footer is below all artwork rather than obscuring the preview',async()=>{
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 assert.match(css,/\.store-themed-footer\{[\s\S]*?position:static!important/);
 assert.match(css,/body:has\(\.store-page\)>header/);
 assert.match(css,/body:has\(\.store-page\)>main>#nav/);
 assert.match(css,/\.store-background-preview-media\{[\s\S]*?aspect-ratio:508\/360!important/);
});
