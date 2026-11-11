import {ABILITIES,EFFECT_TARGETS,EFFECT_OPS,deriveCharacter,powerAtRank,SIZE_MULTIPLIERS,CUSTOM_POWERS} from './rules-engine.js';
const esc=value=>String(value??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
const names={str:'Strength',dex:'Dexterity',con:'Constitution',int:'Intelligence',wis:'Wisdom',cha:'Charisma',
 carry:'Carrying capacity (lb)',load:'Carried weight (lb)',attack:'Attack roll bonus',damage:'Damage roll bonus',healing:'Healing bonus',
 ac:'Armor Class',speed:'Walking speed',hp:'Max HP',save:'Saving throws',spellDC:'Spell save DC',
 damageMultiplier:'Damage total multiplier',healingMultiplier:'Healing total multiplier',diceMultiplier:'Effect dice multiplier'};
const progress=[0,300,900,2700,6500,14000,23000,34000,48000,64000,85000,100000,120000,140000,165000,195000,225000,265000,305000,355000];
const paladinSlots=[[2,0,0,0,0],[2,0,0,0,0],[3,0,0,0,0],[3,0,0,0,0],[4,2,0,0,0],[4,2,0,0,0],[4,3,0,0,0],[4,3,0,0,0],[4,3,2,0,0],[4,3,2,0,0],[4,3,3,0,0],[4,3,3,0,0],[4,3,3,1,0],[4,3,3,1,0],[4,3,3,2,0],[4,3,3,2,0],[4,3,3,3,1],[4,3,3,3,1],[4,3,3,3,2],[4,3,3,3,2]];
export const paladinSlotMaximums=level=>paladinSlots[Math.max(0,Math.min(19,Math.floor(Number(level)||1)-1))].slice();
const label=(name,value)=>'<div class="rule-metric"><span>'+esc(name)+'</span><strong>'+esc(value)+'</strong></div>';
const select=(name,options,value,attrs='')=>'<label>'+name+'<select '+attrs+'>'+options.map(([v,t])=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>';
const options=object=>Object.entries(object).map(([k,v])=>[k,v]);
export function rulesPage(c){
 const d=deriveCharacter(c),used=Math.min(d.paladinLayOnHandsMax,Math.max(0,Math.trunc(Number(c.layOnHandsSpent)||0)));
 const slots=paladinSlotMaximums(c.level);
 const effects=(c.magicEffects||[]).map((e,i)=>'<fieldset class="magic-effect-row"><legend>Effect '+(i+1)+'</legend>'+
 '<label>Inventory item <input data-magic-index="'+i+'" data-magic-key="item" value="'+esc(e.item)+'" maxlength="140" list="inventory-item-names"></label>'+
 '<div class="rules-form-row">'+select('Target',EFFECT_TARGETS.map(k=>[k,names[k]]),e.target,'data-magic-index="'+i+'" data-magic-key="target"')+
 select('Operation',EFFECT_OPS.map(k=>[k,({add:'Add',multiply:'Multiply',minimum:'Minimum'})[k]]),e.op,'data-magic-index="'+i+'" data-magic-key="op"')+
 '<label>Value <input type="number" step="any" min="-1000" max="1000" data-magic-index="'+i+'" data-magic-key="value" value="'+esc(e.value)+'"></label></div>'+
 '<div class="rules-form-row"><label><input type="checkbox" data-magic-index="'+i+'" data-magic-key="enabled" '+(e.enabled?'checked':'')+'> Equipped / active</label>'+
 '<label><input type="checkbox" data-magic-index="'+i+'" data-magic-key="requiresAttunement" '+(e.requiresAttunement?'checked':'')+'> Requires attunement</label>'+
 '<label><input type="checkbox" data-magic-index="'+i+'" data-magic-key="attuned" '+(e.attuned?'checked':'')+'> Attuned</label>'+
 '<button type="button" data-magic-remove="'+i+'">Remove</button></div></fieldset>').join('');
 return '<div class="grid rules-desk"><section class="card full"><h2>Character rules & effects</h2>'+
 '<p>Based on the free 2024 fifth-edition SRD. Your existing Holy Points and homebrew powers remain separate. Changing level updates proficiency and class milestones; it does <strong>not</strong> automatically increase an ability score.</p>'+
 '<div class="rule-metrics">'+[
  label('Level',d.level),label('Proficiency','+'+d.proficiency),label('Attack',d.attack>=0?'+'+d.attack:d.attack),
  label('Armor Class',d.ac),label('Max HP',d.maxHp),label('Carrying capacity',d.capacity+' lb'),
  label('Carried',d.weight+' lb'),label('Extra Attack',d.extraAttack+' attack'+(d.extraAttack>1?'s':'')),
  label('Spell save DC',d.spellDC),label('Strength',d.scores.str+' ('+(d.mods.str>=0?'+':'')+d.mods.str+')')
 ].join('')+'</div>'+
 (d.exceedsCapacity?'<p class="rules-warning" role="alert">Carried weight exceeds carrying capacity. Check size, Strength, storage and equipment.</p>':'')+
 (d.attunementExceeded?'<p class="rules-warning" role="alert">More than three attuned magic items are active. The standard limit is three unless a feature says otherwise.</p>':'')+
 '<div class="rules-form-row">'+select('Creature size',options(SIZE_MULTIPLIERS).map(([k])=>[k,k]),d.size,'data-rules-field="size"')+
 '<label><input type="checkbox" data-rules-field="variantEncumbrance" '+(c.variantEncumbrance?'checked':'')+'> Optional 2014 variant encumbrance</label></div>'+
 (d.encumbrance?'<p>Variant encumbrance: '+(d.encumbrance.heavy?'Heavily encumbered':d.encumbrance.encumbered?'Encumbered':'Not encumbered')+'.</p>':'')+
 '<p><small>For each level gained, enter your new hit-die/base HP total in Overview. Constitution applies to all levels automatically. Ability Score Improvement choices are made in the ability fields; the app will not invent them.</small></p>'+
 '<label>Experience points <input type="number" data-rules-field="xp" min="0" max="20000000" value="'+esc(c.xp||0)+'"></label>'+
 '<p>Next XP milestone: '+(d.level>=20?'Maximum level':progress[d.level].toLocaleString())+'. Class feature selections are confirmed with the DM.</p></section>'+
 '<section class="card full"><h2>Magic items & multipliers</h2><p>An effect activates only if its named item exists in your inventory, is marked equipped/active, and has attunement when required. Missing, removed or zero-quantity items grant no bonus. Effects stack only when your DM permits them.</p>'+
 '<p><small>Example: Gauntlets of Ogre Power → Strength → Minimum → 19, attunement required. For a multiplying homebrew item choose the appropriate multiplier target. A multiplier changes the matching game calculation, not the randomness of the dice faces.</small></p>'+
 '<datalist id="inventory-item-names">'+(c.items||[]).map(i=>'<option value="'+esc(i[0])+'"></option>').join('')+'</datalist>'+
 (effects||'<p>No configured magic-item effects.</p>')+
 '<button data-magic-add type="button">+ Add magic effect</button>'+
 '<p>Active attunements: '+d.activeAttunements.length+' / 3</p></section>'+
 '<section class="card full"><h2>Custom power ranks</h2><p>Your existing powers are homebrew, not automatically 2024 Paladin features. For the three custom roll-based powers below, each selected rank adds one d8 to that power. No rank is increased without your choice.</p>'+
 CUSTOM_POWERS.map((p,i)=>{const v=powerAtRank(c,i);return '<div class="power-rank-row"><strong>'+esc(p.name)+'</strong><span>'+v.notation+' · Rank '+v.rank+'</span><button data-power-rank="'+i+'" data-rank-delta="-1" '+(v.rank<=1?'disabled':'')+' aria-label="Lower rank of '+esc(p.name)+'">−</button><button data-power-rank="'+i+'" data-rank-delta="1" '+(v.rank>=10?'disabled':'')+' aria-label="Raise rank of '+esc(p.name)+'">+</button></div>'}).join('')+
 '<p>Healing adds Charisma and applicable magic modifiers; damage uses configured damage effects. Select a custom power on the Dice page to roll the correct number of dice automatically.</p></section>'+
 '<section class="card full"><h2>Resources & conditions</h2>'+
 (d.paladinLayOnHandsMax?'<p>Official Paladin Lay on Hands pool: <strong>'+(d.paladinLayOnHandsMax-used)+' / '+d.paladinLayOnHandsMax+'</strong> HP available (separate from homebrew Holy Points).</p>'+
 '<form id="layOnHandsForm" class="rules-form-row"><label>Points to spend <input type="number" id="layPoints" min="1" max="'+(d.paladinLayOnHandsMax-used)+'" value="1" required></label><button '+(used>=d.paladinLayOnHandsMax?'disabled':'')+'>Spend pool points</button></form>':'')+
 (String(c.class).toLowerCase().trim()==='paladin'?'<p>Paladin spell slots remaining (mark used slots manually; restore on long rest):</p><div class="rules-form-row">'+slots.map((max,i)=>max?'<label>Level '+(i+1)+' · max '+max+'<input data-spell-slot="'+i+'" type="number" min="0" max="'+max+'" step="1" value="'+Math.min(max,c.spellSlotsUsed?.[i]||0)+'" aria-label="Used level '+(i+1)+' spell slots"></label>':'').join('')+'</div>':'')+
 '<div class="rules-form-row"><label>Exhaustion (0–6)<input data-rules-field="exhaustion" type="number" min="0" max="6" step="1" value="'+esc(c.exhaustion||0)+'"></label>'+
 '<label>Concentration <input data-rules-field="concentration" maxlength="120" value="'+esc(c.concentration||'')+'" placeholder="Spell / effect or blank"></label></div>'+
 '<label>Conditions <input data-rules-field="conditions" maxlength="400" value="'+esc(c.conditions||'')+'" placeholder="e.g. Poisoned, Prone"></label>'+
 '<p>Track death saving throws and other encounter conditions with the DM. Equipment and multipliers update the current summary automatically.</p></section></div>';
}
