# Tasks: Add `sdd check` deterministic gate validator

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

Estimated changed lines: ~140 lines · Delivery strategy: single-pr

## Phase 1: Core Implementation
- [x] 1.1 Implement `validateSpecContent` and `checkChange` in `bin/sdd` and export them.
- [x] 1.2 Wire `case 'check'` and help entry in `bin/sdd`.

## Phase 2: Testing
- [x] 2.1 Create `test/check.test.js` covering all spec scenarios (no active changes, unknown change, open blocker, invalid spec, missing design sections, pending workload guard, passing change).

## Phase 3: Docs & Cleanup
- [x] 3.1 Document `sdd check` in `README.md`, `docs/es/README.md`, and `CHANGELOG.md`.
- [x] 3.2 Run `npm test` and verify all tests pass.
