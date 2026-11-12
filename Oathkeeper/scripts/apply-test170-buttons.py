#!/usr/bin/env python3
"""TEST 170: one faceted-amethyst button reference, two selected states.
The master vector template generates named theme variants without changing
gold frame geometry or altering the archived 144 game logic.
"""
from pathlib import Path
import shutil,xml.etree.ElementTree as ET

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
COLORS={
 "amethyst":("#f6bcff","#9731ef","#36096d"),
 "sapphire":("#b8e5ff","#236bc6","#0a2878"),
 "emerald":("#adffcf","#24a963","#064f34"),
 "ruby":("#ffd3d5","#c52b52","#70071d"),
 "aquamarine":("#b9fff6","#29b8c1","#0b5467"),
 "citrine":("#fff3ac","#dba831","#755017"),
}
def main():
 source=ROOT/"web/public/art/oath170-button-master.svg"
 css=ROOT/"web/test170-reference-buttons.css"
 script=ROOT/"web/test170-button-states.js"
 for f in (source,css,script,DIST/"index.html",DIST/"test169-reference.css"):
  if not f.is_file():raise RuntimeError("Missing approved reference dependency "+str(f))
 template=source.read_text(encoding="utf-8")
 for p in ("__THEME__","__STATE__","__LIGHT__","__MID__","__DARK__",
           "__INNER1__","__INNER2__","__BLUR__","__AURA__","__GLOW__"):
  if p not in template:raise RuntimeError("Missing SVG placeholder "+p)
 destination=DIST/"art/test170-buttons"
 destination.mkdir(parents=True,exist_ok=True)
 for theme,(light,mid,dark) in COLORS.items():
  for selected in (False,True):
   state="selected" if selected else "normal"
   replacements={
    "__THEME__":theme,"__STATE__":state,"__LIGHT__":light,
    "__MID__":mid,"__DARK__":dark,
    "__INNER1__":".44" if selected else ".04",
    "__INNER2__":".23" if selected else ".01",
    "__BLUR__":"6" if selected else "1.3",
    "__AURA__":"1" if selected else ".34",
    "__GLOW__":".9" if selected else ".25",
   }
   svg=template
   for a,b in replacements.items():svg=svg.replace(a,b)
   ET.fromstring(svg)
   path=destination/(theme+"-"+state+".svg")
   path.write_text(svg,encoding="utf-8")
   if path.stat().st_size<2500:raise RuntimeError("Incomplete button "+str(path))
 shutil.copyfile(css,DIST/"test170-reference-buttons.css")
 shutil.copyfile(script,DIST/"test170-button-states.js")
 index=DIST/"index.html"
 markup=index.read_text(encoding="utf-8")
 if markup.count("</head>")!=1 or "test170-button-states.js" in markup:
  raise RuntimeError("Unexpected or duplicate TEST 170 injection")
 # Apply only after TEST 169 styles have been installed.
 if "test169-reference.css" not in markup:
  raise RuntimeError("TEST 169 must precede shared button design")
 entry=('<link rel="stylesheet" href="./test170-reference-buttons.css" data-test170-master="true">'
        '<script type="module" src="./test170-button-states.js" data-test170-selected-state="true"></script>')
 index.write_text(markup.replace("</head>",entry+"</head>",1),encoding="utf-8")
 print("TEST 170: 12 themed selected/normal master frames installed; original dice, store artwork, results and purchases unchanged")
if __name__=="__main__":main()
