/* Read-only audit of the ACTUAL frozen TEST 171 icon collection. NO APK. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs'),assert=require('node:assert/strict');
const HOST='http://127.0.0.1:5244';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 fs.mkdirSync('preview-output',{recursive:true});
 const runtime=fs.readFileSync('dist/assets/main-FCw4hQ90.js','utf8');
 const snippets={};
 for(const needle of ['function ey(', 'function ay(', 'function ty(','function okCanvas(', 'function okImage(','data-store-icon','ok-icon-preview']){
  let k=runtime.indexOf(needle);
  snippets[needle]={index:k,excerpt:k<0?'':runtime.slice(Math.max(0,k-300),k+1600)};
 }
 const server=spawn('python3',['-m','http.server','5244','--directory','dist'],{stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(HOST)).ok){ready=true;break}}catch{}await sleep(140)}
  assert(ready,'Web preview not served');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  await page.goto(HOST,{waitUntil:'domcontentloaded'});
  if(await page.locator('#termsGate').isVisible().catch(()=>false)){
   await page.locator('#termsAge').selectOption('teen');await page.locator('#termsAgree').check();await page.locator('#termsAccept').click();
  }
  await page.locator('#appMenu summary').click();
  await page.locator('#appMenu button[data-tab="Store"]').click();
  await page.locator('[data-store-category="icons"]').first().click();
  const selectors=['.ok-exact-store','.ok-canvas','.ok-art','[data-store-icon]','.store-icon-preview-image','.ok-replacement-preview','.ok-icon-preview'];
  const inspect=()=>page.evaluate(()=>{
    const sourceRect=e=>{const r=e.getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}};
    const canvas=document.querySelector('.ok-exact-store[data-ok-category="icons"]');
    const stage=canvas?.querySelector('.ok-canvas');
    const img=stage?.querySelector('img.ok-art');
    return{
      viewport:[window.innerWidth,window.innerHeight],
      outer:canvas?{rect:sourceRect(canvas),html:canvas.outerHTML.slice(0,2400)}:null,
      canvas:stage?{rect:sourceRect(stage),html:stage.outerHTML.slice(0,3500)}:null,
      img:img?{src:img.getAttribute('src'),natural:[img.naturalWidth,img.naturalHeight],rect:sourceRect(img)}:null,
      buttons:[...document.querySelectorAll('[data-store-icon]')].map(e=>({
        slug:e.getAttribute('data-store-icon'),aria:e.getAttribute('aria-pressed'),
        rect:sourceRect(e),style:getComputedStyle(e,'::before').backgroundImage,
        children:e.innerHTML.slice(0,300)
      }))
    };
  });
  const baseline=await inspect();
  await page.screenshot({path:'preview-output/workbench-icon-01-before.png',fullPage:true});
  const selections=[];
  for(const slug of ['icon-04','icon-08','icon-07','icon-14']){
    const button=page.locator('[data-store-icon="'+slug+'"]').first();
    await button.click({force:true});await sleep(160);
    selections.push({slug,...await inspect()});
    await page.screenshot({path:'preview-output/workbench-'+slug+'-before.png',fullPage:true});
  }
  const data={sourceSnippets:snippets,selectors,baseline,selections};
  fs.writeFileSync('preview-output/workbench-icon-baseline.json',JSON.stringify(data,null,2));
  console.log('WORKBENCH ICON BASELINE: '+JSON.stringify({
    source:snippets,
    first:baseline,
    selections:selections.map(s=>({slug:s.slug,img:s.img,buttons:s.buttons.slice(0,3)}))
   }).slice(0,21000));
 }finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
