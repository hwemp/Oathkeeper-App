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
        const images=page.locator('.store-background-tile-art,.store-icon-tile-art');
        if(await images.count()){
          assert(await images.evaluateAll(nodes=>nodes.every(img=>img.complete&&img.naturalWidth>0)),`${category} has broken art links`);
          assert(await images.evaluateAll(nodes=>nodes.every(img=>getComputedStyle(img).transform==='none')),`${category} thumbnails are transformed/cropped`);
        }
        await page.screenshot({path:`preview-output/store-${category}-${width}.png`,fullPage:true});
      };
      await visual('dice','.store-dice-tile');
      assert.equal(await page.locator('.store-dice-tile-art').first().evaluate(node=>getComputedStyle(node).backgroundSize),'500% 200%','Dice atlas must retain native cell alignment');
      await page.locator('[data-store-dice="frostborne"]').click();
      assert.match(await page.locator('.store-preview-image').getAttribute('aria-label'),/Frostborne/);
      await page.locator('[data-store-category="backgrounds"]').click();
      await visual('backgrounds','.store-background-tile');
      const first=await page.locator('.store-background-preview-image').getAttribute('src');
      await page.locator('[data-store-background="elder-grove"]').click();
      const second=await page.locator('.store-background-preview-image').getAttribute('src');
      assert.notEqual(first,second,'Background preview must update to unique artwork');
      assert(await page.locator('.store-background-preview-image').evaluate(img=>img.complete&&img.naturalWidth>0),'Large background art must load');
      await page.locator('[data-store-category="icons"]').click();
      await visual('icons','.store-icon-tile');
      const iconFirst=await page.locator('.store-icon-preview-image').getAttribute('src');
      await page.locator('[data-store-icon="icon-06"]').click();
      const iconSecond=await page.locator('.store-icon-preview-image').getAttribute('src');
      assert.notEqual(iconFirst,iconSecond,'Icon selection must change enlarged artwork');
      assert(await page.locator('.store-icon-preview-image').evaluate(img=>img.complete&&img.naturalWidth>0),'Large icon art must load');
      await page.locator('[data-store-category="bundles"]').click();
      await noOverflow('bundles');
      assert.equal(await page.locator('.bundle-offer').count(),2,'Both approved bundle offers visible');
      assert.equal(await page.locator('.bundle-dice-pick').count(),10);
      assert.equal(await page.locator('.bundle-background-pick').count(),10);
      await page.screenshot({path:`preview-output/store-bundles-${width}.png`,fullPage:true});
      assert.deepEqual(exceptions,[],`No browser exceptions at ${width}px`);
      await page.close();
    }
    console.log('PASS: real store pages rendered on four viewport sizes, no clipping or missing image links');
  } finally {
    if(browser)await browser.close();
    server.kill();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
