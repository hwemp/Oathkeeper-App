# Oathkeeper's ten FREE launcher icons

## Selected options
1 Moonlit Citadel; 2 Ember Dragon; 4 Lionheart Shield; 5 Shadow Mage;
6 Arcane Chalice; 7 Twin Battleaxes; 8 Astral D20; 11 Crystal Spires;
12 Steel Sentinel; 14 Sapphire Worldtree.

The existing Android `ic_launcher` and iOS primary `AppIcon` are never
replaced in source. Fresh installations still use the original icon.
Users may choose one of ten free icon designs in Store > App Icons,
tap **Apply Icon**, and tap **Restore Original Icon** at any time.

The alternative icon graphics are newly composed from Oathkeeper's
existing, separately bundled fantasy scenery and corresponding motifs.
They follow the approved selection themes, but are not pixel-for-pixel
copies of the original numbered mockup montage.

## Native integration
- Android: one default LAUNCHER `activity-alias` and ten disabled alternates;
  the allowlisted Capacitor plugin enables the requested alias before disabling
  the others, with `DONT_KILL_APP`.
- iOS: ten `AppIcon-XX.appiconset` assets and
  `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES`, registered in both
  Debug and Release. The plugin calls Apple's supported
  `setAlternateIconName` API, including `nil` to restore original.
- Web preview: ten distinct `/art/store-icons/icon-XX.webp` assets,
  immediate previews and a gold theme selection outline. Native Apply is
  unavailable in a browser and never falsely claims to change the icon.
- No purchase or unlock is required for icons; dice remain $1.00 each,
  backgrounds $0.50 each, both with checkout disabled.

## Generating assets
Run `python -m pip install Pillow` then
`python Oathkeeper/scripts/generate-free-icons.py` from repository root.

The script reads existing background artwork, writes each preview WebP,
an Android launcher PNG in `mipmap-nodpi`, and an iOS 1024-pixel app-icon PNG.
The asset workflow also automatically commits generated outputs to main,
and the Android build workflow generates them before checks/compilation.

## Verification
- JavaScript and integrated store tests validate selection and browser safety.
- Android manifest and bridge tests check all aliases and allowlists.
- iOS tests check Xcode configuration, icon-set metadata and native methods.
- The GitHub APK build compiles Android and verifies its APK signature.
- iOS still requires a macOS/Xcode build and physical iPhone/iPad or
  TestFlight verification. Android launcher cache and installed-device
  behavior likewise require device testing across launchers.

For Apple's configuration guidance:
https://developer.apple.com/documentation/xcode/configuring-your-app-to-use-alternate-app-icons
\n## Corrected individual mockups and source-to-launcher parity (Nov 11, 2026)\n\nThe 10 approved source pictures are `web/public/art/store-icons/icon-XX.webp`. Several had fragments from neighboring concept tiles or labels. `generate-free-icons.py` now trims each source with its own crop, creates a separate `launcher-XX.webp` (no repeated picture), and uses that same cleaned image to compose the Android adaptive/legacy and iOS launcher icons. The web store catalog displays `launcher-XX.webp`, so each option's preview is the same design the phone applies. The original Android and iOS primary icons remain untouched. Android adaptive launcher masks can still differ between OEMs and must be checked on a device.\n
## Build 143 — store-source icon parity

Old secondary launcher WebP copies and the Android alternate PNG reservoir have been deleted.
The Android launcher now packages the SAME WebP file bytes as the icon displayed by the in-app Store.
Each adaptive-icon XML points at that exact WebP image and a transparent foreground.
The Build 143 workflow verifies parity with a byte comparison; it retains the previously approved store and dice web payload.
iOS alternate icons remain PNG images generated directly from the same Store source because iOS requires PNG.
The original default launcher artwork is preserved.

Android/Samsung launcher masks can trim the edges of a square image, and launcher caches may delay visible updates.
Byte-for-byte asset parity does not guarantee identical OS-masked launcher pixels. Physical-device testing remains necessary.

## Build 144 — Android adaptive resource reference correction

Android adaptive launcher XML now references a uniquely named WebP in `drawable-nodpi`, avoiding a resource name collision with the same-name adaptive XML in `mipmap-anydpi-v26`. The legacy WebP in `mipmap-nodpi` and adaptive background WebP are exact byte-for-byte copies of the same Store art master; no second artwork rendering is performed. The new test confirms all three mappings and checks for self-referential XML. Build 143 remains archived as an earlier build; use Build 144 for device testing.
