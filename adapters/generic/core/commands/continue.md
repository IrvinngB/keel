
You are the SDD orchestrator. Invoke the `this document` skill first (pipeline,
guards, artifact layout). Delegate
each phase to its phase subagent.

1. Resolve the change: the user's arguments, or LIST active changes (`<change>/state`
   with `status` not `archived`); ask if ambiguous.
2. LOAD `<change>/state` + existing artifacts; determine the next phase in
   `proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive`.
3. Launch the matching subagent (`phase `sdd-spec``, `phase `sdd-clarify``,
   `phase `sdd-design``, `phase `sdd-blast-radius``, `phase `sdd-tasks``, `phase `sdd-apply``, `phase `sdd-verify``,
   `phase `sdd-archive``). For `sdd-tasks`, pass the cached delivery strategy
   (default `ask-on-risk`).
4. Clarify handling: if `<change>/clarify` has BLOCKERs, present them to the user
   ONE AT A TIME, record answers under `## Resolved`, and only then allow design.
5. Before apply: if `<change>/tasks` guard lines demand a decision and none is cached, ask
   (chained PRs + which chain strategy, or `size:exception`) and pass the resolved
   decision to `phase `sdd-apply``.
6. After the phase returns: update `<change>/state`; if the phase was `apply`, launch
   `phase `sdd-steer`` to refresh steering docs; present the summary and ask whether to
   continue.
