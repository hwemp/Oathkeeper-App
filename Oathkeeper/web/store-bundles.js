// Cosmetic bundle offers. These are proposals for a future verified purchase flow:
// nothing in this module grants paid entitlement or initiates payment.
import {SELECTED_DICE} from './store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from './store-background-catalog.js';
export const BUNDLE_OFFERS=Object.freeze([
 Object.freeze({id:'golden-coffer',name:'Golden Coffer',priceCents:500,diceCount:5,backgroundCount:5,productId:'oathkeeper.bundle.golden_coffer',checkoutEnabled:false}),
 Object.freeze({id:'dragons-treasure',name:"Dragon's Treasure",priceCents:1000,diceCount:10,backgroundCount:10,productId:'oathkeeper.bundle.dragons_treasure',checkoutEnabled:false})
]);
export const isBundleOffer=id=>BUNDLE_OFFERS.some(offer=>offer.id===id);
export function normalizeBundleChoices(values,kind){
 const catalog=kind==='dice'?SELECTED_DICE:kind==='backgrounds'?SELECTED_BACKGROUNDS:[];
 const allowed=new Set(catalog.map(item=>item.slug));
 return [...new Set(Array.isArray(values)?values:[])].filter(slug=>allowed.has(slug)).slice(0,5);
}
export function toggleBundleChoice(values,kind,slug){
 const current=normalizeBundleChoices(values,kind);
 const catalog=kind==='dice'?SELECTED_DICE:kind==='backgrounds'?SELECTED_BACKGROUNDS:[];
 if(!catalog.some(item=>item.slug===slug))return current;
 if(current.includes(slug))return current.filter(item=>item!==slug);
 return current.length<5?[...current,slug]:current;
}
