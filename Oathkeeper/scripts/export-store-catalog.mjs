import {writeFile,mkdir} from 'node:fs/promises';
import {STORE_PRODUCTS,catalogAudit} from '../web/store-products.js';

// An import-ready planning reference, not a payment-platform registration.
// IDs, amounts and platform allowlists must remain identical.
catalogAudit();
const output=new URL('../store-catalog/',import.meta.url);
await mkdir(output,{recursive:true});
const items=STORE_PRODUCTS.map(item=>({
 id:item.id,slug:item.slug,name:item.name,kind:item.kind,
 priceCents:item.priceCents,currency:item.currency,type:item.type
}));
const quote=value=>{
 const raw=String(value);
 return /[",\r\n]/.test(raw)?'"'+raw.replaceAll('"','""')+'"':raw;
};
const rows=[
 ['product_id','reference_name','type','price_usd','category','slug'],
 ...items.map(item=>[item.id,item.name,item.type,
   (item.priceCents/100).toFixed(2),item.kind,item.slug])
];
await writeFile(new URL('products.csv',output),
 rows.map(fields=>fields.map(quote).join(',')).join('\n')+'\n');
await writeFile(new URL('products.json',output),JSON.stringify({
 currency:'USD',products:items,checkoutEnabled:false,paymentAccountsConnected:false
},null,2)+'\n');
console.log('Prepared '+items.length+' one-time product SKUs (no checkout enabled).');
