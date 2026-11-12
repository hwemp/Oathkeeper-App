#!/usr/bin/env python3
"""Normalize ONLY the legacy baked Store Icons page's permanent 5th-tile glow.
   
The archived Store cover art has Arcane Chalice permanently highlighted.
The previous UI laid a dark rectangular patch over it, which left a visible
black box and stale old artwork behind the live launcher art. Here we derive a
neutral fifth frame from the SAME source sheet's unselected fifth frame in row
two. Then the icon selection control alone applies the live highlight.

This does not modify the original baked Store source, any launcher resource,
any other Store category, or any other app screen. The new page is a separate
lossless WebP, and this repair is only loaded in the App Icons category.
"""
from pathlib import Path
import hashlib
import numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
SRC=ROOT/"dist/art/exact-store/icons.webp"
DST=ROOT/"dist/art/exact-store/icons-workbench.webp"
REFERENCE_SHA="84b0594eeae14962cf6f3f02511304f4c2e505390a36e2946af8383f39a43bcb"
def main():
    if not SRC.is_file():raise RuntimeError("Frozen 144 icon sheet missing")
    if hashlib.sha256(SRC.read_bytes()).hexdigest()!=REFERENCE_SHA:
        raise RuntimeError("Icon sheet master changed; stop instead of editing the wrong artwork")
    if DST.exists():raise RuntimeError("Workbench icon sheet already generated")
    with Image.open(SRC) as image:
        image=image.convert("RGB")
        if image.size!=(887,1774):raise RuntimeError("Unexpected historical Store page layout")
        pixels=np.array(image,dtype=np.float32)
    result=pixels.copy()
    # Frozen sheet row1 fifth tile contains a glowing selection state baked in;
    # row2 fifth tile has the same geometry without this permanently-on glow.
    x0,x1,y0,y1=674,878,459,653
    row_offset=187
    donor=pixels[y0+row_offset:y1+row_offset,x0:x1].copy()
    dest=pixels[y0:y1,x0:x1]
    if donor.shape!=dest.shape:raise RuntimeError("Frame dimensions differ")
    # Feather only the outside margin so the approved page backdrop survives.
    h,w=donor.shape[:2]
    feather=12
    mask=np.ones((h,w),dtype=np.float32)
    ramp=np.linspace(0,1,feather,endpoint=False,dtype=np.float32)
    mask[:feather,:]*=ramp[:,None]
    mask[-feather:,:]*=ramp[::-1,None]
    mask[:,:feather]*=ramp[None,:]
    mask[:,-feather:]*=ramp[None,::-1]
    result[y0:y1,x0:x1]=(dest*(1-mask[:,:,None])+donor*mask[:,:,None])
    output=Image.fromarray(np.clip(np.rint(result),0,255).astype('uint8'),"RGB")
    DST.parent.mkdir(parents=True,exist_ok=True)
    output.save(DST,format="WEBP",lossless=True,method=6)
    with Image.open(DST) as im:
        actual=np.array(im.convert("RGB"))
    reference=np.array(image)
    if actual.shape!=reference.shape:raise RuntimeError("Result dimensions changed")
    diff=np.any(actual!=reference,axis=2)
    if diff.any():
        yy,xx=np.where(diff)
        if xx.min()<x0 or xx.max()>=x1 or yy.min()<y0 or yy.max()>=y1:
            raise RuntimeError("Accidentally changed outside isolated fifth icon tile")
    if diff.sum()<1000:raise RuntimeError("Baked-on selection was not actually neutralized")
    print("WORKBENCH NEUTRAL ICON GALLERY: selected glow removed from image backing using unselected in-sheet frame; outside fifth tile byte-perfect when decoded; all launcher art stays live.")
if __name__=="__main__":main()
