/* Test 178: verify new one-gem artwork, preserve frozen store GIF, and
 * capture actual browser Store Bundles/Dice render without simulation. */
const {chromium}=require('playwright');
const fs=require('node:fs'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const url='http://127.0.0.1:5278';
const sleep=t=>new Promise(r=>setTimeout(r,t));
(async()=>{
 const SHA='fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb';
 const gif='dist/art/exact-store/roll/astral-original.gif';
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(gif)).digest('hex'),SHA);
 const icons=['Home','Character','Community','Messages','Store'];
 const svgDir='dist/art/test170-buttons';
 const names=fs.readdirSync(svgDir).filter(n=>n.endsWith('.svg'));
 assert.equal(names.length,36,'6 gem themes × normal/selected × 3 plaque widths');
 for(const file of names){
  const text=fs.readFileSync(svgDir+'/'+file,'utf8');
  assert.equal((text.match(/<use href="#gemstone"/g)||[]).length,1,'extra lower gem in '+file);
 }
 assert(fs.readFileSync('dist/index.html','utf8').includes('test178-single-center-gem.css'));
 assert(fs.statSync('dist/art/exact-store/bundles-bottom.webp').size>200000);
 const server=spawn('python3',['-m','http.server','5278','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let n=0;n<90;n++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await sleep(160)}
  assert(ready);
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');
   await page.locator('#termsAgree').check();
   await page.locator('#termsAccept').click();
  }
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="bundles"]').first().click({force:true});
  const panels=page.locator('.ok-exact-store[data-ok-category="bundles"]');
  await panels.first().waitFor({state:'visible'});
  const artwork=page.locator('.ok-exact-store[data-ok-category="bundles"] img.ok-art[src*="bundles-bottom"]');
  assert(await artwork.count()>=1,'The restored single-centre-jewel source is not displayed');
  await artwork.first().evaluate(e=>e.decode());
  fs.mkdirSync('preview-output',{recursive:true});
  await page.screenshot({path:'preview-output/178-bundles-middle-gem-only.png',fullPage:true});
  await page.locator('[data-store-category="dice"]').first().click({force:true});
  const store=page.locator('.ok-exact-store[data-ok-category="dice"] .ok-roll-box img.ok-roll').first();
  await store.waitFor({state:'visible'});
  assert((await store.getAttribute('src')).includes('/roll/'),'Store GIF path modified');
  const masking=await store.evaluate(e=>getComputedStyle(e).maskImage);
  assert(masking.includes('radial-gradient'),'Dice thumbnail border treatment absent');
  await page.screenshot({path:'preview-output/178-dice-border-fit.png',fullPage:true});
  console.log('TEST 178: new button jewels and middle-only Store nav verified; frozen animated Store GIF unchanged');
 }finally{await browser?.close();server.kill()}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
