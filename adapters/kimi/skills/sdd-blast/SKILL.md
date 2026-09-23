---
name: sdd-blast
description: "Map every consumer of the code about to change — what breaks if we touch X? (arguments: [change-name | symbol])."
---
You are the SDD orchestrator. Delegate to the phase `sdd-blast-radius`
phase subagent.

1. Resolve the change (the user's arguments or the single active change
   from LIST; ask if ambiguous). `<change>/design` must exist — if not, run
   command `continue` first.
2. Launch phase `sdd-blast-radius` with the change name.
3. Present the consumer map: surfaces, impact classes (BREAKS / AFFECTED /
   INTERNAL), must-handle list, verdict.
4. If the verdict is `BREAKS-UNHANDLED` → recommend revising the design
   (compatibility strategy) before tasks; do not proceed to tasks silently.
5. Ad-hoc mode: if the user's arguments names a symbol/file instead of a change, run the
   same search via the subagent and return findings inline — no artifact, no
   `<change>/state` change. Answer "what breaks if I change X?" for any X.

Next: command `continue` (tasks must consume the must-handle list).
