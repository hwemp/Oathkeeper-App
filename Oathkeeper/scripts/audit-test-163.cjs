/* Real browser audit of the exact frozen Build 144 interface with TEST 163 overlays.
 * Intentionally does not build or publish an APK; results are screenshots + JSON. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:5193';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const server=spawn('python3',['-m','http.server','5193','--directory','dist'],{stdio:'ignore'});
  let browser;
  const findings={source:'frozen Build 144 + 163 ornaments',screens:[],warnings:[],errors:[],backgrounds:[],dice:[]};
  fs.mkdirSync('preview-output',{recursive:true});
  try {
    let ready=false;
    for(let i=0;i<80;i++){try{if((await fetch(base)).ok){ready=true;break}}catch{}await sleep(250);}
    assert(ready,'The archived web UI was not served');
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
    page.on('pageerror',e=>findings.errors.push('JS: '+e.message));
    page.on('response',r=>{if(r.status()>=400&&r.url().includes('/art/'))findings.errors.push('Art HTTP '+r.status()+' '+r.url())});
    await page.goto(base,{waitUntil:'domcontentloaded'});
    if(await page.locator('#termsGate').isVisible().catch(()=>false)){
      await page.locator('#termsAge').selectOption('teen');
      await page.locator('#termsAgree').check();
      await page.locator('#termsAccept').click();
    }
    const shot=async name=>{
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.screenshot({path:'preview-output/'+name+'.png',fullPage:true});
      findings.screens.push(name+'.png');
    };
    const nav=page.locator('#nav');
    assert(await nav.isVisible(),'Build 144 navigation is missing');
    assert.equal(await page.locator('#nav button').count(),4,'Expected four character buttons');
    const navBg=await page.locator('#nav button').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
    assert(navBg.includes('ornate-nav-163.svg'),'163 border artwork was not loaded');
    await shot('163-actual-overview');
    await page.locator('#nav button[data-tab="Powers"]').click();await shot('163-actual-powers');
    await page.locator('#nav button[data-tab="Inventory"]').click();await shot('163-actual-inventory');
    await page.locator('#nav button[data-tab="Dice"]').click();await shot('163-actual-dice');
    await page.locator('#appMenu summary').click();
    await page.locator('#appMenu button[data-tab="Store"]').click();
    assert(await page.locator('.store-page').isVisible(),'Approved Build 144 store is missing');
    await page.locator('[data-store-category="backgrounds"]').first().click();
    assert.equal(await page.locator('[data-store-background]').count(),10,'Expected ten background choices');
    for(const slug of ['moonlit-citadel','ancient-ruins','crystal-caverns','eternal-keep']){
      await page.locator('[data-store-background="'+slug+'"]').first().click();
      const sample=await page.evaluate(()=>{
        const images=[...document.querySelectorAll('.store-page img')].map(img=>({
          src:img.currentSrc||img.src, loaded:img.complete&&img.naturalWidth>0,
          intrinsic:[img.naturalWidth,img.naturalHeight],
          displayed:[Math.round(img.getBoundingClientRect().width),Math.round(img.getBoundingClientRect().height)]
        }));
        return {images,gem:document.documentElement.dataset.oathGemTheme};
      });
      findings.backgrounds.push({slug,...sample});
      for(const img of sample.images)if(!img.loaded)findings.errors.push('Missing image '+img.src);
      const upscaled=sample.images.filter(img=>img.intrinsic[0]>0&&img.displayed[0]>img.intrinsic[0]*1.5);
      if(upscaled.length)findings.warnings.push(slug+': enlarged artwork exceeds its source pixel width by 1.5x');
      await shot('163-background-'+slug);
    }
    await page.locator('[data-store-category="dice"]').first().click();
    assert.equal(await page.locator('[data-store-dice]').count(),10,'Expected ten original dice choices');
    for(const slug of ['dragonfire','frostborne','celestial','astral']){
      await page.locator('[data-store-dice="'+slug+'"]').first().click();
      findings.dice.push({slug,selected:await page.locator('[data-store-dice="'+slug+'"]').first().getAttribute('aria-pressed')});
      await shot('163-dice-choice-'+slug);
    }
    await page.locator('[data-store-category="icons"]').first().click();
    await shot('163-actual-app-icons');
    await page.locator('[data-store-category="bundles"]').first().click();
    await shot('163-actual-bundles');
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
    if(overflow)findings.errors.push('Horizontal overflow at 393px viewport');
    assert.deepEqual(findings.errors,[],'Real browser QA found errors');
    console.log('AUDIT PASS: archived UI rendered with navigation, store selection, screenshots.');
  }finally{
    fs.writeFileSync('preview-output/163-audit.json',JSON.stringify(findings,null,2));
    console.log('TEST 163 FINDINGS:',JSON.stringify(findings,null,2));
    if(browser)await browser.close();
    server.kill();
  }
})().catch(err=>{console.error('AUDIT FAIL:',err.stack||err);process.exitCode=1;});
