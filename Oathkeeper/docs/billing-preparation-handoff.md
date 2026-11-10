# Oathkeeper billing preparation — November 10, 2026

## Approved, but not activated
- Ten **non-consumable dice cosmetics** at proposed US price **$1.00** each.
- Ten **non-consumable backgrounds** at proposed US price **$0.50** each.
- Ten **free alternative app launcher icons** (concepts 1, 2, 4, 5, 6, 7, 8, 11, 12, 14); the original stays default and remains restorable.
- No store accounts, checkout, money collection, or paid services have been activated.

`store/paid-cosmetics-draft.json` is a planning manifest and **not** an import-ready Google Play or Apple upload. It contains all 20 fixed product IDs and the owner-approved USD prices. Display native localized prices once the app stores are configured; never promise a price point not available in the storefront.

## Important fix
Google Play identifiers permit only lowercase letters, digits, periods and underscores; hyphens are invalid. The draft product IDs were changed to use underscores (for example `oathkeeper.dice.gold_forged`). This change applies consistently to the web catalog and Android/iOS native allowlists. Since these products were only proposed and not yet registered in a store, this is safe. **Do not change product IDs after registering them in a storefront.**

## Remaining requirements before opening checkout
1. Create developer/merchant accounts, accept agreements and register each of the 20 non-consumables in Google Play Console and App Store Connect.
2. Verify local price availability; the requested $0.50 may require choosing a supported store tier; display the actual storefront-localized price, with any taxes, appropriately.
3. Provision a secure receipt/entitlement service for Android: verify purchase tokens with Google Play Developer API, account for pending purchases, refunds and revocations, and reliably acknowledge granted non-consumables. Never trust a flag, local storage, character import or the JS UI as evidence of payment.
4. For iOS, use StoreKit 2 verified transactions and restored entitlements, deliver content before finishing transactions, and thoroughly test refund/revocation, multi-device recovery and pending approval. If entitlements must synchronize across platforms, use an authenticated server mapping purchases to accounts.
5. Finish in-app Apply/Restore for **owned dice skins and backgrounds**, store purchase restoration from verified transactions and onboarding for both platforms. Free icon switching is separate and already wired natively.
6. Implement customer support/refund explanations, review age/parental purchase controls, privacy policy, security and store policy requirements. Test on physical Android and iOS devices, including offline, refund and failed-network scenarios.
7. Run CI and platform release builds; iOS requires macOS/Xcode/signing. Do not treat a successful debug APK as a public release.

Both web and native checkout are intentionally blocked in this preparation branch, even if storefront products become available. The Android bridge does not launch checkout, and the iOS bridge explicitly rejects purchase requests. That prevents an unintended charge until the whole fulfillment path has been tested and deliberately enabled.

Official references:
- https://support.google.com/googleplay/android-developer/answer/1153481
- https://developer.android.com/google/play/billing/integrate
- https://developer.apple.com/documentation/storekit/transaction
- https://developer.apple.com/help/app-store-connect/manage-in-app-purchases/set-a-price-for-an-in-app-purchase
