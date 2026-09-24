'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const json = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));
const pkg = json('package.json');

test('every version field matches package.json', () => {
  assert.equal(json('build/manifest.json').plugin.version, pkg.version, 'build/manifest.json');
  assert.equal(json('.claude-plugin/marketplace.json').plugins[0].version, pkg.version, '.claude-plugin/marketplace.json');
  assert.equal(json('adapters/claude/.claude-plugin/plugin.json').version, pkg.version, 'adapters/claude plugin.json (run: sdd build)');
});

test('the published files cover everything the CLI reads at runtime', () => {
  const covered = (p) => pkg.files.some((f) => f === p || (f.endsWith('/') && (p + '/').startsWith(f)));
  // bin/sdd reads the manifest, adapters/ and hooks/; `sdd build` also reads core/ and build/.
  for (const p of ['bin/sdd', 'build/manifest.json', 'build/generate.js', 'core', 'adapters', 'hooks/pre-commit']) {
    assert.ok(covered(p), `"${p}" is not in package.json files: installs from npm would break`);
    assert.ok(fs.existsSync(path.join(ROOT, p)), `${p} does not exist`);
  }
});

test('the bin points at an executable node script', () => {
  const bin = path.join(ROOT, pkg.bin.sdd);
  assert.match(fs.readFileSync(bin, 'utf8'), /^#!\/usr\/bin\/env node\n/);
});
