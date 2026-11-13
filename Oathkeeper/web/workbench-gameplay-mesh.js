/* Workbench: restore the existing canonical solid-die renderer to GAMEPLAY.
 * The original 12-frame Store GIF stays untouched and never loads this module.
 * Faces, sides, outcomes and roll history are supplied by the frozen engine.
 * Visual renderer does NOT sample randomness or alter probabilities.
 */
import {playTabletopRoll,diceMeshFaceCount} from './dice-tabletop.js';

const supported=[3,4,6,8,10,12,20,50,100];
if(diceMeshFaceCount(100)!==100||diceMeshFaceCount(20)!==20)
 throw new Error('Oathkeeper actual die geometry has regressed');

const previous=globalThis.OathkeeperTabletop171;
const adapter=Object.freeze({
 geometryFaces:Object.freeze(Object.fromEntries(supported.map(d=>[d,diceMeshFaceCount(d)]))),
 play(stage,result,onComplete,skin=null){
  if(!stage?.isConnected||!Array.isArray(result?.rolls)){
   if(previous?.play)return previous.play(stage,result,onComplete,skin);
   onComplete();return ()=>{};
  }
  // Only the original secure result owns numbers and the completion callback.
  // The canvas is a DRAWING surface: no interaction with chance or finances.
  stage.querySelector('.workbench-mesh-frame')?.remove();
  stage.querySelector('canvas')?.remove();
  const wrapper=document.createElement('div');
  wrapper.className='workbench-mesh-frame';
  const canvas=document.createElement('canvas');
  canvas.className='workbench-mesh-canvas';
  canvas.setAttribute('role','img');
  canvas.setAttribute('aria-label','Faceted three-dimensional dice rolling on a tabletop');
  wrapper.append(canvas);
  stage.prepend(wrapper);
  stage.classList.add('workbench-mesh-stage');
  stage.dataset.state='rolling';
  const landed=stage.querySelector('[data-dice-landed]');
  if(landed){landed.hidden=true;landed.textContent='';}
  let cleanup=()=>{};
  try {
   cleanup=playTabletopRoll(stage,result,onComplete,skin);
  } catch(error) {
   wrapper.remove();stage.classList.remove('workbench-mesh-stage');
   console.error('Oathkeeper mesh renderer failed, using preserved visual fallback',error);
   if(previous?.play)return previous.play(stage,result,onComplete,skin);
   onComplete();return ()=>{};
  }
  return ()=>{
   cleanup();
   wrapper.remove();
   stage.classList.remove('workbench-mesh-stage');
  };
 }
});
globalThis.OathkeeperTabletop171=adapter;
globalThis.OathkeeperMeshWorkbench=Object.freeze({sides:supported,geometryFaces:adapter.geometryFaces});
