import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {SELECTED_DICE,DICE_STORE_PREVIEW_ONLY,DICE_STORE_PURCHASES_ENABLED} from '../web/store-dice-catalog.js';
import {storePage} from '../web/store-ui.js';

test('catalog contains exactly the ten selected skins in display order',()=>{
 assert.deepEqual(SELECTED_DICE.map(x=>x.selection),[1,2,4,5,7,8,11,13,15,17]);
 assert.deepEqual(SELECTED_DICE.map(x=>x.name),['Dragonfire','Frostborne','Elvenleaf','Celestial','Abyssal','Gold-Forged','Necrotic','Astral','Oceanic','Sunfire']);
 assert.deepEqual(SELECTED_DICE.map(x=>x.atlasIndex),[0,1,2,3,4,5,6,7,8,9]);
 assert.equal(new Set(SELECTED_DICE.map(x=>x.proposedProductId)).size,10);
 assert(SELECTED_DICE.every(x=>x.previewFilename==='oathkeeper-dice-store-atlas.webp'));
 assert(SELECTED_DICE.every(x=>x.price===null&&x.status==='preview_only'));
 assert(SELECTED_DICE.every(x=>!('glyph' in x)));
});

test('visual catalog shows ten tappable image cards with no option-number badges or selection circles', async()=>{
 const html=storePage();
 assert.equal((html.match(/data-store-dice=/g)||[]).length,10);
 assert.equal((html.match(/<button type="button" class="store-dice-tile/g)||[]).length,10);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
 assert.doesNotMatch(html,/data-dice-product=|type="radio"|type="checkbox"|selection-badge/);
 assert.match(html,/Dice Collection/);
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/oathkeeper-dice-store-atlas\.webp/);
 const art=await stat(new URL('../web/public/art/oathkeeper-dice-store-atlas.webp',import.meta.url));
 const banner=await stat(new URL('../web/public/art/oathkeeper-store-banner.webp',import.meta.url));
 assert(art.size>30000);
 assert(banner.size>10000);
});

test('selection preview changes without altering roll logic or enabling purchases',()=>{
 assert.equal(DICE_STORE_PREVIEW_ONLY,true);
 assert.equal(DICE_STORE_PURCHASES_ENABLED,false);
 const html=storePage('oceanic',true);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(html,/data-store-dice="oceanic"[^>]*aria-pressed="true"/);
 assert.match(html,/data-store-preview="close"/);
 assert.match(html,/Purchase — disabled/);
 assert.doesNotMatch(html,/data-purchase=|data-checkout=|payment-provider|cashapp|paypal|venmo/i);
});
