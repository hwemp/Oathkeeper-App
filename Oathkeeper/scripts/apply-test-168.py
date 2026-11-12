#!/usr/bin/env python3
"""TEST 168: attach a 3D-only offline visual layer over Build 144 renderer.
This script never rewrites the frozen compiled app, dice engine, RNG or Store
purchase logic. If WebGL fails the approved original animation stays visible."""
from pathlib import Path
import re,hashlib
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
def main():
 index=DIST/"index.html"
 webgl=DIST/"test168-live-3d.js"
 styles=DIST/"test168-3d-theme.css"
 if not index.is_file() or not webgl.is_file() or webgl.stat().st_size<150000:
  raise RuntimeError("WebGL offline graphics module not available for test 168")
 if not (DIST/"test166-dice-parity.css").is_file():
  raise RuntimeError("Store/Die shared graphics wiring from TEST 167 missing")
 css="""/* TEST 168 true 3D stage. Keep all original interface controls and taps. */
#diceTabletop {position:relative!important;isolation:isolate}
#diceTabletop canvas.test168-live-webgl {
  display:block!important;position:absolute!important;
  pointer-events:none!important;border-radius:8px!important;
  image-rendering:auto!important;
}
.dice-page .die-tile .reference-die {
  background-size:contain!important;background-repeat:no-repeat!important;
  background-position:center center!important;
  image-rendering:auto!important;
}
.ok-exact-store [data-store-dice]::before,
.ok-exact-store [data-store-bundle-dice]::before,
.ok-exact-store .test166-bundle-live-art,
.store-dice-tile .store-dice-tile-art,
.store-preview-image,.bundle-dice-art,.dice-applied-art {
  background-size:contain!important;background-position:center center!important;
  background-repeat:no-repeat!important;image-rendering:auto!important;
}
body .dice-page .die-tile {overflow:hidden!important}
@media (prefers-reduced-motion: reduce) {
  #diceTabletop canvas.test168-live-webgl {display:none!important}
}
"""
 styles.write_text(css,encoding="utf-8")
 html=index.read_text(encoding="utf-8")
 if html.count("</head>")!=1 or "test168-live-3d.js" in html:
  raise RuntimeError("Unexpected index or duplicate 3D script")
 insert=('<link rel="stylesheet" href="./test168-3d-theme.css" data-test168-3d-css>'
         '<script type="module" src="./test168-live-3d.js" data-test168-3d-runtime="true"></script>')
 index.write_text(html.replace("</head>",insert+"</head>",1),encoding="utf-8")
 print("TEST 168 high-quality WebGL roller linked, 2D fallback retained; 99 shared 3D still masters already installed")
if __name__=="__main__":main()
