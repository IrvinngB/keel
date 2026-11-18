# Proposal: Add `sdd check` deterministic gate validator

## Intent
Strengthen Keel's "enforced, not only suggested" philosophy by adding a zero-token, deterministic `sdd check [change]` CLI command that verifies SDD gate invariants on disk and exits non-zero when a gate is violated.

## Scope

### In Scope
- New CLI command `sdd check [change]`: validates all active changes under `keel/changes/` (or the named active change).
- Deterministic checks:
  1. Structural store validity (`validateStore`) for the checked change(s).
  2. Clarify gate: `design.md` or `apply-progress.md` must not exist while `clarifications.md` still has `### Q<n>:` items under `## BLOCKER`.
  3. Spec format: every `specs/<cap>/spec.md` must have at least one `### Requirement:`, and each requirement must have at least one `#### Scenario:` with `GIVEN`, `WHEN`, and `THEN`.
  4. Design sections: `design.md` (when present) must include `## File Changes` and `## Testing Strategy`.
  5. Workload guard: `tasks.md` with `Decision needed before apply: Yes` and `Chain strategy: pending` fails if `apply-progress.md` exists or any task is `[x]`.
- Exit code `0` when all checks pass (or no active changes exist), `1` when any check fails or an unknown change name is passed.
- Document `sdd check` in `bin/sdd` help, `README.md`, `docs/es/README.md`, and `CHANGELOG.md`.

### Out of Scope
- Modifying `hooks/pre-commit` or `sdd doctor` exit codes.
- Semantic or LLM-based spec evaluation.

## Capabilities

### New Capabilities
- `gate-validation`: deterministic CLI validation of SDD artifacts and gate invariants (`sdd check`).

### Modified Capabilities
- None.

## Risks
Level: **Low** (additive CLI subcommand; existing `status`, `doctor`, and `guard` behavior unchanged).

## Success Criteria
- [ ] `sdd check` exits `0` on valid active changes (including Keel's own `keel/`).
- [ ] `sdd check` exits `1` and names the change + violated gate for each failure class.
- [ ] `npm test` passes with dedicated tests in `test/check.test.js`.
