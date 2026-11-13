# Oathkeeper — Approved Development Foundation: Test 178

**Decision:** Owner approved TEST-BRANCH-178 to **replace Build 144 as the active foundation for all future UI and APK development** on 2026-11-13.

This is a development-baseline promotion, **not** a claim of app-store compliance, completed in-app billing, legal clearance, or signed production release.

## Exact approved source and APK

- Fixed, approved source branch: [OATHKEEPER-APPROVED-BASELINE-178](https://github.com/hwemp/Oathkeeper-App/tree/OATHKEEPER-APPROVED-BASELINE-178).
- Verified immutable reference commit: `ec24dfe1e2a28fd955e11aab018bb58ed3b99e3c`.
- Original test implementation: `TEST-BRANCH-178`; use this for historical QA/build files.
- Active collaborative development branch: `OATHKEEPER-VISUAL-WORKBENCH` (fast-forwarded to Test 178's source before this document).
- Historical workbench rollback: `OATHKEEPER-WORKBENCH-PRE178` at `12643cfb1584cb08bdbaa1f00be127fef0bc8306`.
- Earlier Build 144 remains archived/available as historical rollback reference, **not** the foundation to restore for new iterations.
- Successful GitHub Actions run: [#43450890593](https://github.com/hwemp/Oathkeeper-App/actions/runs/43450890593), concluded success 2026-11-13.
- Exact approved APK: `Oathkeeper-TEST-BRANCH-178.apk`, debug-signed, test package ID `com.harrisonwaters.oathkeeper.test178`, 79,042,000 bytes.
- APK SHA-256: `0930210d1813bef0a47cbedab4c9269abcb4bbf4ae8271ec56e1bfef345f8477`.
- Originating GitHub Actions artifact: `Oathkeeper-TEST-BRANCH-178`, artifact ID `14051656520`. Actions artifacts expire; the release workflow is intended to publish this exact test artifact as an explicitly labeled prerelease.

## Locked UI/visual regressions policy for Test 179 onward

1. Start all new test branches from **the exact approved 178 foundation** or a verified descendant, not Build 144, 159, or any earlier test; use sequential Test 179, 180, etc.
2. Preserve accepted high-resolution images, ornamented gold frames, existing store art, theme-matched gemstones and backgrounds, and approved bottom navigation arrangement. Do not replace approved art with simplified redraws.
3. Store dice must match the frozen, original selected Store dice GIF artwork and palette. The Store must not silently substitute a new dice-rendering engine. Gameplay geometry may be improved separately without altering the approved Store 12-frame animation.
4. Preserve corrected tight frame fit for each dice image; no visible internal square GIF edges, unwanted black borders, or undersized previews.
5. Retain exactly one **top gemstone** for applicable ornate navigation buttons. The **middle Community footer button** keeps its intentionally centered ornament; do not duplicate gemstones on other footer buttons.
6. Theme colors follow the selected background (e.g. sapphire with blue, emerald with green) without recoloring the approved artwork or ornamental gold.
7. Preserve launcher icons as the authoritative source and require the Store icons to match the launcher icon resources precisely. Do not regenerate a competing icon reservoir.
8. Test visual screenshots, functional navigation, Store previews/rolls, theme changes, accessible labels, startup, install, and regression checks before labeling each new APK ready. Keep test builds isolated until approved.

## Verification limits and next steps

The original Test 178 workflow passed all primary CI steps and produced a debug-signed APK plus Android 15 automated execution evidence. CI success confirms build/test checks; **it does not establish that every screen has been visually accepted on a physical phone**. Do not claim a Play Store or iOS release is ready without additional native QA, compliance, developer-account, and signing work. The separate compliance audit PR #18 must remain distinct from this visual baseline.

**IMPORTANT:** Because Test 178 uses `com.harrisonwaters.oathkeeper.test178`, it may install beside other test builds rather than updating a differently packaged Build 144 in place. Preserving user data and signing identity requires a deliberate migration/release plan.
