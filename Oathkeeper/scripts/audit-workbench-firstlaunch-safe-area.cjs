/* Device-sized browser verification of first-launch scrolling and consent UI.
 * No selection of age, no acceptance, no bypass of restrictions.
 */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const HOST='http://127.0.0.1:5318';
const sleep=n=>new Promise(r=>setTimeout(r,n));
(async()=>{
 assert(fs.readFileSync('dist/index.html','utf8').includes('workbench-firstlaunch-safe-area.css'));
 fs.mkdirSync('preview-output',{recursive:true});
 const server=spawn('python3',['-m','http.server','5318','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(125)}
  assert(ready,'Browser preview cannot start');
  browser=await chromium.launch({headless:true});
  const results=[];
  for(const [width,height] of [[360,780],[393,852],[412,915]]){
   const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2});
   await page.goto(HOST,{waitUntil:'domcontentloaded'});
   const gate=page.locator('#termsGate');
   await gate.waitFor({state:'visible',timeout:13000});
   const panel=gate.locator('.terms-scroll');
   await panel.waitFor({state:'visible'});
   const rect=await panel.boundingBox();
   assert(rect && rect.y>=7 && rect.y+rect.height <= height-7,
    'Consent panel exceeds device safe area at '+width+': '+JSON.stringify(rect));
   const reject=page.locator('#termsReject');
   const initial=await reject.boundingBox();
   assert(initial&&initial.y>=rect.y&&initial.y+initial.height<=Math.min(height-7,rect.y+rect.height),
    'Reject must be fully visible on INITIAL phone viewport without scrolling: '+JSON.stringify({initial,rect,height}));
   const accept=page.locator('#termsAccept');
   const a=await accept.boundingBox();
   assert(a&&a.y>=rect.y&&a.y+a.height<=Math.min(height-7,rect.y+rect.height),
    'Accept must be fully visible on initial viewport: '+JSON.stringify({a,rect,height}));
   const prose=page.locator('.terms-prose');
   const canReadFullTerms=await prose.evaluate(e=>e.scrollHeight>e.clientHeight && getComputedStyle(e).overflowY==='auto');
   assert(canReadFullTerms,'Full terms must remain scrollable, not truncated or skipped');
   await reject.scrollIntoViewIfNeeded();
   const b=await reject.boundingBox();
   assert(b&&b.y>=0&&b.y+b.height<=height,'Reject action inaccessible: '+JSON.stringify(b));
   assert(await gate.isVisible(),'Gate was incorrectly dismissed');
   await page.screenshot({path:'preview-output/workbench-firstlaunch-'+width+'.png'});
   results.push({width,height,panel:rect,reject:b});
   await page.close();
  }
  fs.writeFileSync('preview-output/workbench-firstlaunch-report.json',JSON.stringify({status:'PASS',ageGatePreserved:true,results},null,2));
  console.log('WORKBENCH FIRST-LAUNCH SAFE AREA PASS: all 3 phone widths, scrollable full consent, reject accessible, no age gate bypass');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error('WORKBENCH FIRST-LAUNCH FAILURE',e.stack||e);process.exitCode=1});
