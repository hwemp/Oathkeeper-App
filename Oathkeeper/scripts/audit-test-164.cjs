/* Verify exact visual resource mappings and protected controls in real DOM. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:5195';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn('python3',['-m','http.server','5195','--directory','dist'],{stdio:'ignore'});
 let browser;
 const report={screens:[],errors:[],checks:[]};
 try{
  let ready=false;
  for(let i=0;i<100;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await sleep(200)}
  assert(ready,'164 UI audit server not ready');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  page.on('pageerror',e=>report.errors.push('JS '+e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().includes('/art/'))report.errors.push('Asset '+r.status()+' '+r.url())});
  await page.goto(base,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');
   await page.locator('#termsAgree').check();
   await page.locator('#termsAccept').click();
  }
  const nav=page.locator('#nav button');
  assert.equal(await nav.count(),4,'Approved top character navigation count regressed');
  const frame=await nav.first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
  assert(frame.includes('ornate-nav-'),'Approved gold-and-gem nav frame regressed');
  await page.screenshot({path:'preview-output/164-navigation.png',fullPage:true});report.screens.push('164-navigation.png');
  const bell=page.locator('header > .notification-bell').first();
  const bellGem=await bell.evaluate(el=>getComputedStyle(el,'::after').content);
  assert.equal(bellGem,'none','Notification bell still has an amethyst');
  report.checks.push('Header notification bell has no gemstone');
  await page.locator('#appMenu summary').click();
  const equipment=page.locator('#appMenu button[data-action="edit-equipment"]');
  await equipment.click();
  const remove=page.locator('#equipmentEditor [data-draft-remove]').first();
  await remove.waitFor({timeout:7000});
  const xState=await remove.evaluate(el=>({content:getComputedStyle(el,'::after').content,border:getComputedStyle(el).borderTopWidth,symbol:el.textContent.trim(),background:getComputedStyle(el).backgroundImage}));
  assert.equal(xState.content,'none','Equipment X still contains ornament');
  assert.equal(xState.symbol,'×','Equipment removal button is not a simple X');
  assert(Number.parseFloat(xState.border)>=1,'X frame missing');
  await page.screenshot({path:'preview-output/164-equipment-X.png',fullPage:true});
  report.screens.push('164-equipment-X.png');
  await page.locator('#equipmentEditor [data-action="cancel-equipment"]').click();
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-action="edit-journal"]').click();
  assert(await page.locator('#journalEditor').isVisible(),'Journal editor not visible');
  await page.screenshot({path:'preview-output/164-journal-editor.png',fullPage:true});
  report.screens.push('164-journal-editor.png');
  await page.locator('#journalEditor [data-action="cancel-journal"]').click();
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="icons"]').first().click();
  for(const icon of ['01','02','04','05','06','07','08','11','12','14']){
   const selector='[data-store-icon="icon-'+icon+'"]';
   const elem=page.locator(selector).first();
   assert(await elem.count(),'Missing icon button '+icon);
   const bg=await elem.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   assert(bg.includes('launcher-'+icon+'.webp'),'Store did not use launcher master '+icon+': '+bg);
  }
  await page.screenshot({path:'preview-output/164-launcher-master-store.png',fullPage:true});
  report.screens.push('164-launcher-master-store.png');
  report.checks.push('All 10 Store launcher previews reference the native master image files');
  await page.locator('[data-store-category="backgrounds"]').first().click();
  for(const slug of ['moonlit-citadel','ancient-ruins','enchanted-forest','dragons-crag','shadow-marsh','celestial-plains','crystal-caverns','elder-grove','mystic-lake','eternal-keep']){
   const elem=page.locator('[data-store-background="'+slug+'"]').first();
   const bg=await elem.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   assert(bg.includes('/approved-backgrounds/'+slug+'.webp'),'Original 508px scene not used '+slug);
  }
  await page.screenshot({path:'preview-output/164-backgrounds.png',fullPage:true});
  report.screens.push('164-backgrounds.png');
  report.checks.push('All 10 approved original scene images mapped to Store hotspots');
  await page.locator('[data-store-category="dice"]').first().click();
  for(const slug of ['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire']){
   const elem=page.locator('[data-store-dice="'+slug+'"]').first();
   const bg=await elem.evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
   assert(bg.includes('/test164-dice/'+slug+'.png'),'Store dice not captured from original animation '+slug);
  }
  await page.screenshot({path:'preview-output/164-animated-master-store.png',fullPage:true});
  report.screens.push('164-animated-master-store.png');
  report.checks.push('All 10 Store dice cards use 3D animation-captured preview masters');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
  assert(!overflow,'Store view horizontally overflows phone');
  assert.deepEqual(report.errors,[],'Real UI audit encountered errors');
  console.log('TEST 164 READ-ONLY UI AUDIT PASS',JSON.stringify(report));
 }finally{fs.mkdirSync('preview-output',{recursive:true});fs.writeFileSync('preview-output/164-audit.json',JSON.stringify(report,null,2));if(browser)await browser.close();server.kill();}
})().catch(err=>{console.error('TEST 164 AUDIT FAILED:',err.stack||err);process.exitCode=1});
