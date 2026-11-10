import { OFFICIAL_DICE, UNOFFICIAL_DICE, diceStatistics } from './dice.js';
const order = [3,4,6,8,10,12,20,50,100];
const number = n => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
const art = (n,face) => `<span class="die-art die-art-${n}" aria-hidden="true" style="--die-x:${order.indexOf(n)%3};--die-y:${Math.floor(order.indexOf(n)/3)}">${face===undefined?'':`<span class="die-face-overlay">${face}</span>`}</span>`;
export function dicePage(state) {
  const list = state.mode === 'official' ? OFFICIAL_DICE : UNOFFICIAL_DICE;
  const s = diceStatistics(state.sides, state.quantity, state.modifier);
  const r = state.result;
  return `<section class="dice-page">
    <h2 class="sr-only">Dice</h2>
    <div class="dice-submenu" role="group" aria-label="Dice rules">
      <button data-dice-mode="official" aria-pressed="${state.mode==='official'}" class="${state.mode==='official'?'selected':''}">Official dice</button>
      <button data-dice-mode="unofficial" aria-pressed="${state.mode==='unofficial'}" class="${state.mode==='unofficial'?'selected':''}">Unofficial dice</button>
    </div>
    <section class="card dice-card"><div class="dice-grid" role="group" aria-label="Choose a die">
      ${list.map(n=>`<button class="die-tile ${state.sides===n?'selected':''} ${state.mode==='official'&&n===100?'percentile-tile':''}" data-die="${n}" aria-label="D${n}${state.mode==='official'&&n===100?' percentile':state.mode==='official'&&n===3?' simulated with D6':''}" aria-pressed="${state.sides===n}"><span class="die-label">D${n}${state.mode==='official'&&n===100?' · Percentile':''}</span>${state.mode==='official'&&n===100?`<span class="percentile-art">${art(10,'00')}${art(10,'0')}<span class="percentile-caption">00 + 0</span></span>`:art(n)}${state.mode==='official'&&n===3?'<small>D6 ÷ 2, rounded up</small>':''}</button>`).join('')}
    </div>${state.mode==='official'?'<p class="dice-note">D100: 00 + 0 = 100. D3 uses a D6, divided by 2 and rounded up.</p>':''}
    <form id="diceForm" class="dice-controls"><label>Quantity<input id="diceQuantity" type="number" min="1" max="100" step="1" required value="${state.quantity}"></label><label>Modifier<input id="diceModifier" type="number" min="-10000" max="10000" step="1" required value="${state.modifier}"></label><button type="submit" class="dice-roll">Roll dice</button></form>
    <div class="dice-result" role="status" aria-live="polite"><span>Result</span><strong class="gold-text">${r?number(r.total):'—'}</strong></div>
    ${r?`<p class="dice-breakdown">${r.rolls.map(x=>number(x.value)).join(' + ')}${r.modifier?' '+(r.modifier>0?'+':'−')+' '+number(Math.abs(r.modifier)):''} = ${number(r.total)}</p>${state.mode==='official'&&r.sides===3?`<p class="dice-note">D6 rolls: ${r.rolls.map(x=>`${x.d6} → ${x.value}`).join(', ')}</p>`:''}${state.mode==='official'&&r.sides===100?`<p class="dice-note">Percentile rolls: ${r.rolls.map(x=>`${String(x.tens).padStart(2,'0')} + ${x.ones} → ${x.value}`).join(', ')}</p>`:''}`:''}
    <p id="diceError" class="dice-error" role="alert"></p>
    <details class="dice-probabilities"><summary>Roll probabilities</summary><p>Each face of D${state.sides}: ${number(s.chance*100)}% per die. Average total: ${number(s.mean)}. Total range: ${number(s.minimum)}–${number(s.maximum)}. Each roll is independent.</p><p>Artwork does not affect the result. Uses your device’s secure random-number generator. Modifiers are added once to the total.</p></details>
    </section></section>`;
}
