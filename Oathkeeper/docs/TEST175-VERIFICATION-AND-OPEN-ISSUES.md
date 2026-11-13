# Oathkeeper — Test 175 evidence and remaining release blockers
Date: 2026-11-13. Baseline protected: Build 144. Experimental Android ID: `com.harrisonwaters.oathkeeper.test175`.
Scope: TEST APK, NOT release readiness and NOT approval to replace Build 144.

## Verified on the exact signed Test 175 APK
- Android package compile, debug signing, zip contents, original Store rolling animation checksum, approved icon-resource mapping and original 10 illustrated backgrounds: pass, Actions run https://github.com/hwemp/Oathkeeper-App/actions/runs/43420350207 (the compile stage produced the signed APK artifact).
- APK SHA256: `d169a59ed0fff7afd42a5ac78cf7711a21411b4757c6f29e453f5d51f6899115`.
- Browser regression for original Store pages, dice, six live gemstone shapes, 222 button text bounds and icon byte parity: pass, https://github.com/hwemp/Oathkeeper-App/actions/runs/43420074956.
- Initial age and conditions panel: BOTH Accept and Reject inside the opening viewport without scrolling at 360×780, 393×852, 412×915; all full conditions remain scrollable; mandatory age gate unchanged. Pass https://github.com/hwemp/Oathkeeper-App/actions/runs/43420113701.
- Independent Android 15 emulator: original native device resolution retained; APK installed; actual Oathkeeper consent UI visibly rendered on 1080×2400 screenshot (first painted on sample attempt 2), 437 sampled warm-gold content pixels; no OS error dialog, fatal exception or System UI ANR; 10 icon component aliases enable and disable from app UID; original launcher alias restored. **Pass** https://github.com/hwemp/Oathkeeper-App/actions/runs/43422923335.
- Critically, earlier `43421743266` reported green even though the screen was black; that test is superseded and must NEVER be used as visual acceptance. The corrected verifier `scripts/verify-visible-android-apk.sh` rejects black WebViews and waits for real painted content, not just a nonempty PNG.

## Known unresolved release blockers (DO NOT CLAIM FIXED)
1. The Store's baked header/footer/category artwork includes purple old-shape gemstones; changing the applied background color to emerald does NOT recolor or standardize those baked gems. Source decomposition and visually faithful rendering are still needed; do not use broad hue filters or occluding overlays that degrade approved illustrations.
2. The original 10 richly illustrated backgrounds are 508×360-pixel WebP masters. They are preserved **byte-for-byte**, but genuinely higher-resolution faithful masters have not been sourced or generated. The previous flat 1600px vector redraws were rejected for visual quality and are NOT in the chosen runtime.
3. No physical Samsung launcher screenshot / Android OEM adaptive-icon mask inspection has been performed, so master byte parity and alias enablement do not establish exact final home-screen appearance on the user's phone.
4. Whole-app navigation/Store baked footer uniformity and all purchase flows are NOT certified by this browser/native smoke suite. In-app icon **selection** UI has browser checks; native alias toggling does not simulate all real taps.

## Rules for next changes
Never overwrite Build 144; use sequential test numbers, preserve original rolling GIF and its animation. Never publish a fully approved replacement until remaining image/Store/nav defects have been repaired and evidence reviewed. Do not substitute a passing compiler checksum for actual Android UI visual acceptance.
