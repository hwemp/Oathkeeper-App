/* Test 179 — one CI gate for the four repeatedly reported defects. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict');
const crypto=require('node:crypto');
const HOST='http://127.0.0.1:5299';
const S=['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
const B=['moonlit-citadel','ancient-ruins','enchanted-forest','dragons-crag','shadow-marsh','celestial-plains','crystal-caverns','elder-grove','mystic-lake','eternal-keep'];
const I=['01','02','04','05','06','07','08','11','12','14'];
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const report=JSON.parse(fs.readFileSync('preview-output/179-source-repair-report.json','utf8'));
 assert.equal(report.bundle_dice.length,10);
 assert.equal(report.backgrounds.length,10);
 assert.equal(hash('dist/art/exact-store/roll/astral-original.gif'),
 'fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb',
 'Frozen approved Store GIF changed');
 const source=fs.readFileSync('dist/assets/main-FCw4hQ90.js','utf8');
 assert(source.includes('art/test179-bundle-dice/'),'Picker uses old, undersized art');
 for(const slug of S)assert(fs.statSync('dist/art/test179-bundle-dice/'+slug+'.webp').size>12000,
 'Bundle die missing '+slug);
 for(const slug of B)assert(fs.statSync('dist/art/test179-backgrounds/'+slug+'.webp').size>12000,
 'Recomposited scene missing '+slug);
 for(const id of I) {
   const a='web/public/art/store-icons/icon-'+id+'.webp';
   const b='android/app/src/main/res/drawable-nodpi/oathkeeper_icon_art_'+id+'.webp';
   assert.equal(hash(a),hash(b),'Canonical source diverged '+id);
 }
 fs.mkdirSync('preview-output',{recursive:true});
 const server=spawn('python3',['-m','http.server','5299','--directory','dist'],{stdio:'ignore'});
 let browser,errors=[];
 try{
  let ready=false;
  for(let n=0;n<65;n++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await delay(170)}
  assert(ready,'Cannot reach generated Test179 browser app');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2,
   reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(HOST,{waitUntil:'load'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
  }
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="bundles"]').first().click({force:true});
  const tiles=page.locator('[data-store-bundle-dice] > img.ok-art');
  assert.equal(await tiles.count(),10,'Expected 10 distinct framed bundle dice');
  for(const slug of S){
    const tile=page.locator('[data-store-bundle-dice="'+slug+'"] > img.ok-art');
    await tile.evaluate(async el=>{await el.decode()});
    const data=await tile.evaluate(el=>({src:el.getAttribute('src'),w:el.naturalWidth,h:el.naturalHeight,
     fit:getComputedStyle(el).objectFit,rect:el.getBoundingClientRect().toJSON()}));
    assert(data.src.includes('/test179-bundle-dice/'+slug+'.webp')&&data.w===512&&data.h===512&&data.fit==='cover',
     'Bundle die not correctly fitted '+slug+': '+JSON.stringify(data));
  }
  await page.screenshot({path:'preview-output/179-bundle-dice-frame-fit.png',fullPage:true});
  await page.locator('[data-store-category="icons"]').first().click({force:true});
  for(const id of I){
    const e=page.locator('[data-store-icon="icon-'+id+'"]').first();
    const state=await e.evaluate(el=>({image:getComputedStyle(el,'::before').backgroundImage,
     size:getComputedStyle(el,'::before').backgroundSize}));
    assert(state.image.includes('/store-icons/icon-'+id+'.webp')&&state.size==='112% 112%',
     'Icon picture must use exactly one canonical full-frame source '+id+' '+JSON.stringify(state));
    await e.click({force:true});
    const large=page.locator('.ok-icon-launcher-master img.workbench-selected-launcher-art');
    assert((await large.getAttribute('src')).includes('/store-icons/icon-'+id+'.webp'),
     'Enlarged icon source mismatch '+id);
  }
  await page.screenshot({path:'preview-output/179-icon-frame-fit.png',fullPage:true});
  await page.locator('[data-store-category="backgrounds"]').first().click({force:true});
  for(const slug of B) {
    await page.locator('[data-store-background="'+slug+'"]').first().click({force:true});
    const img=page.locator('.ok-exact-store[data-ok-category="backgrounds"] .ok-canvas>img.ok-art');
    await img.evaluate(async el=>{await el.decode();});
    const result=await img.evaluate(el=>({src:el.getAttribute('src'),w:el.naturalWidth,h:el.naturalHeight}));
    assert(result.src.includes('/test169-bg/'+slug+'.webp')&&result.w===941&&result.h===1672,
     'Wrong full-scene preview '+slug);
    if(slug==='elder-grove'||slug==='mystic-lake') {
      await page.screenshot({path:'preview-output/179-background-'+slug+'.png',fullPage:true});
    }
  }
  // Exercise the ACTUAL illustrated tabletop adapter. No RNG substitution
  // or manipulated result: fixture supplies already-resolved secure values.
  const faces={3:2,4:3,6:5,8:7,10:7,12:11,20:17,50:34,100:83};
  for(const [sidesString,face] of Object.entries(faces)){
    const sides=Number(sidesString);
    await page.evaluate(({sides,face})=>{
      document.getElementById('diceTabletop')?.remove();
      const stage=document.createElement('div');
      stage.id='diceTabletop';
      stage.style.cssText='display:block;width:392px;max-width:100%;margin:30px auto;min-height:392px';
      document.body.append(stage);
      if(typeof globalThis.OathkeeperTabletop171?.play!=='function')
        throw Error('Approved gameplay renderer missing');
      globalThis.OathkeeperTabletop171.play(stage,{sides,rolls:[{value:face}],total:face,mode:'normal'},
        ()=>{stage.dataset.test179Completed='yes';},{slug:'astral'});
    },{sides,face});
    await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.test179Completed==='yes',null,{timeout:4500});
    const displayed=await page.locator('#diceTabletop .test171-die.test179-face-settled').first().evaluate(el=>{
      const face=el.querySelector('.test179-true-face');
      return {value:face?.textContent,original:el.dataset.rollFace,opacity:face?getComputedStyle(face).opacity:null,
       geometry:el.dataset.dieGeometry,accessible:el.getAttribute('aria-label')};
    });
    assert.equal(displayed.value,String(face),'Die image landed with wrong number: D'+sides);
    assert.equal(displayed.original,String(face));
    assert.equal(displayed.opacity,'1','Rolled number is hidden on the die');
    assert(displayed.accessible.includes('face '+face),'Die accessibility description does not agree with roll');
    if(sides===10)await page.locator('#diceTabletop').screenshot({path:'preview-output/179-d10-roll-7-visible-face.png'});
    if(sides===20)await page.locator('#diceTabletop').screenshot({path:'preview-output/179-d20-roll-17-visible-face.png'});
  }
  assert.equal(errors.length,0,'Page JavaScript errors '+JSON.stringify(errors));
  fs.writeFileSync('preview-output/179-acceptance-report.json',JSON.stringify({
   status:'passed',count_bundle_dice:tiles?10:0,icons:I.length,backgrounds:B.length,
   example_rolls:faces,original_store_gif_unchanged:true,
   background_originals_native_px:[508,360],
   note:'No genuine extra detail exists in 508x360 background source; this test validates fit and composition, not photo-grade super resolution.'
  },null,2));
  console.log('TEST 179 PASS: 10 bundle dice, ten matching launcher masters, ten full background previews, dynamic result-labelled illustrated die faces.');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error('TEST 179 FAILED',e.stack||e);process.exitCode=1});
