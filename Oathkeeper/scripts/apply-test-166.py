#!/usr/bin/env python3
"""Build-only visual parity stylesheet. Never edit dice roll runtime, math or animation."""
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
SKINS={
 "dragonfire":"Dragonfire",
 "frostborne":"Frostborne",
 "elvenleaf":"Elvenleaf",
 "celestial":"Celestial",
 "abyssal":"Abyssal",
 "gold-forged":"Gold-Forged",
 "necrotic":"Necrotic",
 "astral":"Astral",
 "oceanic":"Oceanic",
 "sunfire":"Sunfire",
}
SIDES=(3,4,6,8,10,12,20,50,100)

def main():
 index=DIST/"index.html"
 if not index.is_file() or not (DIST/"test164-overrides.css").is_file():
  raise RuntimeError("Preserve Build 144 and apply TEST 165 overlays first")
 for skin in ("default",*SKINS):
  for sides in SIDES:
   path=DIST/"art"/"test166-dice"/skin/f"d{sides}.png"
   if not path.is_file() or path.stat().st_size<4000:
    raise RuntimeError(f"Missing animated renderer capture: {path}")
  if skin!="default" and not (DIST/"art"/"test164-dice"/f"{skin}.png").is_file():
   raise RuntimeError(f"Missing Store D20 master for {skin}")
 lines=[
  "/* TEST 166: All dice art comes from the existing untouched 3D rolling renderer.",
  "   The artwork in the Store, bundles and selection menu shares the same source.",
  "   All selection buttons remain interactive; no new overlay catches taps. */",
  ".dice-page .die-tile .reference-die {",
  " background-size:contain!important;background-position:center!important;",
  " background-repeat:no-repeat!important;",
  " background-color:transparent!important;image-rendering:auto!important;",
  " aspect-ratio:248/175!important;",
  " width:min(95%,130px)!important;height:70px!important;",
  " min-width:0!important;max-width:100%!important;",
  "}",
  ".dice-page .dice-special-grid .percentile-art .reference-die {width:95%!important;}",
  ".dice-page .dice-special-grid .die-tile>.reference-die {height:72px!important;}",
  ".bundle-dice-pick .bundle-dice-art,",
  ".store-dice-tile .store-dice-tile-art,",
  ".store-preview-image, .dice-applied-art {",
  " background-size:cover!important;background-position:center!important;",
  " background-repeat:no-repeat!important;image-rendering:auto!important;",
  "}",
  ".ok-exact-store button.ok-hit[data-store-bundle-dice]::before {",
  ' content:""!important;display:block!important;position:absolute!important;',
  " inset:3px 3px 19px!important;z-index:2!important;pointer-events:none!important;",
  " background-position:center!important;background-size:cover!important;",
  " background-repeat:no-repeat!important;border-radius:3px!important;",
  " background-color:#11142a!important;image-rendering:auto!important;",
  "}",
  "/* Keep each bundle item name visible on top of its renderer-derived image. */",
  ".ok-exact-store button.ok-hit[data-store-bundle-dice]::after,",
  ".bundle-dice-pick[data-store-bundle-dice]::after {",
  " display:block!important;position:absolute!important;",
  " content:attr(data-store-bundle-dice)!important;",
  " bottom:2px!important;left:2px!important;right:2px!important;top:auto!important;",
  " margin:0!important;height:auto!important;min-height:13px!important;",
  " z-index:3!important;pointer-events:none!important;",
  " background:linear-gradient(90deg,#130d1ed9,#211027ed,#130d1ed9)!important;",
  " border:0!important;border-radius:2px!important;box-shadow:none!important;",
  " color:#f7dd97!important;text-align:center!important;",
  " font:600 clamp(8px,1.45vw,12px)/1.25 Georgia,serif!important;",
  " text-transform:uppercase!important;white-space:nowrap!important;",
  " text-shadow:0 1px 2px #000!important;opacity:1!important;",
  "}",
 ]
 for sides in SIDES:
  path=f'./art/test166-dice/default/d{sides}.png'
  lines.append(f'.dice-page .die-tile[data-die="{sides}"] .reference-die {{background-image:url("{path}")!important;}}')
 for skin in SKINS:
  for sides in SIDES:
   path=f'./art/test166-dice/{skin}/d{sides}.png'
   lines.append(f'body:has(.dice-applied-skin[data-applied-dice="{skin}"]) .dice-page .die-tile[data-die="{sides}"] .reference-die {{background-image:url("{path}")!important;}}')
 for skin in SKINS:
  path=f'./art/test166-dice/{skin}/d20.png'
  for selector in [
   f'.ok-exact-store [data-store-bundle-dice="{skin}"]::before',
   f'.ok-exact-store [data-store-dice="{skin}"]::before',
   f'.bundle-dice-pick[data-store-bundle-dice="{skin}"] .bundle-dice-art',
   f'.store-dice-tile[data-store-dice="{skin}"] .store-dice-tile-art',
   f'.dice-applied-skin[data-applied-dice="{skin}"] .dice-applied-art'
  ]:
   lines.append(f'{selector} {{background-image:url("{path}")!important;}}')
 for n,skin in enumerate(SKINS):
  path=f'./art/test166-dice/{skin}/d20.png'
  lines.append(f'.store-preview-image[data-store-atlas-index="{n}"] {{background-image:url("{path}")!important;}}')
 # For modern bundle cards: the user's exact set title should not disappear.
 for skin,name in SKINS.items():
  lines.append(f'.ok-exact-store [data-store-bundle-dice="{skin}"]::after,.bundle-dice-pick[data-store-bundle-dice="{skin}"]::after {{content:"{name}"!important;}}')
 css=DIST/"test166-dice-parity.css"
 css.write_text("\n".join(lines)+"\n",encoding="utf-8")
 html=index.read_text(encoding="utf-8")
 ref='<link rel="stylesheet" href="./test166-dice-parity.css" data-test166-dice-parity="true">'
 if html.count("</head>")!=1 or "test166-dice-parity.css" in html:
  raise RuntimeError("Unexpected or duplicate 166 CSS insertion")
 index.write_text(html.replace("</head>",ref+"</head>",1),encoding="utf-8")
 # Frozen 144 renders its bundle items inside a baked background collage.
 # CSS-only pseudo-element backgrounds can compute correctly yet remain hidden
 # under that collage. An explicit pointer-transparent foreground is required.
 import shutil
 layer_source=ROOT/"web"/"test166-bundle-overlay.js"
 layer_dest=DIST/"test166-bundle-overlay.js"
 if not layer_source.is_file() or "test166-bundle-live-art" not in layer_source.read_text():
  raise RuntimeError("Visible bundle renderer overlay source unavailable")
 shutil.copyfile(layer_source,layer_dest)
 html=index.read_text(encoding="utf-8")
 script='<script type="module" src="./test166-bundle-overlay.js" data-test166-visible-bundles="true"></script>'
 if html.count("</head>")!=1 or "test166-bundle-overlay.js" in html:
  raise RuntimeError("Unexpected or duplicate 166 visual script")
 index.write_text(html.replace("</head>",script+"</head>",1),encoding="utf-8")
 print("TEST 166: 99 native-resolution rolling renderer captures mapped to store, bundles and dice selectors.")

if __name__=="__main__":
 main()
