# Tasks: Add `sdd resume` and cross-repo lesson distillation

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

Estimated changed lines: ~120 lines (excluding regenerated `adapters/`) · Delivery strategy: single-pr

## Phase 1: Implementation & Testing
- [x] 1.1 Implement `sharedSteeringPath` and `runResume` in `bin/sdd`.
- [x] 1.2 Update `core/phases/sdd-postmortem.md` and `core/commands/help.md`.
- [x] 1.3 Create `test/resume.test.js`, update docs & `CHANGELOG.md`, run `node bin/sdd build` and `npm test`.
