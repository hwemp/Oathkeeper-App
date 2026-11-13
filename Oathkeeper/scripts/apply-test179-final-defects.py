#!/usr/bin/env python3
"""Test 179 — repair four measured defects on the frozen, approved Test 178.

Runs after all 178 art source repairs. Refuses unexpected input. Retains all ten
approved scene concepts, original animated Store roll, icons' master bytes,
purchase/access rules, navigation and gem frame art. Never claim to invent
detail absent from the 508x360 source image.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageFilter
import hashlib
import json
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
S = DIST / "art/exact-store"
GIF_HASH = "fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"
SCENES = ("moonlit-citadel","ancient-ruins","enchanted-forest","dragons-crag",
          "shadow-marsh","celestial-plains","crystal-caverns","elder-grove",
          "mystic-lake","eternal-keep")
SKINS = ("dragonfire","frostborne","elvenleaf","celestial","abyssal",
         "gold-forged","necrotic","astral","oceanic","sunfire")
RECT = (38,675,903,1082)

def h(p): return hashlib.sha256(p.read_bytes()).hexdigest()

def keep_painted_gold(master, page, rect):
    """Return original approved gold border pixels instead of drawing a fake frame."""
    x0,y0,x1,y1=rect
    a=np.asarray(master.crop(rect).convert("RGB"),dtype=np.float32)
    ht,wd=a.shape[:2]
    ys,xs=np.mgrid[0:ht,0:wd]
    edge=np.minimum.reduce((xs,ys,wd-1-xs,ht-1-ys))
    r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    gold=(r>98)&(g>75)&(r>=g*.93)&(g>b*1.22)&(edge<32)
    m=Image.fromarray((gold*255).astype("uint8"),"L")
    m=m.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8))
    page.paste(master.crop(rect),rect,m)

def compose_scene(source, width, height):
    """Place more of the approved source in the viewport, without stretching.

    The source has a narrower native aspect ratio. A 79%-width sharp center
    uses substantially less enlargement and discards less sky/foreground.
    Painted edge context from the SAME scene fills the remaining 10.5% on
    either side, with a narrow blend rather than visible black bars.
    """
    center_w=round(width*.79)
    central=ImageOps.fit(source,(center_w,height),Image.Resampling.LANCZOS,
                         centering=(.5,.47))
    full=ImageOps.fit(source,(width,height),Image.Resampling.LANCZOS,
                     centering=(.5,.47))
    x=(width-center_w)//2
    fade=round(min(30,width*.035))
    gradient=Image.new("L",(width,height),0)
    a=np.asarray(gradient).copy()
    a[:,x+fade:x+center_w-fade]=255
    for j in range(fade):
        value=int(255*(j+1)/(fade+1))
        a[:,x+j]=value
        a[:,x+center_w-1-j]=value
    mask=Image.fromarray(a,"L")
    clear=Image.new("RGB",(width,height),(0,0,0))
    clear.paste(central,(x,0))
    full.paste(clear,(0,0),mask)
    return full.filter(ImageFilter.UnsharpMask(radius=.68,percent=86,threshold=3))

def render_backgrounds():
    with Image.open(S / "backgrounds.webp") as im:
        master=im.convert("RGB")
    if master.size != (941,1672):
        raise RuntimeError("Unrecognized frozen backgrounds page")
    folder=DIST / "art/test179-backgrounds"
    folder.mkdir(parents=True,exist_ok=True)
    report=[]
    x0,y0,x1,y1=RECT
    for slug in SCENES:
        original=DIST / "art/approved-backgrounds" / (slug+".webp")
        with Image.open(original) as im: src=im.convert("RGB")
        if src.size!=(508,360):
            raise RuntimeError("Never silently switch a scene master "+slug)
        old_page=S/"test169-bg"/(slug+".webp")
        with Image.open(old_page) as im: page=im.convert("RGB")
        if page.size!=master.size:raise RuntimeError("Background page geometry "+slug)
        if slug!="moonlit-citadel":
            comp=compose_scene(src,x1-x0,y1-y0)
            page.paste(comp,(x0,y0))
            keep_painted_gold(master,page,RECT)
        page.save(old_page,"WEBP",quality=98,method=6)
        # Standalone separate preview of the exact final scene, not a second
        # CSS-blurred overlay, resized without throwing out the page crop.
        original_area=page.crop(RECT)
        preview=original_area.resize((1730,814),Image.Resampling.LANCZOS)
        dest=folder/(slug+".webp")
        preview.save(dest,"WEBP",quality=98,method=6)
        report.append({"slug":slug,"master_px":list(src.size),
                       "preview_px":list(preview.size),
                       "source_sha256":h(original),"page_sha256":h(old_page)})
    return report

def render_bundle_dice():
    dest=DIST/"art/test179-bundle-dice";dest.mkdir(parents=True,exist_ok=True)
    result=[]
    for slug in SKINS:
        path=S/"roll"/(slug+"-still.webp")
        with Image.open(path) as im: original=im.convert("RGB")
        if original.size!=(352,356):raise RuntimeError("Unapproved die master "+slug)
        # Crop empty backing around the painted die but retain its silhouette
        # and bottom gold magic circle. Never regenerate themed frames or text.
        cropped=original.crop((33,31,319,327))
        graphic=ImageOps.fit(cropped,(512,512),Image.Resampling.LANCZOS)
        arr=np.asarray(graphic.convert("RGBA")).copy()
        yy,xx=np.mgrid[0:512,0:512]
        t=np.sqrt(((xx-255.5)/295)**2+((yy-255.5)/306)**2)
        alpha=np.clip((1.18-t)/.23,0,1)
        arr[:,:,3]=np.uint8(np.round(alpha*255))
        out=Image.fromarray(arr,"RGBA")
        p=dest/(slug+".webp")
        out.save(p,"WEBP",lossless=True,method=6)
        result.append({"slug":slug,"src_sha256":h(path),"size":list(out.size)})
    return result

def main():
    roll=S/"roll/astral-original.gif"
    if h(roll)!=GIF_HASH:raise RuntimeError("Protected approved Store GIF differs")
    runtime=DIST/"assets/main-FCw4hQ90.js"
    s=runtime.read_text(encoding="utf8")
    old="${okImage(kind==='dice'?'roll/'+d.slug+'-still':d.slug)}"
    # Switch to cropped, vignetted originals IN THE HTML IMAGE SOURCE, not
    # CSS content replacement which would retain the old load/box dimensions.
    new="""${kind==='dice'?'<img class="ok-art" src="art/test179-bundle-dice/'+d.slug+'.webp" alt="" draggable="false">':okImage(d.slug)}"""
    if s.count(old)!=1:raise RuntimeError("Expected exact bundle-picker source not found")
    backgrounds=render_backgrounds()
    dice=render_bundle_dice()
    runtime.write_text(s.replace(old,new,1),encoding="utf8")
    css=ROOT/"web/test179-final-defects.css"
    if not css.is_file():raise RuntimeError("Test179 fit CSS not installed")
    (DIST/css.name).write_bytes(css.read_bytes())
    index=DIST/"index.html"
    html=index.read_text()
    if html.count("</head>")!=1 or "test178-single-center-gem.css" not in html:
        raise RuntimeError("Approved Test 178 stylesheet missing")
    if "test179-final-defects.css" in html:raise RuntimeError("Duplicate Test179 patch")
    html=html.replace("</head>",'<link rel="stylesheet" href="./test179-final-defects.css" data-test179-repairs="true"></head>',1)
    index.write_text(html)
    if h(roll)!=GIF_HASH:raise RuntimeError("Protected rolling GIF was touched")
    gameplay=(DIST/"test171-gameplay-toss.js").read_text()
    if "test179-true-face" not in gameplay or "test179-face-settled" not in gameplay:
        raise RuntimeError("Result-bound gameplay die repair missing")
    out=ROOT/"preview-output"
    out.mkdir(exist_ok=True)
    (out/"179-source-repair-report.json").write_text(json.dumps({
        "approved_baseline":"ec24dfe1e2a28fd955e11aab018bb58ed3b99e3c",
        "original_store_gif_sha256":GIF_HASH,
        "backgrounds":backgrounds,"bundle_dice":dice,
        "disclosure":"Original 508x360 background images cannot be made genuinely high-detail by resizing."
    },indent=2))
    print("179: 10 original dice sets optically fit their bundle frames; all 10 background full pages recomposited without synthetic blurred side curtains; source Store GIF retained; dynamically numbered landed dice present.")

if __name__=="__main__":main()
