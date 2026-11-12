#!/usr/bin/env python3
"""TEST 169: source-level repair to the archived Store runtime.
Use a single full-page image for every background; never paste an image over
the baked default. The original GIF roller and dice RNG remain untouched.
"""
from pathlib import Path
import shutil
ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
SRC=DIST/"assets"/"main-FCw4hQ90.js"
STYLE=ROOT/"web"/"test169-reference.css"
SKINS=["dragonfire","frostborne","elvenleaf","celestial","abyssal",
"gold-forged","necrotic","astral","oceanic","sunfire"]
SHAPES=[3,4,6,8,10,12,20,50,100]
def main():
 if not SRC.is_file():raise RuntimeError("Frozen Build 144 compiled runtime absent")
 s=SRC.read_text(encoding="utf-8")
 before_engine=s[s.index("function okDiceStage("):s.index("function ey(")]
 if "art/exact-store/roll/" not in before_engine or "ok-roll-box" not in before_engine:
  raise RuntimeError("Approved GIF-powered Store animation missing")
 start=s.index("function ty(")
 end=s.index("function ay(",start)
 old=s[start:end]
 if "ok-replacement-preview" not in old or "ok-bg-copy" not in old:
  raise RuntimeError("Unexpected background overlay implementation")
 new="""function ty(i='moonlit-citadel',u={}){
 const S=OKS.backgrounds,r=ha.find(d=>d.slug===i)||ha[0];
 let body=okTabs(S,'backgrounds')+okNav(S)+okTiles(S,ha,r.slug,'data-store-background','Preview');
 body+=okButton([45,1262,458,1338],S.w,S.h,'data-store-buy-id="'+ch('backgrounds',r.slug).id+'"','Purchase '+r.name+' background — checkout unavailable',false,true);
 body+=okButton([487,1262,894,1338],S.w,S.h,'data-store-restore-purchases="true"','Restore Purchases',false,!u.restoreAvailable);
 const page={...S,img:'test169-bg/'+r.slug};
 return okPage('backgrounds',okCanvas(page,body),okPaidExtras('backgrounds',r,u));
}
"""
 s=s[:start]+new+s[end:]
 # Replace actual bundle image reference, not its rendered overlay.
 original='>$'+'{okImage(d.slug)}<span class="ok-pick-name">'
 replacement='>$'+'{okImage(kind===\\'dice\\'?\\'roll/\\'+d.slug+\\'-still\\':d.slug)}<span class="ok-pick-name">'
 # Correct JS single-quoted string representation (no literal backslashes).
 replacement=replacement.replace("\\'","'")
 if s.count(original)!=1:raise RuntimeError("Bundle image source call changed")
 s=s.replace(original,replacement,1)
 if s[s.index("function okDiceStage("):s.index("function ey(")]!=before_engine:
  raise RuntimeError("Approved original animation mutated")
 if "ok-replacement-preview" in s[s.index("function ty("):s.index("function ay(")]:
  raise RuntimeError("Old pasted overlay remains")
 SRC.write_text(s,encoding="utf-8")
 if not STYLE.is_file():raise RuntimeError("Shared design stylesheet missing")
 css=DIST/"test169-reference.css"
 shutil.copyfile(STYLE,css)
 mappings=["/* Reference GIF and illustrated dice; all cosmetic themes share the approved master. */"]
 for slug in SKINS:
  frame='./art/exact-store/roll/'+slug+'-still.webp'
  mappings.append('.ok-exact-store [data-store-dice="'+slug+'"]::before'+
                  '{background-image:url("'+frame+'")!important;}')
  mappings.append('.dice-applied-skin[data-applied-dice="'+slug+'"] .dice-applied-art'+
                  '{background-image:url("'+frame+'")!important;}')
 for sides in SHAPES:
  mappings.append('.dice-page .die-tile[data-die="'+str(sides)+'"] .reference-die'+
                  '{background-image:url("./art/test169-dice/default/d'+str(sides)+'.webp")!important;}')
  for slug in SKINS:
   mappings.append('body:has(.dice-applied-skin[data-applied-dice="'+slug+'"]) .dice-page .die-tile[data-die="'+str(sides)+'"] .reference-die'+
                   '{background-image:url("./art/test169-dice/'+slug+'/d'+str(sides)+'.webp")!important;}')
 with css.open("a",encoding="utf-8") as writer:writer.write("\n"+"\n".join(mappings)+"\n")
 index=DIST/"index.html";html=index.read_text(encoding="utf-8")
 if "test169-reference.css" in html or html.count("</head>")!=1:
  raise RuntimeError("Cannot safely install CSS")
 if "test168-live-3d.js" in html or "test166-bundle-overlay.js" in html:
  raise RuntimeError("Synthetic WebGL or duplicate bundle layer still active")
 link='<link rel="stylesheet" href="./test169-reference.css" data-test169-approved-reference="true">'
 index.write_text(html.replace("</head>",link+"</head>",1),encoding="utf-8")
 print("TEST 169: native full-frame background pages, original GIF and bundle art restored. No polygon overlays.")
if __name__=="__main__":main()
