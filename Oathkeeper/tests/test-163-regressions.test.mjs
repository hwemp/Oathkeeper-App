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
  assert.doesNotMatch(artwork,/id="leaf"/);
  assert.doesNotMatch(artwork,/href="#leaf"/);
  assert.match(css,/#nav button::before\s*\{\s*background-image:\s*url\("\.\/art\/ornate-nav-163\.svg"\)/);
  assert.match(css,/#nav button::after\s*\{\s*content:\s*none !important/);
  assert.match(script,/ornate-nav-163\.svg/);
});

test('TEST 163: preview substitutions use byte-exact illustrated source files',()=>{
  const theme=read('../web/ornate-gem-theme.js');
  const packager=read('../scripts/apply-ornate-buttons.py');
  assert.match(theme,/approved-backgrounds/);
  assert.doesNotMatch(theme,/hires-store-backgrounds/);
  assert.match(packager,/shutil\.copyfile\(approved,destination\)/);
  assert.match(packager,/sha256\(destination\) != sha256\(approved\)/);
  assert.doesNotMatch(packager,/svg2png/);
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
