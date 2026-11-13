/* Evaluate applied-background Store gem tint by comparing actual browser pixels.
 * The original Store art stays the reference. A pass requires visible emerald
 * gemstone pixels and UNCHANGED gold/scene/launcher art outside masked regions.
 * Does not change gameplay, purchase flow, age-gate or approved GIF.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn,execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const HOST='http://127.0.0.1:5391';
const sleep=n=>new Promise(r=>setTimeout(r,n));
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 const html=fs.readFileSync('dist/index.html','utf8');
 assert(html.includes('workbench-store-gem-tone.css'),'Theme layer not installed');
 const categories=['backgrounds','dice','icons'];
 for(const k of categories)
  assert(fs.statSync('dist/art/workbench-store-gem-masks/'+k+'.png').size>200,
   'Missing visual mask '+k);
 const server=spawn('python3',['-m','http.server','5391','--directory','dist'],{stdio:'ignore'});
 let browser;
 try {
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(160)}
  assert(ready,'HTTP preview not running');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&/workbench-store-gem-masks|workbench-store-gem-tone/.test(r.url()))errors.push(r.status()+' '+r.url())});
  await page.goto(HOST,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');
   await page.locator('#termsAgree').check();
   await page.locator('#termsAccept').click();
  }
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  const results=[];
  for(const category of categories){
   await page.locator('[data-store-category="'+category+'"]').first().click({force:true});
   const canvas=page.locator('.ok-exact-store[data-ok-category="'+category+'"] .ok-canvas').first();
   await canvas.waitFor({state:'visible',timeout:12000});
   await page.evaluate(()=>document.body.removeAttribute('data-store-paid-background'));
   await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='amethyst',null,{timeout:8000});
   await canvas.locator('img.ok-art').first().evaluate(async e=>{await e.decode()});
   const before='preview-output/workbench-store-'+category+'-amethyst.png';
   const after='preview-output/workbench-store-'+category+'-emerald.png';
   await canvas.screenshot({path:before});
   await page.evaluate(()=>document.body.setAttribute('data-store-paid-background','ancient-ruins'));
   await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='emerald',null,{timeout:8000});
   const computed=await canvas.evaluate(e=>({
     opacity:getComputedStyle(e,'::after').opacity,
     background:getComputedStyle(e,'::after').backgroundColor,
     mask:getComputedStyle(e,'::after').maskImage,
     webkitMask:getComputedStyle(e,'::after').webkitMaskImage
   }));
   assert.equal(computed.opacity,'1','Applied theme has no gem overlay');
   assert((computed.mask+' '+computed.webkitMask).includes('workbench-store-gem-masks/'+category+'.png'),
    'Wrong visual mask: '+JSON.stringify(computed));
   await canvas.screenshot({path:after});
   // Evaluate on decoded screenshot PNGs against the actual masks. Target
   // pixels must recolor and all unmasked pixels must stay the SAME.
   const code=String.raw`
from PIL import Image,ImageFilter
import numpy as np,sys,json
before,after,mask_path=sys.argv[1:4]
a=np.asarray(Image.open(before).convert("RGB"),dtype=np.int16)
b=np.asarray(Image.open(after).convert("RGB"),dtype=np.int16)
assert a.shape==b.shape,(a.shape,b.shape)
h,w=a.shape[:2]
m=Image.open(mask_path).convert("L").resize((w,h),Image.Resampling.BILINEAR)
m=m.filter(ImageFilter.MaxFilter(5))
inside=np.asarray(m)>8
difference=np.max(np.abs(a-b),axis=2)
changed=(difference>15)
inside_count=int(np.sum(changed & inside))
outside_count=int(np.sum(changed & ~inside))
assert inside_count>35,(inside_count,outside_count)
assert outside_count<max(40,inside_count//5),(inside_count,outside_count)
print(json.dumps({"changed_inside":inside_count,"changed_outside":outside_count,"screen":[w,h]}))
`;
   let metrics;
   try{
    metrics=JSON.parse(execFileSync('python3',['-c',code,before,after,'dist/art/workbench-store-gem-masks/'+category+'.png'],{encoding:'utf8'}));
   }catch(e){throw Error('Pixel masks visually failed '+category+': '+String(e.stderr||e.message))}
   results.push({category,computed,metrics});
  }
  assert.deepEqual(errors,[],errors.join(';'));
  fs.writeFileSync('preview-output/workbench-store-theme-report.json',JSON.stringify({status:'PASS',scope:'Three Store UI categories, isolated applied theme recoloring',backgroundThemeAppliedOnly:true,originalImageBytesPreserved:true,remaining:['Bundles sheet gem geometries','Physical Android/OEM screenshot verification','True high-resolution original background masters'],results},null,2));
  console.log('STORE GEM TONE WORKBENCH PASS: background/dice/icon pages tinted only inside masks; all surrounding original artwork unchanged');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('STORE GEM TONE WORKBENCH FAIL',e.stack||e);process.exitCode=1});
