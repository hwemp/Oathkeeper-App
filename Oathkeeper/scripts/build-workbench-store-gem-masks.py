#!/usr/bin/env python3
"""Generate strictly localized masks for theme-colouring baked Store JEWEL pixels.

Original user-approved artwork is immutable: this creates separate monochrome
masks, never re-encodes a Store page, background, launcher icon or animated GIF.
Mask positions are read in the ORIGINAL reference pixel coordinate system.
Only bright violet within small, independently located diamonds is eligible.
Purple cloth, purple buttons and illustration/currency crystals stay untouched.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
ROOT=Path(__file__).resolve().parent.parent
ART=ROOT/"dist"/"art"/"exact-store"
OUTPUT=ROOT/"dist"/"art"/"workbench-store-gem-masks"
OVERLAYS=ROOT/"dist"/"art"/"workbench-store-gem-overlays"
THEME_COLORS={"sapphire":(63,143,229),"emerald":(32,195,122),"ruby":(219,65,97),"aquamarine":(58,210,209),"citrine":(234,192,73)}
# center x, center y, half-width, half-height in original page pixels
# The header, collection title, selection-frame tip and footer jewels are UI.
# Treasure-pile crystals are depicted merchandise; do not recolor scenery.
POSITIONS={
 "backgrounds": ("test169-bg/moonlit-citadel.webp", [
   # The two small frame diamonds at y=691/1080 are GOLD, not purple
   # gemstones. Exclude them rather than recoloring just 2-8 pixels.
   (471,30,18,25),(471,276,17,17),(470,1528,17,20)]),
 "dice": ("dice.webp", [
   (470,30,17,24),(471,300,18,23),(472,812,16,18),
   (472,1259,16,19),(472,1472,18,23)]),
 "icons": ("icons-workbench.webp", [
   (442,35,22,30),(442,317,28,35),(442,1376,16,24),
   (442,1540,23,32)]),
}
EXPECTED={"backgrounds":(941,1672),"dice":(941,1672),"icons":(887,1774)}
def main():
 OUTPUT.mkdir(parents=True,exist_ok=True)
 OVERLAYS.mkdir(parents=True,exist_ok=True)
 for category,(name,positions) in POSITIONS.items():
  source=ART/name
  if not source.is_file(): raise RuntimeError("Missing protected Store source "+str(source))
  with Image.open(source) as im:
   im=im.convert("RGB")
   if im.size!=EXPECTED[category]:raise RuntimeError("Unexpected Store coordinates for "+category)
   data=np.asarray(im,dtype=np.uint16)
   hsv=np.asarray(im.convert("HSV"),dtype=np.uint16)
  r,g,b=(data[:,:,i] for i in range(3))
  h,s,v=(hsv[:,:,i] for i in range(3))
  # White facets remain white; gold should remain gold. Do NOT alter the
  # image's hue except within a physically documented UI gemstone polygon.
  violet=(h>=173)&(h<=231)&(s>=53)&(v>=88)&(r>g*1.13)&(b>g*1.15)&(b>r*.73)
  shapes=Image.new("L",im.size,0)
  drawer=ImageDraw.Draw(shapes)
  for cx,cy,hw,hh in positions:
   drawer.polygon([(cx,cy-hh),(cx+hw,cy),(cx,cy+hh),(cx-hw,cy)],fill=255)
  region=np.asarray(shapes,dtype=np.uint8)>0
  mask=np.where(violet & region,235,0).astype(np.uint8)
  for cx,cy,hw,hh in positions:
   crop=mask[max(0,cy-hh):min(im.height,cy+hh+1),max(0,cx-hw):min(im.width,cx+hw+1)]
   if np.count_nonzero(crop)<12:
    raise RuntimeError(f"Mask missing gem at {category} ({cx},{cy})")
  if np.count_nonzero(mask)>17000:raise RuntimeError("Mask includes unrelated artwork")
  # CRITICAL: CSS mask-image uses PNG ALPHA, not black/white luminance.
  # A grayscale L-mode PNG has opaque alpha and recolors the WHOLE Store.
  # Save a REAL RGBA mask: untouched pixels have zero alpha.
  mask_im=Image.fromarray(mask,"L").filter(ImageFilter.GaussianBlur(.45))
  alpha=np.asarray(mask_im,dtype=np.uint8)
  rgba=np.zeros((im.height,im.width,4),dtype=np.uint8)
  rgba[:,:,:3]=255
  rgba[:,:,3]=alpha
  file=OUTPUT/(category+".png")
  Image.fromarray(rgba,"RGBA").save(file,"PNG",optimize=True)
  with Image.open(file) as check:
   if check.mode!="RGBA":raise RuntimeError("CSS mask does not carry alpha")
   a=np.asarray(check.getchannel("A"),dtype=np.uint8)
   if np.count_nonzero(a>8)>max(7000,im.width*im.height*.01):
    raise RuntimeError("Store mask leaks outside isolated gemstones")
   if np.count_nonzero(a>128)<200:
    raise RuntimeError("Store mask opacity missing on gemstone")
  # Produce fully transparent, separately colorized overlays: no CSS mask,
  # multiply blend, solid pseudo background, or page-wide color layer.
  # Gold/cloth/background pixels have alpha 0 by construction.
  brightness=(np.max(data,axis=2).astype(np.float32)/255.0)
  facet_scale=(0.52+0.74*brightness)[:,:,None]
  for theme,base in THEME_COLORS.items():
   original_rgb=np.array(base,dtype=np.float32).reshape(1,1,3)
   colored=np.clip(original_rgb*facet_scale,0,255).astype(np.uint8)
   overlay=np.zeros((im.height,im.width,4),dtype=np.uint8)
   overlay[:,:,:3]=colored
   overlay[:,:,3]=alpha
   overlay_file=OVERLAYS/(theme+"-"+category+".png")
   Image.fromarray(overlay,"RGBA").save(overlay_file,"PNG",optimize=True)
   with Image.open(overlay_file) as check:
    if check.mode!="RGBA":raise RuntimeError("Overlay lost transparency "+str(overlay_file))
    a=np.asarray(check.getchannel("A"),dtype=np.uint8)
    if np.count_nonzero(a>8)>max(7000,im.width*im.height*.01):
     raise RuntimeError("Overlay would tint the Store background "+str(overlay_file))
    if np.count_nonzero(a>128)<200:
     raise RuntimeError("Overlay missing gemstone "+str(overlay_file))
  print(f"STORE GEM OVERLAYS: {category}: 5 colors with transparent untouched backdrop; {np.count_nonzero(mask)} gem pixels; original art intact")
if __name__=="__main__": main()
