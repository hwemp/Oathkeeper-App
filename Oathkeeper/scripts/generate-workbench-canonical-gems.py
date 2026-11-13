#!/usr/bin/env python3
"""Render every standalone UI gemstone FROM the approved TEST 170 button master.

All six gemstones share the exact same face/facet paths, no hand-drawn
alternate geometry. This does not change gold frame geometry, theme mapping,
native form controls, Store artwork, or gameplay RNG. Intended to run during
dist construction, before any browser visual audit.
"""
from pathlib import Path
import xml.etree.ElementTree as ET
import re
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/"web/public/art/oath170-button-master.svg"
DEST=ROOT/"dist/art/canonical-gems"
COLORS={
 "amethyst":("#f6bcff","#9731ef","#36096d"),
 "sapphire":("#b8e5ff","#236bc6","#0a2878"),
 "emerald":("#adffcf","#24a963","#064f34"),
 "ruby":("#ffd3d5","#c52b52","#70071d"),
 "aquamarine":("#b9fff6","#29b8c1","#0b5467"),
 "citrine":("#fff3ac","#dba831","#755017")
}
NS="{http://www.w3.org/2000/svg}"
def must_child(group,tag):
    v=group.find(NS+tag)
    if v is None:raise RuntimeError("Canonical SVG missing "+tag)
    return v
def geometry(group):
    return [(node.tag.rsplit('}',1)[-1],node.get('d'),node.get('transform'))
            for node in group if node.tag in (NS+'path',NS+'polygon',NS+'polyline')]
def main():
    src=SOURCE.read_text(encoding="utf8")
    master=ET.fromstring(src)
    node=master.find(".//"+NS+"g[@id='gemstone']")
    if node is None:raise RuntimeError("Approved button master no longer has #gemstone")
    expected=geometry(node)
    if len(expected)<10:raise RuntimeError("Canonical facet geometry incomplete")
    # The tabletop is not a second shape authority: require its facet paths to
    # be exactly the same as approved button master, across all gem colors.
    tabletop=ET.parse(ROOT/"web/public/art/test171-tabletop-frame.svg").getroot()
    tabletop_node=tabletop.find(".//"+NS+"g[@id='gemstone']")
    if tabletop_node is None or geometry(tabletop_node)!=expected:
        raise RuntimeError("Tabletop gemstone differs from approved button master")
    gold=master.find(".//"+NS+"linearGradient[@id='gold']")
    gem=master.find(".//"+NS+"linearGradient[@id='gem']")
    if gold is None or gem is None:raise RuntimeError("Master gem gradient missing")
    import copy
    DEST.mkdir(parents=True,exist_ok=True)
    for name,(light,mid,dark) in COLORS.items():
        svg=ET.Element(NS+"svg",{
            "viewBox":"-35 -50 70 100","role":"img",
            "aria-label":"Faceted "+name+" from Oathkeeper approved master"})
        defs=ET.SubElement(svg,NS+"defs")
        defs.extend([copy.deepcopy(gold),copy.deepcopy(gem)])
        svg.append(copy.deepcopy(node))
        raw=ET.tostring(svg,encoding="unicode")
        raw=raw.replace("__LIGHT__",light).replace("__MID__",mid).replace("__DARK__",dark)
        if re.search(r"__[A-Z0-9_]+__",raw):
            raise RuntimeError("Unresolved gemstone parameter "+name)
        parsed=ET.fromstring(raw)
        standalone=parsed.find(".//"+NS+"g[@id='gemstone']")
        if standalone is None or geometry(standalone)!=expected:
            raise RuntimeError("Standalone "+name+" changed approved facet geometry")
        target=DEST/(name+".svg")
        target.write_text(raw,encoding="utf8")
    print("WORKBENCH GEM MASTER: six standalone color variants share exact TEST 170 faceted gem geometry; tabletop cross-check passed; no APK.")
if __name__=="__main__":main()
