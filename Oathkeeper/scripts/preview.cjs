const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const server=spawn('python3',['-m','http.server','5173','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--safe-area-inset-top','24px');document.documentElement.style.setProperty('--safe-area-inset-bottom','24px')}));
  await page.goto('http://127.0.0.1:5173');
  await page.evaluate(()=>document.fonts.ready);
  await page.getByRole('heading',{name:'Ready for the next encounter'}).waitFor();
  assert(await page.evaluate(()=>document.fonts.check('700 24px Chronicle')),'Gothic font must load');
  const menu=await page.locator('#appMenu summary').boundingBox();
  const bell=await page.locator('header > .notification-bell').boundingBox();
  assert(menu.y>=24&&bell.y>=24,'Controls must clear simulated status-bar inset');
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'No horizontal overflow');
  fs.mkdirSync('preview-output',{recursive:true});
  await page.screenshot({path:'preview-output/overview.png'});
  await page.getByRole('button',{name:'Powers',exact:true}).click();
  await page.screenshot({path:'preview-output/powers.png'});
  await page.getByRole('button',{name:'Inventory',exact:true}).click();
  await page.screenshot({path:'preview-output/inventory.png'});
  await page.locator('header > .notification-bell').click();
  await page.getByRole('heading',{name:'Notifications',exact:true}).waitFor();
  console.log('PASS: font loaded, safe-area placement, no overflow, tabs and bell navigation');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
