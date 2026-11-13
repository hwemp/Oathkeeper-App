#!/usr/bin/env python3
"""Test 177: replace ONLY the live gameplay polygon presentation.

The original STORE showcase is byte-for-byte protected; this changes only the
hook used when the player asks the rules engine to resolve a tabletop roll.
Use the existing high-detail, selected-set artwork and fully independent
TEST-171 illustrated toss renderer, never a polygon mesh.
"""
from pathlib import Path
import hashlib
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
MASTER="fc8b485dcee02e1959df45e3cfda7c4d6dda238a9ac51d0b5b5bb2bfc65046bb"

def main():
    original=DIST/"art/exact-store/roll/astral-original.gif"
    if hashlib.sha256(original.read_bytes()).hexdigest()!=MASTER:
        raise RuntimeError("Protected original Store preview changed")
    code=DIST/"workbench-gameplay-mesh.js"
    text=code.read_text(encoding="utf-8")
    old="cleanup = playTabletopRoll(stage, result, onComplete, skin);"
    replacement='''// TEST 177: the selected-set, illustrated cinematic tabletop toss is
        // intentionally used for GAMEPLAY instead of the flat faceted mesh.
        // The old result and onComplete callback pass through unchanged.
        if (!previous?.play) throw new Error("Original illustrated tabletop renderer missing");
        wrapper.remove();
        stage.classList.remove("workbench-mesh-stage");
        return previous.play(stage, result, onComplete, skin);'''
    if text.count(old)!=1 or text.count("var previous = globalThis.OathkeeperTabletop171;")!=1:
        raise RuntimeError("Unexpected frozen gameplay adapter; refuse unsafe patch")
    code.write_text(text.replace(old,replacement,1),encoding="utf-8")
    if 'return previous.play(stage, result, onComplete, skin);' not in code.read_text():
        raise RuntimeError("Gameplay renderer did not install")
    for file in (DIST/"test171-gameplay-toss.js",DIST/"test171-gameplay-toss.css"):
        if not file.is_file():raise RuntimeError("Original illustrated toss assets missing")
    print("TEST 177: GAMEPLAY-only upgraded to selected-set illustrated cinematic roll; polygon canvas retired. Secure roll values, totals, callback, and Store GIF untouched.")

if __name__=="__main__":main()
