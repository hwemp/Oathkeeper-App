/* TEST 169: inspect real mobile renderer; no fake CSS checks alone.
 * The exact user GIF SHA is a protected golden master, independent of themes.
 */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const crypto=require('node:crypto');
const assert=require('node:assert/strict');
const slugs=['moonlit-citadel','ancient-ruins','enchanted-forest','dragons-crag',
 'shadow-marsh','celestial-plains','crystal-caverns','elder-grove','mystic-lake','eternal-keep'];
const skins=['dragonfire','frostborne','elvenleaf','celestial','abyssal',
 'gold-forged','necrotic','astral','oceanic','sunfire'];
const SHA='fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const url='http://127.0.0.1:5209';
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 assert.equal(digest('dist/art/exact-store/roll/astral-original.gif'),SHA,
  'User-approved original GIF no longer byte-identical');
 const index=fs.readFileSync('dist/index.html','utf8');
 assert(index.includes('test169-reference.css'),'Master styling not installed');
 assert(!index.includes('test168-live-3d.js'),'Polygon-based WebGL roller incorrectly included');
 assert(!index.includes('test166-bundle-overlay.js'),'Duplicate old bundle layer included');
 for(const slug of slugs){
  const file='dist/art/exact-store/test169-bg/'+slug+'.webp';
  assert(fs.statSync(file).size>30000,'Bad background page '+slug);
 }
 for(const skin of skins){
  assert(fs.existsSync('dist/art/exact-store/roll/'+skin+'.webp'),'Original animated skin missing '+skin);
  assert(fs.existsSync('dist/art/exact-store/roll/'+skin+'-still.webp'),'Original GIF still missing '+skin);
  for(const sides of [3,4,6,8,10,12,20,50,100]){
   assert(fs.statSync('dist/art/test169-dice/'+skin+'/d'+sides+'.webp').size>1000,
    'Themed illustrated die missing '+skin+' D'+sides);
  }
 }
 const server=spawn('python3',['-m','http.server','5209','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await sleep(170)}
  assert(ready,'Mobile browser server unavailable');
  browser=await chromium.launch({headless:true,args:['--disable-gpu']});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push('JS: '+e.message));
  page.on('response',r=>{if(r.status()>=400&&/test169-bg|test169-dice|\/roll\//.test(r.url()))errors.push(r.status()+' '+r.url())});
  const open=async()=>{
   await page.goto(url,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
  };
  await open();
  // Confirm native single-canvas Store art is used on ALL ten backgrounds.
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="backgrounds"]').first().click();
  for(const slug of slugs){
   const hit=page.locator('[data-store-background="'+slug+'"]').first();
   await hit.click({force:true});
   const art=page.locator('.ok-exact-store[data-ok-category="backgrounds"] .ok-canvas > img.ok-art').first();
   await art.waitFor({state:'visible',timeout:15000});
   await art.evaluate(async e=>{await e.decode();});
   const actual=await art.evaluate(e=>({
    path:new URL(e.currentSrc||e.getAttribute('src'),document.baseURI).pathname,
    width:e.naturalWidth,height:e.naturalHeight,
    rendered:[Math.round(e.getBoundingClientRect().width),Math.round(e.getBoundingClientRect().height)]
   }));
   assert(actual.path.endsWith('/art/exact-store/test169-bg/'+slug+'.webp'),
    'Background is still pasted over old base: '+JSON.stringify(actual));
   assert(actual.width===941&&actual.height===1672,'Full scene page has wrong source size '+slug);
   assert.equal(await page.locator('.ok-replacement-preview').count(),0,
    'Previous background pasted overlay still exists for '+slug);
   assert.equal(await page.locator('.ok-bg-copy').count(),0,
    'Competing old text mask still exists for '+slug);
   if(slug==='moonlit-citadel'||slug==='elder-grove'||slug==='eternal-keep'){
    await page.screenshot({path:'preview-output/169-background-'+slug+'.png',fullPage:true});
   }
  }
  // GIF remains the actual preview, not WebGL geometry.
  await page.locator('[data-store-category="dice"]').first().click();
  for(const slug of skins){
   const hit=page.locator('[data-store-dice="'+slug+'"]').first();
   await hit.click({force:true});
   const animation=page.locator('.ok-exact-store .ok-roll-box img.ok-roll');
   await animation.waitFor({state:'visible',timeout:8000});
   await animation.evaluate(async e=>{await e.decode();});
   const path=await animation.evaluate(e=>new URL((e.currentSrc||e.getAttribute('src')).split('?')[0],document.baseURI).pathname);
   assert(path.endsWith('/art/exact-store/roll/'+slug+'.webp'),
    'Selected original animated artwork not used '+slug+': '+path);
   const bg=await hit.evaluate(e=>getComputedStyle(e,'::before').backgroundImage);
   assert(bg.includes('/roll/'+slug+'-still.webp'),'Store thumbnail no longer matches GIF master '+slug);
  }
  // Explicitly choose the approved Astral GIF reference before verifying the
  // Dice tab. Earlier loop ends at Sunfire and its valid authored WebP.
  await page.locator('[data-store-dice="astral"]').first().click({force:true});
  await page.screenshot({path:'preview-output/169-dice-store-original-animated-art.png',fullPage:true});
  await page.locator('[data-store-category="bundles"]').first().click();
  for(const slug of skins){
   const tile=page.locator('[data-store-bundle-dice="'+slug+'"]').first();
   const img=tile.locator('img.ok-art');
   await img.evaluate(async e=>{await e.decode();});
   const imgpath=await img.evaluate(e=>new URL(e.currentSrc||e.getAttribute('src'),document.baseURI).pathname);
   assert(imgpath.endsWith('/art/exact-store/roll/'+slug+'-still.webp'),
    'Bundle uses mismatched polygon or unrelated illustration '+slug+': '+imgpath);
   const label=tile.locator('.ok-pick-name');
   assert(await label.isVisible(),'Dice set name is not visible in bundle: '+slug);
   assert.equal(await tile.locator('.test166-bundle-live-art').count(),0);
  }
  await page.screenshot({path:'preview-output/169-bundles-original-illustrated-dice.png',fullPage:true});
  // Confirm actual saved original game mechanic still animates without a
  // second WebGL engine and does not break die results.
  await open();
  await page.locator('#nav button[data-tab="Dice"]').click();
  const animate=page.locator('input[data-k="diceAnimation"]');
  if(!await animate.isChecked())await animate.check({force:true});
  await page.locator('[data-die="20"]').first().click();
  await page.locator('#diceForm button.dice-roll').click();
  const animation=page.locator('#diceTabletop img.test169-approved-rolling-gif');
  await animation.waitFor({state:'visible',timeout:12000});
  await animation.evaluate(async img=>img.decode());
  const filename=await animation.evaluate(img=>new URL(img.currentSrc||img.getAttribute('src'),document.baseURI).pathname);
  assert(filename.endsWith('/art/exact-store/roll/astral-original.gif'),
    'Dice tab is not displaying exact approved original GIF: '+filename);
  assert.equal(await page.locator('#diceTabletop canvas').count(),0,
    'Polygon canvas still competes with the master GIF');
  await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',null,{timeout:11000});
  assert(/^\d/.test(await page.locator('.dice-result strong').innerText()),'Original dice roll result did not complete');
  await page.screenshot({path:'preview-output/169-original-roller-restored.png',fullPage:true});
  // Typography must remain inside the safe center of the ornate button frame.
  for(const viewport of [360,393,412]){
   await page.setViewportSize({width:viewport,height:852});
   await open();
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-action="edit-journal"]').click();
   const buttons=page.locator('#journalEditor .row button');
   const count=await buttons.count();
   assert(count>=2,'Journal save/cancel buttons missing');
   for(let i=0;i<count;i++){
    const dimensions=await buttons.nth(i).evaluate(el=>{
      const r=el.getBoundingClientRect();
      const range=document.createRange();range.selectNodeContents(el);
      const t=range.getBoundingClientRect();
      return {width:r.width,btn:[r.left,r.top,r.right,r.bottom],text:[t.left,t.top,t.right,t.bottom]};
    });
    const [left,top,right,bottom]=dimensions.btn;
    const [tl,tt,tr,tb]=dimensions.text;
    assert(tl>=left+dimensions.width*.085&&tr<=right-dimensions.width*.085,
      'Journal button text collides with gold side ornament at '+viewport+': '+JSON.stringify(dimensions));
    assert(tt>=top+4&&tb<=bottom-4,'Journal button text collides with amethyst at '+viewport);
   }
   await page.screenshot({path:'preview-output/169-journal-button-fit-'+viewport+'.png',fullPage:true});
  }
  assert.deepEqual(errors,[],'Graphics resource or JavaScript runtime errors');
  const report={status:'verified_browser',masterGifSha256:SHA,
   backgroundScreens:slugs.length,diceThemeScreens:skins.length,
   preservedRollingEngine:true,editorViewports:[360,393,412],
   failures:errors};
  fs.writeFileSync('preview-output/169-browser-report.json',JSON.stringify(report,null,2));
  console.log('TEST 169 BROWSER PASS: all backgrounds source-composited, themed GIF art, bundles, original 144 roller and editor text fit');
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('TEST 169 BROWSER FAILED',e.stack||e);process.exitCode=1});
