import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {STORE_PRODUCTS,STORE_PRODUCT_IDS,catalogAudit,productFor,productById,verifiedOwnedIds,ownedItem,effectiveCosmetics} from '../web/store-products.js';
import {SELECTED_DICE} from '../web/store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from '../web/store-background-catalog.js';

test('store has 20 unique restorable paid products with configured USD pricing',()=>{
 assert.equal(catalogAudit(),true);
 assert.equal(STORE_PRODUCT_IDS.length,20);
 assert.equal(new Set(STORE_PRODUCT_IDS).size,20);
 assert.equal(STORE_PRODUCTS.filter(x=>x.kind==='dice').length,10);
 assert.equal(STORE_PRODUCTS.filter(x=>x.kind==='backgrounds').length,10);
 for(const item of STORE_PRODUCTS){
  assert.equal(item.type,'non_consumable');
  assert.equal(item.currency,'USD');
  assert.equal(item.priceCents,item.kind==='dice'?100:50);
  assert.equal(productFor(item.kind,item.slug)?.id,item.id);
  assert.equal(productById(item.id)?.slug,item.slug);
 }
 assert.deepEqual(STORE_PRODUCTS.map(x=>x.name).filter(x=>!x),[]);
});

test('never treat local character flags or unknown products as verified purchases',()=>{
 const owned=STORE_PRODUCTS[0].id;
 assert.deepEqual(verifiedOwnedIds(null),[]);
 assert.deepEqual(verifiedOwnedIds({productIds:[owned]}),[]);
 assert.deepEqual(verifiedOwnedIds({verified:false,productIds:[owned]}),[]);
 assert.deepEqual(verifiedOwnedIds({verified:true,productIds:[owned,owned,'fake.product']}),[owned]);
 assert.equal(ownedItem('dice',STORE_PRODUCTS[0].slug,[]),false);
 assert.equal(effectiveCosmetics({
   activeStoreDice:STORE_PRODUCTS[0].slug,
   activeStoreBackground:SELECTED_BACKGROUNDS[0].slug,
   purchased:[owned],ownedProducts:[owned]
 },[]).dice,null);
 assert.equal(effectiveCosmetics({activeStoreDice:'dragonfire',activeStoreBackground:'moonlit-citadel'},[]).background,null);
});

test('owned paid cosmetics apply only for verified product identifiers',()=>{
 const a=SELECTED_DICE[0],b=SELECTED_BACKGROUNDS[0];
 const saved={activeStoreDice:a.slug,activeStoreBackground:b.slug};
 let applied=effectiveCosmetics(saved,verifiedOwnedIds({verified:true,productIds:[a.proposedProductId]}));
 assert.equal(applied.dice?.slug,a.slug);
 assert.equal(applied.background,null);
 applied=effectiveCosmetics(saved,verifiedOwnedIds({verified:true,productIds:[a.proposedProductId,b.proposedProductId]}));
 assert.equal(applied.background?.slug,b.slug);
 assert.equal(applied.dice?.slug,a.slug);
});

test('billing bridge cannot turn on payments or create receipts from local data',async()=>{
 const billing=await readFile(new URL('../web/store-billing.js',import.meta.url),'utf8');
 assert.match(billing,/STORE_PRICING\.dice\.checkoutEnabled===true/);
 assert.match(billing,/STORE_PRICING\.backgrounds\.checkoutEnabled===true/);
 assert.match(billing,/verifiedOwnedIds\(entitlements\)/);
 assert.match(billing,/plugin\.restorePurchases\(\)/);
 assert.doesNotMatch(billing,/localStorage|setItem\(|fakeReceipt|demoPurchase/);
});
