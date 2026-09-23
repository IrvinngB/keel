#!/usr/bin/env node
'use strict';

// sdd-kit generator: core/ (canonical, tool-agnostic markdown) -> adapters/{claude,opencode,generic}
// Zero dependencies. Run: node build/generate.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CORE = path.join(ROOT, 'core');
const ADAPTERS = path.join(ROOT, 'adapters');
const HOOKS_SRC = path.join(ROOT, 'hooks');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));

const PLACEHOLDER = /\{\{(agent|cmd|skill):([a-z0-9-]+)\}\}/g;

const DIALECTS = {
  claude: {
    agent: (n) => `sdd:${n}`,
    cmd: (n) => `/sdd:${n}`,
    skill: (n) => `sdd:${n}`,
  },
  opencode: {
    agent: (n) => n,
    cmd: (n) => `/sdd-${n}`,
    skill: (n) => n,
  },
  generic: {
    agent: (n) => `phase \`${n}\``,
    cmd: (n) => `command \`${n}\``,
    skill: () => `this document`,
  },
};

function resolve(text, dialect) {
  const d = DIALECTS[dialect];
  return text.replace(PLACEHOLDER, (_, kind, name) => d[kind](name));
}

function read(p) {
  if (!fs.existsSync(p)) fail(`missing required file: ${path.relative(ROOT, p)}`);
  return fs.readFileSync(p, 'utf8');
}

function fail(msg) {
  console.error(`generate: ERROR: ${msg}`);
  process.exit(1);
}

function write(p, content, mode) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, mode === undefined ? {} : { mode });
  created.push(path.relative(ROOT, p));
}

function copyFile(src, dst, mode) {
  if (!fs.existsSync(src)) fail(`missing required file: ${path.relative(ROOT, src)}`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  if (mode !== undefined) fs.chmodSync(dst, mode);
  created.push(path.relative(ROOT, dst));
}

function yamlStr(s) {
  return JSON.stringify(s); // double-quoted scalar is valid YAML and escapes everything risky
}

function frontmatter(pairs) {
  const lines = ['---'];
  for (const [k, v] of pairs) lines.push(`${k}: ${v}`);
  lines.push('---', '');
  return lines.join('\n');
}

// v0.1 descriptions put the "Use when/after/before/during ..." trigger second;
// the plugin contract wants the trigger sentence up front. Rotate, keep wording.
function useTriggerFirst(desc) {
  const sentences = desc.split(/(?<=\.)\s+(?=[A-Z(])/);
  const i = sentences.findIndex((s) => /^Use\b/.test(s));
  if (i <= 0) return desc;
  return [sentences[i], ...sentences.filter((_, j) => j !== i)].join(' ');
}

function listFiles(dir, re) {
  return fs
    .readdirSync(dir)
    .filter((f) => re.test(f))
    .sort();
}

let created = [];

// persistence docs are bundled dynamically: any file added to core/persistence/
// ships in every skill body without touching this generator.

function generate() {
  const phaseFiles = listFiles(path.join(CORE, 'phases'), /\.md$/);
  const commandFiles = listFiles(path.join(CORE, 'commands'), /\.md$/);
  if (phaseFiles.length !== 16) fail(`expected 16 files in core/phases, found ${phaseFiles.length}`);
  if (commandFiles.length !== 15) fail(`expected 15 files in core/commands, found ${commandFiles.length}`);
  for (const f of phaseFiles) {
    const name = f.replace(/\.md$/, '');
    if (!manifest.agents[name]) fail(`manifest.agents missing entry for phase "${name}"`);
  }
  for (const f of commandFiles) {
    const name = f.replace(/\.md$/, '');
    if (!manifest.commands[name]) fail(`manifest.commands missing entry for command "${name}"`);
  }
  for (const h of ['hooks.json', 'tasks-guard.sh']) {
    if (!fs.existsSync(path.join(HOOKS_SRC, h)))
      fail(`hooks/${h} is missing at repo root — restore it before generating adapters/claude (stop and report)`);
  }

  const orchestrator = read(path.join(CORE, 'orchestrator.md'));
  const conventions = read(path.join(CORE, 'conventions.md'));
  const persistence = listFiles(path.join(CORE, 'persistence'), /\.md$/)
    .map((f) => read(path.join(CORE, 'persistence', f)));
  if (!persistence.length) fail('no docs under core/persistence/');

  generateClaude({ phaseFiles, commandFiles, orchestrator, conventions, persistence });
  generateOpencode({ phaseFiles, commandFiles, orchestrator, conventions, persistence });
  generateGeneric();
  verify();
}

function skillBody(dialect, { conventions, orchestrator, persistence }) {
  return resolve(
    [conventions.trim(), '\n\n---\n\n', orchestrator.trim(), '\n\n---\n\n',
     ...persistence.map((doc) => doc.trim() + '\n\n---\n\n')].join('')
      .replace(/\n---\n\n$/, '\n'),
    dialect
  );
}

function generateClaude({ phaseFiles, commandFiles, orchestrator, conventions, persistence }) {
  const out = path.join(ADAPTERS, 'claude');

  write(path.join(out, '.claude-plugin', 'plugin.json'), JSON.stringify(manifest.plugin, null, 2) + '\n');

  for (const f of phaseFiles) {
    const name = f.replace(/\.md$/, '');
    const spec = manifest.agents[name];
    const body = resolve(read(path.join(CORE, 'phases', f)), 'claude');
    const fm = frontmatter([
      ['name', name],
      ['description', yamlStr(useTriggerFirst(spec.description))],
      ['model', 'inherit'],
      ['tools', spec.tools.join(', ')],
    ]);
    write(path.join(out, 'agents', f), fm + body);
  }

  for (const f of commandFiles) {
    const name = f.replace(/\.md$/, '');
    const spec = manifest.commands[name];
    const body = resolve(read(path.join(CORE, 'commands', f)), 'claude');
    const pairs = [['description', yamlStr(spec.description)]];
    if (/\$ARGUMENTS/.test(body)) pairs.push(['argument-hint', yamlStr(spec.argumentHint)]);
    write(path.join(out, 'commands', f), frontmatter(pairs) + body);
  }

  const skillFm = frontmatter([
    ['name', manifest.skill.name],
    ['description', yamlStr(manifest.skill.description)],
  ]);
  write(path.join(out, 'skills', 'sdd-workflow', 'SKILL.md'), skillFm + skillBody('claude', { conventions, orchestrator, persistence }));

  copyFile(path.join(HOOKS_SRC, 'hooks.json'), path.join(out, 'hooks', 'hooks.json'));
  copyFile(path.join(HOOKS_SRC, 'tasks-guard.sh'), path.join(out, 'hooks', 'tasks-guard.sh'), 0o755);
}

function generateOpencode({ phaseFiles, commandFiles, orchestrator, conventions, persistence }) {
  const out = path.join(ADAPTERS, 'opencode');

  for (const f of phaseFiles) {
    const name = f.replace(/\.md$/, '');
    const spec = manifest.agents[name];
    const has = (t) => (spec.tools.includes(t) ? 'true' : 'false');
    const body = resolve(read(path.join(CORE, 'phases', f)), 'opencode');
    const fm =
      '---\n' +
      `description: ${yamlStr(useTriggerFirst(spec.description))}\n` +
      'mode: subagent\n' +
      'temperature: 0.2\n' +
      'tools:\n' +
      `  write: ${has('Write')}\n` +
      `  edit: ${has('Edit')}\n` +
      `  bash: ${has('Bash')}\n` +
      '---\n\n';
    write(path.join(out, 'agent', f), fm + body);
  }

  const orchFm =
    '---\n' +
    `description: ${yamlStr(manifest.orchestrator.description)}\n` +
    'mode: primary\n' +
    'temperature: 0.2\n' +
    '---\n\n';
  write(path.join(out, 'agent', 'sdd-orchestrator.md'), orchFm + resolve(orchestrator, 'opencode'));

  for (const f of commandFiles) {
    const name = f.replace(/\.md$/, '');
    const spec = manifest.commands[name];
    const body = resolve(read(path.join(CORE, 'commands', f)), 'opencode');
    const fm = frontmatter([
      ['description', yamlStr(spec.description)],
      ['agent', 'sdd-orchestrator'],
    ]);
    write(path.join(out, 'command', `sdd-${name}.md`), fm + body);
  }

  const skillFm = frontmatter([
    ['name', manifest.skill.name],
    ['description', yamlStr(manifest.skill.description)],
  ]);
  write(path.join(out, 'skills', 'sdd-workflow', 'SKILL.md'), skillFm + skillBody('opencode', { conventions, orchestrator, persistence }));
}

const AGENTS_BLOCK = `<!-- sdd-kit generic block v2 -->
## SDD — Spec-Driven Development

This project uses SDD (Spec-Driven Development): the full contracts live in
\`.sdd/core/\` (\`orchestrator.md\`, \`conventions.md\`, \`phases/\`, \`commands/\`,
\`persistence/\`).

When the user asks for SDD work, read \`.sdd/core/orchestrator.md\` and act as the
orchestrator: route phases, own \`<change>/state\`, ask the
user exactly one question at a time, and never execute phase work inline without
the single-phase contract below.

Phases run in strict single-phase mode: when a contract says "launch phase
\`X\`", read \`.sdd/core/phases/X.md\`, execute exactly that contract, persist the
artifact per the \`artifact_store\` in \`config\`, STOP, and tell the
user to re-invoke for the next phase. When it says "command \`X\`", the user-facing
steps are \`.sdd/core/commands/X.md\`.

Pipeline:

    explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive

- \`clarify\` is a mandatory gate between spec and design.
- \`blast-radius\` maps consumers of changed code after design, before tasks.
- Auxiliary phases: \`sdd-drift\`, \`sdd-security\`, \`sdd-estimate\`, \`sdd-steer\`,
  \`sdd-postmortem\` (after archive; proposals need human approval), \`stack-detector\`
  (see \`.sdd/core/phases/\`).
- Never bypass the workload guard in \`<change>/tasks\` (chained PRs / size exception).
- Commit guard: \`.git/hooks/pre-commit\` enforces unchecked tasks
  (\`sdd guard install\`); bypass deliberately with \`SDD_ALLOW_COMMIT=1\`.
- Persistence routing: \`.sdd/core/persistence/interface.md\` defines SAVE/LOAD/LIST;
  pick a backend doc (files, SQLite, any mapped MCP memory server, or \`+\`
  combinations) via \`artifact_store\` in \`config\`.
- User-facing command contracts: \`.sdd/core/commands/*.md\` — adapt their steps to
  this tool's agent mechanism.

CLI helpers (from the sdd-kit repo or a global \`sdd\`): \`sdd status\`, \`sdd next\`,
\`sdd doctor\`, \`sdd guard install\`.
`;

const README_INSTALL = `# Generic install (any coding agent)

1. Copy this folder's \`core/\` (already resolved for generic use — no template
   placeholders) into your project as \`.sdd/core/\` (layout: \`orchestrator.md\`,
   \`conventions.md\`, \`phases/\`, \`commands/\`, \`persistence/\`).
2. Append \`AGENTS.block.md\` (this folder) to your project's \`AGENTS.md\` — create
   the file if absent; skip if the \`sdd-kit generic block\` marker is already there.
3. Run \`sdd guard install\` in the project to install the commit guard
   (\`.git/hooks/pre-commit\` blocks commits while active changes have unchecked tasks).

Or do all three at once from a clone of sdd-kit: \`sdd install generic --project\`.
Then tell your agent to read \`.sdd/core/orchestrator.md\` and start the pipeline.
`;

function generateGeneric() {
  const out = path.join(ADAPTERS, 'generic');
  // resolved core copy — the generic floor must never see raw placeholders
  const copyCore = (srcDir, dstDir) => {
    for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
      const sp = path.join(srcDir, e.name);
      if (e.isDirectory()) { copyCore(sp, path.join(dstDir, e.name)); continue; }
      if (!e.name.endsWith('.md')) continue;
      write(path.join(dstDir, e.name), resolve(read(sp), 'generic'));
    }
  };
  copyCore(CORE, path.join(out, 'core'));
  write(path.join(out, 'AGENTS.block.md'), AGENTS_BLOCK);
  write(path.join(out, 'README.install.md'), README_INSTALL);
}

function walk(dir, acc) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function verify() {
  const files = walk(ADAPTERS, []);
  const bad = [];
  for (const f of files) {
    if (PLACEHOLDER.test(read(f))) bad.push(path.relative(ROOT, f));
  }
  if (bad.length) fail(`unresolved placeholders in: ${bad.join(', ')}`);
  console.log(`generate: OK — ${files.length} files under adapters/, 0 unresolved placeholders`);
}

generate();
for (const c of created.sort()) console.log(`  wrote ${c}`);
