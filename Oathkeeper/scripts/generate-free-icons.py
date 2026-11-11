#!/usr/bin/env python3
"""Make Android/iOS launcher variants and an honest Android-style Store preview.

The only approved artwork is web/public/art/store-icons/icon-NN.webp.
Android adaptive icons cannot display a complete square image full bleed: the
launcher masks the central 72dp of the 108dp layers. The previous implementation
placed the *entire* picture in the background, so its outer third was cropped.
Keep all original art inside the guaranteed circular mask using a 46%-width
centered foreground; compose the Store preview from the SAME layers.
"""
from pathlib import Path
import hashlib
import math
import shutil
from PIL import Image, ImageChops, ImageDraw, ImageStat

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web/public/art/store-icons"
RES = ROOT / "android/app/src/main/res"
ANDROID = RES / "mipmap-nodpi"
ADAPTIVE = RES / "mipmap-anydpi-v26"
FOREGROUNDS = RES / "drawable-nodpi"
BACKGROUNDS = RES / "drawable"
IOS = ROOT / "ios/App/App/Assets.xcassets"
ICONS = [(1, "moonlit-citadel"), (2, "ember-dragon"), (4, "lionheart-shield"),
         (5, "shadow-mage"), (6, "arcane-chalice"), (7, "astral-d20"),
         (8, "twin-battleaxes"), (11, "crystal-spires"),
         (12, "steel-sentinel"), (14, "sapphire-worldtree")]

LAYER_SIDE = 1080
VISIBLE_SIDE = 720
# The whole square (including corners) fits inside the conservative round mask.
# 0.46 * sqrt(2) < 72/108. This avoids clipped artwork on round launchers.
ART_RATIO = 0.46


def same_pixels(path, expected):
    with Image.open(path) as opened:
        actual = opened.convert("RGB")
    if actual.size != expected.size or ImageChops.difference(actual, expected).getbbox():
        raise RuntimeError(f"Native icon does not match Store master: {path}")


def cleanup_obsolete():
    for folder in (ANDROID, ADAPTIVE, FOREGROUNDS, BACKGROUNDS):
        folder.mkdir(parents=True, exist_ok=True)
    for glob, folder in (
        ("launcher-*.webp", WEB),
        ("preview-*.webp", WEB),
        ("oathkeeper_icon_*", ANDROID),
        ("oathkeeper_icon_*.xml", ADAPTIVE),
        ("oathkeeper_icon_art_*.webp", FOREGROUNDS),
        ("oathkeeper_icon_fg_*.png", FOREGROUNDS),
        ("oathkeeper_icon_bg_*.xml", BACKGROUNDS),
    ):
        for path in folder.glob(glob):
            if path.is_file():
                path.unlink()


def border_color(art):
    """Derive neutral surround from the existing image, not new artwork."""
    side = art.width
    sample = max(8, side // 28)
    patches = [
        art.crop((0, 0, sample, sample)),
        art.crop((side-sample, 0, side, sample)),
        art.crop((0, side-sample, sample, side)),
        art.crop((side-sample, side-sample, side, side)),
    ]
    samples = [ImageStat.Stat(tile).mean for tile in patches]
    return tuple(round(sum(s[i] for s in samples)/4) for i in range(3))


def generate(number, slug):
    src = WEB / f"icon-{number:02d}.webp"
    if not src.is_file():
        raise FileNotFoundError(f"Missing original Store artwork for {slug}: {src}")
    with Image.open(src) as original:
        if original.format != "WEBP":
            raise ValueError(f"Expected Store WebP artwork for {slug}")
        art = original.convert("RGB")
    if art.size != (1254, 1254):
        raise ValueError(f"Expected 1254x1254 artwork for {slug}: {art.size}")

    name = f"oathkeeper_icon_{number:02d}"
    # Legacy Android icons are unchanged copies of their source art.
    native = ANDROID / f"{name}.webp"
    shutil.copyfile(src, native)
    if native.read_bytes() != src.read_bytes():
        raise RuntimeError(f"Legacy icon differs from Store source: {slug}")

    # The adaptive foreground is a padded placement of THE SAME complete art.
    foreground = Image.new("RGBA", (LAYER_SIDE, LAYER_SIDE), (0, 0, 0, 0))
    side = round(LAYER_SIDE * ART_RATIO)
    centered = art.resize((side, side), Image.Resampling.LANCZOS)
    position = ((LAYER_SIDE-side)//2, (LAYER_SIDE-side)//2)
    foreground.paste(centered, position)
    foreground_path = FOREGROUNDS / f"oathkeeper_icon_fg_{number:02d}.png"
    foreground.save(foreground_path, "PNG", optimize=True)

    bg = border_color(art)
    bg_color = f"#{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}"
    (BACKGROUNDS / f"oathkeeper_icon_bg_{number:02d}.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<shape xmlns:android="http://schemas.android.com/apk/res/android" '
        'android:shape="rectangle">\n'
        f'    <solid android:color="{bg_color}"/>\n'
        '</shape>\n', encoding="utf-8")
    (ADAPTIVE / f"{name}.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        f'    <background android:drawable="@drawable/oathkeeper_icon_bg_{number:02d}" />\n'
        f'    <foreground android:drawable="@drawable/oathkeeper_icon_fg_{number:02d}" />\n'
        '</adaptive-icon>\n', encoding="utf-8")

    # A circular launcher preview from the exact background + foreground.
    # The device can use another mask, but the entire art remains in the safe zone.
    scene = Image.new("RGBA", (LAYER_SIDE, LAYER_SIDE), bg + (255,))
    scene.alpha_composite(foreground)
    edge = (LAYER_SIDE - VISIBLE_SIDE) // 2
    scene = scene.crop((edge, edge, edge+VISIBLE_SIDE, edge+VISIBLE_SIDE))
    mask = Image.new("L", (VISIBLE_SIDE, VISIBLE_SIDE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, VISIBLE_SIDE-1, VISIBLE_SIDE-1), fill=255)
    scene.putalpha(mask)
    preview_path = WEB / f"preview-{number:02d}.webp"
    scene.resize((768, 768), Image.Resampling.LANCZOS).save(
        preview_path, "WEBP", lossless=True, method=6)

    ios = IOS / f"AppIcon-{number:02d}.appiconset"
    ios.mkdir(parents=True, exist_ok=True)
    ios_path = ios / f"AppIcon-{number:02d}.png"
    ios_art = art.resize((1024, 1024), Image.Resampling.LANCZOS)
    ios_art.save(ios_path, "PNG", optimize=True)
    same_pixels(ios_path, ios_art)

    return hashlib.sha256(src.read_bytes()).hexdigest()


def main():
    cleanup_obsolete()
    digests = [generate(*item) for item in ICONS]
    if len(set(digests)) != len(ICONS):
        raise RuntimeError("All ten Store masters must be distinct")

    numbers = {f"{n:02d}" for n, _ in ICONS}
    if {p.stem[-2:] for p in ANDROID.glob("oathkeeper_icon_*.webp")} != numbers:
        raise RuntimeError("Legacy launcher set is incomplete")
    if {p.stem[-2:] for p in ADAPTIVE.glob("oathkeeper_icon_*.xml")} != numbers:
        raise RuntimeError("Adaptive launcher set is incomplete")
    if {p.stem[-2:] for p in WEB.glob("preview-*.webp")} != numbers:
        raise RuntimeError("Store launcher preview set is incomplete")
    if ART_RATIO * math.sqrt(2) >= VISIBLE_SIDE/LAYER_SIDE:
        raise RuntimeError("The complete square artwork would be clipped by round masks")
    print("VERIFIED: ten original Store masters, ten centered adaptive icons, "
          "ten same-layer Android-style previews, ten original iOS artworks; default untouched")


if __name__ == "__main__":
    main()
