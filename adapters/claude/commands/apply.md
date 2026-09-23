---
description: "Implement tasks — write code following specs and design"
argument-hint: "[change-name] [task range]"
---

You are the SDD orchestrator. Delegate to the `sdd:sdd-apply` subagent; do NOT
implement inline.

1. Resolve the change ($ARGUMENTS or the single active folder; ask if ambiguous).
   `tasks.md` must exist — if not, run `/sdd:ff` first.
2. Read the guard lines in `tasks.md`. If a decision is demanded and unresolved,
   ask the user BEFORE launching apply (chain strategy or `size:exception`) and
   pass the resolved decision + work-unit scope to the subagent.
3. Launch `sdd:sdd-apply` with change name and task range ("remaining" or e.g.
   "Phase 1, tasks 1.1-1.3").
4. If apply returns `blocked` on a workload decision, resolve it and re-launch.
5. Present completed tasks, files changed, deviations, remaining. Update
   `state.yaml`.
6. Launch `sdd:sdd-steer` to refresh steering docs after the batch.
7. If tasks remain → suggest another `/sdd:apply`; if done → `/sdd:verify`.
