/* TEST-BRANCH-166: display verified rolling-D20 renderer captures above
 * the frozen 144 bundle atlas. This is visual-only: store selection,
 * purchased entitlements, buttons, and live dice mechanics are unchanged. */
const SETS=new Set(['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire']);
function paintBundleChoices(doc=document){
 for(const button of doc.querySelectorAll('[data-store-bundle-dice]')){
  const slug=button.getAttribute('data-store-bundle-dice');
  if(!SETS.has(slug)||button.querySelector(':scope > .test166-bundle-live-art'))continue;
  const layer=doc.createElement('span');
  layer.className='test166-bundle-live-art';
  layer.setAttribute('aria-hidden','true');
  layer.style.setProperty('position','absolute','important');
  layer.style.setProperty('inset','2px 2px 17px','important');
  layer.style.setProperty('z-index','30','important');
  layer.style.setProperty('display','block','important');
  layer.style.setProperty('pointer-events','none','important');
  layer.style.setProperty('border-radius','3px','important');
  layer.style.setProperty('background-color','#11162a','important');
  layer.style.setProperty('background-position','center','important');
  layer.style.setProperty('background-size','cover','important');
  layer.style.setProperty('background-repeat','no-repeat','important');
  layer.style.setProperty('image-rendering','auto','important');
  layer.style.setProperty('background-image','url("./art/test166-dice/'+slug+'/d20.png")','important');
  // Keep the original hitbox's absolute or relative coordinate system.
  const position=getComputedStyle(button).position;
  if(position==='static')button.style.setProperty('position','relative','important');
  button.style.setProperty('z-index','25','important');
  button.appendChild(layer);
 }
}
function start(){
 paintBundleChoices();
 let scheduled=false;
 const observer=new MutationObserver(changes=>{
  if(!changes.some(change=>change.type==='childList')||scheduled)return;
  scheduled=true;
  requestAnimationFrame(()=>{scheduled=false;paintBundleChoices();});
 });
 observer.observe(document.body,{subtree:true,childList:true});
}
if(typeof document!=='undefined'&&typeof MutationObserver!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
}
