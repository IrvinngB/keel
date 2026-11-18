'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, sdd } = require('./helpers');
const { validateSpecContent } = require('../bin/sdd');

function writeChange(dir, name, files = {}) {
  const base = path.join(dir, 'keel', 'changes', name);
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'state.yaml'), files.state || 'current_phase: design\ncompleted: [spec, clarify]\nopen_questions: []\nupdated: 2026-11-18\nstatus: active\n');
  for (const [rel, content] of Object.entries(files)) {
    if (rel === 'state') continue;
    const target = path.join(base, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
  }
}

const VALID_SPEC = `# Demo Specification

## Requirements

### Requirement: Valid behavior
The system MUST work.

#### Scenario: Happy path
- GIVEN a valid input
- WHEN the command runs
- THEN it exits 0
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

test('sdd check exits 0 when there are no active changes', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'check');
  assert.equal(r.status, 0);
  assert.match(r.out, /No active changes/);
});

test('sdd check exits 1 on unknown change name', () => {
  const { dir, env } = repo();
  writeChange(dir, 'demo-change');
  const r = sdd(dir, env, 'check', 'missing-change');
  assert.equal(r.status, 1);
  assert.match(r.out, /unknown active change "missing-change"/);
});

test('sdd check passes on a valid change', () => {
  const { dir, env } = repo();
  writeChange(dir, 'demo-change', {
    'specs/demo/spec.md': VALID_SPEC,
    'clarifications.md': '# Clarifications\n\n## Resolved\n- R1: done\n',
    'design.md': VALID_DESIGN,
    'tasks.md': '# Tasks\nDecision needed before apply: No\nChain strategy: single-pr\n- [x] 1.1 Done\n',
  });
  const r = sdd(dir, env, 'check', 'demo-change');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /^PASS demo-change/m);
});

test('sdd check fails when design exists with open BLOCKER in clarifications.md', () => {
  const { dir, env } = repo();
  writeChange(dir, 'demo-change', {
    'specs/demo/spec.md': VALID_SPEC,
    'clarifications.md': '# Clarifications\n\n## BLOCKER — must answer before design\n### Q1: What timeout?\n',
    'design.md': VALID_DESIGN,
  });
  const r = sdd(dir, env, 'check');
  assert.equal(r.status, 1);
  assert.match(r.out, /FAIL demo-change/);
  assert.match(r.out, /open BLOCKER/);
});

test('sdd check fails when spec requirement lacks scenario or GIVEN/WHEN/THEN', () => {
  const { dir, env } = repo();
  writeChange(dir, 'demo-change', {
    'specs/demo/spec.md': '# Spec\n\n### Requirement: Incomplete\nMust work.\n\n#### Scenario: Missing clauses\n- Just a bullet\n',
  });
  const r = sdd(dir, env, 'check');
  assert.equal(r.status, 1);
  assert.match(r.out, /missing GIVEN\/WHEN\/THEN/);
});

test('sdd check fails when design.md misses required sections or workload decision is pending', () => {
  const { dir, env } = repo();
  writeChange(dir, 'demo-change', {
    'design.md': '# Design\n\n## Technical Approach\nOnly prose.\n',
    'tasks.md': '# Tasks\nDecision needed before apply: Yes\nChain strategy: pending\n- [x] 1.1 Started anyway\n',
  });
  const r = sdd(dir, env, 'check');
  assert.equal(r.status, 1);
  assert.match(r.out, /missing "## File Changes"/);
  assert.match(r.out, /missing "## Testing Strategy"/);
  assert.match(r.out, /unresolved workload decision/);
});

test('validateSpecContent flags files with no requirements', () => {
  assert.deepEqual(validateSpecContent('# Empty\n'), ['no "### Requirement:" heading found']);
});
