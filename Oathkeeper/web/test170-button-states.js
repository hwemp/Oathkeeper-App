/* TEST 170: one authoritative button family and two approved visual states.
 * Does not change navigation, purchase handlers, dice outcomes, click targets
 * or hidden options. Selected state follows real application state.
 * Store's baked illustrated category artwork remains deliberately untouched. */
const referenceSelectors=[
  '#nav button[data-tab]',
  '#appMenu .menu-options button',
  '#journalEditor button:not([data-draft-remove])',
  '#equipmentEditor button:not([data-draft-remove])',
  '.card .row > button:not([data-draft-remove]):not([data-coin-change])',
  '.dice-page .dice-submenu button',
  '.dice-page button.dice-roll',
  '.workspace-tabs button',
  '.dm-workspace button:not([data-coin-change])',
  '.support-workspace button',
  '.rules-desk .row button',
  '.modal .row button',
  '.dialog .row button'
].join(',');

function synchronize(reference=document) {
  const selectedTab=reference.querySelector('#nav button.active[data-tab]')?.dataset.tab
    ||reference.querySelector('#nav button[aria-current="page"]')?.dataset.tab;
  for(const button of reference.querySelectorAll(referenceSelectors)){
    if(button.closest('.ok-exact-store,.store-themed-footer,.ok-bundle-grid'))continue;
    if(button.matches('[data-draft-remove],[data-coin-change],.die-tile,.notification-bell'))continue;
    if(!button.classList.contains('oath170-reference-button'))
      button.classList.add('oath170-reference-button');
    const active=Boolean(
      button.matches('.selected,.active,[aria-pressed="true"],[aria-current="page"],[data-selected="true"]')
      ||(button.closest('#appMenu')&&button.dataset.tab&&button.dataset.tab===selectedTab)
    );
    if(button.classList.contains('oath170-reference-selected') !== (active&&!button.disabled))
      button.classList.toggle('oath170-reference-selected',active&&!button.disabled);
  }
}
function boot(){
  synchronize(document);
  let pending=false;
  const observer=new MutationObserver(mutations=>{
    if(pending||!mutations.some(m=>m.type==='childList'||
       (m.type==='attributes' && ['aria-pressed','aria-current','disabled','class'].includes(m.attributeName))))return;
    pending=true;
    queueMicrotask(()=>{pending=false;synchronize(document)});
  });
  observer.observe(document.body,{childList:true,subtree:true,attributes:true,
    attributeFilter:['aria-pressed','aria-current','disabled','class']});
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
}
