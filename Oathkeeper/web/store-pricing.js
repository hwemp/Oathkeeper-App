// All amounts are USD cents to avoid floating-point rounding in the store UI.
// Prices are configured locally; platform billing is not enabled.
export const STORE_PRICING = Object.freeze({
 dice:Object.freeze({mode:'paid',currency:'USD',priceCents:100,checkoutEnabled:false,priceConfigured:true}),
 backgrounds:Object.freeze({mode:'paid',currency:'USD',priceCents:50,checkoutEnabled:false,priceConfigured:true}),
 icons:Object.freeze({mode:'free',currency:'USD',priceCents:0,checkoutEnabled:false,priceConfigured:true}),
 bundles:Object.freeze({mode:'paid',currency:'USD',priceCents:null,offers:Object.freeze({goldenCoffer:500,dragonsTreasure:1000}),checkoutEnabled:false,priceConfigured:true})
});
export const formatStorePrice = cents => '$' + (cents/100).toFixed(2);
