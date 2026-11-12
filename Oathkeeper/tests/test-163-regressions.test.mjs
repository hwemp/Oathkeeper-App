import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');

test('TEST 163: native launcher aliases use compiled namespace, not test application ID',()=>{
  const java=read('../android/app/src/main/java/com/harrisonwaters/oathkeeper/OathkeeperIconPlugin.java');
  const gradle=read('../android/app/build.gradle');
  const manifest=read('../android/app/src/main/AndroidManifest.xml');
  assert.match(gradle,/namespace\s*=\s*"com\.harrisonwaters\.oathkeeper"/);
  assert.match(java,/OathkeeperIconPlugin\.class\.getPackage\(\)\.getName\(\)/);
  assert.match(java,/new ComponentName\(getContext\(\)\.getPackageName\(\),\s*nativeNamespace \+ "\." \+ alias\)/);
  assert.doesNotMatch(java,/getContext\(\)\.getPackageName\(\) \+ "\." \+ alias/);
  for(const id of ['01','02','04','05','06','07','08','11','12','14'])
    assert.match(manifest,new RegExp('android:name="\\.LauncherIcon'+id+'"'));
});

test('TEST 163: premium navigation uses one complete, independent vector border',()=>{
  const css=read('../web/ornate-buttons.css');
  const artwork=read('../web/public/art/ornate-nav-163.svg');
  const script=read('../scripts/apply-ornate-buttons.py');
  assert.match(artwork,/<svg\b/);
  assert.match(artwork,/<\/svg>/);
  assert.match(artwork,/id="stone"/);
  assert.match(artwork,/id="leaf"/);
  assert.match(css,/#nav button::before\s*\{\s*background-image:\s*url\("\.\/art\/ornate-nav-163\.svg"\)/);
  assert.match(css,/#nav button::after\s*\{\s*content:\s*none !important/);
  assert.match(script,/ornate-nav-163\.svg/);
});

test('TEST 163: original detailed previews must not be swapped for simplified enlarged images',()=>{
  const js=read('../web/ornate-gem-theme.js');
  const begin=js.indexOf('export function repairMissingBackgroundPreviews');
  const end=js.indexOf('export function updateGemTheme',begin);
  assert(begin>=0 && end>begin);
  const repair=js.slice(begin,end);
  assert.doesNotMatch(repair, /\.setAttribute\(\s*["']src["']/);
  assert.doesNotMatch(repair, /hires-store-backgrounds|\.svg2png|\.src\s*=/);
  assert.match(repair,/return 0;/);
});

test('TEST 163: dice RNG and rolling geometry remain unmodified from the protected branch',()=>{
  const js=read('../web/dice-tabletop.js');
  const app=read('../web/app.js');
  assert.match(js,/export function playTabletopRoll\(/);
  assert.match(js,/export function diceSkinPalette\(/);
  assert.match(js,/if\(sides===100\)return hundred\(\)/);
  assert.match(app,/playTabletopRoll\(stage,result,/);
  assert.match(app,/cosmetics\(\)\.dice/);
});
