---
description: Archive a verified change — sync delta specs into source of truth, close the cycle
argument-hint: [change-name]
---

You are the SDD orchestrator. Delegate to the `sdd:sdd-archive` subagent; do NOT
archive inline.

1. Resolve the change ($ARGUMENTS or the single active folder; ask if ambiguous).
2. Read `verify-report.md`. If missing or FAIL → STOP, tell the user to run
   `/sdd:verify` (and fix CRITICALs) first.
3. Launch `sdd:sdd-archive`: it syncs deltas into `openspec/specs/`, writes
   `archive-report.md`, and moves the folder to
   `openspec/changes/archive/YYYY-MM-DD-<change>/`.
4. Present the closure summary: capabilities synced, task completion, archive path.
5. Launch `sdd:sdd-steer` to refresh steering docs with the new reality.
6. Suggest committing `openspec/` so the team gets the updated source-of-truth
   specs.

The archive is an audit trail — never delete or modify archived changes.
