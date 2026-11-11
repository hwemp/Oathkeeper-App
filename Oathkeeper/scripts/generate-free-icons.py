#!/usr/bin/env python3
"""Generate ten matched, individually rendered Store/Android/iOS launcher assets.

Source artwork is a 1254px square WebP per approved design. Android 8+ has
separate full-bleed blurred backgrounds and softly feathered inset foregrounds:
no baked-in gold square rim is masked into a second Samsung/Pixel squircle.
Original/default Oathkeeper launcher is deliberately untouched.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web/public/art/store-icons"
RES = ROOT / "android/app/src/main/res"
ANDROID = RES / "mipmap-nodpi"
ADAPTIVE = RES / "mipmap-anydpi-v26"
IOS = ROOT / "ios/App/App/Assets.xcassets"
ADAPTIVE_SIZE = 432
# Android's central circular safe zone is ~72 / 108. Art is inset and feathered.
SAFE_ART_RATIO = .665
CLEAN_CROP_RATIO = .085
ICONS = [(1,"moonlit-citadel"),(2,"ember-dragon"),(4,"lionheart-shield"),
         (5,"shadow-mage"),(6,"arcane-chalice"),(7,"astral-d20"),
         (8,"twin-battleaxes"),(11,"crystal-spires"),(12,"steel-sentinel"),
         (14,"sapphire-worldtree")]


def scaled(image, size):
    return image.resize((size, size), Image.Resampling.LANCZOS)


def remove_baked_frame(source):
    # New HD source masters carry exactly one thin gold frame. Do not allow
    # that square frame to show inside a system-shaped adaptive desktop icon.
    w, h = source.size
    if w != h or w < 1024:
        raise ValueError(f"Expected square HD master >=1024, got {source.size}")
    margin = round(w * CLEAN_CROP_RATIO)
    return source.crop((margin, margin, w-margin, h-margin)).convert("RGB")


def adaptive_layers(source):
    art = remove_baked_frame(source)
    # A full-bleed background that tolerates system launcher masks.
    base = scaled(art, ADAPTIVE_SIZE).filter(
        ImageFilter.GaussianBlur(round(ADAPTIVE_SIZE * .12)))
    # Emphasize readable detail in foreground, with no visible square boundary.
    picture_size = round(ADAPTIVE_SIZE * SAFE_ART_RATIO)
    picture = scaled(art, picture_size).convert("RGBA")
    feather = max(10, round(picture_size * .12))
    mask = Image.new("L", (picture_size+2*feather, picture_size+2*feather), 0)
    ImageDraw.Draw(mask).rectangle(
        (feather, feather, feather+picture_size-1, feather+picture_size-1), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(round(feather * .65)))
    mask = mask.crop((feather, feather, feather+picture_size, feather+picture_size))
    picture.putalpha(mask)
    fg = Image.new("RGBA", (ADAPTIVE_SIZE, ADAPTIVE_SIZE), (0,0,0,0))
    offset = (ADAPTIVE_SIZE-picture_size)//2
    fg.alpha_composite(picture, (offset, offset))
    assert fg.getbbox() is not None, "Adaptive foreground is empty"
    return base.convert("RGBA"), fg


def make_icon(number, slug):
    src = WEB / f"icon-{number:02d}.webp"
    if not src.is_file():
        raise FileNotFoundError(f"Missing unique approved icon {slug}: {src}")
    with Image.open(src) as original:
        art = original.convert("RGB")
    if art.size != (1254, 1254):
        raise ValueError(f"Expected 1254px individual HD art for {slug}: {art.size}")
    name = f"oathkeeper_icon_{number:02d}"
    WEB.mkdir(parents=True, exist_ok=True)
    ANDROID.mkdir(parents=True, exist_ok=True)
    ADAPTIVE.mkdir(parents=True, exist_ok=True)
    scaled(art, 512).save(WEB / f"launcher-{number:02d}.webp", "WEBP", quality=95, method=5)
    bg, fg = adaptive_layers(art)
    bg.save(ANDROID / f"{name}_background.png", "PNG", optimize=True)
    fg.save(ANDROID / f"{name}_foreground.png", "PNG", optimize=True)
    xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
           f'    <background android:drawable="@mipmap/{name}_background" />\n'
           f'    <foreground android:drawable="@mipmap/{name}_foreground" />\n'
           '</adaptive-icon>\n')
    (ADAPTIVE / f"{name}.xml").write_text(xml, encoding="utf-8")
    # For older Android, no adaptive mask exists. Retain a single original rim.
    legacy = scaled(art, 256).convert("RGBA")
    mask = Image.new("L", (256, 256), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 255, 255), radius=48, fill=255)
    legacy.putalpha(mask)
    legacy.save(ANDROID / f"{name}.png", "PNG", optimize=True)
    dest = IOS / f"AppIcon-{number:02d}.appiconset"
    dest.mkdir(parents=True, exist_ok=True)
    scaled(art, 1024).save(dest / f"AppIcon-{number:02d}.png", "PNG", optimize=True)
    return hashlib.sha256(art.tobytes()).hexdigest()


def main():
    digests = [make_icon(*item) for item in ICONS]
    if len(digests) != len(set(digests)):
        raise RuntimeError("All 10 icon designs must have distinct individual resources")
    if len(list(ADAPTIVE.glob("oathkeeper_icon_*.xml"))) != len(ICONS):
        raise RuntimeError("Ten adaptive XML resources must exist")
    print("Ten individual HD icons regenerated for Store, Android adaptive/legacy and iOS; default launcher preserved")


if __name__ == "__main__":
    main()
