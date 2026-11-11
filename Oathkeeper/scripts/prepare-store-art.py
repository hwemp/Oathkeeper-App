#!/usr/bin/env python3
"""Audit bundled art sources without enlarging missing detail.

The five approved store screenshots are layout references, not lossless master
files. LANCZOS enlargement of a 508px illustration to 1524px did not recover
detail; it also made the APK heavier. Keep the original master bytes and warn
until genuine higher-resolution artwork is supplied.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "web/public/art"

def audit(path: Path, recommended_width: int) -> None:
    with Image.open(path) as im:
        width, height = im.size
    if width < recommended_width:
        print(f"ART QUALITY WARNING: {path.relative_to(ROOT)} is {width}x{height}; "
              f"recommended native width >= {recommended_width}px. No fake upscaling.")
    else:
        print(f"ART SOURCE OK: {path.relative_to(ROOT)} is {width}x{height}")

def main() -> None:
    for path in sorted((ART / "store-backgrounds").glob("*.webp")):
        audit(path, 1024)
    for path in sorted((ART / "store-icons").glob("*.webp")):
        audit(path, 512)
    audit(ART / "oathkeeper-dice-store-atlas.webp", 2480)

if __name__ == "__main__":
    main()
