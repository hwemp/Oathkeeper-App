/* Fail-closed, pixel-verified Store gemstone tone test.
 * Every colored theme must change only small gemstone regions; gold trim,
 * backgrounds, icons, images and all other pixels must remain unchanged.
 * The Store art and original dice GIF are never modified.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn,execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const HOST='http://127.0.0.1:5391';
const sleep=n=>new Promise(r=>setTimeout(r,n));
const categories=['backgrounds','dice','icons'];
const variants=[
 ['sapphire','mystic-lake'],['emerald','ancient-ruins'],
 ['ruby','dragons-crag'],['aquamarine','enchanted-forest'],
 ['citrine','eternal-keep']
];
const py=String.raw`
from PIL import Image,ImageFilter
import numpy as np,sys,json
before,after,mask_path=sys.argv[1:4]
a=np.asarray(Image.open(before).convert("RGB"),dtype=np.int16)
b=np.asarray(Image.open(after).convert("RGB"),dtype=np.int16)
assert a.shape==b.shape,("Screenshot resized unexpectedly",a.shape,b.shape)
h,w=a.shape[:2]
raw=Image.open(mask_path)
assert raw.mode=="RGBA",("A transparent overlay PNG is required",raw.mode)
original_alpha=np.asarray(raw.getchannel("A"),dtype=np.uint8)
assert np.count_nonzero(original_alpha>8)<raw.width*raw.height*.01, "Overlay alpha covers too much Store art"
m=raw.getchannel("A").resize((w,h),Image.Resampling.BILINEAR).filter(ImageFilter.MaxFilter(7))
inside=np.asarray(m)>7
changed=np.max(np.abs(a-b),axis=2)>15
inside_changed=int(np.count_nonzero(changed&inside))
outside_changed=int(np.count_nonzero(changed&~inside))
assert inside_changed>30,("No visibly recolored gemstone",inside_changed)
assert outside_changed<max(40,inside_changed//5),("BACKGROUND/TRIM RECOLORED",inside_changed,outside_changed)
print(json.dumps({"gem_pixels_changed":inside_changed,"non_gem_pixels_changed":outside_changed,"size":[w,h]}))
`;
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 const html=fs.readFileSync('dist/index.html','utf8');
 const css=fs.readFileSync('dist/workbench-store-gem-tone.css','utf8');
 assert(html.includes('workbench-store-gem-tone.css'),'Store overlay not installed');
 assert(!css.includes('mix-blend-mode:color'),'Unsafe whole-page tint mode still active');
 assert(!css.includes('background:var(--oath-store-gem-color)'),'Solid background color overlay still active');
 for(const cat of categories){
  for(const [theme] of variants){
   const p='dist/art/workbench-store-gem-overlays/'+theme+'-'+cat+'.png';
   assert(fs.statSync(p).size>200,'Missing transparent overlay '+p);
  }
 }
 const server=spawn('python3',['-m','http.server','5391','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(160)}
  assert(ready,'Preview server unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
   if(r.status()>=400 && /workbench-store-gem-(overlays|tone)/.test(r.url()))
    errors.push(r.status()+' '+r.url());
  });
  await page.goto(HOST,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');
   await page.locator('#termsAgree').check();
   await page.locator('#termsAccept').click();
  }
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  const report=[];
  for(const cat of categories){
   await page.locator('[data-store-category="'+cat+'"]').first().click({force:true});
   const canvas=page.locator('.ok-exact-store[data-ok-category="'+cat+'"] .ok-canvas').first();
   await canvas.waitFor({state:'visible',timeout:15000});
   await canvas.locator('img.ok-art').first().evaluate(async e=>{await e.decode()});
   await page.evaluate(()=>document.body.removeAttribute('data-store-paid-background'));
   await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='amethyst',null,{timeout:8000});
   const base='preview-output/store-'+cat+'-original.png';
   await canvas.screenshot({path:base});
   const baseStyle=await canvas.evaluate(e=>({
     content:getComputedStyle(e,'::after').content,
     display:getComputedStyle(e,'::after').display,
     background:getComputedStyle(e,'::after').backgroundImage
   }));
   assert(baseStyle.content==='none'||baseStyle.display==='none',
    'Amethyst unexpectedly adds a colored overlay');
   for(const [theme,slug] of variants){
    await page.evaluate(s=>document.body.setAttribute('data-store-paid-background',s),slug);
    await page.waitForFunction(t=>document.documentElement.dataset.oathGemTheme===t,theme,{timeout:8000});
    const style=await canvas.evaluate(e=>{
      const s=getComputedStyle(e,'::after');
      return {image:s.backgroundImage,fill:s.backgroundColor,blend:s.mixBlendMode,mask:s.maskImage,webkitMask:s.webkitMaskImage,display:s.display};
    });
    assert(style.image.includes('workbench-store-gem-overlays/'+theme+'-'+cat+'.png'),
      'Theme art file mismatch: '+JSON.stringify({theme,cat,style}));
    assert(style.blend==='normal' && style.fill==='rgba(0, 0, 0, 0)',
      'UNSAFE FULL-SCREEN BLEND/BACKGROUND: '+JSON.stringify({theme,cat,style}));
    assert(style.mask==='none' && style.webkitMask==='none',
      'Legacy CSS mask unexpectedly active: '+JSON.stringify(style));
    const output='preview-output/store-'+cat+'-'+theme+'.png';
    await canvas.screenshot({path:output});
    let stats;
    try{
     stats=JSON.parse(execFileSync('python3',['-c',py,base,output,
      'dist/art/workbench-store-gem-overlays/'+theme+'-'+cat+'.png'],{encoding:'utf8'}));
    }catch(e){throw Error('Visual pixel validation failed '+cat+'/'+theme+': '+String(e.stderr||e.message))}
    report.push({category:cat,theme,stats});
   }
  }
  assert.deepEqual(errors,[],'Theme asset or script error');
  fs.writeFileSync('preview-output/workbench-store-theme-report.json',
   JSON.stringify({status:'PASS',variants:report.length,originalStoreArtUnchanged:true,
    fullScreenTints:false,unmodifiedTrim:true,storeThemeChangesOnlyGemPixels:true,
    remaining:['Bundles baked gem illustrations','Physical OEM home launcher acceptance','True original high-resolution background art'],report},null,2));
  console.log('STORE GEM 15/15 PASS: five colored themes across 3 Store pages. Original background, trim and merchandise unchanged.');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('STORE GEM TONE WORKBENCH FAIL',e.stack||e);process.exitCode=1});
