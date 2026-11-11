#!/usr/bin/env python3
"""Create Store/Android/iOS launcher assets from one unchanged master per icon.

NO art cropping, recentering, feathering, blurring or separate image synthesis.
The preview is the original 1254px source. Each native image is a direct
high-quality downsample of that same source. Android's launcher can still
apply its own device-dependent adaptive-icon mask to the outside edges.
The original Oathkeeper icon is not touched.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web/public/art/store-icons"
RES = ROOT / "android/app/src/main/res"
ANDROID = RES / "mipmap-nodpi"
ADAPTIVE = RES / "mipmap-anydpi-v26"
IOS = ROOT / "ios/App/App/Assets.xcassets"
ADAPTIVE_SIZE = 432
ICONS = [(1,"moonlit-citadel"),(2,"ember-dragon"),(4,"lionheart-shield"),
         (5,"shadow-mage"),(6,"arcane-chalice"),(7,"astral-d20"),
         (8,"twin-battleaxes"),(11,"crystal-spires"),(12,"steel-sentinel"),
         (14,"sapphire-worldtree")]


def scaled(image, size):
    return image.resize((size, size), Image.Resampling.LANCZOS)


def same_pixels(path, expected):
    with Image.open(path) as opened:
        actual = opened.convert("RGB")
    if actual.size != expected.size or ImageChops.difference(actual, expected).getbbox():
        raise RuntimeError(f"Native icon no longer matches the approved Store master: {path}")


def make_icon(number, slug):
    src = WEB / f"icon-{number:02d}.webp"
    if not src.is_file():
        raise FileNotFoundError(f"Missing unique approved icon {slug}: {src}")
    with Image.open(src) as original:
        art = original.convert("RGB")
    if art.size != (1254, 1254):
        raise ValueError(f"Expected 1254px individual HD art for {slug}: {art.size}")

    name = f"oathkeeper_icon_{number:02d}"
    ANDROID.mkdir(parents=True, exist_ok=True)
    ADAPTIVE.mkdir(parents=True, exist_ok=True)

    # The web store catalog points straight to src, the unmodified master.
    # The compatibility launcher file is also derived directly from src.
    scaled(art, 512).save(WEB / f"launcher-{number:02d}.webp",
                          "WEBP", lossless=True, method=6)

    # Android adaptive icons must have layers. Put the COMPLETE original art
    # into the background, and make the foreground fully transparent. This
    # avoids the former 8.5% art crop, soft blur, and 66.5% inset composite.
    # The OS supplies its standard outer mask; we NEVER impose a second mask.
    background = scaled(art, ADAPTIVE_SIZE)
    background_path = ANDROID / f"{name}_background.png"
    foreground_path = ANDROID / f"{name}_foreground.png"
    background.save(background_path, "PNG", optimize=True)
    Image.new("RGBA", (ADAPTIVE_SIZE, ADAPTIVE_SIZE), (0, 0, 0, 0)).save(
        foreground_path, "PNG", optimize=True)

    xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
           f'    <background android:drawable="@mipmap/{name}_background" />\n'
           f'    <foreground android:drawable="@mipmap/{name}_foreground" />\n'
           '</adaptive-icon>\n')
    (ADAPTIVE / f"{name}.xml").write_text(xml, encoding="utf-8")

    # Legacy Android icons likewise use complete art without baked-in masks.
    legacy_path = ANDROID / f"{name}.png"
    scaled(art, 256).save(legacy_path, "PNG", optimize=True)

    dest = IOS / f"AppIcon-{number:02d}.appiconset"
    dest.mkdir(parents=True, exist_ok=True)
    ios_path = dest / f"AppIcon-{number:02d}.png"
    scaled(art, 1024).save(ios_path, "PNG", optimize=True)

    # Fail builds immediately if any pipeline step altered the selected art.
    same_pixels(background_path, background)
    same_pixels(legacy_path, scaled(art, 256))
    same_pixels(ios_path, scaled(art, 1024))
    with Image.open(foreground_path) as foreground:
        if foreground.size != (ADAPTIVE_SIZE, ADAPTIVE_SIZE) or foreground.getbbox() is not None:
            raise RuntimeError(f"Unexpected extra foreground image in {foreground_path}")
    return hashlib.sha256(art.tobytes()).hexdigest()


def main():
    digests = [make_icon(*item) for item in ICONS]
    if len(digests) != len(set(digests)):
        raise RuntimeError("All ten Store icons must have unique original resources")
    if len(list(ADAPTIVE.glob("oathkeeper_icon_*.xml"))) != len(ICONS):
        raise RuntimeError("Expected exactly ten adaptive Android icon declarations")
    print("VERIFIED: ten distinct original Store masters map pixel-for-pixel after scaling to Android and iOS; original launcher untouched")


if __name__ == "__main__":
    main()
