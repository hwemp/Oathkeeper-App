# Oathkeeper — Privacy Policy and Data Safety verification
**PREPUBLICATION REVIEW; do not assert the current policy has been fully verified.** Review the actual installed binary and operational backend before finalizing disclosures. Current app policy: `web/privacy.html`.

## System and data map
| Area | Possible data / flow | What must be confirmed |
| --- | --- | --- |
| Local character | Name, stats, inventory, powers, journal, DM notes, roll history, PDFs | On-device storage, backups, import/export, OS backup settings and reset erasure |
| Signup/community (disabled by default) | Username, password hashes, private birthdate, sessions, friendships, groups | Backend actually deployed, data collected/minimized, purpose, privacy and geographic transfer |
| User-generated content | Messages, posts/comments, images, attachments, groups and moderation reports | Storage provider, HTTPS, access boundaries, abuse reporting, deletion and retention |
| Safety reports | Reported content, reason, reporter/account IDs | Restricted moderator access, retention, escalation, legal handling |
| Support and automated repair | Diagnostic reports, optional external analysis and service credentials | Actual vendor processors, opt-in, private-data redaction, retention, deletion and controls |
| Platform/store | Android/iOS identifiers, entitlements, purchases, receipts, native SDK diagnostics | SDK inventory, Apple App Privacy, Google Data safety, purchase entitlements |
| App export | JSON/share sheet and OS backup | Disclosure that user-chosen destinations may receive exported data |

## Documented discrepancies and must-fix items
1. The live `privacy.html` says **the Store is empty**, while the web code contains cosmetic catalog/previews and disabled checkout. Rewrite accurately as *Store previews exist; no checkout enabled*, only after verifying the final build.
2. The current policy explicitly states **account deletion and password recovery are unavailable**. If online accounts are launched, implement/test deletion in app and via a public request website; verify cascade for posts, messages, attachments, friendships, sessions and retained moderation evidence.
3. First-launch age range is self-declared; do not claim verified identity or guardian approval. Obtain counsel input before child accounts, chat exceptions or global access.
4. `NSPrivacyCollectedDataTypes` is empty in the iOS privacy manifest. That is **not proof of no collection** after a live community or repair service launches. Align final manifest requirements and App Store Connect data labels with actual SDKs/third-party processors.
5. Public privacy URL and support URL are not evidenced by repo code. Publish on working HTTPS host and verify links from app and both store listings. Contact email is displayed in source, but its operational handling must be verified.
6. Review any third-party fonts, libraries, art, plugins and crash/log collection for their actual privacy/license terms.
7. Define retention times, account deletion completion, backups, legal holds, encryption, safeguards, consent, breach/incident contact, underage-user processes and international availability before publication.
8. Do not publish a policy claiming server data is deleted by a local Settings reset. Do not promise emailed character backups or live moderation if not deployed.
9. Report Apple/Google privacy declarations honestly and consistently; store review can reject contradictory statements even when an offline-only test build functions.

## Verification protocol
- Offline Android and iOS: cold start, import large PDF, save/export, reset, backup migration, reinstall, crash/restart, no permissions beyond needed; intercept network calls if possible.
- Account staging: create user, send messages, upload attachment, report, block, delete account, verify every API endpoint and file URL is inaccessible after deletion, request outside-app deletion.
- Age: test each age tier and attempts to access native API/community directly; review moderator proof of age/guardian and record approvals under law; never rely on app-only checks.
- Payments: verify no charges occur when checkout disabled; if enabled, sandbox purchase/restore/refund/revocation and receipts on both platforms.
- Review privacy and retention by a qualified professional for actual regions. Keep dated screenshots/proofs in `docs/release-evidence.json` without secrets or child data.

Official guidance:
- Apple Privacy: https://developer.apple.com/app-store/review/guidelines/
- Google Data safety and deletion: https://support.google.com/googleplay/android-developer/answer/13327111
- Google user data policy: https://support.google.com/googleplay/android-developer/answer/10144311
