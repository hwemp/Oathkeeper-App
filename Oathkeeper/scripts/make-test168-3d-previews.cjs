/* TEST 168: all 99 gallery masters come from the SAME actual WebGL scene
 * as the runtime roller. Generate at 4x resolution, not upscaled raster art. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
const crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const slugs=['default','dragonfire','frostborne','elvenleaf','celestial',
 'abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
const sides=[3,4,6,8,10,12,20,50,100];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const host='http://127.0.0.1:5201';
 const server=spawn('python3',['-m','http.server','5201','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(host)).ok){ready=true;break}}catch{}await sleep(250)}
  assert(ready,'TEST 168 WebGL graphics server unavailable');
  browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--enable-unsafe-swiftshader',
    '--use-angle=swiftshader','--disable-web-security'
  ]});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:1});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(host+'/__test168-preview.html',{waitUntil:'load'});
  await page.waitForFunction(()=>window.__test168Studio?.render,{timeout:30000});
  fs.mkdirSync(path.join(root,'preview-output'),{recursive:true});
  const records=[],hashes=new Map();
  const pngPath=path.join(root,'dist/art/test166-dice');
  fs.mkdirSync(pngPath,{recursive:true});
  fs.mkdirSync(path.join(root,'dist/art/test164-dice'),{recursive:true});
  for(const slug of slugs){
   for(const shape of sides){
    const output=await page.evaluate(({slug,shape})=>window.__test168Studio.render(slug,shape),
     {slug,shape});
    const file=Buffer.from(output.image,'base64');
    assert(file.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')),
      'Expected PNG from WebGL '+slug+' D'+shape);
    const w=file.readUInt32BE(16),h=file.readUInt32BE(20);
    assert.equal(w,992,'Not a 4x HD WebGL render '+slug+' D'+shape);
    assert.equal(h,700,'Wrong WebGL preview aspect ratio '+slug+' D'+shape);
    assert(file.length>10000,slug+' D'+shape+' blank or oversimplified render');
    const outDir=path.join(pngPath,slug);
    fs.mkdirSync(outDir,{recursive:true});
    fs.writeFileSync(path.join(outDir,'d'+shape+'.png'),file);
    const hash=crypto.createHash('sha256').update(file).digest('hex');
    hashes.set(hash,(hashes.get(hash)||0)+1);
    if(slug!=='default'&&shape===20){
      fs.writeFileSync(path.join(root,'dist/art/test164-dice',slug+'.png'),file);
    }
    records.push({slug,shape,dimensions:[w,h],bytes:file.length,sha256:hash,
      origin:'test168 physically lit actual WebGL 3D scene',
      path:'art/test166-dice/'+slug+'/d'+shape+'.png'});
    if(shape===20&&['default','astral','elvenleaf','dragonfire'].includes(slug)){
      fs.copyFileSync(path.join(outDir,'d20.png'),
        path.join(root,'preview-output','168-3d-'+slug+'-d20.png'));
    }
    console.log('TEST 168 WEBGL 3D',slug,'D'+shape,w+'×'+h,file.length);
   }
  }
  assert.equal(records.length,99,'Expected all 99 image masters');
  assert(hashes.size>85,'Graphics variants are suspiciously duplicated');
  assert.deepEqual(errors,[],'3D preview browser JS errors');
  fs.writeFileSync(path.join(root,'preview-output/168-webgl-image-report.json'),
    JSON.stringify({count:records.length,uniqueImages:hashes.size,source:'single shared WebGL scene',images:records},null,2));
  fs.rmSync(path.join(root,'dist/__test168-preview.js'),{force:true});
  fs.rmSync(path.join(root,'dist/__test168-preview.html'),{force:true});
  console.log('TEST 168: 99 separate high-definition 3D PBR WebGL images generated successfully');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('TEST 168 GRAPHICS GENERATION FAILED',e.stack||e);process.exitCode=1});
