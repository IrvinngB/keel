# Tasks: Validate the files store in `sdd doctor`

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Estimated changed lines: ~245 (bin/sdd ~100, test/store.test.js ~140, CHANGELOG ~3), one PR · Delivery strategy: ask-on-risk

## Phase 0: Precondition
- [x] 0.1 BLOCKING, orchestrator ticks (MH4): same doctor code as PR #11. Cut branch from `feat/warn-on-foreign-sdd-files` (stacked, PR base = that branch, GitHub retargets when #11 merges) or from main after #11 merges; re-check the doctor block.

## Phase 1: RED tests (commit `test`)
- [x] 1.1 Create `test/store.test.js`: helpers `repo()`/`write()`/`sdd()`, isolated HOME, LF fixtures, `path.join` (MH6).
- [x] 1.2 RED: broken store, exit 0, file-tree snapshot equal before/after, `store checks` row present.
- [x] 1.3 RED: `sqlite` and `none` print exactly one skipped note.
- [x] 1.4 RED: `foo` without state.yaml matches `foo\s+no state\.yaml`.
- [x] 1.5 RED: CRLF fixture reports `unreadable`, never `invalid`.
- [x] 1.6 RED: block-style `completed`, quoted value, and ` #` on required key are unreadable.
- [x] 1.7 RED (MH1, a): open_questions `- ... PR #10` plus unknown phase `deploy`; row names `deploy`, no `unreadable`. Fails today: no row.
- [x] 1.8 RED: date mismatch, missing `design.md`, duplicate key, active+archived duplicate each name the item.
- [x] 1.9 RED: require `validateName('changes\\Foo_Bar')` directly; reserved names.
- [x] 1.10 RED (MH2, b): `validateStore(tempDir)` from another cwd finds defects in the temp dir only.
- [x] 1.11 RED (c): requiring bin/sdd does not run main and prints nothing.
- [x] 1.12 GUARD (MH3): no `keel/`, `archive/.gitkeep`, `changes/.cache/`, optional `spec` give no `store checks`; healthy run has `round-trip files` directly followed by `commit guard`.
- [x] 1.13 GUARD (d): `validateStore` on this repo's `keel/` returns zero findings; skip if absent. Passes only after 2.x.
- [x] 1.14 Run `npm test`; confirm each RED fails for its stated reason; commit.

## Phase 2: GREEN (commit `feat`)
- [x] 2.1 `bin/sdd`: add `readStateStrict(file)` reusing `stateOf` rules; quote/` #` check on values of `current_phase`, `completed`, `status`, `archived_on` only.
- [x] 2.2 `bin/sdd`: add `validateName(relPath)` and `validateStore(root)` deriving every path from `root`, not `ARTIFACTS`/`CHANGES`; sorted, no writes.
- [x] 2.3 `bin/sdd`: extract `configuredStore()`, output unchanged.
- [x] 2.4 `bin/sdd`: doctor row after `artifact_store` try/catch, before `commit guard`; help text.
- [x] 2.5 `bin/sdd:722`: `if (require.main === module) main(); else module.exports = {...}`.
- [x] 2.6 Run `npm test` green; REFACTOR.

## Phase 3: Verification
- [x] 3.1 Diff review (e): `stateOf`, `activeChanges`, `status`, `next`, `probeBackend` unchanged.
- [x] 3.2 (MH5) One healthy doctor run equals pre-change capture; doctor on temp copy of `keel/` shows zero `store checks` rows.
- [ ] 3.3 CI green on Node 18 and 22 across ubuntu/macos/windows (export guard, CRLF).

## Phase 4: Docs and artifacts (commit `chore`)
- [x] 4.1 `CHANGELOG.md`: Unreleased/Added entry; no docs edits, no adapters regeneration.
- [ ] 4.2 Commit `keel/changes/validate-store-in-doctor/` artifacts.
