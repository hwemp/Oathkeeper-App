import {SELECTED_DICE} from './store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from './store-background-catalog.js';
import {SELECTED_APP_ICONS} from './store-icon-catalog.js';

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

function selectionFooter(kind, active) {
  return '<div class="store-selection-footer"><p>Tap a ' + kind
    + ' to preview it instantly. <strong>' + esc(active.name)
    + '</strong> selected. Purchases are not available yet.</p>'
    + '<button type="button" class="store-purchase-disabled" disabled aria-disabled="true"'
    + ' title="Purchases are not available yet">Purchase</button></div>';
}

function storeShell(category, body, note) {
  return '<section class="store-page" aria-label="Oathkeeper in-app store">'
    + '<div class="store-hero" role="img" aria-label="Oathkeeper moonlit fantasy store banner with silver dragons"></div>'
    + categoryRow(category) + body + '<p class="store-note">' + esc(note) + '</p></section>';
}

export function storePage(selectedSlug = 'elvenleaf', options = {}) {
  if (options.category === 'backgrounds') return backgroundStorePage(options.backgroundSlug);
  if (options.category === 'icons') return iconStorePage(options.iconSlug);
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
    + preview + selectionFooter('dice set', active),
    'These dice designs are optional cosmetic concepts. Checkout and purchasing are not yet enabled.');
}

function backgroundStorePage(selectedSlug = 'moonlit-citadel') {
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
    + '<p>Artwork preview only. The background is not applied to your app.</p></div></section>';
  return storeShell('backgrounds',
    '<h2 class="store-collection-title">Background Collection <small>(' + SELECTED_BACKGROUNDS.length + ')</small></h2>'
    + '<div class="store-background-grid" role="group" aria-label="Select a fantasy background to preview">' + tiles + '</div>'
    + preview + selectionFooter('background', active),
    'These background designs are preview-only concept art. No checkout, unlocks or wallpaper application are enabled.');
}

function iconStorePage(selectedSlug = 'arcane-chronicle') {
  const active = SELECTED_APP_ICONS.find(item => item.slug === selectedSlug) || SELECTED_APP_ICONS[0];
  const tiles = SELECTED_APP_ICONS.map(item => {
    const selected = item.slug === active.slug;
    return '<button type="button" class="store-icon-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-icon="' + esc(item.slug) + '" aria-pressed="' + selected + '"'
      + ' aria-label="Preview ' + esc(item.name) + ' app icon">'
      + '<img class="store-icon-tile-art" src="' + esc(item.imagePath) + '"'
      + ' alt="" loading="lazy" decoding="async">'
      + '<span class="store-background-name">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = '<section class="store-icon-preview-pane" aria-live="polite" aria-label="Selected app icon preview">'
    + '<div class="store-icon-preview-media"><img class="store-icon-preview-image"'
    + ' src="' + esc(active.imagePath) + '" alt="' + esc(active.name) + ' app icon concept"'
    + ' loading="eager" decoding="async"></div>'
    + '<div class="store-background-preview-details"><h3>' + esc(active.name) + '</h3>'
    + '<p>' + esc(active.description) + '</p>'
    + '<p>Preview only. This does not change your phone’s installed app icon.</p></div></section>';
  return storeShell('icons',
    '<h2 class="store-collection-title">App Icons <small>(' + SELECTED_APP_ICONS.length + ')</small></h2>'
    + '<div class="store-icon-grid" role="group" aria-label="Select an app icon to preview">' + tiles + '</div>'
    + preview + selectionFooter('app icon', active),
    'Only the existing Oathkeeper icon is available to preview. Additional icon designs await approval; purchasing and applying icons are disabled.');
}
