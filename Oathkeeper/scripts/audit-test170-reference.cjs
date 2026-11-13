/* TEST 170: real Android-size visual acceptance for locked reference buttons.
 * Browser checks compare state images, gemstone mapping and text safety; never
 * infer success merely because a CSS file exists. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const HOST='http://127.0.0.1:5210';
const sleep=n=>new Promise(r=>setTimeout(r,n));
const themes=['amethyst','sapphire','emerald','ruby','aquamarine','citrine'];
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 for(const theme of themes){
  for(const state of ['selected','normal']){
   const path='dist/art/test170-buttons/'+theme+'-'+state+'.svg';
   assert(fs.statSync(path).size>2500,'Missing SVG '+path);
   const text=fs.readFileSync(path,'utf8');
   assert(text.includes('<use href="#gemstone"'),'Original gem silhouette absent '+path);
   assert(!text.includes('__THEME__'),'Unresolved template placeholder '+path);
  }
 }
 const server=spawn('python3',['-m','http.server','5210','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(175)}
  assert(ready,'Mobile renderer unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
   if(r.status()>=400&&/test170-buttons|test170-reference-buttons|test170-button-states/.test(r.url()))
    errors.push(r.status()+' '+r.url());
  });
  const open=async()=>{
   await page.goto(HOST,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
   await page.waitForFunction(()=>document.querySelector('#nav button.oath170-reference-button'),null,{timeout:14000});
  };
  const bg=el=>el.evaluate(e=>getComputedStyle(e).backgroundImage);
  const textBounds=el=>el.evaluate(e=>{
   const r=e.getBoundingClientRect(),range=document.createRange();
   range.selectNodeContents(e);
   const t=range.getBoundingClientRect();
   return {label:e.textContent.trim(),x:r.x,y:r.y,w:r.width,h:r.height,
    tx:t.x,ty:t.y,tw:t.width,th:t.height};
  });
  const assertSafe=(b,label)=>{
    assert(b.w>60&&b.h>60,label+' button collapsed: '+JSON.stringify(b));
    const safeLeft=b.x+b.w*.095,safeRight=b.x+b.w*.905;
    assert(b.tx>=safeLeft-5 && b.tx+b.tw<=safeRight+5,
      label+' overlaps ornamental side frame: '+JSON.stringify(b));
    assert(b.ty>=b.y+b.h*.17-3 && b.ty+b.th<=b.y+b.h*.83+3,
      label+' overlaps top/bottom gemstone: '+JSON.stringify(b));
  };
  await open();
  assert.equal(await page.locator('html').getAttribute('data-oath-gem-theme'),'amethyst',
    'Default moonlit theme must be amethyst, not old blue sapphire');
  const overview=page.locator('#nav [data-tab="Overview"]');
  const powers=page.locator('#nav [data-tab="Powers"]');
  assert((await bg(overview)).includes('amethyst-selected.svg'),'Overview lacks selected gold glow master');
  assert((await bg(powers)).includes('amethyst-normal.svg'),'Powers should use unselected master');
  for(const b of await page.locator('#nav button').all())assertSafe(await textBounds(b),'Navigation');
  await page.screenshot({path:'preview-output/170-overview-selected-amethyst.png',fullPage:true});

  await page.locator('#appMenu summary').click();
  const menu=page.locator('#appMenu .menu-options button.oath170-reference-button');
  await menu.first().waitFor({timeout:10000});
  for(const b of await menu.all())assertSafe(await textBounds(b),'Menu');
  await page.screenshot({path:'preview-output/170-menu-amethyst-button-design.png',fullPage:true});
  await page.locator('#appMenu summary').click();

  // The selected glow must FOLLOW actual navigation, not stay on Overview.
  await powers.click();
  assert((await bg(powers)).includes('amethyst-selected.svg'),'Powers did not become glowing selected state');
  assert((await bg(overview)).includes('amethyst-normal.svg'),'Overview remained selected after navigation');
  await page.screenshot({path:'preview-output/170-powers-selected-amethyst.png',fullPage:true});

  // Validate that the same silhouette persists when another applied/preview
  // theme is shown. Emerald replaces only gem facets, NOT gold shape.
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="backgrounds"]').first().click();
  await page.locator('[data-store-background="ancient-ruins"]').first().click({force:true});
  // Store browsing is preview-only. Background gems follow APPLIED art,
  // not unowned previews; the old TEST 170 expectation caused CI timeouts.
  assert.equal(await page.locator('html').getAttribute('data-oath-gem-theme'),'amethyst',
    'A Store preview must not change the applied button gemstone');
  await page.evaluate(()=>document.body.setAttribute('data-store-paid-background','ancient-ruins'));
  await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='emerald',null,{timeout:10000});
  assert((await bg(page.locator('#nav [data-tab="Powers"]'))).includes('emerald-normal.svg'),
    'Unselected button gemstone did not follow the applied emerald background');
  await page.screenshot({path:'preview-output/170-emerald-applied-theme.png',fullPage:true});

  // Editor buttons render in the same family; label must not overlap jewels.
  await open();
  for(const width of [360,393,412]){
   await page.setViewportSize({width,height:852});
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-action="edit-journal"]').click();
   const buttons=page.locator('#journalEditor .row button.oath170-reference-button');
   assert((await buttons.count())>=2,'Journal actions not consistently styled');
   for(const b of await buttons.all())assertSafe(await textBounds(b),'Journal');
   await page.screenshot({path:'preview-output/170-journal-buttons-'+width+'.png',fullPage:true});
   await open();
  }
  // No modifications to 169 dice animation or Store thumbnail rendering.
  const index=fs.readFileSync('dist/index.html','utf8');
  assert(!index.includes('test168-live-3d.js'),'Unapproved polygon dice renderer was restored');
  assert(!index.includes('test166-bundle-overlay.js'),'Old separate bundle layer returned');
  assert.deepEqual(errors,[],'Browser errors using gemstone/button assets');
  console.log('TEST 170 PASS: selected navigation glows, inactive normal, emerald theme changes gems, menu/editor labels safe');
 } finally {
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('TEST 170 FAILED',e.stack||e);process.exitCode=1});
