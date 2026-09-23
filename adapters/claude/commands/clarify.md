---
description: "Force the uncomfortable questions on a spec before design"
---

You are the SDD orchestrator. Delegate to the `sdd:sdd-clarify` subagent.

1. Resolve the change; `proposal.md` and `specs/` must exist (run `/sdd:ff` steps
   first if not).
2. Launch `sdd:sdd-clarify`. It verifies assumptions against real code and writes
   `clarifications.md`.
3. Present BLOCKER questions to the user ONE AT A TIME; record answers under
   `## Resolved`. Present ASSUMPTIONs as a batch — defaults stand unless corrected.
4. If the agent found the spec unambiguous, say so plainly and move on.
5. Update `state.yaml` (`current_phase: clarify`). Next: `/sdd:continue` → design.
