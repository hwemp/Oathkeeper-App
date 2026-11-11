// Oathkeeper derived character rules: SRD 5.2.1 baseline with opt-in homebrew.
export const ABILITIES=Object.freeze(['str','dex','con','int','wis','cha']);
export const EFFECT_TARGETS=Object.freeze(['str','dex','con','int','wis','cha','carry','load','attack','damage','healing','ac','speed','hp','save','spellDC','damageMultiplier','healingMultiplier','diceMultiplier']);
export const EFFECT_OPS=Object.freeze(['add','multiply','minimum']);
export const SIZE_MULTIPLIERS=Object.freeze({Tiny:.5,Small:1,Medium:1,Large:2,Huge:4,Gargantuan:8});
export const CUSTOM_POWERS=Object.freeze([
 {name:'Divine Smite',baseDice:1,sides:8,kind:'damage'},
 {name:'Banishing Smite',baseDice:2,sides:8,kind:'damage'},
 {name:'Lay on Hands (custom)',baseDice:1,sides:8,kind:'healing'}
]);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const cleanName=s=>String(s||'').toLocaleLowerCase().trim();
const safeNumber=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
export function validateEffect(raw){
 if(!raw||typeof raw!=='object')throw Error('Invalid magic-item effect');
 const item=String(raw.item||'').trim().slice(0,140);
 if(!item)throw Error('Magic effect must name an inventory item');
 if(!EFFECT_TARGETS.includes(raw.target)||!EFFECT_OPS.includes(raw.op))throw Error('Unsupported effect or operation');
 const value=Number(raw.value);
 if(!Number.isFinite(value)||value < -1000||value>1000)throw Error('Magic effect out of range');
 if(raw.op==='multiply'&&(value<0||value>10))throw Error('Multiplier must be between 0 and 10');
 if(raw.op==='minimum'&&value<0)throw Error('Minimum must be non-negative');
 return {item,target:raw.target,op:raw.op,value,enabled:raw.enabled===true,requiresAttunement:raw.requiresAttunement===true,attuned:raw.attuned===true};
}
export function validateEffects(value){
 if(!Array.isArray(value)||value.length>60)throw Error('Too many magic effects');
 return value.map(validateEffect);
}
export function activeEffects(c){
 const items=new Set((c.items||[]).filter(i=>Array.isArray(i)&&Number(i[1])>0).map(i=>cleanName(i[0])));
 const effects=Array.isArray(c.magicEffects)?c.magicEffects:[];
 const eligible=effects.filter(e=>e&&e.enabled&&items.has(cleanName(e.item))&&EFFECT_TARGETS.includes(e.target)&&EFFECT_OPS.includes(e.op)&&Number.isFinite(e.value));
 // At most three distinct attuned items grant effects in the SRD baseline.
 const allowed=new Set([...new Set(eligible.filter(e=>e.requiresAttunement&&e.attuned).map(e=>cleanName(e.item)))].slice(0,3));
 return eligible.filter(e=>!e.requiresAttunement||(e.attuned&&allowed.has(cleanName(e.item))));
}
const apply=(start,effects,target)=>{
 const chosen=effects.filter(e=>e.target===target);
 // Additive bonuses, then multipliers, then minimum-score (floor) effects.
 let value=start;
 for(const e of chosen)if(e.op==='add')value+=e.value;
 for(const e of chosen)if(e.op==='multiply')value*=e.value;
 for(const e of chosen)if(e.op==='minimum')value=Math.max(value,e.value);
 return value;
};
const rounded=n=>Math.round(n*100)/100;
export function deriveCharacter(c){
 const level=clamp(Math.floor(safeNumber(c.level,1)),1,20),effects=activeEffects(c);
 const scores={};
 for(const key of ABILITIES)scores[key]=clamp(Math.floor(apply(safeNumber(c[key],10),effects,key)),1,30);
 const mods=Object.fromEntries(ABILITIES.map(k=>[k,Math.floor((scores[k]-10)/2)]));
 const proficiency=2+Math.floor((level-1)/4);
 const exhaustion=clamp(Math.floor(safeNumber(c.exhaustion,0)),0,6),d20Penalty=2*exhaustion;
 const isPaladin=String(c.class||'').toLowerCase().trim()==='paladin';
 const baseHp=safeNumber(c.hpBase,10);
 const hp=Math.max(1,Math.floor(apply(baseHp+mods.con*level,effects,'hp')));
 const itemWeight=(c.items||[]).reduce((s,i)=>s+(Number(i[1])||0)*(Number(i[2])||0),0);
 const coins=(safeNumber(c.cp)+safeNumber(c.sp)+safeNumber(c.ep)+safeNumber(c.gp)+safeNumber(c.pp))/50;
 const other=.2+safeNumber(c.oil)*.16+1.5+safeNumber(c.tapers)*.1;
 const bagPresent=(c.items||[]).some(i=>/^bag of holding$/i.test(String(i[0]).trim())&&Number(i[1])>0);
 const inBag=bagPresent?(c.items||[]).reduce((s,i)=>s+(i[3]===true&&!/^bag of holding$/i.test(String(i[0]).trim())&&(Number(i[1])||0)>0?(Number(i[1])||0)*(Number(i[2])||0):0),0):0;
 const packed=Math.max(0,itemWeight-inBag)+coins+other;
 const carried=rounded(Math.max(0,apply(packed,effects,'load')));
 const size=SIZE_MULTIPLIERS[c.size]===undefined?'Medium':c.size;
 const capacity=rounded(Math.max(0,apply(scores.str*15*SIZE_MULTIPLIERS[size],effects,'carry')));
 const attack=mods.str+proficiency+apply(0,effects,'attack')-d20Penalty;
 const damage=mods.str+apply(0,effects,'damage');
 const healing=mods.cha+apply(0,effects,'healing');
 const damageMultiplier=clamp(apply(1,effects,'damageMultiplier'),0,100);
 const healingMultiplier=clamp(apply(1,effects,'healingMultiplier'),0,100);
 const diceMultiplier=clamp(apply(1,effects,'diceMultiplier'),0,100);
 const inventoryNames=(c.items||[]).filter(i=>Array.isArray(i)&&Number(i[1])>0).map(i=>cleanName(i[0]));
 const armorPresent=inventoryNames.some(name=>/\b(chainmail|chain mail|plate armor|breastplate|half plate|leather armor|studded leather|scale mail|ring mail|splint armor|hide armor|padded armor|armor|armour)\b/.test(name));
 const shieldPresent=inventoryNames.some(name=>name.includes('shield'));
 const armor=(armorPresent?safeNumber(c.armor,10):10+mods.dex)+(c.shield&&shieldPresent?2:0)+(c.faith?2:0)+apply(0,effects,'ac');
 const speed=Math.max(0,apply(safeNumber(c.speed,30),effects,'speed')-5*exhaustion);
 const saveBonus=apply(0,effects,'save');
 const spellDC=8+proficiency+mods.cha+apply(0,effects,'spellDC');
 const inventoryNamesSet=new Set((c.items||[]).filter(i=>Array.isArray(i)&&Number(i[1])>0).map(i=>cleanName(i[0])));
 const requested=(Array.isArray(c.magicEffects)?c.magicEffects:[]).filter(e=>e?.enabled&&e?.requiresAttunement&&e?.attuned&&inventoryNamesSet.has(cleanName(e.item)));
 const activeAttunements=[...new Set(requested.map(e=>cleanName(e.item)))];
 const encumbrance=c.variantEncumbrance===true?{encumbered:carried>scores.str*5,heavy:carried>scores.str*10}:null;
 return {level,scores,mods,proficiency,exhaustion,d20Penalty,maxHp:hp,weight:carried,capacity,remaining:rounded(capacity-carried),bodyPlusGear:rounded(safeNumber(c.body)+carried),size,attack,damage,healing,damageMultiplier,healingMultiplier,diceMultiplier,ac:armor,speed,saveBonus,spellDC,holyDC:spellDC,extraAttack:isPaladin&&level>=5?2:1,armorPresent,shieldPresent,paladinLayOnHandsMax:isPaladin?5*level:0,activeAttunements,attunementExceeded:activeAttunements.length>3,bagPresent,bagContents:rounded(inBag),bagOverfilled:inBag>500,encumbrance,exceedsCapacity:carried>capacity,effects};
}
export function powerAtRank(c,index){
 const base=CUSTOM_POWERS[index];if(!base)return null;
 const rank=clamp(Math.trunc(Number(c.powerRanks?.[index])||1),1,10);
 // Every rank increase intentionally selected for these custom powers adds 1d8.
 return {...base,rank,count:base.baseDice+rank-1,notation:(base.baseDice+rank-1)+'d'+base.sides};
}
export function rollAdjustments(c,context='normal',sides=20){
 const d=deriveCharacter(c);
 const modes=['attack','damage','healing','strengthCheck','wisdomSave','holyPower0','holyPower1','holyPower2'];
 if(!modes.includes(context))return {add:0,multiplier:1,context:'normal'};
 if(context==='attack')return {add:d.attack,multiplier:1,context};
 if(context==='strengthCheck')return {add:d.mods.str-d.d20Penalty,multiplier:1,context};
 if(context==='wisdomSave')return {add:d.mods.wis+d.proficiency+d.saveBonus+(c.aura&&c.hp>0?2:0)-d.d20Penalty,multiplier:1,context};
 if(context==='healing'||context==='holyPower2')return {add:d.healing,multiplier:d.healingMultiplier*d.diceMultiplier,context};
 return {add:context==='damage'?d.damage:0,multiplier:d.damageMultiplier*d.diceMultiplier,context};
}
export function applyRollAdjustments(result,adjustment){
 const original=result.total;
 const add=adjustment.add||0,multiplier=adjustment.multiplier??1;
 if(adjustment.context==='normal')return {...result,rawTotal:original,context:'normal',derivedAdd:0,derivedMultiplier:1};
 const adjusted=Math.floor(Math.max(0,original+add)*multiplier);
 // Ability tests can have negative totals; damage/healing cannot.
 const total=adjustment.context==='attack'||adjustment.context==='strengthCheck'||adjustment.context==='wisdomSave'
  ?original+add:adjusted;
 return {...result,rawTotal:original,total,context:adjustment.context,derivedAdd:add,derivedMultiplier:multiplier};
}
