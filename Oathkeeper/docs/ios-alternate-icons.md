# iOS alternate app icons — native bridge prepared (not yet activated)

The iOS Capacitor app now registers `OathkeeperIconPlugin` using
`OathkeeperViewController`. The Swift bridge reads the active iOS app icon
and can restore the *original* app icon with Apple's
`UIApplication.shared.setAlternateIconName(nil)`.

**Do not present this as a finished alternate-icon feature.** The
preview/gallery, distinct icon assets and native selection are not connected
to native icon changes. The user approved icon concepts numbered
**1, 2, 4, 5, 6, 7, 8, 11, 12, 14**. All ten are **FREE**; no individual iOS-ready images for
those ten selections are in the repository.

## Ready

- Primary `AppIcon` remains unchanged and is still the default on install.
- Native bridge is registered in the storyboard's view controller.
- `getState` reports whether iOS supports alternate icons and which icon is
  active.
- `restoreDefault` safely restores `AppIcon` if an alternate was active.
- iOS-only JavaScript wrapper handles unsupported platforms gracefully.
- These alternate icons are free; changing the launcher icon is not yet exposed until their individual native assets are bundled.

## To finish with the ten chosen icons

1. Export each approved concept as its *own* high-quality native icon artwork;
   the numbered mockup montage must **not** be used as an iOS icon file.
2. Create Xcode alternate app icon sets in
   `ios/App/App/Assets.xcassets`, keeping `AppIcon` as the primary icon.
   Suggested matching names: `AppIcon-01, AppIcon-02, AppIcon-04, AppIcon-05, AppIcon-06, AppIcon-07, AppIcon-08, AppIcon-11, AppIcon-12, AppIcon-14`.
   Include the appearance variants required by the target iOS SDK.
3. In Xcode App target's Asset Catalog Compiler settings, set
   `ASSETCATALOG_COMPILER_ALTERNATE_APPICON_NAMES` to the ten actual
   icon-set names. Xcode then generates `CFBundleAlternateIcons`.
   Do not hand-edit this key in Info.plist.
4. Register a native icon setter restricted to ten compiled icon-set names. No
   receipt, purchase, or paid entitlement should be required for these free icons.
5. Add `Apply Free Icon` and `Restore Original Icon` controls only when
   the artwork and native icon switch are ready.
6. Test on a real iPhone/iPad through Xcode and TestFlight, including icon
   application, cancellation, restoration, relaunch and app updates.
7. Keep background/dice payment checkout separate from free icon switching.

Official guidance:
https://developer.apple.com/documentation/xcode/configuring-your-app-to-use-alternate-app-icons
https://developer.apple.com/documentation/uikit/uiapplication/setalternateiconname(_:completionhandler:)
