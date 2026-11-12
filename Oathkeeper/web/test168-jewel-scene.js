/* Oathkeeper TEST-BRANCH-168.
 * True offline WebGL dice. Rendering only: NEVER rolls dice or mutates results.
 * Meshes use the original protected tabletop shape() via the generated
 * geometry-only adapter. Preview PNGs and live animation share this scene. */
import * as THREE from 'three';
import {test168Mesh} from './test168-geometry.js';
import {SELECTED_DICE} from './store-dice-catalog.js';

const TAU=Math.PI*2;
const THEMES=Object.freeze({
 default:{color:'#7423cc',rim:'#f1cb79',bg:'#130a28',motif:'star'},
 dragonfire:{color:'#e2472b',rim:'#f8c579',bg:'#270813',motif:'flame'},
 frostborne:{color:'#31a9ef',rim:'#e8faff',bg:'#07162f',motif:'snow'},
 elvenleaf:{color:'#28a45c',rim:'#e2cd85',bg:'#062918',motif:'tree'},
 celestial:{color:'#b8a4f2',rim:'#ffdc90',bg:'#272047',motif:'sun'},
 abyssal:{color:'#7e1ac1',rim:'#c7f6f0',bg:'#170a32',motif:'rune'},
 'gold-forged':{color:'#c79b3f',rim:'#ffe09c',bg:'#2a1604',motif:'shield'},
 necrotic:{color:'#41b45f',rim:'#c9e9a4',bg:'#0a2116',motif:'skull'},
 astral:{color:'#9d43ed',rim:'#f5cd9f',bg:'#1b0a3a',motif:'spiral'},
 oceanic:{color:'#1298bd',rim:'#b7edf6',bg:'#062840',motif:'wave'},
 sunfire:{color:'#fb822b',rim:'#ffdc7d',bg:'#321004',motif:'sun'}
});
const shapes=Object.freeze([3,4,6,8,10,12,20,50,100]);
const palette=slug=>THEMES[slug]||THEMES.default;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const v=p=>new THREE.Vector3(...p);
const gold=(c)=>new THREE.Color(c);
const centerOfFace=(face,verts)=>face.reduce((a,id)=>a.add(v(verts[id])),new THREE.Vector3()).divideScalar(face.length);
const normalOfFace=(face,verts)=>{
 const a=v(verts[face[0]]),b=v(verts[face[1]]),c=v(verts[face[2]]);
 return new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).normalize();
};
const avgEdge=(face,verts)=>{
 let n=0;
 for(let i=0;i<face.length;i++)n+=v(verts[face[i]]).distanceTo(v(verts[face[(i+1)%face.length]]));
 return n/face.length;
};
function makeFaceGlyph(value,theme,dense=false){
 const width=dense?96:256;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=width;
 const c=canvas.getContext('2d');
 if(!c)throw new Error('Canvas for face inscription unavailable');
 c.clearRect(0,0,width,width);
 const u=width/256;c.scale(u,u);
 c.lineCap='round';c.lineJoin='round';
 const metal=theme.rim;
 const border=(x,y,s,angle=0)=>{
   c.save();c.translate(x,y);c.rotate(angle);c.strokeStyle=metal;c.lineWidth=3;
   c.beginPath();c.moveTo(0,s);c.quadraticCurveTo(s*.13,s*.25,s,0);c.stroke();
   c.beginPath();c.moveTo(s*.12,s*.63);c.lineTo(s*.31,s*.4);c.lineTo(s*.63,s*.18);c.stroke();
   c.restore();
 };
 border(15,15,53);border(241,15,53,Math.PI/2);
 border(241,241,53,Math.PI);border(15,241,53,-Math.PI/2);
 c.save();c.translate(128,128);c.globalAlpha=.4;c.strokeStyle=metal;c.lineWidth=3;
 switch(theme.motif){
  case 'star':
  case 'sun':for(let i=0;i<12;i++){const a=i*TAU/12;c.beginPath();c.moveTo(Math.cos(a)*62,Math.sin(a)*62);c.lineTo(Math.cos(a)*81,Math.sin(a)*81);c.stroke()}break;
  case 'spiral':c.beginPath();for(let i=0;i<200;i++){const t=i/199*TAU*2.3,r=3+i/199*68;const x=Math.cos(t)*r,y=Math.sin(t)*r;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();break;
  case 'tree':c.beginPath();c.moveTo(0,62);c.lineTo(0,-55);c.moveTo(-47,-3);c.lineTo(0,-65);c.lineTo(47,-3);c.stroke();break;
  case 'snow':for(let i=0;i<6;i++){const a=i*TAU/6;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*80,Math.sin(a)*80);c.stroke()}break;
  case 'flame':c.beginPath();c.moveTo(-29,61);c.quadraticCurveTo(-66,-14,15,-68);c.quadraticCurveTo(5,-12,34,16);c.quadraticCurveTo(51,54,-29,61);c.stroke();break;
  case 'wave':for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(-82,k*23);c.bezierCurveTo(-45,k*23-36,5,k*23+36,82,k*23);c.stroke()}break;
  default:c.beginPath();c.arc(0,0,68,0,TAU);c.stroke();
 }
 c.restore();
 c.textAlign='center';c.textBaseline='middle';
 const str=String(value),font=str.length>=3?83:str.length===2?107:133;
 c.font='bold '+font+'px Georgia,serif';
 c.shadowColor='#f6c86b';c.shadowBlur=15;c.fillStyle='#fff7cf';c.fillText(str,128,133);
 c.shadowBlur=0;c.lineWidth=13;c.strokeStyle='#210b24';c.strokeText(str,128,133);
 c.lineWidth=5;c.strokeStyle='#d9963c';c.strokeText(str,128,133);
 c.fillStyle='#fff4c5';c.fillText(str,128,132);
 const tex=new THREE.CanvasTexture(canvas);
 tex.colorSpace=THREE.SRGBColorSpace;
 tex.anisotropy=4;
 return tex;
}
function createDieMesh(sides,theme){
 const mesh=test168Mesh(sides);
 const verts=mesh.v,faces=mesh.f;
 const positions=[];
 for(const face of faces){
  for(let i=1;i<face.length-1;i++){
   for(const ix of [face[0],face[i],face[i+1]])positions.push(...verts[ix]);
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.computeVertexNormals();
 const group=new THREE.Group();
 const bodyMaterial=new THREE.MeshPhysicalMaterial({
  color:new THREE.Color(theme.color),
  metalness:.19,roughness:.19,clearcoat:1,clearcoatRoughness:.06,
  transmission:.18,thickness:1.1,ior:1.52,transparent:false,
  envMapIntensity:1.4,side:THREE.DoubleSide,flatShading:true,
  emissive:new THREE.Color(theme.color),emissiveIntensity:.09
 });
 const body=new THREE.Mesh(geometry,bodyMaterial);
 body.castShadow=true;body.receiveShadow=true;
 group.add(body);
 // A smaller jewel interior adds the refraction and depth of polished crystal.
 const inner=new THREE.Mesh(geometry.clone(),new THREE.MeshPhysicalMaterial({
  color:new THREE.Color(theme.color),metalness:.02,roughness:.13,
  clearcoat:1,transparent:true,opacity:.22,
  emissive:new THREE.Color(theme.color),emissiveIntensity:.23,
  side:THREE.BackSide,depthWrite:false
 }));
 inner.scale.setScalar(.88);group.add(inner);
 const edgePairs=new Set(),edges=[];
 faces.forEach(face=>face.forEach((i,j)=>{
  const k=face[(j+1)%face.length],key=[Math.min(i,k),Math.max(i,k)].join(':');
  if(!edgePairs.has(key)){edgePairs.add(key);edges.push([i,k]);}
 }));
 const trimMaterial=new THREE.MeshStandardMaterial({
  color:new THREE.Color(theme.rim),metalness:1,roughness:.16,
  emissive:new THREE.Color(theme.rim),emissiveIntensity:.10
 });
 const cylinder=new THREE.CylinderGeometry(1,1,1,7);
 const rim=new THREE.InstancedMesh(cylinder,trimMaterial,edges.length);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0);
 const radius=sides>=50?.0054:.014;
 for(let i=0;i<edges.length;i++){
  const [p,q]=edges[i].map(id=>v(verts[id]));
  const mid=p.clone().add(q).multiplyScalar(.5),axis=q.clone().sub(p);
  dummy.position.copy(mid.clone().multiplyScalar(1.01));
  dummy.quaternion.setFromUnitVectors(up,axis.clone().normalize());
  dummy.scale.set(radius,axis.length()*1.015,radius);
  dummy.updateMatrix();rim.setMatrixAt(i,dummy.matrix);
 }
 rim.instanceMatrix.needsUpdate=true;group.add(rim);
 if(sides<50){
  const bead=new THREE.IcosahedronGeometry(.027,0);
  const fasteners=new THREE.InstancedMesh(bead,trimMaterial,verts.length);
  for(let i=0;i<verts.length;i++){
   dummy.position.copy(v(verts[i]).multiplyScalar(1.015));
   dummy.quaternion.identity();dummy.scale.setScalar(1);dummy.updateMatrix();
   fasteners.setMatrixAt(i,dummy.matrix);
  }
  fasteners.instanceMatrix.needsUpdate=true;
  group.add(fasteners);
 }
 const plane=new THREE.PlaneGeometry(1,1);
 const labels=[];
 faces.forEach((face,i)=>{
  if(sides===3&&i>=3)return;
  const normal=normalOfFace(face,verts),center=centerOfFace(face,verts);
  const size=avgEdge(face,verts)*(sides===100||sides===50?.72:.62);
  const texture=makeFaceGlyph(i+1,theme,sides>=50);
  const material=new THREE.MeshBasicMaterial({
   map:texture,transparent:true,depthWrite:false,side:THREE.DoubleSide,
   polygonOffset:true,polygonOffsetFactor:-2,color:0xffffff
  });
  const mark=new THREE.Mesh(plane,material);
  mark.position.copy(center).addScaledVector(normal,.022);
  mark.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),normal);
  mark.scale.set(size,size,1);group.add(mark);
  labels.push(mark);
 });
 group.userData={faces,vertices:verts,sides};
 return group;
}
function disposeGroup(group){
 group.traverse(obj=>{
  if(obj.isMesh){
   obj.geometry?.dispose();
   if(Array.isArray(obj.material))obj.material.forEach(m=>{m.map?.dispose();m.dispose()});
   else {obj.material?.map?.dispose();obj.material?.dispose()}
  }
 });
}
export function hasWebGL(){
 if(typeof document==='undefined')return false;
 try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'))}
 catch{return false}
}
export class JewelDiceScene{
 constructor(canvas,opts={}){
  this.canvas=canvas;
  this.capture=!!opts.capture;
  this.renderer=new THREE.WebGLRenderer({
   canvas,antialias:true,alpha:true,preserveDrawingBuffer:!!opts.capture,
   powerPreference:'high-performance'
  });
  this.renderer.setPixelRatio(Math.min(this.capture?4:2,window.devicePixelRatio||1));
  this.renderer.setSize(opts.width||248,opts.height||175,false);
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.75;
  this.scene=new THREE.Scene();
  this.camera=new THREE.PerspectiveCamera(33,(opts.width||248)/(opts.height||175),.1,100);
  this.camera.position.set(0,1.05,6.4);this.camera.lookAt(0,0,0);
  const lights=[
   new THREE.AmbientLight('#e2d4fd',1.65),
   new THREE.DirectionalLight('#fff2cc',5.5),
   new THREE.DirectionalLight('#bb83ff',3.2),
   new THREE.PointLight('#fabc69',25,10)
  ];
  lights[1].position.set(-3,4,6);lights[2].position.set(3,-1,-2);lights[3].position.set(2,2,3);
  lights.forEach(light=>this.scene.add(light));
  this.root=new THREE.Group();this.scene.add(this.root);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.5,.018,8,128),
   new THREE.MeshBasicMaterial({color:'#aa62f4',transparent:true,opacity:.76}));
  ring.rotation.x=Math.PI/2.13;ring.position.y=-1.24;ring.scale.set(1.28,.66,1);
  this.scene.add(ring);this.ring=ring;
  const ring2=ring.clone();
  ring2.material=ring.material.clone();ring2.material.color.set('#f5bc71');
  ring2.rotation.x=Math.PI/2.04;ring2.scale.set(1.44,.8,1);
  ring2.position.y=-1.32;this.scene.add(ring2);this.ring2=ring2;
  const pedestal=new THREE.Mesh(new THREE.CircleGeometry(1.65,64),
   new THREE.MeshBasicMaterial({color:'#3b174e',transparent:true,opacity:.4,side:THREE.DoubleSide}));
  pedestal.rotation.x=-Math.PI/2;pedestal.position.y=-1.40;this.scene.add(pedestal);
  this.pedestal=pedestal;
  this.dice=[];
  this.sides=20;this.theme='default';this.count=1;
  this._scratch=new THREE.Quaternion();
  this._z=new THREE.Vector3(0,0,1);
 }
 setSize(width,height,dpr=window.devicePixelRatio||1){
  const w=Math.max(1,Math.round(width)),h=Math.max(1,Math.round(height));
  this.renderer.setPixelRatio(Math.min(this.capture?4:2,Math.max(1,dpr)));
  this.renderer.setSize(w,h,false);
  this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
 }
 setDice(sides,slug='default',count=1){
  if(!shapes.includes(Number(sides)))throw Error('Unsupported dice shape: '+sides);
  const skin=palette(slug);
  for(const obj of this.dice){this.root.remove(obj);disposeGroup(obj)}
  this.dice=[];
  this.sides=Number(sides);this.theme=slug;
  this.count=clamp(Number(count)||1,1,12);
  for(let i=0;i<this.count;i++){
   const mesh=createDieMesh(this.sides,skin);
   const cols=Math.min(4,this.count),rows=Math.ceil(this.count/cols);
   const col=i%cols,row=Math.floor(i/cols);
   const mag=this.count===1?1.13:this.count<=4?.64:.39;
   mesh.scale.setScalar(mag);
   mesh.position.set((col-(cols-1)/2)*(this.count<=4?1.7:1.07),
      ((rows-1)/2-row)*(this.count<=4?1.4:.98),0);
   mesh.userData.baseY=mesh.position.y;
   this.root.add(mesh);this.dice.push(mesh);
  }
  this.ring.visible=this.count===1;
  this.ring2.visible=this.count===1;
  this.pedestal.visible=this.count===1;
 }
 alignFace(mesh,value){
  const faces=mesh.userData.faces,verts=mesh.userData.vertices;
  const faceIndex=Math.max(0,Math.min(faces.length-1,Math.trunc(Number(value)||1)-1));
  const normal=normalOfFace(faces[faceIndex],verts);
  const target=new THREE.Vector3(.035,.14,1).normalize();
  return new THREE.Quaternion().setFromUnitVectors(normal,target);
 }
 render(progress=1,finalValues=null){
  const t=clamp(progress,0,1),ease=1-Math.pow(1-t,4);
  const list=Array.isArray(finalValues)?finalValues:[];
  for(let i=0;i<this.dice.length;i++){
   const die=this.dice[i];
   const face=list[i]??(this.sides===100?75:this.sides===50?35:this.sides);
   const finalQuat=this.alignFace(die,face);
   const spin=new THREE.Quaternion().setFromEuler(
    new THREE.Euler((1-ease)*TAU*(2.8+i*.19),
      (1-ease)*TAU*(2.2+i*.23),
      (1-ease)*TAU*(1.4+i*.13),'XYZ'));
   die.quaternion.copy(finalQuat).multiply(spin);
   const lift=t<1?Math.abs(Math.sin(t*TAU*2.2))*Math.pow(1-t,1.35)*.65:0;
   die.position.y=die.userData.baseY+lift*.30;
   die.position.z=lift*.35;
  }
  this.renderer.render(this.scene,this.camera);
 }
 exportPNG(){return this.canvas.toDataURL('image/png')}
 dispose(){
  for(const obj of this.dice)disposeGroup(obj);
  this.dice=[];
  this.ring.geometry.dispose();this.ring.material.dispose();this.ring2.material.dispose();
  this.pedestal.geometry.dispose();this.pedestal.material.dispose();
  this.renderer.dispose();
 }
}
export function themeSlugForCatalogue(slug){return SELECTED_DICE.some(s=>s.slug===slug)?slug:'default'}
