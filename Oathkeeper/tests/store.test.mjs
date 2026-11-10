import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {SELECTED_DICE,DICE_STORE_PREVIEW_ONLY,DICE_STORE_PURCHASES_ENABLED} from '../web/store-dice-catalog.js';
import {SELECTED_BACKGROUNDS,BACKGROUND_STORE_PREVIEW_ONLY,BACKGROUND_STORE_PURCHASES_ENABLED} from '../web/store-background-catalog.js';
import {SELECTED_APP_ICONS,APP_ICON_STORE_PREVIEW_ONLY,APP_ICON_STORE_PURCHASES_ENABLED,APP_ICON_STORE_FREE,APPROVED_FREE_ICON_CONCEPTS} from '../web/store-icon-catalog.js';
import {STORE_PRICING,formatStorePrice} from '../web/store-pricing.js';
import {storePage} from '../web/store-ui.js';

function assertOneTapSelection(html, category) {
  assert.equal((html.match(/aria-pressed="true"/g) || []).length,1);
  assert.doesNotMatch(html,/data-store-preview=|store-preview-button|Close preview|Preview Background<\/button>|Preview Dice<\/button>/);
  if(category === 'icons'){
    assert.doesNotMatch(html,/store-purchase-disabled|>Purchase<\/button>/);
    assert.match(html,/class="store-free-label"/);
  }else{
    assert.equal((html.match(/class="store-purchase-disabled"/g)||[]).length,1);
    assert.match(html,/<button type="button" class="store-purchase-disabled" disabled aria-disabled="true"/);
    assert.match(html,/>Purchase<\/button>/);
  }
  assert.doesNotMatch(html,/data-purchase=|data-checkout=|payment-provider|cashapp|paypal|venmo/i);
  assert.match(html,new RegExp('data-store-category="' + category + '" class="store-category-current" aria-current="page"'));
}

test('dice catalog has ten approved items and preview art is packaged', async()=>{
  assert.equal(DICE_STORE_PREVIEW_ONLY,true);
  assert.equal(DICE_STORE_PURCHASES_ENABLED,false);
  assert.deepEqual(SELECTED_DICE.map(x=>x.selection),[1,2,4,5,7,8,11,13,15,17]);
  assert.equal(new Set(SELECTED_DICE.map(x=>x.atlasIndex)).size,10);
  assert.equal(new Set(SELECTED_DICE.map(x=>x.proposedProductId)).size,10);
  assert(SELECTED_DICE.every(x=>x.price===1&&x.priceCents===100&&x.currency==='USD'&&x.status==='preview_only'));
  const art=await stat(new URL('../web/public/art/oathkeeper-dice-store-atlas.webp',import.meta.url));
  const banner=await stat(new URL('../web/public/art/oathkeeper-store-banner.webp',import.meta.url));
  assert(art.size>30000&&banner.size>10000);
});

test('every dice tile automatically shows its own enlarged atlas cell on selection',()=>{
  const uniquePositions=new Set();
  for(const item of SELECTED_DICE){
    const html=storePage(item.slug);
    assertOneTapSelection(html,'dice');
    assert.equal((html.match(/data-store-dice=/g)||[]).length,10);
    assert(html.includes('data-store-dice="'+item.slug+'"'));
    assert(html.includes('aria-label="Larger preview of '+item.name+' dice"'));
    const style='--store-atlas-x:'+((item.atlasIndex%5)*25)+'%;--store-atlas-y:'+(Math.floor(item.atlasIndex/5)*100)+'%';
    assert(html.includes('data-store-atlas-index="'+item.atlasIndex+'" style="'+style+'"'));
    uniquePositions.add(style);
    assert.match(html,/class="store-preview-pane" aria-live="polite"/);
    assert.doesNotMatch(html,/<canvas/);
  }
  assert.equal(uniquePositions.size,10);
});

test('background catalog has ten distinct bundled images with one-tap previews',async()=>{
  assert.equal(BACKGROUND_STORE_PREVIEW_ONLY,true);
  assert.equal(BACKGROUND_STORE_PURCHASES_ENABLED,false);
  assert.deepEqual(SELECTED_BACKGROUNDS.map(x=>x.selection),[1,2,3,4,8,9,10,17,19,20]);
  assert.equal(new Set(SELECTED_BACKGROUNDS.map(x=>x.slug)).size,10);
  assert.equal(new Set(SELECTED_BACKGROUNDS.map(x=>x.imagePath)).size,10);
  assert(SELECTED_BACKGROUNDS.every(x=>x.price===0.5&&x.priceCents===50&&x.currency==='USD'&&x.status==='preview_only'));
  for(const item of SELECTED_BACKGROUNDS){
    const image=await readFile(new URL('../web/public'+item.imagePath,import.meta.url));
    assert(image.length>10000);
    assert.equal(image.toString('ascii',0,4),'RIFF');
    assert.equal(image.toString('ascii',8,12),'WEBP');
    const html=storePage('elvenleaf',{category:'backgrounds',backgroundSlug:item.slug});
    assertOneTapSelection(html,'backgrounds');
    assert.equal((html.match(/data-store-background=/g)||[]).length,10);
    assert(html.includes('<img class="store-background-preview-image" src="'+item.imagePath+'"'));
    assert(html.includes('alt="'+item.name+' fantasy background concept"'));
    assert.doesNotMatch(html,/data-store-atlas-index=|store-atlas-x|store-dice-tile/);
  }
});

test('icon category automatically previews the existing icon without inventing premium variants',async()=>{
  assert.equal(APP_ICON_STORE_PREVIEW_ONLY,true);
  assert.equal(APP_ICON_STORE_PURCHASES_ENABLED,false);
  assert.equal(APP_ICON_STORE_FREE,true);
  assert.deepEqual(APPROVED_FREE_ICON_CONCEPTS.map(x=>x.selection),[1,2,4,5,6,7,8,11,12,14]);
  assert(APPROVED_FREE_ICON_CONCEPTS.every(x=>x.price===0&&!x.assetReady));
  assert.equal(STORE_PRICING.icons.mode,'free');
  assert.equal(SELECTED_APP_ICONS.length,1);
  for(const item of SELECTED_APP_ICONS){
    assert.equal(item.price,0);
    assert.equal(item.proposedProductId,null);
    assert.equal(item.status,'preview_only');
    const image=await readFile(new URL('../web/public'+item.imagePath,import.meta.url));
    assert(image.length>1000);
    assert.equal(image.toString('ascii',0,4),'RIFF');
    const html=storePage('elvenleaf',{category:'icons',iconSlug:item.slug});
    assertOneTapSelection(html,'icons');
    assert.match(html,/class="store-icon-preview-pane" aria-live="polite"/);
    assert(html.includes('<img class="store-icon-preview-image" src="'+item.imagePath+'"'));
    assert(html.includes('data-store-icon="'+item.slug+'"'));
  }
});

test('all categories auto-preview the initial selection without a separate preview button',()=>{
  const dice=storePage();
  const backgrounds=storePage('elvenleaf',{category:'backgrounds'});
  const icons=storePage('elvenleaf',{category:'icons'});
  assert.match(dice,/class="store-preview-pane"/);
  assert.match(backgrounds,/class="store-background-preview-pane"/);
  assert.match(icons,/class="store-icon-preview-pane"/);
  for(const html of [dice,backgrounds,icons]){
    assert.match(html,/data-store-category="dice"/);
    assert.match(html,/data-store-category="backgrounds"/);
    assert.match(html,/data-store-category="icons"/);
    assert.doesNotMatch(html,/data-store-preview=/);
  }
});

test('preview sizing remains centered and selections do not alter dice or purchase logic',async()=>{
  const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
  assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
  assert.match(css,/oathkeeper-dice-store-atlas\.webp/);
  assert.match(css,/\.store-background-preview-image\{[^}]*object-fit:contain;object-position:center;/);
  assert.match(css,/\.store-icon-preview-image\{[^}]*object-fit:contain;object-position:center/);
  const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
  assert.match(app,/c\.storePreviewBackground=selected;save\(\);render\(\);return/);
  assert.match(app,/c\.storePreviewDice=selected;save\(\);render\(\);return/);
  assert.match(app,/c\.storePreviewIcon=selected;save\(\);render\(\);return/);
  assert.doesNotMatch(app,/storePreviewOpen|data\.storePreview/);
});

test('free icon pricing stays separate from paid dice and backgrounds',()=>{
 assert.equal(STORE_PRICING.icons.mode,'free');
 assert.equal(STORE_PRICING.icons.priceCents,0);
 assert.equal(STORE_PRICING.dice.priceCents,100);
 assert.equal(STORE_PRICING.backgrounds.priceCents,50);
 assert.equal(formatStorePrice(STORE_PRICING.dice.priceCents),'$1.00');
 assert.equal(formatStorePrice(STORE_PRICING.backgrounds.priceCents),'$0.50');
 for(const c of ['dice','backgrounds']){
  assert.equal(STORE_PRICING[c].mode,'paid');
  assert.equal(STORE_PRICING[c].checkoutEnabled,false);
  assert.equal(STORE_PRICING[c].priceConfigured,true);
 }
 const icons=storePage('elvenleaf',{category:'icons'});
 assert.match(icons,/App icons are FREE/);
 assert.doesNotMatch(icons,/store-purchase-disabled/);
 assert.match(storePage(),/Price: <strong>\$1\.00<\/strong> USD/);
 assert.match(storePage('elvenleaf',{category:'backgrounds'}),/Price: <strong>\$0\.50<\/strong> USD/);
 assert.match(storePage(),/Purchase<\/button>/);
 assert.match(storePage('elvenleaf',{category:'backgrounds'}),/Purchase<\/button>/);
 assert.doesNotMatch(icons,/>Purchase<\/button>/);
});
