# Oathkeeper selected dice store — implemented visual preview

The user approved the **latest number-badge-free fantasy dice store mockup** on 2026-11-10.

## Included artwork

The chosen designs are included using a locally bundled optimized image atlas
(`web/public/art/oathkeeper-dice-store-atlas.webp`) and matching header
(`web/public/art/oathkeeper-store-banner.webp`), both derived from the
approved image. Artwork is not fetched from a third-party site at runtime.

Ten cosmetic previews, presented in **exactly five columns and two rows**:

1. Dragonfire
2. Frostborne
4. Elvenleaf
5. Celestial
7. Abyssal
8. Gold-Forged
11. Necrotic
13. Astral
15. Oceanic
17. Sunfire

These are the original selection identifiers. **No selection-number badges,
radio circles, or symbolic placeholder dice illustrations appear in the app.**
Names are embedded in the art; accessible names are provided in button labels.

## Interaction
- Tapping a dice image highlights only that image's border. Default base
  highlight is gold (`--gold`); future app themes can set
  `--oathkeeper-theme-highlight`.
- The selected option is saved locally as `storePreviewDice`.
- A separate Preview Dice button opens a larger, accessible view.
- The 5×2 layout remains 5 columns even on narrow devices; a larger preview is
  provided for legibility.
- The original free dice and secure RNG are unchanged.

## Payments and release
- All purchases, prices, billing and checkout remain **disabled**.
- Catalog product IDs are proposals, not registered in any payment console.
- Backgrounds, app icons and bundles remain unselected/unavailable.
- Additional work required before sales: production ownership/licensing review,
  platform billing, verifiable entitlements, restore/refund processes,
  age-appropriate safeguards, test purchase flows, and explicit user approval.
