# Tasks: Add `sdd help` command (`{{cmd:help}}`)

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

Estimated changed lines: ~80 lines (excluding regenerated `adapters/`) · Delivery strategy: single-pr

## Phase 1: Core & Manifest
- [x] 1.1 Create `core/commands/help.md` and register `commands.help` in `build/manifest.json`.
- [x] 1.2 Add build test in `test/build.test.js` and update `CHANGELOG.md`.
- [x] 1.3 Run `node bin/sdd build` and `npm test`.
