# TEST BRANCH 159 — Build 144 source recovery
Base commit: 5cc05acf9c179f556cfb32792c2690759ca7e860
Baseline: Build 144 original image assets, catalogs, store items, styles, character calculations and Android native launcher generation.
Applied: restored store 3D dice preview with fixed sample and selected skin; dice-page animation default/restoration; mobile tiles show 3/2 across instead of 5 tiny thumbnails; background framing corrected to 508:360; golden selection border aligned with tile frame; APK debug app ID isolated as com.harrisonwaters.oathkeeper.test159.
Packaging: uses npm build output, not the old Build 142 ZIP that the Build 144 workflow overlaid after compilation.
Protected: official main branch, approved 144 tag/art resources, approved 158 APK, all pricing/product permissions, real dice RNG, gameplay calculations.
QA: npm check, typecheck, regression tests, catalog, Android Gradle assemble, signed package and package ID check in GitHub Actions.
Limitations: artwork remains original Build 144 source quality; there is no verified upscaled replacement of background masters. Android launcher masks may change the icon outline. Checkout is not enabled. Device-side visual verification remains required.
