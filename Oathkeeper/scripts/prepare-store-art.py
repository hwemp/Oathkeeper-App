#!/usr/bin/env python3
"""Prepare independent, improved Store display images from the approved originals.

Three-times larger output pixels eliminate atlas seams and reduce display scaling
artifacts. This does not add genuine original image detail; real HD master images
would still be needed to reproduce fine details absent from the source.
"""
from pathlib import Path
import hashlib
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
ART = ROOT / "web/public/art"
DICE = ("dragonfire", "frostborne", "elvenleaf", "celestial", "abyssal",
        "gold-forged", "necrotic", "astral", "oceanic", "sunfire")


def enhanced_display(image):
    image = image.convert("RGB")
    image = image.resize((image.width * 3, image.height * 3), Image.Resampling.LANCZOS)
    return image.filter(ImageFilter.UnsharpMask(radius=1, percent=65, threshold=3))


def main():
    dice_dir = ART / "store-dice"
    bg_dir = ART / "store-backgrounds-hd"
    dice_dir.mkdir(parents=True, exist_ok=True)
    bg_dir.mkdir(parents=True, exist_ok=True)

    with Image.open(ART / "oathkeeper-dice-store-atlas.webp") as atlas_src:
        atlas = atlas_src.convert("RGB")
    if atlas.width % 5 or atlas.height % 2:
        raise RuntimeError(f"Dice atlas has invalid 5x2 dimensions: {atlas.size}")
    cell_w, cell_h = atlas.width // 5, atlas.height // 2
    if cell_w < 200 or cell_h < 140:
        raise RuntimeError("Dice preview art is smaller than the approved source")
    hashes = set()
    for i, slug in enumerate(DICE):
        left, top = (i % 5) * cell_w, (i // 5) * cell_h
        cell = atlas.crop((left, top, left + cell_w, top + cell_h))
        signature = hashlib.sha256(cell.tobytes()).hexdigest()
        if signature in hashes:
            raise RuntimeError(f"Duplicate dice artwork: {slug}")
        hashes.add(signature)
        enhanced_display(cell).save(dice_dir / f"{slug}.webp", "WEBP", quality=95, method=6)
    if len(list(dice_dir.glob("*.webp"))) != 10:
        raise RuntimeError("All ten independent dice images must exist")

    sources = sorted((ART / "store-backgrounds").glob("*.webp"))
    if len(sources) != 10:
        raise RuntimeError("All ten approved background masters must exist")
    for path in sources:
        with Image.open(path) as opened:
            master = opened.convert("RGB")
        enhanced_display(master).save(bg_dir / path.name, "WEBP", quality=95, method=6)
        if master.width < 1024:
            print(f"Original resolution limit: {path.name} {master.width}x{master.height} "
                  "(display derivative is not a new true-HD source)")
    if len(list(bg_dir.glob("*.webp"))) != 10:
        raise RuntimeError("All ten display background images must exist")
    print("Verified: 10 isolated dice images, 10 enhanced display backgrounds, "
          "and no source atlas modification")


if __name__ == "__main__":
    main()
