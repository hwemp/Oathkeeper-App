# Oathkeeper pre-billing checklist

## Already configured

- 10 individual dice designs: target **$1.00 USD each**
- 10 individual background designs: target **$0.50 USD each**
- 10 alternative launcher icons: **FREE** (no store purchase required)
- Distinct in-app preview art and selected icon application
- Stable one-time/non-consumable product IDs
- Import-ready catalog JSON and CSV generated from source
- Paid ownership is checked against the native billing bridge, never user-edited
  character data or a localStorage flag
- Apply/restore cosmetic selection only when purchase is verified
- Paid checkout remains disabled until correctly configured

## Requires developer account / billing work

1. Register and approve the Android app in Google Play Console and iOS app
   in App Store Connect; set up app signing/distribution.
2. Create 20 one-time, non-consumable products with IDs and titles in
   `store-catalog/products.csv`. Apple and Google prices are configured
   in their consoles, not through this CSV. The actual localized price
   shown at checkout must come from the platform product details.
3. Confirm availability of the requested USD **$0.50** price point.
   Do not substitute $1.50 or silently change the configured price.
4. Set up the required purchase verification and Google Play
   acknowledgement server. Do not deliver purchases still PENDING or
   whose verification failed. Handle refunds and revocations.
5. Only when validation is complete, enable checkout via reviewed
   app configuration, not remote/user-editable local flags.
6. Test sandbox purchases, cancellations, pending states, restoration,
   updated app versions and offline usage on real devices.
7. Publish via Apple/Google review and disclose privacy/data-use
   obligations. No releases or fees have been paid through this code.

## Notes
Apple StoreKit verifies signed non-consumable entitlements. Google's
recommended purchase flow verifies server-side before granting entitlements,
then acknowledges within the required period.

Links:
- https://developer.apple.com/documentation/storekit/in-app-purchase
- https://developer.android.com/google/play/billing/integrate

## iOS purchases can be prototyped without an Apple account

The repository includes `ios/App/LocalStoreProducts.storekit`, containing
all 20 non-consumable products at **$1.00** / **$0.50**. This file is a local
Xcode testing fixture, **not real billing**. To test on a Mac, open the
Oathkeeper Xcode project, choose the App scheme's **Edit Scheme > Run >
Options**, and select `LocalStoreProducts.storekit` for StoreKit
Configuration. Xcode substitutes locally generated transactions. Remove this
configuration from the scheme before real App Store distribution.

The main app intentionally keeps Purchase disabled in production/test APKs.
No application-store developer account or payment connection is activated by
this fixture. Product metadata must be entered into App Store Connect and
Google Play Console when the owner is ready.

Apple reference:
https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode
