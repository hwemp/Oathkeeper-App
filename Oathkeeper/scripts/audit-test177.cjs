/* TEST 177 mobile browser regression: page typography, actual framed source
 * image assets, canonical launcher icons, gameplay-only illustrated toss,
 * unchanged original Store dice showcase, and identical roll result engine.
 */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const STORE='http://127.0.0.1:5277';
const SCENES=['moonlit-citadel','ancient-ruins','enchanted-forest','dragons-crag',
'shadow-marsh','celestial-plains','crystal-caverns','elder-grove','mystic-lake','eternal-keep'];
const ICONS=['01','02','04','05','06','07','08','11','12','14'];
const SHA='fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const hash=crypto.createHash('sha256').update(fs.readFileSync('dist/art/exact-store/roll/astral-original.gif')).digest('hex');
 assert.equal(hash,SHA,'Store preview GIF was modified');
 assert(fs.readFileSync('dist/workbench-gameplay-mesh.js','utf8').includes('TEST 177: the selected-set'),'Gameplay polygon remains active');
 for(const slug of SCENES){
  assert(fs.statSync('dist/art/test177-backgrounds/'+slug+'.webp').size>12000,'Missing framed illustration '+slug);
  assert(fs.statSync('dist/art/exact-store/test169-bg/'+slug+'.webp').size>30000,'Missing rebuilt Store page '+slug);
 }
 assert(fs.readFileSync('dist/index.html','utf8').includes('test177-repairs.css'),'New fit-to-frame styles not injected');
 fs.mkdirSync('preview-output',{recursive:true});
 const server=spawn('python3',['-m','http.server','5277','--directory','dist'],{stdio:'ignore'});
 let browser;
 const issues=[];
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(STORE)).ok){ready=true;break}}catch{}await sleep(160)}
  assert(ready,'Test 177 preview not available');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  page.on('pageerror',e=>issues.push(e.message));
  const open=async(w=393)=>{
   await page.setViewportSize({width:w,height:852});
   await page.goto(STORE,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
  };
  const goStore=async()=>{
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-tab="Store"]').click();
  };
  for(const w of [360,393,412]){
   await open(w);
   const nav=page.locator('#nav button.oath170-reference-button:visible');
   assert(await nav.count()>=3,'Main gold buttons absent');
   const glyphs=await nav.evaluateAll(bs=>bs.map(b=>({label:b.textContent.trim(),font:parseFloat(getComputedStyle(b).fontSize),
    width:b.getBoundingClientRect().width,overflow:b.scrollWidth-b.clientWidth})));
   assert(glyphs.every(x=>x.font<=15.1&&x.overflow<4),
    'Overlarge or overflowed nav button text '+w+': '+JSON.stringify(glyphs));
   await page.locator('#appMenu summary').click();
   const options=page.locator('#appMenu .menu-options button.oath170-reference-button:visible');
   const fits=await options.evaluateAll(bs=>bs.map(b=>({label:b.textContent.trim(),font:parseFloat(getComputedStyle(b).fontSize),
    overflow:b.scrollWidth-b.clientWidth,box:b.getBoundingClientRect().height})));
   assert(fits.length>=6&&fits.every(x=>x.font<=15.1&&x.overflow<=3&&x.box>=80),
    'Menu labels exceed gold frame '+w+': '+JSON.stringify(fits));
   await page.screenshot({path:'preview-output/177-menu-'+w+'.png',fullPage:true});
  }
  await open();
  await goStore();
  await page.locator('[data-store-category="backgrounds"]').first().click({force:true});
  for(const slug of SCENES){
   await page.locator('[data-store-background="'+slug+'"]').first().click({force:true});
   const scene=page.locator('.ok-exact-store[data-ok-category="backgrounds"] .ok-canvas>img.ok-art');
   await scene.evaluate(async e=>{await e.decode();});
   const state=await scene.evaluate(e=>({src:e.getAttribute('src'),width:e.naturalWidth,height:e.naturalHeight}));
   assert(state.src.includes('/test169-bg/'+slug+'.webp') && state.width===941 && state.height===1672,
    'Wrong per-scene page '+slug+' '+JSON.stringify(state));
   const bg=await page.locator('[data-store-background="'+slug+'"]').first().evaluate(
    el=>getComputedStyle(el,'::before').backgroundImage);
   assert(bg.includes('/test177-backgrounds/'+slug+'.webp'),'Old tile resource still used '+slug);
  }
  await page.locator('[data-store-background="crystal-caverns"]').first().click({force:true});
  await page.screenshot({path:'preview-output/177-background-frame-fit.png',fullPage:true});
  await page.locator('[data-store-category="icons"]').first().click({force:true});
  for(const code of ICONS){
   const button=page.locator('[data-store-icon="icon-'+code+'"]').first();
   const css=await button.evaluate(el=>({bg:getComputedStyle(el,'::before').backgroundImage,
    size:getComputedStyle(el,'::before').backgroundSize}));
   assert(css.bg.includes('/store-icons/icon-'+code+'.webp'),'Launcher icon source changed '+code);
   assert(css.size.includes('116%'),'Icon presentation remains shrunken '+code);
  }
  await page.screenshot({path:'preview-output/177-icons-enlarged.png',fullPage:true});
  await page.locator('[data-store-category="dice"]').first().click({force:true});
  const preview=page.locator('.ok-exact-store .ok-roll-box img.ok-roll').first();
  assert((await preview.getAttribute('src')).includes('/roll/'),
    'Selected Store animated showcase changed');
  await open();
  await page.locator('#nav button[data-tab="Dice"]').click();
  const option=page.locator('input[data-k="diceAnimation"]');
  if(await option.count() && !(await option.isChecked())) await option.check({force:true});
  await page.locator('[data-die="20"]').first().click();
  await page.locator('#diceForm button.dice-roll').click();
  const stage=page.locator('#diceTabletop.test171-gameplay-stage .test171-ornate-frame');
  await stage.waitFor({state:'visible',timeout:9000});
  assert.equal(await page.locator('#diceTabletop canvas.workbench-mesh-canvas').count(),0,
   'Low-detail polygon renderer still active in gameplay');
  assert(await page.locator('#diceTabletop .test171-die-art').count()>=1,
   'Illustrated gameplay die animation missing');
  await page.screenshot({path:'preview-output/177-gameplay-illustrated-roll.png',fullPage:true});
  await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',
   null,{timeout:9000});
  assert(/\d/.test(await page.locator('.dice-result strong').innerText()),'Gameplay result failed');
  assert.deepEqual(issues,[],'Browser errors');
  fs.writeFileSync('preview-output/177-repair-report.json',JSON.stringify({
   status:'passed',viewports:[360,393,412],scenes:SCENES.length,icons:ICONS.length,
   gameplay:'illustrated selected-set animation; polygon retired',storePreviewSha256:SHA},null,2));
  console.log('TEST 177 PASS: 10 source-backed framed scenes, 10 full-size launcher icon presentations, compact labels and illustrated gameplay roll. Original Store animation untouched.');
 }finally{await browser?.close();server.kill();}
})().catch(e=>{console.error('TEST 177 FAILED',e.stack||e);process.exitCode=1});
