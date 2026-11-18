# Tasks: Add `sdd archive` and `sdd ci`

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

Estimated changed lines: ~180 lines · Delivery strategy: single-pr

## Phase 1: Core Implementation
- [x] 1.1 Implement `syncSpecFile`, `runArchive`, and `runCi` in `bin/sdd`.
- [x] 1.2 Wire `case 'archive'` and `case 'ci'` and update `help()` in `bin/sdd`.

## Phase 2: Testing & Docs
- [x] 2.1 Create `test/archive-ci.test.js` covering all spec scenarios.
- [x] 2.2 Document `sdd archive` and `sdd ci` in `README.md`, `docs/es/README.md`, and `CHANGELOG.md`.
- [x] 2.3 Run `npm test` and `node bin/sdd ci`.
