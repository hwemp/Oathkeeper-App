import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { storePage } from '../web/store-ui.js';
import { SELECTED_DICE } from '../web/store-dice-catalog.js';
import { SELECTED_BACKGROUNDS } from '../web/store-background-catalog.js';
import { SELECTED_APP_ICONS } from '../web/store-icon-catalog.js';

test('Build 151 phone layout gives real artwork more width without cropping', async () => {
  const css = await readFile(new URL('../web/fantasy.css', import.meta.url), 'utf8');
  const fix = css.slice(css.indexOf('/* Build 151: presentation-only repair.'));
  assert(fix.startsWith('/* Build 151:'));
  assert.match(fix, /@media \(max-width:800px\)\{[\s\S]*?repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(fix, /@media \(max-width:360px\)\{[\s\S]*?repeat\(2,minmax\(0,1fr\)\)/);
  for (const cls of ['store-dice-grid', 'store-background-grid', 'store-icon-grid', 'bundle-picker-grid']) {
    assert.equal((fix.match(new RegExp('\\.' + cls + '\\b','g')) || []).length, 2, cls + ' must use both responsive grids');
  }
  assert.match(fix, /\.store-page \.bundle-offer-gem\{[\s\S]*?object-fit:contain/);
  assert.match(fix, /\.store-page \.bundle-background-pick img\{[\s\S]*?object-fit:contain!important/);
  assert.doesNotMatch(fix, /rotate\(|scale\(|translate\(/);
});

test('all ten Store items still display their own approved source images', () => {
  const dice = storePage('elvenleaf', {category:'dice'});
  const backgrounds = storePage('elvenleaf', {category:'backgrounds'});
  const icons = storePage('elvenleaf', {category:'icons'});
  for(const item of SELECTED_DICE) {
    assert(dice.includes('<img class="store-dice-tile-art" src="' + item.imagePath + '"'),item.slug);
  }
  for(const item of SELECTED_BACKGROUNDS) {
    assert(backgrounds.includes('<img class="store-background-tile-art" src="' + item.imagePath + '"'),item.slug);
  }
  for(const item of SELECTED_APP_ICONS) {
    assert(icons.includes('<img class="store-icon-tile-art" src="' + item.imagePath + '"'),item.slug);
  }
});

test('Bundles use the exact approved image rather than composited dice thumbnails',()=>{
 const html=storePage('elvenleaf',{category:'bundles'});
 assert.match(html,/class="bundle-reference-art" src="\/art\/bundles\/approved-bundles-reference.jpg"/);
 assert.doesNotMatch(html,/class="bundle-offer-gem"|class="bundle-dice-art"/);
 assert.equal((html.match(/class="bundle-reference-hotspot bundle-reference-offer/g)||[]).length,2);
 assert.equal((html.match(/class="bundle-reference-hotspot bundle-reference-pick/g)||[]).length,10);
 assert.match(html,/data-store-restore-purchases="true"/);
});
