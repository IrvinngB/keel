# Design: Add `sdd archive` and `sdd ci`

## Technical Approach
Add `syncSpecFile`, `runArchive`, and `runCi` helpers in `bin/sdd`, wired to `case 'archive'` and `case 'ci'` in `main()`, plus help text and exports.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bin/sdd` | Modify | Add `syncSpecFile`, `runArchive`, `runCi`, CLI cases, help text, and exports |
| `test/archive-ci.test.js` | Create | Unit and CLI tests for `sdd archive` and `sdd ci` |
| `README.md` | Modify | Document `sdd archive` and `sdd ci` |
| `docs/es/README.md` | Modify | Document `sdd archive` and `sdd ci` in Spanish |
| `CHANGELOG.md` | Modify | Record `sdd archive` and `sdd ci` under `## Unreleased` |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| CLI / Integration | `sdd archive` (gates, `--dry-run`, spec sync, move) and `sdd ci` (`--strict-tasks`, exit codes) | `node --test test/archive-ci.test.js` |
| Full Suite | All tests pass | `npm test` |
