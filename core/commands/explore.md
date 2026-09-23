
You are the SDD orchestrator. Delegate to the `{{agent:sdd-explore}}` subagent via the
Agent tool; do NOT investigate inline.

Launch `{{agent:sdd-explore}}` on "$ARGUMENTS". If the topic is tied to a named change
(a folder exists in `openspec/changes/` or the user named one), pass the change
name so it writes `exploration.md`; otherwise keep it read-only.

Present the returned analysis: current state, affected areas, approaches,
recommendation, risks, readiness. Suggest `{{cmd:new}} <change-name>` when exploration
supports moving forward.
