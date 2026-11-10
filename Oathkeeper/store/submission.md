# Store submission draft

Display name: Oathkeeper
Apple subtitle: Tabletop character companion
Google short description: Track your character, powers, inventory and adventures offline.
Category suggestion: Tools (Google Play), Utilities (Apple). Publisher should confirm.
Version/build: 1.0 / 1. Bundle ID: com.harrisonwaters.oathkeeper (verify availability).

## Full description

Keep your tabletop character ready for every adventure. Oathkeeper puts editable ability scores, hit points, custom Holy Points, power descriptions, equipment and notes in one offline companion.

Change stats and see supported modifiers, saving throws, armor class and carrying totals update. Track damage, healing, temporary HP and custom power costs. Manage your coin purse and inventory, roll dice, and record your story in a character journal.

Import a readable PDF, text sheet or Oathkeeper JSON backup. Review recognized fields before applying changes. PDF layouts vary: some data and custom rules need manual entry. Scanned pages require OCR before import.

Your character stays on your device. No account or subscription is required. Export a backup using your device’s share sheet and import it on another device. Includes a preloaded custom paladin profile; features and advancement should be reviewed with your game master.

Independent tabletop companion. Not an official Dungeons & Dragons product.

## Review notes

No login required. App runs offline. Starting profile is preloaded.
Test flows: Overview → Damage/Heal; Powers → Use Shield of Faith → Overview (AC increases; points decrease); Inventory → change quantity → load updates; Settings → roll die; Import & backup → Export full backup → device share sheet; import JSON → review → apply; Settings → Reset character → confirmation.
Effects end manually when duration or concentration ends. Long rest restores HP/points but does not replenish supplies. Level updates proficiency; higher-level HP and powers require manual adjustment.

## Privacy / Data safety draft — verify against the final build

- No developer-operated analytics, tracking, ads, accounts, payments or remote character service included.
- Character data and imported sheet text stay on device; user-initiated export uses the system share destination selected by the user.
- Native Preferences and cache filesystem are used. iOS privacy manifest declares UserDefaults CA92.1 and FileTimestamp C617.1.
- Device backups and store/OS diagnostics are controlled by their respective platforms.
- Publisher must provide a public HTTPS privacy policy URL and working support contact and complete the store forms themselves. Do not submit placeholder values.
- No account deletion flow is needed for this build because no accounts are created. Local reset is provided. Exported files and OS backups must be deleted separately.

## Before release

[ ] Verify app name and bundle/application ID availability.
[ ] Set publisher support email and public support/privacy URLs; include contact in in-app policy.
[ ] Review content ratings for the fantasy combat descriptions and imported user documents.
[ ] Native tests on minimum supported OS and current OS, phone and tablet, portrait/landscape and large text.
[ ] Test offline cold start, import/export roundtrip, PDF worker, cancel/error paths, storage failure, long notes, reset confirmation, background restore and interruption during save.
[ ] Confirm iOS privacy resource and plugin privacy manifests appear in the final archive.
[ ] Run Android release lint and Play pre-launch reports; TestFlight testing for iOS.
[ ] Capture real native screenshots; do not submit feature art as a screenshot.
[ ] Sign release AAB with publisher upload key / archive iOS with publisher team.
[ ] Complete required closed testing and publisher verification.
[ ] Submit for review. Apple may evaluate minimum functionality under guideline 4.2; native packaging alone does not assure acceptance.

## Official references checked November 9, 2026

- https://support.google.com/googleplay/android-developer/answer/11926878
- https://support.google.com/googleplay/android-developer/answer/14151465
- https://developer.apple.com/news/upcoming-requirements/?id=04282026a
- https://developer.apple.com/app-store/review/guidelines/
- https://capacitorjs.com/docs/getting-started/environment-setup
