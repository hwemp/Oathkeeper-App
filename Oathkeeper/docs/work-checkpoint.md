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
- Local browser launch is blocked by the workspace's socket restrictions; the GitHub Actions browser workflow will perform the expanded layout checks and capture screenshots.

## Resume after interruption
1. Check the latest Render approved UI preview and Build Android APK runs for this branch.
2. If preview checks fail, inspect job logs, fix the issue and push again.
3. Inspect official/unofficial screenshots, including 320px and 430px widths.
4. Share the Dice preview APK release and preview artifact. Do not claim physical-device testing.
5. Keep PR #5 as a draft until the preview is approved, then merge and build the main app.
