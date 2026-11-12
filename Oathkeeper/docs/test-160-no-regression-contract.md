# TEST BRANCH 160 — no-regression recovery contract

## Immutable user-approved baseline
The actual **Oathkeeper Build 144** APK, created from commit `5cc05acf9c179f556cfb32792c2690759ca7e860` and release `oathkeeper-build144-1-1`, is the visual and behavioral master. The source commit alone is **not** the final UI: the Build 144 workflow replaces `dist/` with verified, preserved `.build142/payload.part*.bin` web assets before packaging.

## Diagnosed TEST 159 regression
TEST 159 compiled `npm run build` directly and explicitly **did not** reapply the frozen approved web-asset archive. That substituted a different store design (plain header, three-column cards, broken bundle typography, different previews). TEST 159 cannot be treated as the 144 visual baseline.

## Mandatory constraints
- Preserve approved Build 144 store header artwork, ornate navigation, images, gold frames, page layout, tile size, and Golden Coffer / Dragon's Treasure art.
- Preserve the original dice 3D roll engine, animation, faces, physics, sample preview behavior, and game-roll RNG. Only a user-selected dice *skin* should affect appearance, never movement or probability.
- Preserve all store artwork at its existing encoded source quality. No auto-upscaling, lossy recompression, artificial re-rendering, CSS zoom crop, alternative placeholder imagery, or replacement images.
- App Store icon thumbnail and Android launcher artwork must use the same image master. Android system adaptive icon masks can still modify the outer silhouette.
- Keep selected golden glow strictly aligned with the selected tile frame; avoid circles, check marks, and off-frame overlays.
- Preserve 5-column thumbnail layout from the installed 144 on appropriately sized mobile screens unless an explicit user-approved change is made.
- Fix clipping, centering, background previews, and pricing issues *without changing any unrelated pages*.
- Maintain the original official app, the Build 144 release, existing TEST 159, and main. All work and APK releases are isolated in `TEST-BRANCH-160` until user approval.

## First-phase acceptance gate
Rebuild Build 144's *actual frozen web assets*, including the historic store art, exact selected skin previews and animation, with no content modifications. Only change the debug APK's Android application ID to `com.harrisonwaters.oathkeeper.test160` so it installs separately.

After this zero-regression baseline is installed and visually approved, patch only isolated defects in the preserved archive, with reproducible validations against the exact baseline. Do not claim later fixes are complete until they are implemented and tested on a device.
