'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, git, sdd } = require('./helpers');
const { plannedFiles } = require('../bin/sdd');
const pkg = require('../package.json');

test('sdd --version, -v, and version print package version and exit 0', () => {
  const { dir, env } = repo();
  for (const flag of ['--version', '-v', 'version']) {
    const r = sdd(dir, env, flag);
    assert.equal(r.status, 0, r.out);
    assert.equal(r.out.trim(), `keel-sdd ${pkg.version}`);
  }
});

test('plannedFiles extracts non-keel/non-adapter paths from File Changes table', () => {
  const md = `# Design\n\n## File Changes\n| File | Action | Description |\n|------|--------|-------------|\n| \`bin/sdd\` | Modify | CLI |\n| \`keel/config.yaml\` | Modify | Config |\n| \`adapters/claude/a.md\` | Regenerate | Built |\n`;
  assert.deepEqual(plannedFiles(md), ['bin/sdd']);
});

test('sdd drift reports clean match and detects unplanned/untouched files with --strict', () => {
  const { dir, env } = repo();
  git(dir, env, 'branch', '-M', 'main');
  fs.writeFileSync(path.join(dir, 'a.js'), '1\n');
  fs.writeFileSync(path.join(dir, 'b.js'), '1\n');
  git(dir, env, 'add', '.');
  git(dir, env, 'commit', '-q', '-m', 'base');

  git(dir, env, 'checkout', '-q', '-b', 'feat/test');
  const changeDir = path.join(dir, 'keel', 'changes', 'demo-drift');
  fs.mkdirSync(changeDir, { recursive: true });
  fs.writeFileSync(path.join(changeDir, 'state.yaml'), 'current_phase: verify\ncompleted: [design]\nopen_questions: []\nupdated: 2026-11-18\nstatus: active\n');
  fs.writeFileSync(path.join(changeDir, 'design.md'), '# Design\n\n## File Changes\n| File | Action | Description |\n|------|--------|-------------|\n| `a.js` | Modify | Planned |\n');
  fs.writeFileSync(path.join(dir, 'a.js'), '2\n');
  git(dir, env, 'add', '.');
  git(dir, env, 'commit', '-q', '-m', 'work');

  const clean = sdd(dir, env, 'drift', 'demo-drift', '--base=main', '--strict');
  assert.equal(clean.status, 0, clean.out);
  assert.match(clean.out, /drift demo-drift: none/);

  fs.writeFileSync(path.join(dir, 'b.js'), '2\n');
  const drifted = sdd(dir, env, 'drift', 'demo-drift', '--base=main', '--strict');
  assert.equal(drifted.status, 1);
  assert.match(drifted.out, /\+ unplanned: b\.js/);
});
