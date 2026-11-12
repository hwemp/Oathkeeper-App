import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css = readFileSync(new URL('../web/ornate-buttons.css', import.meta.url), 'utf8');
const svg = ['ornate-amethyst','ornate-flourish-left','ornate-flourish-right'];
test('vector ornament is attached to every button without changing its actions', () => {
  assert.match(css, /:where\(button, a\.button, \[role="button"\]\)::after/);
  assert.match(css, /pointer-events: none/);
  assert.doesNotMatch(css, /\b(?:animation|transform|object-fit|image-rendering)\s*:/);
});
test('quality-preserving vector artwork is present and valid', () => {
  for(const f of svg) {
    const content=readFileSync(new URL('../web/public/art/'+f+'.svg', import.meta.url),'utf8');
    assert.match(content, /<svg\b/);
    assert.match(content, /<\/svg>/);
  }
});
test('image selection galleries preserve original art rather than replacing it', () => {
  assert.match(css, /\.store-background-tile/);
  assert.match(css, /\.bundle-pick/);
  assert.match(css, /\.store-icon-tile/);
  assert.match(css, /\.store-dice-tile/);
  assert.doesNotMatch(css, /\.store-background-tile\s*img\s*\{/);
});
