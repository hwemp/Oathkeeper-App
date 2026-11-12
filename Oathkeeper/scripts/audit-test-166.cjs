/* TEST 166: browser checks that storefront, bundles, and Dice page share
 * exact PNGs sampled from the unmodified animation. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:5196';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const sides=[3,4,6,8,10,12,20,50,100];
const skins=['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
(async()=>{
 const server=spawn('python3',['-m','http.server','5196','--directory','dist'],{stdio:'ignore'});
 let browser;
 const issues=[];
 try{
  let served=false;
  for(let i=0;i<90;i++){try{if((await fetch(base)).ok){served=true;break}}catch{}await sleep(200)}
  assert(served,'Test 166 local server unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  page.on('pageerror',e=>issues.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/art/test166-dice/'))issues.push(r.status()+' '+r.url())});
  const open=async()=>{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
  };
  await open();
  const style=await page.locator('link[data-test166-dice-parity]').getAttribute('href');
  assert.equal(style,'./test166-dice-parity.css','166 sheet missing from packaged app');
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="dice"]').first().click();
  for(const skin of skins){
   const el=page.locator('[data-store-dice="'+skin+'"]').last();
   assert(await el.count(),'Store theme button missing '+skin);
   const img=await el.evaluate(e=>getComputedStyle(e,'::before').backgroundImage);
   assert(img.includes('/test166-dice/'+skin+'/d20.png'),'Store art mismatch for '+skin+': '+img);
  }
  await page.screenshot({path:'preview-output/166-store-animated-masters.png',fullPage:true});
  const choose=page.locator('[data-store-dice="elvenleaf"]').last();
  await choose.scrollIntoViewIfNeeded();
  // Normal pointer click to ensure the covered image is still a real button.
  const b=await choose.boundingBox();
  assert(b,'Elvenleaf selection box missing');
  const hit=await choose.evaluate(e=>{
   const r=e.getBoundingClientRect();
   const pts=[.5,.18,.82,.35,.66];
   for(const y of pts)for(const x of pts){
    const xx=r.left+r.width*x,yy=r.top+r.height*y,at=document.elementFromPoint(xx,yy);
    if(at===e||e.contains(at))return [xx,yy];
   }
   return null;
  });
  assert(hit,'No usable Elvenleaf Store tile pointer target');
  await page.mouse.click(hit[0],hit[1]);
  assert.equal(await choose.getAttribute('aria-pressed'),'true','Elvenleaf Store selection failed');
  await page.locator('[data-store-category="bundles"]').first().click();
  for(const skin of skins){
   const bundle=page.locator('[data-store-bundle-dice="'+skin+'"]').first();
   assert(await bundle.count(),'Bundle dice selection missing '+skin);
   const css=await bundle.evaluate(e=>{
    const inner=e.querySelector('.bundle-dice-art');
    return inner?getComputedStyle(inner).backgroundImage:getComputedStyle(e,'::before').backgroundImage;
   });
   assert(css.includes('/test166-dice/'+skin+'/d20.png'),'Bundle used unrelated dice atlas '+skin+': '+css);
   // Background declarations alone passed earlier while baked illustrations
   // remained visible. Require a real positioned foreground with nonzero area.
   const layer=bundle.locator(':scope > .test166-bundle-live-art');
   await layer.waitFor({state:'visible',timeout:7000});
   const visible=await layer.evaluate(e=>{
    const box=e.getBoundingClientRect(),computed=getComputedStyle(e);
    return {width:box.width,height:box.height,z:Number(computed.zIndex),
      background:computed.backgroundImage,display:computed.display};
   });
   assert(visible.width>25&&visible.height>25&&visible.z>=20,
     'Bundle overlay not actually visible for '+skin+': '+JSON.stringify(visible));
   assert(visible.background.includes('/test166-dice/'+skin+'/d20.png'),
     'Bundle visible layer uses wrong renderer art '+skin);
  }
  await page.screenshot({path:'preview-output/166-bundles-animated-masters.png',fullPage:true});
  await open();
  await page.locator('#nav button[data-tab="Dice"]').click();
  await page.locator('.dice-applied-skin[data-applied-dice="elvenleaf"]').waitFor({timeout:10000});
  for(const n of sides){
   if(n===50){
    await page.locator('[data-dice-mode="unofficial"]').click();
   }else if(n===3){
    await page.locator('[data-dice-mode="official"]').click();
   }
   const die=page.locator('.dice-page .die-tile[data-die="'+n+'"] .reference-die').first();
   assert(await die.count(),'Dice selection missing D'+n);
   const bg=await die.evaluate(e=>getComputedStyle(e).backgroundImage);
   assert(bg.includes('/test166-dice/elvenleaf/d'+n+'.png'),'Dice selection art differs from roll D'+n+': '+bg);
  }
  await page.locator('[data-dice-mode="official"]').click();
  await page.screenshot({path:'preview-output/166-dice-menu-animation-matched.png',fullPage:true});
  // The live-canvas assertion requires animation enabled. This test setting
  // does not change production defaults or the randomness/animation engine.
  const animate=page.locator('input[data-k="diceAnimation"]');
  if(!await animate.isChecked())await animate.check({force:true});
  await page.locator('[data-die="20"]').first().click();
  await page.locator('#diceForm button.dice-roll').click();
  const canvas=page.locator('#diceTabletop canvas');
  await canvas.waitFor({state:'visible',timeout:10000});
  // An inserted canvas starts at the browser default 300×150 before the
  // first requestAnimationFrame. Wait for the original high-density renderer
  // to paint, rather than asserting its dimensions before a frame exists.
  await page.waitForFunction(()=>{
   const c=document.querySelector('#diceTabletop canvas');
   if(!c||c.width<400||c.height<250)return false;
   const ctx=c.getContext('2d');
   if(!ctx)return false;
   const pixel=ctx.getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data;
   return pixel[3]>0;
  },null,{timeout:7000});
  assert.deepEqual(issues,[],'Test 166 resource or runtime errors');
  console.log('TEST 166 VISUAL PARITY PASSED: store, bundles, D3-D100, live roller.');
 }finally{
  fs.mkdirSync('preview-output',{recursive:true});
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('TEST 166 VISUAL PARITY FAILED',e.stack||e);process.exitCode=1});
