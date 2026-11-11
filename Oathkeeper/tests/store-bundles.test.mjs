import test from 'node:test';
import assert from 'node:assert/strict';
import {BUNDLE_OFFERS,normalizeBundleChoices,toggleBundleChoice} from '../web/store-bundles.js';
import {SELECTED_DICE} from '../web/store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from '../web/store-background-catalog.js';
import {STORE_PRICING} from '../web/store-pricing.js';
import {storePage} from '../web/store-ui.js';

test('bundle offers preserve selected names, exact contents and planned price',()=>{
 assert.deepEqual(BUNDLE_OFFERS.map(x=>[x.id,x.priceCents,x.diceCount,x.backgroundCount]),[
  ['golden-coffer',500,5,5],['dragons-treasure',1000,10,10]
 ]);
 assert.equal(STORE_PRICING.bundles.offers.goldenCoffer,500);
 assert.equal(STORE_PRICING.bundles.offers.dragonsTreasure,1000);
 assert(BUNDLE_OFFERS.every(x=>x.checkoutEnabled===false));
});
test('selection allows exactly five unique valid dice and five valid backgrounds',()=>{
 const d=SELECTED_DICE.map(x=>x.slug),b=SELECTED_BACKGROUNDS.map(x=>x.slug);
 assert.deepEqual(normalizeBundleChoices([...d,'unknown',d[0]],'dice'),d.slice(0,5));
 assert.deepEqual(normalizeBundleChoices([...b,'wrong',b[0]],'backgrounds'),b.slice(0,5));
 assert.deepEqual(toggleBundleChoice(d.slice(0,5),'dice',d[5]),d.slice(0,5));
 assert.deepEqual(toggleBundleChoice(d.slice(0,5),'dice',d[0]),d.slice(1,5));
 assert.deepEqual(toggleBundleChoice(d.slice(0,4),'dice',d[4]),d.slice(0,5));
 assert.deepEqual(toggleBundleChoice(d.slice(0,4),'dice','bad'),d.slice(0,4));
});
test('exact reference has two interactive offers, the original picture, gold-only selections and purchase controls',()=>{
 const html=storePage('elvenleaf',{category:'bundles',bundleDeal:'golden-coffer',bundleDice:['dragonfire'],bundleBackgrounds:['moonlit-citadel']});
 assert.match(html,/data-store-build="153"/);
 assert.match(html,/approved-bundles-reference\.jpg/);
 assert.match(html,/data-store-category="bundles"/);
 assert.match(html,/data-store-bundle-offer="golden-coffer"/);
 assert.match(html,/data-store-bundle-offer="dragons-treasure"/);
 assert.equal((html.match(/class="bundle-reference-hotspot bundle-reference-offer/g)||[]).length,2);
 assert.equal((html.match(/class="bundle-reference-hotspot bundle-reference-pick/g)||[]).length,10);
 assert.match(html,/data-store-bundle-open="dice"/);
 assert.match(html,/data-store-bundle-open="backgrounds"/);
 assert.match(html,/class="store-themed-footer bundle-reference-nav"/);
 assert.match(html,/>Purchase<\/button>/);
 assert.match(html,/data-store-restore-purchases="true" disabled aria-disabled="true"/);
 assert.doesNotMatch(html,/type="checkbox"|checkmark|selection-circle|data-store-buy-id=/i);
 for(const tab of ['Overview','My profile','Community','Messages','Store'])assert.match(html,new RegExp('data-tab="'+tab+'"'));
});
test('Dragon treasure contains all ten designs and offers an accessible gallery without altering reference art',()=>{
 const html=storePage('dragonfire',{category:'bundles',bundleDeal:'dragons-treasure',bundlePickerOpen:'dice'});
 assert.match(html,/data-store-bundle-offer="dragons-treasure" aria-pressed="true"/);
 assert.equal((html.match(/class="bundle-reference-picker-option selected"/g)||[]).length,10);
 assert.match(html,/data-store-bundle-close="true"/);
 assert.match(html,/All ten are included in Dragon/);
 assert.match(html,/approved-bundles-reference\.jpg/);
});
test('bundle restore can become available independently of payment checkout',()=>{
 const html=storePage('elvenleaf',{category:'bundles',restoreAvailable:true});
 assert.match(html,/data-store-restore-purchases="true">Restore Purchases<\/button>/);
 assert.match(html,/class="store-purchase-disabled" disabled aria-disabled="true"/);
});
