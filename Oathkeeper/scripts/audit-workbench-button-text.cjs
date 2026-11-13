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
   await page.waitForTimeout(180);
   const results=await page.locator('button.oath170-reference-button:visible').evaluateAll(buttons=>buttons.map(b=>{
    const box=b.getBoundingClientRect(),range=document.createRange();
    range.selectNodeContents(b);const r=range.getBoundingClientRect();
    const cs=getComputedStyle(b);
    // The image has a 420x260 viewBox with default xMidYMid meet.
    // A wide, short CSS background box does not imply the SVG itself fills
    // that entire box: SVG preserveAspectRatio letterboxes the actual frame.
    // Fit the label to the PAINTED plaque, not the HTML button hit target.
    const svgWidth=420,svgHeight=260;
    const scale=Math.min(box.width/svgWidth,box.height/svgHeight);
    const paintWidth=svgWidth*scale,paintHeight=svgHeight*scale;
    const painted={left:box.left+(box.width-paintWidth)/2,
      top:box.top+(box.height-paintHeight)/2,
      width:paintWidth,height:paintHeight};
    painted.right=painted.left+paintWidth;
    painted.bottom=painted.top+paintHeight;
    const safe={left:painted.left+painted.width*.155,right:painted.right-painted.width*.155,
      top:painted.top+painted.height*.34,bottom:painted.bottom-painted.height*.34};
    const label=b.textContent.trim().replace(/\s+/g,' ').slice(0,100);
    const readable=label!=='Manage player stats & initiative'||parseFloat(cs.fontSize)>=12.5;
    const debug=label==='Manage player stats & initiative'?{
      outerHTML:b.outerHTML.slice(0,1800),
      wrapped:b.querySelector('.oath170-two-line-label')!==null,
      sizeVariable:b.style.getPropertyValue('--oath170-fit-size'),
      leadingVariable:b.style.getPropertyValue('--oath170-fit-leading'),
      children:[...b.childNodes].map(n=>({type:n.nodeType,tag:n.nodeName,text:n.textContent.slice(0,130)})),
      computedWhiteSpace:cs.whiteSpace,
      innerHTML:b.innerHTML.slice(0,1000)
    }:undefined;
    return {label,readable,debug,selector:b.id||b.dataset.tab||b.dataset.action||b.parentElement?.id||b.className,
      x:box.x,y:box.y,w:box.width,h:box.height,tx:r.x,ty:r.y,tw:r.width,th:r.height,
      safe,painted,background:cs.backgroundImage,backgroundSize:cs.backgroundSize,fontSize:cs.fontSize,
      good:box.width>=60&&box.height>=60&&r.width>0&&r.height>0&&
       r.left>=safe.left-1.25&&r.right<=safe.right+1.25&&
       r.top>=safe.top-1.25&&r.bottom<=safe.bottom+1.25&&
       b.dataset.oath170TextFit==='ok' && cs.backgroundImage.includes('test170-buttons') &&
       parseFloat(cs.fontSize)>=10.5 && readable};
   }));
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
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-tab="My profile"]').click();
   await audit('profile');
   await page.screenshot({path:'preview-output/button-text-profile-'+width+'.png',fullPage:true});
   await open(width);
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-tab="DM"]').scrollIntoViewIfNeeded();
   await page.locator('#appMenu button[data-tab="DM"]').click();
   await audit('dm');
   await page.screenshot({path:'preview-output/button-text-dm-'+width+'.png',fullPage:true});
   await open(width);
   await page.locator('#nav button[data-tab="Dice"]').click();
   await audit('dice');
   await page.screenshot({path:'preview-output/button-text-dice-'+width+'.png',fullPage:true});
  }
  fs.writeFileSync('preview-output/workbench-button-text-report.json',JSON.stringify({total:report.length,failures,report},null,2));
  console.log('WORKBENCH PAINTED-FRAME BUTTON TEXT: '+report.length+' labels measured, '+failures.length+' violations at 360/393/412');
  if(failures.length){console.error(JSON.stringify(failures.slice(0,25),null,2));process.exitCode=1}
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('WORKBENCH BUTTON AUDIT FAILED',e.stack||e);process.exitCode=1});
