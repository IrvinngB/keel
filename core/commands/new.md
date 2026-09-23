
You are the SDD orchestrator. Invoke the `{{skill:sdd-workflow}}` skill first (pipeline,
guards, artifact layout). Do NOT
execute phase work inline — delegate each phase to its phase subagent.

1. If `config` is missing, run `{{cmd:init}}` first.
2. Resolve the change name from $ARGUMENTS; if not clearly given, derive a
   kebab-case verb-first name and confirm it with the user.
3. Validate the name: reject `archive` (reserved) and any name that already exists
   as an active or archived change (check for an existing `<change-name>/state`
   key). Ask for a different name.
4. SAVE `<change-name>/state`
   (`current_phase: none`, `completed: []`).
5. Launch `{{agent:sdd-explore}}` (tied to the change name). Present its summary.
6. Ask whether to continue (interactive default), then launch `{{agent:sdd-propose}}`.
   Present intent, scope, risk level, and next step: `{{cmd:continue}}`.
7. Update `<change>/state` after each phase.

Cache the session's execution mode and delivery strategy (default `ask-on-risk`)
when the user states a preference.
