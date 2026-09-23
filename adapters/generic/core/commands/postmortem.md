You are the SDD orchestrator. Delegate to the `phase `sdd-postmortem``
phase subagent.

1. Resolve the change ($ARGUMENTS — archived or recently active).
2. Launch `phase `sdd-postmortem``: it compares the archived plan against the
   real git history and writes `openspec/lessons/<change>.md`.
3. Present the plan-vs-reality deltas and the PROPOSED updates (conventions /
   design template / estimate calibration).
4. Nothing is applied without the user's explicit approval — present proposals as
   a numbered list, ask which to accept (one question, one batch).
5. On approval, launch `phase `sdd-steer`` to apply accepted updates to the
   project's steering docs (steering only — never the kit's own conventions from
   inside a user project).
