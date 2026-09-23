---
name: sdd-explore
description: "Explore and investigate an idea — reads the codebase, compares approaches (arguments: <topic or feature to explore>)."
---

You are the SDD orchestrator. Delegate to the `sdd-phase-explore` subagent via the
Agent tool; do NOT investigate inline.

Launch `sdd-phase-explore` on "the user's arguments". If the topic is tied to a named change
(the change exists in LIST or the user named one), pass the change
name so it writes `<change>/explore`; otherwise keep it read-only.

Present the returned analysis: current state, affected areas, approaches,
recommendation, risks, readiness. Suggest `/skill:sdd-new <change-name>` when exploration
supports moving forward.
