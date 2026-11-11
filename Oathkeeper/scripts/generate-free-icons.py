#!/usr/bin/env python3
"""Generate native icons from the exact images displayed in the Store.

Android launcher images are byte-for-byte copies of the Store WebP. No second art
collection, resize, blur, crop, inset, or overlay is used. Device-specific
Android launcher masks may still trim the outside corners. iOS needs PNG,
which is generated only from the same Store image.
The original Oathkeeper app icon is deliberately untouched.
"""
from pathlib import Path
import hashlib
import shutil
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web/public/art/store-icons"
RES = ROOT / "android/app/src/main/res"
ANDROID = RES / "mipmap-nodpi"
ADAPTIVE = RES / "mipmap-anydpi-v26"
ADAPTIVE_ART = RES / "drawable-nodpi"
IOS = ROOT / "ios/App/App/Assets.xcassets"
ICONS = [(1, "moonlit-citadel"), (2, "ember-dragon"), (4, "lionheart-shield"),
         (5, "shadow-mage"), (6, "arcane-chalice"), (7, "astral-d20"),
         (8, "twin-battleaxes"), (11, "crystal-spires"),
         (12, "steel-sentinel"), (14, "sapphire-worldtree")]


def scaled(image, size):
    return image.resize((size, size), Image.Resampling.LANCZOS)


def same_pixels(path, expected):
    with Image.open(path) as opened:
        actual = opened.convert("RGB")
    if actual.size != expected.size or ImageChops.difference(actual, expected).getbbox():
        raise RuntimeError(f"Native icon does not match Store master: {path}")


def clean_obsolete_alternates():
    """Delete old alternate-image reservoir; never delete default launcher."""
    ANDROID.mkdir(parents=True, exist_ok=True)
    ADAPTIVE.mkdir(parents=True, exist_ok=True)
    ADAPTIVE_ART.mkdir(parents=True, exist_ok=True)
    for path in WEB.glob("launcher-*.webp"):
        path.unlink()
    for path in ANDROID.glob("oathkeeper_icon_*"):
        if path.is_file():
            path.unlink()
    for path in ADAPTIVE.glob("oathkeeper_icon_*.xml"):
        path.unlink()
    for path in ADAPTIVE_ART.glob("oathkeeper_icon_art_*.webp"):
        path.unlink()


def make_icon(number, slug):
    src = WEB / f"icon-{number:02d}.webp"
    if not src.is_file():
        raise FileNotFoundError(f"Missing approved Store source for {slug}: {src}")
    with Image.open(src) as original:
        if original.format != "WEBP":
            raise ValueError(f"Expected Store WebP artwork for {slug}")
        art = original.convert("RGB")
    if art.size != (1254, 1254):
        raise ValueError(f"Expected 1254px Store art for {slug}: {art.size}")

    name = f"oathkeeper_icon_{number:02d}"
    native_path = ANDROID / f"{name}.webp"
    adaptive_path = ADAPTIVE_ART / f"oathkeeper_icon_art_{number:02d}.webp"
    # Android APK resources contain the identical encoded bytes as the Store.
    shutil.copyfile(src, native_path)
    shutil.copyfile(src, adaptive_path)
    if adaptive_path.read_bytes() != src.read_bytes():
        raise RuntimeError(f"Adaptive icon background differs from Store art: {slug}")
    if native_path.read_bytes() != src.read_bytes():
        raise RuntimeError(f"Launcher resource differs from Store art: {slug}")

    # Android OS applies the adaptive mask; no second overlay is permitted.
    xml = ('<?xml version="1.0" encoding="utf-8"?>\n'
           '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
           f'    <background android:drawable="@drawable/oathkeeper_icon_art_{number:02d}" />\n'
           '    <foreground android:drawable="@android:color/transparent" />\n'
           '</adaptive-icon>\n')
    (ADAPTIVE / f"{name}.xml").write_text(xml, encoding="utf-8")

    dest = IOS / f"AppIcon-{number:02d}.appiconset"
    dest.mkdir(parents=True, exist_ok=True)
    ios_path = dest / f"AppIcon-{number:02d}.png"
    scaled(art, 1024).save(ios_path, "PNG", optimize=True)
    same_pixels(ios_path, scaled(art, 1024))
    return hashlib.sha256(src.read_bytes()).hexdigest()


def main():
    clean_obsolete_alternates()
    digests = [make_icon(*item) for item in ICONS]
    if len(digests) != len(set(digests)):
        raise RuntimeError("All ten approved Store icons must be unique")
    expected = {f"oathkeeper_icon_{n:02d}" for n, _ in ICONS}
    actual_native = {p.stem for p in ANDROID.glob("oathkeeper_icon_*.webp")}
    actual_adaptive = {p.stem for p in ADAPTIVE.glob("oathkeeper_icon_*.xml")}
    expected_art = {f"oathkeeper_icon_art_{n:02d}" for n, _ in ICONS}
    actual_art = {p.stem for p in ADAPTIVE_ART.glob("oathkeeper_icon_art_*.webp")}
    if actual_native != expected or actual_adaptive != expected or actual_art != expected_art:
        raise RuntimeError("Native launcher icons do not match Store selections")
    if list(WEB.glob("launcher-*.webp")):
        raise RuntimeError("Obsolete secondary icon reservoir reappeared")
    print("VERIFIED: legacy and adaptive Android icon art match Store WebPs byte-for-byte; iOS icons share the same sources; original app icon preserved")


if __name__ == "__main__":
    main()
