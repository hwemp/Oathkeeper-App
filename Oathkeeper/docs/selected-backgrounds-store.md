# Oathkeeper — selected background concepts (2026-11-10)

The user chose **10 of 20 proposed fantasy background concepts** for the optional in-app store. These identifiers refer to the numbered background concept selection gallery, not dice sets.

| Original option # | Background |
| --- | --- |
| 1 | Moonlit Citadel |
| 2 | Ancient Ruins |
| 3 | Enchanted Forest |
| 4 | Dragon’s Crag |
| 8 | Shadow Marsh |
| 9 | Celestial Plains |
| 10 | Crystal Caverns |
| 17 | Elder Grove |
| 19 | Mystic Lake |
| 20 | Eternal Keep |

**Status:** Concepts selected for review and future preparation, not production-ready app wallpaper assets. The earlier 20-image mockup and selector are visual concepts. Full-size clean backgrounds, phone/device aspect ratios, legibility overlays, attribution/license checks, and quality review remain to be addressed before in-app use.

**Not authorized:** enabling payments, adding sale prices, publishing store offerings, or releasing app updates based solely on this selection. This documentation update does not change the app or trigger an APK rebuild.

Design direction: Preserve the Oathkeeper fantasy aesthetic and the current theme highlight (gold for the base theme). The optional background list should eventually support tapping an image for a full preview and selecting/applying owned backgrounds; keep unowned selections disabled until a proper approved purchase and entitlement flow is implemented.

## Implemented in the in-app Store

A new **Backgrounds** category shows exactly the ten approved options. Each
artwork is bundled as a distinct, local WebP file under
`web/public/art/store-backgrounds/`; opening any preview uses that item's
exact file path rather than sprite offsets or an asynchronous canvas.
The selected tile is highlighted using the app theme's accent; tapping it
opens a larger centered, contained preview with its name and description.
The Store retains its existing Dice Sets category.

**Artwork limitation:** These 508×360 files are crops from the original
concept gallery. They are appropriate for store preview/testing but should
not be confused with clean, full-resolution production phone wallpapers.
Purchase, application, entitlements, prices and payments remain disabled.
