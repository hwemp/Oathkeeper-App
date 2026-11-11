#!/usr/bin/env python3
"""Export standalone SVG-code containers of approved Oathkeeper Store art.

These SVG files EMBED the complete original 1254x1254 WebP artwork in a data URI.
No pixels are recreated, resized, cropped or vector-traced. An embedded raster
inside SVG is not true vector art and is not a native Android/iOS launcher asset.
The native launcher pipeline remains scripts/generate-free-icons.py.
"""
import base64
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / "web/public/art/store-icons"
NAMES = {"11": "Crystal Spires - source file 11", "12": "Steel Sentinel", "14": "Sapphire Worldtree", "01": "Moonlit Citadel", "02": "Ember Dragon", "04": "Lionheart Shield", "05": "Shadow Mage", "06": "Arcane Chalice", "07": "Twin Battleaxes - source file 07", "08": "Astral D20 - source file 08"}
EXPECTED_SIZE = (1254, 1254)


def export_portable_icons():
    results = []
    for number, name in NAMES.items():
        original = ASSETS / f"icon-{number}.webp"
        payload = original.read_bytes()
        if payload[:4] != b"RIFF" or payload[8:12] != b"WEBP":
            raise ValueError(f"Not a WebP source: {original}")
        encoded = base64.b64encode(payload).decode("ascii")
        svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254" role="img" aria-label="{name}">\n'
            f'  <title>{name}</title>\n'
            '  <desc>Oathkeeper source illustration as a self-contained WebP data URI. This SVG is a lossless container for the original encoded artwork, not a traced vector illustration.</desc>\n'
            f'  <image x="0" y="0" width="1254" height="1254" preserveAspectRatio="xMidYMid meet" href="data:image/webp;base64,{encoded}"/>\n'
            '</svg>\n'
        )
        target = ASSETS / f"transfer-{number}.svg"
        target.write_text(svg, encoding="utf-8")
        results.append(target)
    print(f"Exported {len(results)} standalone SVG transfers from existing WebP masters.")
    return results


if __name__ == "__main__":
    export_portable_icons()
