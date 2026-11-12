/* Generate displayed Store dice cards directly from the *existing* Build 144
 * animated 3D rolling canvas. Do not repaint or replace the animation. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='http://127.0.0.1:5194';
const skins=['dragonfire','frostborne','elvenleaf','celestial','abyssal','gold-forged','necrotic','astral','oceanic','sunfire'];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const server=spawn('python3',['-m','http.server','5194','--directory','dist'],{stdio:'ignore'});
 let browser;
 const record=[];
 try {
  let served=false;
  for(let n=0;n<100;n++){try{if((await fetch(base)).ok){served=true;break}}catch{}await sleep(200)}
  assert(served,'Test 164 local app server was not ready');
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:3});
  const problems=[];
  page.on('pageerror',err=>problems.push(err.message));
  fs.mkdirSync('dist/art/test164-dice',{recursive:true});
  fs.mkdirSync('preview-output',{recursive:true});
  // Click a genuinely exposed area of a selected hitbox using the normal
  // pointer path. Never use force:true or el.click() to conceal overlapping
  // Store controls. This also checks real user taps, not only DOM handlers.
  const clickExposed=async(locator,slug)=>{
   await locator.scrollIntoViewIfNeeded();
   const p=await locator.evaluate(el=>{
    const r=el.getBoundingClientRect();
    const spots=[.5,.2,.8,.35,.65,.08,.92];
    for(const fy of spots)for(const fx of spots){
     const x=r.left+r.width*fx,y=r.top+r.height*fy;
     if(x<0||y<0||x>=innerWidth||y>=innerHeight)continue;
     const top=document.elementFromPoint(x,y);
     if(top===el||el.contains(top))return {x,y};
    }
    return null;
   });
   if(!p){
    const detail=await locator.evaluate(el=>{
     const r=el.getBoundingClientRect();
     const hit=(fx,fy)=>{
      const x=r.left+r.width*fx,y=r.top+r.height*fy;
      const top=document.elementFromPoint(x,y);
      return {fx,fy,x,y,tag:top?.tagName,cls:top?.className,html:top?.outerHTML?.slice(0,340),z:getComputedStyle(top||el).zIndex};
     };
     const hits=[hit(.5,.5),hit(.2,.2),hit(.8,.8),hit(.5,.1),hit(.1,.5)];
     const rects=[...document.querySelectorAll('[data-store-dice]')].map(item=>{
      const b=item.getBoundingClientRect();return {slug:item.getAttribute('data-store-dice'),r:[b.left,b.top,b.width,b.height],z:getComputedStyle(item).zIndex,position:getComputedStyle(item).position};
     });
     return {target:el.outerHTML.slice(0,380),rect:[r.left,r.top,r.width,r.height],hits,rects};
    });
    console.error('TEST 164 HITBOX DIAGNOSTIC '+slug,JSON.stringify(detail));
    await page.screenshot({path:'preview-output/164-hitbox-'+slug+'.png',fullPage:true});
    throw new Error(slug+': no uncovered pointer target. Correct overlapping gallery controls before release.');
   }
   await page.mouse.click(p.x,p.y);
   return p;
  };
  const open=async()=>{
   await page.goto(base,{waitUntil:'domcontentloaded'});
   if(await page.locator('#termsGate').isVisible().catch(()=>false)){
    await page.locator('#termsAge').selectOption('teen');
    await page.locator('#termsAgree').check();
    await page.locator('#termsAccept').click();
   }
  };
  for(const slug of skins){
   await open();
   await page.locator('#appMenu summary').click();
   await page.locator('#appMenu button[data-tab="Store"]').click();
   await page.locator('[data-store-category="dice"]').first().click();
   const tile=page.locator('[data-store-dice="'+slug+'"]').first();
   assert(await tile.count(),slug+': Store selection missing');
   const point=await clickExposed(tile,slug);
   console.log('TEST 164 pointer-click area',slug,JSON.stringify(point));
   assert.equal(await tile.getAttribute('aria-pressed'),'true',slug+': Store selection not active');
   await open();
   await page.locator('#nav button[data-tab="Dice"]').click();
   const applied=page.locator('.dice-applied-skin');
   await applied.waitFor({timeout:12000});
   assert.equal(await applied.getAttribute('data-applied-dice'),slug,slug+': selected Store skin not used in animated roller');
   const animate=page.locator('input[data-k="diceAnimation"]');
   if(!await animate.isChecked())await animate.check({force:true});
   // D20 is the existing renderer's detailed faceted master; do not change
   // its mesh, movement, materials, seed, random outcomes, or face ordering.
   await page.locator('[data-die="20"]').first().click();
   await page.locator('#diceForm button.dice-roll').click();
   const canvas=page.locator('#diceTabletop canvas');
   await canvas.waitFor({timeout:10000});
   await page.waitForTimeout(300);
   const pixels=await canvas.evaluate(el=>{
    const ctx=el.getContext('2d');
    if(!ctx||el.width<100||el.height<100)return 0;
    const data=ctx.getImageData(0,0,el.width,el.height).data;
    let count=0;for(let i=3;i<data.length;i+=4)if(data[i]>0)count++;
    return count;
   });
   assert(pixels>300,slug+': rendered dice animation frame is blank');
   const output='dist/art/test164-dice/'+slug+'.png';
   await canvas.screenshot({path:output,animations:'disabled'});
   const bytes=fs.statSync(output).size;
   assert(bytes>4000,slug+': captured image is suspiciously small');
   record.push({slug,source:'original 144 animated dice canvas',pixels,bytes,asset:'art/test164-dice/'+slug+'.png'});
   console.log('TEST 164: animation-derived Store preview',slug,bytes);
  }
  assert.deepEqual(problems,[],'Browser errors during reference generation');
  assert.equal(record.length,10,'Not all 10 animated dice references generated');
  fs.writeFileSync('preview-output/164-dice-capture-report.json',JSON.stringify(record,null,2));
 } finally {if(browser)await browser.close();server.kill();}
})().catch(err=>{console.error('164 DICE CAPTURE FAILED:',err.stack||err);process.exitCode=1});
