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

/* One master text fit algorithm for EVERY ornate gold-framed button.
 * Frame geometry is the SVG's own center safe area, not the full hit target:
 * x≈16–84%; y≈34–66%, between the horizontal flourishes and vertical gems.
 * Text is fitted by reading the actual DOM glyph rectangles, not estimated
 * character counts, and form inputs / Store hotspots are never touched.
 */
const textFitCache=new WeakMap();
let referenceResizeObserver=null;

function visibleLabelRects(button){
  const rectangles=[];
  const walker=document.createTreeWalker(button,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    if(!node.textContent || !node.textContent.trim())continue;
    const parent=node.parentElement;
    if(!parent || parent.closest('.sr-only,svg'))continue;
    const range=document.createRange();
    range.selectNodeContents(node);
    for(const r of range.getClientRects()){
      if(r.width>0.2 && r.height>0.2)rectangles.push(r);
    }
    range.detach?.();
  }
  return rectangles;
}

function labelFitsGoldInterior(button,rect){
  const left=rect.left+rect.width*.155;
  const right=rect.right-rect.width*.155;
  const top=rect.top+rect.height*.34;
  const bottom=rect.bottom-rect.height*.34;
  const spans=visibleLabelRects(button);
  if(!spans.length)return true;
  const slack=1.25;
  return spans.every(r=>r.left>=left-slack && r.right<=right+slack &&
    r.top>=top-slack && r.bottom<=bottom+slack);
}

function fitGoldButtonText(button){
  if(!button.isConnected || button.closest('.ok-exact-store,.store-themed-footer'))return;
  const rect=button.getBoundingClientRect();
  if(rect.width<60 || rect.height<42)return;
  const key=rect.width.toFixed(1)+'x'+rect.height.toFixed(1)+':'+button.textContent.trim();
  if(textFitCache.get(button)===key && button.dataset.oath170TextFit==='ok')return;
  const max=button.closest('#nav')?20:button.closest('#appMenu')?20:21;
  const min=10.5;
  // Longer descriptive action labels must remain legible in two lines.
  // Compact their line spacing rather than shrinking the entire frame or
  // reducing text to tiny unreadable lettering.
  const plainLabel=button.textContent.trim().replace(/\s+/g,' ');
  if(plainLabel.length>=23)
    button.style.setProperty('--oath170-fit-leading','1.0');
  else button.style.removeProperty('--oath170-fit-leading');
  const setSize=font=>button.style.setProperty('--oath170-fit-size',font.toFixed(2)+'px');
  // Prefer full-size readable labels; only scale when actual text crosses
  // a gemstone/flourish boundary. Binary search limits forced reflows.
  setSize(max);
  let best=labelFitsGoldInterior(button,rect)?max:0;
  if(!best){
    let lo=min,hi=max;
    setSize(min);
    if(labelFitsGoldInterior(button,rect)){
      best=min;
      for(let n=0;n<8;n++){
        const test=(lo+hi)/2;
        setSize(test);
        if(labelFitsGoldInterior(button,rect)){best=test;lo=test;}
        else hi=test;
      }
    }
  }
  if(best){
    setSize(Math.floor(best*2)/2);
    button.dataset.oath170TextFit='ok';
  }else{
    // Don't cut off words or distort the approved frame. Mark unfit labels
    // for automated QA to reject, so designers can solve genuinely narrow
    // layouts intentionally instead of concealing the visual defect.
    setSize(min);
    button.dataset.oath170TextFit='overflow';
    console.warn('Oathkeeper gold button label needs additional layout space:',button.textContent.trim());
  }
  textFitCache.set(button,key);
}

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
    if(referenceResizeObserver)referenceResizeObserver.observe(button);
    fitGoldButtonText(button);
  }
}
function boot(){
  let pending=false;
  const schedule=()=>{
    if(pending)return;
    pending=true;
    queueMicrotask(()=>{pending=false;synchronize(document)});
  };
  if(typeof ResizeObserver!=='undefined')
    referenceResizeObserver=new ResizeObserver(()=>schedule());
  synchronize(document);
  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(m=>m.type==='childList'||m.type==='characterData'||
        (m.type==='attributes' && ['aria-pressed','aria-current','disabled','class','open','hidden'].includes(m.attributeName))))return;
    schedule();
  });
  observer.observe(document.body,{childList:true,characterData:true,subtree:true,attributes:true,
    attributeFilter:['aria-pressed','aria-current','disabled','class','open','hidden']});
  window.addEventListener('resize',schedule,{passive:true});
}
if(typeof document!=='undefined'){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
}
