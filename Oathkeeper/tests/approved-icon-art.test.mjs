import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

test('ten different approved Store icon sources each have their own clean preview path', async () => {
 const hashes = new Set();
 assert.equal(SELECTED_APP_ICONS.length,10);
 for (const item of SELECTED_APP_ICONS) {
   const n=String(item.selection).padStart(2,'0');
   assert.equal(item.imagePath,'/art/store-icons/icon-'+n+'.webp');
   const bytes=await readFile(new URL('../web/public/art/store-icons/icon-'+n+'.webp',import.meta.url));
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert(bytes.byteLength>20000);
   hashes.add(bytes.toString('base64'));
 }
 assert.equal(hashes.size,10);
});

test('Store and native icons must use identical uncropped masters without blur or inset', async () => {
 const script=await readFile(new URL('../scripts/generate-free-icons.py',import.meta.url),'utf8');
 assert.match(script,/src = WEB \/ f"icon-\{number:02d\}\.webp"/);
 assert.match(script,/scaled\(art, ADAPTIVE_SIZE\)/);
 assert.match(script,/same_pixels\(background_path, background\)/);
 assert.match(script,/same_pixels\(legacy_path, scaled\(art, 256\)\)/);
 assert.match(script,/same_pixels\(ios_path, scaled\(art, 1024\)\)/);
 assert.match(script,/Image\.new\("RGBA", \(ADAPTIVE_SIZE, ADAPTIVE_SIZE\), \(0, 0, 0, 0\)\)/);
 assert.doesNotMatch(script,/CLEAN_CROP_RATIO|SAFE_ART_RATIO|remove_baked_frame|GaussianBlur|putalpha/);
 assert.doesNotMatch(script,/ic_launcher\.png|AppIcon-512@2x\.png/);
});
