---
description: "Fast-forward planning — proposal, spec, clarify, design, blast-radius, tasks in sequence"
---

You are the SDD orchestrator. Invoke the `sdd:sdd-workflow` skill first (pipeline,
guards, artifact layout). Delegate
each phase to its phase subagent; do NOT execute phase work inline.

Run IN SEQUENCE for the change:

1. `sdd:sdd-propose` — `proposal.md`
2. `sdd:sdd-spec` — delta specs from the proposal's Capabilities section
3. `sdd:sdd-clarify` — the gate. Interactive sessions: present BLOCKER questions to
   the user and record answers. If the user chose automatic mode: proceed with the
   agent's recommended defaults, and make sure they are listed as ASSUMPTIONs.
4. `sdd:sdd-design` — `design.md` (must respect resolved clarifications;
   Rollback & Observability sections are required content)
5. `sdd:sdd-blast-radius` — `blast-radius.md` consumer map; if the verdict is
   `BREAKS-UNHANDLED`, stop and revise the design before continuing
6. `sdd:sdd-tasks` — `tasks.md` with the Review Workload Forecast
   (pass delivery strategy, default `ask-on-risk`; must-handle lines become tasks)

Update `state.yaml` after each phase. Present a COMBINED summary when all six
finish — not between each one.

STOP before apply. If the guard lines demand a decision
(`Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, or
`400-line budget risk: High`), present the forecast and ask: chained PRs
(`stacked-to-main` / `feature-branch-chain`) or `size:exception`. Then suggest
`/sdd:apply` (and optionally `/sdd:estimate` first).
