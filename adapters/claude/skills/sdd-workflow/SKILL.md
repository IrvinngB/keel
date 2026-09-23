---
name: sdd-workflow
description: "Spec-Driven Development pipeline contract for this project. Read before running or coordinating any SDD command or phase subagent — defines the artifact layout, phase graph, workload guards, and steering docs."
---
# SDD Workflow Contract

The main agent session is the SDD **orchestrator**: it routes phases to
its phase subagents and never executes phase work inline. Artifacts are addressed by
logical keys (see the persistence interface) and stored by the backend selected in
`config` — by default plain git-tracked files, no external services.

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

## Artifact keys

Every artifact is addressed by a logical key; the persistence backend decides where
it lives (the default files backend maps keys to an `openspec/` tree — see its doc).

| Key | Written by |
|-----|-----------|
| `config` | init / stack-detector — stack, testing commands, phase rules, `artifact_store` |
| `steering/<product\|tech\|structure>` | init, sdd-steer — project-level steering docs |
| `specs/<capability>` | sdd-archive — SOURCE OF TRUTH, one main spec per capability |
| `lessons/<change>` | sdd-postmortem — plan vs reality |
| `<change>/state` | orchestrator ONLY — DAG state |
| `<change>/explore` | sdd-explore |
| `<change>/proposal` | sdd-propose |
| `<change>/spec/<capability>` | sdd-spec — deltas / new full specs |
| `<change>/clarify` | sdd-clarify — questions + resolved answers |
| `<change>/design` | sdd-design (incl. Rollback & Observability) |
| `<change>/blast-radius` | sdd-blast-radius — consumer map + must-handle |
| `<change>/tasks` | sdd-tasks; `[x]` marks updated by sdd-apply |
| `<change>/estimate` | sdd-estimate |
| `<change>/apply-progress` | sdd-apply — cumulative progress |
| `<change>/drift` | sdd-drift |
| `<change>/security` | sdd-security |
| `<change>/verify-report` | sdd-verify |
| `<change>/archive-report` | sdd-archive |

Change names are kebab-case, verb-first. Reserved names: `config`, `steering`,
`specs`, `lessons`, `init`, `caps`.

## Shared rules for every phase agent

- **Read before write**: if the output key exists, LOAD it and UPDATE — never blind
  overwrite. Re-running a phase is a continuation.
- **Project context first**: LOAD `config` and the `steering/*` keys, plus the
  project's own `CLAUDE.md`/`AGENTS.md` when present; follow the project's real
  patterns, not generic best practices.
- **Return envelope** (to the orchestrator): `status` (success|partial|blocked),
  `executive_summary` (1-3 sentences), `artifacts` (keys written),
  `next_recommended`, `risks` (or "None").
- **Size budgets**: proposal < 450 words, spec < 650, design < 800, blast-radius
  < 400, tasks < 530. Bullets and tables over prose.
- **`<change>/state`**: `current_phase`, `completed: [...]`, `open_questions`,
  `updated`, `status: active|archived`, `archived_on`. Only the orchestrator writes it.

## Spec format rules

- RFC 2119 keywords (MUST/SHALL/SHOULD/MAY); every requirement has ≥1 scenario in
  GIVEN/WHEN/THEN form; scenarios must be testable.
- Specs describe WHAT, never HOW.
- `## MODIFIED Requirements` must contain the FULL requirement block copied from the
  main spec, edited, plus a `(Previously: ...)` note — partial blocks lose content
  at archive time. New behavior without changing existing behavior → ADDED.

## Review workload guard

- Default PR review budget: **400 changed lines** (additions + deletions).
- `sdd:sdd-tasks` MUST include these exact plain-text lines in `<change>/tasks` (downstream
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

- NEVER archive with open CRITICAL findings in `<change>/verify-report`.
- Sync deltas into `specs/<capability>` BEFORE marking the change archived: ADDED →
  append, MODIFIED → replace block, REMOVED → delete, new capability → copy as full
  spec.
- Archiving = SAVE `<change>/archive-report`, then the orchestrator SAVEs
  `<change>/state` with `status: archived`; a backend with directories may relocate
  the change (files backend doc). The archive is an audit trail — never delete or
  modify archived changes.
- After archive, run `sdd:sdd-steer` to refresh steering docs.

## Commit guard (hook)

A PreToolUse hook blocks `git commit` while any active change's `<change>/tasks`
has unchecked `- [ ]` boxes. It reads the files backend only; on other backends
it is a no-op, so enforce the same rule by LOADing `<change>/tasks` before
committing. Bypass with env `SDD_ALLOW_COMMIT=1` (use deliberately:
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
- LOAD and SAVE `<change>/state` (you are its ONLY writer; on archive you SAVE it
  with `status: archived` and `archived_on`).
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
| artifact store | any registered backend or `+` combination; `none` | `artifact_store` in `config`; if unset, ask once |

## Persistence routing

Phases speak only the abstract operations SAVE / LOAD / LIST defined in the
persistence interface (bundled with this workflow — same document in plugin
installs, `.sdd/core/persistence/` in generic installs), addressing artifacts by
logical key only. `config` → `artifact_store` selects the backend doc (files, SQLite, any mapped
MCP memory server, or a `+` combination: write ALL, read in listed order). Adding a
backend never changes a phase contract.

## Workload guard (never bypassed, even in automatic mode)

After tasks: if `Decision needed before apply: Yes`,
`Chained PRs recommended: Yes`, or `400-line budget risk: High` appears in
`<change>/tasks` and no decision is cached → ask: chained PRs
(`stacked-to-main` / `feature-branch-chain`) or `size:exception`. Pass the resolved
decision to apply verbatim.

## Recovery

On any new session: LOAD `config` (bootstrap location per the persistence
interface), LIST active changes, LOAD each `<change>/state`, and offer to resume with
`/sdd:continue`. `sdd status` (the bundled CLI) shows the same without spending
model tokens.

---

# Persistence — Backend Interface

Every artifact in the pipeline has ONE logical identity, independent of storage.
Phases, commands and the orchestrator name artifacts ONLY by these keys and never
by a path, table or vendor tool.

## Key scheme

```
config                          project configuration (stack, testing commands, artifact_store)
steering/<product|tech|structure>   project steering docs
specs/<capability>              main spec — the source of truth
<change>/state                  DAG state (orchestrator-owned; only the orchestrator SAVEs it)
<change>/<type>                 change artifact; type is one of:
                                explore · proposal · clarify · design · blast-radius ·
                                tasks · estimate · apply-progress · drift · security ·
                                verify-report · archive-report
<change>/spec/<capability>      spec delta or new full spec (one key per capability)
lessons/<change>                postmortem output
init/<project>                  project context (legacy key, kept)
caps/<project>                  testing capabilities (legacy key, kept)
```

Reserved first segments — never valid as a change name: `config`, `steering`,
`specs`, `lessons`, `init`, `caps`.

`<change>/state` fields: `current_phase`, `completed: [...]`, `open_questions`,
`updated`, `status: active|archived`, `archived_on: YYYY-MM-DD` (set when archived).

A **backend** is any store that implements three operations. Phases speak ONLY
these operations — never a vendor tool name.

| Operation | Contract |
|-----------|----------|
| `SAVE(key, content)` | create or REPLACE atomically by key (upsert). No append-mode backends qualify without a merge rule. |
| `LOAD(key)` | return the FULL content. A preview/truncated result is a contract violation — phases must re-fetch until they have full text. A missing key is reported as missing, never as empty content. |
| `LIST(prefix)` | enumerate keys under a prefix (used for recovery and `status`). SHOULD also return each key's last-updated time; a backend that cannot says so in its doc. |

Plus shared rules every backend inherits:

- **Read before write**: LOAD first when the key may exist; update, don't clobber.
- **apply-progress merges**: SAVE only after folding previous completions in.
- **Active changes**: `LIST` the `*/state` keys and keep those whose `status` is not
  `archived`.
- **Archived is immutable**: once `<change>/state` has `status: archived`, no phase
  SAVEs any `<change>/...` key. Every archived key stays readable by LOAD/LIST
  (postmortem depends on it).

## Bootstrap

`config` is the one key that names the backend, so it cannot be located through the
backend. The orchestrator always resolves it at the files-backend location (see
`openspec.md`); after that every phase LOADs `config` like any other key. A `+`
combination may mirror `config` to the other backends, but the file copy stays
authoritative.

## Selection

`artifact_store` inside `config`:

```yaml
artifact_store: openspec          # single backend
artifact_store: openspec+sqlite   # combination: write ALL, read in listed order
artifact_store: none              # conversation-only, warn about loss
```

Any backend name (or `+` combination) that has a doc in this folder is valid.
`none` always valid.

## Archiving

Archive is a state transition, not a file move: the archive phase LOADs the
`<change>/spec/*` deltas, merges each into `specs/<capability>` (LOAD + SAVE), and
SAVEs `<change>/archive-report`; the orchestrator then SAVEs `<change>/state` with
`status: archived` and `archived_on`.

A backend with native directories MAY relocate the change as a finalization step
(the files backend does — see `openspec.md`) as long as every key keeps resolving.
A backend without directories (SQLite, memory servers, MCP stores) needs nothing more: the
`status: archived` flag IS the archive, and its keys are simply never written again.

## Registered backends

| Key | Doc | Shareable | Cross-session | Needs |
|-----|-----|-----------|---------------|-------|
| `openspec` | openspec.md | ✅ (git) | via repo | — (always available) |
| `sqlite` | sqlite.md | ❌ local file | ✅ | `sqlite3` CLI |
| `mcp-generic` | mcp-generic.md | ❌ | depends on server | any MCP store with 3 mappable tools |

## Adding your own backend

Bring your own store: map any MCP memory server with `mcp-generic.md`, or copy
`template.md` for anything else.

1. Copy `template.md` → `<name>.md`, fill the three operations + tooling/paths.
2. Add a row to the table above.
3. Done — no phase, command or orchestrator file changes. `artifact_store` in `config` picks it.

Test it: run `LOAD` on a key you `SAVE`d in the same session and verify the
content is byte-identical and untruncated. Then SAVE and LOAD `config`, `steering/tech`,
`specs/<capability>`, `<change>/state` and `<change>/spec/<capability>` — the keys
with structure beyond `<change>/<type>`.

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
  server. Every logical key in interface.md (`config`, `steering/<name>`,
  `specs/<capability>`, `<change>/state`, `<change>/spec/<capability>`, …) maps
  verbatim under that prefix.
- `config` is a mirror only; the file copy stays authoritative (interface.md
  Bootstrap). Archiving needs no extra step — `status: archived` in
  `<change>/state` is the archive.
- LOAD must match the EXACT key. Free-text or fuzzy search can return a
  neighbouring key (`<change>/design` hitting `other-<change>/design`): after
  resolving, compare the stored key to the requested one and reject mismatches.
- LIST must page until exhausted (or use a limit larger than the store). A
  silent cap truncates active-change and `<change>/spec/` listings.
- Active changes = `sdd/*/state` records whose content is not `status: archived`.
  Reserve the names `config`, `specs`, `steering` and `lessons`, since they
  share the namespace with change names.

## Key mapping (default, under the `sdd/` prefix)

| Logical key | Stored key |
|-------------|------------|
| `<change>/<type>` | `sdd/<change>/<type>` |
| `<change>/state` | `sdd/<change>/state` |
| `<change>/spec/<capability>` | `sdd/<change>/spec/<capability>` |
| `specs/<capability>` | `sdd/specs/<capability>` |
| `steering/<name>` | `sdd/steering/<name>` |
| `config` | `sdd/config` (mirror only) |
| `lessons/<change>` | `sdd/lessons/<change>` |

`lessons/<change>` must never live under `sdd/<change>/`: postmortem runs after
archive, and no phase may SAVE inside an archived change namespace.

## Worked example (hypothetical server exposing `put`, `get`, `find`)

```
server:   notes
SAVE:     put(key: "sdd/<key>", body: content)          — put overwrites: upsert OK
LOAD:     r = find(prefix: "sdd/<key>", limit: 1) → id; get(id) → body
          reject unless r.key == "sdd/<key>"; find returns 200-char snippets, so get(id) is required
LIST:     find(prefix: "sdd/<prefix>", page: 1..n) until empty
```

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
git-tracked, team-shareable, versioned by git itself. This is the ONLY document that
maps logical keys to `openspec/` paths.

## Operations

```
SAVE(key, content): write to the mapped path (mkdir -p parents); read-before-write applies
LOAD(key):          read the mapped file — full content by definition
LIST(prefix):       list the mapped directory for the prefix (find for spec keys);
                    updated time = `git log -1 --format=%ci -- <path>`, else file mtime
```

## Mapping

| Logical key | Path |
|-------------|------|
| `config` | `openspec/config.yaml` (bootstrap: always this location) |
| `steering/<name>` | `openspec/steering/<name>.md` |
| `specs/<capability>` | `openspec/specs/<capability>/spec.md` |
| `lessons/<change>` | `openspec/lessons/<change>.md` |
| `init/<project>`, `caps/<project>` | not stored separately — covered by `config` (stack, testing) |
| `<change>/state` | `openspec/changes/<change>/state.yaml` |
| `<change>/explore` | `openspec/changes/<change>/exploration.md` |
| `<change>/proposal` | `openspec/changes/<change>/proposal.md` |
| `<change>/spec/<capability>` | `openspec/changes/<change>/specs/<capability>/spec.md` |
| `<change>/clarify` | `openspec/changes/<change>/clarifications.md` |
| `<change>/design` | `openspec/changes/<change>/design.md` |
| `<change>/blast-radius` | `openspec/changes/<change>/blast-radius.md` |
| `<change>/tasks` | `openspec/changes/<change>/tasks.md` |
| `<change>/estimate` | `openspec/changes/<change>/estimate.md` |
| `<change>/apply-progress` | `openspec/changes/<change>/apply-progress.md` |
| `<change>/drift` | `openspec/changes/<change>/drift-report.md` |
| `<change>/security` | `openspec/changes/<change>/security-report.md` (standalone, no change: report inline) |
| `<change>/verify-report` | `openspec/changes/<change>/verify-report.md` |
| `<change>/archive-report` | `openspec/changes/<change>/archive-report.md` |

## Archive finalization (files backend only)

After the orchestrator SAVEs `<change>/state` with `status: archived`, move the
folder: `openspec/changes/<change>/` → `openspec/changes/archive/<archived_on>-<change>/`
(create `archive/` if missing; `mv`).

Resolution rule: when `openspec/changes/<change>/` is absent, LOAD and LIST resolve
`<change>/...` inside the archived folder whose name is EXACTLY
`<YYYY-MM-DD>-<change>` (fixed 10-character date prefix, then `-`, then the full
change name — never a loose `*-<change>` glob, which would also match
`2026-09-23-bar-<change>`), read-only. If several dates match, the most recent
wins. Active-change listing is `openspec/changes/*/` excluding `archive/`.

Name reuse: a change name that exists as an active folder or as an archived folder
is taken. `new` must reject it and ask for a different name. `archive` is reserved
(it is the archive directory).

Rules: read-before-write (update, never blind overwrite); archived changes are
immutable — SAVE into an archived folder is refused.

---

# Persistence backend: SQLite (local file)

Single local database, zero network, no MCP required. Good middle ground:
cross-session recovery like a memory server, but portable with the machine and greppable.

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
available. Key slashes are kept verbatim (keys are plain TEXT): every logical key
in interface.md — `config`, `steering/<name>`, `specs/<capability>`,
`<change>/state`, `<change>/spec/<capability>` — is stored as-is, no mapping.
`config` is a mirror only; the file copy stays authoritative (interface.md
Bootstrap). Active changes: `SELECT key FROM sdd_artifacts WHERE key LIKE '%/state'`
minus rows whose content has `status: archived`. Archiving needs no extra step —
the `status: archived` flag is the archive.

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

Key sanitization: every logical key in interface.md (including `config`,
`steering/<name>`, `specs/<capability>`, `<change>/state`,
`<change>/spec/<capability>`) maps to
<how slashes/namespacing are handled in this store>.

Archiving: `status: archived` in `<change>/state` is the archive; state here only
what extra relocation this store performs, if any ("none" is fine).

## Setup (one-time)

<schema creation / server config / folder init — or "none">

## Capability notes

| | |
|---|---|
| Team-shareable | yes/no — why |
| Survives new session | yes/no |
| Version history | yes/no |
| Known limits | <truncation, auth, size> |

