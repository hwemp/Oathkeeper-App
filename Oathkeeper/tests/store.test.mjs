import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {SELECTED_DICE,DICE_STORE_PREVIEW_ONLY,DICE_STORE_PURCHASES_ENABLED} from '../web/store-dice-catalog.js';
import {storePage} from '../web/store-ui.js';
import {SELECTED_BACKGROUNDS,BACKGROUND_STORE_PREVIEW_ONLY,BACKGROUND_STORE_PURCHASES_ENABLED} from '../web/store-background-catalog.js';

test('catalog contains exactly the ten selected skins in display order',()=>{
 assert.deepEqual(SELECTED_DICE.map(x=>x.selection),[1,2,4,5,7,8,11,13,15,17]);
 assert.deepEqual(SELECTED_DICE.map(x=>x.name),['Dragonfire','Frostborne','Elvenleaf','Celestial','Abyssal','Gold-Forged','Necrotic','Astral','Oceanic','Sunfire']);
 assert.deepEqual(SELECTED_DICE.map(x=>x.atlasIndex),[0,1,2,3,4,5,6,7,8,9]);
 assert.equal(new Set(SELECTED_DICE.map(x=>x.proposedProductId)).size,10);
 assert(SELECTED_DICE.every(x=>x.previewFilename==='oathkeeper-dice-store-atlas.webp'));
 assert(SELECTED_DICE.every(x=>x.price===null&&x.status==='preview_only'));
 assert(SELECTED_DICE.every(x=>!('glyph' in x)));
});

test('visual catalog shows ten tappable image cards with no option-number badges or selection circles', async()=>{
 const html=storePage();
 assert.equal((html.match(/data-store-dice=/g)||[]).length,10);
 assert.equal((html.match(/<button type="button" class="store-dice-tile/g)||[]).length,10);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
 assert.doesNotMatch(html,/data-dice-product=|type="radio"|type="checkbox"|selection-badge/);
 assert.match(html,/Dice Collection/);
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/oathkeeper-dice-store-atlas\.webp/);
 const art=await stat(new URL('../web/public/art/oathkeeper-dice-store-atlas.webp',import.meta.url));
 const banner=await stat(new URL('../web/public/art/oathkeeper-store-banner.webp',import.meta.url));
 assert(art.size>30000);
 assert(banner.size>10000);
});

test('selection preview changes without altering roll logic or enabling purchases',()=>{
 assert.equal(DICE_STORE_PREVIEW_ONLY,true);
 assert.equal(DICE_STORE_PURCHASES_ENABLED,false);
 const html=storePage('oceanic',true);
 assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
 assert.match(html,/data-store-dice="oceanic"[^>]*aria-pressed="true"/);
 assert.match(html,/data-store-preview="close"/);
 assert.match(html,/Purchase — disabled/);
 assert.doesNotMatch(html,/data-purchase=|data-checkout=|payment-provider|cashapp|paypal|venmo/i);
});

test('every dice design previews its own atlas cell rather than Dragonfire', async()=>{
 const positions=new Set();
 for(const dice of SELECTED_DICE){
  const html=storePage(dice.slug,true);
  const x=(dice.atlasIndex%5)*25;
  const y=Math.floor(dice.atlasIndex/5)*100;
  const expectedStyle=`--store-atlas-x:${x}%;--store-atlas-y:${y}%`;
  assert.match(html,new RegExp(`data-store-atlas-index="${dice.atlasIndex}" style="${expectedStyle}"`));
  assert.match(html,new RegExp(`Larger preview of ${dice.name} dice`));
  assert.match(html,/class="store-preview-image" role="img"/);
  assert.doesNotMatch(html,/<canvas/);
  positions.add(expectedStyle);
 }
 assert.equal(positions.size,SELECTED_DICE.length);
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 const previewCss=css.match(/\.store-preview-image\{[^}]+\}/g)?.at(-1)||'';
 assert.match(previewCss,/aspect-ratio:248\/175/);
 assert.match(previewCss,/background-color:#0b1023/);
 assert.doesNotMatch(previewCss,/background:#0b1023/);
 const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(app,/c\.storePreviewDice=selected;save\(\);render\(\);return/);
 assert.doesNotMatch(app,/storePreviewOpen=false;save\(\);render\(\)/);
});

test('approved background collection has ten distinct bundled artworks in the selected order', async()=>{
 assert.equal(BACKGROUND_STORE_PREVIEW_ONLY,true);
 assert.equal(BACKGROUND_STORE_PURCHASES_ENABLED,false);
 assert.deepEqual(SELECTED_BACKGROUNDS.map(x=>x.selection),[1,2,3,4,8,9,10,17,19,20]);
 assert.deepEqual(SELECTED_BACKGROUNDS.map(x=>x.name),['Moonlit Citadel','Ancient Ruins','Enchanted Forest','Dragon’s Crag','Shadow Marsh','Celestial Plains','Crystal Caverns','Elder Grove','Mystic Lake','Eternal Keep']);
 assert.equal(new Set(SELECTED_BACKGROUNDS.map(x=>x.slug)).size,10);
 assert.equal(new Set(SELECTED_BACKGROUNDS.map(x=>x.imagePath)).size,10);
 assert(SELECTED_BACKGROUNDS.every(x=>x.status==='preview_only'&&x.price===null));
 for(const background of SELECTED_BACKGROUNDS){
  const file=new URL('../web/public'+background.imagePath,import.meta.url);
  const bytes=await readFile(file);
  assert(bytes.length>10000,background.name+' has its own bundled artwork');
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
 }
});

test('each background opens an image preview with the correct unique source and no dice sprites',()=>{
 for(const background of SELECTED_BACKGROUNDS){
  const html=storePage('elvenleaf',true,{category:'backgrounds',backgroundSlug:background.slug});
  assert.match(html,/Background Collection/);
  assert.equal((html.match(/data-store-background=/g)||[]).length,10);
  assert.equal((html.match(/class="store-background-tile(?: selected)?"/g)||[]).length,10);
  assert.equal((html.match(/aria-pressed="true"/g)||[]).length,1);
  assert(html.includes('data-store-background="'+background.slug+'" aria-pressed="true"'));
  assert(html.includes('<img class="store-background-preview-image" src="'+background.imagePath+'"'));
  assert(html.includes('alt="'+background.name+' fantasy background concept"'));
  assert.doesNotMatch(html,/data-store-atlas-index=|store-atlas-x|store-atlas-y|store-dice-tile/);
  assert.match(html,/data-store-preview="close"/);
  assert.match(html,/data-store-category="dice"/);
  assert.match(html,/data-store-category="backgrounds"/);
  assert.match(html,/Purchase — disabled/);
  assert.doesNotMatch(html,/data-purchase=|data-checkout=|payment-provider|cashapp|paypal|venmo/i);
 }
});

test('store background preview fits image and clicking a tile preserves live preview', async()=>{
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 assert.match(css,/\.store-category-row > span, \.store-category-row > button\{/);
 assert.doesNotMatch(css,/\.store-category-row span, \.store-category-row button\{/);
 const imageRule=css.match(/\.store-background-preview-image\{[^}]+\}/g)?.at(-1)||'';
 assert.match(imageRule,/object-fit:contain/);
 assert.match(imageRule,/object-position:center/);
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(app,/c\.storePreviewBackground=selected;storePreviewOpen=true;save\(\);render\(\);return/);
 assert.match(app,/storeCategory=t\.dataset\.storeCategory;storePreviewOpen=false;render\(\);return/);
 const empty=storePage('elvenleaf',false,{category:'backgrounds',backgroundSlug:'mystic-lake'});
 assert.doesNotMatch(empty,/store-background-preview-image/);
 assert.equal((empty.match(/class="store-background-tile selected"/g)||[]).length,1);
 const dice=storePage('frostborne',true,{category:'dice',backgroundSlug:'mystic-lake'});
 assert.match(dice,/data-store-atlas-index="1"/);
 assert.doesNotMatch(dice,/store-background-tile/);
});
