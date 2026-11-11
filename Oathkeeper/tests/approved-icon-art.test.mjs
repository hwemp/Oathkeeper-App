import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

test('each native Android launcher is the exact corresponding Store image', async () => {
 const images=new Set();
 assert.equal(SELECTED_APP_ICONS.length,10);
 for (const icon of SELECTED_APP_ICONS) {
  const n=String(icon.selection).padStart(2,'0');
  assert.equal(icon.imagePath,'/art/store-icons/store-'+n+'.svg');
  assert.equal(icon.iosIconName,'AppIcon-'+n);
  const store=await readFile(new URL('../web/public/art/store-icons/icon-'+n+'.webp',import.meta.url));
  const native=await readFile(new URL('../android/app/src/main/res/mipmap-nodpi/oathkeeper_icon_'+n+'.webp',import.meta.url));
  const adaptive=await readFile(new URL('../android/app/src/main/res/drawable-nodpi/oathkeeper_icon_art_'+n+'.webp',import.meta.url));
  assert.equal(store.toString('ascii',0,4),'RIFF');
  assert.equal(store.toString('ascii',8,12),'WEBP');
  assert(store.length>20000);
  assert.deepEqual(native,store,'Native Android WebP must be identical to its Store source');
  assert.deepEqual(adaptive,store,'Adaptive icon background must be identical to Store source');
  images.add(store.toString('base64'));
  const xml=await readFile(new URL('../android/app/src/main/res/mipmap-anydpi-v26/oathkeeper_icon_'+n+'.xml',import.meta.url),'utf8');
  assert(xml.includes('<background android:drawable="@drawable/oathkeeper_icon_art_'+n+'" />'));
  assert(!xml.includes('<background android:drawable="@mipmap/oathkeeper_icon_'+n+'" />'),'XML must not self-reference its adaptive icon');
  assert(xml.includes('<foreground android:drawable="@android:color/transparent" />'));
 }
 assert.equal(images.size,10);
});

test('old alternate-image reservoir is removed; generator preserves primary launcher',async()=>{
 const web=await readdir(new URL('../web/public/art/store-icons/',import.meta.url));
 const native=await readdir(new URL('../android/app/src/main/res/mipmap-nodpi/',import.meta.url));
 assert.equal(web.filter(name=>/^launcher-\d+\.webp$/.test(name)).length,0);
 assert.equal(native.filter(name=>/^oathkeeper_icon_\d{2}(_background|_foreground)?\.png$/.test(name)).length,0);
 const script=await readFile(new URL('../scripts/generate-free-icons.py',import.meta.url),'utf8');
 assert.match(script,/src = WEB \/ f"icon-\{number:02d\}\.webp"/);
 assert.match(script,/shutil\.copyfile\(src, native_path\)/);
 assert.match(script,/shutil\.copyfile\(src, adaptive_path\)/);
 assert.match(script,/native_path\.read_bytes\(\) != src\.read_bytes\(\)/);
 assert.match(script,/same_pixels\(ios_path, scaled\(art, 1024\)\)/);
 assert.doesNotMatch(script,/SAFE_ART_RATIO|CLEAN_CROP_RATIO|GaussianBlur|putalpha/);
 assert.doesNotMatch(script,/ic_launcher\.png|AppIcon-512@2x\.png/);
});
