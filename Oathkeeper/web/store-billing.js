import {Capacitor, registerPlugin} from '@capacitor/core';
import {STORE_PRODUCT_IDS,verifiedOwnedIds} from './store-products.js';
import {STORE_PRICING} from './store-pricing.js';

// The bridge is included in native builds now. Checkout remains off until
// store accounts, verified product setup and Android server validation exist.
const plugin = registerPlugin('OathkeeperBilling');
const isInstalled=()=>Capacitor.isNativePlatform() &&
  (Capacitor.getPlatform()==='ios'||Capacitor.getPlatform()==='android');

export async function loadStoreBilling() {
  if(!isInstalled()) return {available:false,reason:'Install the mobile app to make purchases.',ownedIds:[],products:[]};
  try {
    const [catalog,entitlements]=await Promise.all([
      plugin.getProducts({ids:[...STORE_PRODUCT_IDS]}),
      plugin.getEntitlements()
    ]);
    const ownedIds=verifiedOwnedIds(entitlements);
    const products=Array.isArray(catalog?.products)?catalog.products.filter(x=>STORE_PRODUCT_IDS.includes(x.id)):[];
    const checkoutAllowed=STORE_PRICING.dice.checkoutEnabled===true &&
      STORE_PRICING.backgrounds.checkoutEnabled===true &&
      catalog?.ready===true && entitlements?.ready===true;
    return {
      available:checkoutAllowed,
      reason:checkoutAllowed?'':'Checkout is not connected yet.',
      ownedIds,
      products
    };
  }catch(error){
    return {available:false,reason:'App-store billing is not available on this installation.',ownedIds:[],products:[]};
  }
}

export async function restoreStorePurchases(){
  if(!isInstalled()) throw new Error('Restore purchases in the installed Android or iOS app.');
  const response=await plugin.restorePurchases();
  return verifiedOwnedIds(response);
}

export async function buyStoreProduct(productId){
  // Cannot be bypassed through UI state or localStorage. Native verification
  // must be operational before the app is released with checkout enabled.
  if(STORE_PRICING.dice.checkoutEnabled!==true ||
     STORE_PRICING.backgrounds.checkoutEnabled!==true)
    throw new Error('Purchases are not yet enabled.');
  if(!isInstalled() || !STORE_PRODUCT_IDS.includes(productId))
    throw new Error('This purchase is unavailable.');
  const response=await plugin.purchase({productId});
  return verifiedOwnedIds(response);
}
