# Oathkeeper engineering reference — read before making APK changes

Reviewed: 2026-11-11 (America/Chicago). Scope: project-specific research, verified repository facts, and regression-prevention procedures. This is a **reference**, not a claim that any proposed new tests or fixes have been implemented.

## Priority 0: user's approval outranks cosmetic redesigns

- Oathkeeper APK **Build 144** is the protected **visual and behavioral template**. This means the **installed 144 APK**, not just its Git commit or the simpler Vite source.
- Keep the approved 144 release and official branch untouched. All experiments require a separately named `TEST-BRANCH-<number>` and separate Android application ID.
- Preserve original art bytes, high-quality thumbnails/previews, the ornate store header, navigation, gold highlights, tile dimensions, bundle artwork and page composition unless user explicitly requests a specific change.
- **Do not rewrite or replace the dice animation.** Each selected skin affects visual materials/textures/colors only. Preserve original animation geometry, timing, rolls, probabilities, D100 faces and game logic.
- Make one isolated change at a time. A newer build is not an improvement unless device-side checks establish that it did not regress any existing screen or workflow.
- Do not enable purchases; the test store is not a working checkout system.

## Repository-specific facts verified

- Repository: `hwemp/Oathkeeper-App`.
- Build 144 release tag: `oathkeeper-build144-1-1` (base commit `5cc05acf9c179f556cfb32792c2690759ca7e860`).
- TEST 159 release was made from `86e268cb27b0361e53fee29f4550c8c79c37166b`.
- **Root cause of major 159 UI regression:** `.github/workflows/build144-apk.yml` rebuilt Vite *and then replaced* `dist/` with a SHA-256-verified `.build142/payload.part*.bin` archive. The TEST 159 workflow directly packaged newly built Vite output without that archive. Source sharing the 144 commit did **not** preserve its exact packaged interface.
- Archive digest documented in workflow: `c83a657ab68b900b724b75c45b6d5d2256e69192a1d62e922279422fb0fb0b05`.
- `TEST-BRANCH-160` restores the 144 frozen archive in its build and uses isolated `com.harrisonwaters.oathkeeper.test160` debug app identity. It is a **baseline restoration**, not completion of other requested fixes.
- Current source `Oathkeeper/web/dice-tabletop.js` draws live 3D-style dice with canvas, includes true D100 mesh face generation, and takes a selected skin parameter. `Oathkeeper/web/dice.js` uses `crypto.getRandomValues` and rejection sampling, not paint assets, to determine results. There are tests in `Oathkeeper/tests/d20-face-materials.test.mjs` and `rules-engine.test.mjs`. The frozen 144 runtime may differ from the current source; always inspect the packaged runtime before editing.
- Native alternate launcher icons use `OathkeeperIconPlugin.java`, `AndroidManifest.xml` activity aliases, and native `mipmap` resources generated from `web/public/art/store-icons/`. Their encoded art can match the store while Android's adaptive **mask and launcher cache** still affect their home-screen appearance.
- Background master files available in the *source* are small previews (~508×360 in prior project documentation); scaling them up is not a true resolution improvement. Treat the approved frozen asset archive as a separate source of truth; do not assume photo masters exist in the source tree.
- Paid store checkout is presently disabled, and no purchase/entitlement logic should be enabled during visual repairs.
- Previous changes to 159 introduced three-column mobile grids, off-template bundle layout and different header/preview. Avoid those changes unless the user explicitly approves them.

## The seven check-gates for every future change

### 1. Specify the exact requested change and forbidden collateral changes

Record: original screen/component, desired difference, unchanged controls, exact visual reference, test ID. If a change touches unrelated code/assets, flag it for inspection.

### 2. Determine the actual packaged baseline before editing

Inspect the Build 144 APK/release, current test APK, actual `assets/public/` entries, frozen payload SHA-256, and build workflow. A source-code unit test cannot establish that a different frozen web app was packaged. For any new build, produce a deterministic asset manifest of archived and packaged files and compare fingerprints. Confirm which files Vite compiled and which files Capacitor copied.

### 3. Protect the dice algorithm separately from its cosmetics

Do not modify `dice.js` RNG and rules engine to change visuals. Verify selected skin maps to exact render materials while same simulation, geometry, face count, result mapping and probabilities remain. For any theme, test D4/D6/D8/D10/D12/D20/D100 selected skins; confirm 100 actual faces for D100, not an enlarged D20. Preview-only sample results must never contaminate game result history.

### 4. Verify artwork as bytes, dimensions, and real appearance

Confirm source images are present, identical hashes when preservation is required, intrinsic pixel dimensions, alpha/channel details, image format, cropping and CSS `object-fit`. Do not silently substitute thumbnails or SVG wrappers around low-resolution images, invent higher-definition assets, crop to improve apparent scale, apply lossy conversions or overlap title text. In-store launcher sample should derive from native icon source, not a visually similar copy.

### 5. Use visual regression tests in addition to unit tests

Capture approved screenshot baselines of each page (Dice Sets, Backgrounds, App Icons, Bundles, selected image previews, 3D dice animation paused at deterministic capture frames, top and bottom navigation). Compare using a stable OS/browser/device viewport; dynamic animation or clocks must be fixed/ignored for reproducibility. Check:
- frame boundaries/glow aligned; no radio circles/checkmarks, clipped artwork, off-center placement or overflowing text
- five-column approved collection when applicable; typography and fantasy header fidelity
- both bundle cards, prices, selection counts, and readable titles
- background previews using real master quality and source-consistent aspect ratio
- app icon artwork on Samsung/Android launcher vs in-store preview
- dice animation starts, replays, displays the chosen skin and completes
- scroll, taps, navigation and accessibility with text scaling

Playwright can implement screenshot comparisons in stable browser environments; real Android device visual checks are still required. Such screenshot tests are **recommendations, not yet present in this repo**.

### 6. Protect Android package and build provenance

Verify Gradle task succeeded, APK is signed (`apksigner`), APK package ID is the isolated test ID, and APK contains required frozen files. Retain Build 144 asset hashes and per-build SHA256SUMS. Tag each test release and link the GitHub Actions run. Do not reuse a stale APK URL or claim that source changes reached the installed APK until confirmed by APK contents. Prefer least-privilege GitHub Actions permissions, pin third-party actions to verified commits, and consider provenance attestations. Never delete approved releases or user data to fix a failed test build.

### 7. Test actual behavior before approval or promotion

Automated checks: `npm run check`, `npm run typecheck`, `npm test`, `npm run catalog`, packaging/hash checks, Gradle assemble and signing. Then launch and inspect the test APK on real hardware. Test alternate icon selection and restoration, previews, selected skins, persistent saved state, background selection, and navigation. Never claim all regressions are fixed from green unit tests alone. Promote to official app **only when the user explicitly approves**.

## Areas to keep on the radar as the app expands

1. **D&D rules and character formulas.** Use an explicitly selected rules edition. SRD 5.1 and SRD 5.2.1 describe different mechanics; never silently mix 2014 and 2024 content. Trace dependent values through strength, carry weight, size, items, multipliers, spell upgrades, healing/damage, inventory and history. Use only appropriately licensed game content.
2. **Billing and ownership.** If purchasing is explicitly approved in the future: verify purchase tokens server-side, grant verified entitlements exactly once, handle pending, refunds, restore and acknowledgement; never unlock for a button press alone. Keep no real transactions in debug tests.
3. **Device data.** Test updates do not guarantee shared app data when application IDs differ. Save/restore character and settings safely; avoid destructive migrations.
4. **Screen density/accessibility.** Responsive breakpoints and font scaling can produce hidden text, inconsistent icon padding, cut-off thumbnails and accidental taps even when desktop tests pass.
5. **Animation smoothness.** Frame-time-based animation and device performance should be measured. Do not alter proven animation behavior in pursuit of perceived polish.
6. **Security/reproducibility.** Lock dependency versions via lockfiles, review license provenance, build the exact reviewed commit, minimize GitHub workflow permissions, run tests against what is actually packaged, and preserve known-good artifacts.

## Authoritative research links (checked 2026-11-11)

- Capacitor CLI v8 and synchronization: https://capacitorjs.com/docs/cli
- Capacitor Android runtime: https://capacitorjs.com/docs/android
- Vite public assets copied unchanged: https://vite.dev/guide/assets.html
- Android adaptive icons, safe zone and launcher masks: https://developer.android.com/develop/ui/compose/system/icon_design_adaptive
- Android app test fundamentals: https://developer.android.com/training/testing/fundamentals
- Playwright visual snapshots and environment caveats: https://playwright.dev/docs/test-snapshots
- GitHub Actions secure-use: https://docs.github.com/en/actions/reference/security/secure-use
- GitHub artifact attestations: https://docs.github.com/en/actions/how-tos/secure-your-work/use-artifact-attestations/use-artifact-attestations
- Play Billing security/entitlement verification: https://developer.android.com/google/play/billing/security
- Official D&D SRD 5.1/5.2.1 and licensing: https://www.dndbeyond.com/srd

## Maintenance rule

This is a durable project guide for future coding sessions, **not model training**. Reopen it before modifications, recheck external API documentation for currency, inspect the target GitHub source and APK, and do not presume implementation of proposals. The user should not need to know how to code to demand a successful, non-regressing result.
