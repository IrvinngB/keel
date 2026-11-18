---
name: sdd-help
description: "Show Keel SDD pipeline overview, slash/skill commands, and terminal CLI reference (arguments: [command-or-topic])."
---

You are the SDD orchestrator. Answer directly without launching subagents or editing
any files. If the user's arguments names a specific command or topic, focus on that;
otherwise present the concise reference below in the user's language.

## What is Keel / SDD?

Spec-Driven Development (SDD) runs every non-trivial change through a structured
pipeline before and after code, keeping specs, decisions, and verification in git
under `keel/`:

```
explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive
```

## Core pipeline commands

| Command | Purpose |
|---------|---------|
| command `init` | Bootstrap `keel/` (`config.yaml` + `steering/*`) for this repo |
| `command new <change>` | Start a new change (explore + proposal) |
| `command continue [change]` | Advance the next pending phase for a change |
| `command ff [change]` | Fast-forward planning phases up to `tasks` (pauses on clarify BLOCKERs) |
| `command explore <topic>` | Investigate codebase & approaches before proposing |
| `command clarify [change]` | Surface ambiguities & unverified assumptions before design |
| `command blast [change]` | Map real consumers (`file:line`) affected by the design |
| `command apply [change]` | Implement tasks (follows `strict_tdd` if enabled) |
| `command verify [change]` | Run tests, spec compliance matrix, and optional security/compliance checks |
| `command archive [change]` | Sync delta specs into `keel/specs/` and archive the completed change |

## Auxiliary commands (anytime)

| Command | Purpose |
|---------|---------|
| `command estimate [change]` | Estimate complexity, effort, and high-risk areas after `tasks` |
| `command drift [change]` | Compare `design.md` / `specs/` against actual git changes |
| `command security [scope]` | Read-only OWASP-style security review |
| `command compliance [scope]` | Read-only baseline privacy/consent/terms acknowledgment check (not legal advice) |
| command `steer` | Refresh `keel/steering/*` (`product.md`, `tech.md`, `structure.md`) |
| `command postmortem <change>` | Extract lessons from an archived change into `keel/lessons/` |

## Terminal CLI (`sdd`, zero tokens)

- `sdd status [change]` — pipeline progress, task counts, and workload guard
- `sdd next [change]` — next phase and exact command to run
- `sdd check [change]` — deterministic gate & spec validator (exits `1` on failure)
- `sdd drift [change]` — compare `design.md` `File Changes` vs `git diff`
- `sdd archive [change]` — verify gates, sync specs, and move change to `archive/`
- `sdd ci [--strict-tasks]` — CI check for store health and gates
- `sdd doctor` — inspect installed adapters, store health, and commit guard
- `sdd guard install|remove` — git pre-commit guard for unchecked tasks
- `sdd --version` — print CLI version
