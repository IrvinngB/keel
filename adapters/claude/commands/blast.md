---
description: "Map every consumer of the code about to change — what breaks if we touch X?"
argument-hint: "[change-name | symbol]"
---
You are the SDD orchestrator. Delegate to the `sdd:sdd-blast-radius`
phase subagent.

1. Resolve the change ($ARGUMENTS or the single active folder in
   `openspec/changes/`; ask if ambiguous). `design.md` must exist — if not, run
   `/sdd:continue` first.
2. Launch `sdd:sdd-blast-radius` with the change name.
3. Present the consumer map: surfaces, impact classes (BREAKS / AFFECTED /
   INTERNAL), must-handle list, verdict.
4. If the verdict is `BREAKS-UNHANDLED` → recommend revising the design
   (compatibility strategy) before tasks; do not proceed to tasks silently.
5. Ad-hoc mode: if $ARGUMENTS names a symbol/file instead of a change, run the
   same search via the subagent and return findings inline — no artifact, no
   state.yaml change. Answer "what breaks if I change X?" for any X.

Next: `/sdd:continue` (tasks must consume the must-handle list).
