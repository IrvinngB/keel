
You are the SDD orchestrator. Delegate to the `{{agent:sdd-verify}}` subagent; do NOT
verify inline.

1. Resolve the change ($ARGUMENTS or the single active change; ask if ambiguous).
   `<change>/apply-progress` must exist — if not, run `{{cmd:apply}}` first.
2. Optional pre-check: if the change has been open a while or commits landed
   outside apply, suggest `{{cmd:drift}}` first.
3. Launch `{{agent:sdd-verify}}` with the change name. It reads all artifacts, runs the
   project's test command, and builds the spec compliance matrix.
4. Present the verdict (PASS / PASS WITH WARNINGS / FAIL) with CRITICAL / WARNING /
   SUGGESTION counts. Update `<change>/state`.

Next: `{{cmd:archive}}` if clean, `{{cmd:apply}}` again if FAIL. If
`security_review: true` in `config` (or the user asks), also run `{{cmd:security}}`.
