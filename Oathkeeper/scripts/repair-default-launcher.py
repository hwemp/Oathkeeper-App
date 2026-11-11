#!/usr/bin/env python3
"""Regenerate correctly centered Android original launcher artwork from the
unchanged 1024px Oathkeeper chalice master. The adaptive icon is deliberately
inset inside Android's safe mask, avoiding clipping on Samsung/Pixel launchers.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "assets" / "icon-only.png"
RES = ROOT / "android/app/src/main/res"
DENSITIES = {"ldpi": 36, "mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

def main():
    with Image.open(MASTER) as source:
        logo = ImageOps.fit(source.convert("RGBA"), (1024, 1024),
                            method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    for density, side in DENSITIES.items():
        folder = RES / ("mipmap-" + density)
        folder.mkdir(parents=True, exist_ok=True)
        visible = logo.resize((side, side), Image.Resampling.LANCZOS)
        visible = visible.filter(ImageFilter.UnsharpMask(radius=0.5, percent=75, threshold=2))
        visible.save(folder / "ic_launcher.png", optimize=True)
        visible.save(folder / "ic_launcher_round.png", optimize=True)

        # Android's 108dp adaptive-icon foreground is masked by the launcher.
        # Keep the full original chalice visible within the 72dp central region.
        foreground_side = side * 108 // 48
        image_side = round(foreground_side * (72 / 108))
        foreground = Image.new("RGBA", (foreground_side, foreground_side), (0, 0, 0, 0))
        resized = logo.resize((image_side, image_side), Image.Resampling.LANCZOS)
        foreground.alpha_composite(resized, ((foreground_side-image_side)//2,
                                             (foreground_side-image_side)//2))
        foreground.save(folder / "ic_launcher_foreground.png", optimize=True)
    print("Centered original Oathkeeper chalice launcher; Android safe zone preserved")

if __name__ == "__main__":
    main()
