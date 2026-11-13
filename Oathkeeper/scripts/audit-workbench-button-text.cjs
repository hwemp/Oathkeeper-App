/* Workbench issue #2: browser-only button label and gold-frame safety audit.
 * No Android build, APK, app logic changes, or visual approval implied.
 */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const HOST='http://127.0.0.1:5262';
const sleep=n=>new Promise(r=>setTimeout(r,n));
const widths=[360,393,412];
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 const server=spawn('python3',['-m','http.server','5262','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(175)}
  assert(ready,'Preview server unavailable');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  const failures=[],report=[];
  const audit=async(label)=>{
   const results=await page.locator('button.oath170-reference-button:visible').evaluateAll(buttons=>buttons.map(b=>{
    const box=b.getBoundingClientRect(),range=document.createRange();
    range.selectNodeContents(b);const r=range.getBoundingClientRect();
    const cs=getComputedStyle(b);
    const safe={left:box.left+box.width*.10,right:box.right-box.width*.10,
      top:box.top+box.height*.275,bottom:box.bottom-box.height*.275};
    return {label:b.textContent.trim().replace(/\\s+/g,' ').slice(0,100),selector:b.id||b.dataset.tab||b.dataset.action||b.parentElement?.id||b.className,
      x:box.x,y:box.y,w:box.width,h:box.height,tx:r.x,ty:r.y,tw:r.width,th:r.height,
      safe,background:cs.backgroundImage,fontSize:cs.fontSize,
      good:box.width>=60&&box.height>=60&&r.width>0&&r.height>0&&
       r.left>=safe.left-2&&r.right<=safe.right+2&&
       r.top>=safe.top-2&&r.bottom<=safe.bottom+2};
   })));
   for(const item of results){report.push({width:page.viewportSize().width,screen:label,...item});if(!item.good)failures.push({width:page.viewportSize().width,screen:label,...item});}
  };
  const open=async(width)=>{
   await page.setViewportSize({width,height:852});
   await page.goto(HOST,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
   await page.waitForFunction(()=>document.querySelector('#nav button.oath170-reference-button'),null,{timeout:14000});
  };
  for(const width of widths){
   await open(width);await audit('overview');
   await page.screenshot({path:'preview-output/button-text-overview-'+width+'.png',fullPage:true});
   await page.locator('#appMenu summary').click();
   await audit('menu');
   await page.screenshot({path:'preview-output/button-text-menu-'+width+'.png',fullPage:true});
   await page.locator('#appMenu button[data-action="edit-journal"]').click();
   await audit('journal');
   await page.screenshot({path:'preview-output/button-text-journal-'+width+'.png',fullPage:true});
   await open(width);
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-action="edit-equipment"]').click();
   await audit('equipment');
   await page.screenshot({path:'preview-output/button-text-equipment-'+width+'.png',fullPage:true});
   await open(width);
   await page.locator('#nav button[data-tab="Dice"]').click();
   await audit('dice');
   await page.screenshot({path:'preview-output/button-text-dice-'+width+'.png',fullPage:true});
  }
  fs.writeFileSync('preview-output/workbench-button-text-report.json',JSON.stringify({total:report.length,failures,report},null,2));
  console.log('WORKBENCH BUTTON TEXT: '+report.length+' labels measured, '+failures.length+' violations at 360/393/412');
  if(failures.length){console.error(JSON.stringify(failures.slice(0,25),null,2));process.exitCode=1}
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('WORKBENCH BUTTON AUDIT FAILED',e.stack||e);process.exitCode=1});
