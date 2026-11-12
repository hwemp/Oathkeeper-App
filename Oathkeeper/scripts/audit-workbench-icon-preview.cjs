/* Workbench issue #1: browser-only, 10-way Store/Android icon parity.
 * Never builds or publishes an APK. Stop on any missing/mismatched image.
 */
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
const {chromium}=require('playwright'),{spawn}=require('node:child_process');
const HOST='http://127.0.0.1:5255';
const ids=['01','02','04','05','06','07','08','11','12','14'];
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const sleep=n=>new Promise(r=>setTimeout(r,n));
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 const compiled=fs.readFileSync('dist/assets/main-FCw4hQ90.js','utf8');
 const s=compiled.slice(compiled.indexOf('function ay('),compiled.indexOf('function okPickGrid('));
 assert(s.includes('workbench-selected-launcher-art') && s.includes("const exactIcon='art/store-icons/'+master+'.webp'"),'Selected-preview master mapping not in frozen runtime');
 assert(s.includes("img:'icons-workbench'"),'The old baked icon gallery is still being displayed');
 assert(!s.includes('ok-icon-neutral-launcher')&&!s.includes('okNeutral(S,4'),'Obsolete special-case fifth icon overlay remains');
 assert(!s.includes("okImage(r.slug"),'Old baked icon preview still active in Store selection function');
 assert(!s.includes("okNeutral(S,4"),'Legacy preselected tile still references old art');
 const css=fs.readFileSync('dist/test164-overrides.css','utf8');
 assert(!css.includes('launcher-01.webp'),'Old Store icon aliases are still rendered');
 assert(css.includes('ok-icon-preview.ok-icon-launcher-master'),'New preview image-fit rule missing');
 for(const id of ids){
  const a='dist/art/store-icons/icon-'+id+'.webp',b='android/app/src/main/res/drawable-nodpi/oathkeeper_icon_art_'+id+'.webp';
  assert.equal(sha(a),sha(b),'Web preview file is not the ACTUAL Android launcher master: '+id);
  assert(!fs.existsSync('dist/art/store-icons/launcher-'+id+'.webp'),'Old secondary alias still being packaged: '+id);
 }
 const server=spawn('python3',['-m','http.server','5255','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let k=0;k<80;k++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(160)}
  assert(ready,'Preview server not ready');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  page.on('response',r=>{if(r.status()>=400&&/store-icons|exact-store\/icon/.test(r.url()))errors.push(r.status()+' '+r.url())});
  const open=async()=>{
   await page.goto(HOST,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-tab="Store"]').click();
   await page.locator('[data-store-category="icons"]').first().click();
  };
  await open();
  const audit=[];
  for(const id of ids){
   const slug='icon-'+id;
   const tile=page.locator('[data-store-icon="'+slug+'"]').first();
   await tile.click({force:true});
   const preview=page.locator('.ok-exact-store[data-ok-category="icons"] .ok-icon-preview.ok-icon-launcher-master img.workbench-selected-launcher-art');
   await preview.waitFor({state:'visible',timeout:10000});
   await preview.evaluate(async im=>{if(!im.complete)await im.decode()});
   const read=await page.evaluate(slug=>{
    const selected=document.querySelector('.ok-exact-store[data-ok-category="icons"] .ok-icon-preview img.workbench-selected-launcher-art');
    const t=document.querySelector('[data-store-icon="'+slug+'"]');
    const root=document.querySelector('.ok-exact-store[data-ok-category="icons"] .ok-canvas');
    const backing=root?.querySelector(':scope > img.ok-art');
    const backingUrl=backing?new URL(backing.getAttribute('src'),document.baseURI).pathname:'';
    const tileStyle=getComputedStyle(t);
    const unselected=document.querySelector('[data-store-icon]:not(.ok-selected)');
    const neutralStyle=unselected?getComputedStyle(unselected):null;
    const r=selected.getBoundingClientRect(),container=root.getBoundingClientRect();
    const src=new URL(selected.currentSrc||selected.getAttribute('src'),document.baseURI).pathname;
    const background=getComputedStyle(t,'::before').backgroundImage;
    return {src,background,alt:selected.alt,geometry:{w:r.width,h:r.height,x:r.x,y:r.y},
      region:{w:container.width,h:container.height},natural:{w:selected.naturalWidth,h:selected.naturalHeight},
      fit:getComputedStyle(selected).objectFit,
      backingUrl,
      tileFrame:tileStyle.borderRadius,
      selectedGlow:tileStyle.boxShadow,
      unselectedGlow:neutralStyle?.boxShadow||'',
      iconTileCount:document.querySelectorAll('.ok-exact-store[data-ok-category="icons"] .ok-canvas > button[data-store-icon]').length,
      oldNeutralLayers:document.querySelectorAll('.ok-exact-store[data-ok-category="icons"] .ok-icon-neutral-launcher').length,
      selectedCount:document.querySelectorAll('img.workbench-selected-launcher-art').length,
      pressed:t.getAttribute('aria-pressed'),bodyText:root.textContent.slice(-160)};
   },slug);
   assert.equal(read.src,'/art/store-icons/'+slug+'.webp','Enlarged icon preview is NOT the native master for '+slug);
   assert(read.background.includes('/art/store-icons/'+slug+'.webp'),'Selection tile does not use same native master '+slug);
   assert.equal(read.natural.w,1254,'Icon is not the approved 1254px launcher master '+slug);
   assert.equal(read.natural.h,1254);
   assert.equal(read.fit,'contain','Preview image must preserve the full square artwork '+slug);
   assert.equal(read.selectedCount,1,'Multiple preview image layers exist '+slug);
   assert.equal(read.backingUrl,'/art/exact-store/icons-workbench.webp','Old fixed icon gallery backing still displayed');
   assert.equal(read.iconTileCount,10,'Ten live master icon tiles are not present');
   assert.equal(read.oldNeutralLayers,0,'Old black-background Chalice overlay is still present');
   assert(read.selectedGlow!==read.unselectedGlow,'Selected tile lacks unique live glow');
   assert(read.tileFrame.includes('15px'),'Selected tile gold frame shape is not uniform');
   assert.equal(read.pressed,'true','Store selection lost active semantics '+slug);
   const nameExpected={'07':'Twin Battleaxes','08':'Astral D20'}[id];
   if(nameExpected){
     assert(read.alt.includes(nameExpected),'Selected preview name does not match actual native launcher art '+slug);
     assert(read.bodyText.includes(nameExpected+' selected'),'Selected caption is assigned to wrong native launcher icon '+slug);
   }
   assert(read.geometry.w>90&&read.geometry.h>90&&read.geometry.w<=read.region.w,'Selected icon is improperly sized '+slug);
   await page.screenshot({path:'preview-output/workbench-icon-'+id+'-after.png',fullPage:true});
   audit.push({slug,sha256:sha('dist/art/store-icons/icon-'+id+'.webp'),...read});
  }
  // The first/last tile and preview must not regress at narrower or wider phones.
  for(const width of [360,412]){
   await page.setViewportSize({width,height:852});
   for(const slug of ['icon-04','icon-08']){
    await page.locator('[data-store-icon="'+slug+'"]').first().click({force:true});
    const preview=page.locator('img.workbench-selected-launcher-art');
    assert((await preview.getAttribute('src')).includes(slug+'.webp'),'Responsive preview changed icon art at '+width+'px');
    const bounds=await preview.boundingBox();
    assert(bounds&&bounds.x>=0&&bounds.x+bounds.width<=width+2,'Icon extends outside phone viewport');
    await page.screenshot({path:'preview-output/workbench-'+slug+'-'+width+'-after.png',fullPage:true});
   }
  }
  // Confirm other Store categories are untouched.
  await page.locator('[data-store-category="dice"]').first().click();
  assert(await page.locator('.ok-exact-store[data-ok-category="dice"] .ok-roll-box img.ok-roll').count()===1,
    'Dice Store showcase altered by icon repair');
  await page.locator('[data-store-category="backgrounds"]').first().click();
  assert(await page.locator('.ok-exact-store[data-ok-category="backgrounds"] .ok-canvas img.ok-art').count()===1,
    'Background gallery altered by icon repair');
  assert.deepEqual(errors,[],'Browser image/loading errors: '+errors.join('\n'));
  const report={result:'PASS',branch:'OATHKEEPER-VISUAL-WORKBENCH',apkPublished:false,
    total:ids.length,source:'actual Android launcher WebP',
    allTenNativeMasterPreviewMatch:true,otherStoreCategoriesUntouched:true,visualUserApproval:false,
    icons:audit,errors};
  fs.writeFileSync('preview-output/workbench-icon-fixed-report.json',JSON.stringify(report,null,2));
  console.log('WORKBENCH ICON PARITY PASS: 10/10 enlarged previews, thumbnails, and Android launcher assets match exactly; no APK produced.');
 }finally{
  if(browser)await browser.close();
  server.kill();
 }
})().catch(e=>{console.error('WORKBENCH ICON PARITY FAIL',e.stack||e);process.exitCode=1});
