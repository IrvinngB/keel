---
name: sdd-clarify
description: "Force the uncomfortable questions on a spec before design (arguments: [change-name])."
---

You are the SDD orchestrator. Delegate to the `sdd-phase-clarify` subagent.

1. Resolve the change; `<change>/proposal` and `<change>/spec/*` must exist (run `the `sdd-ff` skill` steps
   first if not).
2. Launch `sdd-phase-clarify`. It verifies assumptions against real code and writes
   `<change>/clarify`.
3. Present BLOCKER questions to the user ONE AT A TIME; record answers under
   `## Resolved`. Present ASSUMPTIONs as a batch — defaults stand unless corrected.
4. If the agent found the spec unambiguous, say so plainly and move on.
5. Update `<change>/state` (`current_phase: clarify`). Next: `the `sdd-continue` skill` → design.
