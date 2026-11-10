import fs from 'node:fs';import assert from 'node:assert/strict';
const read=p=>fs.readFileSync(p,'utf8');const config=JSON.parse(read('capacitor.config.json'));
assert.equal(config.webDir,'dist');assert(!config.server,'Must bundle offline assets, not load a private hosted site');
assert.match(read('android/variables.gradle'),/targetSdkVersion = 36/);
assert.match(read('ios/App/App/PrivacyInfo.xcprivacy'),/CA92.1/);assert.match(read('ios/App/App/PrivacyInfo.xcprivacy'),/C617.1/);
assert.match(read('ios/App/App.xcodeproj/project.pbxproj'),/A10000000000000000000001 \/\* PrivacyInfo.xcprivacy in Resources \*\/,/);
for(const p of ['dist/index.html','dist/privacy.html','dist/vendor/pdf.min.mjs','dist/vendor/pdf.worker.min.mjs','android/app/src/main/assets/public/index.html','ios/App/App/public/index.html','store/play-icon-512.png','store/play-feature-graphic.png'])assert(fs.statSync(p).size>0,p);
assert.match(read('web/native.js'),/Preferences.set/);assert.match(read('web/native.js'),/Share.share/);
console.log('PASS: offline config, Android API, iOS privacy resource, bundled assets, icons, native saving and sharing wiring. Native compilation/device tests not performed.');
