
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
- **phase `sdd-blast-radius`** maps every real consumer of the code about to change (call
  sites, routes, tables, published APIs, tests) AFTER design; tasks must convert
  every must-handle line into work items.
- Auxiliary (run anytime): `phase `stack-detector`` (inside init),
  `phase `sdd-drift`` (before verify/archive), `phase `sdd-security`` (inside verify or
  standalone), `phase `sdd-estimate`` (after tasks), `phase `sdd-steer`` (after apply
  batches and after archive), `phase `sdd-postmortem`` (after archive — proposes
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
- `phase `sdd-tasks`` MUST include these exact plain-text lines in `tasks.md` (downstream
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

- NEVER archive with open CRITICAL findings in `verify-report.md`.
- Sync deltas into `openspec/specs/` BEFORE moving: ADDED → append, MODIFIED →
  replace block, REMOVED → delete, new capability → copy as full spec.
- Move to `openspec/changes/archive/YYYY-MM-DD-<change>/`. The archive is an audit
  trail — never delete or modify archived changes.
- After archive, run `phase `sdd-steer`` to refresh steering docs.

## Commit guard (hook)

A PreToolUse hook blocks `git commit` while any active change's `tasks.md` has
unchecked `- [ ]` boxes. Bypass with env `SDD_ALLOW_COMMIT=1` (use deliberately:
WIP commits, docs-only commits, chained-PR boundaries).

## Execution modes

- **Interactive** (default): after each phase, present the summary and ask before
  continuing.
- **Automatic** (`command `ff`` and friends): phases run back-to-back; clarify records
  assumptions instead of blocking. Ask-on-risk workload decisions still stop the
  pipeline — reviewer-burnout protection is never bypassed.
