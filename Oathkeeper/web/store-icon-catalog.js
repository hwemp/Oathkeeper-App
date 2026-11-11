// Free alternate launcher icons selected from the 20-icon concept board.
// Each icon has its own preview file and a native Apple/Android icon resource.
// The original app launcher icon is never overwritten on disk.
export const APP_ICON_STORE_PREVIEW_ONLY = false;
export const APP_ICON_STORE_PURCHASES_ENABLED = false;
export const APP_ICON_STORE_FREE = true;
const items = [[1,"Moonlit Citadel","moonlit-citadel"],[2,"Ember Dragon","ember-dragon"],[4,"Lionheart Shield","lionheart-shield"],[5,"Shadow Mage","shadow-mage"],[6,"Arcane Chalice","arcane-chalice"],[7,"Astral D20","astral-d20"],[8,"Twin Battleaxes","twin-battleaxes"],[11,"Crystal Spires","crystal-spires"],[12,"Steel Sentinel","steel-sentinel"],[14,"Sapphire Worldtree","sapphire-worldtree"]];
export const APPROVED_FREE_ICON_CONCEPTS = Object.freeze(items.map(([selection,name,slug])=>
 Object.freeze({
  selection,slug:'icon-'+String(selection).padStart(2,'0'),name,
  iosIconName:'AppIcon-'+String(selection).padStart(2,'0'),
  imagePath:'/art/store-icons/store-'+String(selection).padStart(2,'0')+'.svg',
  description:name+' fantasy launcher icon. Free to use.',
  price:0,assetReady:true,status:'free',paymentType:'free'
 })
));
export const SELECTED_APP_ICONS = APPROVED_FREE_ICON_CONCEPTS;
