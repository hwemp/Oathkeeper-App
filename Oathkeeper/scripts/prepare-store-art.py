#!/usr/bin/env python3
"""Prepare sharper, device-density store preview assets for packaged APKs.

The approved originals remain the source of truth in Git. On CI we improve
their display resolution using high-quality resampling and conservative
sharpening in the build checkout; no concepts or prices are modified.
This cannot restore detail absent from the original illustrations.
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "web/public/art"

def prepare(path: Path, minimum_width: int) -> None:
    with Image.open(path) as source:
        im = source.convert("RGB")
        width, height = im.size
        desired = max(width, minimum_width)
        if desired <= width:
            return
        scale = desired / width
        resampled = im.resize(
            (desired, round(height * scale)), Image.Resampling.LANCZOS
        )
        enhanced = resampled.filter(
            ImageFilter.UnsharpMask(radius=1.0, percent=92, threshold=3)
        )
        enhanced.save(path, "WEBP", quality=94, method=6)
        print(f"Prepared {path.relative_to(ROOT)}: {width}x{height} -> {enhanced.width}x{enhanced.height}")

def main() -> None:
    for path in sorted((ART / "store-backgrounds").glob("*.webp")):
        prepare(path, 1524)  # 3 x a 508px concept
    for path in sorted((ART / "store-icons").glob("*.webp")):
        prepare(path, 1024)  # 1024px launcher/store previews
    prepare(ART / "oathkeeper-dice-store-atlas.webp", 3720)  # 3 x a 1240px atlas

if __name__ == "__main__":
    main()
