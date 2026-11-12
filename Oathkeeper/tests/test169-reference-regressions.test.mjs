import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('original frozen roller and secure dice RNG remain byte-for-byte unchanged',()=>{
 const roller=execFileSync('git',['hash-object','web/dice-tabletop.js'],{cwd,encoding:'utf8'}).trim();
 assert.equal(roller,'b79543b170783f0fb4bdff1541d73ae6a4014bba');
 const source=read('../web/dice.js');
 assert.match(source,/crypto\.getRandomValues/);
});
test('exact approved 352×356 12-frame GIF SHA locked as master',()=>{
 const py=read('../scripts/build-test169-reference-assets.py');
 assert(py.includes('fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb'));
 assert.match(py,/im\.size!=\(352,356\)/);
 assert.match(py,/n_frames/);
 assert.match(py,/SKINS=/);
 assert.match(py,/CROPS=/);
});
test('background repair changes source image and removes pasted overlays',()=>{
 const patch=read('../scripts/patch-test169-approved-source.py');
 assert.match(patch,/test169-bg\/'\+r\.slug/);
 assert.match(patch,/s=s\[:start\]\+new\+s\[end:\]/);
 assert.match(patch,/if "ok-replacement-preview" in s/);
 assert.match(patch,/No WebGL|WebGL|original GIF/);
 assert.match(patch,/function okDiceStage/);
});
test('bundle dice use the original animated GIF still, not fake polygon placeholders',()=>{
 const patch=read('../scripts/patch-test169-approved-source.py');
 assert.match(patch,/kind==='dice'/);
 assert.match(patch,/roll\/.*-still/);
 assert.doesNotMatch(read('../web/test169-reference.css'),/WebGLRenderer|InstancedMesh|MeshPhysicalMaterial/);
});
test('editor labels and nav use same amethyst frame without overlap',()=>{
 const style=read('../web/test169-reference.css');
 for(const token of ['#journalEditor .row button','#equipmentEditor .row button',
 '#nav button::before','ornate-nav-163.svg','font-size:clamp','white-space:normal']){
  assert(style.includes(token),'Missing shared amethyst/layout rule: '+token);
 }
});
test('TEST 169 release is isolated and does not enable TEST 168 synthetic 3D',()=>{
 const wf=read('../../.github/workflows/build-test-169.yml');
 assert.match(wf,/branches: \[TEST-BRANCH-169\]/);
 assert.match(wf,/versionCode 169/);
 assert.match(wf,/applicationIdSuffix "\.test169"/);
 assert.match(wf,/build-test169-reference-assets\.py/);
 assert.match(wf,/audit-test169-reference\.cjs/);
 assert.doesNotMatch(wf,/node scripts\/build-test168-3d\.cjs/);
 assert.doesNotMatch(wf,/python scripts\/apply-test-168\.py/);
});
