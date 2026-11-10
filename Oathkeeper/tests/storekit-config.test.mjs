import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STORE_PRODUCTS} from '../web/store-products.js';
test('local Xcode StoreKit fixture defines all 20 pre-billing non-consumable products',async()=>{
 const config=JSON.parse(await readFile(new URL('../ios/App/LocalStoreProducts.storekit',import.meta.url),'utf8'));
 assert.equal(config.products.length,20);
 assert.equal(new Set(config.products.map(p=>p.productID)).size,20);
 assert.equal(config.subscriptionGroups.length,0);
 for(const product of STORE_PRODUCTS){
  const local=config.products.find(p=>p.productID===product.id);
  assert(local,product.id);
  assert.equal(local.type,'NonConsumable');
  assert.equal(local.displayPrice,(product.priceCents/100).toFixed(2));
  assert.equal(local.familyShareable,false);
 }
});
