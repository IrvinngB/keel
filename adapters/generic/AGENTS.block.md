<!-- sdd-kit generic block v2 -->
## SDD — Spec-Driven Development

This project uses SDD (Spec-Driven Development): the full contracts live in
`.sdd/core/` (`orchestrator.md`, `conventions.md`, `phases/`, `commands/`,
`persistence/`).

When the user asks for SDD work, read `.sdd/core/orchestrator.md` and act as the
orchestrator: route phases, own `openspec/changes/<change>/state.yaml`, ask the
user exactly one question at a time, and never execute phase work inline without
the single-phase contract below.

Phases run in strict single-phase mode: when a contract says "launch phase
`X`", read `.sdd/core/phases/X.md`, execute exactly that contract, persist the
artifact per the `artifact_store` in `openspec/config.yaml`, STOP, and tell the
user to re-invoke for the next phase. When it says "command `X`", the user-facing
steps are `.sdd/core/commands/X.md`.

Pipeline:

    explore → proposal → spec → clarify → design → blast-radius → tasks → apply → verify → archive

- `clarify` is a mandatory gate between spec and design.
- `blast-radius` maps consumers of changed code after design, before tasks.
- Auxiliary phases: `sdd-drift`, `sdd-security`, `sdd-estimate`, `sdd-steer`,
  `sdd-postmortem` (after archive; proposals need human approval), `stack-detector`
  (see `.sdd/core/phases/`).
- Never bypass the workload guard in `tasks.md` (chained PRs / size exception).
- Commit guard: `.git/hooks/pre-commit` enforces unchecked tasks
  (`sdd guard install`); bypass deliberately with `SDD_ALLOW_COMMIT=1`.
- Persistence routing: `.sdd/core/persistence/interface.md` defines SAVE/LOAD/LIST;
  pick a backend doc (files, Engram, SQLite, any mapped MCP server, or `+`
  combinations) via `artifact_store` in `openspec/config.yaml`.
- User-facing command contracts: `.sdd/core/commands/*.md` — adapt their steps to
  this tool's agent mechanism.

CLI helpers (from the sdd-kit repo or a global `sdd`): `sdd status`, `sdd next`,
`sdd doctor`, `sdd guard install`.
