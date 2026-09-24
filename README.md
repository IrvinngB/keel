# Keel

[![CI](https://github.com/IrvinngB/keel/actions/workflows/ci.yml/badge.svg)](https://github.com/IrvinngB/keel/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> Spec-driven development for any AI coding agent. Plan the change, prove it, and
> keep the specs in git, whether you use Claude Code, opencode, Codex CLI, Gemini CLI,
> or anything that reads `AGENTS.md`.

**Why?** Agents jump straight to code. Keel runs every change through a pipeline, so
assumptions get questioned before design, every consumer of the code is mapped before
tasks are written, and nothing is archived until it is verified:

```
explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive
```

Everything is plain files under `keel/`, reviewed in your pull requests like code.

## Quick start (Claude Code)

```
/plugin marketplace add IrvinngB/keel
/plugin install sdd@keel
/sdd:init
/sdd:new my-change
```

Using another agent? See [Install](#install).

## What you get

A change in progress, from the terminal and without spending tokens:

```console
$ sdd status
CHANGE         PHASES                                                  TASKS GUARD    STATE
add-dark-mode  explore→proposal→spec→clarify→design→blast-radius→tasks 2/4   none     apply
rate-limit-api proposal→spec                                           -     -        spec

next: /sdd:continue

$ sdd next
add-dark-mode: next phase = apply → run /sdd:continue add-dark-mode
rate-limit-api: next phase = clarify → run /sdd:continue rate-limit-api
```

And the artifacts behind it, committed with your code:

```
keel/
├── config.yaml              stack, verified test/lint commands, artifact store
├── steering/                product.md · tech.md · structure.md, refreshed after apply
├── specs/auth/spec.md       source of truth, updated on archive
├── lessons/add-login.md     postmortem: plan vs git reality
└── changes/
    ├── add-dark-mode/       proposal · specs/ · clarifications · design ·
    │                        blast-radius · tasks · state.yaml
    ├── rate-limit-api/
    └── archive/2026-09-20-add-login/
```

## How is it different?

[OpenSpec](https://github.com/Fission-AI/OpenSpec) and
[spec-kit](https://github.com/github/spec-kit) are mature, widely used SDD kits; if
they fit your team, use them. Keel is younger and makes different bets:

- **More gates before code.** Besides clarify, a blast-radius phase maps every real
  consumer of the code you are about to change, with file:line evidence, and blocks
  tasks until each breaking one is covered. Drift detection and postmortems close the
  loop after apply.
- **Enforced, not only suggested.** A git pre-commit guard blocks commits while tasks
  are unchecked, and oversized changes need chained PRs or an explicit
  `size:exception`.
- **One core, generated adapters.** Every agent gets files generated from one set of
  markdown contracts; adding an agent is one registry row. Honest status per agent
  below.
- **Pluggable persistence.** Files by default; SQLite, or an MCP memory server mapped
  through the generic backend, behind the same SAVE/LOAD/LIST interface.

## Install

The CLI is `sdd`, the commands are `/sdd:*` and the skills are named `sdd-*`: SDD is
the methodology, Keel is the project.

### Claude Code (plugin)

```
/plugin marketplace add IrvinngB/keel
/plugin install sdd@keel
```

### Every other agent

```bash
npm install -g github:IrvinngB/keel          # puts `sdd` on PATH (Windows included)
# or: git clone https://github.com/IrvinngB/keel && cd keel && ln -s "$PWD/bin/sdd" ~/.local/bin/sdd

sdd install opencode --user                  # global: ~/.config/opencode/{agent,command,skills}
sdd install opencode --project               # per-repo: .opencode/{agent,command} + .agents/skills
sdd install codex --project                  # .agents/skills + AGENTS.md block + commit guard
sdd install gemini --project                 # .agents/skills + .gemini/commands + GEMINI.md block
sdd install kimi --project                   # .agents/skills + AGENTS.md block   (experimental)
sdd install generic --project                # any other AGENTS.md-respecting agent: .sdd/core/
                                             # + AGENTS.md (--context-file=GEMINI.md for a 2nd file)
sdd install claude                           # prints the /plugin commands above
```

Add `--user` instead of `--project` for a global install (Gemini and Kimi print the
block to paste instead of writing it: no verified user-level context path).

### Supported agents

| Agent | Skills dir | Commands | Subagents | Context file | Status |
|-------|-----------|----------|-----------|--------------|--------|
| Claude Code | plugin | `/sdd:new` | yes | plugin | Verified (1) |
| opencode | `.agents/skills` | `/sdd-new` | yes | — | Tested (1) |
| Codex CLI | `.agents/skills` | `$sdd-new` (skills) | single-phase | `AGENTS.md` | Experimental (3) |
| Gemini CLI | `.agents/skills` | `/sdd:new` (TOML) | single-phase | `GEMINI.md` | Experimental (4) |
| Kimi Code CLI | `.agents/skills` | `/skill:sdd-new` | single-phase | `AGENTS.md` (2) | Experimental |
| Generic | — | read the phase file | single-phase | `AGENTS.md` | Verified |

**Tested** means a real headless session of that agent loaded the installed skills
(opencode 1.18.18, 2026-09-23). **Verified** means the extension surface was checked
against the agent's official docs on that date. **Experimental** means docs only or
partly inferred: neither guarantees a full pipeline run inside that agent.
(1) The `agents/` and `command/` file layouts come from the previous release and
were not re-checked; the generated `/sdd-*` opencode commands were not exercised.
(2) Kimi reading `AGENTS.md` is inferred, not confirmed. (3) Codex was not available
to test. (4) Gemini CLI is being retired for individual accounts in favor of
Antigravity; the headless run was rejected by Google, so it could not be tested.

`sdd install` and `sdd doctor` print the per-agent `unverified` fields and notes.
Gemini CLI reads `GEMINI.md`, not `AGENTS.md`, unless you list it in
`context.fileName`; `sdd install gemini` writes `GEMINI.md`. Antigravity (`agy`) is not
supported yet.

What the installer writes, shared skill dirs, per-agent context blocks, dry runs and
the Antigravity status: [docs/install.md](docs/install.md).

### In every case, per project

Run `/sdd:init` inside your agent — it detects the stack, writes
`keel/config.yaml`, and asks the setup questions — artifact store (any
registered backend or `+` combination), Strict TDD, security review.

## Using it

Inside any installed agent:

| Command | Purpose |
|---------|---------|
| `/sdd:init` | bootstrap keel/ + stack detection |
| `/sdd:new <change>` | explore + proposal |
| `/sdd:continue` | next dependency-ready phase |
| `/sdd:ff` | planning in one shot (propose→spec→clarify→design→blast-radius→tasks) |
| `/sdd:explore <topic>` | investigate an idea, compare approaches |
| `/sdd:clarify` | force the uncomfortable questions before design |
| `/sdd:apply` / `/sdd:verify` / `/sdd:archive` | implement → prove → close |
| `/sdd:blast <symbol>` | what breaks if I change X? (standalone or in-pipeline) |
| `/sdd:estimate` `/sdd:drift` `/sdd:security` `/sdd:steer` `/sdd:postmortem` | risk, divergence, audit, context, learning |

(Claude dialect shown — see the table above for other agents; `sdd next` always
prints the exact command for your tool.)

From your terminal, no tokens spent:

```bash
sdd status            # every active change: phase, tasks x/y, pending decisions
sdd next              # the exact command to run next, in your tool's dialect
sdd doctor            # tools detected, adapters installed, guards active
sdd guard install     # universal git pre-commit guard (any agent, any human)
```

## What is in the pipeline

- **Clarify gate** — no design on top of guesses: assumptions verified against real
  code, BLOCKER questions with recommended defaults, answered before `design`.
- **Blast radius** — before tasks, every real consumer of the code you're about to
  change is mapped with file:line evidence (call sites, routes, tables, published
  APIs, tests); each BREAKS row must become a task or the pipeline blocks.
- **Postmortem learning** — after archive, plan vs git reality is reconciled into
  `keel/lessons/`, and recurring patterns become PROPOSED steering updates
  (never auto-applied). The system gets sharper with use.
- **Drift detection** — `git log` of touched files vs artifact dates, classified:
  `CODE_UNTRACKED` / `SPEC_STALE` / `DESIGN_STALE` / `ARTIFACT_UNDONE`.
- **Steering docs** — `keel/steering/{product,tech,structure}.md` refreshed after
  every apply batch; sessions start with truth, not archaeology.
- **Stack-agnostic** — `stack-detector` verifies real test/lint commands into
  `keel/config.yaml`; downstream phases read config, never assume a language.
- **Reviewer protection** — 400-line forecast per change; oversized work needs
  chained PRs (stacked / feature-branch chain) or an explicit `size:exception`.
- **Forced reversibility & observability** — design.md cannot ship without its
  Rollback and Observability sections ("N/A + why" allowed, silence is not).
- **Two execution modes** — tools with subagents delegate (fresh context per
  phase); tools without run strict single-phase. Same contracts, same files.
- **Commit guard, universal** — Claude PreToolUse + git pre-commit (bypass
  deliberately: `SDD_ALLOW_COMMIT=1 git commit ...`).

## Architecture

```
core/               ← single source of truth (tool-agnostic)
├── orchestrator.md     the orchestrator role: routing, guards, session caches
├── conventions.md      artifact layout, state.yaml, envelope, workload guard
├── persistence/        interface.md + backends: files · SQLite · generic MCP ·
│                     template.md to add your own
├── phases/             16 phase contracts (10 pipeline + 6 utilities)
└── commands/           15 command bodies
adapters/           ← GENERATED by build/generate.js — never edit by hand
bin/sdd             ← CLI: build · install · status · next · doctor · guard
hooks/              ← PreToolUse (Claude) + pre-commit (universal git guard)
```

**New tool?** Add one entry to the agent registry in `build/manifest.json`; `core/` never changes.

## Adding an agent

Agents are rows in `registry` inside `build/manifest.json`. A row declares:

- `invoke` — how `{{cmd:X}}`, `{{agent:X}}` and `{{skill:X}}` resolve (`{name}`,
  `{short}` templates) and `args` — how the user's arguments are referenced;
- `emit` — whether phases/commands become skills or native subagent/command files
  (`format` picks an existing formatter such as `toml`), the skills dir name, and an
  optional `contextFile` block;
- `install` — where files land per scope, plus the context file to append to;
- `status` (`verified` | `experimental`), `unverifiedFields` and `notes`, which
  `sdd install` and `sdd doctor` print as warnings.

Add the row, run `sdd build`, done — no generator code changes for any agent that
fits the skills, Markdown or TOML shapes. A brand-new file format needs one small
formatter function in `build/generate.js`. Until a row exists, `sdd install generic`
already covers the agent.

## Contributing

Bug reports, agent support reports and PRs are welcome. Start with
[CONTRIBUTING.md](CONTRIBUTING.md): where each change goes, the portability rules, and
the checks CI runs.

- Questions and ideas: [Discussions](https://github.com/IrvinngB/keel/discussions)
- First contribution: [good first issues](https://github.com/IrvinngB/keel/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- Tested Keel in an Experimental agent? An
  [agent support report](https://github.com/IrvinngB/keel/issues/new?template=agent_support.yml)
  is the fastest way to move it to Tested.

Participation follows the [Code of Conduct](CODE_OF_CONDUCT.md); report
vulnerabilities per [SECURITY.md](SECURITY.md).

## License

MIT
