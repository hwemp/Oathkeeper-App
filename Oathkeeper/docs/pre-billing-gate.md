# Oathkeeper — pre-billing implementation and release gate
Updated: 2026-11-10. This checklist distinguishes code readiness from externally configured live payments. **Do not activate checkout from a pricing flag alone.**

## Built and code-verifiable before paying for accounts
- 10 approved fantasy dice cosmetics at planned USD $1.00 each and 10 backgrounds at planned USD $0.50 each; original app remains usable for free.
- 10 approved **free** alternative launcher icons with original-icon restore, no payment entitlement attached to icon switching.
- Independent art previews for each selected item, free previews, local visual state saved between visits.
- 20 unique non-consumable store SKU identifiers in the web manifest and Android/iOS allowlists; Play-compatible identifiers, with hyphens replaced by underscores. See `store/paid-cosmetics-draft.json`, `store-catalog/` generated files, and `ios/App/LocalStoreProducts.storekit`.
- A storefront-price display when available; fallback is clearly a **planned USD price**, not a confirmed purchase quote.
- UI ownership gates and cosmetic Apply/Restore Default for **verified** entitlements only. Character backups, local storage and store-preview selection are not valid proof of a purchase.
- iOS StoreKit 2 signed transaction entitlement checks and restore UI separate from new checkout. Android restore remains locked until an authenticated, trusted verification backend exists.
- Android Play Billing 9.1.0 catalog query plumbing and native stub; **no Android purchase path** or premature entitlement grant.
- Both native platforms and the web checkout remain intentionally blocked. Merely creating products in a storefront will not make payment buttons active.
- Local StoreKit test catalog and regression tests for ID parity, previews, default locks, and restoration logic.
- Existing app age/terms gate and offline tools remain in place. The unverified online community service stays disabled for minors and is **not** certified as guardian-consent compliant.

## Important unfinished items requiring external systems or real devices
| Owner / external requirement | Why it cannot be certified from this repository alone |
| --- | --- |
| Eligible Apple Developer / Google Play Console accounts and legal merchant details | Requires account holder's verification, agreements and platform enrollment; do not circumvent age restrictions |
| Register 20 non-consumable SKUs and configure localized prices | Must be done in developer consoles; confirm the requested $0.50 price is available and show actual displayed store price |
| Google Play secure purchase validation | Requires authenticated backend, Play Developer API permission and storage for purchase tokens, account binding, acknowledgment, renewals of verification, pending and refunded status |
| Production Apple purchase flow and App Store Connect configuration | iOS checkout is still disabled; current signed entitlement/restore code alone does not process new payments |
| Purchase restore, refund, dispute and cross-device test matrix | Verify on real signed builds with real testing accounts, connectivity faults and revoked purchases |
| Privacy, support, safety and account deletion | Publish working HTTPS privacy/support links, implement guardian age/consent backend before enabling restricted community, obtain legal review for actual operations and jurisdictions |
| Store-ready publishing | Signing certificates, bundle metadata, screenshots, review notes, compliant terms, approved release builds and app-store review are not done here |

## Purchase implementation order *after* a verified account/backend exist
1. Register the exact already-selected product IDs (never casually rename a published SKU), set real storefront prices, and test the catalog queries with test accounts.
2. Complete secure Android server verification before turning on `BillingClient.launchBillingFlow`. Bind each token to the authenticated user, query Google Play for `PURCHASED` status, record entitlements idempotently, and acknowledge after granting. Do **not** grant on `PENDING`, failed validation or client-supplied flags. Reconcile revocations/refunds.
3. Finish iOS transaction lifecycle using StoreKit 2 verified transactions, pending/cancelled cases, delivery, `finish()` timing, refund handling and restoration; do not ship a partially implemented purchase button.
4. If purchases must transfer between Play and Apple accounts, implement authenticated account linkage and platform-verified entitlements; stores do not automatically share them.
5. Test each purchase, restore, failed network, refund, cancellation, offline return, app reinstall and age/guardian purchase approval path on physical devices; then enable checkout in a separately reviewed release.
6. Audit account privacy and community moderation/consent paths independently before opening live communications.

## Payment methods
Mobile store digital cosmetic unlocks are generally governed by Play Billing / App Store in-app purchase rules. Do not activate parallel Cash App, PayPal, Venmo, bank transfer or custom gift-card checkout for these virtual goods without a platform- and storefront-specific legal/policy review. A separate user-selected method at checkout may already be supported by the platform payment account.

## Confirmable source of truth
- `web/store-pricing.js` currently has **checkoutEnabled:false** on all categories.
- `android/.../OathkeeperBillingPlugin.java` refuses to launch payment flow.
- `ios/App/App/OathkeeperBillingPlugin.swift` rejects purchase.
- `web/store-billing.js` blocks payment before native call.
- `scripts/export-store-catalog.mjs` produces pre-registration product manifests; its outputs do not create products in accounts.

Official guidance:
- Google Play: https://developer.android.com/google/play/billing/integrate
- Google Play verification: https://developer.android.com/google/play/billing/security
- Apple App Review: https://developer.apple.com/app-store/review/guidelines/
- Apple StoreKit testing: https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode

**Release claim:** Code and automated checks may be called prepared or validated; **do not** claim payment readiness, legal clearance, physical-device verification or public publication before the external items above are genuinely completed.
