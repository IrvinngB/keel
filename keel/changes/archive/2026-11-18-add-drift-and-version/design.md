# Design: Add `sdd drift` and `sdd --version`

## Technical Approach
Add `plannedFiles(designText)`, `detectDrift(changeDir, baseRef)`, and `runDrift(target, baseRef, strict)` in `bin/sdd`, plus `version` / `--version` / `-v` handling in `main()`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bin/sdd` | Modify | Add `--version`/`-v`/`version`, `plannedFiles`, `runDrift`, help text, and exports |
| `test/drift-version.test.js` | Create | Tests for `sdd --version` and `sdd drift` |
| `README.md` | Modify | Document `sdd drift` |
| `docs/es/README.md` | Modify | Document `sdd drift` in Spanish |
| `CHANGELOG.md` | Modify | Document `sdd drift` and `sdd --version` under `## Unreleased` |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| CLI / Integration | `sdd --version`, `sdd drift` clean & drifted with `--strict` | `node --test test/drift-version.test.js` |
| Full Suite | All tests pass | `npm test` |
