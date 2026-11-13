/* Independent browser check of real geometric dice and protected original Store GIF. */
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto'),{spawn}=require('node:child_process');
const {chromium}=require('playwright');
const url='http://127.0.0.1:5294',sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const digest=crypto.createHash('sha256').update(fs.readFileSync('dist/art/exact-store/roll/astral-original.gif')).digest('hex');
 assert.equal(digest,'fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb',
  'Approved Store GIF changed');
 assert(fs.readFileSync('dist/index.html','utf8').includes('workbench-gameplay-mesh.js'),'Mesh not packaged');
 const server=spawn('python3',['-m','http.server','5294','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<90;i++){try{if((await fetch(url)).ok){ready=true;break}}catch{}await sleep(150)}
  assert(ready,'Web server unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');
   await page.locator('#termsAgree').check();await page.locator('#termsAccept').click();
  }
  await page.waitForFunction(()=>!!globalThis.OathkeeperMeshWorkbench,null,{timeout:15000});
  const geometry=await page.evaluate(()=>globalThis.OathkeeperMeshWorkbench.geometryFaces);
  assert.equal(geometry[100],100,'D100 is NOT 100 distinct geometric faces');
  assert.equal(geometry[20],20,'D20 face count changed');
  assert.equal(geometry[12],12,'D12 face count changed');
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="dice"]').first().click();
  await page.locator('[data-store-dice="astral"]').first().click({force:true});
  const showcase=page.locator('.ok-exact-store .ok-roll-box img.ok-roll');
  await showcase.waitFor({state:'visible',timeout:12000});
  const source=await showcase.getAttribute('src');
  assert(source.includes('/roll/astral.webp'),'Store showcase changed: '+source);
  assert.equal(await page.locator('.ok-exact-store .workbench-mesh-frame').count(),0,
   'Gameplay mesh leaked into Store');
  await page.screenshot({path:'preview-output/mesh-store-untouched.png',fullPage:true});
  // Build 144 intentionally hides its character nav while Store is selected.
  // Reopen the saved character screen before selecting Dice; do not force a
  // hidden button click or alter the app's real navigation behavior.
  await page.goto(url,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');
   await page.locator('#termsAgree').check();await page.locator('#termsAccept').click();
  }
  await page.locator('#nav button[data-tab="Dice"]').click();
  const toggle=page.locator('input[data-k="diceAnimation"]');
  if(!await toggle.isChecked())await toggle.check({force:true});
  await page.locator('[data-die="20"]').first().click();
  await page.locator('#diceForm button.dice-roll').click();
  await page.locator('#diceTabletop.workbench-mesh-stage canvas.workbench-mesh-canvas').waitFor({state:'visible',timeout:12000});
  const canvas=await page.locator('canvas.workbench-mesh-canvas').evaluate(e=>({w:e.width,h:e.height}));
  assert(canvas.w>=480 && canvas.h>=480,'Canvas graphics too small: '+JSON.stringify(canvas));
  await page.screenshot({path:'preview-output/mesh-d20-in-motion.png',fullPage:true});
  await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',null,{timeout:16000});
  const faces=await page.locator('#diceTabletop [data-dice-landed]').innerText();
  assert(/D20\s+\d+/.test(faces),'Secure landed result not rendered: '+faces);
  await page.screenshot({path:'preview-output/mesh-d20-landed.png',fullPage:true});
  await page.locator('[data-die="100"]').first().click();
  await page.locator('#diceForm button.dice-roll').click();
  await page.waitForFunction(()=>document.querySelector('#diceTabletop')?.dataset.state==='landed',null,{timeout:16000});
  const hundred=await page.locator('#diceTabletop [data-dice-landed]').innerText();
  assert(/D100\s+\d+/.test(hundred),'D100 actual roll missing: '+hundred);
  await page.screenshot({path:'preview-output/mesh-d100-landed.png',fullPage:true});
  assert.deepEqual(errors,[],'Browser JS exception');
  fs.writeFileSync('preview-output/mesh-test-report.json',JSON.stringify({status:'PASS',geometry,storeGifSha256:digest,storeSource:source,d20:faces,d100:hundred,canvas,deviceViewport:[393,852]},null,2));
  console.log('WORKBENCH MESH PASS: genuine 100-face D100, correct D20 source geometry, separate original Store GIF; secure results displayed');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('WORKBENCH MESH FAILURE',e.stack||e);process.exitCode=1});
