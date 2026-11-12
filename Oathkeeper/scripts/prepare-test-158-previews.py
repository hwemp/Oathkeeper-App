#!/usr/bin/env python3
"""Crop Store thumbnails from the very same original Build 144 atlas as 3D dice."""
from pathlib import Path
import re
from PIL import Image
ROOT=Path(__file__).resolve().parent.parent
text=(ROOT/"web/store-dice-catalog.js").read_text(encoding="utf-8")
pairs=re.findall(r'"slug":\s*"([^"]+)"[\s\S]*?"atlasIndex":\s*(\d+)',text)
if len(pairs)!=10 or len({slug for slug,idx in pairs})!=10 or {int(idx) for slug,idx in pairs}!=set(range(10)):
    raise RuntimeError("Expected ten unique atlas entries")
if "/art/oathkeeper-dice-store-atlas.webp" not in (ROOT/"web/dice-tabletop.js").read_text(encoding="utf-8"):
    raise RuntimeError("Source atlas is not used by the live dice animation")
output=ROOT/"web/public/art/store-dice"
output.mkdir(parents=True,exist_ok=True)
with Image.open(ROOT/"web/public/art/oathkeeper-dice-store-atlas.webp") as atlas:
    if atlas.width%5 or atlas.height%2:
        raise RuntimeError("The dice atlas must be an exact five by two grid")
    w,h=atlas.width//5,atlas.height//2
    for slug,index in pairs:
        index=int(index)
        x,y=(index%5)*w,(index//5)*h
        atlas.crop((x,y,x+w,y+h)).save(output/(slug+".webp"),"WEBP",lossless=True,method=6)
print("Verified 10 separate Store previews cropped from unchanged animated-dice atlas")
