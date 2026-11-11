// Offline canvas-based three-dimensional tabletop dice. Visuals never generate or alter a result.
const PHI=(1+Math.sqrt(5))/2;
const TAU=Math.PI*2;
const normalized=v=>{const m=Math.hypot(...v)||1;return v.map(x=>x/m)};
const minus=(a,b)=>a.map((x,i)=>x-b[i]);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0);
function orient(vertices,faces){
 return faces.map(ids=>{
  const a=vertices[ids[0]],b=vertices[ids[1]],c=vertices[ids[2]];
  const center=ids.reduce((v,i)=>v.map((x,k)=>x+vertices[i][k]/ids.length),[0,0,0]);
  return dot(cross(minus(b,a),minus(c,a)),center)>=0?ids:ids.slice().reverse();
 });
}
function ico(){
 const v=[[-1,PHI,0],[1,PHI,0],[-1,-PHI,0],[1,-PHI,0],[0,-1,PHI],[0,1,PHI],[0,-1,-PHI],[0,1,-PHI],[PHI,0,-1],[PHI,0,1],[-PHI,0,-1],[-PHI,0,1]].map(normalized);
 const f=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
 return {v,f:orient(v,f)};
}
function dodeca(){
 const i=ico();
 const v=i.f.map(ids=>normalized(ids.reduce((acc,id)=>acc.map((x,k)=>x+i.v[id][k]/3),[0,0,0])));
 const f=i.v.map(axis=>{
  const x=normalized(cross(Math.abs(axis[2])<.9?[0,0,1]:[0,1,0],axis)),y=cross(axis,x);
  return i.f.map((ids,j)=>ids.some(id=>i.v[id]===axis)?j:-1).filter(j=>j>=0)
   .sort((a,b)=>Math.atan2(dot(v[a],y),dot(v[a],x))-Math.atan2(dot(v[b],y),dot(v[b],x)));
 });
 return {v,f:orient(v,f)};
}
function shape(sides){
 if(sides===4){
  const v=[[1,1,1],[-1,-1,1],[-1,1,-1],[1,-1,-1]].map(normalized);
  return {v,f:orient(v,[[0,1,2],[0,3,1],[0,2,3],[1,3,2]])};
 }
 if(sides===6){
  const v=[[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(normalized);
  return {v,f:orient(v,[[0,1,2,3],[4,5,6,7],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]])};
 }
 if(sides===8){
  const v=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  return {v,f:orient(v,[[0,2,4],[2,1,4],[1,3,4],[3,0,4],[2,0,5],[1,2,5],[3,1,5],[0,3,5]])};
 }
 if(sides===12)return dodeca();
 if(sides===20)return ico();
 // Ten-sided kite-shaped form used for D10 and paired percentile dice.
 const v=[[0,0,1.15],[0,0,-1.15]];
 for(let j=0;j<10;j++)v.push([Math.cos(j*TAU/10),Math.sin(j*TAU/10),j%2?.24:-.24]);
 const f=[];
 for(let j=0;j<10;j+=2)f.push([0,2+j,2+(j+1)%10,2+(j+2)%10]);
 for(let j=1;j<10;j+=2)f.push([1,2+j,2+(j+1)%10,2+(j+2)%10]);
 return {v:v.map(normalized),f:orient(v,f)};
}
const shapes=new Map();
function getShape(n){if(!shapes.has(n))shapes.set(n,shape(n));return shapes.get(n)}
function rotate(p,x,y,z){
 let [a,b,c]=p;let co=Math.cos(x),si=Math.sin(x);
 [b,c]=[b*co-c*si,b*si+c*co];co=Math.cos(y);si=Math.sin(y);
 [a,c]=[a*co+c*si,-a*si+c*co];co=Math.cos(z);si=Math.sin(z);
 return [a*co-b*si,a*si+b*co,c];
}
function project(p,x,y,r){
 const perspective=4.4/(4.4-p[2]*.52);
 return [x+p[0]*r*perspective,y-p[1]*r*perspective];
}
export function diceSkinPalette(skin){
 const hex=typeof skin?.accent==='string'&&/^#[0-9a-f]{6}$/i.test(skin.accent)?skin.accent:'#8f32c2';
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
 const background=typeof skin?.bg==='string'&&/^#[0-9a-f]{6}$/i.test(skin.bg)?skin.bg:'#1d1032';
 const gold=skin?.slug==='frostborne'?'#eaf1f5':skin?.slug==='celestial'?'#f4db9f':'#f0c568';
 return {rgb,background,gold,slug:skin?.slug||'default'};
}
const blend=(a,b,t)=>a.map((v,i)=>Math.round(v*(1-t)+b[i]*t));
const rgb=(a,alpha=1)=>'rgba('+a.map(v=>Math.max(0,Math.min(255,Math.round(v)))).join(',')+','+alpha+')';
function polygon(ctx,coords){
 ctx.beginPath();ctx.moveTo(coords[0][0],coords[0][1]);
 for(let j=1;j<coords.length;j++)ctx.lineTo(coords[j][0],coords[j][1]);
 ctx.closePath();
}
function drawGemFace(ctx,coords,normal,size,palette,frontValue,showNumber){
 const center=coords.reduce((p,q)=>[p[0]+q[0]/coords.length,p[1]+q[1]/coords.length],[0,0]);
 const bright=Math.max(.18,Math.min(1,.52+normal[0]*.16+normal[1]*.20+normal[2]*.30));
 const base=palette.rgb;
 const light=blend(base,[247,199,255],.34);
 const shadow=blend(base,[10,4,28],.69);
 const grd=ctx.createLinearGradient(coords[0][0],coords[0][1],coords[Math.floor(coords.length/2)][0],coords[Math.floor(coords.length/2)][1]);
 grd.addColorStop(0,rgb(blend(shadow,base,.24+bright*.40)));
 grd.addColorStop(.48,rgb(blend(shadow,light,.24+bright*.46)));
 grd.addColorStop(1,rgb(blend(shadow,base,.22+bright*.35)));
 polygon(ctx,coords);ctx.fillStyle=grd;ctx.fill();
 ctx.save();polygon(ctx,coords);ctx.clip();
 // Layered crystalline facets, replacing the old flat fill.
 coords.forEach((a,i)=>{
  const b=coords[(i+1)%coords.length],tip=[
   center[0]+(a[0]-center[0])*.21+size*.034*Math.sin(i*3.1),
   center[1]+(a[1]-center[1])*.21+size*.034*Math.cos(i*2.7)
  ];
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(tip[0],tip[1]);ctx.closePath();
  ctx.fillStyle=rgb(i%2?light:shadow,i%2?.14:.25);ctx.fill();
  ctx.strokeStyle=rgb(light,.12);ctx.lineWidth=Math.max(.6,size*.009);ctx.stroke();
 });
 const glint=ctx.createRadialGradient(center[0]-size*.25,center[1]-size*.32,size*.01,center[0],center[1],size*1.25);
 glint.addColorStop(0,'rgba(255,232,255,.17)');glint.addColorStop(.55,'rgba(235,133,255,.035)');glint.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=glint;ctx.fillRect(center[0]-size*1.5,center[1]-size*1.5,size*3,size*3);
 ctx.restore();
 // Two different metallic highlights give the beveled gold edge a dimensional look.
 polygon(ctx,coords);ctx.lineJoin='round';ctx.strokeStyle='rgba(65,20,40,.95)';ctx.lineWidth=Math.max(2,size*.093);ctx.stroke();
 ctx.strokeStyle=palette.gold;ctx.lineWidth=Math.max(1.8,size*.060);ctx.stroke();
 ctx.strokeStyle='rgba(255,246,195,.88)';ctx.lineWidth=Math.max(.75,size*.017);ctx.stroke();
 // Projected filigree at each real corner; every die geometry receives the same ornament treatment.
 coords.forEach((a,i)=>{
  const before=coords[(i-1+coords.length)%coords.length],after=coords[(i+1)%coords.length];
  const p=[a[0]+(before[0]-a[0])*.19,a[1]+(before[1]-a[1])*.19];
  const q=[a[0]+(after[0]-a[0])*.19,a[1]+(after[1]-a[1])*.19];
  const m=[a[0]+(center[0]-a[0])*.24,a[1]+(center[1]-a[1])*.24];
  ctx.strokeStyle=palette.gold;ctx.lineWidth=Math.max(1,size*.026);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.quadraticCurveTo(m[0],m[1],q[0],q[1]);ctx.stroke();
  ctx.strokeStyle='rgba(255,236,177,.79)';ctx.lineWidth=Math.max(.65,size*.012);
  ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(m[0],m[1]);ctx.stroke();
  ctx.fillStyle=palette.gold;ctx.beginPath();ctx.arc(m[0],m[1],Math.max(.75,size*.018),0,TAU);ctx.fill();
 });
 if(showNumber){
  const length=coords.reduce((v,p,i)=>v+Math.hypot(p[0]-coords[(i+1)%coords.length][0],p[1]-coords[(i+1)%coords.length][1]),0)/coords.length;
  const font=Math.max(12,Math.min(size*.63,length*.74));
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold '+Math.round(font)+'px Georgia,serif';
  ctx.shadowColor='rgba(5,1,18,.86)';ctx.shadowBlur=Math.max(3,size*.10);
  ctx.lineJoin='round';ctx.lineWidth=Math.max(2,size*.065);ctx.strokeStyle='#260d32';
  ctx.strokeText(String(frontValue),center[0],center[1]);
  ctx.shadowBlur=0;ctx.fillStyle='#ffe7a3';ctx.fillText(String(frontValue),center[0],center[1]);
  ctx.lineWidth=Math.max(.55,size*.01);ctx.strokeStyle='#c39146';ctx.strokeText(String(frontValue),center[0],center[1]);
 }
}
function drawDie(ctx,die,x,y,size,progress,finished,palette){
 const geom=getShape(die.geometry);
 const ease=1-Math.pow(1-progress,4);
 const rx=(1-ease)*TAU*(2.8+die.index*.19)+.35;
 const ry=(1-ease)*TAU*(2.2+die.index*.23)+.58;
 const rz=(1-ease)*TAU*(1.4+die.index*.13)+die.index*.38;
 const points=geom.v.map(p=>rotate(p,rx,ry,rz));
 const polys=geom.f.map(ids=>{
  const vertices=ids.map(i=>points[i]);
  const normal=normalized(cross(minus(vertices[1],vertices[0]),minus(vertices[2],vertices[0])));
  return {vertices,normal,z:vertices.reduce((v,p)=>v+p[2],0)/vertices.length};
 }).filter(f=>f.normal[2]>-.06).sort((a,b)=>a.z-b.z);
 ctx.save();
 ctx.fillStyle='rgba(1,0,10,.44)';
 ctx.beginPath();ctx.ellipse(x+3,y+size*.99,size*.81,size*.17,0,0,TAU);ctx.fill();
 const lift=progress<1?Math.abs(Math.sin(progress*TAU*2.2))*Math.pow(1-progress,1.35)*size*.69:0;
 const centerY=y-lift;
 let best=null;
 for(const f of polys){if(!best||f.normal[2]>best.normal[2])best=f;}
 for(const f of polys){
  const coords=f.vertices.map(p=>project(p,x,centerY,size));
  drawGemFace(ctx,coords,f.normal,size,palette,die.face,finished&&best===f);
 }
 ctx.restore();
}
function diceFor(result){
 const out=[],push=(geometry,face,caption)=>out.push({geometry,face:String(face),caption,index:out.length});
 if(result.mode==='official'&&result.sides===100){
  result.rolls.slice(0,6).forEach((r)=>{push(10,String(r.tens).padStart(2,'0'),'Tens');push(10,r.ones,'Ones')});
 }else{
  result.rolls.slice(0,12).forEach(r=>{
   push(result.mode==='official'&&result.sides===3?6:result.sides,r.d6||r.value,result.mode==='official'&&result.sides===3?'D6 → D3': 'D'+result.sides);
  });
 }
 return out;
}
// Returns a cleanup callback; detach-safe on every animation frame.
export function playTabletopRoll(stage,result,onComplete,skin=null){
 const palette=diceSkinPalette(skin);
 const canvas=stage?.querySelector('canvas');
 const ctx=canvas?.getContext?.('2d');
 if(!ctx||!globalThis.requestAnimationFrame){if(stage)stage.hidden=true;onComplete();return ()=>{}}
 const reduce=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(reduce){stage.hidden=true;onComplete();return ()=>{}}
 const dice=diceFor(result),duration=1650;
 let start=null,cancelled=false,frame=0;
 const finish=()=>{
  if(cancelled||!stage.isConnected)return;
  stage.dataset.state='landed';
  const values=stage.querySelector('[data-dice-landed]');
  if(values){
   values.hidden=false;
   values.textContent=result.quantity>dice.length/(result.sides===100&&result.mode==='official'?2:1)
    ?'Showing '+(result.sides===100&&result.mode==='official'?Math.floor(dice.length/2):dice.length)+' of '+result.quantity+' rolls · '+result.total+' total'
    :dice.map(d=>d.caption+' '+d.face).join(' · ');
  }
  onComplete();
 };
 function paint(now){
  if(cancelled||!stage.isConnected)return;
  if(start===null)start=now;
  const t=Math.min(1,(now-start)/duration),finished=t>=1;
  const bounds=canvas.getBoundingClientRect(),w=Math.max(1,bounds.width),h=Math.max(1,bounds.height);
  const ratio=Math.min(2,globalThis.devicePixelRatio||1),pxW=Math.round(w*ratio),pxH=Math.round(h*ratio);
  if(canvas.width!==pxW||canvas.height!==pxH){canvas.width=pxW;canvas.height=pxH}
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,w,h);
  const sky=ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,palette.background);sky.addColorStop(.5,'#27203d');sky.addColorStop(1,'#100e1d');
  ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=palette.gold;ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(w/2,h*.55,w*.46,h*.37,0,0,TAU);ctx.stroke();
  ctx.strokeStyle='rgba(236,204,143,.20)';ctx.lineWidth=1;
  ctx.beginPath();ctx.ellipse(w/2,h*.55,w*.43,h*.34,0,0,TAU);ctx.stroke();
  const count=dice.length,cols=Math.min(count,4),rows=Math.ceil(count/cols);
  const size=Math.max(14,Math.min(count===1?100:62,w/(cols*(count===1?3.4:3.0)),h/(rows*(count===1?2.7:3.3))));
  dice.forEach((die,j)=>{
   const col=j%cols,row=Math.floor(j/cols);
   const targetX=(col+.5)*w/cols,targetY=(row+.55)*h/rows;
   const slide=(1-Math.pow(1-t,3));
   const x=targetX+(j%2?-1:1)*(1-slide)*w*.36;
   const y=targetY+(1-slide)*(-h*.36);
   drawDie(ctx,die,x,y,size,t,finished,palette);
  });
  if(finished)finish();else frame=requestAnimationFrame(paint);
 }
 frame=requestAnimationFrame(paint);
 return ()=>{cancelled=true;cancelAnimationFrame(frame)};
}
