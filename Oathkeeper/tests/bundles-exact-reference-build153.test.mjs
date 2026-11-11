import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {storePage} from '../web/store-ui.js';
test('The original screenshot is preserved byte-for-byte and never replaced by generated thumbnails',async()=>{
 const art=await readFile(new URL('../web/public/art/bundles/approved-bundles-reference.jpg',import.meta.url));
 assert.equal(art.length,651579);
 assert.equal(createHash('sha256').update(art).digest('hex'),'333cb3611880571aa88ffe1098825053cb1e2bb9e50cedfa42a5d07321e01856');
 const html=storePage('elvenleaf',{category:'bundles'});
 assert.match(html,/approved-bundles-reference\.jpg/);
 assert.doesNotMatch(html,/bundle-offer-gem|bundle-background-pick|bundle-dice-art/);
});
test('No other store category is rendered with the screenshot',()=>{
 for(const category of ['dice','backgrounds','icons']){
  const html=storePage('dragonfire',{category});
  assert.doesNotMatch(html,/approved-bundles-reference\.jpg/);
 }
});
