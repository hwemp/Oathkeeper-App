/* TEST 168: the SAME WebGL scene powers gallery images and live 3D rolls. */
import {JewelDiceScene,themeSlugForCatalogue} from './test168-jewel-scene.js';
const c=document.querySelector('#preview');
const studio=new JewelDiceScene(c,{capture:true,width:248,height:175});
studio.setSize(248,175,4);
window.__test168Studio={
 render(slug,sides){
  const skin=themeSlugForCatalogue(slug);
  studio.setDice(Number(sides),skin,1);
  studio.render(1,[Number(sides)===100?75:Number(sides)===50?35:Number(sides)]);
  return {image:studio.exportPNG().split(',')[1],width:c.width,height:c.height,skin,sides};
 },
 dispose(){studio.dispose()}
};
