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
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:4});
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
  const sidesList=[3,4,6,8,10,12,20,50,100];
  for(const slug of ['default',...skins]){
   // Only store selections are changed here. The authoritative 3D roller and
   // its random results, geometry, face textures, and motion remain untouched.
   if(slug!=='default'){
    await open();
    await page.locator('#appMenu summary').click();
    await page.locator('#appMenu button[data-tab="Store"]').click();
    await page.locator('[data-store-category="dice"]').first().click();
    const tile=page.locator('[data-store-dice="'+slug+'"]').last();
    assert(await tile.count(),slug+': Store selection missing');
    await clickExposed(tile,slug);
    assert.equal(await tile.getAttribute('aria-pressed'),'true',slug+': Store selection not active');
   }
   await open();
   await page.locator('#nav button[data-tab="Dice"]').click();
   const applied=page.locator('.dice-applied-skin');
   if(slug!=='default'){
    await applied.waitFor({timeout:12000});
    assert.equal(await applied.getAttribute('data-applied-dice'),slug,slug+': selected Store theme absent from roller');
   }
   const animate=page.locator('input[data-k="diceAnimation"]');
   if(!await animate.isChecked())await animate.check({force:true});
   for(const sides of sidesList){
    const mode=sides===50?'unofficial':'official';
    const selectedMode=page.locator('[data-dice-mode="'+mode+'"]');
    if(await selectedMode.getAttribute('aria-pressed')!=='true')await selectedMode.click();
    const tile=page.locator('[data-die="'+sides+'"]').first();
    await tile.click();
    const form=page.locator('#diceForm');
    await form.locator('#diceQuantity').fill('1');
    await form.locator('button.dice-roll').click();
    const canvas=page.locator('#diceTabletop canvas');
    await canvas.waitFor({state:'visible',timeout:10000});
    // Wait for real animated facets and asynchronously prepared D20 textures;
    // a full canvas screenshot shrinks the die, so crop its native pixels.
    await page.waitForTimeout(1170);
    const capture=await canvas.evaluate(el=>{
     const rect=el.getBoundingClientRect();
     const ratio=el.width/Math.max(1,rect.width);
     const cropWidth=Math.min(el.width,Math.round(164*ratio));
     const cropHeight=Math.min(el.height,Math.round(cropWidth*175/248));
     const x=Math.max(0,Math.min(el.width-cropWidth,Math.round(el.width*.5-cropWidth/2)));
     const y=Math.max(0,Math.min(el.height-cropHeight,Math.round(el.height*.55-cropHeight/2)));
     const frame=document.createElement('canvas');
     frame.width=cropWidth;frame.height=cropHeight;
     const ctx=frame.getContext('2d');
     ctx.imageSmoothingEnabled=true;
     ctx.imageSmoothingQuality='high';
     ctx.drawImage(el,x,y,cropWidth,cropHeight,0,0,cropWidth,cropHeight);
     return {width:frame.width,height:frame.height,data:frame.toDataURL('image/png').split(',')[1]};
    });
    assert(capture.width>=600&&capture.height>=400,
     slug+' D'+sides+': native-resolution animated preview below 600×400');
    const path='dist/art/test166-dice/'+slug+'/d'+sides+'.png';
    fs.mkdirSync(require('node:path').dirname(path),{recursive:true});
    fs.writeFileSync(path,Buffer.from(capture.data,'base64'));
    const bytes=fs.statSync(path).size;
    assert(bytes>4000,slug+' D'+sides+': suspiciously small animation capture');
    // Existing Store and legacy build-audit path points to animated D20 masters.
    if(slug!=='default'&&sides===20){
     const original='dist/art/test164-dice/'+slug+'.png';
     fs.copyFileSync(path,original);
    }
    record.push({slug,sides,source:'unchanged live 3D animation',width:capture.width,height:capture.height,bytes,asset:path.slice(5)});
    console.log('TEST 166 animation parity',slug,'D'+sides,capture.width+'×'+capture.height,bytes);
   }
  }
  assert.deepEqual(problems,[],'Browser errors during reference generation');
  assert.equal(record.length,99,'Not all 11 themes × 9 geometry captures generated');
  fs.writeFileSync('preview-output/166-dice-parity-report.json',JSON.stringify(record,null,2));
 } finally {if(browser)await browser.close();server.kill();}
})().catch(err=>{console.error('166 DICE PARITY CAPTURE FAILED:',err.stack||err);process.exitCode=1});
