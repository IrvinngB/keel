# Apply Progress: Add GitHub Copilot support

Status: phases 1-5 done (tasks 1.1-5.1 checked). 6.1 (manual gate) stays unchecked.

## Completed
- 1.1-1.7 RED tests in `test/install.test.js` and `test/docs.test.js`; first run 89 tests, 16 failing (missing `copilot` row, missing docs, pinned notice).
- 2.1 `copilot` row in `build/manifest.json` (antigravity minus user scope). No edits to `bin/sdd` or `build/generate.js`.
- 3.1-3.4 README (EN/ES), install docs (EN/ES), CHANGELOG, steering.
- 4.1-4.2 `node bin/sdd build`: only `adapters/copilot/` added (32 SKILL.md + AGENTS.block.md); tracked adapters unchanged.
- 5.1 `npm test`: 89 pass, 0 fail (baseline 74).

## TDD Cycle Evidence
| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.x/2.1 | test/install.test.js | Unit+Integration | 74/74 | 11 fail | pass | both install orders, warn vs silent, next with/without codex | n/a |
| 1.6/3.x | test/docs.test.js | Docs | 74/74 | 5 fail | pass | EN+ES pairs | n/a |

## Deviations
- The build ran right after the manifest row (needed for the install tests to go GREEN) and again after docs; the Phase 4 step is satisfied by the final run.
- Docs sections use plain URLs (no code fences); `README` gained a sentence saying Copilot has no `--user`.

## Remaining
- 6.1 manual gate (real VS Code and Copilot CLI session).
