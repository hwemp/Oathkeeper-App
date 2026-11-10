import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STORE_PRODUCT_IDS,catalogAudit} from '../web/store-products.js';
import {SELECTED_DICE} from '../web/store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from '../web/store-background-catalog.js';

const native=async path=>readFile(new URL(path,import.meta.url),'utf8');
const nativeIds=source=>[...source.matchAll(/"(oathkeeper\.(?:dice|background)\.[a-z0-9._-]+)"/g)].map(x=>x[1]).sort();

test('all 20 planned one-time product IDs comply with Google Play restrictions',()=>{
 assert.equal(catalogAudit(),true);
 assert.equal(STORE_PRODUCT_IDS.length,20);
 assert.equal(new Set(STORE_PRODUCT_IDS).size,20);
 for (const id of STORE_PRODUCT_IDS) {
  assert.match(id,/^[a-z0-9][a-z0-9._]{0,39}$/);
  assert(!id.startsWith('android.test'));
 }
 assert(SELECTED_DICE.every(x=>STORE_PRODUCT_IDS.includes(x.proposedProductId)));
 assert(SELECTED_BACKGROUNDS.every(x=>STORE_PRODUCT_IDS.includes(x.proposedProductId)));
});

test('Android and iOS native allowlists exactly match the web store catalog',async()=>{
 const [android,ios]=await Promise.all([
  native('../android/app/src/main/java/com/harrisonwaters/oathkeeper/OathkeeperBillingPlugin.java'),
  native('../ios/App/App/OathkeeperBillingPlugin.swift')
 ]);
 const expected=[...STORE_PRODUCT_IDS].sort();
 assert.deepEqual(nativeIds(android),expected);
 assert.deepEqual(nativeIds(ios),expected);
});

test('no native checkout can charge before billing is configured',async()=>{
 const android=await native('../android/app/src/main/java/com/harrisonwaters/oathkeeper/OathkeeperBillingPlugin.java');
 const ios=await native('../ios/App/App/OathkeeperBillingPlugin.swift');
 const web=await native('../web/store-pricing.js');
 assert.match(android,/checkout is disabled until secure purchase verification/i);
 assert.doesNotMatch(android,/launchBillingFlow\s*\(/);
 assert.match(ios,/call\.reject\("Checkout is not enabled yet\."\)/);
 assert.doesNotMatch(ios,/product\.purchase\s*\(/);
 assert.match(web,/checkoutEnabled:false/g);
});

test('draft listing uses same fixed SKUs and prices; icon items stay free',async()=>{
 const data=JSON.parse(await native('../store/paid-cosmetics-draft.json'));
 assert.equal(data.checkoutEnabled,false);
 assert.deepEqual(data.products.map(x=>x.id).sort(),[...STORE_PRODUCT_IDS].sort());
 assert.equal(data.products.length,20);
 assert(data.products.every(x=>x.type==='non_consumable' && x.currency==='USD'));
 assert.equal(data.products.filter(x=>x.kind==='dice'&&x.priceCents===100).length,10);
 assert.equal(data.products.filter(x=>x.kind==='backgrounds'&&x.priceCents===50).length,10);
 assert.equal(data.freeIcons.length,10);
 assert(data.freeIcons.every(x=>x.priceCents===0));
});
