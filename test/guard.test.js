'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, git, sdd, tryCommit, write, read } = require('./helpers');

const PENDING_TASKS = '# Tasks\n\n- [x] done\n- [ ] still open\n';
const hook = (dir) => path.join(dir, '.git', 'hooks', 'pre-commit');
const chained = (dir) => path.join(dir, '.git', 'hooks', 'pre-commit.keel-chained');

test('install writes an executable guard that blocks commits with unchecked tasks', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'guard', 'install');
  assert.equal(r.status, 0, r.out);
  assert.match(read(hook(dir)), /^# keel commit guard v\d+$/m);
  if (process.platform !== 'win32') assert.ok(fs.statSync(hook(dir)).mode & 0o100);

  assert.ok(tryCommit(dir, env).ok, 'no keel/ yet: commit allowed');
  write(path.join(dir, 'keel', 'changes', 'feat-a', 'tasks.md'), PENDING_TASKS);
  const blocked = tryCommit(dir, env);
  assert.equal(blocked.ok, false);
  assert.match(blocked.out, /feat-a: 1 unchecked task/);
  assert.ok(tryCommit(dir, env, { SDD_ALLOW_COMMIT: '1' }).ok, 'deliberate bypass');
});

test('an existing hook in another language is kept intact and still runs', () => {
  const { dir, env } = repo();
  const original = `#!${process.execPath.includes(' ') ? '/usr/bin/env node' : process.execPath}\nrequire('fs').writeFileSync('chained-ran', 'yes');\n`;
  write(hook(dir), original, 0o755);

  const r = sdd(dir, env, 'guard', 'install');
  assert.equal(r.status, 0, r.out);
  assert.equal(read(chained(dir)), original, 'original moved byte-for-byte');

  assert.ok(tryCommit(dir, env).ok);
  assert.equal(read(path.join(dir, 'chained-ran')), 'yes');
});

test('the chained hook can still block the commit', () => {
  const { dir, env } = repo();
  write(hook(dir), '#!/bin/sh\necho "lint failed" >&2\nexit 1\n', 0o755);
  sdd(dir, env, 'guard', 'install');
  const r = tryCommit(dir, env);
  assert.equal(r.ok, false);
  assert.match(r.out, /lint failed/);
});

test('reinstall is idempotent and remove restores the original', () => {
  const { dir, env } = repo();
  const original = '#!/bin/sh\necho original\n';
  write(hook(dir), original, 0o755);
  sdd(dir, env, 'guard', 'install');
  const first = read(hook(dir));

  const again = sdd(dir, env, 'guard', 'install');
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /updated/);
  assert.equal(read(hook(dir)), first);
  assert.equal(read(chained(dir)), original);

  const rm = sdd(dir, env, 'guard', 'remove');
  assert.equal(rm.status, 0, rm.out);
  assert.equal(read(hook(dir)), original);
  assert.equal(fs.existsSync(chained(dir)), false);
});

test('remove without a chained hook deletes the guard', () => {
  const { dir, env } = repo();
  sdd(dir, env, 'guard', 'install');
  sdd(dir, env, 'guard', 'remove');
  assert.equal(fs.existsSync(hook(dir)), false);
});

test('refuses when both a foreign hook and a chained file exist', () => {
  const { dir, env } = repo();
  write(hook(dir), '#!/bin/sh\necho mine\n', 0o755);
  write(chained(dir), '#!/bin/sh\necho older\n', 0o755);
  const r = sdd(dir, env, 'guard', 'install');
  assert.notEqual(r.status, 0);
  assert.equal(read(hook(dir)), '#!/bin/sh\necho mine\n', 'nothing overwritten');
});

test('migrates a v2 guard with an inlined chain to a chained file', () => {
  const { dir, env } = repo();
  const v2 = '#!/bin/sh\n# keel commit guard v2\n[ -d openspec ] || true\n' +
    '# --- chained original pre-commit ---\necho legacy-chain\n# --- end chain ---\n\nexit 0\n';
  write(hook(dir), v2, 0o755);
  const r = sdd(dir, env, 'guard', 'install');
  assert.equal(r.status, 0, r.out);
  assert.equal(read(chained(dir)), '#!/bin/sh\necho legacy-chain\n');
  assert.match(read(hook(dir)), /# keel commit guard v4/);
  assert.match(tryCommit(dir, env).out, /legacy-chain/);
});

test('honors core.hooksPath instead of writing a hook git never runs', () => {
  const { dir, env } = repo();
  git(dir, env, 'config', 'core.hooksPath', '.githooks');
  const r = sdd(dir, env, 'guard', 'install');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /core\.hooksPath is set/);
  assert.ok(fs.existsSync(path.join(dir, '.githooks', 'pre-commit')));
  assert.equal(fs.existsSync(hook(dir)), false);

  write(path.join(dir, 'keel', 'changes', 'feat-a', 'tasks.md'), PENDING_TASKS);
  assert.equal(tryCommit(dir, env).ok, false, 'the guard actually runs');
  assert.match(sdd(dir, env, 'doctor').out, /commit guard\s+installed/);
});

test('works from a subdirectory and from a linked worktree', () => {
  const { dir, env } = repo();
  fs.mkdirSync(path.join(dir, 'src'));
  const sub = sdd(path.join(dir, 'src'), env, 'guard', 'install');
  assert.equal(sub.status, 0, sub.out);
  assert.ok(fs.existsSync(hook(dir)));
  sdd(dir, env, 'guard', 'remove');

  const wt = `${dir}-wt`;
  git(dir, env, 'worktree', 'add', '-q', wt);
  const r = sdd(wt, env, 'guard', 'install');
  assert.equal(r.status, 0, r.out);
  assert.ok(fs.existsSync(hook(dir)), 'worktrees share the main repo hooks');
});

test('outside a git repository it fails cleanly', (t) => {
  const os = require('os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'keel-nogit-'));
  const { env } = repo();
  // A parent directory that is a repo would make this test meaningless.
  const probe = require('child_process').spawnSync('git', ['rev-parse', '--git-dir'], { cwd: dir, env });
  if (probe.status === 0) return t.skip('tmpdir is inside a git repository');
  const r = sdd(dir, env, 'guard', 'install');
  assert.notEqual(r.status, 0);
  assert.match(r.out, /not a git repository/);
});

test('guard --dry-run touches nothing', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'guard', 'install', '--dry-run');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /would install/);
  assert.equal(fs.existsSync(hook(dir)), false);

  const original = '#!/bin/sh\necho original\n';
  write(hook(dir), original, 0o755);
  sdd(dir, env, 'guard', 'install');
  sdd(dir, env, 'guard', 'remove', '--dry-run');
  assert.match(read(hook(dir)), /# keel commit guard v4/, 'remove --dry-run left the guard');
  assert.equal(read(chained(dir)), original);
});

test('detects husky at the repo root when run from a subdirectory', () => {
  const { dir, env } = repo();
  fs.mkdirSync(path.join(dir, '.husky', '_'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'src'));
  git(dir, env, 'config', 'core.hooksPath', '.husky/_');
  const r = sdd(path.join(dir, 'src'), env, 'guard', 'install');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /husky may regenerate/);
  assert.ok(fs.existsSync(path.join(dir, '.husky', '_', 'pre-commit')));
});

test('ignores openspec/, which belongs to OpenSpec', () => {
  const { dir, env } = repo();
  sdd(dir, env, 'guard', 'install');
  write(path.join(dir, 'openspec', 'changes', 'their-change', 'tasks.md'), PENDING_TASKS);
  assert.ok(tryCommit(dir, env).ok, 'an OpenSpec user is never blocked by Keel');
});

test('doctor flags a guard from before keel/ and reinstall fixes it', () => {
  const { dir, env } = repo();
  const old = '#!/bin/sh\n# keel commit guard v3\n[ -d "openspec/changes" ] || exit 0\nexit 0\n';
  write(hook(dir), old, 0o755);
  write(path.join(dir, 'keel', 'changes', 'feat-a', 'tasks.md'), PENDING_TASKS);
  assert.ok(tryCommit(dir, env).ok, 'precondition: the old guard lets it through');
  assert.match(sdd(dir, env, 'doctor').out, /commit guard\s+OUTDATED \(v3/);

  sdd(dir, env, 'guard', 'install');
  assert.match(sdd(dir, env, 'doctor').out, /commit guard\s+installed/);
  assert.equal(tryCommit(dir, env).ok, false);
});
