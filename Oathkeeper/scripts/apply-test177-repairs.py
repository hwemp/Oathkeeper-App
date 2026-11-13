#!/usr/bin/env python3
"""TEST 177 source-based repair to the frozen 176 APK package.

Rebuild each FULL Store background page with frame-filling illustrated scenes,
replace the low-resolution thumbnail content (not its gold border), and use
new standalone, fit-to-frame scene resources. Do not alter the Store dice GIF,
Android launcher masters, RNG, purchase logic or frozen Build 144.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import hashlib, shutil
import numpy as np

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
SCENES=("moonlit-citadel","ancient-ruins","enchanted-forest","dragons-crag",
        "shadow-marsh","celestial-plains","crystal-caverns","elder-grove",
        "mystic-lake","eternal-keep")
ROLL_SHA="fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"
FRAME=(38,675,903,1082) # Inner gold frame measured from frozen Store art
XS=(28,215,392,568,746)
YS=(358,526)
TILE=(166,150)

def scene_master(slug):
    src=DIST/"art/approved-backgrounds"/(slug+".webp")
    if not src.is_file():raise RuntimeError("Missing approved concept: "+slug)
    with Image.open(src) as im:
        original=im.convert("RGB")
    if original.size!=(508,360):raise RuntimeError("Unexpected concept source dimensions "+slug)
    # Exactly match the painted gold frame, rather than letterboxing a
    # 508x360 landscape over a blurred enlargement.
    w,h=FRAME[2]-FRAME[0],FRAME[3]-FRAME[1]
    fitted=ImageOps.fit(original,(w*2,h*2),Image.Resampling.LANCZOS,centering=(.5,.5))
    fitted=ImageEnhance.Contrast(fitted).enhance(1.055)
    fitted=fitted.filter(ImageFilter.UnsharpMask(radius=1.05,percent=115,threshold=3))
    return original,fitted

def preserve_gold_edges(original,new,rect,thickness=17):
    # Protect only original painted metallic ornaments at frame edges.
    x0,y0,x1,y1=rect
    raw=np.asarray(original.crop(rect).convert("RGB"),dtype=np.float32)
    old=np.asarray(new.crop(rect).convert("RGB"))
    hh,ww=old.shape[:2]
    ys,xs=np.mgrid[0:hh,0:ww]
    edge=np.minimum.reduce([xs,ys,ww-1-xs,hh-1-ys])
    r,g,b=raw[:,:,0],raw[:,:,1],raw[:,:,2]
    gilt=(r>98)&(g>75)&(r>=g*.93)&(g>b*1.22)&(edge<thickness)
    a=Image.fromarray((gilt*255).astype("uint8"),"L")
    a=a.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    new.paste(Image.composite(original.crop(rect),new.crop(rect),a),rect)

def main():
    gif=DIST/"art/exact-store/roll/astral-original.gif"
    if not gif.is_file() or hashlib.sha256(gif.read_bytes()).hexdigest()!=ROLL_SHA:
        raise RuntimeError("Protected Store preview animation changed")
    orig_page=DIST/"art/exact-store/backgrounds.webp"
    if not orig_page.is_file():raise RuntimeError("Frozen Store frame absent")
    with Image.open(orig_page) as im: base=im.convert("RGB")
    if base.size!=(941,1672):raise RuntimeError("Frozen frame changed")

    output=DIST/"art/test177-backgrounds"
    output.mkdir(parents=True,exist_ok=True)
    originals={}
    masters={}
    for slug in SCENES:
        originals[slug],masters[slug]=scene_master(slug)
        masters[slug].save(output/(slug+".webp"),format="WEBP",quality=96,method=6)
        with Image.open(output/(slug+".webp")) as im:
            assert im.size==(1730,814),(slug,im.size)

    # Replace existing per-selection page artwork IN PLACE. The rendered
    # application uses exactly these paths. None of the old blurred margins
    # can survive, including on previously repaired TEST 169 pages.
    for slug in SCENES:
        path=DIST/"art/exact-store/test169-bg"/(slug+".webp")
        if not path.is_file():raise RuntimeError("Existing per-scene page missing "+slug)
        with Image.open(path) as im: page=im.convert("RGB")
        if page.size!=base.size:raise RuntimeError("Incorrect page geometry "+slug)
        rect=FRAME
        scene=masters[slug].resize((rect[2]-rect[0],rect[3]-rect[1]),Image.Resampling.LANCZOS)
        # Preserve the original high-detail moonlit default backdrop (where
        # its own authored frame is superior to the 508px separate thumbnail).
        if slug!="moonlit-citadel":
            page.paste(scene,rect)
            preserve_gold_edges(base,page,rect,31)
        # Every thumbnail is a SCENE-FILLING ARTWORK crop inside the original
        # 10 individual gold frames, rather than small black-bordered tiles.
        for i,name in enumerate(SCENES):
            x,y=XS[i%5],YS[i//5]
            interior=(x+9,y+9,x+TILE[0]-9,y+TILE[1]-9)
            img=ImageOps.fit(originals[name],
                  (interior[2]-interior[0],interior[3]-interior[1]),
                  Image.Resampling.LANCZOS,centering=(.5,.48))
            img=img.filter(ImageFilter.UnsharpMask(radius=.75,percent=105,threshold=2))
            page.paste(img,interior)
            preserve_gold_edges(base,page,
                (x,y,x+TILE[0],y+TILE[1]),11)
        page.save(path,"WEBP",quality=97,method=6)
        with Image.open(path) as check:
            if check.size!=(941,1672):raise RuntimeError("Damaged full-size page "+slug)
    # Patch only the ART-facing CSS, not the Android launcher icon resources.
    css=DIST/"test177-repairs.css"
    src=ROOT/"web/test177-repairs.css"
    if not src.is_file():raise RuntimeError("New frame-fit stylesheet missing")
    theme=src.read_text()
    for slug in SCENES:
        theme+="\n.ok-exact-store [data-store-background=\""+slug+"\"]::before{background-image:url(\"./art/test177-backgrounds/"+slug+".webp\")!important;}\n"
    css.write_text(theme,encoding="utf-8")
    # Install AFTER all old visual audits, and never link another stylesheet
    # that can affect the protected Store's 12-frame rolling GIF.
    index=DIST/"index.html"
    html=index.read_text()
    if html.count("</head>")!=1 or "test177-repairs.css" in html:raise RuntimeError("Unexpected index state")
    html=html.replace("</head>",'<link rel="stylesheet" href="./test177-repairs.css" data-test177-frame-fit="true"></head>',1)
    index.write_text(html)
    print("TEST 177: 10 replacement standalone scene images (1730x814), ten reconstructed full-page Store artworks, frame-fitting icon/text CSS. Store GIF SHA preserved.")

if __name__=="__main__":main()
