import {SELECTED_DICE} from './store-dice-catalog.js';

const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function conceptTile(item){
  return '<div class="store-concept-art" style="--theme-accent:'+item.accent+';--theme-dark:'+item.bg+'" aria-label="'+esc(item.name)+' temporary color study; selected final artwork not yet in APK" role="img">'
  +'<div class="store-concept-die"><span aria-hidden="true">'+esc(item.glyph)+'</span></div></div>';
}

export function storePage(){
  const cards=SELECTED_DICE.map(item=>'<article class="store-dice-card" data-dice-product="'+esc(item.slug)+'">'
    +conceptTile(item)
    +'<div class="store-dice-info"><h3>'+esc(item.name)+'</h3><p>Selected concept #'+item.selection+'. Final artwork pending import.</p>'
    +'<div class="store-dice-actions"><span>Preview only</span><button type="button" disabled aria-disabled="true" aria-label="'+esc(item.name)+' is unavailable for purchase">Not for sale</button></div>'
    +'</div></article>').join('');
  return '<section class="store-page" aria-label="Store"><section class="card store-overview"><h2>Store</h2>'
    +'<p><strong>10 selected dice designs ready for visual review.</strong> This is a concept-only catalog: no prices, payments, or purchases are available.</p>'
    +'<p>The original free dice stay available. Cosmetic themes do not affect random rolls, probabilities, dice results, or saved characters.</p></section>'
    +'<div class="store-dice-grid">'+cards+'</div>'
    +'<p class="store-note">Concept color studies only. The selected reference images are preserved in a separate review package; final production artwork has not been imported.</p></section>';
}
