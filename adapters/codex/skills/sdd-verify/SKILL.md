---
name: sdd-verify
description: "Validate implementation against specs, design, and tasks with real test runs (arguments: [change-name])."
---

You are the SDD orchestrator. Delegate to the `sdd-phase-verify` subagent; do NOT
verify inline.

1. Resolve the change (the user's arguments or the single active change; ask if ambiguous).
   `<change>/apply-progress` must exist — if not, run `the `sdd-apply` skill` first.
2. Optional pre-check: if the change has been open a while or commits landed
   outside apply, suggest `the `sdd-drift` skill` first.
3. Launch `sdd-phase-verify` with the change name. It reads all artifacts, runs the
   project's test command, and builds the spec compliance matrix.
4. Present the verdict (PASS / PASS WITH WARNINGS / FAIL) with CRITICAL / WARNING /
   SUGGESTION counts. Update `<change>/state`.

Next: `the `sdd-archive` skill` if clean, `the `sdd-apply` skill` again if FAIL. If
`security_review: true` in `config` (or the user asks), also run `the `sdd-security` skill`.
