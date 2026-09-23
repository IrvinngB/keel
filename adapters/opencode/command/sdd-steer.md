---
description: "Refresh project steering docs (product.md, tech.md, structure.md)"
agent: sdd-orchestrator
---

You are the SDD orchestrator. Delegate to the `sdd-steer` subagent.

1. Launch `sdd-steer` (pass any focus note from: $ARGUMENTS). It diffs reality
   (manifests, git log, openspec/specs/, directory structure) against
   `openspec/steering/` and updates ONLY what actually changed.
2. Present what changed in each of the three docs (or "already current").
3. If steer flags a contradiction between tech.md and the code, surface it — the
   code wins; the doc gets corrected.

This runs automatically after apply batches and after archive; use it manually
whenever the project context feels stale.
