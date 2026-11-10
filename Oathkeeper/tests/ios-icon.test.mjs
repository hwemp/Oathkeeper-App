import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const load=path=>readFile(new URL(path,import.meta.url),'utf8');
test('iOS app registers the native icon plugin without replacing its primary icon',async()=>{
 const [view,plugin,story,pbx,icons]=await Promise.all([
   load('../ios/App/App/OathkeeperViewController.swift'),
   load('../ios/App/App/OathkeeperIconPlugin.swift'),
   load('../ios/App/App/Base.lproj/Main.storyboard'),
   load('../ios/App/App.xcodeproj/project.pbxproj'),
   load('../ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json')
 ]);
 assert.match(view,/bridge\?\.registerPluginInstance\(OathkeeperIconPlugin\(\)\)/);
 assert.match(story,/customClass="OathkeeperViewController" customModule="App"/);
 for(const file of ['OathkeeperIconPlugin.swift','OathkeeperViewController.swift']){
   assert.match(pbx,new RegExp(file.replace('.', '\\.') + ' in Sources'));
 }
 assert.match(pbx,/ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon/);
 assert.match(icons,/"AppIcon-512@2x.png"/);
 assert.match(plugin,/UIApplication\.shared\.setAlternateIconName\(nil\)|app\.setAlternateIconName\(nil\)/);
 assert.doesNotMatch(plugin,/name: "setIcon"|func setIcon|unlockIcon|purchaseIcon/);
 assert.match(plugin,/CAPPluginMethod\(name: "getState"/);
 assert.match(plugin,/CAPPluginMethod\(name: "restoreDefault"/);
});
test('native JS icon bridge refuses to claim support in a browser or Android',async()=>{
 const js=await load('../web/ios-icon.js');
 assert.match(js,/Capacitor\.isNativePlatform\(\)/);
 assert.match(js,/Capacitor\.getPlatform\(\) === 'ios'/);
 assert.match(js,/supported:false,currentIcon:'default',isOriginal:true/);
 assert.doesNotMatch(js,/export async function applyPaidIcon/);
});
