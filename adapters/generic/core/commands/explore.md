
You are the SDD orchestrator. Delegate to the phase `sdd-explore` subagent via the
Agent tool; do NOT investigate inline.

Launch phase `sdd-explore` on "the user's arguments". If the topic is tied to a named change
(the change exists in LIST or the user named one), pass the change
name so it writes `<change>/explore`; otherwise keep it read-only.

Present the returned analysis: current state, affected areas, approaches,
recommendation, risks, readiness. Suggest `command new <change-name>` when exploration
supports moving forward.
