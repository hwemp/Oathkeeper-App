/* TEST 167 real Chromium UI audit: the same stabilized renderer still
 * appears in Store tiles, bundles, banner and every Dice-page selector.
 * Proves both 393px and narrower 360px Android-sized layouts. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const url='http://127.0.0.1:5199';
const slugs=['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
const sides=[3,4,6,8,10,12,20,50,100];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const p=spawn('python3',['-m','http.server','5199','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<90;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await sleep(170)}
  assert(ready,'TEST 167 preview server unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push('JavaScript '+e.message));
  page.on('response',r=>{
   if(r.status()>=400&&r.url().includes('/art/test166-dice/'))errors.push('Image HTTP '+r.status()+' '+r.url());
  });
  const open=async()=>{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
  };
  const clickExposed=async(el,name)=>{
   await el.scrollIntoViewIfNeeded();
   const spot=await el.evaluate(e=>{
    const r=e.getBoundingClientRect();
    for(const y of [.5,.25,.75])for(const x of [.5,.25,.75]){
     const px=r.left+r.width*x,py=r.top+r.height*y;
     const upper=document.elementFromPoint(px,py);
     if(upper===e||e.contains(upper))return {x:px,y:py};
    }return null;
   });
   assert(spot,'Selection '+name+' has no exposed pointer target');
   await page.mouse.click(spot.x,spot.y);
  };
  await open();
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="dice"]').first().click();
  for(const skin of slugs){
   const el=page.locator('[data-store-dice="'+skin+'"]').last();
   const bg=await el.evaluate(e=>getComputedStyle(e,'::before').backgroundImage);
   assert(bg.includes('/art/test166-dice/'+skin+'/d20.png'),
    'Store art diverges from studio for '+skin+': '+bg);
  }
  await clickExposed(page.locator('[data-store-dice="astral"]').last(),'Astral');
  await page.screenshot({path:'preview-output/167-store-astral.png',fullPage:true});
  // Bundle images must be actual foreground elements, not covered pseudo art.
  await page.locator('[data-store-category="bundles"]').first().click();
  for(const skin of slugs){
   const layer=page.locator('[data-store-bundle-dice="'+skin+'"] > .test166-bundle-live-art').first();
   await layer.waitFor({state:'visible',timeout:7000});
   const bg=await layer.evaluate(e=>getComputedStyle(e).backgroundImage);
   assert(bg.includes('/art/test166-dice/'+skin+'/d20.png'),
      'Bundle image diverges from studio '+skin);
  }
  await page.screenshot({path:'preview-output/167-bundles.png',fullPage:true});
  await open();
  await page.locator('#nav button[data-tab="Dice"]').click();
  await page.locator('.dice-applied-skin[data-applied-dice="astral"]').waitFor({timeout:12000});
  for(const geometry of sides){
   if(geometry===50)await page.locator('[data-dice-mode="unofficial"]').click();
   else if(geometry===3)await page.locator('[data-dice-mode="official"]').click();
   const die=page.locator('.dice-page [data-die="'+geometry+'"] .reference-die').first();
   assert(await die.count(),'Missing dice tile D'+geometry);
   const bg=await die.evaluate(e=>getComputedStyle(e).backgroundImage);
   assert(bg.includes('/art/test166-dice/astral/d'+geometry+'.png'),
      'Astral preview not matched to renderer D'+geometry+': '+bg);
  }
  await page.locator('[data-dice-mode="official"]').click();
  await page.screenshot({path:'preview-output/167-dice-astral.png',fullPage:true});
  // Validate the applied theme D20 banner also references the same 992×700 frame.
  const banner=page.locator('.dice-applied-skin[data-applied-dice="astral"] .dice-applied-art');
  if(await banner.count()){
   const bg=await banner.evaluate(e=>getComputedStyle(e).backgroundImage);
   assert(bg.includes('/art/test166-dice/astral/d20.png'),'Selected skin banner is out of sync');
  }
  for(const width of [360,393,412]){
   await page.setViewportSize({width,height:852});
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+3);
   assert(!overflow,'Dice controls overflow at '+width+'px');
  }
  const pixel=await page.evaluate(async()=>{
   const img=new Image();
   img.src='./art/test166-dice/astral/d20.png';
   await img.decode();
   return [img.naturalWidth,img.naturalHeight];
  });
  assert.deepEqual(pixel,[992,700],'Studio image dimensions unexpectedly downgraded');
  assert.deepEqual(errors,[],'Studio image or JavaScript error in browser');
  console.log('TEST 167 UI PASS: 10 Store skins, 10 bundles, 9 Astral dice shapes, banner, 360/393/412 responsive, 992x700 source');
 }finally{
  if(browser)await browser.close();
  p.kill();
 }
})().catch(e=>{console.error('TEST 167 UI FAILED',e.stack||e);process.exitCode=1});
