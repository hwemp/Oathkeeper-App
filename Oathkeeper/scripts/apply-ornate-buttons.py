#!/usr/bin/env python3
"""Layer vector button ornaments onto frozen Build 144 web assets in dist.

This preserves all approved dice roll imagery, textures, and store artwork.
Only dist/index.html receives an extra stylesheet reference. All other original
assets retain byte-identical hashes, and new SVG/CSS assets are merely added.
"""
from pathlib import Path
import hashlib
import re
import shutil

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
SOURCE = ROOT / "web"
STYLESHEET = "ornate-buttons.css"
ART = ("ornate-amethyst.svg", "ornate-flourish-left.svg", "ornate-flourish-right.svg",
       "ornate-sapphire.svg", "ornate-emerald.svg", "ornate-ruby.svg",
       "ornate-aquamarine.svg", "ornate-citrine.svg", "ornate-nav-163.svg",
       "ornate-nav-sapphire-163.svg", "ornate-nav-emerald-163.svg",
       "ornate-nav-ruby-163.svg", "ornate-nav-aquamarine-163.svg",
       "ornate-nav-citrine-163.svg")

def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    index = DIST / "index.html"
    if not index.is_file():
        raise RuntimeError("Approved Build 144 dist/index.html not present")
    original_hashes = {
        p.relative_to(DIST): sha256(p)
        for p in DIST.rglob("*") if p.is_file()
    }
    # It must remain a separate, immutable archive overlay.
    originals = ("art/exact-store/dice.webp", "art/exact-store/backgrounds.webp",
                 "art/exact-store/icons.webp", "art/exact-store/roll/astral.webp",
                 "art/exact-store/roll/dragonfire.webp")
    for required in originals:
        if Path(required) not in original_hashes:
            raise RuntimeError(f"Missing frozen Build 144 artifact: {required}")
    style = (SOURCE / STYLESHEET).read_bytes()
    if b"ornate-amethyst.svg" not in style or b"pointer-events: none" not in style:
        raise RuntimeError("Button overlay must use the SVG gemstone and not block controls")
    (DIST / STYLESHEET).write_bytes(style)
    (DIST / "art").mkdir(parents=True, exist_ok=True)
    for name in ART:
        original = SOURCE / "public" / "art" / name
        if not original.is_file() or not original.read_bytes().startswith(b"<svg"):
            raise RuntimeError(f"Missing valid vector art: {original}")
        shutil.copyfile(original, DIST / "art" / name)
    html = index.read_text(encoding="utf-8")
    if STYLESHEET not in html:
        link = f'<link rel="stylesheet" href="./{STYLESHEET}" data-oathkeeper-test161="ornate-buttons">'
        if len(re.findall(r"</head\s*>", html, flags=re.I)) != 1:
            raise RuntimeError("Unexpected HTML structure; refused to rewrite approved UI")
        html = re.sub(r"</head\s*>", link + "</head>", html, count=1, flags=re.I)
        index.write_text(html, encoding="utf-8")
    theme_js = (SOURCE / "ornate-gem-theme.js")
    if not theme_js.is_file() or b"data-oath-gem-theme" not in theme_js.read_bytes():
        raise RuntimeError("Gem theme controller missing or malformed")
    shutil.copyfile(theme_js, DIST / "ornate-gem-theme.js")
    html = index.read_text(encoding="utf-8")
    if 'src="./ornate-gem-theme.js"' not in html:
        script = '<script type="module" src="./ornate-gem-theme.js" data-oath-gem-theme-controller="true"></script>'
        if len(re.findall(r"</head\s*>",html,flags=re.I)) != 1:
            raise RuntimeError("Cannot safely insert background-gem controller")
        html = re.sub(r"</head\s*>", script + "</head>", html, count=1, flags=re.I)
        index.write_text(html,encoding="utf-8")
    # High-resolution individual background art is already in the repository.
    # Add only missing fallback paths; do not modify frozen Build 144 assets.
    bg_dir = DIST / "art" / "store-backgrounds"
    bg_dir.mkdir(parents=True,exist_ok=True)
    for slug in ["moonlit-citadel","ancient-ruins","enchanted-forest","dragons-crag","shadow-marsh","celestial-plains","crystal-caverns","elder-grove","mystic-lake","eternal-keep"]:
        source = SOURCE / "public" / "art" / "store-backgrounds" / (slug + ".svg")
        if not source.is_file() or b"<svg" not in source.read_bytes()[:250]:
            raise RuntimeError(f"Original fallback source missing: {slug}")
        target = bg_dir / (slug + ".svg")
        if not target.exists():
            shutil.copyfile(source,target)
        # Use the original illustrated WebP master from the approved Store
        # catalog, not unrelated SVG redraws. Never upscale or recompress it.
        from PIL import Image
        approved = SOURCE / "public" / "art" / "store-backgrounds" / (slug + ".webp")
        if not approved.is_file():
            raise RuntimeError(f"Approved illustrated original missing: {approved}")
        with Image.open(approved) as img:
            if img.width < 500 or img.height < 350:
                raise RuntimeError(f"Original illustration too small: {slug}: {img.size}")
        destination = DIST / "art" / "approved-backgrounds" / (slug + ".webp")
        destination.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(approved,destination)
        if sha256(destination) != sha256(approved):
            raise RuntimeError(f"Background master altered in copying: {slug}")
    for path, expected in original_hashes.items():
        if path != Path("index.html") and sha256(DIST / path) != expected:
            raise RuntimeError(f"Frozen asset modified: {path}")
    print("Applied lossless vector ornament overlay. Original archived assets unchanged.")

if __name__ == "__main__":
    main()
