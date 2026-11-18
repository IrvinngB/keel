# Apply progress: validate-store-in-doctor

Status: phases 1-2, 3.1, 3.2, 4.1 done. Left for the orchestrator: 3.3 (CI matrix) and 4.2 (commit artifacts).

## Done
- 0.1 precondition: PR #11 is merged; doctor block re-read (collisions, idw, antigravity). Insertion point is after the `artifact_store` block, before `commit guard`.
- 1.x RED: `test/store.test.js` (13 tests). Before editing `bin/sdd`, 11 failed for the stated reasons (missing row, or `validateStore`/`validateName` not a function); the two guards (1.12) passed as designed.
- 2.x GREEN: `readStateStrict`, `validateName`, `validateStore(root)`, `configuredStore()` and the doctor row in `bin/sdd`; export guard `if (require.main === module) main(); else module.exports = {...}`; help text.
- 3.1 diff review: `stateOf`, `activeChanges`, `status`, `next`, `probeBackend` untouched; the only removed lines are the artifact_store block, refactored around `configuredStore()`.
- 3.2: doctor on a temp copy of `keel/` is byte-identical before and after; zero `store checks` rows.
- 4.1: CHANGELOG entry.

## Tests
Before: 89. After: 102 (all pass).

## TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|---|---|---|---|---|---|---|---|
| 1.2-1.11 / 2.x | test/store.test.js | e2e + unit | 89/89 | 11 failed | 13/13 | several defects per test, two backends | none needed |
| 1.12-1.13 | test/store.test.js | guard | 89/89 | 1.12 pass, 1.13 fail (no export) | pass | n/a | n/a |

## Deviations from design
- `validateStore(root)` takes the artifacts directory (`keel/`), which holds `changes/`, not the project root.
- Archive folder problems are labelled with the folder name; the active+archived duplicate is labelled with the change name.
- Extra finding for archive folders not matching `<YYYY-MM-DD>-<kebab>`: `archive folder is not <YYYY-MM-DD>-<kebab-case>`.
- Completed-phase artifact and phase checks also run for archived changes that have a `state.yaml`.
