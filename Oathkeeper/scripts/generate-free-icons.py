#!/usr/bin/env python3
"""Produce native launcher icons from the exact approved store artwork.

The ten authored WebP store images are the single source of truth. Android and
iOS must display the SAME image as the store thumbnail/preview, not a separately
redrawn emblem or generated cartoon. Original AppIcon and ic_launcher resources
are intentionally left unchanged.
"""
from pathlib import Path
import hashlib
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WEB = ROOT / "web/public/art/store-icons"
ANDROID = ROOT / "android/app/src/main/res/mipmap-nodpi"
IOS = ROOT / "ios/App/App/Assets.xcassets"
SIZE = 1024
ICONS = [
    (1, "moonlit-citadel"),
    (2, "ember-dragon"),
    (4, "lionheart-shield"),
    (5, "shadow-mage"),
    (6, "arcane-chalice"),
    (7, "astral-d20"),
    (8, "twin-battleaxes"),
    (11, "crystal-spires"),
    (12, "steel-sentinel"),
    (14, "sapphire-worldtree"),
]

def build(number, slug):
    source = WEB / f"icon-{number:02d}.webp"
    if not source.is_file():
        raise FileNotFoundError(f"Missing approved art for {slug}: {source}")
    with Image.open(source) as loaded:
        if loaded.width < 256 or loaded.height < 256:
            raise ValueError(f"Approved launcher art is too small: {source}")
        # The web, Android and iOS images share identical artwork.
        icon = loaded.convert("RGB").resize((SIZE, SIZE), Image.Resampling.LANCZOS)

    ANDROID.mkdir(parents=True, exist_ok=True)
    icon.resize((256, 256), Image.Resampling.LANCZOS).save(
        ANDROID / f"oathkeeper_icon_{number:02d}.png", "PNG", optimize=True
    )
    target = IOS / f"AppIcon-{number:02d}.appiconset"
    target.mkdir(parents=True, exist_ok=True)
    icon.save(target / f"AppIcon-{number:02d}.png", "PNG", optimize=True)
    return hashlib.sha256(icon.tobytes()).hexdigest()

def main():
    hashes = [build(*icon) for icon in ICONS]
    if len(set(hashes))!=10:
        raise RuntimeError("Approved icon artwork must contain ten distinct designs")
    print("Synchronized 10 approved icon designs to Android and iOS; original retained")

if __name__ == "__main__":
    main()
