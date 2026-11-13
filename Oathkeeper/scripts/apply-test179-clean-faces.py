#!/usr/bin/env python3
"""Test 179 final illustration repair: remove the pre-painted static number
from each settled gameplay die, retaining the selected art and original
toss/GIF animation. Live secure roll value is rendered by its DOM span.
Run only AFTER legacy 177 art audits. Never alter RNG or Store GIF.
"""
from pathlib import Path
from PIL import Image
import cv2, numpy as np
import hashlib, json

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
ART=DIST/"art"
SKINS=("dragonfire","frostborne","elvenleaf","celestial","abyssal",
       "gold-forged","necrotic","astral","oceanic","sunfire")
SIDES=(3,4,6,8,10,12,20,50,100)
# Regions tightly follow the painted GOLD number on each canonical die;
# avoid the surrounding metallic vertices and fixed numbers on side faces.
ROI={
 3:(.51,.44,.75,.80),4:(.38,.36,.61,.65),6:(.36,.35,.62,.68),
 8:(.37,.31,.64,.68),10:(.35,.29,.69,.65),12:(.36,.35,.66,.66),
 20:(.42,.42,.69,.73),50:(.35,.43,.66,.72),100:(.32,.40,.70,.73)
}
STATIC_HASH="fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

ELLIPSES={
 3:(.63,.62,.20,.22),4:(.50,.52,.17,.23),6:(.50,.51,.20,.235),
 8:(.50,.49,.20,.25),10:(.50,.50,.18,.18),12:(.50,.49,.23,.28),
 20:(.57,.535,.15,.13),50:(.50,.53,.24,.255),100:(.50,.52,.285,.27)
}
def clean_number(path,sides):
    with Image.open(path) as img:
        rgb=np.asarray(img.convert("RGB"))
    h,w=rgb.shape[:2]
    x0,y0,x1,y1=ROI[sides]
    xx0,yy0,xx1,yy1=[int(v*sz) for v,sz in zip((x0,y0,x1,y1),(w,h,w,h))]
    yy,xx=np.mgrid[0:h,0:w]
    # D10 and D20 have an individually painted central facet which can be
    # repaired precisely using neighbor texture without touching metal trim.
    if sides in (10,20):
        r,g,b=[rgb[:,:,i].astype(np.float32) for i in range(3)]
        if sides==10:
            mask=np.zeros((h,w),dtype=np.uint8)
            cv2.rectangle(mask,(xx0,yy0),(xx1,yy1),255,-1)
            radius=8
        else:
            region=(xx>=xx0)&(xx<=xx1)&(yy>=yy0)&(yy<=yy1)
            gilt=region&(r>115)&(g>85)&(r>g*1.07)&(g>b*1.05)&(((r+g)*.5)>b*1.20)
            mask=cv2.dilate(np.uint8(gilt)*255,
                            cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
            radius=5
        if int((mask>0).sum())<25:
            raise RuntimeError("Could not identify static numeral "+str(path))
        bgr=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
        out=cv2.cvtColor(cv2.inpaint(bgr,mask,radius,cv2.INPAINT_TELEA),
                         cv2.COLOR_BGR2RGB)
        return Image.fromarray(out,"RGB"),int((mask>0).sum())

    # Other canonical geometric dice have thick painted numbers with shadows.
    # RGB threshold inpainting leaves recognizable ghost numbers beneath new
    # results. Restore a FACET-COLOURED center using neighbouring violet/skin
    # pixels and a feathered radial matte INSIDE the painted face. This is part
    # of the still image (not a flat CSS plate) and is composited after roll.
    cx,cy,rx,ry=ELLIPSES[sides]
    distance=np.sqrt(((xx/w-cx)/rx)**2+((yy/h-cy)/ry)**2)
    alpha=np.clip((1.0-distance)/.22,0.0,1.0).astype(np.float32)
    R,G,B=[rgb[:,:,i].astype(np.float32) for i in range(3)]
    ring=(distance>.83)&(distance<1.18)&(R<170)&(G<120)&(B<210)&(R>12)
    if int(ring.sum())<30:
        raise RuntimeError("Insufficient neighboring facet color "+str(path))
    color=np.median(rgb[ring],axis=0).astype(np.float32)
    delta=(xx/w-cx)*11+(cy-yy/h)*13
    fill=np.empty((h,w,3),dtype=np.float32)
    for channel in range(3):
        fill[:,:,channel]=color[channel]+delta*(1.5 if channel==2 else 1.0)
    output=rgb.astype(np.float32)*(1-alpha[:,:,None])+fill*alpha[:,:,None]
    output=np.uint8(np.clip(output,0,255))
    return Image.fromarray(output,"RGB"),int((alpha>.01).sum())

def main():
    frozen=ART/"exact-store/roll/astral-original.gif"
    if sha(frozen)!=STATIC_HASH:raise RuntimeError("Owner-approved GIF changed")
    folder=ART/"test179-clean-faces"
    report=[]
    for skin in SKINS:
        for sides in SIDES:
            source=(ART/"exact-store/roll"/(skin+"-still.webp") if sides==20 else
                    ART/"test169-dice"/skin/("d"+str(sides)+".webp"))
            if not source.is_file():raise RuntimeError("Missing illustrated gameplay die "+str(source))
            clean,count=clean_number(source,sides)
            output=folder/skin/("d"+str(sides)+".webp")
            output.parent.mkdir(parents=True,exist_ok=True)
            clean.save(output,format="WEBP",quality=97,method=6)
            report.append({"skin":skin,"sides":sides,"source_hash":sha(source),"number_pixels_replaced":count})
    path=DIST/"test171-gameplay-toss.js"
    js=path.read_text(encoding="utf8")
    old="art.src=getArt(slug,geometryFor(die),false);"
    new="art.src='art/test179-clean-faces/'+slug+'/d'+geometryFor(die)+'.webp';"
    if js.count(old)!=1 or "test179-true-face" not in js:
        raise RuntimeError("Unexpected gameplay roller; refuse unsafe static-number removal")
    js=js.replace(old,new,1)
    path.write_text(js,encoding="utf8")
    if sha(frozen)!=STATIC_HASH:raise RuntimeError("Protected Store GIF mutated")
    out=ROOT/"preview-output"
    out.mkdir(exist_ok=True)
    (out/"179-numberless-gameplay-art-report.json").write_text(json.dumps({
        "result":"90 masked, illustrated settled dice with the actual rolled numeral layered live",
        "original_store_gif_sha256":STATIC_HASH,"assets":report
    },indent=2))
    print("Test179: 90 original selected-skin settled dice have fixed numeral removed; dynamic result now overlays illustration without an opaque square/badge. GIF/RNG remain unchanged.")

if __name__=="__main__":main()
