'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// English source -> Spanish translation. The translation must keep the same skeleton,
// so a section added to one language and not the other fails here.
const PAIRS = [
  ['README.md', 'docs/es/README.md'],
  ['docs/install.md', 'docs/es/instalacion.md'],
  ['CONTRIBUTING.md', 'docs/es/contribuir.md'],
];
const sections = (t) => (t.match(/^## /gm) || []).length;
const codeBlocks = (t) => (t.match(/^```/gm) || []).length / 2;

for (const [en, es] of PAIRS) {
  test(`${es} keeps the structure of ${en}`, () => {
    assert.equal(sections(read(es)), sections(read(en)), 'number of "## " sections (update the translation)');
    assert.equal(codeBlocks(read(es)), codeBlocks(read(en)), 'number of code blocks (update the translation)');
  });
}

test('relative links in the docs point at files that exist', () => {
  const files = PAIRS.flat().concat(['docs/install.md']);
  const broken = [];
  for (const f of new Set(files)) {
    for (const m of read(f).matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = m[1].split('#')[0];
      if (!target || /^[a-z]+:/i.test(target)) continue;
      if (!fs.existsSync(path.resolve(ROOT, path.dirname(f), target))) broken.push(`${f} -> ${m[1]}`);
    }
  }
  assert.deepEqual(broken, []);
});
