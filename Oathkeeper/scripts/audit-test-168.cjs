/* TEST 168: actual Chromium verification of HD 3D Store and dice animation.
 * A correct result must come from the old roller, not from WebGL graphics. */
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict');
const root='http://127.0.0.1:5202';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn('python3',['-m','http.server','5202','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(root)).ok){ready=true;break}}catch{}await sleep(250)}
  assert(ready,'3D visual QA server unavailable');
  browser=await chromium.launch({headless:true,args:[
    '--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader'
  ]});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
   if(r.status()>=400&&(r.url().includes('test168')||r.url().includes('test166-dice')))
    errors.push('HTTP '+r.status()+' '+r.url());
  });
  const open=async()=>{
   await page.goto(root,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
  };
  await open();
  assert.equal(await page.locator('script[data-test168-3d-runtime]').count(),1,'WebGL not included in actual app');
  assert.equal(await page.locator('link[data-test168-3d-css]').count(),1,'WebGL CSS absent');
  await page.waitForFunction(()=>document.documentElement.dataset.test168Webgl!==undefined,{timeout:25000});
  assert.equal(await page.locator('html').getAttribute('data-test168-webgl'),'supported','WebGL unsupported in graphics browser');
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="dice"]').first().click();
  const astral=page.locator('[data-store-dice="astral"]').last();
  await astral.scrollIntoViewIfNeeded();
  // Use the original real click handler, not a test-only mutation.
  await astral.click({position:{x:10,y:14},timeout:10000});
  assert.equal(await astral.getAttribute('aria-pressed'),'true','Astral selection did not work');
  const picture=await astral.evaluate(e=>getComputedStyle(e,'::before').backgroundImage);
  assert(picture.includes('/test166-dice/astral/d20.png'),'Store did not use real WebGL 3D master '+picture);
  await page.screenshot({path:'preview-output/168-store-real-3d.png',fullPage:true});
  await open();
  await page.locator('#nav button[data-tab="Dice"]').click();
  await page.locator('.dice-applied-skin[data-applied-dice="astral"]').waitFor({timeout:10000});
  const art=page.locator('[data-die="20"] .reference-die').first();
  const image=await art.evaluate(e=>getComputedStyle(e).backgroundImage);
  assert(image.includes('/test166-dice/astral/d20.png'),'Dice page uses different D20 art '+image);
  await page.screenshot({path:'preview-output/168-dice-gallery-real-3d.png',fullPage:true});
  const animate=page.locator('input[data-k="diceAnimation"]');
  if(!await animate.isChecked())await animate.check({force:true});
  await page.locator('[data-die="20"]').first().click();
  await page.locator('#diceForm button.dice-roll').click();
  const overlay=page.locator('#diceTabletop canvas.test168-live-webgl');
  await overlay.waitFor({state:'visible',timeout:18000});
  await page.waitForFunction(()=>{
    const canvas=document.querySelector('#diceTabletop canvas.test168-live-webgl');
    return canvas?.width>100&&canvas?.height>100&&getComputedStyle(canvas).opacity==='1';
  },null,{timeout:20000});
  const actual=await overlay.evaluate(e=>{
   const gl=e.getContext('webgl2')||e.getContext('webgl');
   return {width:e.width,height:e.height,gl:!!gl};
  });
  assert(actual.gl&&actual.width>=250&&actual.height>=150,
   'WebGL 3D renderer did not draw a live canvas '+JSON.stringify(actual));
  await page.screenshot({path:'preview-output/168-live-3d-roll.png',fullPage:true});
  await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',null,{timeout:10000});
  const landed=await page.locator('#diceTabletop [data-dice-landed]').innerText();
  const result=await page.locator('.dice-result strong').innerText();
  assert(/D20\s+[0-9]+/.test(landed),'Original roller did not record an actual face '+landed);
  assert(/^\d[\d,]*$/.test(result),'Gameplay result did not finish '+result);
  assert(landed.includes(result.replaceAll(',','')),'WebGL overlay diverged from original landed face '+landed+' != '+result);
  await page.screenshot({path:'preview-output/168-landed-3d-roll.png',fullPage:true});
  const glState=await page.locator('#diceTabletop canvas.test168-live-webgl').count();
  assert.equal(glState,1,'WebGL layer disappeared on original roller completion');
  assert.deepEqual(errors,[],'3D runtime generated browser errors');
  console.log('TEST 168 3D UI PASS: actual graphics, Store, Dice gallery, live WebGL, unchanged original result '+result);
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('TEST 168 UI FAILED',e.stack||e);process.exitCode=1});
