const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const fs=require('node:fs');
const assert=require('node:assert/strict');

(async()=>{
  const server=spawn('python3',['-m','http.server','5174','--directory','dist'],{stdio:'ignore'});
  let browser;
  try {
    for(let i=0;i<50;i++){
      try{if((await fetch('http://127.0.0.1:5174')).ok)break}catch{}
      await new Promise(resolve=>setTimeout(resolve,200));
    }
    browser=await chromium.launch({headless:true});
    fs.mkdirSync('preview-output',{recursive:true});
    for(const width of [320,393,430,768]){
      const page=await browser.newPage({viewport:{width,height:852},deviceScaleFactor:2});
      const exceptions=[];
      page.on('pageerror',error=>exceptions.push(error.message));
      await page.goto('http://127.0.0.1:5174');
      await page.evaluate(()=>document.fonts.ready);
      if(await page.locator('#termsGate').isVisible()){
        await page.locator('#termsAge').selectOption('teen');
        await page.locator('#termsAgree').check();
        await page.locator('#termsAccept').click();
      }
      await page.locator('#appMenu summary').click();
      await page.locator('#appMenu button[data-tab="Store"]').click();
      await page.locator('.store-page').waitFor();
      const noOverflow=async category=>{
        const hasOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
        assert(!hasOverflow,`Store ${category} page overflows ${width}px phone`);
      };
      const visual=async(category,selector)=>{
        await noOverflow(category);
        const tiles=page.locator(selector);
        assert.equal(await tiles.count(),10,`Store ${category} must have ten distinct tiles`);
        const bounds=await tiles.evaluateAll(nodes=>nodes.map(node=>{
          const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,height:r.height};
        }));
        assert(bounds.every(r=>r.width>0&&r.height>0&&r.left>=-1&&r.right<=width+1),`${category} tile boundaries`);
        const minimum=width<=360?120:width<=430?100:width<=800?180:50;
        assert(bounds.every(r=>r.width>=minimum),`${category} art is tiny at ${width}px: ${JSON.stringify(bounds)}`);
        const images=page.locator('.store-dice-tile-art,.store-background-tile-art,.store-icon-tile-art');
        if(await images.count()){
          const tested=await images.evaluateAll(async nodes=>Promise.all(nodes.map(async img=>{
            const probe=new Image();probe.src=img.currentSrc||img.src;
            try{await probe.decode();return {ok:probe.naturalWidth>0,src:probe.src}}
            catch{return {ok:false,src:probe.src}}
          })));
          assert(tested.every(x=>x.ok),`${category} has broken art links: ${JSON.stringify(tested.filter(x=>!x.ok))}`);
          assert(await images.evaluateAll(nodes=>nodes.every(img=>getComputedStyle(img).transform==='none')),`${category} thumbnails are transformed/cropped`);
        }
        await page.screenshot({path:`preview-output/store-${category}-${width}.png`,fullPage:true});
      };
      await visual('dice','.store-dice-tile');
      assert.equal(await page.locator('.store-dice-tile-art').first().getAttribute('src'),'/art/store-dice/dragonfire.svg','Dice tile must use independent approved artwork');
      await page.locator('[data-store-dice="frostborne"]').click();
      assert.match(await page.locator('.store-preview-image').getAttribute('aria-label'),/Frostborne/);
      assert(await page.locator('#storeDiceTabletop').isVisible(),'Tapping dice should play the themed D20 preview');
      assert.equal(await page.locator('#storeDiceTabletop').getAttribute('data-store-dice-demo'),'frostborne');
      assert.equal(await page.locator('.store-dice-tile-art').first().evaluate(el=>getComputedStyle(el).objectFit),'contain','Dice image must fit without cropping');
      await page.locator('[data-store-category="icons"]').click();
      assert.equal(await page.locator('.store-icon-tile-art').first().evaluate(el=>getComputedStyle(el).objectFit),'contain','Icon must fit without cropping');
      await page.locator('[data-store-category="dice"]').click();
      await page.locator('[data-store-category="backgrounds"]').click();
      await visual('backgrounds','.store-background-tile');
      const first=await page.locator('.store-background-preview-image').getAttribute('src');
      await page.locator('[data-store-background="elder-grove"]').click();
      const second=await page.locator('.store-background-preview-image').getAttribute('src');
      assert.notEqual(first,second,'Background preview must update to unique artwork');
      await page.waitForFunction(()=>{const img=document.querySelector('.store-background-preview-image');return img&&img.complete&&img.naturalWidth>0});
      await page.locator('[data-store-category="icons"]').click();
      await visual('icons','.store-icon-tile');
      const iconFirst=await page.locator('.store-icon-preview-image').getAttribute('src');
      await page.locator('[data-store-icon="icon-06"]').click();
      const iconSecond=await page.locator('.store-icon-preview-image').getAttribute('src');
      assert.notEqual(iconFirst,iconSecond,'Icon selection must change enlarged artwork');
      await page.waitForFunction(()=>{const img=document.querySelector('.store-icon-preview-image');return img&&img.complete&&img.naturalWidth>0});
      await page.locator('[data-store-category="bundles"]').click();
      await noOverflow('bundles');
      assert.equal(await page.locator('.bundle-reference-offer').count(),2,'Original offers receive accurate invisible selection hotspots');
      assert.equal(await page.locator('.bundle-reference-pick').count(),10,'Five pictured dice and five backgrounds remain selectable');
      const reference=page.locator('.bundle-reference-art');
      // After switching categories the new img element may not have finished
      // its network load/decode. Verify the actual rendered pixels, not a race.
      await reference.evaluate(img=>img.decode());
      const referenceData=await reference.evaluate(img=>({loaded:img.complete&&img.naturalWidth>0,w:img.naturalWidth,h:img.naturalHeight,fit:getComputedStyle(img).objectFit}));
      assert.deepEqual(referenceData,{loaded:true,w:1024,h:1536,fit:'contain'},'Exact approved image was not loaded as a whole, un-cropped reference');
      assert.equal(await page.locator('.store-bundle-purchase-actions button').count(),2);
      assert.equal(await page.locator('.store-bundle-purchase-actions button').first().innerText(),'Purchase');
      assert.equal(await page.locator('.store-bundle-purchase-actions button').last().innerText(),'Restore Purchases');
      assert(await page.locator('.store-bundle-purchase-actions button').first().isDisabled(),'Unconfigured billing must not accept purchases');
      await page.locator('[data-store-bundle-open="dice"]').click();
      assert.equal(await page.locator('.bundle-reference-picker-option').count(),10,'All ten choices must remain accessible without modifying the screenshot');
      await page.locator('[data-store-bundle-close]').click();
      await page.screenshot({path:`preview-output/store-bundles-${width}.png`,fullPage:true});
      // The footer must be after, never on top of, the largest artwork.
      await page.locator('[data-store-category="backgrounds"]').click();
      const layout=await page.evaluate(()=>{
        const top=document.querySelector('.store-page').getBoundingClientRect();
        const hero=document.querySelector('.store-hero').getBoundingClientRect();
        const footer=document.querySelector('.store-themed-footer').getBoundingClientRect();
        const preview=document.querySelector('.store-background-preview-media').getBoundingClientRect();
        const appHeader=document.querySelector('body>header');
        const appNav=document.querySelector('main>#nav');
        return {top:top.top,heroTop:hero.top,footerTop:footer.top,previewBottom:preview.bottom,
          headerVisible:!!appHeader&&getComputedStyle(appHeader).display!=='none',
          navVisible:!!appNav&&getComputedStyle(appNav).display!=='none'};
      });
      assert(!layout.headerVisible&&!layout.navVisible,`Store still showing duplicate character chrome at ${width}px`);
      assert(layout.footerTop>=layout.previewBottom-1,`Store footer covers background preview at ${width}px`);
      await page.locator('[data-store-category="dice"]').click();
      const diceClear=await page.evaluate(()=>document.querySelector('.store-themed-footer').getBoundingClientRect().top>=document.querySelector('.store-preview-image').getBoundingClientRect().bottom-1);
      assert(diceClear,`Store footer covers dice preview at ${width}px`);

      assert.deepEqual(exceptions,[],`No browser exceptions at ${width}px`);
      await page.close();
    }
    console.log('PASS: real store pages rendered on four viewport sizes, no clipping or missing image links');
  } finally {
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
