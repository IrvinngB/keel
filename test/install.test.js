'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, sdd, write, read, entries } = require('./helpers');

const BEGIN = /<!-- keel:begin agent=generic -->/g;

test('generic --dry-run writes nothing', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'install', 'generic', '--project', '--dry-run');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(entries(dir), []);
  assert.equal(fs.existsSync(path.join(dir, '.git', 'hooks', 'pre-commit')), false);
});

test('generic install preserves user content and is idempotent', () => {
  const { dir, env } = repo();
  const mine = '# My project\n\nHouse rules stay here.\n';
  write(path.join(dir, 'AGENTS.md'), mine);

  assert.equal(sdd(dir, env, 'install', 'generic', '--project').status, 0);
  const once = read(path.join(dir, 'AGENTS.md'));
  assert.ok(once.startsWith(mine));
  assert.equal(once.match(BEGIN).length, 1);
  assert.ok(fs.existsSync(path.join(dir, '.sdd', 'core', 'orchestrator.md')));
  assert.ok(fs.existsSync(path.join(dir, '.git', 'hooks', 'pre-commit')));

  const again = sdd(dir, env, 'install', 'generic', '--project');
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /already up to date/);
  assert.equal(read(path.join(dir, 'AGENTS.md')), once);
});

test('keeps CRLF line endings of an existing context file', () => {
  const { dir, env } = repo();
  write(path.join(dir, 'AGENTS.md'), '# Rules\r\n\r\nWindows file.\r\n');
  assert.equal(sdd(dir, env, 'install', 'generic', '--project').status, 0);
  const text = read(path.join(dir, 'AGENTS.md'));
  assert.equal(text.replace(/\r\n/g, '').includes('\n'), false, 'no bare LF introduced');
});

test('refuses malformed markers and writes nothing', () => {
  const { dir, env } = repo();
  const broken = '# Rules\n<!-- keel:begin agent=generic -->\nno end marker\n';
  write(path.join(dir, 'AGENTS.md'), broken);
  const r = sdd(dir, env, 'install', 'generic', '--project');
  assert.notEqual(r.status, 0);
  assert.match(r.out, /malformed keel block markers/);
  assert.equal(read(path.join(dir, 'AGENTS.md')), broken);
  assert.equal(fs.existsSync(path.join(dir, '.sdd')), false);
});

for (const bad of ['../outside.md', '/etc/outside.md', 'docs/../../outside.md']) {
  test(`--context-file rejects ${bad}`, () => {
    const { dir, env } = repo();
    const r = sdd(dir, env, 'install', 'generic', '--project', `--context-file=${bad}`);
    assert.notEqual(r.status, 0);
    assert.match(r.out, /context-file/);
    assert.deepEqual(entries(dir), []);
  });
}

test('--context-file rejects a symlink that escapes the project', (t) => {
  const { dir, env } = repo();
  const outside = fs.mkdtempSync(path.join(require('os').tmpdir(), 'keel-out-'));
  try { fs.symlinkSync(outside, path.join(dir, 'link'), 'dir'); } catch (e) { return t.skip('symlinks unavailable'); }
  const r = sdd(dir, env, 'install', 'generic', '--project', '--context-file=link/GEMINI.md');
  assert.notEqual(r.status, 0);
  assert.match(r.out, /symlink/);
  assert.deepEqual(fs.readdirSync(outside), []);
});

test('codex and kimi share one AGENTS.md with separate blocks', () => {
  const { dir, env } = repo();
  assert.equal(sdd(dir, env, 'install', 'codex', '--project').status, 0);
  assert.equal(sdd(dir, env, 'install', 'kimi', '--project').status, 0);
  const text = read(path.join(dir, 'AGENTS.md'));
  assert.match(text, /keel:begin agent=codex/);
  assert.match(text, /keel:begin agent=kimi/);
  assert.equal(sdd(dir, env, 'install', 'codex', '--project').status, 0);
  assert.equal(read(path.join(dir, 'AGENTS.md')), text, 'rerun leaves both blocks unchanged');
});

test('unknown commands and agents fail with a hint', () => {
  const { dir, env } = repo();
  assert.match(sdd(dir, env, 'nope').out, /unknown command/);
  assert.match(sdd(dir, env, 'install', 'nope', '--project').out, /unknown tool/);
});
