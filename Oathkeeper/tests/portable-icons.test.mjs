import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SELECTED_APP_ICONS} from '../web/store-icon-catalog.js';

const root = new URL('../web/public/art/store-icons/', import.meta.url);

test('every portable SVG contains exactly its high-resolution WebP master bytes', async () => {
  assert.equal(SELECTED_APP_ICONS.length, 10);
  for (const icon of SELECTED_APP_ICONS) {
    const id = String(icon.selection).padStart(2, '0');
    const source = await readFile(new URL('icon-' + id + '.webp', root));
    const svg = (await readFile(new URL('transfer-' + id + '.svg', root))).toString('utf8');
    assert.equal(icon.portableSvgPath, '/art/store-icons/transfer-' + id + '.svg');
    assert.match(svg, /width="1254" height="1254" viewBox="0 0 1254 1254"/);
    const match = svg.match(/<image[^>]+href="data:image\/webp;base64,([^"]+)"\/>/);
    assert(match, 'SVG must embed WebP data: ' + id);
    assert.deepEqual(Buffer.from(match[1], 'base64'), source, 'source bytes changed: ' + id);
    assert(!/data:image\/(png|jpeg|jpg)/i.test(svg), 'no JPEG or PNG re-encoding');
  }
});
