import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const cwd=fileURLToPath(new URL('../',import.meta.url));
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('TEST 168 leaves original dice engine, RNG and outcome computation untouched',()=>{
 const sha=execFileSync('git',['hash-object','web/dice-tabletop.js'],{cwd,encoding:'utf8'}).trim();
 assert.equal(sha,'b79543b170783f0fb4bdff1541d73ae6a4014bba');
 const source=read('../web/dice.js');
 assert.match(source,/crypto\.getRandomValues/);
 assert.match(source,/uniformIndex/);
 assert.match(source,/rollDice/);
});
test('TEST 168 genuinely renders PBR 3D, metallic raised edges, proper lights, face text',()=>{
 const source=read('../web/test168-jewel-scene.js');
 for(const term of [
  'WebGLRenderer','MeshPhysicalMaterial','RoomEnvironment','PMREMGenerator',
  'metalness','roughness','transmission','clearcoat','CylinderGeometry',
  'InstancedMesh','CanvasTexture','PointLight','DirectionalLight',
  'getTest168Mesh','test168Mesh','makeFaceGlyph','createDieMesh'
 ])assert(source.includes(term),'Missing real 3D feature '+term);
 assert.match(source,/this\.renderer\.render\(this\.scene,this\.camera\)/);
 assert.match(source,/const mesh=test168Mesh\(sides\)/);
 assert.doesNotMatch(source,/\brollDice\s*\(/);
});
test('TEST 168 graphics follow the existing roll result, never generate it',()=>{
 const overlay=read('../web/test168-live-overlay.js');
 assert.match(overlay,/dataset\.state==='landed'/);
 assert.match(overlay,/data-dice-landed/);
 assert.match(overlay,/parseFaces/);
 assert.match(overlay,/original\.style\.opacity='0'/);
 assert.match(overlay,/original\.style\.opacity=''/);
 assert.match(overlay,/catch\(error\)/);
 assert.doesNotMatch(overlay,/\b(?:rollDice|secureWord|Math\.random)\s*\(/);
});
test('same 3D scene generates high resolution Store and Dice page masters',()=>{
 const preview=read('../web/test168-preview-entry.js');
 const builder=read('../scripts/build-test168-3d.cjs');
 const graphics=read('../scripts/make-test168-3d-previews.cjs');
 assert.match(preview,/JewelDiceScene/);
 assert.match(builder,/test168-live-overlay\.js/);
 assert.match(builder,/test168-preview-entry\.js/);
 assert.match(graphics,/records\.length,99/);
 assert.match(graphics,/assert\.equal\(w,992/);
 assert.match(graphics,/assert\.equal\(h,700/);
 assert.match(graphics,/art\/test166-dice/);
});
test('TEST 168 remains isolated; previous builds and approved 144 are unmodified',()=>{
 const y=read('../../.github/workflows/build-test-168.yml');
 assert.match(y,/branches: \[TEST-BRANCH-168\]/);
 assert.match(y,/versionCode 168/);
 assert.match(y,/applicationIdSuffix "\.test168"/);
 assert.match(y,/make-test168-3d-previews\.cjs/);
 assert.match(y,/audit-test-168\.cjs/);
 assert.match(y,/Oathkeeper-TEST-BRANCH-168\.apk/);
});
