import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

const load=path=>readFile(new URL(path,import.meta.url),'utf8');

test('iOS supports ten allowlisted free icons and keeps AppIcon as the primary asset',async()=>{
 const [view,plugin,story,pbx,original]=await Promise.all([
  load('../ios/App/App/OathkeeperViewController.swift'),
  load('../ios/App/App/OathkeeperIconPlugin.swift'),
  load('../ios/App/App/Base.lproj/Main.storyboard'),
  load('../ios/App/App.xcodeproj/project.pbxproj'),
  load('../ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json')
 ]);
 assert.match(view,/registerPluginInstance\(OathkeeperIconPlugin\(\)\)/);
 assert.match(story,/customClass="OathkeeperViewController" customModule="App"/);
 assert.match(pbx,/ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;/);
 assert.equal((pbx.match(/ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES/g)||[]).length,2);
 assert.match(original,/"AppIcon-512@2x.png"/);
 assert.match(plugin,/CAPPluginMethod\(name: "getState"/);
 assert.match(plugin,/CAPPluginMethod\(name: "setIcon"/);
 assert.match(plugin,/CAPPluginMethod\(name: "restoreDefault"/);
 assert.match(plugin,/app\.setAlternateIconName\(name\)/);
 assert.match(plugin,/changeIcon\(to: nil, call: call\)/);
 for(const icon of SELECTED_APP_ICONS){
  assert(plugin.includes('"'+icon.iosIconName+'"'));
  assert(pbx.includes(icon.iosIconName));
  const contents=JSON.parse(await load('../ios/App/App/Assets.xcassets/'+icon.iosIconName+'.appiconset/Contents.json'));
  assert.equal(contents.images[0].filename,icon.iosIconName+'.png');
  const file=await stat(new URL('../ios/App/App/Assets.xcassets/'+icon.iosIconName+'.appiconset/'+icon.iosIconName+'.png',import.meta.url));
  assert(file.size>10000);
 }
});

test('Android defines a default launcher plus ten alternative activity aliases',async()=>{
 const [manifest,activity,plugin]=await Promise.all([
  load('../android/app/src/main/AndroidManifest.xml'),
  load('../android/app/src/main/java/com/harrisonwaters/oathkeeper/MainActivity.java'),
  load('../android/app/src/main/java/com/harrisonwaters/oathkeeper/OathkeeperIconPlugin.java')
 ]);
 assert.match(manifest,/android:name="\.LauncherOriginal"/);
 assert.match(manifest,/android:name="\.LauncherOriginal"[\s\S]*?android:icon="@mipmap\/ic_launcher"/);
 assert.equal((manifest.match(/android:name="\.LauncherIcon\d{2}"/g)||[]).length,10);
 assert.equal((manifest.match(/android:enabled="false"/g)||[]).length,10);
 assert.match(activity,/registerPlugin\(OathkeeperIconPlugin\.class\)/);
 assert.match(plugin,/@CapacitorPlugin\(name = "OathkeeperIcon"\)/);
 assert.match(plugin,/PackageManager\.DONT_KILL_APP/);
 assert.match(plugin,/void setIcon\(PluginCall call\)/);
 assert.match(plugin,/void restoreDefault\(PluginCall call\)/);
 for(const icon of SELECTED_APP_ICONS){
  const n=String(icon.selection).padStart(2,'0');
  assert(manifest.includes('@mipmap/oathkeeper_icon_'+n));
  const file=await stat(new URL('../android/app/src/main/res/mipmap-nodpi/oathkeeper_icon_'+n+'.png',import.meta.url));
  assert(file.size>2000);
 }
});

test('web icon bridge validates free icon IDs and prevents browser launcher changes',async()=>{
 const js=await load('../web/ios-icon.js');
 assert.match(js,/Capacitor\.isNativePlatform\(\)/);
 assert.match(js,/Capacitor\.getPlatform\(\)/);
 assert.match(js,/supported:false,currentIcon:'default',isOriginal:true/);
 assert.match(js,/SELECTED_APP_ICONS\.find\(icon=>icon\.slug===slug\)/);
 assert.match(js,/nativeIcon\.setIcon\(\{iconName:item\.iosIconName\}\)/);
 assert.match(js,/nativeIcon\.restoreDefault\(\)/);
 assert.doesNotMatch(js,/purchase|receipt|unlock/i);
});

test('asset generator produces 10 different designs without replacing original launcher assets',async()=>{
 const script=await load('../scripts/generate-free-icons.py');
 assert.match(script,/ICONS = \[/);
 assert.match(script,/len\(digests\) != len\(set\(digests\)\)/);
 assert.match(script,/ADAPTIVE_SIZE = 432/);
 assert.match(script,/SAFE_ART_RATIO = \.665/);
 assert.doesNotMatch(script,/ic_launcher\.png|AppIcon-512@2x\.png/);
});
