/**
 * Oathkeeper release evidence gate.
 * Static checks are NOT a legal opinion, device QA, a verified age service,
 * a rights clearance, or proof of app-store acceptance.
 *
 * Usage from Oathkeeper/:
 *   node scripts/release-compliance-check.mjs --audit
 *   node scripts/release-compliance-check.mjs --release
 */
import fs from 'node:fs';
const read = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);
const results = [];
const record = (status, id, detail) => results.push({status, id, detail});
const required = (id, p, re, detail) => {
  try { const ok = re.test(read(p)); record(ok ? 'PASS' : 'BLOCK', id, ok ? 'Found required source evidence' : detail); }
  catch { record('BLOCK', id, 'Missing file: ' + p); }
};
const check = (id, ok, detail) => record(ok ? 'PASS' : 'BLOCK', id, detail);

required('android-target-api-36','android/variables.gradle',/targetSdkVersion\s*=\s*36\b/,'2026 new app submissions require target API 36 or higher.');
required('ios-privacy-manifest','ios/App/App/PrivacyInfo.xcprivacy',/NSPrivacyAccessedAPITypes/,'Missing iOS privacy API manifest.');
required('srd-license-attribution','THIRD_PARTY_NOTICES.txt',/System Reference Document 5\.2\.1[\s\S]*Creative Commons Attribution 4\.0 International License/,'Required SRD CC-BY attribution absent; separately validate exact text and scope.');
required('terms-acceptance-gate','web/terms-gate.js',/terms-accepted/,'First-launch acknowledgement hook missing.');
required('terms-rejection-gate','web/terms-gate.js',/termsReject/,'First-launch rejection gate missing.');
required('terms-checkbox','web/index.html',/id="termsAgree"/,'First-launch checkbox missing.');
required('terms-age-choice','web/index.html',/id="termsAge"/,'Age choice missing.');
required('in-app-privacy-page','web/privacy.html',/<h1>Privacy policy<\/h1>/,'In-app privacy policy missing.');
required('community-default-off','web/index.html',/name="oathkeeper-community-safety-verified" content="disabled"/,'Community may have been enabled without documented verification.');
required('offline-base-config','capacitor.config.json',/"webDir"\s*:\s*"dist"/,'Unexpected app packaging.');
const pricing = exists('web/store-pricing.js') ? read('web/store-pricing.js') : '';
check('checkout-default-off', pricing && !/checkoutEnabled\s*:\s*true/.test(pricing) && (pricing.match(/checkoutEnabled\s*:\s*false/g)||[]).length >= 3,
 'All paid cosmetic checkout switches must remain disabled until store billing, entitlement verification, refunds and restoration pass native tests.');

const privacy = exists('web/privacy.html') ? read('web/privacy.html') : '';
record('REVIEW','privacy-accuracy','Review actual SDKs, community, support diagnostics, billing and backups; current prose says Store empty although Store previews exist.');
if (/Account deletion and password recovery are not available/.test(privacy))
  record('REVIEW','account-deletion','Account deletion/recovery are unavailable: permitted only for an evidence-backed offline-only build without account creation. Online community must remain disabled until server-side deletion and privacy compliance pass.');
record('REVIEW','age-assurance','Current first-launch age range is self-declared. It is not identity assurance or verified parental consent; require separate backend review.');
record('REVIEW','third-party-art','Verify licensed original source and commercial distribution rights for ALL art, SVGs, fonts, audio, screenshots, dice GIFs, and logo variants; see asset-rights-register.csv.');
record('REVIEW','dnd-ip','Compare every embedded rule, name, art asset and layout against SRD 5.2.1 and original artwork. Official D&D Beyond content linked to is not necessarily licensed to copy.');
let evidence;
try { evidence=JSON.parse(read('docs/release-evidence.json')); }
catch { evidence=null; record('BLOCK','evidence-file','Missing or invalid release evidence JSON.'); }
if (evidence) {
  const keys=[
    'copyright_assets_verified','trademark_review_completed','legal_policy_review_completed',
    'privacy_public_https_verified','support_contact_verified','terms_reviewed_and_accepted_flow_tested',
    'community_disabled_or_moderated_and_tested','age_and_child_safety_review_completed',
    'deletion_and_recovery_tested_if_accounts_enabled','payments_disabled_or_store_billing_tested',
    'play_console_declarations_completed','apple_connect_declarations_completed',
    'android_release_aab_signed_and_tested','ios_archive_testflight_tested',
    'real_device_accessibility_qa_completed','official_branding_no_affiliation_verified',
    'store_listing_images_and_claims_verified','release_approval_recorded'];
  for(const key of keys) {
    const ok=evidence.checks?.[key] === true && typeof evidence.proofs?.[key] === 'string' && evidence.proofs[key].trim().length > 10;
    record(ok ? 'PASS' : 'BLOCK','manual-'+key,ok ? evidence.proofs[key] : 'Unverified. Requires actual proof URL/record AND owner review; never auto-certify.');
  }
}
const blockers=results.filter(x=>x.status==='BLOCK');
for (const r of results) console.log(r.status.padEnd(6)+' '+r.id+': '+r.detail);
console.log('\n'+JSON.stringify({result: blockers.length ? 'NOT_RELEASE_READY' : 'STATIC_AND_MANUAL_EVIDENCE_PRESENT_REQUIRES_FINAL_HUMAN_REVIEW',passed:results.filter(x=>x.status==='PASS').length,blockers:blockers.length,reviews:results.filter(x=>x.status==='REVIEW').length},null,2));
if(process.argv.includes('--release') && blockers.length) process.exitCode=1;
