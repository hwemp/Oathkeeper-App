#!/usr/bin/env python3
"""Build Oathkeeper's 10 free launcher-icon resources from existing packaged art.

The original AppIcon and Android ic_launcher are NEVER modified. Each output has
its own underlying fantasy artwork and a matching emblem; no gears appear.
Requires Pillow: python3 -m pip install Pillow.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "web/public/art/store-backgrounds"
WEB = ROOT / "web/public/art/store-icons"
ANDROID = ROOT / "android/app/src/main/res/mipmap-nodpi"
IOS = ROOT / "ios/App/App/Assets.xcassets"
SIZE = 1024

# The selection numbers are taken from the approved 20-icon concept board.
ICONS = [
    (1,  "moonlit-citadel", "moonlit-citadel", (145, 203, 254)),
    (2,  "ember-dragon", "dragons-crag", (255, 109, 38)),
    (4,  "lionheart-shield", "eternal-keep", (255, 206, 104)),
    (5,  "shadow-mage", "shadow-marsh", (82, 188, 255)),
    (6,  "arcane-chalice", "crystal-caverns", (92, 215, 255)),
    (7,  "astral-d20", "celestial-plains", (190, 101, 255)),
    (8,  "twin-battleaxes", "dragons-crag", (244, 187, 103)),
    (11, "crystal-spires", "crystal-caverns", (152, 98, 255)),
    (12, "steel-sentinel", "ancient-ruins", (230, 194, 122)),
    (14, "sapphire-worldtree", "elder-grove", (74, 222, 244)),
]

def middle_crop(image):
    image = image.convert("RGB")
    w, h = image.size
    side = min(w, h)
    return image.crop(((w-side)//2, (h-side)//2, (w+side)//2, (h+side)//2)).resize((SIZE, SIZE), Image.Resampling.LANCZOS)

def emblem(d, number, accent):
    a = tuple(accent)
    gold = (252, 207, 125)
    dark = (13, 17, 36)
    line = (238, 233, 208)
    if number == 1:
        d.ellipse((540, 100, 830, 390), fill=(165, 195, 230), outline=line, width=14)
        d.ellipse((485, 75, 740, 352), fill=dark)
        for x, y in [(340,180),(420,360),(790,470),(215,390),(860,205)]:
            d.ellipse((x-8,y-8,x+8,y+8),fill=gold)
    elif number == 2:
        # Ornamental dragon's sweeping head and flame.
        d.polygon([(184,680),(350,425),(500,325),(710,270),(628,386),(853,461),
                   (601,500),(739,600),(484,555),(314,735)],fill=(40,12,22),outline=a,width=22)
        d.polygon([(440,329),(505,179),(559,306),(669,193),(643,366)],fill=(111,23,23),outline=gold,width=10)
        d.ellipse((620,390,656,428),fill=(255,188,51))
        d.polygon([(691,490),(890,441),(787,506),(923,528),(756,562)],
                  fill=(255,112,32),outline=gold,width=8)
    elif number == 4:
        d.polygon([(310,140),(714,140),(753,506),(650,733),(510,842),(365,725),(265,506)],
                  fill=(22,32,54),outline=gold,width=25)
        d.ellipse((385,300,635,562),fill=(169,111,49),outline=gold,width=22)
        for dx,dy in [(-90,32),(90,32),(-62,112),(62,112),(-108,-48),(108,-48)]:
            d.ellipse((510+dx-55,405+dy-55,510+dx+55,405+dy+55),fill=(201,155,73),outline=gold,width=8)
        d.ellipse((450,385,495,424),fill=dark); d.ellipse((530,385,575,424),fill=dark)
        d.polygon([(491,448),(529,448),(510,478)],fill=(23,21,31))
    elif number == 5:
        d.polygon([(164,816),(270,387),(363,213),(500,139),(643,205),(747,384),(862,816)],
                  fill=(19,27,48),outline=a,width=24)
        d.ellipse((341,286,658,630),fill=(8,16,33))
        d.polygon([(276,386),(500,162),(715,389),(638,299),(359,299)],
                  fill=(30,48,78),outline=a,width=14)
        d.ellipse((411,433,452,459),fill=(118,222,255))
        d.ellipse((553,433,594,459),fill=(118,222,255))
    elif number == 6:
        d.ellipse((235,244,788,484),fill=(35,72,98),outline=gold,width=23)
        d.polygon([(243,355),(780,355),(683,583),(523,654),(343,583)],
                  fill=(34,94,136),outline=gold,width=20)
        d.polygon([(474,645),(550,645),(548,803),(693,851),(323,851),(474,803)],
                  fill=(119,80,45),outline=gold,width=19)
        d.polygon([(511,385),(591,484),(511,579),(432,484)],
                  fill=(76,225,253),outline=line,width=13)
    elif number == 7:
        points=[(508,138),(748,287),(827,562),(514,850),(196,563),(266,287)]
        d.polygon(points,fill=(58,30,112),outline=a,width=29)
        for i,j in [(0,2),(0,4),(1,3),(5,3),(2,4),(1,5)]:
            d.line((points[i],points[j]),fill=(224,155,255),width=15)
        try: font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",195)
        except OSError: font=ImageFont.load_default()
        d.text((507,490),"20",fill=(247,220,183),font=font,anchor="mm",stroke_width=3,stroke_fill=dark)
    elif number == 8:
        for flip in [-1,1]:
            if flip<0:
                d.line([(312,819),(698,260)],fill=(81,48,35),width=56)
                d.line([(312,819),(698,260)],fill=gold,width=9)
                d.polygon([(603,186),(818,301),(686,505),(667,366),(530,339)],
                          fill=(131,142,160),outline=gold,width=20)
            else:
                d.line([(709,819),(323,260)],fill=(81,48,35),width=56)
                d.line([(709,819),(323,260)],fill=gold,width=9)
                d.polygon([(418,186),(205,301),(335,505),(357,366),(492,339)],
                          fill=(131,142,160),outline=gold,width=20)
    elif number == 11:
        shards=[[(210,723),(300,355),(406,632),(355,840)],
                [(352,811),(512,122),(654,813)],
                [(605,671),(714,303),(836,727),(715,858)]]
        for p in shards:
            d.polygon(p,fill=(106,51,172),outline=(200,138,255),width=19)
        d.polygon([(512,132),(512,812),(395,720)],fill=(87,199,255),outline=a,width=12)
    elif number == 12:
        d.ellipse((266,185,748,834),fill=(41,49,65),outline=gold,width=26)
        d.polygon([(307,378),(706,378),(650,653),(359,653)],fill=(9,14,26),outline=(166,176,197),width=18)
        d.polygon([(469,160),(547,160),(557,792),(462,792)],fill=(165,148,115),outline=gold,width=15)
        d.line((300,413,716,413),fill=gold,width=21)
    elif number == 14:
        d.line([(509,817),(507,407)],fill=(73,101,92),width=92)
        for start,end in [((504,485),(273,297)),((509,419),(730,271)),((503,573),(805,427)),((502,588),(200,421))]:
            d.line([start,end],fill=(64,119,133),width=41)
        for x,y,r in [(501,280,190),(283,345,133),(720,339,148),(592,195,114),(391,222,124),(805,405,96)]:
            d.ellipse((x-r,y-r,x+r,y+r),fill=(26,94,140),outline=(83,205,253),width=10)
        for x,y in [(350,290),(490,150),(690,327),(760,420),(485,341)]:
            d.ellipse((x-18,y-18,x+18,y+18),fill=(154,246,255))

def build(number, slug, source, accent):
    path = SOURCE / (source + ".webp")
    if not path.is_file(): raise FileNotFoundError(f"Missing icon art: {path}")
    original = middle_crop(Image.open(path))
    original = ImageEnhance.Color(original).enhance(1.22)
    dark_overlay = Image.new("RGBA",(SIZE,SIZE),(7,10,23,90))
    icon = Image.alpha_composite(original.convert("RGBA"),dark_overlay)
    detail = Image.new("RGBA",(SIZE,SIZE),(0,0,0,0))
    d=ImageDraw.Draw(detail)
    # Gold-framed rounded square to keep a coherent fantasy icon collection.
    d.rounded_rectangle((35,35,989,989),radius=160,outline=(239,191,109,255),width=20)
    d.rounded_rectangle((53,53,971,971),radius=147,outline=(108,77,43,255),width=9)
    emblem(d,number,accent)
    icon=Image.alpha_composite(icon,detail).convert("RGB")
    WEB.mkdir(parents=True,exist_ok=True)
    ANDROID.mkdir(parents=True,exist_ok=True)
    icon.resize((512,512),Image.Resampling.LANCZOS).save(WEB/f"icon-{number:02d}.webp","WEBP",quality=86,method=5)
    icon.resize((256,256),Image.Resampling.LANCZOS).save(ANDROID/f"oathkeeper_icon_{number:02d}.png","PNG",optimize=True)
    target=IOS/f"AppIcon-{number:02d}.appiconset"
    target.mkdir(parents=True,exist_ok=True)
    icon.save(target/f"AppIcon-{number:02d}.png","PNG",optimize=True)
    return hashlib.sha256(icon.tobytes()).hexdigest()

def main():
    hashes=[build(*icon) for icon in ICONS]
    if len(set(hashes))!=10:raise RuntimeError("Icon generation did not produce 10 distinct images")
    print("Generated 10 unique free app icons for web, Android, and iOS")

if __name__=="__main__":main()
