import test from 'node:test';
import assert from 'node:assert/strict';
import {SELECTED_DICE,DICE_STORE_PREVIEW_ONLY,DICE_STORE_PURCHASES_ENABLED} from '../web/store-dice-catalog.js';
import {storePage} from '../web/store-ui.js';

test('preview catalog contains only the ten approved dice designs',()=>{
 assert.deepEqual(SELECTED_DICE.map(x=>x.selection),[1,2,4,5,7,8,11,13,15,17]);
 assert.deepEqual(SELECTED_DICE.map(x=>x.name),['Dragonfire','Frostborne','Elvenleaf','Celestial','Abyssal','Gold-Forged','Necrotic','Astral','Oceanic','Sunfire']);
 assert.equal(new Set(SELECTED_DICE.map(x=>x.slug)).size,10);
 assert.equal(new Set(SELECTED_DICE.map(x=>x.proposedProductId)).size,10);
 assert.equal(new Set(SELECTED_DICE.map(x=>x.glyph)).size,10);
 assert(SELECTED_DICE.every(x=>x.price===null&&x.status==='art_review_only'));
});

test('store cannot initiate checkout and keeps free dice available',()=>{
 assert.equal(DICE_STORE_PREVIEW_ONLY,true);
 assert.equal(DICE_STORE_PURCHASES_ENABLED,false);
 const html=storePage();
 assert.equal((html.match(/data-dice-product=/g)||[]).length,10);
 assert.equal((html.match(/disabled aria-disabled="true"/g)||[]).length,10);
 assert.doesNotMatch(html,/data-purchase=|data-checkout=|payment-provider|cashapp|paypal|venmo/i);
 assert.match(html,/original free dice stay available/i);
});
