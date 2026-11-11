import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {dicePage} from '../web/dice-ui.js';
import {playTabletopRoll} from '../web/dice-tabletop.js';

const result=(sides,mode='official')=>({
 sides,mode,quantity:1,modifier:0,
 rolls:[sides===100&&mode==='official'?{value:100,tens:0,ones:0}:sides===3&&mode==='official'?{value:2,d6:4}:{value:Math.min(sides,4)}],
 subtotal:sides===100&&mode==='official'?100:sides===3&&mode==='official'?2:Math.min(sides,4),
 total:sides===100&&mode==='official'?100:sides===3&&mode==='official'?2:Math.min(sides,4),
});

test('the dice page keeps percentile dice but drops the static percentile example',()=>{
 const idle=dicePage({mode:'official',sides:100,quantity:1,modifier:0,result:null},[],false);
 assert.match(idle,/D100 · Percentile/);
 assert.doesNotMatch(idle,/Percentile: 00 \+ 0 = 100/);
 assert.doesNotMatch(idle,/id="diceTabletop"/);
 const rolling=dicePage({mode:'official',sides:100,quantity:1,modifier:0,result:result(100),justRolled:true},[],true);
 assert.match(rolling,/id="diceTabletop"/);
 assert.match(rolling,/aria-busy="true"/);
 assert.match(rolling,/data-roll-reveal hidden/);
 assert.match(rolling,/>…<\/strong>/);
 assert.match(rolling,/Tens|Percentile rolls/);
 const instant=dicePage({mode:'official',sides:100,quantity:1,modifier:0,result:result(100),justRolled:true},[],false);
 assert.doesNotMatch(instant,/id="diceTabletop"/);
 assert.match(instant,/>100<\/strong>/);
});

test('3D tabletop draws faceted solids and resolves results after normal-speed tumbling',()=>{
 const oldRAF=globalThis.requestAnimationFrame,oldCAF=globalThis.cancelAnimationFrame,oldMM=globalThis.matchMedia,oldPixel=globalThis.devicePixelRatio;
 try{
  for(const sides of [4,6,8,10,12,20,100]){
   const d=new JSDOM('<div id="stage"><canvas></canvas><p data-dice-landed hidden></p></div>');
   const stage=d.window.document.querySelector('#stage');
   let paints=0,gold=0,finishCount=0,now=0;
   const canvas=stage.querySelector('canvas');
   const ctx={
    setTransform(){},clearRect(){},fillRect(){},beginPath(){},ellipse(){},stroke(){gold++},
    fill(){paints++},moveTo(){},lineTo(){},closePath(){},arc(){},save(){},restore(){},clip(){},quadraticCurveTo(){},
    strokeText(){},fillText(){},createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}
   };
   canvas.getContext=()=>ctx;
   canvas.getBoundingClientRect=()=>({width:380,height:220});
   const frames=[];
   globalThis.requestAnimationFrame=fn=>{frames.push(fn);return frames.length};
   globalThis.cancelAnimationFrame=()=>{};
   globalThis.matchMedia=()=>({matches:false});
   globalThis.devicePixelRatio=1;
   const cleanup=playTabletopRoll(stage,result(sides),()=>{finishCount++});
   for(now of [0,550,1100,1650]){
    const next=frames.shift();
    assert.equal(typeof next,'function','frame scheduled for D'+sides);
    next(now);
   }
   assert(paints>5,'3D faces are drawn for D'+sides);
   assert(gold>5,'gold outlines are drawn for D'+sides);
   assert.equal(finishCount,1,'single resolved result for D'+sides);
   assert.equal(stage.dataset.state,'landed');
   assert.equal(stage.querySelector('[data-dice-landed]').hidden,false);
   cleanup();
   d.window.close();
  }
 }finally{
  if(oldRAF===undefined)delete globalThis.requestAnimationFrame;else globalThis.requestAnimationFrame=oldRAF;
  if(oldCAF===undefined)delete globalThis.cancelAnimationFrame;else globalThis.cancelAnimationFrame=oldCAF;
  if(oldMM===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=oldMM;
  if(oldPixel===undefined)delete globalThis.devicePixelRatio;else globalThis.devicePixelRatio=oldPixel;
 }
});

test('coin purse keeps each denomination full width with the readable app typeface',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 const app=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(css,/body \.coin-purse-grid\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/body \.coin-purse-grid \.coin-stepper:last-child:nth-child\(odd\)\{grid-column:auto;justify-self:stretch;width:100%\}/);
 assert.match(css,/body \.coin-amount\{font-family:var\(--readable-fantasy\)!important/);
 assert.match(app,/\[\['cp','Copper'\],\['sp','Silver'\],\['ep','Electrum'\],\['gp','Gold'\],\['pp','Platinum'\]\]/);
 assert.match(app,/<span>\$\{c\.hp\}\/\$\{maxhp\(\)\}<\/span>/);
});
