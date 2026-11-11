import {SELECTED_DICE} from './store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from './store-background-catalog.js';
import {SELECTED_APP_ICONS,APPROVED_FREE_ICON_CONCEPTS} from './store-icon-catalog.js';
import {STORE_PRICING,formatStorePrice} from './store-pricing.js';
import {productFor,ownedItem} from './store-products.js';
import {BUNDLE_OFFERS,normalizeBundleChoices,isBundleOffer} from './store-bundles.js';

const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const diceArtStyle = index => '--store-atlas-x:' + (index % 5) * 25 + '%;--store-atlas-y:' + Math.floor(index / 5) * 100 + '%';

const STORE_TAB_GLYPHS = {
  dice:'<svg viewBox="0 0 32 32" aria-hidden="true"><polygon points="16,2 28,9 28,23 16,30 4,23 4,9"/><path d="M4 9 16 16 28 9M16 16V30M16 2V16M4 23 16 16 28 23"/></svg>',
  backgrounds:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M1 27 12 7 23 27ZM15 27 22 13 31 27M5 20h14M10 12l2 4 2-4"/></svg>',
  icons:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m3 12 6 7 7-10 7 10 6-7-3 13H6L3 12ZM6 28h20M4 8h1m11-3h1m10 3h1"/></svg>',
  bundles:'<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M3 12h26v15H3zM2 12 6 5h20l4 7M3 17h26M13 12v6h6v-6M8 22h1m14 0h1"/></svg>'
};
function categoryRow(current) {
  return '<div class="store-category-row" role="group" aria-label="Store categories">'
    + [['dice','Dice Sets'],['backgrounds','Backgrounds'],['icons','App Icons'],['bundles','Bundles']].map(([key,label]) =>
      '<button type="button" data-store-category="' + key + '"'
      + (key === current ? ' class="store-category-current" aria-current="page"' : '')
      + '><span class="store-category-icon" aria-hidden="true">' + STORE_TAB_GLYPHS[key] + '</span>'
      + '<span class="store-category-label">' + label + '</span></button>').join('')
    + '</div>';
}

function selectionFooter(kind, active, category, options={}) {
  if(STORE_PRICING[category].mode === 'free'){
    return '<div class="store-selection-footer"><p><strong>' + esc(active.name)
      + '</strong> selected. App icons are FREE, with no purchase or payment required. '
      + 'Choose an icon to apply it on a supported installed device.</p>'
      + '<span class="store-free-label" aria-label="Free item">FREE</span></div>';
  }
  const owned=ownedItem(category,active.slug,options.ownedIds||[]);
  const applied=(category==='dice'?options.activeDice:options.activeBackground)===active.slug;
  const product=productFor(category,active.slug);
  const actualPrice=options.products?.find(item=>item.id===product.id)?.displayPrice;
  const displayPrice=actualPrice||formatStorePrice(active.priceCents);
  return '<div class="store-selection-footer"><p>Tap a ' + kind
    + ' to preview it instantly. <strong>' + esc(active.name)
    + '</strong> selected. Price: <strong>' + esc(displayPrice)
    + '</strong>' + (actualPrice?' (storefront price). ':' USD (planned price). ') + (owned ? 'Purchased and verified.' :
      'Checkout is not available yet; previewing does not unlock this item.') + '</p>'
    + '<button type="button" class="store-purchase-disabled" disabled aria-disabled="true"'
    + ' title="Paid purchases are not available yet" data-store-buy-id="' + esc(product.id) + '">Purchase</button>'
    + '<div class="store-cosmetic-actions">'
    + '<button type="button" data-store-restore-purchases="true"'
    + (!options.restoreAvailable?' disabled aria-disabled="true"':'')
    + '>Restore Purchases</button>'
    + '<button type="button" data-store-apply-cosmetic="' + esc(category + ':' + active.slug) + '"'
    + (!owned||applied?' disabled aria-disabled="true"':'') + '>'
    + (applied?'Applied':'Apply Owned Design') + '</button>'
    + '<button type="button" data-store-restore-cosmetic="' + esc(category) + '"'
    + (!(category==='dice'?options.activeDice:options.activeBackground)?' disabled aria-disabled="true"':'')
    + '>Restore Default</button></div>'
    + '<p class="store-billing-status" role="status">' + (options.restoreAvailable ? 'Restoring existing purchases is available. New purchases remain disabled.' : 'New purchases are disabled. Restore requires a supported app-store connection.') + '</p>'
    + '</div>';
}


function storeThemeFooter(){
 // These buttons use the same delegated data-tab navigation as the rest of Oathkeeper.
 const tabs=[['Overview','Home','⌂'],['My profile','Character','♜'],['Community','Community','♟'],['Messages','Messages','✉'],['Store','Store','♛']];
 return '<nav class="store-themed-footer" aria-label="Oathkeeper main navigation">'
  +tabs.map(([tab,label,symbol])=>'<button type="button" data-tab="'+esc(tab)+'"'
  +(tab==='Store'?' class="active" aria-current="page"':'')
  +'><span class="store-footer-glyph" aria-hidden="true">'+symbol+'</span><span class="store-footer-label">'+esc(label)+'</span></button>').join('')
  +'</nav>';
}
function storeBundlePage(options={}){
 const deal=isBundleOffer(options.bundleDeal)?options.bundleDeal:'golden-coffer';
 const all=deal==='dragons-treasure';
 const chosenDice=normalizeBundleChoices(options.bundleDice,'dice');
 const chosenBackgrounds=normalizeBundleChoices(options.bundleBackgrounds,'backgrounds');
 const hit=(attrs,label,x,y,w,h,classes,extra='')=>
  '<button type="button" class="'+classes+'" '+attrs+
  ' aria-label="'+esc(label)+'" style="--hot-x:'+x+'%;--hot-y:'+y+
  '%;--hot-w:'+w+'%;--hot-h:'+h+'%"'+extra+
  '><span class="sr-only">'+esc(label)+'</span></button>';
 const categories=[['dice','Dice Sets',4.2,12.7,22.5,4],['backgrounds','Backgrounds',27.3,12.7,24,4],['icons','App Icons',52,12.7,22.5,4],['bundles','Bundles',75.1,12.7,21.1,4]]
  .map(([key,title,x,y,w,h])=>hit('data-store-category="'+key+'"'+(key==='bundles'?' aria-current="page"':''),
     'Open '+title,x,y,w,h,'bundle-reference-hotspot bundle-reference-category'+(key==='bundles'?' store-category-current':''))).join('');
 const offers=[
  ['golden-coffer','Golden Coffer, five dice sets and five backgrounds for $5.00',4.9,17.9,44.3,28.6],
  ['dragons-treasure',"Dragon's Treasure, full collection for $10.00",50.9,17.9,44.4,28.6]
 ].map(([id,label,x,y,w,h])=>hit('data-store-bundle-offer="'+id+'" aria-pressed="'+(deal===id)+'"',
 label,x,y,w,h,'bundle-reference-hotspot bundle-reference-offer'+(deal===id?' selected':''))).join('');
 const visibleDice=[['dragonfire',7.4,51.4,16.6,8.8],['frostborne',25.6,51.4,16.3,8.8],
   ['astral',42.8,51.4,16.3,8.8],['elvenleaf',59.9,51.4,16.3,8.8],['celestial',77,51.4,15.8,8.8]]
  .map(([slug,x,y,w,h])=>hit('data-store-bundle-dice="'+slug+'" aria-pressed="'+(all||chosenDice.includes(slug))+'"'+(all?' disabled aria-disabled="true"':''),
  'Select '+slug+' dice set',x,y,w,h,'bundle-reference-hotspot bundle-reference-pick bundle-reference-dice'+(all||chosenDice.includes(slug)?' selected':''))).join('');
 const visibleBg=[['moonlit-citadel',5.2,65.4,17.1,7.2],['dragons-crag',24.0,65.4,17.3,7.2],
  ['crystal-caverns',42.3,65.4,17.2,7.2],['ancient-ruins',60.8,65.4,17.1,7.2],['shadow-marsh',79.2,65.4,16.7,7.2]]
  .map(([slug,x,y,w,h])=>hit('data-store-bundle-background="'+slug+'" aria-pressed="'+(all||chosenBackgrounds.includes(slug))+'"'+(all?' disabled aria-disabled="true"':''),
  'Select '+slug+' background',x,y,w,h,'bundle-reference-hotspot bundle-reference-pick bundle-reference-background'+(all||chosenBackgrounds.includes(slug)?' selected':''))).join('');
 const tabnames=[['Overview','Home'],['My profile','Character'],['Community','Community'],['Messages','Messages'],['Store','Store']];
 const tabs='<nav class="store-themed-footer bundle-reference-nav" aria-label="Oathkeeper main navigation">'+
  tabnames.map(([tab,name])=>'<button type="button" data-tab="'+esc(tab)+'" aria-label="'+esc(name)+'"'+(tab==='Store'?' aria-current="page"':'')+'><span class="sr-only">'+esc(name)+'</span></button>').join('')+'</nav>';
 const editor=options.bundlePickerOpen==='dice'||options.bundlePickerOpen==='backgrounds'?options.bundlePickerOpen:null;
 const choices=editor==='dice'?SELECTED_DICE:SELECTED_BACKGROUNDS;
 const selection=editor==='dice'?chosenDice:chosenBackgrounds;
 const choiceHTML=editor?
  '<section class="bundle-reference-picker-dialog" aria-label="Choose your '+(editor==='dice'?'dice sets':'backgrounds')+'">'+
  '<div class="bundle-reference-picker-head"><h2>Choose your '+(editor==='dice'?'dice sets':'backgrounds')+'</h2>'+
  '<button type="button" data-store-bundle-close="true" aria-label="Close collection choices">Back to Bundles</button></div>'+
  '<p>'+(all?'All ten are included in Dragon\u2019s Treasure.':'Select five of the ten designs. '+selection.length+' of 5 selected.')+'</p>'+
  '<div class="bundle-reference-picker-grid">'+choices.map(item=>
   '<button type="button" class="bundle-reference-picker-option'+(all||selection.includes(item.slug)?' selected':'')+'"'+
   ' data-store-bundle-'+(editor==='dice'?'dice':'background')+'="'+esc(item.slug)+'" aria-pressed="'+(all||selection.includes(item.slug))+'"'+
   (all?' disabled aria-disabled="true"':'')+'><img src="'+esc(item.imagePath)+'" alt="" loading="lazy" decoding="async">'+
   '<span>'+esc(item.name)+'</span></button>').join('')+'</div></section>':'';
 const complete=all||(chosenDice.length===5&&chosenBackgrounds.length===5);
 const buttons='<div class="store-bundle-purchase-actions bundle-reference-purchase" role="group" aria-label="Bundle payment actions">'+
   '<button type="button" class="store-purchase-disabled" disabled aria-disabled="true" title="'+(complete?'Purchases are not connected yet':'Choose five dice sets and five backgrounds first')+'">Purchase</button>'+
   '<button type="button" data-store-restore-purchases="true"'+(!options.restoreAvailable?' disabled aria-disabled="true"':'')+'>Restore Purchases</button></div>';
 return '<section class="store-page store-bundle-reference-page" data-store-build="153" aria-label="Oathkeeper Bundles">'+
  '<div class="bundle-reference-canvas"><img class="bundle-reference-art" src="/art/bundles/approved-bundles-reference.jpg" width="1024" height="1536"'+
   ' alt="Oathkeeper store with Golden Coffer, Dragon\u2019s Treasure, dice and background choices, ornate gold navigation and purple gemstones" loading="eager" decoding="async">'+
   categories+offers+visibleDice+visibleBg+
   hit('data-store-bundle-open="dice"','View all ten dice sets',24.2,47.6,51.0,3.1,'bundle-reference-hotspot bundle-reference-open')+
   hit('data-store-bundle-open="backgrounds"','View all ten backgrounds',24.7,61.6,52.2,3.1,'bundle-reference-hotspot bundle-reference-open')+
   tabs+'</div>'+buttons+choiceHTML+
   '<p class="sr-only" role="status">Selected '+chosenDice.length+' of five dice sets and '+chosenBackgrounds.length+' of five backgrounds. '+(all?'The full collection is included.':'')+
   ' Paid checkout is unavailable until verified billing is configured.</p></section>';
}

function storeShell(category, body, note) {
  return '<section class="store-page" data-store-build="149" aria-label="Oathkeeper in-app store">'
    + '<div class="store-hero" role="img" aria-label="Oathkeeper in-app store"><span class="store-hero-title" aria-hidden="true">Oathkeeper</span><span class="store-hero-subtitle" aria-hidden="true">In-App Store</span></div>'
    + categoryRow(category) + body + '<p class="store-note">' + esc(note) + '</p>' + storeThemeFooter() + '</section>';
}

export function storePage(selectedSlug = 'elvenleaf', options = {}) {
  if (options.category === 'bundles') return storeBundlePage(options);
  if (options.category === 'backgrounds') return backgroundStorePage(options.backgroundSlug,options);
  if (options.category === 'icons') return iconStorePage(options.iconSlug,options.iconStatus);
  const active = SELECTED_DICE.find(item => item.slug === selectedSlug) || SELECTED_DICE[2] || SELECTED_DICE[0];
  const tiles = SELECTED_DICE.map(item => {
    const selected = item.slug === active.slug;
    return '<button type="button" class="store-dice-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-dice="' + esc(item.slug) + '" aria-label="Preview ' + esc(item.name) + ' dice design"'
      + ' aria-pressed="' + selected + '" style="' + diceArtStyle(item.atlasIndex) + '">'
      + '<img class="store-dice-tile-art" src="' + esc(item.imagePath) + '" alt="" loading="lazy" decoding="async">'
      + '<span class="sr-only">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = '<section class="store-preview-pane" aria-live="polite" aria-label="Selected dice preview">'
    + '<div class="store-preview-image" role="img" aria-label="Larger preview of ' + esc(active.name)
    + ' dice" data-store-atlas-index="' + active.atlasIndex + '" style="' + diceArtStyle(active.atlasIndex) + '"><img class="store-dice-preview-art" src="' + esc(active.imagePath) + '" alt="" loading="eager" decoding="async"></div>'
    + '<div class="store-preview-description"><p>Selected dice design. Animated samples never affect real character rolls or probabilities.</p></div>'
    + '<div class="store-dice-demo" aria-label="Animated dice design demonstration">'
    + '<div class="dice-tabletop" id="storeDiceTabletop" data-store-dice-demo="' + esc(active.slug) + '"><canvas aria-hidden="true"></canvas><p data-dice-landed hidden aria-live="polite"></p></div>'
    + '<button type="button" class="store-dice-replay" data-store-preview-roll="' + esc(active.slug) + '">Replay 3D Dice Animation</button>'
    + '<p class="store-dice-demo-note">Visual demonstration only · Sample D20, not a game roll · No purchase required to preview</p></div></section>';
  return storeShell('dice',
    '<h2 class="store-collection-title">Dice Collection <small>(' + SELECTED_DICE.length + ')</small></h2>'
    + '<div class="store-dice-grid" role="group" aria-label="Select a dice set to preview">' + tiles + '</div>'
    + preview + selectionFooter('dice set', active, 'dice', options),
    'Dice designs are $1.00 each (USD). Checkout is not yet connected; previewing is free.');
}

function backgroundStorePage(selectedSlug = 'moonlit-citadel', options={}) {
  const active = SELECTED_BACKGROUNDS.find(item => item.slug === selectedSlug) || SELECTED_BACKGROUNDS[0];
  const tiles = SELECTED_BACKGROUNDS.map(item => {
    const selected = item.slug === active.slug;
    return '<button type="button" class="store-background-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-background="' + esc(item.slug) + '" aria-pressed="' + selected + '"'
      + ' aria-label="Preview ' + esc(item.name) + ' background">'
      + '<img class="store-background-tile-art" src="' + esc(item.imagePath) + '"'
      + ' alt="" loading="lazy" decoding="async">'
      + '<span class="sr-only">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = '<section class="store-background-preview-pane" aria-live="polite" aria-label="Selected background preview">'
    + '<div class="store-background-preview-media" style="--store-preview-backdrop:url(&quot;' + esc(active.imagePath) + '&quot;)"><img class="store-background-preview-image"'
    + ' src="' + esc(active.imagePath) + '" alt="' + esc(active.name) + ' fantasy background concept"'
    + ' loading="eager" decoding="async"></div>'
    + '<div class="store-background-preview-details">'
    + '<div class="store-background-preview-title">' + esc(active.name) + '</div>'
    + '<p>' + esc(active.description) + '</p>'
    + '<p>Preview is free. Applying this background requires verified ownership.</p></div></section>';
  return storeShell('backgrounds',
    '<h2 class="store-collection-title">Background Collection <small>(' + SELECTED_BACKGROUNDS.length + ')</small></h2>'
    + '<div class="store-background-grid" role="group" aria-label="Select a fantasy background to preview">' + tiles + '</div>'
    + preview + selectionFooter('background', active, 'backgrounds', options),
    'Backgrounds are $0.50 each (USD). Checkout is not yet connected; previewing is free.');
}

function iconStorePage(selectedSlug = 'icon-01', iconStatus = {supported:false,currentIcon:'default'}) {
  const active = SELECTED_APP_ICONS.find(item => item.slug === selectedSlug) || SELECTED_APP_ICONS[0];
  const supported=iconStatus?.supported===true;
  const current=iconStatus?.currentIcon || 'default';
  const applied = current === active.iosIconName;
  const tiles = SELECTED_APP_ICONS.map(item => {
    const selected = item.slug === active.slug;
    return '<button type="button" class="store-icon-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-icon="' + esc(item.slug) + '" aria-pressed="' + selected + '"'
      + ' aria-label="Preview free ' + esc(item.name) + ' app icon">'
      + '<img class="store-icon-tile-art" src="' + esc(item.imagePath) + '"'
      + ' alt="" loading="lazy" decoding="async">'
      + '<span class="sr-only">' + esc(item.name)
      + (item.iosIconName === current ? ' · Applied' : '') + '</span></button>';
  }).join('');
  const preview = '<section class="store-icon-preview-pane" aria-live="polite" aria-label="Selected app icon preview">'
    + '<div class="store-icon-preview-media"><img class="store-icon-preview-image"'
    + ' src="' + esc(active.imagePath) + '" alt="' + esc(active.name) + ' free app icon"'
    + ' loading="eager" decoding="async"></div>'
    + '<div class="store-background-preview-details"><p>Original SVG design — exact source artwork for your chosen launcher icon.</p>'
    + '<div class="store-native-launcher-preview"><img src="' + esc(active.launcherPreviewPath) + '"'
    + ' alt="Android circular launcher rendering of ' + esc(active.name) + '" loading="eager" decoding="async">'
    + '<span>Android launcher preview. Your phone may apply a different adaptive icon mask.</span></div>'
    + '<p>' + (applied ? 'This icon is currently applied.' : 'Apply this free design as your home-screen app icon.') + '</p></div></section>';
  const actions = '<div class="store-selection-footer store-icon-actions">'
    + '<p>All ten alternate app icons are <strong>FREE</strong>, and the original stays available. '
    + (supported ? 'Choose Apply Icon to update your home screen.' :
        'Install Oathkeeper on Android or iOS to apply a launcher icon.') + '</p>'
    + '<span class="store-free-label" aria-label="Free item">FREE</span>'
    + '<div class="store-icon-action-buttons">'
    + '<button type="button" data-store-apply-icon="' + esc(active.slug) + '"'
    + (!supported || applied ? ' disabled aria-disabled="true"' : '')
    + ' class="store-apply-button">' + (applied ? 'Icon Applied' : 'Apply Icon · FREE') + '</button>'
    + '<button type="button" data-store-restore-icon="default"'
    + (!supported || current === 'default' ? ' disabled aria-disabled="true"' : '')
    + ' class="store-restore-button">Restore Original Icon</button></div></div>';
  return storeShell('icons',
    '<h2 class="store-collection-title">App Icons Collection</h2><p class="store-collection-kicker">10 Alternate Icons · All Free</p>'
    + '<div class="store-icon-grid" role="group" aria-label="Select a free app icon to preview">' + tiles + '</div>'
    + preview + actions,
    'All ten approved alternative icons are free. The existing Oathkeeper launcher icon remains the default until you choose another.');
}
