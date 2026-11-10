import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

test('reference-inspired nav art is a complete SVG with two faceted amethyst jewels',async()=>{
 const asset=await readFile(new URL('../web/public/art/gothic-tab.svg',import.meta.url),'utf8');
 const document=new JSDOM(asset,{contentType:'image/svg+xml'}).window.document;
 assert.equal(document.documentElement.tagName,'svg');
 assert.equal(document.documentElement.getAttribute('viewBox'),'0 0 180 88');
 assert(document.querySelector('linearGradient#gold'));
 assert(document.querySelector('radialGradient#amethyst'));
 assert(document.querySelector('#jewel'));
 assert.equal(document.querySelectorAll('use[href="#jewel"]').length,2);
 assert.equal(document.querySelectorAll('use[href="#scroll"]').length,4);
 assert(document.querySelectorAll('path').length>10);
});

test('primary navigation shares one vector asset, with readable active labels',async()=>{
 const css=await readFile(new URL('../web/fantasy.css',import.meta.url),'utf8');
 assert.match(css,/#nav button::before\s*\{[^}]*background-image:url\('\/art\/gothic-tab\.svg'\)/);
 assert.match(css,/#nav button\.active::before\s*\{[^}]*filter:brightness/);
 assert.match(css,/#nav button:focus-visible\s*\{[^}]*outline/);
 assert.match(css,/\.hp-value \.hp-separator::after\{content:none;display:none\}/);
 const html=await readFile(new URL('../web/app.js',import.meta.url),'utf8');
 assert.match(html,/nav\.innerHTML=navigation\.map\(x=>/);
 assert.match(html,/\['Overview','Powers','Inventory','Dice'/);
 assert.match(html,/class="hp-separator" aria-hidden="true">\/<\/span>/);
});
