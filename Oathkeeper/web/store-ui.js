import {SELECTED_DICE} from './store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from './store-background-catalog.js';
import {SELECTED_APP_ICONS,APPROVED_FREE_ICON_CONCEPTS} from './store-icon-catalog.js';
import {STORE_PRICING,formatStorePrice} from './store-pricing.js';
import {productFor,ownedItem} from './store-products.js';

const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const diceArtStyle = index => '--store-atlas-x:' + (index % 5) * 25 + '%;--store-atlas-y:' + Math.floor(index / 5) * 100 + '%';

function categoryRow(current) {
  return '<div class="store-category-row" role="group" aria-label="Store categories">'
    + [['dice','Dice Sets'],['backgrounds','Backgrounds'],['icons','App Icons']].map(([key,label]) =>
      '<button type="button" data-store-category="' + key + '"'
      + (key === current ? ' class="store-category-current" aria-current="page"' : '')
      + '>' + label + '</button>').join('')
    + '<span class="store-category-upcoming" aria-disabled="true">Bundles</span></div>';
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

function storeShell(category, body, note) {
  return '<section class="store-page" aria-label="Oathkeeper in-app store">'
    + '<div class="store-hero" role="img" aria-label="Oathkeeper moonlit fantasy store banner with silver dragons"></div>'
    + categoryRow(category) + body + '<p class="store-note">' + esc(note) + '</p></section>';
}

export function storePage(selectedSlug = 'elvenleaf', options = {}) {
  if (options.category === 'backgrounds') return backgroundStorePage(options.backgroundSlug,options);
  if (options.category === 'icons') return iconStorePage(options.iconSlug,options.iconStatus);
  const active = SELECTED_DICE.find(item => item.slug === selectedSlug) || SELECTED_DICE[2] || SELECTED_DICE[0];
  const tiles = SELECTED_DICE.map(item => {
    const selected = item.slug === active.slug;
    return '<button type="button" class="store-dice-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-dice="' + esc(item.slug) + '" aria-label="Preview ' + esc(item.name) + ' dice design"'
      + ' aria-pressed="' + selected + '" style="' + diceArtStyle(item.atlasIndex) + '">'
      + '<span class="store-dice-tile-art" aria-hidden="true"></span>'
      + '<span class="sr-only">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = '<section class="store-preview-pane" aria-live="polite" aria-label="Selected dice preview">'
    + '<div class="store-preview-image" role="img" aria-label="Larger preview of ' + esc(active.name)
    + ' dice" data-store-atlas-index="' + active.atlasIndex + '" style="' + diceArtStyle(active.atlasIndex) + '"></div>'
    + '<div><h3>' + esc(active.name) + '</h3><p>Selected dice design. This is a visual preview only; rolling results and odds are unchanged.</p></div></section>';
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
      + '<span class="store-background-name">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = '<section class="store-background-preview-pane" aria-live="polite" aria-label="Selected background preview">'
    + '<div class="store-background-preview-media"><img class="store-background-preview-image"'
    + ' src="' + esc(active.imagePath) + '" alt="' + esc(active.name) + ' fantasy background concept"'
    + ' loading="eager" decoding="async"></div>'
    + '<div class="store-background-preview-details"><h3>' + esc(active.name) + '</h3>'
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
      + '<span class="store-background-name">' + esc(item.name)
      + (item.iosIconName === current ? ' · Applied' : '') + '</span></button>';
  }).join('');
  const preview = '<section class="store-icon-preview-pane" aria-live="polite" aria-label="Selected app icon preview">'
    + '<div class="store-icon-preview-media"><img class="store-icon-preview-image"'
    + ' src="' + esc(active.imagePath) + '" alt="' + esc(active.name) + ' free app icon"'
    + ' loading="eager" decoding="async"></div>'
    + '<div class="store-background-preview-details"><h3>' + esc(active.name) + '</h3>'
    + '<p>' + esc(active.description) + '</p>'
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
    '<h2 class="store-collection-title">Free App Icons <small>(' + SELECTED_APP_ICONS.length + ')</small></h2>'
    + '<div class="store-icon-grid" role="group" aria-label="Select a free app icon to preview">' + tiles + '</div>'
    + preview + actions,
    'All ten approved alternative icons are free. The existing Oathkeeper launcher icon remains the default until you choose another.');
}
