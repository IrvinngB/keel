'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { SDD, env, repo, sdd, write } = require('./helpers');

const CFG = 'artifact_store: files\n';

// Writes keel/changes/<name>/state.yaml (LF) plus the given artifact files.
function change(dir, name, state, files = []) {
  const base = path.join(dir, 'keel', 'changes', name);
  write(path.join(base, 'state.yaml'), state);
  for (const f of files) write(path.join(base, f), '# x\n');
  return base;
}

const ok = (phase = 'proposal', done = '[explore, proposal]') =>
  `current_phase: ${phase}\ncompleted: ${done}\nstatus: active\n`;

// Every file under dir (except .git) mapped to its content, so tests can prove nothing was written.
function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === '.git') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else out[path.relative(dir, p)] = fs.readFileSync(p, 'utf8');
    }
  };
  walk(dir);
  return out;
}

test('a broken store is reported, exits 0 and writes nothing', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  change(dir, 'foo', 'current_phase: tasks\ncompleted: [explore]\nstatus: weird\n', ['exploration.md']);
  const before = snapshot(dir);
  const r = sdd(dir, e, 'doctor');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /store checks\s+1 finding\(s\), read-only/);
  assert.match(r.out, /\n {4}foo\s+invalid: status "weird"/);
  assert.deepEqual(snapshot(dir), before);
});

test('sqlite and none print exactly one skipped note', () => {
  for (const store of ['sqlite', 'none']) {
    const { dir, env: e } = repo();
    write(path.join(dir, 'keel', 'config.yaml'), `artifact_store: ${store}\n`);
    change(dir, 'foo', 'garbage\n');
    const out = sdd(dir, e, 'doctor').out;
    const notes = out.match(/store checks\s+skipped/g) || [];
    assert.equal(notes.length, 1, out);
    assert.match(out, new RegExp(`artifact_store is ${store}; only the files backend is validated`));
    assert.doesNotMatch(out, /finding\(s\)/);
  }
});

test('a change folder without state.yaml is reported', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  write(path.join(dir, 'keel', 'changes', 'foo', 'proposal.md'), '# x\n');
  assert.match(sdd(dir, e, 'doctor').out, /\n {4}foo\s+no state\.yaml/);
});

test('a CRLF state.yaml is unreadable, never invalid', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  change(dir, 'foo', 'current_phase: proposal\r\ncompleted: [proposal]\r\nstatus: active\r\n', ['proposal.md']);
  const out = sdd(dir, e, 'doctor').out;
  assert.match(out, /\n {4}foo\s+state\.yaml unreadable: /);
  assert.doesNotMatch(out, /invalid/);
});

test('block-style completed, quoted values and comments on required keys are unreadable', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  change(dir, 'blocky', 'current_phase: proposal\ncompleted:\n  - proposal\nstatus: active\n', ['proposal.md']);
  change(dir, 'quoted', 'current_phase: proposal\ncompleted: [proposal]\nstatus: "active"\n', ['proposal.md']);
  change(dir, 'commented', 'current_phase: proposal # now\ncompleted: [proposal]\nstatus: active\n', ['proposal.md']);
  const out = sdd(dir, e, 'doctor').out;
  assert.match(out, /\n {4}blocky\s+state\.yaml unreadable: .*completed/);
  assert.match(out, /\n {4}quoted\s+state\.yaml unreadable: /);
  assert.match(out, /\n {4}commented\s+state\.yaml unreadable: /);
  assert.doesNotMatch(out, /invalid/);
});

test('a "#" inside open_questions is not a comment; an unknown phase is named', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  change(dir, 'foo',
    'current_phase: proposal\ncompleted: [proposal, deploy]\nopen_questions:\n  - wait for PR #10\nstatus: active\n', ['proposal.md']);
  const out = sdd(dir, e, 'doctor').out;
  assert.match(out, /\n {4}foo\s+invalid: unknown phase "deploy"/);
  assert.doesNotMatch(out, /unreadable/);
});

test('date mismatch, missing artifact, duplicate key and active+archived duplicate name the item', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  write(path.join(dir, 'keel', 'changes', 'archive', '2026-09-01-old', 'state.yaml'),
    'current_phase: archive\ncompleted: []\nstatus: archived\narchived_on: 2026-09-02\n');
  change(dir, 'nodesign', ok('design', '[design]'));
  change(dir, 'dupkey', 'current_phase: proposal\ncompleted: []\nstatus: active\nstatus: active\n');
  change(dir, 'both', ok('proposal', '[proposal]'), ['proposal.md']);
  write(path.join(dir, 'keel', 'changes', 'archive', '2026-09-03-both', 'state.yaml'),
    'current_phase: archive\ncompleted: []\nstatus: archived\narchived_on: 2026-09-03\n');
  const out = sdd(dir, e, 'doctor').out;
  assert.match(out, /\n {4}2026-09-01-old\s+archived_on 2026-09-02 differs from folder date 2026-09-01/);
  assert.match(out, /\n {4}nodesign\s+completed "design" but design\.md is missing/);
  assert.match(out, /\n {4}dupkey\s+invalid: duplicate key status/);
  assert.match(out, /\n {4}both\s+exists as active and archived \(2026-09-03-both\)/);
});

test('validateName normalizes backslashes and rejects reserved names', () => {
  const { validateName } = require('../bin/sdd');
  assert.match(validateName('changes\\Foo_Bar'), /Foo_Bar/);
  assert.match(validateName('changes/config'), /"config" is reserved/);
  assert.match(validateName('changes/steering'), /reserved/);
  assert.equal(validateName('changes/foo-bar2'), null);
  assert.equal(validateName('changes\\foo-bar'), null);
});

test('validateStore reads the root it is given, not the cwd', () => {
  const { validateStore } = require('../bin/sdd');
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'keel-root-')));
  write(path.join(root, 'changes', 'bad-one', 'state.yaml'), 'current_phase: proposal\ncompleted: []\nstatus: nope\n');
  write(path.join(root, 'changes', 'z-fine', 'state.yaml'), ok('proposal', '[proposal]'));
  write(path.join(root, 'changes', 'z-fine', 'proposal.md'), '# x\n');
  const findings = validateStore(root);
  assert.deepEqual(findings, [{ change: 'bad-one', problem: 'invalid: status "nope"' }]);
  assert.deepEqual(validateStore(path.join(root, 'missing')), []);
});

test('requiring bin/sdd runs nothing and prints nothing', () => {
  const r = cp.spawnSync(process.execPath, ['-e', `const m = require(${JSON.stringify(SDD)}); process.stdout.write(typeof m.validateStore)`],
    { cwd: os.tmpdir(), env: env(), encoding: 'utf8' });
  assert.equal(r.stdout, 'function');
  assert.equal(r.stderr, '');
});

test('guard: no keel/, stray entries and an optional spec give no store checks', () => {
  const bare = repo();
  assert.doesNotMatch(sdd(bare.dir, bare.env, 'doctor').out, /store checks/);

  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  write(path.join(dir, 'keel', 'changes', 'archive', '.gitkeep'), '');
  write(path.join(dir, 'keel', 'changes', '.cache', 'x'), 'x\n');
  write(path.join(dir, 'keel', 'changes', 'README.md'), '# notes\n');
  change(dir, 'foo', ok('spec', '[explore, proposal, spec]'), ['exploration.md', 'proposal.md']);
  assert.doesNotMatch(sdd(dir, e, 'doctor').out, /store checks/);
});

test('guard: a healthy run keeps round-trip directly followed by commit guard', () => {
  const { dir, env: e } = repo();
  write(path.join(dir, 'keel', 'config.yaml'), CFG);
  change(dir, 'foo', ok(), ['exploration.md', 'proposal.md']);
  const lines = sdd(dir, e, 'doctor').out.split('\n');
  const i = lines.findIndex((l) => /round-trip files/.test(l));
  assert.ok(i >= 0);
  assert.match(lines[i + 1], /^ {2}commit guard /);
});

test("guard: Keel's own committed keel/ has zero findings", (t) => {
  const root = path.resolve(__dirname, '..');
  const ls = require('child_process').spawnSync('git', ['ls-files', '-z', 'keel'], { cwd: root, encoding: 'utf8' });
  if (ls.status !== 0 || !ls.stdout) return t.skip('git or tracked keel/ not available');
  // A copy of what is committed, with LF: in-flight changes and CRLF checkouts are not what this guards.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'keel-own-'));
  for (const rel of ls.stdout.split('\0').filter(Boolean)) {
    const dest = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n'));
  }
  const { validateStore } = require('../bin/sdd');
  assert.deepEqual(validateStore(path.join(tmp, 'keel')), []);
});

test('a state.yaml that cannot be read is reported, not thrown', () => {
  const { readStateStrict } = require('../bin/sdd');
  const { dir } = repo();
  const r = readStateStrict(path.join(dir, 'missing', 'state.yaml'));
  assert.match(r.unreadable, /^cannot read \(ENOENT\)/);
});
