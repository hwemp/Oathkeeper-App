import {SELECTED_DICE} from './store-dice-catalog.js';
import {SELECTED_BACKGROUNDS} from './store-background-catalog.js';

const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function diceArtStyle(index) {
  return '--store-atlas-x:' + (index % 5) * 25 + '%;--store-atlas-y:' + Math.floor(index / 5) * 100 + '%';
}

export function storePage(selectedSlug = 'elvenleaf', previewOpen = false, options = {}) {
  if (options.category === 'backgrounds') return backgroundStorePage(options.backgroundSlug, previewOpen);
  const activeIndex = Math.max(0, SELECTED_DICE.findIndex(x => x.slug === selectedSlug));
  const active = SELECTED_DICE[activeIndex];
  const tiles = SELECTED_DICE.map((item, index) => {
    const selected = index === activeIndex;
    return '<button type="button" class="store-dice-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-dice="' + esc(item.slug) + '" aria-label="Select ' + esc(item.name) + ' dice design"'
      + ' aria-pressed="' + selected + '" style="' + diceArtStyle(item.atlasIndex) + '">'
      + '<span class="store-dice-tile-art" aria-hidden="true"></span>'
      + '<span class="sr-only">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = previewOpen ? '<section class="store-preview-pane" aria-live="polite">'
    + '<div class="store-preview-image" role="img" aria-label="Larger preview of ' + esc(active.name)
    + ' dice" data-store-atlas-index="' + active.atlasIndex + '" style="' + diceArtStyle(active.atlasIndex) + '"></div>'
    + '<div><h3>' + esc(active.name) + '</h3><p>Visual preview only. The default dice roller remains free and unchanged.</p>'
    + '<button type="button" data-store-preview="close">Close preview</button></div></section>' : '';
  return '<section class="store-page" aria-label="Oathkeeper in-app store preview">'
    + '<div class="store-hero" role="img" aria-label="Oathkeeper moonlit fantasy store banner with silver dragons"></div>'
    + '<div class="store-category-row" role="group" aria-label="Store categories">'
    + '<button type="button" data-store-category="dice" class="store-category-current" aria-current="page">Dice Sets</button>'
    + '<button type="button" data-store-category="backgrounds">Backgrounds</button>'
    + '<span class="store-category-upcoming" aria-disabled="true">App Icons</span>'
    + '<span class="store-category-upcoming" aria-disabled="true">Bundles</span></div>'
    + '<h2 class="store-collection-title">Dice Collection <small>(10)</small></h2>'
    + '<div class="store-dice-grid" role="group" aria-label="Select a dice set to preview">' + tiles + '</div>'
    + '<div class="store-selection-footer">'
    + '<p>Tap a dice set to highlight it. <strong>' + esc(active.name)
    + '</strong> selected for preview. No purchases available.</p>'
    + '<button type="button" class="store-preview-button" data-store-preview="open">Preview Dice</button>'
    + '<button type="button" class="store-purchase-disabled" disabled aria-disabled="true">Purchase — disabled</button></div>'
    + preview
    + '<p class="store-note">These ten visual designs are optional cosmetics in preparation. No checkout, payment processing or purchasing is enabled; rolling probability and results are unchanged.</p></section>';
}

// The selected preview uses the same atlas background coordinates as its tile.
// No asynchronous canvas drawing is required, so changing designs cannot show
// the first (Dragonfire) cell while waiting for an image load.

/**
 * Each approved background has a dedicated, locally packaged image. Using
 * real <img> sources for both the tile and its enlarged preview prevents
 * the sprite-position bug previously seen with dice artwork.
 */
function backgroundStorePage(selectedSlug = 'moonlit-citadel', previewOpen = false) {
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
  const preview = previewOpen ? '<section class="store-background-preview-pane" aria-live="polite">'
    + '<div class="store-background-preview-media"><img class="store-background-preview-image"'
    + ' src="' + esc(active.imagePath) + '" alt="' + esc(active.name) + ' fantasy background concept"'
    + ' loading="eager" decoding="async"></div>'
    + '<div class="store-background-preview-details"><h3>' + esc(active.name) + '</h3>'
    + '<p>' + esc(active.description) + '</p>'
    + '<p>Artwork preview only. Applying or purchasing this background is not enabled.</p>'
    + '<button type="button" data-store-preview="close">Close preview</button></div></section>' : '';
  return '<section class="store-page" aria-label="Oathkeeper in-app store preview">'
    + '<div class="store-hero" role="img" aria-label="Oathkeeper moonlit fantasy store banner with silver dragons"></div>'
    + '<div class="store-category-row" role="group" aria-label="Store categories">'
    + '<button type="button" data-store-category="dice">Dice Sets</button>'
    + '<button type="button" data-store-category="backgrounds" class="store-category-current" aria-current="page">Backgrounds</button>'
    + '<span class="store-category-upcoming" aria-disabled="true">App Icons</span>'
    + '<span class="store-category-upcoming" aria-disabled="true">Bundles</span></div>'
    + '<h2 class="store-collection-title">Background Collection <small>(10)</small></h2>'
    + '<div class="store-background-grid" role="group" aria-label="Select a fantasy background to preview">' + tiles + '</div>'
    + '<div class="store-selection-footer"><p>Tap a background image to highlight and preview it. '
    + '<strong>' + esc(active.name) + '</strong> selected. No purchases available.</p>'
    + '<button type="button" class="store-preview-button" data-store-preview="open">Preview Background</button>'
    + '<button type="button" class="store-purchase-disabled" disabled aria-disabled="true">Purchase — disabled</button></div>'
    + preview
    + '<p class="store-note">The ten chosen fantasy backgrounds are preview-only concept art. '
    + 'No checkout, billing, unlocks or wallpaper application are enabled.</p></section>';
}
