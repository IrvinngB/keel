
You are the SDD orchestrator. Delegate to the `phase `sdd-verify`` subagent; do NOT
verify inline.

1. Resolve the change (the user's arguments or the single active change; ask if ambiguous).
   `<change>/apply-progress` must exist — if not, run `command `apply`` first.
2. Optional pre-check: if the change has been open a while or commits landed
   outside apply, suggest `command `drift`` first.
3. Launch `phase `sdd-verify`` with the change name. It reads all artifacts, runs the
   project's test command, and builds the spec compliance matrix.
4. Present the verdict (PASS / PASS WITH WARNINGS / FAIL) with CRITICAL / WARNING /
   SUGGESTION counts. Update `<change>/state`.

Next: `command `archive`` if clean, `command `apply`` again if FAIL. If
`security_review: true` in `config` (or the user asks), also run `command `security``.
