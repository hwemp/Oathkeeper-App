/* Browser preview only. Bundles EXISTING canonical face-accurate dice geometry.
 * APK packaging stays governed by separate signed, isolated test workflow.
 */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const esbuild=require('esbuild');
(async()=>{
 const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
 const index=path.join(dist,'index.html');
 assert(fs.existsSync(index),'Build 144 frozen bundle missing');
 const orig=fs.readFileSync(index,'utf8');
 assert(orig.includes('test171-gameplay-toss.js'),'Preserved 171 fallback is not packaged');
 assert(!orig.includes('workbench-gameplay-mesh.js'),'Duplicate mesh injection');
 await esbuild.build({
  entryPoints:[path.join(root,'web/workbench-gameplay-mesh.js')],
  outfile:path.join(dist,'workbench-gameplay-mesh.js'),
  format:'iife',platform:'browser',bundle:true,
  target:['chrome110','safari16'],minify:false,
  sourcemap:false,legalComments:'none'
 });
 const js=fs.readFileSync(path.join(dist,'workbench-gameplay-mesh.js'),'utf8');
 assert(js.includes('playTabletopRoll')&&js.includes('diceMeshFaceCount')&&js.length>18000,
  'True-numbered-face live dice geometry missing from bundle');
 assert(!js.includes('Math.random(')&&!js.includes('crypto.getRandomValues('),
  'Visual module must not draw numbers or sample results');
 fs.copyFileSync(path.join(root,'web/workbench-gameplay-mesh.css'),
  path.join(dist,'workbench-gameplay-mesh.css'));
 const tags='<link rel="stylesheet" href="./workbench-gameplay-mesh.css" data-workbench-mesh="true">'+
            '<script defer src="./workbench-gameplay-mesh.js" data-workbench-mesh="true"></script>';
 fs.writeFileSync(index,orig.replace('</head>',tags+'</head>'));
 console.log('WORKBENCH: protected 3D die geometry bundled for GAMEPLAY only; Store GIF and RNG untouched.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
