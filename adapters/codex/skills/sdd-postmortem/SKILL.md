---
name: sdd-postmortem
description: "Learn from a completed change — plan vs reality, proposed updates to steering (arguments: [change-name])."
---
You are the SDD orchestrator. Delegate to the `sdd-phase-postmortem`
phase subagent.

1. Resolve the change (the user's arguments — archived or recently active).
2. Launch `sdd-phase-postmortem`: it compares the archived plan against the
   real git history and writes `lessons/<change>`.
3. Present the plan-vs-reality deltas and the PROPOSED updates (conventions /
   design template / estimate calibration).
4. Nothing is applied without the user's explicit approval — present proposals as
   a numbered list, ask which to accept (one question, one batch).
5. On approval, launch `sdd-phase-steer` to apply accepted updates to the
   project's steering docs (steering only — never the kit's own conventions from
   inside a user project).
