import {SELECTED_DICE} from './store-dice-catalog.js';

const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function diceArtStyle(index) {
  return '--store-atlas-x:' + (index % 5) * 25 + '%;--store-atlas-y:' + Math.floor(index / 5) * 100 + '%';
}

export function storePage(selectedSlug = 'elvenleaf', previewOpen = false) {
  const activeIndex = Math.max(0, SELECTED_DICE.findIndex(x => x.slug === selectedSlug));
  const active = SELECTED_DICE[activeIndex];
  const tiles = SELECTED_DICE.map((item, index) => {
    const selected = index === activeIndex;
    return '<button type="button" class="store-dice-tile' + (selected ? ' selected' : '') + '"'
      + ' data-store-dice="' + esc(item.slug) + '" aria-label="Select ' + esc(item.name) + ' dice design"'
      + ' aria-pressed="' + selected + '" style="' + diceArtStyle(index) + '">'
      + '<span class="store-dice-tile-art" aria-hidden="true"></span>'
      + '<span class="sr-only">' + esc(item.name) + '</span></button>';
  }).join('');
  const preview = previewOpen ? '<section class="store-preview-pane" aria-live="polite">'
    + '<canvas class="store-preview-image" role="img" aria-label="Larger preview of ' + esc(active.name)
    + ' dice" data-store-atlas-index="' + activeIndex + '" width="248" height="175"></canvas>'
    + '<div><h3>' + esc(active.name) + '</h3><p>Visual preview only. The default dice roller remains free and unchanged.</p>'
    + '<button type="button" data-store-preview="close">Close preview</button></div></section>' : '';
  return '<section class="store-page" aria-label="Oathkeeper in-app store preview">'
    + '<div class="store-hero" role="img" aria-label="Oathkeeper moonlit fantasy store banner with silver dragons"></div>'
    + '<div class="store-category-row" role="group" aria-label="Store categories">'
    + '<span class="store-category-current" aria-current="page">Dice Sets</span>'
    + '<span class="store-category-upcoming" aria-disabled="true">Backgrounds</span>'
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

/**
 * Draw the selected atlas tile into a standalone preview canvas.
 * This avoids scaling the entire 5×2 sheet as a background and prevents
 * neighboring dice designs from bleeding into a large mobile preview.
 */
export function mountStorePreview(root = document) {
  const canvas = root.querySelector('.store-preview-image[data-store-atlas-index]');
  if (!canvas) return;
  const index = Number(canvas.dataset.storeAtlasIndex);
  if (!Number.isInteger(index) || index < 0 || index >= SELECTED_DICE.length) return;

  const atlas = new Image();
  atlas.onload = () => {
    if (!canvas.isConnected) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    const cellWidth = atlas.naturalWidth / 5;
    const cellHeight = atlas.naturalHeight / 2;
    // Remove tiny neighboring-card slivers at atlas seams without
    // enlarging or stretching the selected design.
    const insetX = cellWidth * 0.06;
    const insetY = cellHeight * 0.015;
    const cropWidth = cellWidth - 2 * insetX;
    const cropHeight = cellHeight - 2 * insetY;
    const sourceX = (index % 5) * cellWidth + insetX;
    const sourceY = Math.floor(index / 5) * cellHeight + insetY;

    canvas.width = Math.max(1, Math.round(cropWidth));
    canvas.height = Math.max(1, Math.round(cropHeight));
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(atlas, sourceX, sourceY, cropWidth, cropHeight,
      0, 0, canvas.width, canvas.height);
  };
  atlas.src = '/art/oathkeeper-dice-store-atlas.webp';
}
