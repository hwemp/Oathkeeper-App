#!/usr/bin/env python3
"""Add only the Android first-launch safe-area stylesheet to frozen UI.
Does not modify age checking, consent or approved art and gameplay assets.
"""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
NAME="workbench-firstlaunch-safe-area.css"
def main():
 src=ROOT/"web"/NAME
 index=DIST/"index.html"
 if not src.is_file() or not index.is_file():raise RuntimeError("Missing original UI or safe area patch")
 text=index.read_text(encoding="utf-8")
 if NAME in text:raise RuntimeError("Safe area stylesheet applied twice")
 if text.count("</head>")!=1:raise RuntimeError("Unrecognized head; refuse patch")
 shutil.copyfile(src,DIST/NAME)
 text=text.replace("</head>",'<link rel="stylesheet" href="./'+NAME+'" data-firstlaunch-safearea="true"></head>',1)
 index.write_text(text,encoding="utf-8")
 print("WORKBENCH: first-launch safe areas constrain the scrollable terms card without bypassing it")
if __name__=="__main__":main()
