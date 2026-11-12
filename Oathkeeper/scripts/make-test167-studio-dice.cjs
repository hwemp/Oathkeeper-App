/* TEST 167: generate ONE graphics master per theme/shape from the protected
 * geometry and high-resolution materials; zero random snapshot poses.
 * The existing Store, bundle and Dice page already share these 99 image paths. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const ROOT=path.resolve(__dirname,'..');
const DIST=path.join(ROOT,'dist');
const HOST='http://127.0.0.1:5198';
const PORT='5198';
const SIDES=[3,4,6,8,10,12,20,50,100];
const SKINS=['default','dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const hash=buf=>crypto.createHash('sha256').update(buf).digest('hex');
(async()=>{
 const source=path.join(ROOT,'web/dice-tabletop.js');
 const uv=path.join(ROOT,'web/d20-face-textures.js');
 const addon=path.join(ROOT,'scripts/test167-studio-renderer-addon.mjs');
 const out=path.join(DIST,'__test167-studio');
 fs.mkdirSync(out,{recursive:true});
 const original=fs.readFileSync(source);
 const shaOriginal=hash(original);
 // Concatenate, never search-replace. Every original function is unmodified.
 fs.writeFileSync(path.join(out,'dice-tabletop.js'),
   Buffer.concat([original,Buffer.from('\n'),fs.readFileSync(addon)]));
 fs.copyFileSync(uv,path.join(out,'d20-face-textures.js'));
 fs.copyFileSync(path.join(ROOT,'web/store-dice-catalog.js'),
   path.join(out,'store-dice-catalog.js'));
 fs.writeFileSync(path.join(out,'index.html'),
   '<!doctype html><html><meta charset="utf-8"><style>body{margin:0;background:#100d1d}canvas{width:248px;height:175px;display:block}</style><canvas id="studio"></canvas></html>');
 assert.equal(hash(fs.readFileSync(source)),shaOriginal,'Protected roller source was changed');
 const server=spawn('python3',['-m','http.server',PORT,'--directory',DIST],{stdio:'ignore'});
 let browser;
 try{
  let started=false;
  for(let i=0;i<100;i++){
   try{if((await fetch(HOST+'/__test167-studio/')).ok){started=true;break}}catch{}
   await sleep(150);
  }
  assert(started,'Preview studio server unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:360,height:480},deviceScaleFactor:1});
  const problems=[];
  page.on('pageerror',e=>problems.push(e.message));
  await page.goto(HOST+'/__test167-studio/',{waitUntil:'load'});
  const output=path.join(DIST,'art/test166-dice');
  const originals=path.join(DIST,'art/test164-dice');
  fs.mkdirSync(output,{recursive:true});
  fs.mkdirSync(originals,{recursive:true});
  fs.mkdirSync(path.join(ROOT,'preview-output'),{recursive:true});
  const data=[];
  for(const skin of SKINS){
   for(const sides of SIDES){
    const r=await page.evaluate(async({skin,sides})=>{
     const [m,c]=await Promise.all([
      import('./dice-tabletop.js'),import('./store-dice-catalog.js')
     ]);
     const theme=skin==='default'?null:c.SELECTED_DICE.find(x=>x.slug===skin);
     if(skin!=='default'&&!theme)throw new Error('Unknown theme '+skin);
     const canvas=document.querySelector('#studio');
     const metrics=await m.drawApprovedStudioDie(canvas,sides,theme);
     const ctx=canvas.getContext('2d');
     const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
     // Nontransparent pixels must be large enough to form a legible die,
     // but cannot touch the edges (avoids skew/cropping into the selection).
     let minX=canvas.width,minY=canvas.height,maxX=0,maxY=0,count=0;
     let vivid=0;
     for(let y=0;y<canvas.height;y+=2){
      for(let x=0;x<canvas.width;x+=2){
       const ix=(y*canvas.width+x)*4;
       if(rgba[ix+3]>=110){
        minX=Math.min(minX,x);maxX=Math.max(maxX,x);
        minY=Math.min(minY,y);maxY=Math.max(maxY,y);
        count++;
        if(Math.max(rgba[ix],rgba[ix+1],rgba[ix+2])-
            Math.min(rgba[ix],rgba[ix+1],rgba[ix+2])>20)vivid++;
       }
      }
     }
     return {metrics,box:[minX,minY,maxX,maxY],count,vivid,
       image:canvas.toDataURL('image/png').split(',')[1]};
    },{skin,sides});
    const buffer=Buffer.from(r.image,'base64');
    assert.equal(r.metrics.width,992);
    assert.equal(r.metrics.height,700);
    assert(r.count>5000,skin+' D'+sides+' too little visible artwork');
    assert(r.vivid>1100,skin+' D'+sides+' colors missing');
    // At 4x output, protect 8px logical margins on all sides.
    const b=r.box;
    assert(b[0]>24&&b[1]>18&&b[2]<968&&b[3]<682,
      skin+' D'+sides+' image touches frame: '+JSON.stringify(b));
    const folder=path.join(output,skin);
    fs.mkdirSync(folder,{recursive:true});
    const filepath=path.join(folder,'d'+sides+'.png');
    fs.writeFileSync(filepath,buffer);
    if(skin!=='default'&&sides===20){
     fs.writeFileSync(path.join(originals,skin+'.png'),buffer);
    }
    data.push({skin,sides,dimensions:[992,700],box:b,
      bytes:buffer.length,sha256:hash(buffer),
      studio:'fixed pose from unmodified drawDie()',
      originalSourceSha256:shaOriginal,
      path:'art/test166-dice/'+skin+'/d'+sides+'.png'});
    console.log('TEST 167 STUDIO',skin,'D'+sides,JSON.stringify(b),buffer.length);
   }
  }
  assert.equal(data.length,99);
  assert.deepEqual(problems,[],'Browser runtime errors while rendering studio masters');
  const report=path.join(ROOT,'preview-output/167-studio-dice-report.json');
  fs.writeFileSync(report,JSON.stringify({
   originalRollerSha256:shaOriginal,
   imageDimensions:[992,700],
   staticPose:true,
   all:99,
   images:data
  },null,2));
  // Never ship the temporary source files used only to generate the PNGs.
  fs.rmSync(out,{recursive:true,force:true});
  console.log('TEST 167 GENERATED 99 FIXED-POSE MASTERS; approved roller unchanged');
 } finally {
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('TEST 167 STUDIO FAILED',e.stack||e);process.exitCode=1});
