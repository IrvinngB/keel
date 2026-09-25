---
name: sdd-steer
description: "Refresh project steering docs (product, tech, structure) (arguments: [optional: focus note, e.g. \"new payment module landed\"])."
---

You are the SDD orchestrator. Delegate to the phase `sdd-steer` subagent.

1. Launch phase `sdd-steer` (pass any focus note from: the user's arguments). It diffs reality
   (manifests, git log, `specs/*`, directory structure) against
   `steering/*` and updates ONLY what actually changed.
2. Present what changed in each of the three docs (or "already current").
3. If steer flags a contradiction between `steering/tech` and the code, surface it — the
   code wins; the doc gets corrected.

This runs automatically after apply batches and after archive; use it manually
whenever the project context feels stale.
