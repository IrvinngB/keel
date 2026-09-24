'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { repo, sdd, write } = require('./helpers');

test('status and next read keel/changes', () => {
  const { dir, env } = repo();
  write(path.join(dir, 'keel', 'changes', 'feat-a', 'proposal.md'), '# Proposal\n');
  const status = sdd(dir, env, 'status');
  assert.equal(status.status, 0, status.out);
  assert.match(status.out, /feat-a/);
  assert.match(sdd(dir, env, 'next').out, /feat-a: next phase = spec/);
});

test('an OpenSpec project is not mistaken for Keel artifacts', () => {
  const { dir, env } = repo();
  write(path.join(dir, 'openspec', 'config.yaml'), 'schema: spec-driven\n');
  write(path.join(dir, 'openspec', 'changes', 'their-change', 'proposal.md'), '# Theirs\n');
  assert.match(sdd(dir, env, 'status').out, /No active changes/);
  const doctor = sdd(dir, env, 'doctor').out;
  assert.match(doctor, /openspec\/\s+not Keel's/);
  assert.doesNotMatch(doctor, /git mv openspec keel/);
});

test('a pre-0.4.0 Keel openspec/ gets a migration hint', () => {
  const { dir, env } = repo();
  write(path.join(dir, 'openspec', 'config.yaml'), 'artifact_store: openspec\n');
  assert.match(sdd(dir, env, 'status').out, /git mv openspec keel/);
  assert.match(sdd(dir, env, 'doctor').out, /git mv openspec keel/);
});

test('doctor explains the renamed files backend', () => {
  const { dir, env } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), 'artifact_store: openspec\n');
  assert.match(sdd(dir, env, 'doctor').out, /openspec backend is now called files/);

  write(path.join(dir, 'keel', 'config.yaml'), 'artifact_store: files\n');
  assert.match(sdd(dir, env, 'doctor').out, /round-trip files\s+SAVE→LOAD ok/);
});

test('status shows the migration hint even with active keel/ changes', () => {
  const { dir, env } = repo();
  write(path.join(dir, 'openspec', 'config.yaml'), 'artifact_store: openspec\n');
  write(path.join(dir, 'keel', 'changes', 'feat-a', 'proposal.md'), '# Proposal\n');
  const out = sdd(dir, env, 'status').out;
  assert.match(out, /git mv openspec keel/);
  assert.match(out, /feat-a/);
});
