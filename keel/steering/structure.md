# Structure
Last refreshed: 2026-09-24

## Directory map

```
core/                 SOURCE. Tool-agnostic markdown contracts (edit here)
  orchestrator.md       routing, guards, session caches
  conventions.md        artifact layout, state.yaml, envelope, workload guard
  phases/               16 contracts: sdd-*.md (pipeline + utilities) + stack-detector.md
  commands/             15 command bodies
  persistence/          interface.md, files.md, sqlite.md, mcp-generic.md, template.md
adapters/             GENERATED per agent: antigravity, claude, codex, gemini, generic, kimi, opencode
build/                generate.js (generator), manifest.json (agent registry, version),
                      templates/skills-block.md
bin/sdd               zero-dependency CLI: build, install, status, next, doctor, guard
hooks/                hooks.json, pre-commit (git guard), tasks-guard.sh (Claude PreToolUse)
scripts/              sync-version.js (used by `npm version`)
test/                 *.test.js (artifacts, docs, guard, install, package) + helpers.js
docs/                 install.md; es/ = Spanish mirror (structure checked by a test)
.claude-plugin/       marketplace.json (plugin listing)
.github/              workflows (CI), issue and PR templates
keel/                 Keel's own artifacts (committed with the code they describe)
  config.yaml           stack, test commands, artifact_store: files, strict_tdd
  steering/             product.md, tech.md, structure.md
  specs/                source-of-truth specs, updated on archive
  changes/<name>/       proposal, specs/, clarifications, design, blast-radius, tasks,
                        state.yaml; finished ones in changes/archive/<date>-<name>/
  lessons/              postmortems
.atl/                 local skill registry cache (not Keel source; do not edit here)
```

## Generated vs source

- Source: `core/`, `build/`, `bin/`, `hooks/`, `test/`, docs.
- Generated: `adapters/` only. Regenerate with `node bin/sdd build`; commit it as a separate
  `build: regenerate adapters` commit.

## Where new code goes

| Change | Location |
|--------|----------|
| Phase or command behavior | `core/phases/`, `core/commands/` |
| Artifact layout, envelope, guards | `core/conventions.md` |
| Orchestrator routing | `core/orchestrator.md` |
| New persistence backend | `core/persistence/` (start from `template.md`) |
| New agent support | row in `registry` in `build/manifest.json` (never `core/`) |
| New output file format | formatter function in `build/generate.js` |
| CLI behavior | `bin/sdd` + test in `test/` |
| Docs change | update `docs/es/` mirror too |

## Naming conventions

- Phases: `core/phases/sdd-<phase>.md`; commands: `core/commands/<name>.md`.
- Tests: `test/<area>.test.js`, run with `node:test`.
- Change names: kebab-case; archives: `YYYY-MM-DD-<name>`.
- CLI `sdd`, commands `/sdd:*`, skills `sdd-*` (SDD = methodology, Keel = project).
