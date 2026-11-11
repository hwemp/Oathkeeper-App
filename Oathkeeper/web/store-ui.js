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
 const diceChoice=normalizeBundleChoices(options.bundleDice,'dice');
 const bgChoice=normalizeBundleChoices(options.bundleBackgrounds,'backgrounds');
 const promo=BUNDLE_OFFERS.map(offer=>{
  const current=deal===offer.id;
  const isFull=offer.id==='dragons-treasure';
  return '<button type="button" class="bundle-offer '+(isFull?'bundle-offer-treasure':'bundle-offer-coffer')+(current?' selected':'')+'"'
   +' data-store-bundle-offer="'+esc(offer.id)+'" aria-pressed="'+current+'" aria-label="Select '+esc(offer.name)+' bundle for '+formatStorePrice(offer.priceCents)+'">'
   +'<span class="bundle-offer-art" aria-hidden="true"><span class="bundle-offer-gem" style="'+diceArtStyle(isFull?7:3)+'"></span></span>'
   +'<span class="bundle-offer-title">'+esc(offer.name)+'</span>'
   +'<span class="bundle-offer-price">'+formatStorePrice(offer.priceCents)+'</span>'
   +'<span class="bundle-offer-description">'+(isFull?'All 10 dice sets and all 10 backgrounds':'Pick any five dice sets and five backgrounds')+'</span>'
   +'</button>';
 }).join('');
 const diceTiles=SELECTED_DICE.map(item=>{
  const selected=all||diceChoice.includes(item.slug);
  return '<button type="button" class="bundle-pick bundle-dice-pick'+(selected?' selected':'')+'"'
   +' data-store-bundle-dice="'+esc(item.slug)+'" aria-label="'+(all?'Included: ':'Select ')+esc(item.name)+' dice set"'
   +' aria-pressed="'+selected+'"'+(all?' disabled aria-disabled="true"':'')
   +' style="'+diceArtStyle(item.atlasIndex)+'"><img class="bundle-dice-art" src="'+esc(item.imagePath)+'" alt="" loading="lazy" decoding="async">'
   +'<span class="sr-only">'+esc(item.name)+'</span></button>';
 }).join('');
 const backgrounds=SELECTED_BACKGROUNDS.map(item=>{
  const selected=all||bgChoice.includes(item.slug);
  return '<button type="button" class="bundle-pick bundle-background-pick'+(selected?' selected':'')+'"'
   +' data-store-bundle-background="'+esc(item.slug)+'" aria-label="'+(all?'Included: ':'Select ')+esc(item.name)+' background"'
   +' aria-pressed="'+selected+'"'+(all?' disabled aria-disabled="true"':'')+'>'
   +'<img src="'+esc(item.imagePath)+'" alt="" loading="lazy" decoding="async">'
   +'<span class="sr-only">'+esc(item.name)+'</span></button>';
 }).join('');
 const heading=all?'Everything in the collection is included automatically.':'Choose five of each to build your Golden Coffer.';
 const tally=all?'All 10 included':'Selected '+diceChoice.length+' of 5';
 const bgTally=all?'All 10 included':'Selected '+bgChoice.length+' of 5';
 const complete=all||(diceChoice.length===5&&bgChoice.length===5);
 const content='<div class="bundle-offers" role="group" aria-label="Choose a bundle">'+promo+'</div>'
  +'<p class="bundle-instructions" role="status">'+esc(heading)+'</p>'
  +'<section class="bundle-selection-section" aria-label="Dice bundle choices">'
  +'<div class="bundle-section-heading"><h2>Choose your dice sets</h2><span>'+tally+'</span></div>'
  +'<div class="bundle-picker-grid">'+diceTiles+'</div></section>'
  +'<section class="bundle-selection-section" aria-label="Background bundle choices">'
  +'<div class="bundle-section-heading"><h2>Choose your backgrounds</h2><span>'+bgTally+'</span></div>'
  +'<div class="bundle-picker-grid">'+backgrounds+'</div></section>'
  +'<p class="bundle-preview-status" role="status">'+(complete
    ?'Bundle selection ready for review. Checkout will be enabled only after secure billing is configured.'
    :'Choose '+(5-diceChoice.length)+' more dice sets and '+(5-bgChoice.length)+' more backgrounds. Checkout is not yet enabled.')
  +'</p>'
  +'<div class="store-bundle-purchase-actions" role="group" aria-label="Bundle purchase controls">'
  +'<button type="button" class="store-purchase-disabled" disabled aria-disabled="true" title="Checkout is not connected yet">Purchase</button>'
  +'<button type="button" data-store-restore-purchases="true"'+(!options.restoreAvailable?' disabled aria-disabled="true"':'')+'>Restore Purchases</button>'
  +'</div>';
 return storeShell('bundles',content,
  "Bundle pricing is planned: Golden Coffer $5.00 (5 dice sets and 5 backgrounds), Dragon's Treasure $10.00 (all 10 of each). App icons stay free. No purchases are charged or unlocked in this preview.");
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
