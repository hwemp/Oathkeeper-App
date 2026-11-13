#!/usr/bin/env python3
"""Test 179 Android launcher safe zone repair.
Same exact canonical Store/launcher WebP source for every icon; ONLY Android's
adaptive-icon XML composition changes to keep the full gold frame inside the
system's circular/squircle mask. No artwork generation, resampling or recolor.
"""
from pathlib import Path
import hashlib,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
ANDROID=ROOT/"android/app/src/main/res"
IDS=("01","02","04","05","06","07","08","11","12","14")
ANDROID_NS="http://schemas.android.com/apk/res/android"
ET.register_namespace("android",ANDROID_NS)
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
    for no in IDS:
        source=ROOT/"web/public/art/store-icons"/("icon-"+no+".webp")
        icon=ANDROID/"drawable-nodpi"/("oathkeeper_icon_art_"+no+".webp")
        fallback=ANDROID/"mipmap-nodpi"/("oathkeeper_icon_"+no+".webp")
        if not (source.is_file() and icon.is_file() and fallback.is_file()):
            raise RuntimeError("Missing canonical launcher Store file "+no)
        if not (sha(source)==sha(icon)==sha(fallback)):
            raise RuntimeError("Store and Android launcher art diverged "+no)
        inset=ANDROID/"drawable"/("test179_icon_safe_"+no+".xml")
        inset.write_text('<?xml version="1.0" encoding="utf-8"?>\n'
            '<inset xmlns:android="http://schemas.android.com/apk/res/android" '
            'android:drawable="@drawable/oathkeeper_icon_art_'+no+'" '
            'android:insetLeft="12dp" android:insetTop="12dp" '
            'android:insetRight="12dp" android:insetBottom="12dp"/>\n')
        target=ANDROID/"mipmap-anydpi-v26"/("oathkeeper_icon_"+no+".xml")
        if not target.is_file():raise RuntimeError("Adaptive icon XML missing")
        old=target.read_text()
        if old.count('<adaptive-icon')!=1 or 'oathkeeper_icon_art_'+no not in old:
            raise RuntimeError("Unexpected prior adaptive icon "+no)
        updated='<?xml version="1.0" encoding="utf-8"?>\n'
        updated+='<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        updated+='    <background android:drawable="@drawable/ic_launcher_background" />\n'
        updated+='    <foreground android:drawable="@drawable/test179_icon_safe_'+no+'" />\n'
        updated+='</adaptive-icon>\n'
        ET.fromstring(updated)
        target.write_text(updated)
        if sha(source)!=sha(icon):raise RuntimeError("Master changed unexpectedly "+no)
    print("Test179 Android: all ten approved launcher masters remain byte-for-byte identical to Store source. Adaptive foreground now uses system-mask safe-zone inset, no oversized/cropped background art.")
if __name__=="__main__":main()
