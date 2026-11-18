# Tasks: Add `sdd drift` and `sdd --version`

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

Estimated changed lines: ~130 lines · Delivery strategy: single-pr

## Phase 1: Implementation & Testing
- [x] 1.1 Implement `sdd --version` / `-v` / `version` and `plannedFiles` / `runDrift` in `bin/sdd`.
- [x] 1.2 Create `test/drift-version.test.js` covering version output and drift detection.
- [x] 1.3 Update `README.md`, `docs/es/README.md`, and `CHANGELOG.md`, and run `npm test`.
