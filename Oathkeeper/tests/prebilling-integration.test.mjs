import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STORE_PRODUCT_IDS} from '../web/store-products.js';
const read=path=>readFile(new URL(path,import.meta.url),'utf8');

test('StoreKit local sandbox matches every approved native store SKU',async()=>{
 const conf=JSON.parse(await read('../ios/App/LocalStoreProducts.storekit'));
 const ids=conf.products.map(p=>p.productID);
 assert.deepEqual([...ids].sort(),[...STORE_PRODUCT_IDS].sort());
 assert(ids.every(id=>/^[a-z0-9][a-z0-9._]{0,39}$/.test(id)));
 assert(conf.products.every(p=>p.type==='NonConsumable'));
});

test('restore is separate from checkout across UI and browser bridge',async()=>{
 const [ui,bridge,app,pricing]=await Promise.all([
  read('../web/store-ui.js'),read('../web/store-billing.js'),
  read('../web/app.js'),read('../web/store-pricing.js')]);
 assert.match(ui,/options\.restoreAvailable/);
 assert.match(app,/restoreAvailable:billingState\.restoreAvailable/);
 assert.match(app,/if\(!billingState\.restoreAvailable\)/);
 assert.match(bridge,/Capacitor\.getPlatform\(\)==='ios'/);
 assert.match(bridge,/verifiedOwnedIds\(response\)/);
 assert.doesNotMatch(bridge,/localStorage\s*\./);
 assert.match(pricing,/checkoutEnabled:false/g);
});

test('pre-billing checkout is blocked on both platforms and never billed by the web page',async()=>{
 const [android,ios,ui]=await Promise.all([
  read('../android/app/src/main/java/com/harrisonwaters/oathkeeper/OathkeeperBillingPlugin.java'),
  read('../ios/App/App/OathkeeperBillingPlugin.swift'),
  read('../web/store-ui.js')]);
 assert.doesNotMatch(android,/launchBillingFlow\s*\(/);
 assert.match(android,/call\.reject\("Google Play checkout is disabled/);
 assert.match(ios,/call\.reject\("Checkout is not enabled yet\."\)/);
 assert.doesNotMatch(ios,/product\.purchase\s*\(/);
 assert.match(ui,/store-purchase-disabled/);
});
