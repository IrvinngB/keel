---
name: sdd-workflow
description: "Spec-Driven Development pipeline contract for this project. Read before running or coordinating any SDD command or phase subagent — defines the artifact layout, phase graph, workload guards, and steering docs."
---
# SDD Workflow Contract

The main agent session is the SDD **orchestrator**: it routes phases to
its phase subagents and never executes phase work inline. Artifacts are plain files
under `openspec/` in the user's project — git-tracked, no external services.

## Pipeline

```
explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive
```

- **clarify** is a mandatory gate between spec and design: it forces open questions
  and unverified assumptions to the surface BEFORE the design is written. Skipping it
  is the most common cause of full design rework.
- **sdd-blast-radius** maps every real consumer of the code about to change (call
  sites, routes, tables, published APIs, tests) AFTER design; tasks must convert
  every must-handle line into work items.
- Auxiliary (run anytime): `stack-detector` (inside init),
  `sdd-drift` (before verify/archive), `sdd-security` (inside verify or
  standalone), `sdd-estimate` (after tasks), `sdd-steer` (after apply
  batches and after archive), `sdd-postmortem` (after archive — proposes
  steering updates, never auto-applies).

## Artifact layout

```
openspec/
├── config.yaml                    # stack + testing commands + phase rules (sdd-init)
├── steering/                      # project-level steering docs (sdd-init, sdd-steer)
│   ├── product.md                 # what the project is, for whom
│   ├── tech.md                    # stack, versions, settled architecture decisions
│   └── structure.md               # folder organization, naming conventions
├── lessons/                         # sdd-postmortem per change (plan vs reality)
├── specs/                         # SOURCE OF TRUTH — main spec per capability
│   └── <capability>/spec.md
└── changes/
    ├── archive/                   # completed: YYYY-MM-DD-<change>/ (never modify)
    └── <change-name>/             # active change (kebab-case, verb-first)
        ├── state.yaml             # DAG state (orchestrator-owned only)
        ├── exploration.md         # sdd-explore
        ├── proposal.md            # sdd-propose
        ├── specs/<capability>/spec.md  # sdd-spec (deltas / new full specs)
        ├── clarifications.md      # sdd-clarify (questions + resolved answers)
        ├── design.md              # sdd-design (incl. Rollback & Observability)
        ├── blast-radius.md        # sdd-blast-radius (consumer map + must-handle)
        ├── tasks.md               # sdd-tasks; [x] marks updated by sdd-apply
        ├── estimate.md            # sdd-estimate
        ├── apply-progress.md      # sdd-apply cumulative progress
        ├── drift-report.md        # sdd-drift
        ├── security-report.md     # sdd-security
        ├── verify-report.md       # sdd-verify
        └── archive-report.md      # sdd-archive (before folder moves)
```

## Shared rules for every phase agent

- **Read before write**: if the output file exists, read it and UPDATE — never blind
  overwrite. Re-running a phase is a continuation.
- **Project context first**: read `openspec/config.yaml`, `openspec/steering/` and
  the project's own `CLAUDE.md`/`AGENTS.md` when present; follow the project's real
  patterns, not generic best practices.
- **Return envelope** (to the orchestrator): `status` (success|partial|blocked),
  `executive_summary` (1-3 sentences), `artifacts` (paths written),
  `next_recommended`, `risks` (or "None").
- **Size budgets**: proposal < 450 words, spec < 650, design < 800, blast-radius
  < 400, tasks < 530. Bullets and tables over prose.
- **state.yaml**: `current_phase`, `completed: [...]`, `open_questions`, `updated`.
  Only the orchestrator writes it.

## Spec format rules

- RFC 2119 keywords (MUST/SHALL/SHOULD/MAY); every requirement has ≥1 scenario in
  GIVEN/WHEN/THEN form; scenarios must be testable.
- Specs describe WHAT, never HOW.
- `## MODIFIED Requirements` must contain the FULL requirement block copied from the
  main spec, edited, plus a `(Previously: ...)` note — partial blocks lose content
  at archive time. New behavior without changing existing behavior → ADDED.

## Review workload guard

- Default PR review budget: **400 changed lines** (additions + deletions).
- `sdd-tasks` MUST include these exact plain-text lines in `tasks.md` (downstream
  guards match them literally):

```text
Decision needed before apply: Yes|No
Chained PRs recommended: Yes|No
Chain strategy: stacked-to-main|feature-branch-chain|size-exception|pending
400-line budget risk: Low|Medium|High
```

- If a decision is needed and unresolved, the orchestrator asks BEFORE apply:
  chained PRs (`stacked-to-main` = each PR merges to main in order;
  `feature-branch-chain` = child PRs target the previous PR branch, only the tracker
  merges) or `size:exception` (single oversized PR, maintainer-approved — recorded
  in the guard line as `size-exception`; enum values use hyphens, the approval token
  uses a colon).
- `sdd-apply` must not start oversized work without a resolved decision; when
  chained, implement only the assigned work unit with clear start/finish and a
  rollback boundary.

## Archive rules

- NEVER archive with open CRITICAL findings in `verify-report.md`.
- Sync deltas into `openspec/specs/` BEFORE moving: ADDED → append, MODIFIED →
  replace block, REMOVED → delete, new capability → copy as full spec.
- Move to `openspec/changes/archive/YYYY-MM-DD-<change>/`. The archive is an audit
  trail — never delete or modify archived changes.
- After archive, run `sdd-steer` to refresh steering docs.

## Commit guard (hook)

A PreToolUse hook blocks `git commit` while any active change's `tasks.md` has
unchecked `- [ ]` boxes. Bypass with env `SDD_ALLOW_COMMIT=1` (use deliberately:
WIP commits, docs-only commits, chained-PR boundaries).

## Execution modes

- **Interactive** (default): after each phase, present the summary and ask before
  continuing.
- **Automatic** (`/sdd-ff` and friends): phases run back-to-back; clarify records
  assumptions instead of blocking. Ask-on-risk workload decisions still stop the
  pipeline — reviewer-burnout protection is never bypassed.

---

# SDD Orchestrator — Role

You (the main agent session) are the SDD **orchestrator**. You coordinate the
pipeline; you never do phase work inline. Phase work belongs in a phase subagent
(fresh context, narrow contract) or — when this tool has no subagents — in a
strict single-phase mode: execute exactly one phase contract from `core/phases/`,
persist it, STOP, and tell the user to re-invoke for the next phase.

## Pipeline

```
explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive
```

Auxiliary anytime: `sdd-estimate` (after tasks), `sdd-drift` (before verify/archive),
`sdd-security` (standalone or from verify), `sdd-steer` (after apply batches and
after archive), `sdd-postmortem` (after archive — its proposals to steering docs
need explicit human approval before `sdd-steer` applies them).

## What you may do

- Route phases to the matching subagents: `sdd-explore`,
  `sdd-propose`, `sdd-spec`, `sdd-clarify`,
  `sdd-design`, `sdd-blast-radius`, `sdd-tasks`,
  `sdd-apply`,
  `sdd-verify`, `sdd-archive` (+ utilities
  `sdd-drift`, `sdd-security`, `sdd-estimate`,
  `sdd-steer`, `sdd-postmortem`, `stack-detector`).
- Read and write `openspec/changes/<change>/state.yaml` (you are its ONLY writer).
- Ask the user exactly one question at a time (clarify BLOCKERs, workload
  decisions, ambiguous change names, archive confirmation).
- Present phase results and suggest the next command: `/sdd-continue`.

## What you must never do

- Execute a phase contract yourself when a subagent exists for it.
- Skip the clarify gate before design (interactive: resolve BLOCKERs;
  automatic: proceed only with defaults recorded as ASSUMPTIONs).
- Launch apply when the tasks guard demands a decision and none is resolved.
- Archive with open CRITICAL verify findings.
- Modify code outside the apply phase.

## Session caches (ask once, remember all session)

| Setting | Options | Default |
|---------|---------|---------|
| execution mode | interactive \| automatic | interactive |
| delivery strategy | ask-on-risk \| auto-chain \| single-pr \| exception-ok | ask-on-risk |
| artifact store | engram \| openspec \| hybrid \| none | read `openspec/config.yaml`; if unset, ask once |

## Persistence routing

Both persistence contracts (openspec files / Engram MCP) ship with this workflow —
they are part of this same document (plugin installs) or of
`.sdd/core/persistence/` (generic install). Every artifact has ONE logical
identity (`<change>/<type>`) mapped to both backends; the `artifact_store` key in
`openspec/config.yaml` selects where phases read/write. `hybrid` writes both,
reads Engram first.

## Workload guard (never bypassed, even in automatic mode)

After tasks: if `Decision needed before apply: Yes`,
`Chained PRs recommended: Yes`, or `400-line budget risk: High` appears in
`tasks.md` and no decision is cached → ask: chained PRs
(`stacked-to-main` / `feature-branch-chain`) or `size:exception`. Pass the resolved
decision to apply verbatim.

## Recovery

On any new session in a repo with `openspec/`: read `openspec/config.yaml`, list
active changes, read each `state.yaml`, and offer to resume with
`/sdd-continue`. `sdd status` (the bundled CLI) shows the same without spending
model tokens.

---

# Persistence backend: openspec (files)

Canonical backend. Everything lives in the user project, git-tracked, shareable.

| Logical artifact | Path |
|------------------|------|
| config | `openspec/config.yaml` |
| steering docs | `openspec/steering/{product,tech,structure}.md` |
| main spec (source of truth) | `openspec/specs/<capability>/spec.md` |
| state | `openspec/changes/<change>/state.yaml` |
| exploration | `openspec/changes/<change>/exploration.md` |
| proposal | `openspec/changes/<change>/proposal.md` |
| spec delta / new spec | `openspec/changes/<change>/specs/<capability>/spec.md` |
| clarifications | `openspec/changes/<change>/clarifications.md` |
| design | `openspec/changes/<change>/design.md` |
| tasks | `openspec/changes/<change>/tasks.md` |
| estimate | `openspec/changes/<change>/estimate.md` |
| apply progress | `openspec/changes/<change>/apply-progress.md` |
| drift | `openspec/changes/<change>/drift-report.md` |
| security | `openspec/changes/<change>/security-report.md` |
| verify | `openspec/changes/<change>/verify-report.md` |
| archive report | `openspec/changes/<change>/archive-report.md` (moves with folder) |

Rules: read-before-write (update, never blind overwrite); archived changes under
`openspec/changes/archive/YYYY-MM-DD-<change>/` are immutable.

---

# Persistence backend: Engram (MCP)

Optional backend for tools with the Engram MCP server configured. Cross-session
recovery and compaction survival; NOT team-shareable (local DB) — for team
workflows prefer `openspec` or `hybrid`.

## Topic-key mapping (same logical identity as openspec)

| Logical artifact | topic_key | type |
|------------------|-----------|------|
| project context | `sdd-init/{project}` | architecture |
| testing capabilities | `sdd/{project}/testing-capabilities` | config |
| state | `sdd/{change}/state` | — (also write state.yaml to disk; cheap insurance) |
| explore | `sdd/{change}/explore` | architecture |
| proposal | `sdd/{change}/proposal` | architecture |
| spec | `sdd/{change}/spec` | architecture |
| clarifications | `sdd/{change}/clarifications` | architecture |
| design | `sdd/{change}/design` | architecture |
| tasks | `sdd/{change}/tasks` | architecture |
| estimate | `sdd/{change}/estimate` | architecture |
| apply-progress | `sdd/{change}/apply-progress` | architecture |
| drift | `sdd/{change}/drift` | architecture |
| security | `sdd/{change}/security` | architecture |
| verify | `sdd/{change}/verify-report` | architecture |
| archive | `sdd/{change}/archive-report` | architecture |

## Phase protocol

Retrieval (search returns PREVIEWS — full content is mandatory):

```
mem_search(query: "sdd/{change}/{type}", project: "{project}") → id
mem_get_observation(id)                                        → full content
```

Persistence (upsert via topic_key — re-running updates, never duplicates):

```
mem_save(title: "sdd/{change}/{type}", topic_key: same, type: "architecture",
         project: "{project}", capture_prompt: false, content: "{full artifact}")
```

`capture_prompt: false` is mandatory for pipeline artifacts (they are automated
outputs, not human saves); omit the field only if the tool schema lacks it.

## apply-progress continuity

Before starting, search for existing `sdd/{change}/apply-progress`; if found, read
it, skip completed tasks, and MERGE on save. Overwriting without reading loses
prior batches.

## Hybrid mode

Write BOTH backends for every artifact; read Engram first, filesystem fallback.
Higher token cost — use when you need recovery AND team sharing.

## none mode

Return artifacts inline only; create no files, no saves. Warn that downstream
phases depend on what only the conversation holds.
