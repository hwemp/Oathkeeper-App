#!/usr/bin/env python3
"""TEST 178: one top gemstone on engraved buttons, Community only on Store footer.

The Store uses baked raster footer art. Restore the *matching approved*
single-centre-jewel footer on the Bundles page rather than trying to hide
four baked diamonds with CSS. Source comes from an existing approved page.
No Store dice animation, animated preview, RNG, Android launcher or prices
are modified.
"""
from pathlib import Path
from PIL import Image
import hashlib

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
MASTER_SHA="fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"

def main():
    store=DIST/"art/exact-store"
    original=store/"roll/astral-original.gif"
    if not original.exists() or hashlib.sha256(original.read_bytes()).hexdigest()!=MASTER_SHA:
        raise RuntimeError("Approved original Store dice animation was changed")
    button_dir=DIST/"art/test170-buttons"
    paths=sorted(button_dir.glob("*.svg"))
    if len(paths)!=36:raise RuntimeError("Missing the 36 canonical themed button SVGs")
    for p in paths:
        xml=p.read_text()
        if xml.count('<use href="#gemstone"')!=1 or "211) scale(.83 .83)" in xml:
            raise RuntimeError("A generated ornate button still has a second gemstone: "+p.name)

    # The frozen Bundles footer has FIVE jewels baked into its lower 614px
    # sheet. The approved Backgrounds source has exactly ONE gem, centred
    # over Community, with the matching gold navigation and full-width trim.
    # Copy only the matching 177px bottom area. No vector recreation,
    # repaint, or blur is applied to any of its source pixels.
    src=store/"backgrounds.webp"
    target=store/"bundles-bottom.webp"
    with Image.open(src) as im: source=im.convert("RGB")
    with Image.open(target) as im: old=im.convert("RGB")
    if source.size!=(941,1672) or old.size!=(941,614):
        raise RuntimeError("Unexpected source/footer dimensions; stop")
    upper=1495
    height=source.height-upper
    assert height==177
    canvas=old.copy()
    canvas.paste(source.crop((0,upper,941,1672)),(0,614-height))
    # Preserve source art exactness in the final lossless WebP.
    canvas.save(target,format="WEBP",lossless=True,method=6)
    with Image.open(target) as im:
        decoded=im.convert("RGB")
    if decoded.size!=(941,614) or decoded.crop((0,614-height,941,614)).tobytes()!=source.crop((0,upper,941,1672)).tobytes():
        raise RuntimeError("Single-gem bundle footer art was altered")
    # CSS changes only fall-back live HTML nav; baked approved nav above
    # already provides exactly one middle gemstone.
    css=ROOT/"web/test178-single-center-gem.css"
    if not css.is_file():raise RuntimeError("Fallback Store footer CSS missing")
    (DIST/"test178-single-center-gem.css").write_bytes(css.read_bytes())
    index=DIST/"index.html"
    html=index.read_text()
    if html.count("</head>")!=1 or "test178-single-center-gem.css" in html:
        raise RuntimeError("Unexpected frozen index")
    html=html.replace("</head>",'<link rel="stylesheet" href="./test178-single-center-gem.css" data-test178-center-gem="true"></head>',1)
    index.write_text(html)
    print("TEST 178: 36 themed SVGs have ONE top gem; Bundles footer now has only the approved Community jewel; exact Store GIF unchanged.")

if __name__=="__main__":main()
