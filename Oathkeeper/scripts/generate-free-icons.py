#!/usr/bin/env python3
"""Create CENTERED native launcher assets from the ten approved store artworks.

The selectable Android aliases use adaptive icons on Android 8+ instead of
passing full-bleed square bitmaps to a Samsung/Pixel launcher mask. This keeps
the entire design within the adaptive safe zone. iOS receives the matching
centered layout, and older Android versions receive padded legacy PNGs.
The original store previews remain untouched and the original launcher icon
is still the default (see repair-default-launcher.py).
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageOps, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web/public/art/store-icons"
RES = ROOT / "android/app/src/main/res"
ANDROID = RES / "mipmap-nodpi"
ADAPTIVE = RES / "mipmap-anydpi-v26"
IOS = ROOT / "ios/App/App/Assets.xcassets"
MASTER_SIZE = 1024
ADAPTIVE_SIZE = 432
# Keep image inside Android's central 72/108dp safe zone, with room for masks.
SAFE_ART_RATIO = 0.60
ICONS = [(1,"moonlit-citadel"),(2,"ember-dragon"),(4,"lionheart-shield"),
         (5,"shadow-mage"),(6,"arcane-chalice"),(7,"astral-d20"),
         (8,"twin-battleaxes"),(11,"crystal-spires"),(12,"steel-sentinel"),
         (14,"sapphire-worldtree")]

# The original Store assets include fragments of adjacent concept-board cells
# and, in some designs, cropped caption glyphs. Clean each approved source
# independently. Values are (left, top, right, bottom), fractions of source.
# Never derive all ten launcher icons from one shared image or concept sheet.
SOURCE_CROPS = {
    1: (0, 0, 1, 1),
    2: (0, 0, 1, 1),
    4: (.035, 0, .995, .962),
    5: (.030, 0, .995, .966),
    6: (.030, 0, .995, .966),
    7: (0, 0, 1, 1),
    8: (.027, 0, .990, .940),
    11: (.041, 0, .997, .940),
    12: (.041, 0, .997, .940),
    14: (.041, 0, .997, .940),
}

def normalized_art(source, number):
    width, height = source.size
    if width < 256 or height < 256:
        raise ValueError(f"Approved launcher art is too small: {source.size}")
    if number not in SOURCE_CROPS:
        raise ValueError(f"Missing dedicated source crop for icon {number}")
    l, t, r, b = SOURCE_CROPS[number]
    clean = source.convert("RGB").crop((
        round(l * width), round(t * height),
        round(r * width), round(b * height)))
    # Pad rather than center-crop so neither a sword tip nor a gold border is cut.
    # Each distinct cleaned image is also the EXACT art used in the Store preview.
    return ImageOps.pad(clean, (MASTER_SIZE, MASTER_SIZE),
                        method=Image.Resampling.LANCZOS,
                        color=(8, 13, 27), centering=(.5, .5))

def backdrop(art, side):
    # Use color from the center of the matching illustration, not a scaled,
    # repeated gold border. The latter causes a visible second, off-center rim.
    inset = round(art.width * .14)
    interior = art.crop((inset, inset, art.width - inset, art.height - inset))
    background = interior.resize((side, side), Image.Resampling.LANCZOS)
    background = background.filter(ImageFilter.GaussianBlur(max(8, side // 7)))
    return Image.blend(background, Image.new("RGB", (side, side),
                                            (8, 13, 27)), .78).convert("RGBA")

def centered_overlay(art, canvas_side, fraction):
    picture_side = round(canvas_side * fraction)
    picture = art.resize((picture_side, picture_side),
                         Image.Resampling.LANCZOS).convert("RGBA")
    # The original Store art already has its OWN rounded gold frame. Applying
    # another rounded-rectangle alpha mask clips or doubles that gold border.
    foreground = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    offset = (canvas_side - picture_side) // 2
    foreground.alpha_composite(picture, (offset, offset))
    bounds = foreground.getbbox()
    assert bounds and abs((bounds[0] + bounds[2]) - canvas_side) <= 1
    assert abs((bounds[1] + bounds[3]) - canvas_side) <= 1
    return foreground

def make_icon(number, slug):
    name = f"oathkeeper_icon_{number:02d}"
    source = WEB / f"icon-{number:02d}.webp"
    if not source.is_file():
        raise FileNotFoundError(f"Missing approved art: {slug} ({source})")
    with Image.open(source) as loaded:
        art = normalized_art(loaded, number)
    # Save an individual cleaned Store mockup from precisely this same source.\n    # Both native launcher and Store preview use these pixels, never a shared icon.\n    art.resize((512, 512), Image.Resampling.LANCZOS).save(\n        WEB / f"launcher-{number:02d}.webp", "WEBP", quality=96, method=6)\n    ANDROID.mkdir(parents=True, exist_ok=True)
    ADAPTIVE.mkdir(parents=True, exist_ok=True)

    # Android 8+ uses these resources from mipmap-anydpi-v26. The launcher
    # chooses its shape, not the app; the full illustration stays centered.
    foreground = centered_overlay(art, ADAPTIVE_SIZE, SAFE_ART_RATIO)
    foreground.save(ANDROID / f"{name}_foreground.png", "PNG", optimize=True)
    backdrop(art, ADAPTIVE_SIZE).save(ANDROID / f"{name}_background.png", "PNG", optimize=True)
    xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
           f'    <background android:drawable="@mipmap/{name}_background" />\n'
           f'    <foreground android:drawable="@mipmap/{name}_foreground" />\n'
           '</adaptive-icon>\n')
    (ADAPTIVE / f"{name}.xml").write_text(xml, encoding="utf-8")

    # Legacy Android (< API 26): preserve centered artwork and rounded edges.
    legacy = backdrop(art, 256)
    legacy.alpha_composite(centered_overlay(art, 256, .80))
    outer_mask = Image.new("L", (256, 256), 0)
    ImageDraw.Draw(outer_mask).rounded_rectangle((0, 0, 255, 255),
                                                radius=46, fill=255)
    legacy.putalpha(outer_mask)
    legacy.save(ANDROID / f"{name}.png", "PNG", optimize=True)

    # iOS automatically masks app icons. The picture is centered in a square
    # canvas with a soft extension of the SAME approved artwork around it.
    ios_icon = backdrop(art, MASTER_SIZE)
    ios_icon.alpha_composite(centered_overlay(art, MASTER_SIZE, .78))
    target = IOS / f"AppIcon-{number:02d}.appiconset"
    target.mkdir(parents=True, exist_ok=True)
    ios_icon.convert("RGB").save(target / f"AppIcon-{number:02d}.png", "PNG", optimize=True)

    if foreground.getbbox() is None:
        raise RuntimeError(f"Empty adaptive foreground: {name}")
    return hashlib.sha256(art.tobytes()).hexdigest()

def main():
    if set(SOURCE_CROPS) != {number for number, _ in ICONS}:\n        raise RuntimeError("Source crop mapping must cover all approved icon designs")\n    hashes = [make_icon(*item) for item in ICONS]
    if len(set(hashes)) != len(ICONS):
        raise RuntimeError("Approved icon art must contain ten distinct designs")
    generated = list(ADAPTIVE.glob("oathkeeper_icon_*.xml"))
    if len(generated) < len(ICONS):
        raise RuntimeError("One or more adaptive launcher icons are missing")
    print("Prepared 10 distinct cleaned Store previews and matching centered Android/iOS icons; original kept")

if __name__ == "__main__":
    main()
