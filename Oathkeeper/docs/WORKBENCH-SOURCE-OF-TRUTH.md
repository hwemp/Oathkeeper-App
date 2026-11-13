# Oathkeeper — one source of truth per visual feature

Status: WORKBENCH / NOT APPROVED / NO APK. Retain approved original release and TEST 171.

## Mandatory process

1. Identify the authoritative UI asset, data model, renderer, and all duplicate legacy paths for the feature BEFORE editing it.
2. Fix the authoritative source rather than layering additional temporary CSS overrides on obsolete styles or image layers.
3. After the replacement is verified, retire superseded selectors and resource references. Never delete validated gameplay logic to fix artwork.
4. Confirm all affected screens refer to the same current approved resources. For App Icons this includes Store tile, selected enlarged preview and actual Android launcher resource.
5. Test images, computed styles, button text bounding boxes and selected/unselected states in browser captures at 360, 393 and 412 CSS pixels; verify proper Android safe-area spacing.
6. Run the non-APK read-only source audit at scripts/audit-workbench-source-alignment.mjs. Its strict mode must block release while old/conflicting paths remain.
7. Present before/after screenshots and functional test evidence. On Nov 12, 2026 the user granted standing authorization to proceed with forward repairs, fixes and touch-ups without requesting separate permission at each stage. This is authorization to work, NOT visual approval. Keep visual acceptance explicitly unverified until the user reviews the previews or APK; never infer it from tests.
8. Only after ALL issues are approved, publish ONE new isolated APK for device testing. Never publish an APK from the active workbench before then.

## Sources of truth

| Feature | Authority | Verification |
|---|---|---|
| App Icons | Android drawable-nodpi/oathkeeper_icon_art_XX.webp | Store tile, enlarged preview and Android launcher must use same exact art for selected slug |
| Icon selection mapping | web/store-icon-catalog.js | One slug, one master; no old baked preview or unrelated thumbnail |
| Gold button frame | web/public/art/oath170-button-master.svg, subject to approval | One approved family, one sizing/safe-area policy |
| Faceted gemstone | same faceted master shape | Exact cut geometry on every control; selected theme changes only colors |
| Button font | final shared button style | Text completely inside center-safe area at every phone width |
| Backgrounds | unique new approved HD scene per slug | Proportional fit INSIDE gold frame, no stretched page image |
| Navigation icons | single approved icon family | Same artwork and selected treatment across screens |
| Dice Store showcase | archived approved roll GIF and themed WebP assets | Do not change to gameplay animation |
| Gameplay dice | separate true-3D numbered-face implementation | Final die face matches the secure result; no fixed-face sprite |
| Android layout | shared safe-area rules | Controls and content clear system bars |

## Existing conflict hotspots: NOT FIXED YET

- The frozen Store uses a baked page image with transparent clickable regions. The workbench icon-only repair now neutralizes the stale baked selected state, renders all ten thumbnails and enlarged previews from Android launcher masters, and corrects the icon-07/08 display-name mapping. Verified in browser-only GitHub Actions run 43322313829; automated browser verification passed; the user subsequently authorized advancing to the next repair, without a separate declaration of pixel-perfect visual acceptance.
- Workbench button typography repair now excludes TEST 164/169 legacy selector effects from current `.oath170-reference-button` controls, so the TEST 170 shared CSS/controller owns typography. Other unapproved visual differences (e.g., gemstone geometry, Store bottom navigation artwork) are retained separately for ledger entries #3/#5; final whole-app code consolidation still pending.
- TEST 169 has object-fit:fill for a baked background page. New backgrounds must use proper frame cropping/containment instead.
- TEST 171 is a tabletop-motion prototype, not the final full 3D accurate-face game roller.

## Repair ledger (one at a time)

1. Launcher App Icons tile vs selected preview vs Android icon — TECHNICAL CHECKS PASSED (10/10); user explicitly authorized continuing repairs on Nov 12, 2026, without separately confirming pixel-perfect visual acceptance. Evidence: https://github.com/hwemp/Oathkeeper-App/actions/runs/43322313829 (screenshots in OATHKEEPER-WORKBENCH-ICON-PREVIEWS-NO-APK). Do not count technical verification as final visual acceptance.
2. Button fonts fit frame — **TECHNICAL REPAIR COMPLETE; VISUAL ACCEPTANCE UNVERIFIED; STANDING AUTHORIZATION TO PROCEED**. Browser-only run https://github.com/hwemp/Oathkeeper-App/actions/runs/43352985797 PASS: 222 measured ornate-button labels on 360/393/412 px screens, 0 violations; the long DM `Manage player stats & initiative` label now wraps to two legible lines at 13.5px. Retired conflicting TEST 164/169 button selectors; retained gold SVG artwork and control behaviors. Screenshots: artifact `OATHKEEPER-WORKBENCH-BUTTON-TEXT-PREVIEWS-NO-APK`, see `button-text-menu-393.png`, `button-text-dm-393.png`, `button-text-journal-393.png`. NO APK. Standing user authorization permits proceeding to gemstone issue #3 while retaining button visual acceptance as unverified.
3. Single approved faceted gemstone design — IN PROGRESS. Source review identified that merely selecting a Store background preview could override the global gemstone theme, even without applying/owning the background. Corrected the theme source to derive from the applied background only in commit bf5598832f434c51ea2367f0c3d1fe4478e42c0d. Browser captures and selected/unselected theme tests still pending; no visual approval claimed.
4. Unique high-definition backgrounds properly inside frames — pending.
5. Consistent navigation/interface icon family — pending.
6. Android safe area and text-overlap verification — pending.
7. Real 3D gameplay dice and matching actual faces — pending.

A successful build or asset checksum does not count as user visual approval.