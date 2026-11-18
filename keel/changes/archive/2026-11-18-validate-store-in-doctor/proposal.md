# Proposal: Validate the files store in `sdd doctor`

## Intent
The model writes `keel/` directly (Keel implements no SAVE/LOAD), so write-time protection is impossible. Broken stores go unnoticed today. Detect them after the fact, read-only.

## Scope

### In Scope
- Pure `validateStore(cwd)` in `bin/sdd` returning findings; doctor prints a `store checks` section only when non-empty.
- (a) change dirs under `keel/changes/` (not `archive/`) without `state.yaml`.
- (b) `state.yaml`: required `current_phase`, `completed`, `status` (active|archived), `archived_on` when archived; phases outside the pipeline; status vs folder mismatch; completed phases whose artifact is missing (`core/persistence/files.md:18-38`).
- (d) reserved or non-kebab-case names; duplicates between active and archive.
- Non-files backends: one skipped note.
- Tests first; CHANGELOG Unreleased; short docs mention if it fits an existing section.

### Out of Scope
- Atomic writes, per-backend contract tests, SQLite history, files+sqlite mirror comparison.
- Any persistence contract change; `sdd status`/`next`.
- (c) archived-changes-edited-via-git: DEFERRED follow-up.

## Capabilities

### New Capabilities
- `store-validation`: doctor's read-only checks of the files store and how findings are reported.

### Modified Capabilities
- None

## Approach
Exploration approach 2. Reuse regex `stateOf` (`bin/sdd` ~190-199), splitting inline `[..]` lists; no YAML dependency. Print-if-non-empty like collisions. `artifact_store` check unchanged.

## Accepted defaults
- Exit code stays 0; warnings only.
- `clarify`, `blast-radius` optional when matching completed vs artifacts.
- Unparseable model YAML is "unreadable", never "invalid".
- (c) deferred: archive move commit is same-day, too noisy.

## Assumptions
- Archive folder date prefix must equal `archived_on`.
- Block-style `completed` lists are reported unreadable, not parsed.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bin/sdd` | Modified | `validateStore()`, doctor section |
| `test/artifacts.test.js` | Modified | fixture stores |
| `CHANGELOG.md` | Modified | Unreleased line |
| `docs/install.md`, `docs/es/instalacion.md` | Modified (optional) | no new heading or fence |

## Risks
Risk level: Low.

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conflict with PR #11 (same doctor code) | High | Apply starts after #11 merges |
| False positives on varied YAML | Medium | "unreadable" category |
| Windows path separators | Low | normalize `\`; CI on Windows |

## Rollback Plan
Revert the commits; doctor writes nothing to user files.

## Dependencies
- PR #11 (`feat/warn-on-foreign-sdd-files`) merged before apply.

## Success Criteria
- [ ] Healthy store: doctor output byte-identical to today.
- [ ] Checks (a), (b), (d) each have a failing-first test.
- [ ] Exit 0 with findings; non-files backend prints one skipped note.
- [ ] `npm test` passes.
