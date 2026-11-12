/* Oathkeeper TEST 168 WebGL runtime visual upgrade.
 * A presentation-only layer follows the original 144 rolling canvas. It reads
 * the original selected shape and the ORIGINAL landed result from the DOM.
 * It NEVER calls the RNG or edits result/odds/purchase state. If WebGL fails,
 * the unmodified original canvas remains visible and functional. */
import {JewelDiceScene,hasWebGL,themeSlugForCatalogue} from './test168-jewel-scene.js';
const controllers=new WeakMap();
const running=new Set();
const DURATION_MS=1650;
const parseFaces=text=>[...String(text||'').matchAll(/D(?:3|4|6|8|10|12|20|50|100)\s+(\d+)/g)].map(x=>Number(x[1]));
function createRollView(stage){
 if(!stage?.isConnected||controllers.has(stage))return;
 const original=stage.querySelector('canvas');
 if(!original)return;
 const current=document.querySelector('.dice-page .die-tile.selected[data-die]');
 const sides=Number(current?.getAttribute('data-die')||20);
 const chosen=themeSlugForCatalogue(document.querySelector('.dice-applied-skin')?.getAttribute('data-applied-dice')||'default');
 const qty=Math.max(1,Math.min(12,Number(document.querySelector('#diceQuantity')?.value)||1));
 const overlay=document.createElement('canvas');
 overlay.className='test168-live-webgl';
 overlay.setAttribute('aria-hidden','true');
 overlay.style.cssText='position:absolute;display:block;pointer-events:none;z-index:5;border-radius:8px;opacity:0;transition:opacity .12s ease-out';
 stage.style.position='relative';
 stage.appendChild(overlay);
 let visual,frame=0,cancelled=false,start=null,finished=false;
 const control={stop(){
  if(cancelled)return;cancelled=true;
  cancelAnimationFrame(frame);
  if(original.isConnected)original.style.opacity='';
  try{visual?.dispose()}catch{}
  overlay.remove();running.delete(control);
 }};
 controllers.set(stage,control);
 running.add(control);
 try{
  visual=new JewelDiceScene(overlay,{width:original.clientWidth||300,height:original.clientHeight||220});
  visual.setDice(sides,chosen,qty);
  visual.render(0);
  original.style.opacity='0';
  overlay.style.opacity='1';
 }catch(error){
  console.warn('TEST 168: WebGL unavailable; original rolling animation retained.',error);
  control.stop();return;
 }
 const align=()=>{
  const rect=original.getBoundingClientRect(),bounds=stage.getBoundingClientRect();
  overlay.style.left=(rect.left-bounds.left)+'px';
  overlay.style.top=(rect.top-bounds.top)+'px';
  overlay.style.width=rect.width+'px';
  overlay.style.height=rect.height+'px';
  visual.setSize(rect.width,rect.height,window.devicePixelRatio||1);
 };
 const tick=(now)=>{
  if(cancelled)return;
  if(!stage.isConnected){control.stop();return}
  if(start===null)start=now;
  const t=Math.min(1,(now-start)/DURATION_MS);
  try{
   align();
   const isLanded=stage.dataset.state==='landed';
   const faces=isLanded?parseFaces(stage.querySelector('[data-dice-landed]')?.textContent):null;
   visual.render(isLanded?1:t,faces);
   if(isLanded){finished=true;return}
  }catch(error){console.warn('TEST 168: falling back to original dice.',error);control.stop();return}
  frame=requestAnimationFrame(tick);
 };
 frame=requestAnimationFrame(tick);
 // Track the original renderer's completion, not an independent result.
 const landedObserver=new MutationObserver(()=>{
  if(cancelled||!stage.isConnected){landedObserver.disconnect();return}
  if(stage.dataset.state==='landed'&&!finished){
   const faces=parseFaces(stage.querySelector('[data-dice-landed]')?.textContent);
   try{visual.render(1,faces)}catch{}
  }
 });
 landedObserver.observe(stage,{attributes:true,attributeFilter:['data-state'],childList:true,subtree:true});
 const initialStop=control.stop;
 control.stop=()=>{landedObserver.disconnect();initialStop()};
}
function boot(){
 if(!hasWebGL()){
  document.documentElement.dataset.test168Webgl='unsupported';
  return;
 }
 document.documentElement.dataset.test168Webgl='supported';
 const mount=()=>document.querySelectorAll('.dice-page #diceTabletop').forEach(createRollView);
 mount();
 let scheduled=false;
 const obs=new MutationObserver(records=>{
  if(!records.some(r=>r.type==='childList'))return;
  if(scheduled)return;
  scheduled=true;
  queueMicrotask(()=>{scheduled=false;mount()});
 });
 obs.observe(document.body,{subtree:true,childList:true});
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden')for(const v of [...running])v.stop();
 });
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
}
