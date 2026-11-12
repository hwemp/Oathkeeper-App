#!/usr/bin/env python3
"""TEST 171: split real gameplay toss from the approved Store showcase.
The source's secure result and modifiers stay exactly as before.
The previously approved 12-frame Store artwork remains unmodified.
"""
from pathlib import Path
import shutil,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
SRC=DIST/"assets"/"main-FCw4hQ90.js"
THEMES={
 "amethyst":("#f6bcff","#9731ef","#36096d"),
 "sapphire":("#b8e5ff","#236bc6","#0a2878"),
 "emerald":("#adffcf","#24a963","#064f34"),
 "ruby":("#ffd3d5","#c52b52","#70071d"),
 "aquamarine":("#b9fff6","#29b8c1","#0b5467"),
 "citrine":("#fff3ac","#dba831","#755017")
}
def main():
 for name in ["index.html","test169-reference.css","test170-reference-buttons.css",
              "test170-button-states.js"]:
  if not (DIST/name).is_file():raise RuntimeError("Missing 170 baseline "+name)
 for name in ["test171-gameplay-toss.js","test171-gameplay-toss.css"]:
  if not (ROOT/"web"/name).is_file():raise RuntimeError("Missing new gameplay asset "+name)
 if not SRC.is_file():raise RuntimeError("Frozen game source absent")
 s=SRC.read_text(encoding="utf-8")
 start=s.index("function zv(")
 end=s.index("const jp=Object.freeze",start)
 original=s[start:end]
 if original.count("function zv(")!=1 or "test169-approved-rolling-gif" not in original:
  raise RuntimeError("Wrong original selected-theme GIF roller version; refuse unsafe patch")
 if "const rolls=Rv(u);" not in original or "r();" not in original:
  raise RuntimeError("Expected secure-result delivery code missing")
 # The original GIF renderer remains the safe fallback if the gameplay
 # renderer script cannot load. Neither branch chooses/changes a die result.
 next_code=original.replace("function zv(i,u,r,c=null){",
   """function zv(i,u,r,c=null){
 if(globalThis.OathkeeperTabletop171 && typeof globalThis.OathkeeperTabletop171.play==='function'){
   return globalThis.OathkeeperTabletop171.play(i,u,r,c);
 }
 """,1)
 if next_code==original:raise RuntimeError("Unable to update the gameplay roller entry point")
 s=s[:start]+next_code+s[end:]
 if "globalThis.OathkeeperTabletop171.play(i,u,r,c)" not in s:
  raise RuntimeError("Gameplay call is missing")
 if "test169-approved-rolling-gif" not in s:
  raise RuntimeError("Preserved GIF fallback was lost")
 SRC.write_text(s,encoding="utf-8")
 # Same angled facet cut geometry as approved TEST 170 buttons.
 frame_template=(ROOT/"web/public/art/test171-tabletop-frame.svg").read_text(encoding="utf-8")
 folder=DIST/"art/test171-tabletop-frames"
 folder.mkdir(parents=True,exist_ok=True)
 for theme,(light,mid,dark) in THEMES.items():
  frame=(frame_template.replace("__THEME__",theme)
          .replace("__LIGHT__",light).replace("__MID__",mid).replace("__DARK__",dark))
  ET.fromstring(frame)
  (folder/(theme+".svg")).write_text(frame,encoding="utf-8")
  if "<use href=\"#gemstone\"" not in frame:
   raise RuntimeError("Approved faceted gemstone lost for "+theme)
 for name in ("test171-gameplay-toss.js","test171-gameplay-toss.css"):
  shutil.copyfile(ROOT/"web"/name,DIST/name)
 index=DIST/"index.html"
 html=index.read_text(encoding="utf-8")
 if "test171-gameplay-toss" in html or html.count("</head>")!=1:
  raise RuntimeError("Duplicate gameplay script or unexpected HEAD")
 if "test170-button-states.js" not in html:
  raise RuntimeError("This gameplay module requires TEST 170 reference controls")
 entry=('<link rel="stylesheet" href="./test171-gameplay-toss.css" data-test171-style="true">'
        '<script defer src="./test171-gameplay-toss.js" data-test171-gameplay="true"></script>')
 index.write_text(html.replace("</head>",entry+"</head>",1),encoding="utf-8")
 print("TEST 171 installed: original Store GIF preserved; 6 tight gemstone tabletop frames; independent visual-only gameplay toss.")
if __name__=="__main__":main()
