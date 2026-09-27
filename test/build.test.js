'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'manifest.json'), 'utf8')).registry;
const gen = require('../build/generate.js');

const clone = () => JSON.parse(JSON.stringify(REGISTRY));
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const SIDE = ['mcp-generic.md', 'sqlite.md', 'template.md'];

test('an invalid persistence_docs value fails the build naming the agent', () => {
  const reg = clone();
  reg.codex.persistence_docs = 'separate';
  assert.throws(() => gen.validateRegistry(reg), /registry\.codex\.persistence_docs must be inline\|side-files/);
  reg.codex.persistence_docs = 'inline';
  assert.doesNotThrow(() => gen.validateRegistry(reg));
});

test('agents sharing the skills dir must agree on persistence_docs, and the error names both', () => {
  const reg = clone();
  reg.opencode.persistence_docs = 'side-files';
  reg.opencode.persistenceDocsVerified = '2026-01-01 test';
  assert.throws(() => gen.validateRegistry(reg), (e) => /opencode/.test(e.message) && /codex/.test(e.message));
});

test('side-files without persistenceDocsVerified fails; with it, claude (own dir) passes', () => {
  const reg = clone();
  reg.claude.persistence_docs = 'side-files';
  assert.throws(() => gen.validateRegistry(reg), /registry\.claude\.persistenceDocsVerified/);
  reg.claude.persistenceDocsVerified = '2026-01-01 test';
  assert.doesNotThrow(() => gen.validateRegistry(reg));
});

test('inline keeps every doc in the original order and emits no side files', () => {
  const ctx = gen.loadCtx();
  const { body, side } = gen.skillBody('claude', ctx, false, 'inline');
  assert.deepEqual(side, []);
  const names = fs.readdirSync(path.join(ROOT, 'core', 'persistence')).filter((f) => f.endsWith('.md')).sort();
  const heads = names.map((n) => fs.readFileSync(path.join(ROOT, 'core', 'persistence', n), 'utf8').split('\n')[0]);
  const at = heads.map((h) => body.indexOf(h));
  assert.ok(at.every((i) => i >= 0), 'every doc heading is inline');
  assert.deepEqual([...at].sort((a, b) => a - b), at);
});

test('side-files keeps interface and files inline, emits the other three, and is shorter', () => {
  const ctx = gen.loadCtx();
  const inline = gen.skillBody('claude', ctx, false, 'inline');
  const side = gen.skillBody('claude', ctx, false, 'side-files');
  assert.deepEqual(side.side.map((s) => s.name), SIDE);
  assert.match(side.body, /# Persistence backend: files/);
  assert.match(side.body, /# Persistence — Backend Interface/);
  assert.doesNotMatch(side.body, /# Persistence backend: SQLite/);
  assert.ok(words(side.body) < words(inline.body));
  const total = side.side.reduce((n, s) => n + words(s.text), 0);
  assert.ok(Math.abs(words(side.body) + total - words(inline.body)) < 40, 'nothing lost besides separators');
});

test('the load rule is in the body in every mode', () => {
  const ctx = gen.loadCtx();
  for (const mode of ['inline', 'side-files'])
    assert.match(gen.skillBody('claude', ctx, false, mode).body, /tell the user to run `sdd install` and stop/);
  assert.match(fs.readFileSync(path.join(ROOT, 'adapters', 'generic', 'core', 'persistence', 'interface.md'), 'utf8'), /tell the user to run `sdd install` and stop/);
});

test('GUARD: committed adapters ship no persistence/ folder beside a skill (all agents are inline)', () => {
  const found = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (!e.isDirectory()) continue;
      if (e.name === 'persistence' && path.basename(path.dirname(p)) === 'sdd-workflow') found.push(p);
      walk(p);
    }
  };
  walk(path.join(ROOT, 'adapters'));
  assert.deepEqual(found, []);
});

// Runs `sdd build` on a private copy so no test touches the real adapters/.
function sandbox() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'keel-build-'));
  for (const n of ['bin', 'build', 'core', 'hooks', 'package.json']) fs.cpSync(path.join(ROOT, n), path.join(dir, n), { recursive: true });
  return dir;
}
const build = (dir) => cp.spawnSync(process.execPath, [path.join(dir, 'bin', 'sdd'), 'build'], { cwd: dir, encoding: 'utf8' });

test('sdd build exits 0 on success and writes adapters', () => {
  const dir = sandbox();
  const r = build(dir);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /generate: OK/);
  assert.ok(fs.existsSync(path.join(dir, 'adapters', 'claude', 'skills', 'sdd-workflow', 'SKILL.md')));
});

test('sdd build exits 1 with the generate: ERROR line and cleans the build dir', () => {
  const dir = sandbox();
  fs.rmSync(path.join(dir, 'hooks', 'tasks-guard.sh'));
  const r = build(dir);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /generate: ERROR: hooks\/tasks-guard\.sh is missing/);
  assert.equal(fs.existsSync(path.join(dir, 'adapters.build')), false);
});
