/* Browser QA of actual archived Build 144 interface + gem overlay; no APK is built. */
const {chromium}=require("playwright");
const {spawn}=require("node:child_process");
const fs=require("node:fs");
const assert=require("node:assert/strict");
const mappings={
  "moonlit-citadel":"sapphire","ancient-ruins":"emerald",
  "enchanted-forest":"aquamarine","dragons-crag":"ruby",
  "shadow-marsh":"amethyst","celestial-plains":"emerald",
  "crystal-caverns":"amethyst","elder-grove":"emerald",
  "mystic-lake":"sapphire","eternal-keep":"citrine"
};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const host="http://127.0.0.1:5189";
(async()=>{
 const server=spawn("python3",["-m","http.server","5189","--directory","dist"],{stdio:"ignore"});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<60;i++){try{if((await fetch(host)).ok){ready=true;break}}catch{} await sleep(250)}
  assert(ready,"Archive preview server did not start");
  browser=await chromium.launch({headless:true});
  fs.mkdirSync("preview-output", {recursive:true});
  for(const width of [320,393,768]){
   const page=await browser.newPage({viewport:{width,height:875},deviceScaleFactor:1});
   const errors=[];page.on("pageerror",e=>errors.push(e.message));
   await page.goto(host,{waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>document.documentElement.hasAttribute("data-oath-gem-theme"));
   if(await page.locator("#termsGate").isVisible().catch(()=>false)){
     await page.locator("#termsAge").selectOption("teen");
     await page.locator("#termsAgree").check();
     await page.locator("#termsAccept").click();
   }
   if(await page.locator(".store-page").count()===0){
    if(await page.locator("#appMenu summary").count()){
      await page.locator("#appMenu summary").click();
      await page.locator('#appMenu button[data-tab="Store"]').click();
    } else {
      await page.locator('[data-tab="Store"]').first().click();
    }
   }
   await page.locator(".store-page").waitFor({timeout:10000});
   const category=page.locator('[data-store-category="backgrounds"]').first();
   await category.click();
   await page.waitForTimeout(350);
   const actual=await page.evaluate(()=>{
     const store=document.querySelector('.store-page');
     return {className:store?.className,classes:[...new Set([...store.querySelectorAll('[class]')].map(x=>x.className).filter(x=>typeof x==='string'))].slice(0,60),
       tiles:store?.querySelectorAll('button').length,
       tileHTML:[...store.querySelectorAll('button')].slice(0,14).map(x=>x.outerHTML.slice(0,350)),
       snippet:store?.innerHTML.slice(0,3000),
       theme:document.documentElement.dataset.oathGemTheme};
   });
   console.log('ACTUAL FROZEN STORE DOM '+JSON.stringify(actual)); 
   assert.equal(await page.locator('.store-background-tile').count(),10,'Ten background previews');
   for(const [slug,gem] of Object.entries(mappings)){
    const tile=page.locator('[data-store-background="'+slug+'"]');
    await tile.click();
    await page.waitForFunction(v=>document.documentElement.dataset.oathGemTheme===v,gem,{timeout:3000});
    const after=await page.locator('.store-category-row button').first().evaluate(el=>getComputedStyle(el,'::after').backgroundImage);
    assert(after.includes("ornate-"+gem+".svg"),'Incorrect gemstone on '+slug+': '+after);
    const img=page.locator('.store-background-preview-image');
    await img.waitFor();
    const valid=await img.evaluate(el=>el.complete&&el.naturalWidth>0);
    assert(valid,'Background image missing for '+slug);
   }
   const blocked=await page.locator('.store-category-row button').first().evaluate(el=>getComputedStyle(el,'::after').pointerEvents);
   assert.equal(blocked,"none","Decorative trim must not intercept clicks");
   await page.screenshot({path:"preview-output/gem-backgrounds-"+width+".png",fullPage:true});
   await page.locator('[data-store-category="dice"]').first().click();
   assert.equal(await page.locator(".store-dice-tile").count(),10,"Dice assets retained");
   await page.screenshot({path:"preview-output/gem-dice-"+width+".png",fullPage:true});
   await page.locator('[data-store-category="icons"]').first().click();
   assert.equal(await page.locator(".store-icon-tile").count(),10,"Icon assets retained");
   await page.locator('[data-store-category="bundles"]').first().click();
   assert.equal(await page.locator(".bundle-offer").count(),2,"Bundle offers retained");
   assert.equal(await page.locator(".bundle-background-pick").count(),10,"Bundle backgrounds retained");
   await page.screenshot({path:"preview-output/gem-bundles-"+width+".png",fullPage:true});
   // The applied theme follows verified app state, never a previous store preview.
   await page.evaluate(()=>document.body.setAttribute('data-store-paid-background','elder-grove'));
   await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='emerald');
   await page.evaluate(()=>document.body.removeAttribute('data-store-paid-background'));
   await page.waitForFunction(()=>document.documentElement.dataset.oathGemTheme==='sapphire');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);
   assert(!overflow,'Horizontal overflow on '+width+'px viewport');
   assert.deepEqual(errors,[],'No browser exceptions at '+width+'px');
   await page.close();
  }
  console.log('PASS: actual frozen Build 144 screens, ten theme mappings, image loading, button clicks, 3 viewports.');
 } finally{if(browser)await browser.close();server.kill();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
