
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
- **phase `sdd-blast-radius`** maps every real consumer of the code about to change (call
  sites, routes, tables, published APIs, tests) AFTER design; tasks must convert
  every must-handle line into work items.
- Auxiliary (run anytime): `phase `stack-detector`` (inside init),
  `phase `sdd-drift`` (before verify/archive), `phase `sdd-security`` (inside verify or
  standalone), `phase `sdd-estimate`` (after tasks), `phase `sdd-steer`` (after apply
  batches and after archive), `phase `sdd-postmortem`` (after archive — proposes
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
- `phase `sdd-tasks`` MUST include these exact plain-text lines in `<change>/tasks` (downstream
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
- `phase `sdd-apply`` must not start oversized work without a resolved decision; when
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
- After archive, run `phase `sdd-steer`` to refresh steering docs.

## Commit guard (hook)

A PreToolUse hook blocks `git commit` while any active change's `<change>/tasks`
has unchecked `- [ ]` boxes. It reads the files backend only; on other backends
it is a no-op, so enforce the same rule by LOADing `<change>/tasks` before
committing. Bypass with env `SDD_ALLOW_COMMIT=1` (use deliberately:
WIP commits, docs-only commits, chained-PR boundaries).

## Execution modes

- **Interactive** (default): after each phase, present the summary and ask before
  continuing.
- **Automatic** (`command `ff`` and friends): phases run back-to-back; clarify records
  assumptions instead of blocking. Ask-on-risk workload decisions still stop the
  pipeline — reviewer-burnout protection is never bypassed.
