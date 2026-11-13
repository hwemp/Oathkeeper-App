# Oathkeeper — one source of truth per visual feature

Status: WORKBENCH / AUTOMATED QA; user explicitly authorized execution without step-by-step approvals. Retain protected Build 144 and original release. Test 172 is superseded due lower-quality vector Store background art. TEST 173 restores the approved illustrated backgrounds and has a separate isolated Android identity.

## Mandatory process

1. Identify the authoritative UI asset, data model, renderer, and all duplicate legacy paths for the feature BEFORE editing it.
2. Fix the authoritative source rather than layering additional temporary CSS overrides on obsolete styles or image layers.
3. After the replacement is verified, retire superseded selectors and resource references. Never delete validated gameplay logic to fix artwork.
4. Confirm all affected screens refer to the same current approved resources. For App Icons this includes Store tile, selected enlarged preview and actual Android launcher resource.
5. Test images, computed styles, button text bounding boxes and selected/unselected states in browser captures at 360, 393 and 412 CSS pixels; verify proper Android safe-area spacing.
6. Run the non-APK read-only source audit at scripts/audit-workbench-source-alignment.mjs. Its strict mode must block release while old/conflicting paths remain.
7. Present before/after screenshots and functional test evidence. On Nov 12, 2026 the user granted standing authorization to proceed with forward repairs, fixes and touch-ups without requesting separate permission at each stage. This is authorization to work, NOT visual approval. Keep visual acceptance explicitly unverified until the user reviews the previews or APK; never infer it from tests.
8. Per user's Nov 12 instruction, individual visual approval is no longer a prerequisite to executing work or preparing a test APK. Run source, screenshot, browser and Android package verification first; publish separately numbered isolated TEST APK builds. This authorizes tests, NOT overwriting the approved Build 144 release. Keep any known visual regressions explicitly disclosed and do not promote a defective build.

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
2. Button fonts fit frame — **PREVIOUS BROWSER AUDIT PASSED, BUT VISUAL REGRESSION FOUND AND NEEDS RECHECK**. Browser-only run https://github.com/hwemp/Oathkeeper-App/actions/runs/43352985797 PASS: 222 measured ornate-button labels on 360/393/412 px screens, 0 violations; the long DM `Manage player stats & initiative` label now wraps to two legible lines at 13.5px. Retired conflicting TEST 164/169 button selectors; retained gold SVG artwork and control behaviors. Screenshots: artifact `OATHKEEPER-WORKBENCH-BUTTON-TEXT-PREVIEWS-NO-APK`, see `button-text-menu-393.png`, `button-text-dm-393.png`, `button-text-journal-393.png`. NO APK. Standing user authorization permits proceeding to gemstone issue #3 while retaining button visual acceptance as unverified.
3. Single approved faceted gemstone design — IN PROGRESS, NOT COMPLETE. First canonical gemstone audit PASS in run https://github.com/hwemp/Oathkeeper-App/actions/runs/43367647947. Six standalone gemstone SVGs are now generated from the exact TEST 170 master facet paths (also byte-geometry-checked against TEST 171 tabletop); browsing unowned Store scenes no longer changes applied-theme gems. IMPORTANT UNRESOLVED: the original baked Store banners, category decoration and bottom navigation still visibly contain old noncanonical gemstone artwork and may remain purple even with an applied emerald theme. Those illustrated layers need careful review before issue #3 is considered complete. Screenshots artifact: OATHKEEPER-WORKBENCH-GEMS-NO-APK. No APK.
4. Unique high-definition backgrounds properly inside frames — pending.
5. Consistent navigation/interface icon family — pending.
6. Android safe area and text-overlap verification — pending.
7. Real 3D gameplay dice and matching actual faces — pending.

A successful build or asset checksum does not count as user visual approval.

## Additional source-screen discrepancy found in manual screenshot review

The visual menu screenshot has glyphs (notably Edit Equipment) extending beyond the visible painted gold plaque, despite the earlier 222-label audit's zero violations. Root cause to verify before approval: the SVG retains its native 420x260 viewBox aspect ratio when used as a CSS background in much wider and shorter buttons, so the visible plaque can be letterboxed inside the full HTML hit area. Bounding the text by the full HTML button rectangle is not equivalent to bounding it by the painted plaque. Update the font audit to use the effective painted SVG rectangle, and repair the live font fit without changing the approved gold frame art. This is a regression checkpoint; do not call #2 visually complete based on the old numeric audit.

## Nov 12–13 automated integration and source protection record

- Gold-frame fitting: successful GitHub Actions run [43369851203](https://github.com/hwemp/Oathkeeper-App/actions/runs/43369851203) verifies 222 actual painted-frame label boxes, 0 overlaps at 360/393/412px; original test falsely checked entire HTML hit targets.
- Launcher icon parity: 10/10 master/Store selected previews byte-verified in merged full audit [43370934194](https://github.com/hwemp/Oathkeeper-App/actions/runs/43370934194).
- Canonical six gems: master-derived facet geometry on the live button controls verified; Store baked artwork still has older noncanonical jewels and remains an admitted cosmetic discrepancy.
- Gameplay: real 3D numbered-face canvas geometry through the protected source renderer, true D100 100 distinct mesh faces; original GIF is unchanged and gameplay RNG/roll values are provided by original game engine. 393px browser screenshot and result checks passed in [43370934194](https://github.com/hwemp/Oathkeeper-App/actions/runs/43370934194). Physical Android validation remains to be done.
- **Background art regression caught in actual screenshots despite passing numerical pixel-size tests.** Previous 1600px vector scenes were flat concept illustrations, visually inferior to the original rich WebPs. Removed them from the live Store and reinstated all 10 byte-identical original illustrated WebP masters, with proportional preview composition rather than stretched or flat redrawing. Do not claim a 1600px original from these 508x360 illustrations. Truly higher-resolution faithful masters are not yet verified or available. This finding supersedes Test 172; Test 173 is the corrected, isolated build.
- Navigation consistency across all baked Store art, Android safe-area validation on real device, and fidelity of any proposed true-HD replacement artwork remain open checks. The user waived intermediate approvals, not the requirement to disclose unresolved technical work.
- Do not delete the protected approved release, original dice Store GIF, launcher art masters, source dice logic, character save history, pricing gate or legal age restrictions.
