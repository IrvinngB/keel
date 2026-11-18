'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, sdd } = require('./helpers');

const VALID_SPEC = `# Demo Specification

## Requirements

### Requirement: Valid behavior
The system MUST work.

#### Scenario: Happy path
- GIVEN valid state
- WHEN archive runs
- THEN it succeeds
`;

const VALID_DESIGN = `# Design: Demo

## File Changes
| File | Action | Description |
|------|--------|-------------|
| \`a.js\` | Modify | Do work |

## Testing Strategy
| Layer | What to test | Approach |
|-------|-------------|----------|
| Unit | Logic | node:test |
`;

function seedVerifiedChange(dir, name, overrides = {}) {
  const base = path.join(dir, 'keel', 'changes', name);
  fs.mkdirSync(path.join(base, 'specs', 'demo'), { recursive: true });
  fs.writeFileSync(path.join(base, 'state.yaml'), overrides.state || 'current_phase: verify\ncompleted: [spec, clarify, design, tasks, apply, verify]\nopen_questions: []\nupdated: 2026-11-18\nstatus: active\n');
  fs.writeFileSync(path.join(base, 'specs', 'demo', 'spec.md'), overrides.spec || VALID_SPEC);
  fs.writeFileSync(path.join(base, 'clarifications.md'), overrides.clarify || '# Clarifications\n\nNo open questions.\n');
  fs.writeFileSync(path.join(base, 'design.md'), overrides.design || VALID_DESIGN);
  fs.writeFileSync(path.join(base, 'tasks.md'), overrides.tasks || '# Tasks\nDecision needed before apply: No\n- [x] 1.1 Done\n');
  fs.writeFileSync(path.join(base, 'apply-progress.md'), '# Apply Progress\n- 1.1 Done\n');
  if (overrides.verify !== null) {
    fs.writeFileSync(path.join(base, 'verify-report.md'), overrides.verify || '# Verify\n\n## Verdict: PASS\n');
  }
}

test('sdd archive refuses when verify-report.md is missing or tasks are unchecked', () => {
  const { dir, env } = repo();
  seedVerifiedChange(dir, 'demo-change', {
    verify: null,
    tasks: '# Tasks\nDecision needed before apply: No\n- [ ] 1.1 Pending\n',
  });
  const r = sdd(dir, env, 'archive', 'demo-change');
  assert.equal(r.status, 1);
  assert.match(r.out, /verify-report\.md is missing/);
  assert.match(r.out, /1 unchecked task\(s\)/);
  assert.equal(fs.existsSync(path.join(dir, 'keel', 'changes', 'demo-change')), true);
});

test('sdd archive --dry-run writes and moves nothing', () => {
  const { dir, env } = repo();
  seedVerifiedChange(dir, 'demo-change');
  const r = sdd(dir, env, 'archive', 'demo-change', '--dry-run');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /would sync specs\/demo\/spec\.md/);
  assert.match(r.out, /would move/);
  assert.equal(fs.existsSync(path.join(dir, 'keel', 'changes', 'demo-change')), true);
  assert.equal(fs.existsSync(path.join(dir, 'keel', 'specs', 'demo', 'spec.md')), false);
});

test('sdd archive syncs specs, writes archive-report, updates state, and moves folder', () => {
  const { dir, env } = repo();
  seedVerifiedChange(dir, 'demo-change');
  const r = sdd(dir, env, 'archive', 'demo-change');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /archived demo-change/);
  assert.equal(fs.existsSync(path.join(dir, 'keel', 'changes', 'demo-change')), false);
  const today = new Date().toISOString().slice(0, 10);
  const archived = path.join(dir, 'keel', 'changes', 'archive', `${today}-demo-change`);
  assert.equal(fs.existsSync(path.join(archived, 'archive-report.md')), true);
  assert.match(fs.readFileSync(path.join(archived, 'state.yaml'), 'utf8'), /status: archived/);
  assert.equal(fs.existsSync(path.join(dir, 'keel', 'specs', 'demo', 'spec.md')), true);
});

test('sdd ci exits 0 with warning on unchecked tasks, and exits 1 with --strict-tasks', () => {
  const { dir, env } = repo();
  seedVerifiedChange(dir, 'demo-change', {
    tasks: '# Tasks\nDecision needed before apply: No\n- [ ] 1.1 Pending\n',
  });
  const warnRun = sdd(dir, env, 'ci');
  assert.equal(warnRun.status, 0, warnRun.out);
  assert.match(warnRun.out, /WARN \[tasks\] demo-change: 1 unchecked task/);

  const strictRun = sdd(dir, env, 'ci', '--strict-tasks');
  assert.equal(strictRun.status, 1);
  assert.match(strictRun.out, /FAIL \[tasks\] demo-change: 1 unchecked task/);
});

test('sdd ci exits 1 when gate invariants fail', () => {
  const { dir, env } = repo();
  seedVerifiedChange(dir, 'demo-change', {
    spec: '# Bad\n\n### Requirement: Broken\nNo scenario\n',
  });
  const r = sdd(dir, env, 'ci');
  assert.equal(r.status, 1);
  assert.match(r.out, /FAIL \[gate\] demo-change/);
});
