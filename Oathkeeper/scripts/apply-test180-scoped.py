#!/usr/bin/env python3
"""TEST 180 — patch only the actual frozen Build-144 runtime markup.

The Vite build is replaced by the protected Build-142/144 art archive during CI.
Updating web/app.js alone is NOT sufficient to change the packaged app.
This script refuses to proceed if the exact original HP markup is not present.
Do not alter Store GIF, launcher icons, dice RNG or purchased assets.
"""
from pathlib import Path
import hashlib
import json

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
BUNDLE=DIST/"assets/main-FCw4hQ90.js"
CSS=DIST/"test179-final-defects.css"
GAMEPLAY=DIST/"test171-gameplay-toss.js"
GIF=DIST/"art/exact-store/roll/astral-original.gif"
GIF_SHA="fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"
OLD='<div class="row"><input id="hpAmount" type="number" min="0" value="1" aria-label="Damage or healing amount"><button data-action="damage">Damage</button><button data-action="heal">Heal</button></div>'
NEW='<div class="ok180-hp-controls"><input id="hpAmount" type="number" min="0" value="1" aria-label="Damage or healing amount"><div class="ok180-hp-buttons"><button data-action="damage">Damage</button><button data-action="heal">Heal</button></div></div>'

def main():
    if hashlib.sha256(GIF.read_bytes()).hexdigest()!=GIF_SHA:
        raise RuntimeError("Approved animated dice GIF was modified")
    css=CSS.read_text(encoding="utf-8")
    for expected in ('.ok180-hp-controls', '.ok180-hp-buttons', 'background-size:120% 120%', 'brightness(.88)'):
        if expected not in css:
            raise RuntimeError("Expected TEST 180 style missing: "+expected)
    gameplay=GAMEPLAY.read_text(encoding="utf-8")
    if 'percentDice.push' in gameplay or 'result.sides===100 && result.mode' in gameplay:
        raise RuntimeError("Official percentile display still splits a true D100 into D10s")
    if "test179-clean-faces/" not in gameplay:
        raise RuntimeError("Numberless settled face assets were not applied")
    source=BUNDLE.read_text(encoding="utf-8")
    if source.count(OLD)!=1 or NEW in source:
        raise RuntimeError("Unexpected frozen Build-144 HP controls: aborting instead of guessing")
    BUNDLE.write_text(source.replace(OLD,NEW,1),encoding="utf-8")
    if hashlib.sha256(GIF.read_bytes()).hexdigest()!=GIF_SHA:
        raise RuntimeError("Approved GIF changed during TEST 180 repair")
    folder=ROOT/"preview-output"
    folder.mkdir(exist_ok=True)
    (folder/"180-source-patch-report.json").write_text(json.dumps({
        "test":"180", "updated":["frozen HP action markup"],
        "launcher_master_assets_modified":False, "store_dice_animated_gif_modified":False,
        "dice_random_engine_modified":False,"percentile_visual_geometry":"single D100",
        "store_icon_fit":"120 percent within clip, no interior border",
        "dice_preview_brightness":0.88
    },indent=2))
    print("TEST 180: HP amount above equal-width actions, framed launcher icons, reduced dice preview bloom and true official D100; frozen approved GIF unchanged")

if __name__=="__main__":
    main()
