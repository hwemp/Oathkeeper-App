# Oathkeeper store rendering — approved 10 Nov 2026 reference

Visual reference: five user-provided screenshots of Dice Sets, Backgrounds,
App Icons, Bundles, and Golden Coffer bundle selection. These references
override older proposed store banner/layout designs.

## Confirmed code defects corrected
- Sprite atlas contains exactly five columns and two rows. A later CSS rule
  scaled tiles to 565% × 226%, moving and clipping individual tiles. All atlas
  consumers now render at exactly 500% × 200% with the original position offsets.
- Backgrounds, icons, and bundle tiles had a CSS scale(1.15) enlargement. That
  cropped art against the bounding frame. The approved style now uses no image
  transform in tiles and preserves full art for enlarged previews.
- Previews previously used two unequal columns and tiny containers; approved
  style uses a centered, one-column artwork area on mobile and desktop.
- Low-resolution source images were being upscaled automatically at build time.
  The build now reports native image dimensions and packages the original
  illustrations unchanged rather than pretending resampling adds detail.

## Remaining asset requirements
The existing dice sprite and ten icon concepts resemble the approved reference
images, but are still compressed rasters. Existing background image sources are
only approximately 508 px wide; most cannot produce a truly high-detail full
screen preview. The approved screenshots also do not contain isolated,
lossless 1k/2k masters for every image. Matching their style is not equivalent
to recreating unseen original pixels. The full decorative header (hooded knight,
castle, logo) and chest-and-dragon bundle panels are not available as isolated
approved assets in the repository. Until those isolated art sources are provided,
the store uses its available themed assets and responsive CSS. Do **not** claim
that the missing high-resolution or bundle master art has been installed.

## Guardrails
- Icons remain free, dice prices remain $1, backgrounds $0.50, Golden Coffer $5,
  Dragon's Treasure $10; paid purchase actions remain disabled until billing is
  configured and tested.
- The original launcher icon remains available.
- App selections and billing logic are untouched; tests guard against regressing
  atlas alignment and preview layout.
