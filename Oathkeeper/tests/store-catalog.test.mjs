import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STORE_PRODUCTS,STORE_PRODUCT_IDS} from '../web/store-products.js';
const load=path=>readFile(new URL(path,import.meta.url),'utf8');

test('shipping store manifests use the same fixed valid SKUs and prices',async()=>{
 const json=JSON.parse(await load('../store-catalog/products.json'));
 const csv=await load('../store-catalog/products.csv');
 assert.equal(json.checkoutEnabled,false);
 assert.equal(json.paymentAccountsConnected,false);
 assert.equal(json.products.length,20);
 assert.deepEqual(json.products.map(x=>x.id),STORE_PRODUCT_IDS);
 assert.equal(csv.trim().split('\n').length,21);
 for(const product of STORE_PRODUCTS){
  const item=json.products.find(x=>x.id===product.id);
  assert.equal(item.priceCents,product.priceCents);
  assert.equal(item.currency,'USD');
  assert.match(product.id,/^[a-z0-9][a-z0-9._]{0,39}$/);
  assert(csv.includes(product.id));
 }
});
