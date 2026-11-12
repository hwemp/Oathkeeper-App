#!/usr/bin/env python3
"""Add narrowly scoped TEST 164 styles without changing the frozen 144 runtime."""
from pathlib import Path
import re, shutil, hashlib
root=Path(__file__).resolve().parent.parent
dist=root/'dist'
index=dist/'index.html'
if not index.is_file() or not (dist/'ornate-buttons.css').is_file():
    raise RuntimeError('Run the verified Build 144 extraction and 163 overlay first')
source=root/'web'/'test164-overrides.css'
content=source.read_text()
for marker in ('#journalEditor', '#equipmentEditor [data-draft-remove]', 'data-store-dice', 'data-store-icon', 'notification-bell'):
    if marker not in content: raise RuntimeError('164 CSS missing necessary selector: '+marker)
target=dist/'test164-overrides.css'
shutil.copyfile(source,target)
html=index.read_text()
insert='<link rel="stylesheet" href="./test164-overrides.css" data-test164-design="master-reference">'
if html.count('</head>')!=1 or 'test164-overrides.css' in html:
    raise RuntimeError('Unsafe or duplicate 164 stylesheet injection')
index.write_text(html.replace('</head>',insert+'</head>',1))
# Do not mutate any archived 144 dice motion/game/launcher assets.
if not (dist/'art/exact-store/roll/astral.webp').is_file():
    raise RuntimeError('Frozen original roll artwork missing')
for n in ('01','02','04','05','06','07','08','11','12','14'):
    master=root/'android/app/src/main/res/drawable-nodpi'/('oathkeeper_icon_art_'+n+'.webp')
    catalog=root/'web/public/art/store-icons'/('icon-'+n+'.webp')
    if not catalog.is_file() or not master.is_file():
        raise RuntimeError('Missing native Android launcher master or catalog art '+n)
    if hashlib.sha256(catalog.read_bytes()).digest()!=hashlib.sha256(master.read_bytes()).digest():
        raise RuntimeError('Store catalog art and native Android launcher master disagree '+n)
    (dist/'art/store-icons').mkdir(parents=True, exist_ok=True)
    for filename in ('icon-'+n+'.webp','launcher-'+n+'.webp'):
        shutil.copyfile(master,dist/'art/store-icons'/filename)
        if hashlib.sha256((dist/'art/store-icons'/filename).read_bytes()).digest()!=hashlib.sha256(master.read_bytes()).digest():
            raise RuntimeError('Written Store preview differs from native launcher reference '+filename)
print('164 stylesheet installed; 10 icons are byte-identical to native launcher masters.')
