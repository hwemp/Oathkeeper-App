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

// The archived 144 Store renders an older GIF inside .ok-roll-box. Match the
// exact same 3D models used for Store cards and the Dice roller here too.
// Preserve the original GIF as the fallback until WebGL has rendered.
const storeControllers=new WeakMap();
function currentStoreSkin(box){
 const root=box.closest('.ok-exact-store');
 const selected=root?.querySelector('[data-store-dice][aria-pressed="true"],[data-store-dice].ok-selected,[data-store-dice].selected');
 const slug=selected?.getAttribute('data-store-dice');
 if(slug)return themeSlugForCatalogue(slug);
 const title=root?.querySelector('.ok-ribbon')?.textContent?.trim().toLowerCase();
 return themeSlugForCatalogue(title||'default');
}
function createStorePreview(box){
 if(!box?.isConnected||storeControllers.has(box))return;
 const original=box.querySelector('.ok-roll');
 if(!original)return;
 const canvas=document.createElement('canvas');
 canvas.className='test168-store-webgl';
 canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:7;opacity:0;border-radius:8px';
 box.appendChild(canvas);
 let renderer,frame=0,disposed=false,theme='',start=0;
 const control={stop(){
  if(disposed)return;disposed=true;
  cancelAnimationFrame(frame);
  original.style.opacity='';
  try{renderer?.dispose()}catch{}
  canvas.remove();running.delete(control);
 }};
 storeControllers.set(box,control);running.add(control);
 try{
  renderer=new JewelDiceScene(canvas,{width:Math.max(1,box.clientWidth),height:Math.max(1,box.clientHeight)});
  theme=currentStoreSkin(box);
  renderer.setDice(20,theme,1);
  renderer.render(1,[20]);
  canvas.style.opacity='1';
  original.style.opacity='0';
  box.dataset.test168Webgl='active';
 }catch(e){
  console.warn('TEST 168 Store WebGL fallback to original GIF',e);
  control.stop();return;
 }
 const tick=(now)=>{
  if(disposed)return;
  if(!box.isConnected){control.stop();return}
  try{
   const next=currentStoreSkin(box);
   if(next!==theme){theme=next;renderer.setDice(20,theme,1);start=now}
   if(!start)start=now;
   const w=box.clientWidth,h=box.clientHeight;
   renderer.setSize(w,h,window.devicePixelRatio||1);
   const cycle=(now-start)%3200;
   const t=Math.min(1,cycle/1650);
   renderer.render(t,[20]);
  }catch(e){console.warn('TEST 168 Store 3D fallback',e);control.stop();return}
  frame=requestAnimationFrame(tick);
 };
 frame=requestAnimationFrame(tick);
}

function boot(){
 if(!hasWebGL()){
  document.documentElement.dataset.test168Webgl='unsupported';
  return;
 }
 document.documentElement.dataset.test168Webgl='supported';
 const mount=()=>{
  document.querySelectorAll('.dice-page #diceTabletop').forEach(createRollView);
  document.querySelectorAll('.ok-exact-store .ok-roll-box').forEach(createStorePreview);
 };
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
  else mount();
 });
}
if(typeof document!=='undefined'){
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
 else boot();
}
