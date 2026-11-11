import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

test('every free icon has its own approved source artwork and dedicated clean preview path',async()=>{
 const digests=new Set();
 for(const item of SELECTED_APP_ICONS){
  const sourcePath='../web/public/art/store-icons/icon-'+String(item.selection).padStart(2,'0')+'.webp';\n  assert.equal(item.imagePath,'/art/store-icons/launcher-'+String(item.selection).padStart(2,'0')+'.webp');\n  const bytes=await readFile(new URL(sourcePath,import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'RIFF');
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert(bytes.byteLength>20000);
  digests.add(Buffer.from(bytes).toString('base64'));
 }
 assert.equal(digests.size,10);
});

test('native icons are derived from the exact store art without emblem overlays',async()=>{
 const script=await readFile(new URL('../scripts/generate-free-icons.py',import.meta.url),'utf8');
 assert.match(script,/source = WEB \/ f"icon-\{number:02d\}\.webp"/);
 assert.match(script,/normalized_art\(loaded\)/);
 assert.match(script,/SAFE_ART_RATIO = 0\.60/);
 assert.match(script,/centered_overlay\(art, ADAPTIVE_SIZE, SAFE_ART_RATIO\)/);
 assert.match(script,/ADAPTIVE \/ f"\{name\}\.xml"/);
 assert.match(script,/ImageDraw\.Draw\(mask\)\.rounded_rectangle/);
 assert.doesNotMatch(script,/def emblem\(|d\.polygon/);
 assert.doesNotMatch(script,/ic_launcher\.png|AppIcon-512@2x\.png/);
});
