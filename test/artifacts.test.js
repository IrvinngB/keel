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

test('status columns stay aligned when a change has every planning phase', () => {
  const { dir, env } = repo();
  const long = path.join(dir, 'keel', 'changes', 'a-long-change-name');
  for (const f of ['exploration.md', 'proposal.md', 'clarifications.md', 'design.md', 'blast-radius.md']) write(path.join(long, f), '#\n');
  write(path.join(long, 'specs', 'x', 'spec.md'), '#\n');
  write(path.join(long, 'tasks.md'), '- [x] a\n- [ ] b\n');
  write(path.join(dir, 'keel', 'changes', 'short', 'proposal.md'), '#\n');
  const lines = sdd(dir, env, 'status').out.split('\n').slice(0, 3);
  const col = (line, text) => line.indexOf(text);
  assert.equal(col(lines[1], '1/2'), col(lines[0], 'TASKS'));
  assert.equal(col(lines[2], '-'), col(lines[0], 'TASKS'));
});
