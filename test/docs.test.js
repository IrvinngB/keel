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

// ---- Antigravity is documented as Experimental, never Tested ----

const section = (text, heading) => {
  const m = text.match(new RegExp(`^## ${heading}\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'm'));
  return m ? m[1] : '';
};

for (const f of ['README.md', 'docs/es/README.md']) {
  test(`${f} lists Antigravity as Experimental and no longer says unsupported`, () => {
    const row = read(f).split('\n').find((l) => /^\| Antigravity /.test(l)) || '';
    assert.match(row, /Experimental/);
    assert.doesNotMatch(row, /Tested|Probado/);
    assert.doesNotMatch(read(f), /Antigravity \(`agy`\) (is not supported yet|todavía no)/);
  });
}

for (const [f, unproven] of [['docs/install.md', /unproven/], ['docs/es/instalacion.md', /sin comprobar/]]) {
  test(`${f} documents Antigravity as Experimental with the 0.3.0 test as scoped, unproven history`, () => {
    const body = section(read(f), 'Antigravity');
    assert.match(body, /Experimental/);
    assert.doesNotMatch(body, /\bTested\b|\bProbado\b/);
    assert.match(body, /0\.3\.0/);
    assert.match(body, unproven);
    assert.match(body, /~\/\.gemini\/config\/skills/);
    assert.match(body, /~\/\.gemini\/antigravity-cli\/skills/);
  });
}

test('CHANGELOG records Antigravity under Unreleased and leaves the 0.3.0 entry untouched', () => {
  const log = read('CHANGELOG.md');
  const unreleased = log.split(/^## 0\./m)[0];
  assert.match(unreleased, /Antigravity/);
  assert.ok(log.includes('- Antigravity (`agy`) is not supported yet: its project-level skills and commands paths\n  are unconfirmed.'));
});
