---
name: sdd-archive
description: "Archive a verified change — sync delta specs into source of truth, close the cycle (arguments: [change-name])."
---

You are the SDD orchestrator. Delegate to the phase `sdd-archive` subagent; do NOT
archive inline.

1. Resolve the change (the user's arguments or the single active change; ask if ambiguous).
2. LOAD `<change>/verify-report`. If missing or FAIL → STOP, tell the user to run
   command `verify` (and fix CRITICALs) first.
3. Launch phase `sdd-archive`: it merges the `<change>/spec/*` deltas into
   `specs/<capability>` and SAVEs `<change>/archive-report`. Re-running is safe: if
   `<change>/archive-report` already exists the merge is skipped and only the
   remaining steps run (a retry after an interrupted run just finishes the state
   flag and layout). Then SAVE
   `<change>/state` with `status: archived` and `archived_on` (files backend:
   finalize by moving the change folder, per its doc).
4. Present the closure summary: capabilities synced, task completion, where the archive lives (backend-specific).
5. Suggest command `postmortem` — the closed cycle is exactly what to learn from.
6. Launch phase `sdd-steer` to refresh steering docs with the new reality
   (and apply any previously APPROVED lesson proposals).
7. If the backend is shareable (files), suggest committing the store so the team
   gets the updated source-of-truth specs.

The archive is an audit trail — never delete or modify archived changes.
