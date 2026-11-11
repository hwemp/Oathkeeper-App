const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 const server=spawn('python3',['-m','http.server','5173','--directory','dist'],{stdio:'ignore'});
 let browser;
 const acceptTerms=async p=>{
  if(await p.locator('#termsGate').isVisible()){
   await p.locator('#termsAge').selectOption('teen');
   await p.locator('#termsAgree').check();
   await p.locator('#termsAccept').click();
  }
 };
 try{
  for(let i=0;i<40;i++){try{if((await fetch('http://127.0.0.1:5173')).ok)break}catch{}await new Promise(r=>setTimeout(r,250))}
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const page=await browser.newPage({viewport:{width:393,height:852},deviceScaleFactor:2});
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{document.documentElement.style.setProperty('--safe-area-inset-top','24px');document.documentElement.style.setProperty('--safe-area-inset-bottom','24px')}));
  await page.goto('http://127.0.0.1:5173');await acceptTerms(page);
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
  await page.getByRole('button',{name:'Dice',exact:true}).click();
  await page.getByRole('heading',{name:'Dice',exact:true}).waitFor({state:'attached'});
  await page.waitForFunction(()=>{const nav=document.querySelector('#nav').getBoundingClientRect(),dice=document.querySelector('#nav [data-tab=Dice]').getBoundingClientRect();return dice.right<=nav.right+1});
  assert(await page.getByRole('button',{name:'D3 simulated with D6',exact:true}).isVisible());
  assert.equal(await page.getByRole('button',{name:'D50',exact:true}).count(),0);
  const backgrounds=await page.locator('.die-art').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).backgroundImage));
  assert(backgrounds.every(x=>x.includes('dice-reference')),'Dice artwork is referenced');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'preview-output/official-dice.png'});
  await page.getByRole('button',{name:'D3 simulated with D6',exact:true}).click();
  await page.getByRole('button',{name:'Roll dice',exact:true}).click();
  assert.match(await page.locator('.dice-result strong').innerText(),/^[123]$/);
  assert.match(await page.locator('.dice-note').allTextContents().then(x=>x.join(' ')),/D6 rolls:/);
  await page.getByLabel('Quantity',{exact:true}).fill('3');
  await page.getByLabel('Modifier',{exact:true}).fill('-2');
  await page.getByRole('button',{name:'Roll dice',exact:true}).click();
  const total=Number(await page.locator('.dice-result strong').innerText());
  assert(total>=1&&total<=7,'Three D3 rolls minus two');
  await page.getByRole('button',{name:'D100 percentile',exact:true}).click();
  await page.getByRole('button',{name:'Roll dice',exact:true}).click();
  assert.match(await page.locator('.dice-note').allTextContents().then(x=>x.join(' ')),/Percentile rolls:/);
  await page.getByRole('button',{name:'Unofficial dice',exact:true}).click();
  assert.equal(await page.locator('[data-die]').count(),9);
  await page.getByRole('button',{name:'D50',exact:true}).click();
  await page.getByLabel('Quantity',{exact:true}).fill('1');
  await page.getByLabel('Modifier',{exact:true}).fill('0');
  await page.getByRole('button',{name:'Roll dice',exact:true}).click();
  const fifty=Number(await page.locator('.dice-result strong').innerText());
  assert(fifty>=1&&fifty<=50,'D50 output range');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:'preview-output/unofficial-dice.png'});
  await page.getByRole('button',{name:'Official dice',exact:true}).click();
  assert(await page.getByRole('button',{name:'D20',exact:true}).getAttribute('aria-pressed')==='true','Unsupported D50 resets when changing to official');
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),'Dice screen no page overflow');
  await page.locator('header > .notification-bell').click();
  await page.getByRole('heading',{name:'Notifications',exact:true}).waitFor();
  // Test Dice as the very first destination, including narrow Android screens.
  for(const width of [320,360,393,430,852]){
   const mobile=await browser.newPage({viewport:{width,height:852},deviceScaleFactor:1});
   await mobile.goto('http://127.0.0.1:5173');await acceptTerms(mobile);
   await mobile.evaluate(()=>document.fonts.ready);
   await mobile.getByRole('button',{name:'Dice',exact:true}).click();
   await mobile.waitForFunction(()=>{const nav=document.querySelector('#nav').getBoundingClientRect(),dice=document.querySelector('#nav [data-tab=Dice]').getBoundingClientRect();return dice.left>=nav.left-1&&dice.right<=nav.right+1});
   for(const mode of ['Official dice','Unofficial dice']){
    await mobile.getByRole('button',{name:mode,exact:true}).click();
    assert(!(await mobile.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`${mode} overflow at ${width}px`);
    const clipped=await mobile.locator('.die-label').evaluateAll(nodes=>nodes.some(n=>n.scrollWidth>n.clientWidth+1));
    assert(!clipped,`${mode} labels clipped at ${width}px`);
    await mobile.getByRole('button',{name:'Roll dice',exact:true}).click();
    await mobile.waitForFunction(()=>{const nav=document.querySelector('#nav').getBoundingClientRect(),dice=document.querySelector('#nav [data-tab=Dice]').getBoundingClientRect();return dice.right<=nav.right+1});
    if(width===320||width===430){
     await mobile.evaluate(()=>window.scrollTo(0,0));
     await mobile.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     await mobile.screenshot({path:`preview-output/${mode.startsWith('Official')?'official':'unofficial'}-dice-${width}.png`});
     const inBounds=await mobile.locator('#nav').evaluate(nav=>{const box=nav.getBoundingClientRect(),die=nav.querySelector('[data-tab=Dice]').getBoundingClientRect();return die.left>=box.left-1&&die.right<=box.right+1});
     assert(inBounds,`Screenshot must preserve Dice navigation at ${width}px`);
     await mobile.locator('.dice-result').scrollIntoViewIfNeeded();
     await mobile.screenshot({path:`preview-output/${mode.startsWith('Official')?'official':'unofficial'}-result-${width}.png`});
    }
   }
   await mobile.getByRole('button',{name:'Overview',exact:true}).click();
   await mobile.getByRole('heading',{name:'Ready for the next encounter'}).waitFor();
   await mobile.close();
  }
  // Render and exercise the combined workspaces at narrow and wide phone sizes.
  for(const width of [320,393,430]){
   const workspace=await browser.newPage({viewport:{width,height:852},deviceScaleFactor:1});
   const errors=[];workspace.on('pageerror',e=>errors.push(e.message));
   await workspace.goto('http://127.0.0.1:5173');await acceptTerms(workspace);
   await workspace.evaluate(()=>document.fonts.ready);
   const open=async name=>{await workspace.locator('#appMenu summary').click();await workspace.locator('#appMenu [data-tab="'+name+'"]').click()};
   await workspace.locator('#nav [data-tab="Dice"]').click();await workspace.getByRole('button',{name:'Roll dice',exact:true}).click();
   await workspace.locator('.dice-statistics-drawer > summary').click();await workspace.locator('.roll-statistics').scrollIntoViewIfNeeded();
   await workspace.screenshot({path:`preview-output/statistics-${width}.png`});
   await open('Support');await workspace.getByRole('heading',{name:'Contact support',exact:true}).waitFor();
   assert(await workspace.getByRole('link',{name:'ecclesyus@gmail.com',exact:true}).isVisible());
   assert(!await workspace.locator('#supportAuto').isChecked());
   assert(!(await workspace.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`Support overflow at ${width}`);
   await workspace.evaluate(()=>window.scrollTo(0,0));await workspace.screenshot({path:`preview-output/support-${width}.png`});
   await open('DM');await workspace.getByRole('heading',{name:'Session ledger',exact:true}).waitFor();
   assert(!(await workspace.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`DM Session overflow at ${width}`);
   await workspace.evaluate(()=>window.scrollTo(0,0));await workspace.screenshot({path:`preview-output/dm-session-${width}.png`});
   await workspace.locator('[data-dm="placement"]').selectOption('tab');
   await workspace.locator('#nav [data-tab="DM"]').waitFor({state:'visible'});
   for(const section of ['Encounter','Campaign','Rules & Books']){
    await workspace.getByRole('button',{name:section,exact:true}).click();
    assert(!(await workspace.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`DM ${section} overflow at ${width}`);
    await workspace.evaluate(()=>window.scrollTo(0,0));
    await workspace.screenshot({path:`preview-output/dm-${section.split(' ')[0].toLowerCase()}-${width}.png`});
   }
   assert.deepEqual(errors,[],`Workspace page errors at ${width}`);await workspace.close();
  }
  console.log('PASS: font, safe areas, no overflow, dice, stats, Support, DM sections and placement; phone screenshots saved');
 }finally{if(browser)await browser.close();server.kill()}
})().catch(e=>{console.error(e);process.exitCode=1});
