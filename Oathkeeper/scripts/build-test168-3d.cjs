/* TEST 168: offline graphics bundle for Android and browser audits.
 * Copies protected dice geometry byte-for-byte into a temporary export module.
 * Does NOT alter source roller, randomness, history, odds or animations. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const esbuild=require('esbuild');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const src=path.join(root,'web/dice-tabletop.js');
 const sha=execFileSync('git',['hash-object','web/dice-tabletop.js'],{cwd:root,encoding:'utf8'}).trim();
 assert.equal(sha,'b79543b170783f0fb4bdff1541d73ae6a4014bba','Protected Build 144 dice renderer source must be untouched');
 const adapter=path.join(root,'web/test168-geometry.js');
 const original=fs.readFileSync(src,'utf8');
 const exportMesh=[
   '\n/* TEST 168 export-only adapter: original getShape() returned unmodified. */',
   'export function test168Mesh(sides){',
   ' const n=Number(sides);',
   ' if(![3,4,6,8,10,12,20,50,100].includes(n))throw new RangeError("Unsupported dice geometry");',
   ' const mesh=getShape(n);',
   ' return {v:mesh.v.map(p=>p.slice()),f:mesh.f.map(p=>p.slice())};',
   '}'
 ].join('\n');
 try{
  fs.writeFileSync(adapter,original+exportMesh);
  fs.mkdirSync(path.join(root,'dist'),{recursive:true});
  await esbuild.build({
   entryPoints:{
    'test168-live-3d':path.join(root,'web/test168-live-overlay.js'),
    '__test168-preview':path.join(root,'web/test168-preview-entry.js')
   },
   bundle:true,format:'esm',platform:'browser',
   target:['chrome110','safari16'],minify:true,sourcemap:false,
   outdir:path.join(root,'dist'),logLevel:'info',
   legalComments:'none'
  });
 }finally{
  fs.rmSync(adapter,{force:true});
 }
 const dist=path.join(root,'dist');
 assert(fs.statSync(path.join(dist,'test168-live-3d.js')).size>150000,'WebGL+Three.js offline module missing');
 assert(fs.statSync(path.join(dist,'__test168-preview.js')).size>150000,'WebGL preview bundling failed');
 fs.writeFileSync(path.join(dist,'__test168-preview.html'),
  '<!doctype html><html><head><meta charset="utf-8"></head><body style="background:#151126;margin:0"><canvas id="preview" style="width:248px;height:175px"></canvas><script type="module" src="./__test168-preview.js"></script></body></html>');
 console.log('TEST 168 OFFLINE WEBGL BUNDLES READY: protected roller SHA '+sha);
})().catch(e=>{console.error('TEST 168 BUNDLE FAILED',e);process.exitCode=1});
