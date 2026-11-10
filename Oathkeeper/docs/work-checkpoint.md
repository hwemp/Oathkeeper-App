# Oathkeeper work checkpoint — November 10, 2026

## Scope
Continue PR #5 (`fix-approved-preview`): Gothic UI corrections and working Dice section after Inventory. Main remains unchanged while the preview is reviewed.

## Completed before this checkpoint
- Official/Unofficial dice menus, Arcane Prism D3, percentile D100, quantities, modifiers, roll breakdowns and probabilities.
- Secure random rolls with rejection sampling; exact D3 and percentile mapping tests.
- Navigation buttons survive rerenders; Dice scrolls fully into view.
- Fantasy gold HP divider and shaped navigation plaques.

## Resumed work
- Added first-visit Dice navigation and layout checks at 320, 360, 393, 430 and 852 pixels, including rerenders and returning to Overview.
- Added narrow/wide mobile screenshots for both dice menus to the preview artifact.
- Enabled an explicitly labelled Dice preview APK from this branch, with source commit in release notes and no change to the main branch.

## Validation
- JavaScript and TypeScript checks passed.
- All 10 unit tests passed.
- Production web build passed.
- GitHub Actions browser checks passed at 320, 360, 393, 430 and 852 pixels, including first-visit Dice navigation, roll rerenders and return to Overview.
- Final preview run: https://github.com/hwemp/Oathkeeper-App/actions/runs/42867521637 (source 055d289b25aae03e4d24b5d095deca7688f6a592).
- Reviewed final official/unofficial phone screenshots and result controls. The full Dice plaque and background are visible. Full-page capture itself shifted horizontal navigation; normal viewport screenshots now assert navigation remains in bounds after capture.
- Screenshots: https://github.com/hwemp/Oathkeeper-App/actions/runs/42867521637/artifacts/13787647918
- APK build 23 succeeded, including signature/package verification: https://github.com/hwemp/Oathkeeper-App/actions/runs/42866771698.
- Download: https://github.com/hwemp/Oathkeeper-App/releases/download/android-test-23-1/Oathkeeper-Android-Test.apk
- APK packaged web bundle matches the locally tested production build byte for byte; checksum verified. App source is unchanged by the later screenshot-only commits.
- Automated browser checks are not physical Android device testing.
- Documentation and screenshot-only script checkpoints do not rebuild the APK.

## Resume after interruption
1. All completed source, browser checks and preview APK work is saved on this branch.
2. Review the phone screenshots and build 23 on an Android device. Export character data before installing; debug signing keys can differ between builds.
3. Keep PR #5 as a draft until the visual preview is approved, then merge and build the main app.
4. Online community services remain a separate dependency; this checkpoint does not activate hosting, email or SMS.
