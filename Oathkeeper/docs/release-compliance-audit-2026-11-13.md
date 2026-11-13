# Oathkeeper — public-release compliance audit (13 November 2026)
**STATUS: NOT CLEARED FOR PUBLIC RELEASE.** This is a code-and-policy readiness assessment, **not** legal advice, store approval, IP indemnity or proof of a live-service security review.

## Scope and source baseline
- Repository: `hwemp/Oathkeeper-App`; reviewed from `OATHKEEPER-VISUAL-WORKBENCH` (Apply UI Updates project).
- This compliance work is isolated on `compliance-release-audit-2026-11-13`. Preserve approved APK 144, actual dice animation/art, icons, backgrounds, assets and the ongoing test-build branches. Do not release, merge, force-push, or enable community/payments through this work.
- Also review companion backend repository `hwemp/oathkeeper` **before any online features are enabled**; mobile-only review cannot establish backend safety.
- Review code, configuration, bundled assets, policies, app-store listings, installed **release** builds, backend, and geographic distribution.

## Current evidence (static inspection, not a pass to publish)
| Area | Evidence observed | Release disposition |
| --- | --- | --- |
| First launch | `web/terms-gate.js`: versioned local acceptance, under-13 rejection, teen offline restrictions, explicit accept/reject | **Partial**: self-declared age, no verified consent; physical accessibility/safe-area test pending |
| Community | `web/index.html` meta switch `oathkeeper-community-safety-verified=disabled`; community depends on separate backend | **Block public community** pending live account deletion, age review, moderation, data protection and reporting tests |
| Privacy | `web/privacy.html` covers local files, backups, community, support, and third parties | **Needs revision**: still says community account deletion and recovery unavailable and Store is empty; no confirmed public HTTPS policy/support URLs |
| Licensed D&D rules | `THIRD_PARTY_NOTICES.txt` has SRD 5.2.1 CC-BY-4.0 attribution | **Partial**: identify every reproduced passage, term, creature, character, setting, art and trademark; ensure all are in SRD or separately licensed |
| Artwork and font rights | Numerous bundled `.webp`, `.png`, `.svg`, dice/GIF and font assets | **Unverified**: fill `asset-rights-register.csv` per asset with authorship, license, evidence and permission for commercial app use |
| Store purchases | `web/store-pricing.js` has checkout disabled, catalog and native bridges are prepared | **Keep disabled** until compliant Play Billing/Apple StoreKit, real purchases, verified entitlements, refunds, restore and receipts have native QA |
| Android | Source API target 36; debug APK workflow exists | **Partial**: final signed production `.aab`, Play Console testing, device/security QA and account review required |
| iOS | Capacitor iOS project with `PrivacyInfo.xcprivacy` | **Partial**: Xcode 26+/iOS 26 SDK archive, App Store Connect privacy metadata and TestFlight review required |
| App listing | Submission draft and graphics exist | **Incomplete**: actual device screenshots, truthful features/ratings, final legal URLs, unique publisher ID and final data declarations |
| Support/repair | Support diagnostics can share reports with external repair provider when enabled | **Review**: opt-in and transfers, retention, credentials, redaction and truthful privacy labels |
| Security | Native local backups and online service/session code | **Unverified**: auth, rate limits, moderation, injection, upload/attachment safety, deletion, breach response and backup privacy |
| Accessibility | Terms gate and UI need first-launch focus/safe-area QA | **Pending**: emulator and physical devices for TalkBack/VoiceOver, zoom, small screens, Android back handling |

## Rights and IP decision rules
1. **SRD licensed material**: only SRD 5.2.1/5.1 content published under CC-BY-4.0 (or separately licensed content); keep the official attribution, version, license link and any changed-material indication. Commercial use of **SRD material** is permitted by this license.
2. **Not licensed merely because related to D&D**: proprietary monsters, settings, characters, paid-book passages, official character art, proprietary logos, official mobile app UI/graphics, non-SRD terminology and software source. Do not reproduce.
3. **Trademark / branding**: check `Oathkeeper` app name/logo with a trademark professional (USPTO plus relevant jurisdictions); avoid Wizards/D&D Beyond affiliation implications, confusing app descriptions, logos or copied trade dress. An accurate factual compatibility description may still raise trademark-specific issues; obtain counsel's approval.
4. **Fan Content Policy is different**: Wizards' general Fan Content Policy is not the legal basis for monetizing outside-SRD material. Use Creative Commons for eligible SRD material; avoid treating fan-policy permissions as permission to sell licensed D&D IP.
5. **Evidence**: expand `asset-rights-register.csv` to each actual asset and code dependency; distinguish owner-created art, licensed stock, AI-generated content, third-party packages, and unverified assets. Replace or remove anything with unproven rights. Copyright can apply independently to artistic elements despite a permitted underlying game system.
6. **Distribution**: request a written commercial app IP/trademark clearance from qualified counsel. Never claim immunity from a lawsuit, takedown, or rejection.

## Legal/policy work before release
- Final owner/organization name, legal address/contact requirements by region, applicable law and enforceable **Terms of Service** reviewed by counsel. Draft: `docs/policies/terms-of-service-draft.md`.
- Complete accurate **Privacy Policy** and data processing map: character notes, birthdate, identifiers, uploaded files, account credentials, direct messages, moderation reports, support/repair provider, backups, storage, recipients, deletion, retention, security and cross-border transfers. Draft review: `docs/policies/privacy-review.md`.
- **Community Standards / child safety**: user reporting/blocking, objectionable-content filtering, response SLAs, safety escalation, rules for content/IP takedowns, appeals and transparent contact info; prepare before enabling any UGC. Draft: `docs/policies/community-guidelines-draft.md`.
- **Account deletion**: in-app deletion for Apple, app and external deletion-request path for Google Play, actual backend cascade including UGC; user-facing retention exceptions. Local character reset **does not** delete server accounts.
- **Minors and legal jurisdictions**: self-reported birthdate is NOT parental consent or proof of age. Prior proposed family/existing-friend exceptions are **not** automatic legal authorization. Restrict features until age assurance, safeguarding and laws (including COPPA where relevant) receive specialist review. Prefer offline-only launch over unverified chat.
- **Digital items**: app-store payment requirements may vary by region/entitlement; do not accept Cash App/PayPal/card/Venmo as an unreviewed substitute for platform in-app billing. Price displays must be clear; restore/refund/consumer rights must be tested.
- **Store policy**: Google Play current Developer Program Policy, Data Safety, target API 36, Content Rating, child safety declaration if in scope, in-app account deletion, account identity, Play App Signing and AAB. Some new personal accounts need >=12 opted-in closed testers for 14 continuous days.
- **Apple**: App Review 1.2 UGC, 2.1 completeness, 3.1 payment, 5.1 privacy/deletion, app access/demo credentials, updated age-rating questionnaire, Xcode 26+/iOS 26 SDK and App Privacy. Sign, archive and test physical iOS build in TestFlight.
- **Security/release**: check OWASP MASVS/MSTG as guidance, package content, secrets, transport security, dependency vulnerabilities, data export/import validation, backups, permissions, accessibility and actual installed binary details.
- **Play release** requires production signed AAB; debug APK is not release approval. **Apple** requires Xcode archive/IPA submission, not Android APK.

## Mandatory release walk-through (leave unchecked until evidenced)
- [ ] Each asset and code component has confirmed commercial distribution rights, documented in source rights register
- [ ] D&D SRD mapping and trademark clearance reviewed by qualified counsel
- [ ] Accurate legal Terms, Privacy and Community Standards published at public HTTPS URLs
- [ ] In-app/online account deletion, retention, moderation, contact review and minor safety tested or social features demonstrably disabled
- [ ] Review privacy labels/Data Safety against **actual** release binaries, backend and third-party providers
- [ ] Payments remain off OR verified app-store purchases, restore, refund and server-side checks pass
- [ ] Android target/permissions/security/device tests and signed AAB pass
- [ ] iOS privacy manifest, archive, App Privacy, TestFlight/device QA pass
- [ ] Store listings/screenshots/ratings/support links reflect shipped app
- [ ] Google and Apple developer enrollment/verification and region-specific requirements finished
- [ ] Owner and qualified counsel sign off, including final version hashes

## Automated checks
From `Oathkeeper/`: `node scripts/release-compliance-check.mjs --audit` (prints findings and missing evidence, no release claim). For gating: `node scripts/release-compliance-check.mjs --release` (nonzero while mandatory evidence absent). The proof register is `docs/release-evidence.json`; **never mark entries true without evidence**. Static checks are not substitutes for source provenance, legal advice, server penetration testing, or physical-device execution.

## Official references (checked November 13, 2026)
- Wizards SRD: https://www.dndbeyond.com/srd
- Wizards Fan Content Policy: https://company.wizards.com/en/legal/fancontentpolicy
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/legalcode
- Apple: https://developer.apple.com/app-store/review/guidelines/
- Apple account deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Google Play: https://support.google.com/googleplay/android-developer/answer/18265346
- Google account deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Google testing: https://support.google.com/googleplay/android-developer/answer/14151465
- Android API: https://developer.android.com/google/play/requirements/target-sdk
- Apple SDK: https://developer.apple.com/news/upcoming-requirements/
