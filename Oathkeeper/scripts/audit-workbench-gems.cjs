/* Oathkeeper visual workbench — issue #3: one gemstone geometry.
 * NO APK, no changes to Store pricing, wallpapers or original roll engine.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {spawn}=require('node:child_process');
const {chromium}=require('playwright');
const themes=['amethyst','sapphire','emerald','ruby','aquamarine','citrine'];
const url='http://127.0.0.1:5277';
const sleep=n=>new Promise(resolve=>setTimeout(resolve,n));
const screenshots='preview-output';
(async()=>{
 fs.mkdirSync(screenshots,{recursive:true});
 const legacy=fs.readFileSync('dist/ornate-buttons.css','utf8');
 for(const theme of themes){
  const filename='dist/art/canonical-gems/'+theme+'.svg';
  assert(fs.statSync(filename).size>1300,'Missing shared '+theme+' gem');
  assert(legacy.includes('canonical-gems/'+theme+'.svg'),'Legacy UI still points to alternate '+theme+' diamond');
  assert(!legacy.includes('url("./art/ornate-'+theme+'.svg")'),'Alternate '+theme+' gem still active');
 }
 const svg=fs.readFileSync('dist/art/canonical-gems/amethyst.svg','utf8');
 assert(svg.includes('id="gemstone"'),'Canonical gem source group missing');
 assert(svg.includes('M0-43L23-18L28 3L0 40'),'Master facet outline missing');
 const storeIndex=fs.readFileSync('dist/index.html','utf8');
 assert(storeIndex.includes('ornate-gem-theme.js'),'Applied-theme controller missing');
 assert(storeIndex.includes('test170-reference-buttons.css'),'Original approved frame missing');
 const server=spawn('python3',['-m','http.server','5277','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let up=false;for(let i=0;i<70;i++){try{if((await fetch(url)).ok){up=true;break}}catch{}await sleep(160)}
  assert(up,'Preview not served');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
    if(r.status()>=400 && /(?:canonical-gems|test170-buttons|test171-tabletop-frames)/.test(r.url()))
      errors.push(r.status()+' '+r.url());
  });
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
  }
  await page.waitForFunction(()=>document.querySelector('html')?.dataset.oathGemTheme==='amethyst',null,{timeout:12000});
  const inspect=()=>page.evaluate(()=>{
    const html=document.documentElement;
    const buttons=[...document.querySelectorAll('button.oath170-reference-button')].filter(b=>b.getBoundingClientRect().width>0);
    const list=buttons.map(b=>({
      label:b.textContent.trim().slice(0,90),
      background:getComputedStyle(b).backgroundImage,
      before:getComputedStyle(b,'::before').content,
      after:getComputedStyle(b,'::after').content,
      size:b.getBoundingClientRect().width
    }));
    const legacy=getComputedStyle(html).getPropertyValue('--oath-button-gem-image').trim();
    const selected=html.dataset.oathGemTheme;
    return {selected,legacy,buttons:list};
  });
  const defaultState=await inspect();
  assert.equal(defaultState.selected,'amethyst','Unapplied Moonlit background must retain amethyst');
  assert(defaultState.legacy.includes('canonical-gems/amethyst.svg'),
    'Legacy component is not using the same generated amethyst master');
  assert(defaultState.buttons.length>=3,'Canonical nav buttons missing');
  for(const b of defaultState.buttons){
    assert(b.background.includes('test170-buttons/amethyst-'),
       'A gold button uses an alternate gemstone geometry: '+b.label+' '+b.background);
    assert.equal(b.before,'none','An old badge is overlaid on a master gold frame: '+b.label);
    assert.equal(b.after,'none','A second gem is overlaid on master button: '+b.label);
  }
  await page.screenshot({path:screenshots+'/gem-01-amethyst-overview.png',fullPage:true});
  await page.locator('#appMenu summary').click();
  await page.screenshot({path:screenshots+'/gem-02-amethyst-menu.png',fullPage:true});
  const menuState=await inspect();
  for(const b of menuState.buttons){
    assert(b.background.includes('test170-buttons/amethyst-'),'Menu not using canonical master: '+b.label);
  }
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="backgrounds"]').first().click();
  await page.locator('[data-store-background="ancient-ruins"]').first().click({force:true});
  await page.waitForTimeout(300);
  assert.equal(await page.locator('html').getAttribute('data-oath-gem-theme'),'amethyst',
     'Browsing a Store preview must NOT change applied gemstone color');
  await page.screenshot({path:screenshots+'/gem-03-store-preview-does-not-apply.png',fullPage:true});
  await page.evaluate(()=>document.body.setAttribute('data-store-paid-background','ancient-ruins'));
  await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='emerald',null,{timeout:8000});
  const appliedState=await inspect();
  assert(appliedState.legacy.includes('canonical-gems/emerald.svg'),'Applied emerald is not the canonical gem');
  for(const b of appliedState.buttons)
    assert(b.background.includes('test170-buttons/emerald-'),'Selected background not reflected in button master: '+b.label);
  await page.screenshot({path:screenshots+'/gem-04-simulated-applied-emerald.png',fullPage:true});
  await page.evaluate(()=>document.body.removeAttribute('data-store-paid-background'));
  await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='amethyst',null,{timeout:8000});
  await page.screenshot({path:screenshots+'/gem-05-amethyst-restored.png',fullPage:true});
  assert.deepEqual(errors,[],'Script / image loading errors: '+errors.join(', '));
  const result={
    status:'PASS',
    scope:'Canonical frame and standalone gemstone geometry, six themes, applied vs preview behavior',
    selectedPreviewDoesNotChangeTheme:true,liveApplicationChangesTheme:true,
    allMasterButtonsSingleGem:true,standaloneThemeFiles:themes,
    existingBakedStoreJewelArtwork:'NOT CLAIMED FIXED: must be checked separately',
    screenshots:5,errors,
    userVisualApproval:false,apkCreated:false
  };
  fs.writeFileSync(screenshots+'/gem-audit-report.json',JSON.stringify(result,null,2));
  console.log('WORKBENCH GEM PASS: 6 canonical standalone gems, no extra pseudo gems, selected vs applied scene behavior verified, no APK.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error('WORKBENCH GEM FAIL',e.stack||e);process.exitCode=1});
