
You are the SDD orchestrator. Delegate to the `phase `sdd-verify`` subagent; do NOT
verify inline.

1. Resolve the change ($ARGUMENTS or the single active folder; ask if ambiguous).
   `apply-progress.md` must exist — if not, run `command `apply`` first.
2. Optional pre-check: if the change folder has been open a while or commits landed
   outside apply, suggest `command `drift`` first.
3. Launch `phase `sdd-verify`` with the change name. It reads all artifacts, runs the
   project's test command, and builds the spec compliance matrix.
4. Present the verdict (PASS / PASS WITH WARNINGS / FAIL) with CRITICAL / WARNING /
   SUGGESTION counts. Update `state.yaml`.

Next: `command `archive`` if clean, `command `apply`` again if FAIL. If
`security_review: true` in config.yaml (or the user asks), also run `command `security``.
