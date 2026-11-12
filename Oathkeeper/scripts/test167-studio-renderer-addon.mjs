/* TEST 167 build-only studio export.
   Concatenated to an EXACT COPY of the approved dice-tabletop.js source.
   drawDie(), drawGemFace(), the D20 UV mapping and all geometry are untouched.
   No animation or randomness is invoked to create a store preview. */
export async function drawApprovedStudioDie(canvas, geometry, skin=null){
 const valid=new Set([3,4,6,8,10,12,20,50,100]);
 if(!valid.has(geometry))throw Error('Unexpected die geometry: '+geometry);
 const logicalWidth=248,logicalHeight=175,scale=4;
 canvas.width=logicalWidth*scale;
 canvas.height=logicalHeight*scale;
 const ctx=canvas.getContext('2d',{alpha:true});
 if(!ctx)throw Error('Canvas 2D rendering unavailable');
 const palette=diceSkinPalette(skin);
 let art=getArtwork(skin,geometry);
 for(let i=0;!art&&i<120;i++){
   await new Promise(resolve=>setTimeout(resolve,25));
   art=getArtwork(skin,geometry);
 }
 if(!art)throw Error('Original dice artwork failed to load');
 if(geometry===20){
   let uv=liveD20Texture(skin);
   for(let i=0;!uv&&i<160;i++){
     await new Promise(resolve=>setTimeout(resolve,25));
     uv=liveD20Texture(skin);
   }
   if(!uv)throw Error('The approved D20 face texture did not finish loading');
 }
 ctx.setTransform(scale,0,0,scale,0,0);
 ctx.clearRect(0,0,logicalWidth,logicalHeight);
 ctx.imageSmoothingEnabled=true;
 ctx.imageSmoothingQuality='high';
 // Subtle tabletop ring like the reference GIF, behind the die.
 // Keeping the card transparent prevents an unrelated dark rectangle.
 const ring=ctx.createRadialGradient(124,140,2,124,140,102);
 ring.addColorStop(0,'rgba(204,114,255,.15)');
 ring.addColorStop(.58,'rgba(145,66,221,.11)');
 ring.addColorStop(1,'rgba(145,66,221,0)');
 ctx.fillStyle=ring;ctx.fillRect(12,108,224,65);
 ctx.beginPath();ctx.ellipse(124,142,92,15,0,0,Math.PI*2);
 ctx.strokeStyle=palette.gold;ctx.globalAlpha=.5;ctx.lineWidth=1.45;ctx.stroke();
 ctx.globalAlpha=.25;
 ctx.beginPath();ctx.ellipse(124,142,84,12,0,0,Math.PI*2);
 ctx.strokeStyle='#d9a4f3';ctx.lineWidth=1;ctx.stroke();
 ctx.globalAlpha=1;
 // One stable finished-roll pose is the ONLY difference from the moving
 // runtime: progress=1, finished=true, no random sampled result or tween.
 const label={3:3,4:4,6:6,8:8,10:10,12:12,20:20,50:35,100:75}[geometry];
 const die={geometry,face:String(label),caption:'D'+geometry,index:0};
 const size=geometry===3?58:(geometry===50||geometry===100?58:60);
 drawDie(ctx,die,124,78,size,1,true,palette,art);
 return {width:canvas.width,height:canvas.height,geometry,skin:skin?.slug||'default'};
}
