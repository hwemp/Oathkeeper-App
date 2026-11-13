#!/usr/bin/env python3
"""TEST 169 reference-first graphics build.
Use archived original roll GIF and its themed WebP siblings as masters;
replace the complete baked background-page image, not an image overlay.
Never invent a 3D mesh or change an approved animation frame.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter, ImageDraw, ImageFont
import colorsys,hashlib,json,os,io
import cairosvg
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
ART=DIST/"art"
ROLL=ART/"exact-store"/"roll"
SCENES={
 "moonlit-citadel":("Moonlit Citadel","Gothic moonlit castle, sapphire night sky and cascading waterfalls"),
 "ancient-ruins":("Ancient Ruins","Overgrown stone archways bathed in ancient forest sunlight"),
 "enchanted-forest":("Enchanted Forest","Glowing turquoise woodland with magical trees"),
 "dragons-crag":("Dragon's Crag","Volcanic mountains beneath a fiery red sky"),
 "shadow-marsh":("Shadow Marsh","Purple twilight wetlands and shadowed trees"),
 "celestial-plains":("Celestial Plains","Wide green plains beneath twin celestial moons"),
 "crystal-caverns":("Crystal Caverns","Violet crystalline cave filled with magic"),
 "elder-grove":("Elder Grove","Majestic illuminated tree at the heart of an enchanted grove"),
 "mystic-lake":("Mystic Lake","Star-lit lake reflecting a glowing moon and purple light"),
 "eternal-keep":("Eternal Keep","Glowing castle and towers above the waterfalls"),
}
SKINS={
 "default":265,
 "dragonfire":4,
 "frostborne":215,
 "elvenleaf":135,
 "celestial":260,
 "abyssal":281,
 "gold-forged":36,
 "necrotic":137,
 "astral":270,
 "oceanic":193,
 "sunfire":23,
}
CROPS={3:(880,416,127,84),4:(1041,417,96,78),6:(1190,417,85,79),
8:(880,536,111,78),10:(1035,537,106,76),12:(1185,539,98,77),
20:(880,653,109,100),50:(1037,653,103,99),100:(1183,654,109,99)}
SHA_MASTER="fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def font(size):
 for f in ["/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf",
           "/usr/share/fonts/truetype/liberation2/LiberationSerif-Regular.ttf"]:
  if Path(f).is_file(): return ImageFont.truetype(f,size)
 return ImageFont.load_default()
def fit_reference(src,size):
 # Preserve proportions, center the actual subject, cover the whole frame.
 out=ImageOps.fit(src.convert("RGB"),size,method=Image.Resampling.LANCZOS,centering=(.5,.5))
 return out.filter(ImageFilter.UnsharpMask(radius=1.15,percent=148,threshold=4))
def scene_page(base,slug):
 if slug=="moonlit-citadel":
  return base.copy() # Preserve the already-approved, high-resolution default.
 source=ART/"workbench-hd-scenes"/(slug+".webp")
 if not source.is_file():raise RuntimeError("Missing vector-master scene "+slug)
 image=Image.open(source).convert("RGB")
 if image.size!=(1600,1125):raise RuntimeError("Scene must be true 1600x1125 vector raster "+slug)
 result=base.copy();rect=(38,675,903,1082)
 w,h=rect[2]-rect[0],rect[3]-rect[1]
 # Preserve the ENTIRE scene with its original aspect ratio. No stretching,
 # lossy 508px thumbnail enlargement or off-center cropped scenery.
 canvas=ImageOps.fit(image,(w,h),method=Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(24))
 fitted=ImageOps.contain(image,(w,h),method=Image.Resampling.LANCZOS)
 x=(w-fitted.width)//2;y=(h-fitted.height)//2
 canvas.paste(fitted,(x,y))
 result.paste(canvas,rect)
 # Repaint only the original gold ornaments on top of the new art, using
 # their color & border location. No old landscape pixels are retained.
 raw=np.asarray(base.convert("RGB"),dtype=np.float32)
 pixels=np.array(result)
 x0,y0,x1,y1=rect
 yy,xx=np.mgrid[y0:y1,x0:x1]
 delta=np.minimum.reduce([xx-x0,x1-xx,yy-y0,y1-yy])
 orig=raw[y0:y1,x0:x1]
 R,G,B=orig[:,:,0],orig[:,:,1],orig[:,:,2]
 gold=(R>80)&(R>G*.97)&(G>B*1.24)&(G>75)&(delta<43)
 mask=Image.fromarray((gold.astype(np.uint8)*255),"L")
 mask=mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
 region=Image.composite(base.crop(rect),result.crop(rect),mask)
 result.paste(region,rect)
 # Re-author the baked title/caption into this one image; no text mask overlay.
 d=ImageDraw.Draw(result)
 for y in range(1078,1178):
  r=(y-1078)/100
  d.line([(34,y),(907,y)], fill=(7+int(r*4),14+int(r*6),30+int(r*2)))
 d.line([(73,1110),(293,1110)],fill=(158,112,57),width=2)
 d.line([(651,1110),(869,1110)],fill=(158,112,57),width=2)
 name,description=SCENES[slug]
 d.text((470,1080),name,font=font(41),anchor="mt",fill=(252,218,148),
        stroke_width=1,stroke_fill=(65,31,15))
 fs=23
 while fs>15 and d.textbbox((0,0),description,font=font(fs))[2]>745:fs-=1
 d.text((470,1137),description+".",font=font(fs),anchor="mt",fill=(245,209,143),
        stroke_width=1,stroke_fill=(53,28,14))
 return result
def tint_reference(image,slug):
 if slug in ("default","astral"):return image
 orig=image.convert("RGB")
 a=np.array(orig.convert("HSV"),dtype=np.uint8)
 hue=a[:,:,0].astype(np.int16)
 sat=a[:,:,1]
 # Only recolor crystal violets/magentas; preserve yellow-gold filigree,
 # the ivory face numbers, and the approved shadow geometry.
 m=(hue>=169)&(hue<=230)&(sat>=48)
 target=int(SKINS[slug]/360*255)
 shifted=np.clip(target+(hue-192)*.24,0,255).astype(np.uint8)
 a[:,:,0]=np.where(m,shifted,a[:,:,0])
 if slug in ("gold-forged","sunfire"):
  a[:,:,1]=np.where(m,np.minimum(255,a[:,:,1].astype(np.int16)+8),a[:,:,1])
 return Image.fromarray(a,"HSV").convert("RGB")
def vector_scenes():
 # The separately approved ten-scene 1600px SVG collection is rasterized from
 # original geometry. The legacy 508x360 previews remain on disk untouched.
 folder=ART/"workbench-hd-scenes"
 folder.mkdir(parents=True,exist_ok=True)
 for slug in SCENES:
  svg=ROOT/"web/public/art/store-backgrounds"/(slug+".svg")
  if not svg.is_file():raise RuntimeError("Missing SVG scene "+slug)
  xml=svg.read_text(encoding="utf-8")
  if "viewBox=" not in xml or "1600" not in xml or "1125" not in xml:
   raise RuntimeError("Unexpected vector master dimensions "+slug)
  raster=cairosvg.svg2png(bytestring=svg.read_bytes(),output_width=1600,output_height=1125)
  image=Image.open(io.BytesIO(raster)).convert("RGB")
  target=folder/(slug+".webp")
  image.save(target,"WEBP",quality=98,method=6)
  with Image.open(target) as verify:
   if verify.size!=(1600,1125):raise RuntimeError("HD scene lost resolution "+slug)
 print("WORKBENCH: 10 distinct 1600x1125 vector-derived HD scene masters rasterized.")

def dice_art():
 original=ART/"dice-reference.png"
 if not original.is_file():raise RuntimeError("Original illustrated D4-D100 art absent")
 atlas=Image.open(original).convert("RGB")
 if atlas.size!=(1536,1024):raise RuntimeError("Original dice atlas dimensions changed")
 for slug in SKINS:
  directory=ART/"test169-dice"/slug
  directory.mkdir(parents=True,exist_ok=True)
  for sides,(x,y,w,h) in CROPS.items():
   if sides==20:
    # Literal approved GIF still, NOT a polygon or a reconstructed projection.
    source=ROLL/(("astral" if slug=="default" else slug)+"-still.webp")
    out=Image.open(source).convert("RGB")
   else:
    original_crop=atlas.crop((x,y,x+w,y+h))
    recolored=tint_reference(original_crop,slug)
    # 4x resampling for crisp mobile UI, preserving the authored artwork.
    out=recolored.resize((w*4,h*4),Image.Resampling.LANCZOS)
    out=out.filter(ImageFilter.UnsharpMask(radius=1.2,percent=125,threshold=3))
   out.save(directory/("d"+str(sides)+".webp"),"WEBP",quality=94,method=6)
def main():
 vector_scenes()
 page=ART/"exact-store"/"backgrounds.webp"
 if not page.is_file():raise RuntimeError("Frozen 144 store master absent")
 master=ROLL/"astral-original.gif"
 if not master.is_file() or sha(master)!=SHA_MASTER:
  raise RuntimeError("Approved user's exact 352×356, 12-frame GIF was altered")
 for slug in SCENES.keys():
  preview=ART/"exact-store"/"test169-bg"/(slug+".webp")
  preview.parent.mkdir(parents=True,exist_ok=True)
  with Image.open(page) as im:
   if im.size!=(941,1672):raise RuntimeError("Archived background page changed")
   result=scene_page(im.convert("RGB"),slug)
  result.save(preview,"WEBP",quality=96,method=6)
  if Image.open(preview).size!=(941,1672):raise RuntimeError("Preview page not full frame "+slug)
 for slug in SKINS:
  if slug=="default":continue
  animation=ROLL/(slug+".webp")
  still=ROLL/(slug+"-still.webp")
  if not animation.is_file() or not still.is_file():raise RuntimeError("Missing approved dice "+slug)
  with Image.open(animation) as im:
   if im.size!=(352,356) or getattr(im,"n_frames",1)!=12:
    raise RuntimeError("Approved original 12-frame animation changed for "+slug)
 dice_art()
 report={"masterGifSha256":SHA_MASTER,"masterSize":[352,356],"masterFrames":12,
         "backgrounds":len(SCENES),"backgroundPageSize":[941,1672],
         "diceThemes":len(SKINS),"diceShapes":len(CROPS),
         "rollMode":"original archived Build 144, no WebGL substitute",
         "backgroundMode":"single baked full-page image, no preview overlay"}
 (ROOT/"preview-output").mkdir(exist_ok=True)
 (ROOT/"preview-output"/"169-reference-asset-report.json").write_text(json.dumps(report,indent=2))
 print("TEST 169: 10 complete Store background pages, 99 illustrated dice previews; original GIF matches user SHA")
if __name__=="__main__":main()
