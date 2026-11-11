import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {d20FaceSvg,D20_THEME_SLUGS} from '../web/d20-face-textures.js';
import {diceMeshFaceCount} from '../web/dice-tabletop.js';

test('every approved D20 theme has its own independent twenty-face numbered UV image',()=>{
 assert.equal(D20_THEME_SLUGS.length,11);
 assert.equal(diceMeshFaceCount(20),20);
 const seen=new Set();
 for(const theme of D20_THEME_SLUGS){
   const svg=d20FaceSvg(theme);
   assert.match(svg,/width="2000" height="2000"/);
   assert.equal((svg.match(/<g transform="translate\(/g)||[]).length,20);
   const labels=Array.from(svg.matchAll(/<text[^>]*>(\d+)<\/text>/g),m=>Number(m[1]));
   assert.deepEqual(labels,Array.from({length:20},(_,i)=>i+1));
   seen.add(svg);
 }
 assert.equal(seen.size,11);
});

test('live D20 uses actual UV faces and lands on RNG-selected face; no video result hardcoding',async()=>{
 const source=await readFile(new URL('../web/dice-tabletop.js',import.meta.url),'utf8');
 assert.match(source,/d20AlignedVertices\(geom,die\.face\)/);
 assert.match(source,/uvTexture\?liveD20Texture|liveD20Texture\(\{slug:palette\.slug\}\)/);
 assert.match(source,/drawD20TexturedFace\(ctx,coords,uvTexture,f\.faceIndex/);
 assert.doesNotMatch(source,/\.mp4|fixedResult\s*=\s*16/);
});
