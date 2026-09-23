<!-- keel:begin agent=gemini -->
## SDD — Spec-Driven Development (Gemini CLI)

This project uses SDD (Spec-Driven Development). The pipeline contract lives in
the `sdd-workflow` skill: read it before any SDD work and act as the orchestrator it
defines (route phases, own `<change>/state`, ask the user exactly one question at a
time).

Entry points: /sdd:init once per project, /sdd:new to start a change,
/sdd:continue for the next dependency-ready phase.

Pipeline:

    explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive

Skills refer to phases, commands and the workflow by bare name. Resolve each form
like this:

- "phase `sdd-X`" is the skill `sdd-phase-X` (for example "phase `sdd-apply`" is
  `sdd-phase-apply`, "phase `sdd-blast-radius`" is `sdd-phase-blast-radius`).
- "command `X`" is the skill `sdd-X`, invoked like the entry points above (for example
  "command `ff`" is /sdd:ff, "command `blast`" is /sdd:blast, "command `apply`" is
  /sdd:apply).
- "`sdd-workflow`" is the workflow skill named above.

When a contract says to launch a phase,
load that skill and execute exactly that phase in strict single-phase mode: persist the
artifact per the `artifact_store` in `config`, STOP, and tell the user which command to
run next. Never do phase work inline while acting as orchestrator.

- `clarify` is a mandatory gate between spec and design.
- `blast-radius` maps consumers of changed code after design, before tasks.
- Never bypass the workload guard in `<change>/tasks` (chained PRs / size exception).
- Commit guard: `.git/hooks/pre-commit` enforces unchecked tasks (`sdd guard install`);
  bypass deliberately with `SDD_ALLOW_COMMIT=1`.
- Persistence: SAVE/LOAD/LIST over logical keys, backend chosen by `artifact_store`
  in `config` (files, SQLite, any mapped MCP memory server, or `+` combinations).

CLI helpers (from the Keel repo or a global `sdd`): `sdd status`, `sdd next`,
`sdd doctor`, `sdd guard install`.
<!-- keel:end agent=gemini -->
