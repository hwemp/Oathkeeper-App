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

test('all ten free icons have distinct previews and native resource IDs',async()=>{
  assert.equal(APP_ICON_STORE_PREVIEW_ONLY,false);
  assert.equal(APP_ICON_STORE_PURCHASES_ENABLED,false);
  assert.equal(APP_ICON_STORE_FREE,true);
  assert.equal(STORE_PRICING.icons.mode,'free');
  assert.deepEqual(APPROVED_FREE_ICON_CONCEPTS.map(x=>x.selection),[1,2,4,5,6,7,8,11,12,14]);
  assert.equal(SELECTED_APP_ICONS.length,10);
  assert.equal(new Set(SELECTED_APP_ICONS.map(x=>x.imagePath)).size,10);
  assert.equal(new Set(SELECTED_APP_ICONS.map(x=>x.iosIconName)).size,10);
  for(const item of SELECTED_APP_ICONS){
    assert.equal(item.price,0);
    assert.equal(item.status,'free');
    assert.equal(item.assetReady,true);
    const file=await readFile(new URL('../web/public'+item.imagePath,import.meta.url));
    assert(file.length>5000);
    assert.equal(file.toString('ascii',0,4),'RIFF');
    assert.equal(file.toString('ascii',8,12),'WEBP');
    const html=storePage('elvenleaf',{category:'icons',iconSlug:item.slug});
    assertOneTapSelection(html,'icons');
    assert.equal((html.match(/data-store-icon=/g)||[]).length,10);
    assert(html.includes('<img class="store-icon-preview-image" src="'+item.imagePath+'"'));
    assert(html.includes('data-store-icon="'+item.slug+'"'));
    assert(html.includes('data-store-apply-icon="'+item.slug+'"'));
    assert.match(html,/Restore Original Icon/);
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
 assert.match(icons,/alternate app icons are <strong>FREE/);
 assert.doesNotMatch(icons,/store-purchase-disabled/);
 assert.match(icons,/data-store-apply-icon=/);
 assert.match(icons,/data-store-restore-icon=/);
 assert.match(storePage(),/Price: <strong>\$1\.00<\/strong> USD \(planned price\)/);
 assert.match(storePage('elvenleaf',{category:'backgrounds'}),/Price: <strong>\$0\.50<\/strong> USD \(planned price\)/);
 assert.match(storePage(),/Purchase<\/button>/);
 assert.match(storePage('elvenleaf',{category:'backgrounds'}),/Purchase<\/button>/);
 assert.doesNotMatch(icons,/>Purchase<\/button>/);
});

test('paid cosmetics never apply before verified ownership, and restore works',()=>{
 for(const [category,slug,key] of [['dice','dragonfire','activeDice'],['backgrounds','moonlit-citadel','activeBackground']]){
  const choice=category==='dice'?SELECTED_DICE[0]:SELECTED_BACKGROUNDS[0];
  const page=storePage(choice.slug,{category,...(category==='dice'?{}:{backgroundSlug:slug})});
  assert(page.includes('data-store-apply-cosmetic="'+category+':'+slug+'" disabled aria-disabled="true"'));
  assert(page.includes('data-store-restore-purchases="true" disabled aria-disabled="true"'));
  const owned=storePage(choice.slug,{category,...(category==='dice'?{}:{backgroundSlug:slug}),ownedIds:[choice.proposedProductId]});
  assert(owned.includes('data-store-apply-cosmetic="'+category+':'+slug+'"'));
  assert(!owned.includes('data-store-apply-cosmetic="'+category+':'+slug+'" disabled'));
  const applied=storePage(choice.slug,{category,...(category==='dice'?{}:{backgroundSlug:slug}),ownedIds:[choice.proposedProductId],[key]:slug});
  assert(applied.includes('data-store-restore-cosmetic="'+category+'"'));
  assert(!applied.includes('data-store-restore-cosmetic="'+category+'" disabled'));
 }
});

test('verified restoration is available independently of checkout, and localized price has no extra USD',()=>{
 const id=SELECTED_DICE[0].proposedProductId;
 const page=storePage('dragonfire',{category:'dice',ownedIds:[id],restoreAvailable:true,products:[{id,displayPrice:'€0,99'}]});
 assert.match(page,/Price: <strong>€0,99<\/strong> \(storefront price\)/);
 assert.match(page,/Restoring existing purchases is available/);
 assert.match(page,/data-store-restore-purchases="true"/);
 assert.doesNotMatch(page,/data-store-restore-purchases="true" disabled/);
 assert.match(page,/store-purchase-disabled" disabled/);
 assert.doesNotMatch(page,/€0,99<\/strong> USD/);
 const unavailable=storePage('dragonfire',{category:'dice'});
 assert.match(unavailable,/data-store-restore-purchases="true" disabled/);
});
