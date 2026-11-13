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
  mask_im=Image.fromarray(mask,"L").filter(ImageFilter.GaussianBlur(.45))
  file=OUTPUT/(category+".png")
  mask_im.save(file,"PNG",optimize=True)
  print(f"STORE GEM MASK: {category}: {np.count_nonzero(mask)} violet gemstone-only pixels; original art untouched")
if __name__=="__main__": main()
