#!/usr/bin/env node
/**
 * Oathkeeper Workbench — read-only consistency / legacy-source audit.
 *
 * Purpose:
 *   Identify and stop the repeated regression: an older CSS/asset/rendering
 *   path overriding the approved current source of truth on another screen.
 *
 * This script never edits source, compiles APKs, starts Android workflows,
 * downloads anything, or declares visual approval.
 * Run: node scripts/audit-workbench-source-alignment.mjs
 *      node scripts/audit-workbench-source-alignment.mjs --strict
 *
 * Strict mode intentionally FAILS while deprecated paths still coexist.
 * Resolve issues one at a time and ask the user to approve each change.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read=p=>fs.readFileSync(path.join(root,p));
const str=p=>read(p).toString('utf8');
const sha=p=>crypto.createHash('sha256').update(read(p)).digest('hex');
const exists=p=>fs.existsSync(path.join(root,p));
const blocking=[],advisories=[],checks=[],sourceOwners={};
const check=(name,pass,detail='')=>{
 checks.push({name,pass,detail});
 if(!pass)blocking.push({name,detail});
};
const warn=(name,detail)=>advisories.push({name,detail});
const iconNos=SELECTED_APP_ICONS.map(i=>String(i.selection).padStart(2,'0'));
check('Exactly 10 unique icon selections',iconNos.length===10&&new Set(iconNos).size===10);
for(const icon of SELECTED_APP_ICONS){
 const n=String(icon.selection).padStart(2,'0');
 const master='android/app/src/main/res/drawable-nodpi/oathkeeper_icon_art_'+n+'.webp';
 const native='android/app/src/main/res/mipmap-nodpi/oathkeeper_icon_'+n+'.webp';
 const catalog='web/public/art/store-icons/icon-'+n+'.webp';
 const xml='android/app/src/main/res/mipmap-anydpi-v26/oathkeeper_icon_'+n+'.xml';
 const correct=exists(master)&&exists(native)&&exists(catalog)&&exists(xml)
   &&sha(master)===sha(native)&&sha(master)===sha(catalog)
   &&str(xml).includes('@drawable/oathkeeper_icon_art_'+n);
 check('Icon '+n+' Store = Android launcher pixels and alias',
   correct,
   'The ONLY approved image authority is '+master+'; selected Store tile and enlarged preview must use that master.');
}
const oldFiles=fs.readdirSync(path.join(root,'web/public/art/store-icons'))
 .filter(name=>/^launcher-\d+\.webp$/.test(name));
check('No secondary launcher icon image reservoir',oldFiles.length===0,
  oldFiles.length?'Unexpected extra launchers: '+oldFiles.join(', '):'Web source has no secondary icon art collection');
const archived={
 iconHotspots:'web/test164-overrides.css',
 originalStoreBuilder:'scripts/patch-test169-approved-source.py',
 legacySceneCss:'web/test169-reference.css',
 approvedButtonCss:'web/test170-reference-buttons.css',
 selectedButtonController:'web/test170-button-states.js',
 gameplayRenderer:'web/test171-gameplay-toss.js'
};
for(const [name,file] of Object.entries(archived)){
 check('Required known source exists: '+name,exists(file),file);
}
sourceOwners.appIcons='android/app/src/main/res/drawable-nodpi/oathkeeper_icon_art_XX.webp';
sourceOwners.appIconSelection='web/store-icon-catalog.js';
sourceOwners.appIconPreview='Pending: the frozen 144 image-backed Store renderer must share the exact launch-icon master, not baked old previews';
sourceOwners.buttonMaster='web/public/art/oath170-button-master.svg';
sourceOwners.buttonStates='web/test170-button-states.js';
sourceOwners.gemGeometry='web/public/art/oath170-button-master.svg';
sourceOwners.backgroundMaster='Pending design approval: individual verified unique high-resolution image per environment';
sourceOwners.storeDiceShowcase='art/exact-store/roll/(theme).webp and astral-original.gif; unchanged';
sourceOwners.gameplayDice='web/test171-gameplay-toss.js; future genuine 3D redesign requires separate approval';
const layers=[
 ['web/ornate-buttons.css','base ornate CSS'],
 ['web/test164-overrides.css','TEST 164 override CSS'],
 ['web/test169-reference.css','TEST 169 override CSS'],
 ['web/test170-reference-buttons.css','TEST 170 master CSS']
];
const hotSelectors=['#nav button','#appMenu .menu-options button','#journalEditor .row button','#equipmentEditor .row button'];
const duplicateAreas={};
for(const selector of hotSelectors){
 const layersFound=layers.filter(([file])=>exists(file)&&str(file).includes(selector)).map(([file,name])=>({file,name}));
 duplicateAreas[selector]=layersFound;
 if(layersFound.length>1)warn('Potential CSS cascade collision: '+selector,
   layersFound.map(x=>x.file).join(' -> '));
}
if(exists('web/test164-overrides.css')){
 const css=str('web/test164-overrides.css');
 if(css.includes('background-size:contain!important')&&css.includes('data-store-icon')){
  warn('App Icons tile can shrink even when master bytes match',
    'Legacy test164 pseudo-element fills icon hotspot with background-size:contain; check actual icon inner bounds in browser. After repair, retire this rule.');
 }
 if(css.includes('art/store-icons/launcher-')){
  warn('Legacy icon URL aliases remain in visual CSS',
    'The 164 layer requests launcher-XX aliases instead of canonical Android art paths. Alias bytes are verified, but the frozen Store preview may still use a baked image.');
 }
}
if(exists('web/test169-reference.css')&&str('web/test169-reference.css').includes('object-fit:fill!important')){
 warn('Background page stretch rule still exists',
   'TEST 169 forces an entire baked Store page image to object-fit:fill; image/frame fit is unapproved pending background repair.');
}
const reserved=['web/test166-bundle-overlay.js','web/test168-live-overlay.js','web/test168-jewel-scene.js'];
warn('Historic experimental source is still in the repository',
 reserved.filter(exists).join(', ') || 'No experimental source files found');
if(exists('../.github/workflows/build-test-171.yml')){
 const workflow=str('../.github/workflows/build-test-171.yml');
 check('Archived TEST 171 workflow targets only TEST 171',
   workflow.includes('branches: [TEST-BRANCH-171]'),
   'Do not run on workbench branch.');
}
const report={
 audit:'Oathkeeper workbench source-of-truth / code-alignment baseline',
 timestamp:new Date().toISOString(),
 branchPolicy:'No APK until user approves all issues. No experiments in approved release branch.',
 visualApproval:'NOT GRANTED; structural checks do not imply a pixel-perfect UI.',
 sourceOwners,
 checks,
 blocking,
 advisories,
 duplicateAreas,
 activeIssue:'1: App Icons source/rendered-preview mismatch'
};
const output=path.join(root,'preview-output/workbench-source-alignment.json');
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({checks:checks.length,blocking:blocking.length,advisories:advisories.length,
  overlappingSelectors:Object.keys(duplicateAreas).filter(s=>duplicateAreas[s].length>1),
  output:path.relative(root,output)},null,2));
if(process.argv.includes('--strict')&&(blocking.length||advisories.length)){
 console.error('STRICT BLOCK: unresolved legacy/cross-screen inconsistencies remain. Do not publish APK.');
 process.exitCode=1;
}
