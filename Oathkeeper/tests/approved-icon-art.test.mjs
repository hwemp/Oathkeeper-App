import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

const read = path => readFile(new URL(path,import.meta.url));
const num = icon => String(icon.selection).padStart(2,'0');

test('Store icon masters are unchanged, unique, and map to correctly layered launcher XML',async()=>{
 const masters = new Set();
 assert.equal(SELECTED_APP_ICONS.length,10);
 for(const icon of SELECTED_APP_ICONS){
  const n=num(icon);
  assert.equal(icon.masterImagePath,'/art/store-icons/icon-'+n+'.webp');
  assert.equal(icon.imagePath,'/art/store-icons/preview-'+n+'.webp');
  assert.equal(icon.iosIconName,'AppIcon-'+n);
  const store=await read('../web/public'+icon.masterImagePath);
  const legacy=await read('../android/app/src/main/res/mipmap-nodpi/oathkeeper_icon_'+n+'.webp');
  const preview=await read('../web/public'+icon.imagePath);
  assert.equal(store.toString('ascii',0,4),'RIFF');
  assert.equal(preview.toString('ascii',8,12),'WEBP');
  assert.deepEqual(legacy,store,'Android legacy icon must copy original art byte-for-byte');
  assert(preview.length>20000,'Every Store icon must have a real device-style preview');
  masters.add(store.toString('base64'));
  const xml=await read('../android/app/src/main/res/mipmap-anydpi-v26/oathkeeper_icon_'+n+'.xml');
  const adaptive=xml.toString('utf8');
  assert(adaptive.includes('<background android:drawable="@drawable/oathkeeper_icon_bg_'+n+'" />'));
  assert(adaptive.includes('<foreground android:drawable="@drawable/oathkeeper_icon_fg_'+n+'" />'));
  assert(!adaptive.includes('@drawable/oathkeeper_icon_art_'+n),'Old full-size background must never reappear');
  const fg=await read('../android/app/src/main/res/drawable-nodpi/oathkeeper_icon_fg_'+n+'.png');
  assert.equal(fg.toString('hex',0,8),'89504e470d0a1a0a');
  const bg=(await read('../android/app/src/main/res/drawable/oathkeeper_icon_bg_'+n+'.xml')).toString('utf8');
  assert.match(bg,/<solid android:color="#[0-9a-f]{6}"\/>/);
 }
 assert.equal(masters.size,10);
});

test('One Store source feeds centered adaptive foreground, Android preview and iOS',async()=>{
 const script=(await read('../scripts/generate-free-icons.py')).toString('utf8');
 assert.match(script,/src = WEB \/ f"icon-\{number:02d\}\.webp"/);
 assert.match(script,/shutil\.copyfile\(src, native\)/);
 assert.match(script,/ART_RATIO = 0\.46/);
 assert.match(script,/foreground\.paste\(centered, position\)/);
 assert.match(script,/scene\.alpha_composite\(foreground\)/);
 assert.match(script,/preview_path = WEB \/ f"preview-\{number:02d\}\.webp"/);
 assert.match(script,/same_pixels\(ios_path, ios_art\)/);
 assert.doesNotMatch(script,/GaussianBlur|ImageOps\.fit|crop\(.*art|putalpha\(.*art/);
 const web=await readdir(new URL('../web/public/art/store-icons/',import.meta.url));
 const native=await readdir(new URL('../android/app/src/main/res/mipmap-nodpi/',import.meta.url));
 const drawable=await readdir(new URL('../android/app/src/main/res/drawable-nodpi/',import.meta.url));
 assert.equal(web.filter(n=>/^launcher-\d+\.webp$/.test(n)).length,0);
 assert.equal(web.filter(n=>/^preview-\d{2}\.webp$/.test(n)).length,10);
 assert.equal(native.filter(n=>/^oathkeeper_icon_\d{2}(_background|_foreground)?\.png$/.test(n)).length,0);
 assert.equal(drawable.filter(n=>/^oathkeeper_icon_art_\d{2}\.webp$/.test(n)).length,0);
});
