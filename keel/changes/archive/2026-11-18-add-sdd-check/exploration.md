# Exploration: `sdd check` deterministic gate validator

## Current State
- `bin/sdd` has `validateStore(root)` (used by `sdd doctor`), which validates `keel/` structure (`state.yaml`, naming, archive folder format) read-only and always exits `0`.
- `hooks/pre-commit` blocks commits only when `keel/changes/` has unchecked `- [ ]` tasks.
- There is no CLI command to validate the **content** of SDD gates deterministically without spending LLM tokens (e.g. open `## BLOCKER` questions before design, `### Requirement:` without `#### Scenario:` / `GIVEN`/`WHEN`/`THEN`, missing `## File Changes` or `## Testing Strategy` in `design.md`, or unresolved workload guard in `tasks.md`).

## Affected Areas
- `bin/sdd`: add `check` subcommand (`sdd check [change]`), pure helper functions (`checkChange`, `validateSpecContent`), export them for unit testing, and list `check` in `help()`.
- `test/check.test.js`: unit + CLI integration tests for happy path, each gate failure, missing `keel/`, unknown change name, and exit codes (`0` vs `1`).
- `README.md`, `docs/es/README.md`, `CHANGELOG.md`: document `sdd check`.
