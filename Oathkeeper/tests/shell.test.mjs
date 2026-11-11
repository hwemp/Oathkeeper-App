import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
const html=await readFile(new URL('../web/index.html',import.meta.url),'utf8');
const result=await build({entryPoints:['web/app.js'],bundle:true,write:false,format:'esm',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.VITE_COMMUNITY_URL':'""','import.meta.url':'"https://localhost/app.js"','process.env.NODE_ENV':'"production"'}});
async function shell(saved,consent=true){const dom=new JSDOM(html,{url:'https://localhost',runScripts:'outside-only',pretendToBeVisual:true});const w=dom.window;if(!w.HTMLDialogElement.prototype.showModal){w.HTMLDialogElement.prototype.showModal=function(){this.open=true}}if(!w.HTMLDialogElement.prototype.close){w.HTMLDialogElement.prototype.close=function(){this.open=false}}w.structuredClone=structuredClone;w.AbortSignal=AbortSignal;Object.defineProperty(w,'crypto',{value:webcrypto});let copied='';Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async s=>{copied=s}}});if(saved)w.localStorage.setItem('oathkeeper-v1',JSON.stringify(saved));if(consent)w.localStorage.setItem('oathkeeper-terms-acceptance',JSON.stringify({version:'2026-11-10-v1',accepted:true,tier:'adult',at:'2026-11-10T00:00:00Z'}));await w.eval('(async()=>{'+result.outputFiles[0].text+'})()');const q=s=>w.document.querySelector(s),click=s=>{const b=q(s);assert(b,s);b.click()},input=(s,v,kind='input')=>{const e=q(s);assert(e,s);e.value=v;e.dispatchEvent(new w.Event(kind,{bubbles:true}))};await new Promise(r=>setTimeout(r,0));return {w,q,click,input,saved:()=>JSON.parse(w.localStorage.getItem('oathkeeper-v1')),copied:()=>copied,close:async()=>{await new Promise(r=>setTimeout(r,0));w.close()}};}
test('full app preserves character data while recording rolls and restoring stats',async()=>{let s=await shell();let saved;try{s.click('[data-tab="Dice"]');s.input('#diceQuantity','3');s.input('#diceModifier','-2');s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));saved=s.saved();assert.equal(saved.rollHistory.length,1);assert.equal(saved.rollHistory[0].values.length,3);assert.equal(saved.name,'Ecclesyus Ha Kawa');assert.equal(saved.hp,15);assert.match(s.q('.roll-statistics').textContent,/Individual dice/);assert.equal(saved.rollHistory[0].modifier,-2)}finally{await s.close()}s=await shell(saved);try{s.click('[data-tab="Dice"]');assert.equal(s.saved().rollHistory.length,1);assert.match(s.q('.roll-statistics').textContent,/Observed official D20/)}finally{await s.close()}});
test('DM workflow persists placement, notes, initiative, damage and round advance',async()=>{const s=await shell();try{s.click('[data-tab="DM"]');s.click('[data-dm-section="Session"]');s.input('[data-dm="title"]','Combined campaign');s.input('[data-dm="placement"]','tab','change');assert(s.q('#nav [data-tab="DM"]'));s.click('[data-dm-section="Campaign"]');s.input('[data-dm-note="NPCs & factions"]','The hidden ally');s.click('[data-dm-section="Encounter"]');const form=s.q('#dmAdd');form.elements.name.value='Paladin';form.elements.maxhp.value='20';form.elements.initiative.value='15';form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));assert.equal(s.saved().dm.combatants.length,1);s.click('[data-dm-action="next"]');assert.equal(s.saved().dm.round,1);s.input('[id^="dm-amount-"]','7');s.click('[data-dm-action="damage"]');assert.equal(s.saved().dm.combatants[0].hp,13);s.click('[data-dm-action="next"]');assert.equal(s.saved().dm.round,2);assert.equal(s.saved().dm.notes['NPCs & factions'],'The hidden ally');assert.equal(s.saved().name,'Ecclesyus Ha Kawa')}finally{await s.close()}});
test('invalid history recovery preserves a valid DM workspace and character notes',async()=>{let s=await shell(),saved;try{s.click('[data-tab="DM"]');s.click('[data-dm-section="Session"]');s.input('[data-dm="title"]','Keep this');saved=s.saved();saved.rollHistory=[{invalid:true}];saved.notes='Keep character journal'}finally{await s.close()}s=await shell(saved);try{assert.equal(s.saved().dm.title,'Keep this');assert.equal(s.saved().notes,'Keep character journal');assert.deepEqual(s.saved().rollHistory,[])}finally{await s.close()}});
test('Support drafts redact credentials and do not attach character or DM notes',async()=>{const s=await shell();try{s.click('[data-tab="Support"]');assert.equal(s.q('a[href^="mailto:"]').textContent,'ecclesyus@gmail.com');s.input('#supportDescription','Dice broke. password=privatevalue access_token=privatekey');s.click('[data-support="copy"]');await new Promise(r=>setTimeout(r,0));assert(!s.copied().includes('privatevalue'));assert(!s.copied().includes('privatekey'));assert(!s.copied().includes('Messianic'));assert.match(s.copied(),/^Oathkeeper support report/);assert.doesNotMatch(s.copied(),/ChatGPT|OpenAI|AI assistance/i);assert.equal(s.q('[data-support="approve"]'),null);assert.equal(s.q('#supportAuto').checked,false)}finally{await s.close()}});
test('Store follows Friends and shows ten selectable visual dice skins with checkout disabled',async()=>{const s=await shell();try{const menu=[...s.q('#appMenu .menu-options').querySelectorAll('button[data-tab]')].map(b=>b.dataset.tab);assert.equal(menu[menu.indexOf('Friends')+1],'Store');s.click('[data-tab="Store"]');assert.match(s.q('#view').textContent,/Dice Collection/i);assert.equal(s.q('#view').querySelectorAll('button[data-store-dice]').length,10);assert.equal(s.q('#view').querySelectorAll('.store-dice-tile.selected').length,1);assert.equal(s.q('#view button.store-purchase-disabled').disabled,true);s.click('[data-tab="Dice"]');assert(!s.q('#view').textContent.includes('Artwork does not affect'));assert.equal(s.q('footer'),null);assert.equal(s.q('.die-face-overlay'),null);s.click('[data-tab="Settings"]');s.click('[data-tab="About"]');assert.match(s.q('#view').textContent,/Artwork does not affect/);assert.match(s.q('#view').textContent,/Personal homebrew profile/);assert.match(s.q('#view').textContent,/ecclesyus@gmail.com/)}finally{await s.close()}});

test('first-launch terms block app until the truthful age declaration is accepted',async()=>{
 const s=await shell(null,false);
 try{
  assert.equal(s.q('#termsGate').hidden,false);
  assert.equal(s.q('main').inert,true);
  assert.equal(s.q('#termsAccept').disabled,true);
  s.input('#termsAge','under13','change');s.q('#termsAgree').click();
  assert.equal(s.q('#termsAccept').disabled,true);
  s.input('#termsAge','teen','change');
  assert.equal(s.q('#termsAccept').disabled,false);
  s.click('#termsAccept');
  assert.equal(s.q('#termsGate').hidden,true);
  assert.equal(s.q('main').inert,false);
  assert.equal(JSON.parse(s.w.localStorage.getItem('oathkeeper-terms-acceptance')).tier,'teen');
  s.click('[data-tab="Messages"]');
  assert.match(s.q('#view').textContent,/Community access unavailable/);
 }finally{await s.close()}
});
test('Dice page alone controls persisted optional animation without altering roll totals',async()=>{
 let s=await shell(),saved;
 try{
  s.click('[data-tab="Settings"]');
  assert.equal(s.q('[data-k="diceAnimation"]'),null);
  s.click('[data-tab="Dice"]');
  assert.equal(s.q('[data-k="diceAnimation"]').checked,false);
  assert.match(s.q('.dice-animation-setting').textContent,/Animate rolls/);
  s.q('[data-k="diceAnimation"]').click();
  assert.equal(s.saved().diceAnimation,true);
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  assert(s.q('#diceTabletop'));
   assert.equal(s.q('.dice-page.roll-animated'),null);
  assert.equal(s.saved().rollHistory.length,1);
  saved=s.saved();
 }finally{await s.close()}
 s=await shell(saved);
 try{
  s.click('[data-tab="Dice"]');
  assert.equal(s.q('[data-k="diceAnimation"]').checked,true);
  s.q('[data-k="diceAnimation"]').click();
  assert.equal(s.saved().diceAnimation,false);
  assert.equal(s.q('#diceTabletop'),null);
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(s.q('#diceTabletop'),null);
  assert.equal(s.saved().rollHistory.length,2);
  s.click('[data-tab="Settings"]');
  assert.equal(s.q('[data-k="diceAnimation"]'),null);
 }finally{await s.close()}
});
test('DM Overview summarizes character abilities and environment',async()=>{
 const s=await shell();try{
  s.click('[data-tab="DM"]');
  assert.match(s.q('#view').textContent,/Player characters & stats/);
  s.click('[data-dm-section="Session"]');
  s.input('[data-dm="environment.location"]','Silverkeep');
  s.click('[data-dm-section="Encounter"]');
  const form=s.q('#dmAdd');
  form.elements.name.value='Ranger';
  form.elements.str.value='16';
  form.elements.dex.value='18';
  form.dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  s.click('[data-dm-section="Overview"]');
  assert.match(s.q('#view').textContent,/Silverkeep/);
  assert.match(s.q('#view').textContent,/Ranger/);
  assert.match(s.q('#view').textContent,/STR 16/);
  assert.equal(s.saved().dm.combatants[0].dex,18);
 }finally{await s.close()}
});


test('store selections highlight gold cards and persist without affecting dice rolls',async()=>{
 let s=await shell(),saved;
 try{
  s.click('[data-tab="Store"]');
  assert.equal(s.q('.store-dice-grid').querySelectorAll('button').length,10);
  assert.equal(s.q('.store-dice-tile.selected').dataset.storeDice,'elvenleaf');
  s.click('[data-store-dice="oceanic"]');
  assert.equal(s.q('.store-dice-tile.selected').dataset.storeDice,'oceanic');
  assert.equal(s.q('[data-store-dice="oceanic"]').getAttribute('aria-pressed'),'true');
  saved=s.saved();
  assert.equal(saved.storePreviewDice,'oceanic');
  assert(s.q('.store-preview-pane'));
  assert.equal(s.q('[data-store-preview]'),null);
  s.click('[data-tab="Dice"]');
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  assert.equal(s.saved().rollHistory.length,1);
 }finally{await s.close()}
 s=await shell(saved);
 try{s.click('[data-tab="Store"]');assert.equal(s.q('.store-dice-tile.selected').dataset.storeDice,'oceanic')}
 finally{await s.close()}
});

test('store category switching and tile taps immediately update the correct preview without starting checkout',async()=>{
 const s=await shell();
 try{
  s.click('[data-tab="Store"]');
  assert(s.q('.store-preview-image'));
  assert.equal(s.q('[data-store-preview]'),null);
  s.click('[data-store-dice="frostborne"]');
  assert.equal(s.q('.store-preview-image').getAttribute('data-store-atlas-index'),'1');
  assert.equal(s.q('.store-dice-tile.selected').dataset.storeDice,'frostborne');
  s.click('[data-store-category="backgrounds"]');
  assert(s.q('.store-background-preview-image'));
  s.click('[data-store-background="mystic-lake"]');
  assert.equal(s.q('.store-background-preview-image').getAttribute('src'),'/art/store-backgrounds/mystic-lake.webp');
  assert.equal(s.saved().storePreviewBackground,'mystic-lake');
  s.click('[data-store-category="icons"]');
  assert.equal(s.q('.store-icon-grid').querySelectorAll('[data-store-icon]').length,10);
  assert.equal(s.q('.store-icon-preview-image').getAttribute('src'),'/art/store-icons/icon-01.webp');
  s.click('[data-store-icon="icon-14"]');
  assert.equal(s.q('.store-icon-preview-image').getAttribute('src'),'/art/store-icons/icon-14.webp');
  assert.equal(s.saved().storePreviewIcon,'icon-14');
  assert.equal(s.q('[data-store-preview]'),null);
  assert.match(s.q('#view').textContent,/FREE/);
  assert.equal(s.q('.store-purchase-disabled'),null);
  assert.equal(s.q('[data-store-apply-icon="icon-14"]').disabled,true);
  assert.equal(s.q('[data-store-restore-icon="default"]').disabled,true);
  s.click('[data-store-category="dice"]');
  assert.equal(s.q('.store-preview-image').getAttribute('data-store-atlas-index'),'1');
 }finally{await s.close()}
});

test('icon selection persists across store visits without charging the user',async()=>{
 let sh=await shell();let saved;
 try{
  sh.click('[data-tab="Store"]');
  sh.click('[data-store-category="icons"]');
  sh.click('[data-store-icon="icon-07"]');
  assert.equal(sh.saved().storePreviewIcon,'icon-07');
  assert.equal(sh.q('.store-icon-tile.selected').dataset.storeIcon,'icon-07');
  assert.match(sh.q('#view').textContent,/All ten alternate app icons/);
  saved=sh.saved();
 }finally{await sh.close()}
 sh=await shell(saved);
 try{
  sh.click('[data-tab="Store"]');
  sh.click('[data-store-category="icons"]');
  assert.equal(sh.q('.store-icon-tile.selected').dataset.storeIcon,'icon-07');
  assert.equal(sh.q('.store-icon-preview-image').getAttribute('src'),'/art/store-icons/icon-07.webp');
 }finally{await sh.close()}
});

test('forged local purchase flags never unlock dice and background cosmetics',async()=>{
 const shellState=await shell();
 let saved;
 try{
  saved=shellState.saved();
 }finally{await shellState.close()}
 saved.activeStoreDice='dragonfire';
 saved.activeStoreBackground='mystic-lake';
 saved.purchased=['oathkeeper.dice.dragonfire','oathkeeper.background.mystic-lake'];
 saved.ownedProducts=[...saved.purchased];
 const s=await shell(saved);
 try{
  s.click('[data-tab="Dice"]');
  assert.equal(s.q('.dice-applied-skin'),null);
  assert.equal(s.w.document.body.hasAttribute('data-store-paid-background'),false);
  s.click('[data-tab="Store"]');
  assert.equal(s.q('[data-store-apply-cosmetic="dice:elvenleaf"]').disabled,true);
  s.click('[data-store-category="backgrounds"]');
  assert.equal(s.q('[data-store-apply-cosmetic="backgrounds:moonlit-citadel"]').disabled,true);
  assert.equal(s.q('[data-store-restore-purchases="true"]').disabled,true);
 }finally{await s.close()}
});


test('equipment editing hides all five coin inputs without altering the coin purse',async()=>{
 const s=await shell();
 try {
  const dialog=s.q('#equipmentEditor');
  dialog.showModal=()=>{dialog.open=true};
  dialog.close=()=>{dialog.open=false};
  s.click('[data-action="edit-equipment"]');
  const fields=[...s.q('#equipmentFields').querySelectorAll('[data-draft-key]')];
  assert.deepEqual(fields.map(x=>x.dataset.draftKey),['body']);
  for (const key of ['cp','sp','ep','gp','pp'])
   assert.equal(s.q('[data-draft-key="'+key+'"]'),null,key+' must not be editable');
  assert(s.q('#equipmentFields').textContent.includes('Body weight'));
  s.input('[data-draft-key="body"]','205');
  s.click('[data-action="save-equipment"]');
  assert.equal(s.saved().body,205);
  assert.deepEqual(['cp','sp','ep','gp','pp'].map(k=>s.saved()[k]),[0,0,0,15,0]);
  assert.match(s.q('#view').textContent,/Coin purse/);
  assert.match(s.q('#view').textContent,/GP: 15/);
 } finally {await s.close()}
});

test('four primary navigation tabs remain interactive and HP uses one visible slash',async()=>{
 const s=await shell();
 try {
  for(const name of ['Overview','Powers','Inventory','Dice'])
   assert(s.q('#nav [data-tab="'+name+'"]'),name+' tab');
  assert.equal(s.q('.hp-value').textContent,'15/15');
  assert.equal(s.q('.hp-value').getAttribute('aria-label'),'15 of 15 hit points');
  assert.equal(s.q('.hp-value .hp-separator'),null);
  s.click('#nav [data-tab="Powers"]');
  assert(s.q('#nav [data-tab="Powers"]').classList.contains('active'));
  s.click('#nav [data-tab="Inventory"]');
  assert.match(s.q('#view').textContent,/Coin purse/);
  s.click('#nav [data-tab="Dice"]');
  assert(s.q('.dice-page'));
 } finally {await s.close()}
});

test('Inventory coin stepper adjusts all five denominations, updates totals, persists, and never goes negative',async()=>{
 let s=await shell(),saved;
 try{
  s.click('[data-tab="Inventory"]');
  assert.equal(s.q('.coin-purse-grid').querySelectorAll('.coin-stepper').length,5);
  const keys=['cp','sp','ep','gp','pp'];
  for(const key of keys){
   assert(s.q('[data-coin-change="'+key+'"][data-coin-delta="1"]'));
   assert(s.q('[data-coin-change="'+key+'"][data-coin-delta="-1"]'));
  }
  assert.equal(s.q('[data-coin-change="cp"][data-coin-delta="-1"]').disabled,true);
  s.click('[data-coin-change="cp"][data-coin-delta="1"]');
  s.click('[data-coin-change="sp"][data-coin-delta="1"]');
  s.click('[data-coin-change="ep"][data-coin-delta="1"]');
  s.click('[data-coin-change="gp"][data-coin-delta="1"]');
  s.click('[data-coin-change="pp"][data-coin-delta="1"]');
  assert.deepEqual(keys.map(key=>s.saved()[key]),[1,1,1,16,1]);
  assert.match(s.q('#view').textContent,/26.61 GP equivalent/);
  assert.match(s.q('#view').textContent,/Remaining 123.6 lb/);
  s.click('[data-coin-change="gp"][data-coin-delta="-1"]');
  assert.equal(s.saved().gp,15);
  s.click('[data-coin-change="cp"][data-coin-delta="-1"]');
  assert.equal(s.saved().cp,0);
  assert.equal(s.q('[data-coin-change="cp"][data-coin-delta="-1"]').disabled,true);
  // Even a synthetic activation of a formerly disabled button cannot go negative.
  s.q('[data-coin-change="cp"][data-coin-delta="-1"]').disabled=false;
  s.click('[data-coin-change="cp"][data-coin-delta="-1"]');
  assert.equal(s.saved().cp,0);
  saved=s.saved();
 }finally{await s.close()}
 s=await shell(saved);
 try{
  s.click('[data-tab="Inventory"]');
  assert.deepEqual(['cp','sp','ep','gp','pp'].map(key=>s.saved()[key]),[0,1,1,15,1]);
  assert.match(s.q('.coin-purse-grid').textContent,/GP: 15/);
  const dialog=s.q('#equipmentEditor');
  dialog.showModal=()=>{dialog.open=true};
  s.click('[data-action="edit-equipment"]');
  for(const key of ['cp','sp','ep','gp','pp'])
    assert.equal(s.q('[data-draft-key="'+key+'"]'),null);
 }finally{await s.close()}
});


test('rules desk derives item effects from the current inventory and reverses them after removal',async()=>{
 const s=await shell();
 try{
  s.click('[data-tab="Rules & effects"]');
  assert.match(s.q('#view').textContent,/Character rules & effects/);
  assert.match(s.q('#view').textContent,/270 lb/);
  s.click('[data-magic-add]');
  const effect=s.q('[data-magic-index="0"][data-magic-key="enabled"]');
  assert(effect);
  effect.click();
  assert.equal(s.saved().magicEffects[0].enabled,true);
  assert.match(s.q('#view').textContent,/270 lb/,'attunement is required before bonus applies');
  s.q('[data-magic-index="0"][data-magic-key="attuned"]').click();
  assert.match(s.q('#view').textContent,/285 lb/);
  s.click('[data-tab="Inventory"]');
  assert.match(s.q('#view').textContent,/Capacity 285 lb/);
  s.click('[data-action="edit-equipment"]');
  const quantity=s.q('[data-draft-item="0"][data-col="1"]');
  quantity.value='0';quantity.dispatchEvent(new s.w.Event('input',{bubbles:true}));
  s.click('[data-action="save-equipment"]');
  assert.match(s.q('#view').textContent,/Capacity 270 lb/);
  assert.equal(s.saved().items[0][1],0);
 }finally{await s.close()}
});

test('level-up updates Paladin HP/proficiency and optional power rank affects dice without changing base attributes',async()=>{
 const s=await shell();
 try{
  s.input('[data-k="level"]','5','change');
  assert.equal(s.saved().level,5);
  assert.equal(s.saved().hpBase,34);
  assert.equal(s.saved().str,18);
  assert.equal(s.q('.hp-value').textContent,'15/59');
  s.click('[data-tab="Rules & effects"]');
  assert.match(s.q('#view').textContent,/2 attacks/);
  s.click('[data-power-rank="0"][data-rank-delta="1"]');
  assert.equal(s.saved().powerRanks[0],2);
  s.click('[data-tab="Dice"]');
  s.input('#diceContext','holyPower0','change');
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  const latest=s.saved().rollHistory.at(-1);
  assert.equal(latest.sides,8);
  assert.equal(latest.values.length,2);
  assert.equal(latest.context,'holyPower0');
 }finally{await s.close()}
});

test('contextual dice record derived bonuses while a plain roll records only its own dice',async()=>{
 const s=await shell();
 try{
  s.click('[data-tab="Dice"]');
  s.input('#diceContext','damage','change');
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  const enhanced=s.saved().rollHistory.at(-1);
  assert.equal(enhanced.total,enhanced.values[0]+4);
  s.input('#diceContext','normal','change');
  s.q('#diceForm').dispatchEvent(new s.w.Event('submit',{bubbles:true,cancelable:true}));
  const plain=s.saved().rollHistory.at(-1);
  assert.equal(plain.total,plain.values[0]);
 }finally{await s.close()}
});
