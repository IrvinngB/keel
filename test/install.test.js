'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { repo, sdd, write, read, entries } = require('./helpers');

const ROOT = path.resolve(__dirname, '..');
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'manifest.json'), 'utf8')).registry;

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

// ---- Antigravity (experimental, skills-only) ----

const AG = REGISTRY.antigravity;
const ids = Object.keys(REGISTRY);
const blockOf = (text, id) => {
  const m = text.match(new RegExp(`<!-- keel:begin agent=${id} -->[\\s\\S]*?<!-- keel:end agent=${id} -->`));
  return m ? m[0] : null;
};
// Every file under dir except .git, with content, so re-runs can be compared byte for byte.
const snapshot = (dir) => {
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
};
const agLine = (out) => out.split('\n').find((l) => /^ {2}antigravity\s/.test(l));
const UNVERIFIED = 'unverified: detect, userSkillsDir, userContextFile, invoke, subagents';

test('antigravity is experimental, named Antigravity, invoked as /<skill-name>, never Tested', () => {
  assert.equal(AG && AG.status, 'experimental');
  assert.equal(AG && AG.displayName, 'Antigravity');
  assert.equal(AG && AG.invoke.cmd.replace('{name}', 'spec'), '/sdd-spec');
  const { dir, env } = repo();
  fs.mkdirSync(path.join(env.HOME, '.gemini', 'antigravity'), { recursive: true });
  const out = sdd(dir, env, 'doctor').out;
  assert.match(agLine(out) || '', /antigravity\s+experimental\s/);
  assert.doesNotMatch(out, /Tested/);
});

test('antigravity sits right after kimi so existing repos keep their next-command', () => {
  assert.equal(ids.indexOf('antigravity'), ids.indexOf('kimi') + 1);
  const next = (order) => {
    const { dir, env } = repo();
    write(path.join(dir, 'keel', 'changes', 'demo', 'proposal.md'), '# Proposal\n');
    for (const id of order) assert.equal(sdd(dir, env, 'install', id, '--project').status, 0, id);
    return sdd(dir, env, 'next').out;
  };
  assert.match(next(['codex', 'antigravity']), /run \$sdd-continue demo/);
  assert.match(next(['antigravity', 'codex']), /run \$sdd-continue demo/);
  assert.match(next(['antigravity']), /run \/sdd-continue demo/);
});

test('antigravity --project writes only .agents/skills and one AGENTS.md block, and is idempotent', () => {
  const { dir, env } = repo();
  assert.equal(sdd(dir, env, 'install', 'antigravity', '--project').status, 0);
  assert.deepEqual(entries(dir), ['.agents', 'AGENTS.md']);
  const text = read(path.join(dir, 'AGENTS.md'));
  assert.equal(text.match(/<!-- keel:begin agent=antigravity -->/g).length, 1);
  const before = snapshot(dir);
  const again = sdd(dir, env, 'install', 'antigravity', '--project');
  assert.equal(again.status, 0, again.out);
  assert.match(again.out, /already up to date/);
  assert.deepEqual(snapshot(dir), before);
});

test('antigravity coexists with codex and kimi blocks in either order', () => {
  const alone = (id) => {
    const { dir, env } = repo();
    assert.equal(sdd(dir, env, 'install', id, '--project').status, 0, id);
    return blockOf(read(path.join(dir, 'AGENTS.md')), id);
  };
  const want = Object.fromEntries(['codex', 'kimi', 'antigravity'].map((id) => [id, alone(id)]));
  for (const order of [['codex', 'kimi', 'antigravity', 'antigravity'], ['antigravity', 'codex', 'kimi', 'antigravity']]) {
    const { dir, env } = repo();
    for (const id of order) assert.equal(sdd(dir, env, 'install', id, '--project').status, 0, id);
    const text = read(path.join(dir, 'AGENTS.md'));
    for (const id of ['codex', 'kimi', 'antigravity']) {
      assert.ok(want[id], `${id} block exists`);
      assert.equal(blockOf(text, id), want[id], `${id} block intact in order ${order}`);
    }
  }
});

test('antigravity refuses a malformed marker and writes nothing', () => {
  const { dir, env } = repo();
  const broken = '# Rules\n<!-- keel:begin agent=codex -->\nno end marker\n';
  write(path.join(dir, 'AGENTS.md'), broken);
  const r = sdd(dir, env, 'install', 'antigravity', '--project');
  assert.notEqual(r.status, 0);
  assert.match(r.out, /malformed keel block markers/);
  assert.equal(read(path.join(dir, 'AGENTS.md')), broken);
  assert.equal(fs.existsSync(path.join(dir, '.agents')), false);
});

test('antigravity declares its unverified fields, URLs and date, and prints them', () => {
  assert.deepEqual(AG && AG.unverifiedFields, ['detect', 'userSkillsDir', 'userContextFile', 'invoke', 'subagents']);
  assert.ok(AG && AG.notes.includes('https://antigravity.google/docs/skills/'));
  assert.ok(AG && AG.notes.includes('https://antigravity.google/docs/rules'));
  assert.ok(AG && AG.notes.includes('2026-09-24'));
  const { dir, env } = repo();
  const inst = sdd(dir, env, 'install', 'antigravity', '--project');
  assert.ok(inst.out.includes(UNVERIFIED), inst.out);
  const doc = sdd(dir, env, 'doctor').out;
  assert.ok(doc.includes(UNVERIFIED), doc);
});

test('a codex project install lists antigravity among the readers of the shared skills dir', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'install', 'codex', '--project');
  assert.equal(r.status, 0, r.out);
  assert.match(r.out, /shared with [^)]*antigravity/);
});

test('doctor warns by name when skills sit in both user dirs and deletes nothing', () => {
  const { dir, env } = repo();
  fs.mkdirSync(path.join(env.HOME, '.gemini', 'antigravity'), { recursive: true });
  const copies = [path.join(env.HOME, '.agents', 'skills', 'sdd-x'), path.join(env.HOME, '.gemini', 'config', 'skills', 'sdd-x')];
  for (const c of copies) write(path.join(c, 'SKILL.md'), '# x\n');
  const out = sdd(dir, env, 'doctor').out;
  assert.match(out, /warning: Antigravity may discover the sdd skills twice at user level/);
  for (const c of copies) assert.ok(fs.existsSync(path.join(c, 'SKILL.md')), `${c} still exists`);
});

test('antigravity detection uses its own dirs and never bare ~/.gemini', () => {
  const found = (...sub) => {
    const { dir, env } = repo();
    for (const s of sub) fs.mkdirSync(path.join(env.HOME, ...s.split('/')), { recursive: true });
    return agLine(sdd(dir, env, 'doctor').out) || '';
  };
  assert.match(found('.gemini'), /antigravity\s+experimental\s+tool —/);
  for (const d of ['antigravity', 'antigravity-ide', 'antigravity-cli'])
    assert.match(found(`.gemini/${d}`), /antigravity\s+experimental\s+tool found/, d);
  assert.deepEqual(AG && AG.projectMarkers, []);
});

test('antigravity --user writes only ~/.gemini/config/skills and ~/.gemini/AGENTS.md', () => {
  const { dir, env } = repo();
  const gemini = path.join(env.HOME, '.gemini');
  const mine = '# my gemini rules\r\nkeep me\n';
  write(path.join(gemini, 'GEMINI.md'), mine);
  const r = sdd(dir, env, 'install', 'antigravity', '--user');
  assert.equal(r.status, 0, r.out);
  assert.equal(read(path.join(gemini, 'GEMINI.md')), mine);
  assert.deepEqual(fs.readdirSync(gemini).sort(), ['AGENTS.md', 'GEMINI.md', 'config']);
  assert.deepEqual(fs.readdirSync(path.join(gemini, 'config')), ['skills']);
  assert.ok(fs.existsSync(path.join(gemini, 'config', 'skills', 'sdd-workflow', 'SKILL.md')));
  assert.match(read(path.join(gemini, 'AGENTS.md')), /keel:begin agent=antigravity/);
  assert.deepEqual(fs.readdirSync(env.HOME).filter((n) => n === '.agents'), []);
});

test('antigravity --dry-run writes nothing and lists exactly the planned actions', () => {
  const { dir, env } = repo();
  const r = sdd(dir, env, 'install', 'antigravity', '--project', '--dry-run');
  assert.equal(r.status, 0, r.out);
  assert.deepEqual(entries(dir), []);
  const skillsDir = path.join(ROOT, 'adapters', 'codex', 'skills');
  const files = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) { const p = path.join(d, e.name); e.isDirectory() ? walk(p) : files.push(path.relative(skillsDir, p)); } };
  walk(skillsDir);
  const lines = r.out.split('\n');
  const actions = lines.slice(lines.indexOf('') + 1).filter((l) => l !== '');
  assert.deepEqual(actions, [
    ...files.map((f) => `  would copy ${path.join(dir, '.agents', 'skills', f)}`),
    `antigravity (project): would install ${files.length} files → ${dir}`,
    'note: dry run — nothing was written.',
    'notice: skills are installed once in .agents/skills (shared with opencode, codex, gemini, kimi). They are invocation-neutral; Antigravity-specific syntax lives only in its own context-file block or native files.',
    `  would append the antigravity block to ${path.join(dir, 'AGENTS.md')}`,
    'Antigravity has no native commit hook — would install the universal git guard.',
  ]);
});

test('doctor sizes the id column to the longest registry id', () => {
  const { dir, env } = repo();
  const out = sdd(dir, env, 'doctor').out.split('\n');
  const w = Math.max(...ids.map((i) => i.length));
  for (const id of ids) {
    const line = out.find((l) => l.startsWith(`  ${id} `));
    assert.ok(line, `doctor prints a line for ${id}`);
    assert.ok(line.startsWith(`  ${id.padEnd(w)} ${REGISTRY[id].status.padEnd(13)} tool`), `aligned: ${line}`);
  }
});
