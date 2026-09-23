#!/usr/bin/env node
'use strict';

// Keel generator: core/ (canonical, tool-agnostic markdown) + manifest.registry -> adapters/<agent>/
// Agents are DATA (build/manifest.json "registry"); SKILL.md is the base output format.
// Zero dependencies. Run: node build/generate.js

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CORE = path.join(ROOT, 'core');
const ADAPTERS = path.join(ROOT, 'adapters');
const BUILD = path.join(ROOT, 'adapters.build');
const OLD = path.join(ROOT, 'adapters.old');
const HOOKS_SRC = path.join(ROOT, 'hooks');
const TEMPLATES = path.join(__dirname, 'templates');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'manifest.json'), 'utf8'));
const REGISTRY = manifest.registry;

const PLACEHOLDER = /\{\{(agent|cmd|skill):([a-z0-9-]+)\}\}/g;
const PLACEHOLDER_TEST = /\{\{(agent|cmd|skill):([a-z0-9-]+)\}\}/;
const SKILL_NAME_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function fill(tpl, name) {
  return tpl
    .replace(/\{name\}/g, () => name)
    .replace(/\{short\}/g, () => name.replace(/^sdd-/, ''));
}

// neutral=true: skill bodies are shared by every agent that reads the same skills dir, so
// they use manifest.neutralInvoke; native syntax stays in context-file blocks and native files.
// A placeholder the source already wraps in backticks is rendered without a second pair
// when its template brings its own (e.g. "phase `{name}`"), so spans never nest.
const PLACEHOLDER_WRAPPED = /(`?)\{\{(agent|cmd|skill):([a-z0-9-]+)\}\}(`?)/g;

function resolve(text, id, neutral = false) {
  const r = REGISTRY[id];
  const n = manifest.neutralInvoke;
  const invoke = neutral ? n : r.invoke;
  return text
    .replace(PLACEHOLDER_WRAPPED, (_, pre, kind, name, post) => {
      const rendered = fill(invoke[kind], name);
      if (!rendered.includes('`')) return pre + rendered + post;
      // both sides wrapped: the template's own span replaces the source's; one side only:
      // the source span keeps running (e.g. "`{{cmd:new}} <name>`"), so drop the template's.
      return pre && post ? rendered : pre + (pre || post ? rendered.replace(/`/g, '') : rendered) + post;
    })
    .replace(/\$ARGUMENTS/g, () => (neutral ? n.args : r.args));
}

function read(p) {
  if (!fs.existsSync(p)) fail(`missing required file: ${path.relative(ROOT, p)}`);
  return fs.readFileSync(p, 'utf8');
}

const REMOVABLE = new Set(['adapters', 'adapters.build', 'adapters.old']);

// A path may be removed only if it really resolves to <ROOT>/<expected name>;
// a symlink pointing elsewhere (or a renamed target) is refused.
function isRemovable(p) {
  if (!REMOVABLE.has(path.basename(p))) return false;
  let real;
  try { real = fs.realpathSync(p); } catch (e) { return true; }
  return path.dirname(real) === fs.realpathSync(ROOT) && REMOVABLE.has(path.basename(real));
}

function removeGenerated(p) {
  if (!isRemovable(p)) fail(`refusing to remove ${p}: not a generated directory inside the repo`);
  fs.rmSync(p, { recursive: true, force: true });
}

function fail(msg) {
  console.error(`generate: ERROR: ${msg}`);
  try { if (isRemovable(BUILD)) fs.rmSync(BUILD, { recursive: true, force: true }); } catch (e) { /* best effort */ }
  process.exit(1);
}

let created = [];

function write(p, content, mode) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, mode === undefined ? {} : { mode });
  created.push(path.relative(BUILD, p));
}

function copyFile(src, dst, mode) {
  if (!fs.existsSync(src)) fail(`missing required file: ${path.relative(ROOT, src)}`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  if (mode !== undefined) fs.chmodSync(dst, mode);
  created.push(path.relative(BUILD, dst));
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

function skillDoc(name, description, body) {
  if (!SKILL_NAME_RE.test(name) || name.length > 64) fail(`invalid skill name "${name}"`);
  if (description.length > 1024) fail(`skill "${name}" description exceeds 1024 characters`);
  return frontmatter([['name', name], ['description', yamlStr(description)]]) + body;
}

function tomlString(s) {
  if (!s.includes("'''")) return `'''\n${s}'''`;
  return `"""\n${s.replace(/\\/g, '\\\\').replace(/"""/g, '\\"\\"\\"')}"""`;
}

const PHASE_FORMATS = {
  'claude-agent': ({ f, spec, name, body }) => ({
    file: f,
    content:
      frontmatter([
        ['name', name],
        ['description', yamlStr(useTriggerFirst(spec.description))],
        ['model', 'inherit'],
        ['tools', spec.tools.join(', ')],
      ]) + body,
  }),
  'opencode-agent': ({ f, spec, body }) => {
    const has = (t) => (spec.tools.includes(t) ? 'true' : 'false');
    return {
      file: f,
      content:
        '---\n' +
        `description: ${yamlStr(useTriggerFirst(spec.description))}\n` +
        'mode: subagent\n' +
        'temperature: 0.2\n' +
        'tools:\n' +
        `  write: ${has('Write')}\n` +
        `  edit: ${has('Edit')}\n` +
        `  bash: ${has('Bash')}\n` +
        '---\n\n' +
        body,
    };
  },
};

const COMMAND_FORMATS = {
  'claude-command': ({ name, spec, body }) => {
    const pairs = [['description', yamlStr(spec.description)]];
    if (/\$ARGUMENTS/.test(body)) pairs.push(['argument-hint', yamlStr(spec.argumentHint)]);
    return { file: `${name}.md`, content: frontmatter(pairs) + body };
  },
  'opencode-command': ({ name, spec, body }) => ({
    file: `sdd-${name}.md`,
    content: frontmatter([['description', yamlStr(spec.description)], ['agent', 'sdd-orchestrator']]) + body,
  }),
  toml: ({ name, spec, body }) => {
    if (/[!@]\{/.test(body)) fail(`command "${name}" contains a !{ or @{ token that TOML commands would execute`);
    return {
      file: `${name}.toml`,
      content: `description = ${JSON.stringify(spec.description)}\nprompt = ${tomlString(body)}\n`,
    };
  },
};

function validateRegistry() {
  if (!REGISTRY || typeof REGISTRY !== 'object') fail('manifest.registry is missing');
  for (const [id, r] of Object.entries(REGISTRY)) {
    for (const k of ['displayName', 'status', 'invoke', 'args', 'emit', 'install'])
      if (r[k] === undefined) fail(`registry.${id} is missing "${k}"`);
    if (!['verified', 'experimental'].includes(r.status)) fail(`registry.${id}.status must be verified|experimental`);
    for (const k of ['cmd', 'agent', 'skill'])
      if (typeof r.invoke[k] !== 'string') fail(`registry.${id}.invoke.${k} must be a string`);
    const e = r.emit;
    if (e.floor) continue;
    if (!e.workflowSkill) fail(`registry.${id}.emit.workflowSkill is required`);
    if (!e.phases || !e.commands) fail(`registry.${id}.emit needs phases and commands`);
    if (e.phases.as === 'subagent') {
      if (!PHASE_FORMATS[e.phases.format]) fail(`registry.${id}.emit.phases.format "${e.phases.format}" is unknown`);
    } else if (e.phases.as !== 'skill') fail(`registry.${id}.emit.phases.as must be subagent|skill`);
    if (e.commands.as === 'command') {
      if (!COMMAND_FORMATS[e.commands.format]) fail(`registry.${id}.emit.commands.format "${e.commands.format}" is unknown`);
    } else if (e.commands.as !== 'skill') fail(`registry.${id}.emit.commands.as must be command|skill`);
    if ((e.phases.as === 'skill' || e.commands.as === 'skill') && !r.install.project && !r.install.user)
      fail(`registry.${id} emits skills but declares no install target`);
    if (r.skillsRead !== undefined && !Array.isArray(r.skillsRead)) fail(`registry.${id}.skillsRead must be an array`);
    if (r.neutralSkills) validateSkillsInstall(id, r);
  }
}

// Skills are installed ONCE: an agent that reads the shared dir must install its skills
// there at project scope; an agent that does not keeps them in a dir it does read.
function validateSkillsInstall(id, r) {
  const shared = manifest.sharedSkillsDir;
  const n = manifest.neutralInvoke;
  if (!shared) fail('manifest.sharedSkillsDir is missing');
  if (!n) fail('manifest.neutralInvoke is missing');
  for (const k of ['cmd', 'agent', 'skill', 'args'])
    if (typeof n[k] !== 'string') fail(`manifest.neutralInvoke.${k} must be a string`);
  const map = (r.install.project && r.install.project.map) || [];
  const skills = map.find((m) => m.from === 'skills');
  if (!skills) return;
  const reads = r.skillsRead || [];
  if (reads.includes(shared) && skills.to !== shared)
    fail(`registry.${id} reads ${shared} but installs its project skills to ${skills.to} (skills must be installed once, in the shared dir)`);
  if (!reads.includes(skills.to)) fail(`registry.${id} installs project skills to ${skills.to}, which it does not read`);
}

function generate() {
  validateRegistry();
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

  const ctx = {
    phaseFiles,
    commandFiles,
    orchestrator: read(path.join(CORE, 'orchestrator.md')),
    conventions: read(path.join(CORE, 'conventions.md')),
    persistence: listFiles(path.join(CORE, 'persistence'), /\.md$/).map((f) => read(path.join(CORE, 'persistence', f))),
    skillsBlock: read(path.join(TEMPLATES, 'skills-block.md')),
  };
  if (!ctx.persistence.length) fail('no docs under core/persistence/');

  removeGenerated(BUILD);
  removeGenerated(OLD);
  for (const id of Object.keys(REGISTRY)) emitAgent(id, ctx);
  const total = verify();
  swapIn();
  console.log(`generate: OK — ${total} files under adapters/, 0 unresolved placeholders`);
}

// adapters -> adapters.old, build -> adapters, then drop the old tree; any failure
// puts the previous adapters back instead of leaving the repo without them.
function swapIn() {
  const hadAdapters = fs.existsSync(ADAPTERS);
  if (hadAdapters) {
    if (!isRemovable(ADAPTERS)) fail('refusing to replace adapters/: it does not resolve to a directory inside the repo');
    fs.renameSync(ADAPTERS, OLD);
  }
  try {
    fs.renameSync(BUILD, ADAPTERS);
  } catch (e) {
    if (hadAdapters) {
      try { fs.renameSync(OLD, ADAPTERS); } catch (e2) { console.error(`generate: could not restore adapters/ from ${OLD}: ${e2.message}`); }
    }
    fail(`could not swap in the new adapters (${e.message}); previous adapters/ restored`);
  }
  if (hadAdapters) removeGenerated(OLD);
}

// persistence docs are bundled dynamically: any file added to core/persistence/
// ships in every workflow skill without touching this generator.
function skillBody(id, { conventions, orchestrator, persistence }, neutral) {
  return resolve(
    [conventions.trim(), '\n\n---\n\n', orchestrator.trim(), '\n\n---\n\n',
     ...persistence.map((doc) => doc.trim() + '\n\n---\n\n')].join('')
      .replace(/\n---\n\n$/, '\n'),
    id,
    neutral
  );
}

// One marked region per agent so several agents can share a context file (AGENTS.md)
// and `sdd install` can replace exactly its own region on re-runs.
function agentBlock(id, body) {
  return `<!-- keel:begin agent=${id} -->\n${body.trim()}\n<!-- keel:end agent=${id} -->\n`;
}

function emitAgent(id, ctx) {
  const r = REGISTRY[id];
  const e = r.emit;
  const out = path.join(BUILD, id);
  if (e.floor) return emitGeneric(out);

  if (e.plugin) write(path.join(out, '.claude-plugin', 'plugin.json'), JSON.stringify(manifest.plugin, null, 2) + '\n');

  const skillNames = new Set();
  const claimSkill = (name) => {
    if (skillNames.has(name)) fail(`registry.${id}: two outputs share the skill name "${name}"`);
    skillNames.add(name);
  };
  const neutral = Boolean(r.neutralSkills);

  write(
    path.join(out, e.workflowSkill, 'SKILL.md'),
    skillDoc(manifest.skill.name, manifest.skill.description, skillBody(id, ctx, neutral))
  );
  claimSkill(manifest.skill.name);

  for (const f of ctx.phaseFiles) {
    const name = f.replace(/\.md$/, '');
    const spec = manifest.agents[name];
    const raw = read(path.join(CORE, 'phases', f));
    if (e.phases.as === 'subagent') {
      const { file, content } = PHASE_FORMATS[e.phases.format]({ f, name, spec, body: resolve(raw, id) });
      write(path.join(out, e.phases.dir, file), content);
    } else {
      const skillName = fill(e.phases.name, name);
      claimSkill(skillName);
      write(
        path.join(out, e.phases.dir, skillName, 'SKILL.md'),
        skillDoc(skillName, useTriggerFirst(spec.description), resolve(raw, id, neutral))
      );
    }
  }

  if (e.orchestrator) {
    const orchFm =
      '---\n' +
      `description: ${yamlStr(manifest.orchestrator.description)}\n` +
      'mode: primary\n' +
      'temperature: 0.2\n' +
      '---\n\n';
    write(path.join(out, e.orchestrator.dir, e.orchestrator.file), orchFm + resolve(ctx.orchestrator, id));
  }

  for (const f of ctx.commandFiles) {
    const name = f.replace(/\.md$/, '');
    const spec = manifest.commands[name];
    const raw = read(path.join(CORE, 'commands', f));
    if (e.commands.as === 'command') {
      const { file, content } = COMMAND_FORMATS[e.commands.format]({ name, spec, body: resolve(raw, id) });
      write(path.join(out, e.commands.dir, file), content);
    } else {
      const skillName = fill(e.commands.name, name);
      claimSkill(skillName);
      write(
        path.join(out, e.commands.dir, skillName, 'SKILL.md'),
        skillDoc(skillName, `${spec.description} (arguments: ${spec.argumentHint}).`, resolve(raw, id, neutral))
      );
    }
  }

  if (e.hooks) {
    copyFile(path.join(HOOKS_SRC, 'hooks.json'), path.join(out, 'hooks', 'hooks.json'));
    copyFile(path.join(HOOKS_SRC, 'tasks-guard.sh'), path.join(out, 'hooks', 'tasks-guard.sh'), 0o755);
  }

  if (e.contextFile) {
    const body = resolve(ctx.skillsBlock, id).replace(/\{displayName\}/g, () => r.displayName);
    write(path.join(out, e.contextFile.blockFile), agentBlock(id, body));
  }
}

const AGENTS_BLOCK = `## SDD — Spec-Driven Development (generic)

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

CLI helpers (from the Keel repo or a global \`sdd\`): \`sdd status\`, \`sdd next\`,
\`sdd doctor\`, \`sdd guard install\`.
`;

const README_INSTALL = `# Generic install (any coding agent)

1. Copy this folder's \`core/\` (already resolved for generic use — no template
   placeholders) into your project as \`.sdd/core/\` (layout: \`orchestrator.md\`,
   \`conventions.md\`, \`phases/\`, \`commands/\`, \`persistence/\`).
2. Append \`AGENTS.block.md\` (this folder) to your project's \`AGENTS.md\` — create
   the file if absent. The block is wrapped in \`keel:begin/end agent=generic\`
   markers; if they are already there, replace that region instead of appending.
   Agents that read another context file (for example \`GEMINI.md\`) need the same
   block appended there.
3. Run \`sdd guard install\` in the project to install the commit guard
   (\`.git/hooks/pre-commit\` blocks commits while active changes have unchecked tasks).

Or do all three at once from a clone of Keel: \`sdd install generic --project\`
(add \`--context-file=GEMINI.md\` for a second context file).
Then tell your agent to read \`.sdd/core/orchestrator.md\` and start the pipeline.
`;

function emitGeneric(out) {
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
  write(path.join(out, 'AGENTS.block.md'), agentBlock('generic', AGENTS_BLOCK));
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

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Nested spans look like "`" + <template prefix> + "`": derive them from every invoke template.
function nestedSpanRe() {
  const prefixes = new Set(['command ', 'phase ']);
  const templates = [...Object.values(manifest.neutralInvoke), ...Object.values(REGISTRY).flatMap((r) => Object.values(r.invoke))];
  for (const t of templates) if (typeof t === 'string' && t.includes('`') && t.indexOf('`') > 0) prefixes.add(t.slice(0, t.indexOf('`')));
  return new RegExp([...prefixes].map((p) => '`' + escapeRe(p) + '`').join('|'));
}

function verify() {
  const files = walk(BUILD, []);
  const nested = nestedSpanRe();
  const bad = [];
  const problems = [];
  for (const f of files) {
    const text = read(f);
    const rel = path.relative(BUILD, f);
    if (PLACEHOLDER_TEST.test(text)) bad.push(rel);
    if (!f.endsWith('.md') && !f.endsWith('.toml')) continue;
    if (nested.test(text)) problems.push(`nested backticks in ${rel}`);
    if (!rel.startsWith('generic' + path.sep) && text.includes('`this document`')) problems.push(`"\`this document\`" outside generic in ${rel}`);
  }
  if (bad.length) fail(`unresolved placeholders in: ${bad.join(', ')}`);
  if (problems.length) fail(`self-check failed:\n  ${problems.join('\n  ')}`);
  return files.length;
}

generate();
for (const c of created.sort()) console.log(`  wrote adapters/${c}`);
