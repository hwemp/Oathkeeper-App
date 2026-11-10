import {SELECTED_DICE} from './store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from './store-background-catalog.js';
import {STORE_PRICING} from './store-pricing.js';

// One-time, non-consumable purchases: they must be restorable across devices.
// The payment platforms are the source of truth for ownership. Never use
// localStorage, character imports, or a button's data attributes as receipts.
const items = [
  ...SELECTED_DICE.map(item=>({
    id:item.proposedProductId,
    kind:'dice',
    slug:item.slug,
    name:item.name,
    priceCents:item.priceCents,
    currency:item.currency,
    type:'non_consumable'
  })),
  ...SELECTED_BACKGROUNDS.map(item=>({
    id:item.proposedProductId,
    kind:'backgrounds',
    slug:item.slug,
    name:item.name,
    priceCents:item.priceCents,
    currency:item.currency,
    type:'non_consumable'
  }))
];
export const STORE_PRODUCTS = Object.freeze(items.map(item=>Object.freeze(item)));
export const STORE_PRODUCT_IDS = Object.freeze(STORE_PRODUCTS.map(item=>item.id));
const byId = new Map(STORE_PRODUCTS.map(item=>[item.id,item]));
const byKindAndSlug = new Map(STORE_PRODUCTS.map(item=>[item.kind+':'+item.slug,item]));

export function productFor(kind, slug) {
  return byKindAndSlug.get(kind+':'+slug) || null;
}
export function productById(id) {
  return byId.get(id) || null;
}
export function verifiedOwnedIds(nativeResponse) {
  // Accept only IDs coming from the native verified StoreKit/Play bridge.
  // Caller must never supply a value read from character or localStorage data.
  if (!nativeResponse || nativeResponse.verified !== true ||
      !Array.isArray(nativeResponse.productIds)) return Object.freeze([]);
  return Object.freeze([...new Set(nativeResponse.productIds.filter(id=>byId.has(id)))]);
}
export function ownedItem(kind, slug, verifiedIds) {
  const item=productFor(kind,slug);
  return !!item && verifiedIds.includes(item.id);
}
export function effectiveCosmetics(saved, verifiedIds) {
  const dice=SELECTED_DICE.find(x=>x.slug===saved?.activeStoreDice);
  const background=SELECTED_BACKGROUNDS.find(x=>x.slug===saved?.activeStoreBackground);
  return Object.freeze({
    dice:dice&&ownedItem('dice',dice.slug,verifiedIds)?dice:null,
    background:background&&ownedItem('backgrounds',background.slug,verifiedIds)?background:null
  });
}
export function catalogAudit() {
  if (STORE_PRODUCTS.length!==20 || byId.size!==20 || byKindAndSlug.size!==20)
    throw new Error('The 20 unique purchase products are not configured correctly.');
  for (const item of STORE_PRODUCTS) {
    const expected=STORE_PRICING[item.kind];
    if (!expected || expected.mode!=='paid' || item.priceCents!==expected.priceCents ||
        item.currency!=='USD' || item.type!=='non_consumable')
      throw new Error('Invalid product configuration: '+item.id);
  }
  return true;
}
