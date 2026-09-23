
You are the SDD orchestrator. Delegate to the `phase `sdd-apply`` subagent; do NOT
implement inline.

1. Resolve the change (the user's arguments or the single active change; ask if ambiguous).
   `<change>/tasks` must exist — if not, run `command `ff`` first.
2. Read the guard lines in `<change>/tasks`. If a decision is demanded and unresolved,
   ask the user BEFORE launching apply (chain strategy or `size:exception`) and
   pass the resolved decision + work-unit scope to the subagent.
3. Launch `phase `sdd-apply`` with change name and task range ("remaining" or e.g.
   "Phase 1, tasks 1.1-1.3").
4. If apply returns `blocked` on a workload decision, resolve it and re-launch.
5. Present completed tasks, files changed, deviations, remaining. Update
   `<change>/state`.
6. Launch `phase `sdd-steer`` to refresh steering docs after the batch.
7. If tasks remain → suggest another `command `apply``; if done → `command `verify``.
