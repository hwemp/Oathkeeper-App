#!/usr/bin/env python3
"""Opt-in Store UI gemstone tint for source-only visual workbench QA.
Original approved Store raster and launcher/gameplay art stay byte-identical.
"""
from pathlib import Path
import hashlib,shutil,subprocess,sys
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
CSS="workbench-store-gem-tone.css"
def main():
 index=DIST/"index.html"
 master=DIST/"art"/"exact-store"/"test169-bg"/"moonlit-citadel.webp"
 if not index.exists() or not master.exists():raise RuntimeError("Original approved Store page missing")
 before=hashlib.sha256(master.read_bytes()).hexdigest()
 subprocess.run([sys.executable,str(ROOT/"scripts"/"build-workbench-store-gem-masks.py")],check=True)
 if hashlib.sha256(master.read_bytes()).hexdigest()!=before:
  raise RuntimeError("Store visual mask generation changed approved original art")
 shutil.copyfile(ROOT/"web"/CSS,DIST/CSS)
 html=index.read_text(encoding="utf-8")
 if CSS in html:raise RuntimeError("Store gemstone shader installed more than once")
 if html.count("</head>")!=1:raise RuntimeError("Unexpected HTML; do not modify approved runtime")
 html=html.replace("</head>",f'<link rel="stylesheet" href="./{CSS}" data-workbench-store-gem-tone="true"></head>',1)
 index.write_text(html,encoding="utf-8")
 print("WORKBENCH GEM TONE: 3 localized masks packaged, base image SHAs preserved, original theme untouched")
if __name__=="__main__":main()
