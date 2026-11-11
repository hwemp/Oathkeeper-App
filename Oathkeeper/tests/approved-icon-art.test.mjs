import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

test('ten different approved Store icon sources each have their own clean preview path', async () => {
 const hashes = new Set();
 assert.equal(SELECTED_APP_ICONS.length,10);
 for (const item of SELECTED_APP_ICONS) {
   const n=String(item.selection).padStart(2,'0');
   assert.equal(item.imagePath,'/art/store-icons/launcher-'+n+'.webp');
   const bytes=await readFile(new URL('../web/public/art/store-icons/icon-'+n+'.webp',import.meta.url));
   assert.equal(bytes.toString('ascii',0,4),'RIFF');
   assert.equal(bytes.toString('ascii',8,12),'WEBP');
   assert(bytes.byteLength>20000);
   hashes.add(bytes.toString('base64'));
 }
 assert.equal(hashes.size,10);
});

test('native adaptive/legacy and iOS icons are generated from each matching Store source', async () => {
 const script=await readFile(new URL('../scripts/generate-free-icons.py',import.meta.url),'utf8');
 assert.match(script,/source = WEB \/ f"icon-\{number:02d\}\.webp"/);
 assert.match(script,/normalized_art\(loaded, number\)/);
 assert.match(script,/SOURCE_CROPS = \{/);
 assert.match(script,/WEB \/ f"launcher-\{number:02d\}\.webp"/);
 assert.match(script,/SAFE_ART_RATIO = 0\.60/);
 assert.match(script,/centered_overlay\(art, ADAPTIVE_SIZE, SAFE_ART_RATIO\)/);
 assert.match(script,/ADAPTIVE \/ f"\{name\}\.xml"/);
 assert.doesNotMatch(script,/picture\.putalpha\(mask\)/);
 assert.doesNotMatch(script,/def emblem\(|d\.polygon/);
 assert.doesNotMatch(script,/ic_launcher\.png|AppIcon-512@2x\.png/);
});
