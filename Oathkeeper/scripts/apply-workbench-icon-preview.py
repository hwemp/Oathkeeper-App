#!/usr/bin/env python3
"""Repair ONLY the frozen Store's App Icons selection and preview mapping.

The enlarged preview must always use the same 1254x1254 master WebP used by
Android's launcher icon and the visible Store tile. Do not change the Store
background, dice, purchase handlers, RPG logic, or general button design.
This script is idempotent and refuses unexpected versions of the archived UI.
"""
from pathlib import Path
import re,hashlib

ROOT=Path(__file__).resolve().parent.parent
DIST=ROOT/"dist"
RUNTIME=DIST/"assets/main-FCw4hQ90.js"
IDS=("01","02","04","05","06","07","08","11","12","14")

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    for code in IDS:
        canonical=ROOT/"android/app/src/main/res/drawable-nodpi"/("oathkeeper_icon_art_"+code+".webp")
        store=ROOT/"web/public/art/store-icons"/("icon-"+code+".webp")
        used=DIST/"art/store-icons"/("icon-"+code+".webp")
        if not all(p.is_file() for p in (canonical,store,used)) or not sha(canonical)==sha(store)==sha(used):
            raise RuntimeError("Store, launcher, and frozen runtime icon differ: "+code)
    if not RUNTIME.is_file():raise RuntimeError("Frozen game runtime missing")
    original=RUNTIME.read_text(encoding="utf-8")
    start=original.index("function ay(")
    end=original.index("function okPickGrid(",start)
    old=original[start:end]
    tokens=("if(r.slug!=='icon-06')", "okNeutral(S,4,'icon-06'",
            "okImage(r.slug,r.name+' free app icon preview')",
            "function ay(i='icon-01'")
    if not all(token in old for token in tokens):
        raise RuntimeError("Unexpected legacy preview function; do not guess")
    if original.count("function ay(")!=1 or original.count("function okPickGrid(")!=1:
        raise RuntimeError("Frozen icon preview mapping was duplicated")
    if "workbench-selected-launcher-art" in original:
        raise RuntimeError("Workbench icon source patch already applied")
    # Preserve the exact original Store geometry, controls, names, actions and
    # purchasing restrictions. Only choose the canonical native image for
    # neutralized icon tile and the selected enlarged preview on ALL 10 slugs.
    new="""function ay(i='icon-01',u={supported:false,currentIcon:'default'}){
 const S=OKS.icons,r=Ol.find(d=>d.slug===i)||Ol[0],current=u?.currentIcon||'default',applied=current===r.iosIconName,supported=u?.supported===true;
 const master=String(r.slug);
 if(!/^icon-(01|02|04|05|06|07|08|11|12|14)$/.test(master))
  throw new Error('Unknown Android launcher icon selection');
 const exactIcon='art/store-icons/'+master+'.webp';
 let body=okTabs(S,'icons')+okNav(S)+okTiles(S,Ol,r.slug,'data-store-icon','Preview');
 // The frozen illustration contains an always-glowing default Chalice tile.
 // When another icon is selected, neutralize ONLY that stale baked-in tile
 // with the actual approved Android launcher master for icon-06.
 if(r.slug!=='icon-06'){
  const t=S.tiles,x=t.xs[4],y=t.ys[0],p=9;
  const box=[x-p,y-p,x+t.w+p,y+t.h+p];
  const image='<img class="ok-neutral-img" src="art/store-icons/icon-06.webp" alt="" draggable="false" style="left:'+(p/(t.w+2*p)*100)+'%;top:'+(p/(t.h+2*p)*100)+'%;width:'+(t.w/(t.w+2*p)*100)+'%;height:'+(t.h/(t.h+2*p)*100)+'%">';
  body+=okRegion(box,S.w,S.h,image,'ok-neutral-tile ok-icon-neutral-launcher','background:#010b17');
  body+=okButton([711,477,867,637],S.w,S.h,'data-store-icon="icon-06"','Preview Arcane Chalice');
 }
 // A single preview element is rendered for ALL selections, including Chalice.
 // It is strictly the SAME byte-verified native launcher WebP as the tile.
 // The old art/exact-store/icon-XX.webp preview path must never be used here.
 body+=okRegion([282,900,608,1226],S.w,S.h,
  '<img class="ok-art workbench-selected-launcher-art" src="'+exactIcon+'" data-launcher-master="'+master+'" alt="'+fe(r.name)+' exact Android launcher icon" draggable="false">',
  'ok-replacement-preview ok-icon-preview ok-icon-launcher-master');
 body+=okRegion([150,1255,737,1342],S.w,S.h,\`<p>Free fantasy launcher icon design.</p><p>\${applied?'This icon is currently applied.':fe(r.name)+' selected.'}</p>\`,'ok-text-mask');
 body+=okRegion([40,1418,850,1516],S.w,S.h,\`<p>All ten alternate app icons are FREE, and the original stays available.</p><div class="ok-icon-actions"><button data-store-apply-icon="\${r.slug}"\${!supported||applied?' disabled':''}>\${applied?'Icon Applied':'Apply Icon · FREE'}</button><button data-store-restore-icon="default"\${!supported||current==='default'?' disabled':''}>Restore Original Icon</button></div>\`,'ok-text-mask ok-icon-foot');
 return okPage('icons',okCanvas(S,body),\`<p class="ok-accessible-status" role="status">\${fe(r.name)} selected. \${supported?(applied?'Currently applied.':'Apply this free icon to your home screen.'):'Launcher icon changes require a supported installed app.'}</p>\`);
}
"""
    # The 144 JS uses literal template strings here. All $ expressions must
    # pass unchanged through Python: no f-string interpolation involved.
    if "art/exact-store/icon-" in new or "okImage(r.slug" in new:
        raise RuntimeError("Deprecated Store preview path reappeared")
    patched=original[:start]+new+original[end:]
    if patched.count("workbench-selected-launcher-art")!=1:
        raise RuntimeError("Unexpected duplicate selected preview mapping")
    if patched[:start]!=original[:start] or patched[start+len(new):]!=original[end:]:
        raise RuntimeError("Changes escaped the single Store icon-renderer function")
    RUNTIME.write_text(patched,encoding="utf-8")
    print("WORKBENCH ICON REPAIR: selected preview and icon-06 neutral tile use exact Android launcher master for all 10 choices. No other feature changed.")

if __name__=="__main__":
    main()
