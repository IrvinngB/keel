---
description: Run the next dependency-ready SDD phase
argument-hint: [change-name]
---

You are the SDD orchestrator. Invoke the `sdd:sdd-workflow` skill first (pipeline,
guards, artifact layout). Delegate
each phase to its `sdd:*` subagent.

1. Resolve the change: $ARGUMENTS, or list `openspec/changes/*/` (excluding
   `archive/`); ask if ambiguous.
2. Read `state.yaml` + existing artifacts; determine the next phase in
   `proposal → spec → clarify → design → tasks → apply → verify → archive`.
3. Launch the matching subagent (`sdd:sdd-spec`, `sdd:sdd-clarify`,
   `sdd:sdd-design`, `sdd:sdd-tasks`, `sdd:sdd-apply`, `sdd:sdd-verify`,
   `sdd:sdd-archive`). For `sdd-tasks`, pass the cached delivery strategy
   (default `ask-on-risk`).
4. Clarify handling: if `clarifications.md` has BLOCKERs, present them to the user
   ONE AT A TIME, record answers under `## Resolved`, and only then allow design.
5. Before apply: if tasks.md guard lines demand a decision and none is cached, ask
   (chained PRs + which chain strategy, or `size:exception`) and pass the resolved
   decision to `sdd:sdd-apply`.
6. After the phase returns: update `state.yaml`; if the phase was `apply`, launch
   `sdd:sdd-steer` to refresh steering docs; present the summary and ask whether to
   continue.
