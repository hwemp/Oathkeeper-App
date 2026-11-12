/* Oathkeeper TEST 171 — dedicated gameplay tabletop presentation.
 * The Store keeps its exact approved 12-frame GIF showcase.
 * This renderer does NOT choose a die face, alter RNG, or change totals.
 * It animates original illustrated die assets in a tabletop toss/bounce/settle,
 * and displays the already-calculated real result after landing.
 */
(function(){
'use strict';
const THEMES=new Set(['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire']);
const DURATION=1750;
const geometryFor=die=>Number(die?.geometry)||20;
const skinFor=skin=>THEMES.has(skin?.slug)?skin.slug:'astral';
const getArt=(slug,geometry,spin)=>{
  if(geometry===20){
    return 'art/exact-store/roll/'+slug+(spin?(slug==='astral'?'-original.gif':'.webp'):'-still.webp');
  }
  return 'art/test169-dice/'+slug+'/d'+geometry+'.webp';
};
function reduced(){
  return !!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}
function previewNodes(dice){
  const count=Math.min(4,dice.length);
  return dice.slice(0,count).map((d,index)=>({die:d,index}));
}
function createRoll(stage,result,onComplete,skin){
  if(!stage || !stage.isConnected){onComplete();return ()=>{};}
  const original=stage.querySelector('canvas');
  if(original)original.remove();
  const slug=skinFor(skin);
  const resultFaces=Array.isArray(result?.rolls)?result.rolls:[];
  const dice=previewNodes(resultFaces.map((r,index)=>({
    geometry:result.sides===3?3:Number(result.sides)||20,
    face:Math.trunc(Number(r.value))||1,
    caption:'D'+result.sides,
    index
  })));
  // Official percentile gameplay consists of one tens and one ones die for
  // each roll, while the secure result remains untouched.
  if(result.sides===100 && result.mode==='official'){
    const percentDice=[];
    resultFaces.slice(0,2).forEach((r,index)=>{
      percentDice.push({geometry:10,face:Number(r.tens)||0,caption:'Tens',index:index*2});
      percentDice.push({geometry:10,face:Number(r.ones)||0,caption:'Ones',index:index*2+1});
    });
    dice.splice(0,dice.length,...previewNodes(percentDice));
  }
  if(!dice.length){
    onComplete();return ()=>{};
  }
  stage.dataset.test171Tabletop='active';
  stage.classList.add('test171-gameplay-stage');
  const outer=document.createElement('div');
  outer.className='test171-ornate-frame';
  outer.setAttribute('aria-label','Dice rolling onto a fantasy tabletop');
  outer.innerHTML='<div class="test171-surface"><div class="test171-rune-ring" aria-hidden="true"></div><div class="test171-die-field"></div><div class="test171-surface-label">TABLETOP ROLL</div></div>';
  const field=outer.querySelector('.test171-die-field');
  const elements=[];
  const multi=dice.length>1;
  for(const {die,index} of dice){
    const wrap=document.createElement('div');
    wrap.className='test171-die';
    wrap.dataset.dieGeometry=String(geometryFor(die));
    wrap.style.setProperty('--idx',String(index));
    const shape=geometryFor(die);
    const art=document.createElement('img');
    art.alt='';art.draggable=false;
    art.className='test171-die-art';
    art.decoding='async';
    art.src=getArt(slug,shape,true);
    wrap.appendChild(art);
    const shadow=document.createElement('div');
    shadow.className='test171-contact-shadow';
    shadow.setAttribute('aria-hidden','true');
    wrap.appendChild(shadow);
    field.appendChild(wrap);
    elements.push({wrap,art,die,index});
  }
  if(resultFaces.length>dice.length/((result.sides===100&&result.mode==='official')?2:1)){
    const badge=document.createElement('span');
    badge.className='test171-extra-dice';
    badge.textContent='+'+String(resultFaces.length-Math.min(resultFaces.length,4))+' more';
    field.appendChild(badge);
  }
  stage.prepend(outer);
  const landed=stage.querySelector('[data-dice-landed]');
  if(landed){landed.hidden=true;landed.textContent='';}
  const motionOff=reduced();
  let cancelled=false,finished=false;
  const activeAnimations=[];
  const initial=Date.now();
  const finish=()=>{
    if(cancelled||finished)return;
    finished=true;
    stage.dataset.state='landed';
    outer.classList.add('test171-landed');
    for(const {wrap,art,die} of elements){
      // The settled artwork is still the approved illustrated die. The actual
      // rolled face is always exposed separately from secure result.rolls.
      art.src=getArt(slug,geometryFor(die),false);
      wrap.style.transform='';
    }
    const lines=resultFaces.map((r,index)=>{
      const d6=result.mode==='official'&&result.sides===3?' (D6 '+r.d6+')':'';
      const pct=result.mode==='official'&&result.sides===100?
        ' ('+String(r.tens).padStart(2,'0')+'+'+r.ones+')':'';
      return 'D'+result.sides+' '+r.value+d6+pct;
    });
    if(landed){
      landed.hidden=false;
      landed.textContent=lines.length>8
        ?lines.slice(0,8).join(' · ')+' · +'+(lines.length-8)+' more · Total '+result.total
        :lines.join(' · ');
    }
    try{onComplete();}catch(e){console.error('TEST 171 roll completion callback',e);}
  };
  if(!motionOff){
    elements.forEach(({wrap,art,index},i)=>{
      const side=i%2===0?-1:1;
      const horizontal=multi?(i%2===0?-45:45):0;
      const vertical=multi?(i<2?-36:36):0;
      const spin=4*360+index*79;
      const keyframes=[
        {offset:0,transform:'translate3d('+(side*116)+'px,-112px,110px) rotateZ(-'+(spin+45)+'deg) rotateY(58deg) scale(.69)',filter:'brightness(1.28) drop-shadow(0 24px 13px #0a0613a3)'},
        {offset:.24,transform:'translate3d('+(side*64)+'px,48px,19px) rotateZ(-'+(spin*.68)+'deg) rotateY(130deg) scale(.98)',filter:'brightness(1.06) drop-shadow(0 8px 8px #0009)'},
        {offset:.42,transform:'translate3d('+(side*42)+'px,-45px,48px) rotateZ(-'+(spin*.42)+'deg) rotateY(90deg) scale(.87)',filter:'brightness(1.18) drop-shadow(0 21px 10px #0009)'},
        {offset:.61,transform:'translate3d('+(side*23)+'px,22px,7px) rotateZ(-'+(spin*.24)+'deg) rotateY(42deg) scale(1.02)',filter:'brightness(.96) drop-shadow(0 5px 5px #0009)'},
        {offset:.75,transform:'translate3d('+(side*15)+'px,-18px,24px) rotateZ(-'+(spin*.13)+'deg) rotateY(19deg) scale(.95)',filter:'brightness(1.03) drop-shadow(0 12px 9px #0009)'},
        {offset:.9,transform:'translate3d('+(side*8)+'px,5px,3px) rotateZ(-'+(spin*.04)+'deg) rotateY(9deg) scale(1)',filter:'brightness(.98) drop-shadow(0 5px 4px #0009)'},
        {offset:1,transform:'translate3d('+horizontal+'px,'+vertical+'px,0) rotateZ(0deg) rotateY(0deg) scale(1)',filter:'brightness(1) drop-shadow(0 5px 4px #000b)'}
      ];
      const animation=wrap.animate(keyframes,{duration:DURATION,easing:'linear',fill:'forwards',iterations:1});
      activeAnimations.push(animation);
      const shadow=wrap.querySelector('.test171-contact-shadow');
      if(shadow)activeAnimations.push(shadow.animate([
        {transform:'scale(.43)',opacity:.12},
        {transform:'scale(1.16)',opacity:.67,offset:.24},
        {transform:'scale(.61)',opacity:.20,offset:.42},
        {transform:'scale(1)',opacity:.61,offset:.61},
        {transform:'scale(.82)',opacity:.3,offset:.75},
        {transform:'scale(1)',opacity:.55},
      ],{duration:DURATION,fill:'forwards'}));
    });
  }
  const timer=globalThis.setTimeout(finish,motionOff?0:DURATION+55);
  return ()=>{
    cancelled=true;
    globalThis.clearTimeout(timer);
    activeAnimations.forEach(a=>{try{a.cancel();}catch{}});
    outer.remove();
    stage.classList.remove('test171-gameplay-stage');
  };
}
globalThis.OathkeeperTabletop171=Object.freeze({play:createRoll});
})();