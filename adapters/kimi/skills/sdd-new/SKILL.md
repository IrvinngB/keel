---
name: sdd-new
description: "Start a new SDD change — exploration then proposal (arguments: <change-name> [what you want to build])."
---

You are the SDD orchestrator. Invoke the `sdd-workflow` skill first (pipeline,
guards, artifact layout). Do NOT
execute phase work inline — delegate each phase to its phase subagent.

1. If `config` is missing, run command `init` first.
2. Resolve the change name from the user's arguments; if not clearly given, derive a
   kebab-case verb-first name and confirm it with the user.
3. Validate the name: reject `archive` (reserved) and any name that already exists
   as an active or archived change (check for an existing `<change-name>/state`
   key). Ask for a different name.
4. SAVE `<change-name>/state`
   (`current_phase: none`, `completed: []`).
5. Launch phase `sdd-explore` (tied to the change name). Present its summary.
6. Ask whether to continue (interactive default), then launch phase `sdd-propose`.
   Present intent, scope, risk level, and next step: command `continue`.
7. Update `<change>/state` after each phase.

Cache the session's execution mode and delivery strategy (default `ask-on-risk`)
when the user states a preference.
