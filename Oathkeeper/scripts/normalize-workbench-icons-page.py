#!/usr/bin/env python3
"""Make a CLEAN App Icons sheet. Other UI categories, header and footer unchanged.

The frozen Store image has the old ten icon artworks and a permanently selected
Chalice baked INTO the background. Layering buttons over that produced
mismatched previews and visible rectangles. Replace ONLY the grid area with a
matching dark-fantasy backing, then draw all ten icon masters as LIVE CSS
artwork. This retires the obsolete baked icon gallery, not merely covers it
with another shifted picture. No APK is produced here.
"""
from pathlib import Path
import hashlib
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/"dist/art/exact-store/icons.webp"
DEST=ROOT/"dist/art/exact-store/icons-workbench.webp"
MASTER_SHA="84b0594eeae14962cf6f3f02511304f4c2e505390a36e2946af8383f39a43bcb"
def main():
    if not SOURCE.is_file():raise RuntimeError("Archived Store sheet missing")
    if hashlib.sha256(SOURCE.read_bytes()).hexdigest()!=MASTER_SHA:
        raise RuntimeError("Approved Store image unexpectedly changed; stop rather than overwrite")
    with Image.open(SOURCE) as original:
        original=original.convert("RGB")
        if original.size!=(887,1774):raise RuntimeError("Unexpected Store sheet geometry")
        pixels=np.array(original)
    result=pixels.copy()
    x0,x1,y0,y1=0,887,436,835
    h,w=y1-y0,x1-x0
    ys,xs=np.mgrid[0:h,0:w].astype(np.float32)
    nx=xs/max(1,w-1)
    ny=ys/max(1,h-1)
    # Deep navy + violet cosmic background, derived to harmonize with the
    # archived Oathkeeper page. All random detail has a fixed seed.
    rng=np.random.default_rng(144)
    soft=(rng.normal(0,1,(13,23))*6.3).astype("float32")
    softness=np.array(Image.fromarray(soft,mode="F").resize((w,h),Image.Resampling.BICUBIC))
    veil1=np.exp(-((nx-.12)**2/.018+(ny-.45)**2/.33))
    veil2=np.exp(-((nx-.85)**2/.028+(ny-.60)**2/.18))
    veil3=np.exp(-((nx-.51)**2/.28+(ny-.20)**2/.065))
    panel=np.empty((h,w,3),dtype=np.float32)
    panel[:,:,0]=4+10*veil1+4*veil2+3*veil3+softness*.32
    panel[:,:,1]=10+3*veil1+4*veil2+4*veil3+softness*.35
    panel[:,:,2]=28+18*veil1+18*veil2+10*veil3+softness*.66
    fine=rng.normal(0,1.2,(h,w)).astype(np.float32)
    panel+=fine[:,:,None]*.58
    panel=np.clip(panel,0,255).astype(np.uint8)
    # A few faint high-density stars, intentionally *behind* the ten live
    # launcher icons, never baked substitutes for the icon artwork.
    stars=Image.fromarray(panel,"RGB").convert("RGBA")
    star_layer=Image.new("RGBA",(w,h),(0,0,0,0))
    draw=ImageDraw.Draw(star_layer)
    for i in range(98):
        x=int(rng.integers(12,w-12))
        y=int(rng.integers(10,h-10))
        radius=1 if i%5 else 2
        color=(117,157,255,54) if i%4 else (197,156,249,45)
        draw.ellipse((x-radius,y-radius,x+radius,y+radius),fill=color)
    star_layer=star_layer.filter(ImageFilter.GaussianBlur(.45))
    stars=Image.alpha_composite(stars,star_layer).convert("RGB")
    panel=np.array(stars)
    # The original page frame/heading/footer is pixel-identical. A narrow
    # vertical fade avoids a straight seam where the gallery joins the page.
    blend=np.ones((h,),dtype=np.float32)
    edge=12
    blend[:edge]=np.linspace(0,1,edge,dtype=np.float32)
    blend[-edge:]=np.linspace(1,0,edge,dtype=np.float32)
    old=pixels[y0:y1,x0:x1].astype("float32")
    out=old*(1-blend[:,None,None])+panel.astype("float32")*blend[:,None,None]
    result[y0:y1,x0:x1]=np.uint8(np.clip(np.rint(out),0,255))
    Image.fromarray(result,"RGB").save(DEST,format="WEBP",lossless=True,method=6)
    with Image.open(DEST) as saved:
        reread=np.array(saved.convert("RGB"))
    difference=np.any(reread!=pixels,axis=2)
    y,x=np.where(difference)
    if x.size==0 or y.min()<y0 or y.max()>=y1:
        raise RuntimeError("Unexpected edits outside the Store's icon-only grid area")
    if difference.sum()<100000:raise RuntimeError("Stale baked icon gallery was not removed")
    print("WORKBENCH CLEAN GALLERY: static obsolete icon pictures and always-selected Chalice removed only within App Icons grid. Header/footer/other categories untouched; draw all ten live Android master art tiles.")
if __name__=="__main__":
    main()
