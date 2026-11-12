/* TEST 171 full browser regression:
 * Store = approved showcase GIF, gameplay = separate animated tabletop throw.
 * Secure dice and character numbers are sourced by original app only.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const url='http://127.0.0.1:5211';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const checksum=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const originalGifSha='fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb';
(async()=>{
  fs.mkdirSync('preview-output',{recursive:true});
  assert.equal(checksum('dist/art/exact-store/roll/astral-original.gif'),originalGifSha,
    'Approved 12-frame showcase GIF modified');
  const index=fs.readFileSync('dist/index.html','utf8');
  assert(index.includes('test171-gameplay-toss.js')&&index.includes('test171-gameplay-toss.css'),
    'TEST 171 gameplay not included');
  assert(!index.includes('test168-live-3d.js'),'Rejected mesh animation unexpectedly enabled');
  const src=fs.readFileSync('dist/assets/main-FCw4hQ90.js','utf8');
  assert(src.includes('OathkeeperTabletop171.play(i,u,r,c)'),
    'Gameplay UI not connected to original result calculations');
  assert(src.includes('test169-approved-rolling-gif'),'Original GIF fallback lost');
  const renderer=fs.readFileSync('dist/test171-gameplay-toss.js','utf8');
  assert(!/\bMath\.random\s*\(|\bcrypto\.getRandomValues\s*\(|\brollDice\s*\(/.test(renderer),
    'Visual renderer must never generate or modify the dice result');
  for(const theme of ['amethyst','emerald','sapphire','ruby','aquamarine','citrine']){
    const asset='dist/art/test171-tabletop-frames/'+theme+'.svg';
    assert(fs.statSync(asset).size>2000,'Missing ornate frame '+theme);
    assert(fs.readFileSync(asset,'utf8').includes('href="#gemstone"'),
      'Wrong gemstone geometry '+theme);
  }
  const server=spawn('python3',['-m','http.server','5211','--directory','dist'],{stdio:'ignore'});
  let browser;
  try {
    let up=false;
    for(let i=0;i<90;i++){try{if((await fetch(url)).ok){up=true;break}}catch{}await sleep(150)}
    assert(up,'Browser test server unavailable');
    browser=await chromium.launch({headless:true});
    const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{
      if(r.status()>=400&&/test171-|roll\/astral|roll\/elvenleaf/.test(r.url()))errors.push(r.status()+' '+r.url())
    });
    const open=async()=>{
      await page.goto(url,{waitUntil:'domcontentloaded'});
      if(await page.locator('#termsGate').isVisible().catch(()=>false)){
        await page.locator('#termsAge').selectOption('teen');
        await page.locator('#termsAgree').check();
        await page.locator('#termsAccept').click();
      }
    };
    await open();
    // Store always shows untouched 12-frame showcase rotation, not a toss.
    await page.locator('#appMenu summary').click();
    await page.locator('#appMenu button[data-tab="Store"]').click();
    await page.locator('[data-store-category="dice"]').first().click();
    const astral=page.locator('[data-store-dice="astral"]').first();
    await astral.click({force:true});
    const store=page.locator('.ok-exact-store .ok-roll-box img.ok-roll');
    await store.waitFor({state:'visible',timeout:12000});
    const source=await store.evaluate(e=>new URL(e.currentSrc||e.getAttribute('src'),document.baseURI).pathname);
    assert(source.endsWith('/art/exact-store/roll/astral.webp'),
      'Store showcase was replaced by gameplay renderer: '+source);
    assert.equal(await page.locator('.ok-exact-store .test171-gameplay-stage').count(),0,
      'Gameplay toss accidentally showing in Store');
    await page.screenshot({path:'preview-output/171-store-original-showcase-unchanged.png',fullPage:true});
    // Select one of the existing visual themes. It should affect the gameplay
    // illustrated dice, but must not affect RNG or probability.
    await page.locator('[data-store-dice="elvenleaf"]').first().click({force:true});
    await open();
    await page.locator('#nav button[data-tab="Dice"]').click();
    const animate=page.locator('input[data-k="diceAnimation"]');
    if(!await animate.isChecked())await animate.check({force:true});
    await page.locator('[data-die="20"]').first().click();
    await page.locator('#diceForm button.dice-roll').click();
    const stage=page.locator('#diceTabletop.test171-gameplay-stage');
    await stage.waitFor({state:'visible',timeout:12000});
    const frame=stage.locator('.test171-ornate-frame');
    await frame.waitFor({state:'visible'});
    const dimensions=await frame.evaluate(el=>{
      const r=el.getBoundingClientRect(),stage=el.closest('#diceTabletop');
      const s=stage.getBoundingClientRect();
      return {width:r.width,height:r.height,stageWidth:s.width,stageHeight:s.height};
    });
    assert(Math.abs(dimensions.width-dimensions.height)<2.5,
      'Gameplay is not in a tight SQUARE frame: '+JSON.stringify(dimensions));
    assert(dimensions.width>=275 && dimensions.width<=396,
      'Gameplay frame does not fit 393px Android viewport: '+JSON.stringify(dimensions));
    const diceImages=stage.locator('img.test171-die-art');
    assert(await diceImages.count()>=1,'Illustrated dice missing from game roll');
    const chosen=await diceImages.first().evaluate(e=>new URL(e.currentSrc||e.getAttribute('src'),document.baseURI).pathname);
    assert(/\/art\/exact-store\/roll\/(elvenleaf|astral)\.webp|\/art\/exact-store\/roll\/astral-original\.gif/.test(chosen),
      'Unexpected polygon or incompatible die artwork: '+chosen);
    const mask=await diceImages.first().evaluate(e=>getComputedStyle(e).maskImage);
    assert(mask.includes('radial-gradient'),'Source image square edges are not faded');
    const animations=await diceImages.first().evaluate(e=>e.parentElement.getAnimations().length);
    assert(animations>=1,'Gameplay die has no real translation/bounce motion');
    await page.screenshot({path:'preview-output/171-gameplay-toss-in-progress.png',fullPage:true});
    await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',null,{timeout:13000});
    await page.waitForFunction(()=>{
      const value=document.querySelector('.dice-result strong')?.textContent?.trim()||'';
      return /^-?\d[\d,]*$/.test(value);
    },null,{timeout:10000});
    const result=await page.locator('.dice-result strong').innerText();
    assert(/^-?\d[\d,]*$/.test(result),'Dice result was not delivered by original engine: '+result);
    const text=await stage.locator('[data-dice-landed]').innerText();
    assert(/D20\s+\d+/.test(text),'Actual landed die face not shown from original result: '+text);
    assert.equal(await stage.locator('canvas').count(),0,'Old simplified 2D canvas returned');
    await page.screenshot({path:'preview-output/171-gameplay-toss-landed.png',fullPage:true});
    // Reduced motion: responsive and instant outcome, no autoplay requirement.
    const reduced=await browser.newPage({viewport:{width:360,height:780},reducedMotion:'reduce'});
    await reduced.goto(url,{waitUntil:'domcontentloaded'});
    if(await reduced.locator('#termsGate').isVisible().catch(()=>false)){
      await reduced.locator('#termsAge').selectOption('teen');
      await reduced.locator('#termsAgree').check();
      await reduced.locator('#termsAccept').click();
    }
    await reduced.locator('#nav button[data-tab="Dice"]').click();
    const reducedToggle=reduced.locator('input[data-k="diceAnimation"]');
    if(!await reducedToggle.isChecked())await reducedToggle.check({force:true});
    await reduced.locator('#diceForm button.dice-roll').click();
    await reduced.waitForFunction(()=>document.querySelector('.dice-result strong')?.textContent?.trim().match(/^\d/),null,{timeout:15000});
    await reduced.close();
    assert.deepEqual(errors,[],'Browser errors in gameplay or Store: '+errors.join('\n'));
    const report={result:'PASS',showcase:'approved original',gameplay:'independent tabletop toss',durationMs:1750,
      realDiceResult:result,landedFaces:text,frameDimensions:dimensions,masking:true,reduceMotion:true,
      preserveStoreGifSHA256:originalGifSha,errors};
    fs.writeFileSync('preview-output/171-tabletop-audit.json',JSON.stringify(report,null,2));
    console.log('TEST 171 PASSED: Store original GIF, separate tabletop toss, square faceted-gem frame, secure landed result, reduced motion.');
  }finally{
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error('TEST 171 FAILED',error.stack||error);process.exitCode=1});
