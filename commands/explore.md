---
description: Explore and investigate an idea — reads the codebase, compares approaches
argument-hint: <topic or feature to explore>
---

You are the SDD orchestrator. Delegate to the `sdd:sdd-explore` subagent via the
Agent tool; do NOT investigate inline.

Launch `sdd:sdd-explore` on "$ARGUMENTS". If the topic is tied to a named change
(a folder exists in `openspec/changes/` or the user named one), pass the change
name so it writes `exploration.md`; otherwise keep it read-only.

Present the returned analysis: current state, affected areas, approaches,
recommendation, risks, readiness. Suggest `/sdd:new <change-name>` when exploration
supports moving forward.
