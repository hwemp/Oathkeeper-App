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
test('approved Layout B has live gold-border selections, bottom navigation, no checkbox marks and no purchase activation',()=>{
 const html=storePage('elvenleaf',{category:'bundles',bundleDeal:'golden-coffer',bundleDice:SELECTED_DICE.slice(0,5).map(x=>x.slug),bundleBackgrounds:SELECTED_BACKGROUNDS.slice(0,5).map(x=>x.slug)});
 assert.match(html,/data-store-category="bundles" class="store-category-current"/);
 assert.match(html,/Golden Coffer/);
 assert.match(html,/Dragon&#39;s Treasure/);
 assert.match(html,/data-store-bundle-offer="golden-coffer"/);
 assert.match(html,/data-store-bundle-offer="dragons-treasure"/);
 assert.equal((html.match(/data-store-bundle-dice=/g)||[]).length,10);
 assert.equal((html.match(/data-store-bundle-background=/g)||[]).length,10);
 assert.equal((html.match(/class="bundle-pick bundle-dice-pick selected"/g)||[]).length,5);
 assert.equal((html.match(/class="bundle-pick bundle-background-pick selected"/g)||[]).length,5);
 assert.doesNotMatch(html,/type="checkbox"|checkmark|selection-circle|data-store-buy-id=/i);
 assert.match(html,/class="store-themed-footer"/);
 for(const tab of ['Overview','My profile','Community','Messages','Store'])assert.match(html,new RegExp('data-tab="'+tab+'"'));
});
test('full Dragon treasure includes all existing sets without changing the five-pick draft',()=>{
 const html=storePage('dragonfire',{category:'bundles',bundleDeal:'dragons-treasure',bundleDice:['dragonfire'],bundleBackgrounds:['moonlit-citadel']});
 assert.match(html,/All 10 included/);
 assert.equal((html.match(/class="bundle-pick bundle-dice-pick selected"/g)||[]).length,10);
 assert.equal((html.match(/class="bundle-pick bundle-background-pick selected"/g)||[]).length,10);
 assert.equal((html.match(/disabled aria-disabled="true"/g)||[]).length,20);
 assert.doesNotMatch(html,/>Purchase Bundle|>Add to Cart/i);
});
