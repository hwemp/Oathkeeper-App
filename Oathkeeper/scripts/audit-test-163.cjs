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
  // Read-only runtime inspection: capture the ACTUAL Build 144 archive modules,
  // which can differ from current Vite source. Do not modify these originals.
  const inspectRuntime=(directory,relative='')=>{
    if(!fs.existsSync(directory))return;
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})){
      const full=directory+'/'+entry.name,sub=relative?relative+'/'+entry.name:entry.name;
      if(entry.isDirectory()){if(!sub.startsWith('art/'))inspectRuntime(full,sub);continue;}
      if(!/\.(?:js|css|html)$/i.test(entry.name))continue;
      const dest='preview-output/frozen-144-'+sub.replaceAll('/','_')+'.txt';
      fs.copyFileSync(full,dest);
    }
  };
  inspectRuntime('dist');
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
    const gem=await page.evaluate(()=>document.documentElement.dataset.oathGemTheme||'amethyst');
    const expectedGem=gem==='amethyst'?'ornate-nav-163.svg':'ornate-nav-'+gem+'-163.svg';
    assert(navBg.includes(expectedGem),'163 theme-matched border was not loaded: '+navBg+' (expected '+expectedGem+')');
    await shot('163-actual-overview');
    await page.locator('#nav button[data-tab="Powers"]').click();await shot('163-actual-powers');
    await page.locator('#nav button[data-tab="Inventory"]').click();await shot('163-actual-inventory');
    await page.locator('#nav button[data-tab="Dice"]').click();await shot('163-actual-dice');
    await page.locator('#appMenu summary').click();
    await page.locator('#appMenu button[data-tab="Store"]').click();
    assert(await page.locator('.store-page').isVisible(),'Approved Build 144 store is missing');
    await page.locator('[data-store-category="backgrounds"]').first().click();
    assert.equal(await page.locator('[data-store-background]').count(),10,'Expected ten background choices');
    for(const slug of ['moonlit-citadel','ancient-ruins','enchanted-forest','dragons-crag','shadow-marsh','celestial-plains','crystal-caverns','elder-grove','mystic-lake','eternal-keep']){
      await page.locator('[data-store-background="'+slug+'"]').first().click();
      await page.waitForFunction(()=>{
        const imgs=[...document.querySelectorAll('.store-page img')];
        return imgs.length>0 && imgs.every(img=>img.complete&&img.naturalWidth>0);
      },null,{timeout:10000});
      const sample=await page.evaluate(()=>{
        const images=[...document.querySelectorAll('.store-page img')].map(img=>({
          src:img.currentSrc||img.src, loaded:img.complete&&img.naturalWidth>0,
          intrinsic:[img.naturalWidth,img.naturalHeight],
          displayed:[Math.round(img.getBoundingClientRect().width),Math.round(img.getBoundingClientRect().height)]
        }));
        return {images,gem:document.documentElement.dataset.oathGemTheme};
      });
      findings.backgrounds.push({slug,...sample});
      const approved=sample.images.filter(img=>img.src.includes('/art/approved-backgrounds/'+slug+'.webp'));
      const originalBakedMoon=slug==='moonlit-citadel' && sample.images.some(img=>img.src.includes('/art/exact-store/backgrounds.webp')&&img.intrinsic[0]>=900);
      if(approved.length===0 && !originalBakedMoon) findings.errors.push(slug+': preview does not use the original approved scene');
      if(approved.some(img=>img.intrinsic[0]<500))findings.errors.push(slug+': original scene master smaller than 500px');
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
    // TEST 163: choose a paid-design preview without granting entitlement.
    // Reload to the character tools and confirm the very same 144 dice roller
    // receives the previewed skin; capture an actual mid-animation canvas.
    await page.goto(base,{waitUntil:'domcontentloaded'});
    if(await page.locator('#termsGate').isVisible().catch(()=>false)){
      await page.locator('#termsAge').selectOption('teen');
      await page.locator('#termsAgree').check();
      await page.locator('#termsAccept').click();
    }
    await page.locator('#nav button[data-tab="Dice"]').click();
    const previewDie=page.locator('.dice-applied-skin');
    await previewDie.waitFor({timeout:10000});
    assert.equal(await previewDie.getAttribute('data-applied-dice'),'astral','Store-selected dice must be the animated preview skin');
    assert.match(await previewDie.innerText(),/preview only/i,'No purchase entitlement may be implied');
    await page.locator('input[data-k="diceAnimation"]').check({force:true});
    await page.locator('#diceForm button.dice-roll').click();
    await page.locator('#diceTabletop canvas:not(.test168-live-webgl)').waitFor({timeout:10000});
    await page.waitForTimeout(300);
    const canvasReport=await page.locator('#diceTabletop canvas:not(.test168-live-webgl)').evaluate(canvas=>{
      const ctx=canvas.getContext('2d'),data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
      let visible=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)visible++;
      return {width:canvas.width,height:canvas.height,visiblePixels:visible};
    });
    assert(canvasReport.width>0&&canvasReport.height>0&&canvasReport.visiblePixels>0,'Animated preview must render actual 144 canvas frames');
    await shot('163-animated-astral-dice-roll');
    await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',null,{timeout:8000});
    const total=await page.locator('.dice-result strong').innerText();
    assert(/^[0-9,.-]+$/.test(total),'Original dice roll must still complete with a numeric result');
    findings.dice.push({slug:'astral',animation:'landed',canvas:canvasReport,result:total});
    // Return to original approved store view for the remaining screen checks.
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.locator('#appMenu summary').click();
    await page.locator('#appMenu button[data-tab="Store"]').click();
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
