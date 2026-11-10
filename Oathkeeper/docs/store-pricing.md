# Oathkeeper Store pricing (approved 2026-11-10)

| Category | Per-item price (USD) | Items | Checkout |
| --- | ---: | ---: | --- |
| Dice sets | **$1.00** | 10 | Disabled until billing is connected |
| Backgrounds | **$0.50** | 10 | Disabled until billing is connected |
| Alternate app icons | **FREE** | 10 approved | No purchase required |

Approved free icon concept numbers: **1, 2, 4, 5, 6, 7, 8, 11, 12, 14**. The
original launcher icon stays installed by default. Alternate icon artwork
and launcher switching still require native packaging.

Prices are stored in integer USD cents in `web/store-pricing.js` and on
each dice and background catalog entry. The UI shows the selected item's
price. The Purchase button stays disabled until actual billing is
configured and verified; product IDs are only proposals.

Before activation, configure the equivalent price points in Google Play
Console and App Store Connect. Exact price-point availability can differ
from requested prices (including the requested $0.50). Show and honor
the actual checkout price returned by the platform once connected.
