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
- **sdd:sdd-blast-radius** maps every real consumer of the code about to change (call
  sites, routes, tables, published APIs, tests) AFTER design; tasks must convert
  every must-handle line into work items.
- Auxiliary (run anytime): `sdd:stack-detector` (inside init),
  `sdd:sdd-drift` (before verify/archive), `sdd:sdd-security` (inside verify or
  standalone), `sdd:sdd-estimate` (after tasks), `sdd:sdd-steer` (after apply
  batches and after archive), `sdd:sdd-postmortem` (after archive — proposes
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
- `sdd:sdd-tasks` MUST include these exact plain-text lines in `tasks.md` (downstream
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
- `sdd:sdd-apply` must not start oversized work without a resolved decision; when
  chained, implement only the assigned work unit with clear start/finish and a
  rollback boundary.

## Archive rules

- NEVER archive with open CRITICAL findings in `verify-report.md`.
- Sync deltas into `openspec/specs/` BEFORE moving: ADDED → append, MODIFIED →
  replace block, REMOVED → delete, new capability → copy as full spec.
- Move to `openspec/changes/archive/YYYY-MM-DD-<change>/`. The archive is an audit
  trail — never delete or modify archived changes.
- After archive, run `sdd:sdd-steer` to refresh steering docs.

## Commit guard (hook)

A PreToolUse hook blocks `git commit` while any active change's `tasks.md` has
unchecked `- [ ]` boxes. Bypass with env `SDD_ALLOW_COMMIT=1` (use deliberately:
WIP commits, docs-only commits, chained-PR boundaries).

## Execution modes

- **Interactive** (default): after each phase, present the summary and ask before
  continuing.
- **Automatic** (`/sdd:ff` and friends): phases run back-to-back; clarify records
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

Auxiliary anytime: `sdd:sdd-estimate` (after tasks), `sdd:sdd-drift` (before verify/archive),
`sdd:sdd-security` (standalone or from verify), `sdd:sdd-steer` (after apply batches and
after archive), `sdd:sdd-postmortem` (after archive — its proposals to steering docs
need explicit human approval before `sdd:sdd-steer` applies them).

## What you may do

- Route phases to the matching subagents: `sdd:sdd-explore`,
  `sdd:sdd-propose`, `sdd:sdd-spec`, `sdd:sdd-clarify`,
  `sdd:sdd-design`, `sdd:sdd-blast-radius`, `sdd:sdd-tasks`,
  `sdd:sdd-apply`,
  `sdd:sdd-verify`, `sdd:sdd-archive` (+ utilities
  `sdd:sdd-drift`, `sdd:sdd-security`, `sdd:sdd-estimate`,
  `sdd:sdd-steer`, `sdd:sdd-postmortem`, `sdd:stack-detector`).
- Read and write `openspec/changes/<change>/state.yaml` (you are its ONLY writer).
- Ask the user exactly one question at a time (clarify BLOCKERs, workload
  decisions, ambiguous change names, archive confirmation).
- Present phase results and suggest the next command: `/sdd:continue`.

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
| artifact store | any registered backend or `+` combination; `none` | read `openspec/config.yaml`; if unset, ask once |

## Persistence routing

Phases speak only the abstract operations SAVE / LOAD / LIST defined in the
persistence interface (bundled with this workflow — same document in plugin
installs, `.sdd/core/persistence/` in generic installs). `openspec/config.yaml`
→ `artifact_store` selects the backend doc (files, Engram, SQLite, any mapped
MCP server, or a `+` combination: write ALL, read in listed order). Adding a
backend never changes a phase contract.

## Workload guard (never bypassed, even in automatic mode)

After tasks: if `Decision needed before apply: Yes`,
`Chained PRs recommended: Yes`, or `400-line budget risk: High` appears in
`tasks.md` and no decision is cached → ask: chained PRs
(`stacked-to-main` / `feature-branch-chain`) or `size:exception`. Pass the resolved
decision to apply verbatim.

## Recovery

On any new session in a repo with `openspec/`: read `openspec/config.yaml`, list
active changes, read each `state.yaml`, and offer to resume with
`/sdd:continue`. `sdd status` (the bundled CLI) shows the same without spending
model tokens.

---

# Persistence backend: Engram (MCP)

Local memory DB via the Engram MCP server. Cross-session recovery and compaction
survival; NOT team-shareable (local DB) — for team workflows combine
(`openspec+engram`) or prefer the files backend.

## Operations

```
SAVE(key, content): mem_save(title: key, topic_key: key, type: "architecture",
                  project: "{project}", capture_prompt: false, content)
                  — topic_key makes SAVE an upsert
LOAD(key):          mem_search(query: key, project: "{project}") → id,
                    THEN mem_get_observation(id) → FULL content.
                    ⚠ search results are 300-char PREVIEWS — using them as
                    source material violates the LOAD contract. Always follow
                    with mem_get_observation.
LIST(prefix):       mem_search(query: prefix, project: "{project}", limit: 20)
```

`capture_prompt: false` is mandatory for pipeline artifacts (automated outputs,
not human saves); omit the field only if the tool schema lacks it.

## Key mapping

| Logical key | topic_key |
|-------------|-----------|
| `init/<project>` | `sdd-init/<project>` |
| `caps/<project>` | `sdd/<project>/testing-capabilities` |
| `<change>/<type>` | `sdd/<change>/<type>` |
| `lessons/<change>` | `sdd/<change>/postmortem` |

`type` argument of mem_save: `architecture` for pipeline artifacts, `config`
for caps.

## Capability notes

| | |
|---|---|
| Team-shareable | no — local DB |
| Survives new session | yes |
| Version history | no — upsert overwrites (git-combine via `openspec+engram` if needed) |
| Known limits | preview-only search (see LOAD), conflict-review prompts on save |

---

# Persistence — Backend Interface

Every artifact in the pipeline has ONE logical identity, independent of storage:

```
<change>/<type>          e.g. add-rate-limiting/proposal
init/<project>           project context        → project-context
caps/<project>           testing capabilities   → testing-capabilities
lessons/<change>         postmortem output      → lessons
```

A **backend** is any store that implements three operations. Phases speak ONLY
these operations — never a vendor tool name.

| Operation | Contract |
|-----------|----------|
| `SAVE(key, content)` | create or REPLACE atomically by key (upsert). No append-mode backends qualify without a merge rule. |
| `LOAD(key)` | return the FULL content. A preview/truncated result is a contract violation — phases must re-fetch until they have full text. |
| `LIST(prefix)` | enumerate keys under a prefix (used for recovery and `status`). |

Plus two shared rules every backend inherits:

- **Read before write**: LOAD first when the key may exist; update, don't clobber.
- **apply-progress merges**: SAVE only after folding previous completions in.

## Selection

`openspec/config.yaml`:

```yaml
artifact_store: openspec          # single backend
artifact_store: openspec+engram   # combination: write ALL, read in listed order
artifact_store: none              # conversation-only, warn about loss
```

Any backend name (or `+` combination) that has a doc in this folder is valid.
`none` always valid.

## Registered backends

| Key | Doc | Shareable | Cross-session | Needs |
|-----|-----|-----------|---------------|-------|
| `openspec` | openspec.md | ✅ (git) | via repo | — (always available) |
| `engram` | engram.md | ❌ local DB | ✅ | Engram MCP configured |
| `sqlite` | sqlite.md | ❌ local file | ✅ | `sqlite3` CLI |
| `mcp-generic` | mcp-generic.md | ❌ | depends on server | any MCP store with 3 mappable tools |

## Adding your own backend

1. Copy `template.md` → `<name>.md`, fill the three operations + tooling/paths.
2. Add a row to the table above.
3. Done — no phase, command or orchestrator file changes. `config.yaml` picks it.

Test it: run `LOAD` on a key you `SAVE`d in the same session and verify the
content is byte-identical and untruncated.

---

# Persistence backend: generic MCP memory server

Any MCP server that exposes store / fetch / enumerate tools (memory, knowledge,
vector-DB bridges…) can back the pipeline. This doc maps the three abstract
operations onto YOUR server's tools — fill the blanks once per project.

## Tool mapping (fill in)

```
server:   <mcp server name as configured>
SAVE:     <tool + args template>   — MUST upsert by key (else wrap: delete-then-create)
LOAD:     <tool + args template>   — MUST return full content (if the server returns
                                     snippets, require its get-by-id follow-up call)
LIST:     <tool + args template>   — enumerate by key prefix
```

## Rules

- Verify the mapping before first real use: SAVE a probe key, LIST it, LOAD it,
  diff content. A server that cannot return FULL content on LOAD fails the
  interface contract — do not use it (see interface.md).
- Upsert: if the server only appends, SAVE = delete matching key + create.
- Namespacing: prefix every key with `sdd/` to coexist with other users of the
  server.

## Capability notes

| | |
|---|---|
| Team-shareable | depends on server (remote/HTTP: usually yes) |
| Survives new session | yes (that's the point) |
| Version history | server-dependent — record it here if supported |
| Known limits | <auth, truncation, rate limits> |

---

# Persistence backend: openspec (files)

Canonical backend, always available. Everything lives in the user project,
git-tracked, team-shareable, versioned by git itself.

## Operations

```
SAVE(key, content): write to the mapped path (mkdir -p parents); read-before-write applies
LOAD(key):          read the mapped file — full content by definition
LIST(prefix):       ls openspec/changes/<change>/ (+ find for specs)
```

## Mapping

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

# Persistence backend: SQLite (local file)

Single local database, zero network, no MCP required. Good middle ground:
cross-session recovery like Engram, but portable with the machine and greppable.

## Operations

```
SAVE(key, content): INSERT OR REPLACE INTO sdd_artifacts(key, content, updated_at)
                    VALUES ('<key>', '<content>', datetime('now'));
LOAD(key):          SELECT content FROM sdd_artifacts WHERE key='<key>';
LIST(prefix):       SELECT key, updated_at FROM sdd_artifacts
                    WHERE key LIKE '<prefix>%';
```

Invoke via `sqlite3 openspec/.sdd-store.db "<sql>"`. Content with quotes: pass
through a temp file (`sqlite3 db ".read tmp.sql"`) or use parameter support if
available. Key slashes are kept verbatim (keys are plain TEXT).

## Setup (one-time, on first SAVE)

```sql
CREATE TABLE IF NOT EXISTS sdd_artifacts (
  key TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at TEXT NOT NULL
);
```

## Capability notes

| | |
|---|---|
| Team-shareable | no — but the .db file can be committed if the team accepts binary churn |
| Survives new session | yes |
| Version history | no (add an sdd_history table + trigger if you want it) |
| Known limits | quoting via CLI; no full-text search without FTS5 module |

---

# Persistence backend: <name>   ← copy this file, fill <>

<!-- One paragraph: what this store is and when to prefer it. -->

## Operations

```
SAVE(key, content):
  <exact command/tool call — upsert semantics>
LOAD(key):
  <exact command/tool call — must return FULL content>
LIST(prefix):
  <exact command/tool call>
```

Key sanitization: `<change>/<type>` maps to
<how slashes/namespacing are handled in this store>.

## Setup (one-time)

<schema creation / server config / folder init — or "none">

## Capability notes

| | |
|---|---|
| Team-shareable | yes/no — why |
| Survives new session | yes/no |
| Version history | yes/no |
| Known limits | <truncation, auth, size> |

