'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, sdd } = require('./helpers');

test('sdd resume exits 0 when no active changes exist', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'resume');
  assert.equal(r.status, 0);
  assert.match(r.out, /No active changes/);
});

test('sdd resume exits 1 on unknown change name', () => {
  const { dir, env } = repo();
  const base = path.join(dir, 'keel', 'changes', 'demo');
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'state.yaml'), 'current_phase: apply\ncompleted: []\nopen_questions: []\nupdated: 2026-11-18\nstatus: active\n');
  const r = sdd(dir, env, 'resume', 'missing');
  assert.equal(r.status, 1);
  assert.match(r.out, /unknown active change "missing"/);
});

test('sdd resume prints phase, tasks, blockers, last progress, and shared steering', () => {
  const { dir, env } = repo();
  const base = path.join(dir, 'keel', 'changes', 'demo');
  fs.mkdirSync(base, { recursive: true });
  fs.mkdirSync(path.join(env.HOME, '.keel', 'steering'), { recursive: true });
  fs.writeFileSync(path.join(base, 'state.yaml'), 'current_phase: apply\ncompleted: [design]\nopen_questions: []\nupdated: 2026-11-18\nstatus: active\n');
  fs.writeFileSync(path.join(base, 'tasks.md'), '# Tasks\nDecision needed before apply: No\n- [x] 1.1 Done\n- [ ] 1.2 Next step\n');
  fs.writeFileSync(path.join(base, 'clarifications.md'), '# Clarifications\n\n## BLOCKER\n### Q1: Pick port?\n');
  fs.writeFileSync(path.join(base, 'apply-progress.md'), '# Apply\n- 1.1 Done\n');

  const r = sdd(dir, env, 'resume', 'demo');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /Change: demo \(phase: apply, tasks: 1\/2, guard: none\)/);
  assert.match(r.out, /Blockers: Q1: Pick port\?/);
  assert.match(r.out, /- \[ \] 1\.2 Next step/);
  assert.match(r.out, /- 1\.1 Done/);
  assert.match(r.out, /Shared steering:/);
});
