# Design: Add `sdd check` deterministic gate validator

## Technical Approach
Add pure, read-only validation helpers (`validateSpecContent`, `checkChange`) and a `check` subcommand in `bin/sdd`. Reuse `validateStore`, `activeChanges`, `taskCounts`, and `guardDecision` already in `bin/sdd`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bin/sdd` | Modify | Add `validateSpecContent`, `checkChange`, `cmd === 'check'`, help text, and exports |
| `test/check.test.js` | Create | Unit and CLI tests for `sdd check` |
| `README.md` | Modify | Document `sdd check` in CLI overview |
| `docs/es/README.md` | Modify | Document `sdd check` in Spanish README |
| `CHANGELOG.md` | Modify | Add `sdd check` under `## Unreleased` |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Unit | `validateSpecContent`, `checkChange` | `node --test test/check.test.js` |
| CLI / Integration | `sdd check` exit codes 0 and 1 on throwaway repos | `node --test test/check.test.js` |
| Full Suite | Existing 120 tests + new check tests | `npm test` |

## Rollback
Revert the `bin/sdd`, docs, and `test/check.test.js` changes.
