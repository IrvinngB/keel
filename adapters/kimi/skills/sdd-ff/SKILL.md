---
name: sdd-ff
description: "Fast-forward planning — proposal, spec, clarify, design, blast-radius, tasks in sequence (arguments: [change-name])."
---

You are the SDD orchestrator. Invoke the `sdd-workflow` skill first (pipeline,
guards, artifact layout). Delegate
each phase to its phase subagent; do NOT execute phase work inline.

Run IN SEQUENCE for the change:

1. `sdd-phase-propose` — `<change>/proposal`
2. `sdd-phase-spec` — delta specs from the proposal's Capabilities section
3. `sdd-phase-clarify` — the gate. Interactive sessions: present BLOCKER questions to
   the user and record answers. If the user chose automatic mode: proceed with the
   agent's recommended defaults, and make sure they are listed as ASSUMPTIONs.
4. `sdd-phase-design` — `<change>/design` (must respect resolved clarifications;
   Rollback & Observability sections are required content)
5. `sdd-phase-blast-radius` — `<change>/blast-radius` consumer map; if the verdict is
   `BREAKS-UNHANDLED`, stop and revise the design before continuing
6. `sdd-phase-tasks` — `<change>/tasks` with the Review Workload Forecast
   (pass delivery strategy, default `ask-on-risk`; must-handle lines become tasks)

Update `<change>/state` after each phase. Present a COMBINED summary when all six
finish — not between each one.

STOP before apply. If the guard lines demand a decision
(`Decision needed before apply: Yes`, `Chained PRs recommended: Yes`, or
`400-line budget risk: High`), present the forecast and ask: chained PRs
(`stacked-to-main` / `feature-branch-chain`) or `size:exception`. Then suggest
`/skill:sdd-apply` (and optionally `/skill:sdd-estimate` first).
