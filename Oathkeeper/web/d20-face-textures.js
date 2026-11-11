// Oathkeeper D20 face materials: vector-resolution UV atlas, 20 distinct faces.
// Live dice animation uses this, NOT the painted collection preview.
const THEMES=Object.freeze({
 'royal-purple':['#50207c','#a350e0','#efd08a','#1a0b30','star'],
 'dragonfire':['#5b1421','#f04720','#ffc06a','#21070f','flame'],
 'frostborne':['#0b3e73','#6ac8f0','#fff4dc','#08203d','snowflake'],
 'elvenleaf':['#0c583b','#39a75d','#f5d78b','#07331d','tree'],
 'celestial':['#655c9b','#fff6db','#d9aa58','#33264b','sun'],
 'abyssal':['#2c1454','#a33de8','#b6f8ec','#14082d','rune'],
 'gold-forged':['#55411e','#bd8d31','#ffe9a1','#1c1609','shield'],
 'necrotic':['#143a24','#30a44c','#bddd8d','#0b170e','skull'],
 'astral':['#34206b','#853cff','#ebc5ff','#130c36','spiral'],
 'oceanic':['#0a4862','#14a9d1','#afedf3','#092538','wave'],
 'sunfire':['#6c2a08','#fa781c','#ffe69c','#351106','sun']
});
export const D20_THEME_SLUGS=Object.freeze(Object.keys(THEMES));
const ORNAMENTS={
 tree:'<path d="M200 93V143 M170 119L200 100L230 119 M177 108L200 90L223 108"/>',
 wave:'<path d="M163 109Q182 88 200 109T237 109 M163 128Q182 107 200 128T237 128"/>',
 snowflake:'<path d="M200 80V146 M168 113H232 M176 89L224 137 M224 89L176 137"/>',
 sun:'<circle cx="200" cy="113" r="14"/><path d="M200 84V76M200 142V150M171 113H163M229 113H237M179 92L172 85M221 134L228 141M179 134L172 141M221 92L228 85"/>',
 shield:'<path d="M200 83L224 91V118Q219 132 200 146Q181 132 176 118V91Z"/>',
 flame:'<path d="M199 78Q177 108 181 124Q183 142 201 145Q223 143 220 120Q216 102 209 98Q210 118 196 119Q191 109 199 78Z"/>',
 skull:'<path d="M183 101Q181 84 200 83Q219 84 217 101L212 124H188Z"/><circle cx="193" cy="108" r="4"/><circle cx="207" cy="108" r="4"/>',
 spiral:'<path d="M208 98C190 85 178 103 185 119C192 135 220 134 222 112C223 90 184 82 173 111"/>',
 rune:'<path d="M182 136L192 83L207 115L222 90M178 117H226"/>',
 star:'<path d="M200 81L207 103L229 111L207 119L200 144L193 119L171 111L193 103Z"/>'
};
export function d20FaceSvg(slug='royal-purple'){
 const [base,highlight,trim,shadow,motif]=THEMES[slug]||THEMES['royal-purple'];
 const tiles=Array.from({length:20},(_,i)=>{
  const x=(i%5)*400,y=Math.floor(i/5)*400;
  return `<g transform="translate(${x} ${y})">
   <rect width="400" height="400" fill="${shadow}"/>
   <path d="M200 24 L28 360 L372 360Z" fill="url(#gem)" stroke="${trim}" stroke-width="9" stroke-linejoin="round"/>
   <path d="M200 24L128 277L200 215L272 277Z" fill="${highlight}" fill-opacity=".25"/>
   <path d="M28 360L200 215L372 360" fill="none" stroke="${trim}" stroke-opacity=".42" stroke-width="3"/>
   <g stroke="${trim}" stroke-width="5" fill="none" opacity=".89" stroke-linecap="round" stroke-linejoin="round">${ORNAMENTS[motif]}</g>
   <path d="M78 337Q116 314 142 340 M260 340Q289 315 322 337" fill="none" stroke="${trim}" stroke-width="4"/>
   <text x="200" y="278" font-family="Georgia,DejaVu Serif,serif" font-size="${i<9?95:84}" font-weight="bold" text-anchor="middle" paint-order="stroke fill" stroke="#1a0d29" stroke-width="12" fill="${trim}">${i+1}</text>
  </g>`;
 }).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2000" viewBox="0 0 2000 2000"><defs>
 <linearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${highlight}" offset="0"/><stop stop-color="${base}" offset=".41"/><stop stop-color="${highlight}" offset=".64"/><stop stop-color="${shadow}" offset="1"/></linearGradient>
 </defs>${tiles}</svg>`;
}
const CACHE=new Map();
export function liveD20Texture(skin){
 const slug=skin?.slug&&THEMES[skin.slug]?skin.slug:'royal-purple';
 if(!CACHE.has(slug)&&typeof globalThis.Image==='function'){
  const img=new globalThis.Image();img.decoding='async';
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(d20FaceSvg(slug));
  CACHE.set(slug,img);
 }
 const image=CACHE.get(slug);
 return image?.complete&&image?.naturalWidth===2000?image:null;
}

/* Animation-only SVG die surface; no static Store preview artwork on 3D faces. */
export function dieSurfaceSvg(slug='royal-purple'){
 const [base,highlight,trim,shadow,motif]=THEMES[slug]||THEMES['royal-purple'];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs>
 <radialGradient id="material" cx="37%" cy="28%" r="85%"><stop stop-color="${highlight}"/><stop offset=".43" stop-color="${base}"/><stop offset="1" stop-color="${shadow}"/></radialGradient></defs>
 <rect width="512" height="512" fill="url(#material)"/>
 <path d="M0 0L512 512M512 0L0 512M256 0V512M0 256H512" stroke="${trim}" stroke-opacity=".22" stroke-width="9"/>
 <path d="M24 24H488V488H24Z M64 64L448 448M448 64L64 448" stroke="${trim}" stroke-opacity=".34" stroke-width="6" fill="none"/>
 <g transform="translate(16 118) scale(1.2)" stroke="${trim}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" fill="none">${ORNAMENTS[motif]}</g></svg>`;
}
const DIE_FACE_CACHE=new Map();
export function liveDieFaceTexture(skin){
 const slug=skin?.slug&&THEMES[skin.slug]?skin.slug:'royal-purple';
 if(!DIE_FACE_CACHE.has(slug)&&typeof globalThis.Image==='function'){
  const image=new globalThis.Image();image.decoding='async';
  image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(dieSurfaceSvg(slug));
  DIE_FACE_CACHE.set(slug,image);
 }
 const image=DIE_FACE_CACHE.get(slug);
 return image?.complete&&image?.naturalWidth===512?image:null;
}
