import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const load=path=>readFile(new URL(path,import.meta.url),'utf8');

test('iOS StoreKit 2 verifies native entitlements and exposes restore',async()=>{
 const [swift,view,pbx]=await Promise.all([
  load('../ios/App/App/OathkeeperBillingPlugin.swift'),
  load('../ios/App/App/OathkeeperViewController.swift'),
  load('../ios/App/App.xcodeproj/project.pbxproj')
 ]);
 assert.match(swift,/import StoreKit/);
 assert.match(swift,/case \.verified\(let transaction\)/);
 assert.match(swift,/transaction\.revocationDate == nil/);
 assert.match(swift,/currentEntitlements/);
 assert.match(swift,/StoreKit\.AppStore\.sync\(\)/);
 assert.match(swift,/purchase\(_ call: CAPPluginCall\)/);
 assert.match(view,/registerPluginInstance\(OathkeeperBillingPlugin\(\)\)/);
 assert.match(pbx,/OathkeeperBillingPlugin\.swift in Sources/);
 assert.doesNotMatch(swift,/localStorage|FakePurchase/);
});
test('Google Billing 9 compiles catalog listing without unverified purchase fulfillment',async()=>{
 const [java,gradle,main]=await Promise.all([
  load('../android/app/src/main/java/com/harrisonwaters/oathkeeper/OathkeeperBillingPlugin.java'),
  load('../android/app/build.gradle'),
  load('../android/app/src/main/java/com/harrisonwaters/oathkeeper/MainActivity.java')
 ]);
 assert.match(gradle,/com\.android\.billingclient:billing:9\.1\.0/);
 assert.match(main,/registerPlugin\(OathkeeperBillingPlugin\.class\)/);
 assert.match(java,/enablePendingPurchases\(PendingPurchasesParams/);
 assert.match(java,/enableAutoServiceReconnection\(\)/);
 assert.match(java,/queryProductDetailsAsync/);
 assert.match(java,/response\.put\("verified", false\)/);
 assert.match(java,/void purchase\(PluginCall call\)/);
 assert.match(java,/Checkout is disabled|checkout is disabled/i);
 assert.doesNotMatch(java,/launchBillingFlow\(/);
});
