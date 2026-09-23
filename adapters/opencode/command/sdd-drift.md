---
description: "Detect divergence between approved specs/design and the actual code"
agent: sdd-orchestrator
---

You are the SDD orchestrator. Delegate to the `sdd-drift` subagent.

1. Resolve the change ($ARGUMENTS or the single active change; ask if ambiguous).
2. Launch `sdd-drift`. It compares git history of touched files against the
   artifact dates and classifies every discrepancy (CODE_UNTRACKED, SPEC_STALE,
   DESIGN_STALE, ARTIFACT_UNDONE, CLEAN) into `<change>/drift`.
3. Present the summary table and per-class recommendations:
   - CODE_UNTRACKED → backfill via `/sdd-apply` or revert
   - SPEC_STALE → `/sdd-continue` (re-run spec)
   - DESIGN_STALE → re-run design
   - ARTIFACT_UNDONE → CRITICAL, blocks archive — investigate now
4. If CLEAN, tell the user and suggest `/sdd-verify`.
