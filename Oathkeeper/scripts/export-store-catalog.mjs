import {writeFile,mkdir} from 'node:fs/promises';
import {STORE_PRODUCTS,catalogAudit} from '../web/store-products.js';

catalogAudit();
const output=new URL('../store-catalog/',import.meta.url);
await mkdir(output,{recursive:true});
const rows=[
  ['product_id','reference_name','type','price_usd','category','slug'],
  ...STORE_PRODUCTS.map(item=>[
    item.id,item.name,item.type,(item.priceCents/100).toFixed(2),item.kind,item.slug
  ])
];
const csv=rows.map(fields=>fields.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\n')+'\n';
await writeFile(new URL('products.csv',output),csv);
await writeFile(new URL('products.json',output),JSON.stringify({
 currency:'USD',
 productType:'non_consumable',
 items:STORE_PRODUCTS,
 checkoutEnabled:false,
 note:'Source catalog only; not registered with any payment platform.'
},null,2)+'\n');
console.log('Exported '+STORE_PRODUCTS.length+' approved store products.');
