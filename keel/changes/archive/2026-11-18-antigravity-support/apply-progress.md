# Apply progress: antigravity-support

Mode: Strict TDD. Delivery: single PR (ask-on-risk, no decision needed). No commits made.

## Completed tasks
1.1-1.13, 2.1-2.3, 3.1-3.7, 4.1 (all marked `[x]` in tasks.md).

## Remaining
- 4.2 (commit `build: regenerate adapters`, then verify clean `git status --porcelain adapters/`): not done, commits are the orchestrator's call.
- 5.1 (feature commits) and 5.2 (MANUAL GATE, never to be marked done): untouched.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | test/install.test.js | integration (CLI) | 38/38 pass | failed: registry row missing (`AG` undefined, status assertion) | pass after 2.1 | status + displayName + fill + doctor line + no "Tested" | none needed |
| 1.2 | test/install.test.js | integration | 38/38 | failed: `indexOf('antigravity')` is -1, expected 5 | pass after 2.1 + build | both orders codex/antigravity + antigravity alone | none |
| 1.3 | test/install.test.js | integration | 38/38 | failed: install exit 1 (`unknown tool "antigravity"`) | pass after 2.1 + build | first run + rerun ("already up to date") + tree snapshot | none |
| 1.4 | test/install.test.js | integration | 38/38 | failed: install exit 1 (unknown tool) | pass after build | two orders, re-install, blocks compared to stand-alone installs | none |
| 1.5 | test/install.test.js | integration | 38/38 | failed: output `unknown tool` instead of `malformed keel block markers` | pass after 2.1 | exit code, AGENTS.md unchanged, no `.agents` | none |
| 1.6 | test/install.test.js | integration | 38/38 | failed: `unverifiedFields` undefined (deepEqual against the 5 fields) | pass after 2.1 + build | manifest fields + 2 URLs + date + install output + doctor output | none |
| 1.7 | test/install.test.js | integration | 38/38 | failed: codex notice lacks `antigravity` in "shared with" | pass after 2.1 | regex on the notice | none |
| 1.8 | test/install.test.js | integration | 38/38 | failed: doctor output has no Antigravity warning | pass after 2.1 | warning text + both copies still present | none |
| 1.9 | test/install.test.js | integration | 38/38 | failed: no `antigravity` line in doctor output | pass after 2.1 | bare `.gemini` gives `tool —`; three dirs found; projectMarkers empty | none |
| 1.10 | test/install.test.js | integration | 38/38 | failed: install exit 1 (unknown tool) | pass after 2.1 + build | GEMINI.md byte-identical (CRLF+LF), exact file set, no `~/.agents` | none |
| 1.11 | test/install.test.js | integration | 38/38 | failed: dry-run exit 1 (unknown tool) | pass after 2.1 + build | tree empty + exact ordered action list (32 copies, summary, notice, append, guard) | none |
| 1.12 | test/docs.test.js | docs | 4 parity tests pass | 5 failed: README/es rows lack Experimental Antigravity row; install docs say "not supported yet"; CHANGELOG Unreleased lacks Antigravity | pass after 3.1-3.5 | en+es, 4 files, 0.3.0 line untouched | rephrased "call Antigravity Tested" out of the docs (my own test caught it) |
| 1.13 | test/install.test.js | integration | 38/38 | failed: `  claude    verified ...` not aligned to width of longest id (hard-coded padEnd(9) vs 8; see deviation 1) | pass after 2.3 | all registry ids checked, incl. 11-char `antigravity` | none |

Not RED-verified as a distinct run: Phase 2 and 3 code was written only after the full RED run (17 failures, 14 passes = 10 existing + 4 docs parity).

Focused runs after the row (before the build): 6 install tests still failed because `adapters/antigravity` did not exist (`missing ... run: sdd build`), as the tasks predicted. After `node bin/sdd build`: all green.

## Results
- Baseline before changes: 38 tests, 38 pass.
- After RED: 31 tests in install+docs, 17 failed.
- Final `npm test`: tests 55, pass 55, fail 0.
- `git status --porcelain adapters/`: only `?? adapters/antigravity/` (32 SKILL.md + AGENTS.block.md). Codex adapter did not change (notes are not emitted there).

## Files changed (git diff --stat, excluding adapters/ and the pre-existing .atl/ drift)
CHANGELOG.md, README.md, bin/sdd, build/manifest.json, docs/es/README.md, docs/es/instalacion.md, docs/install.md, test/docs.test.js, test/install.test.js; keel/steering/product.md and structure.md (keel/ is untracked so not in the diff stat); keel/changes/antigravity-support/{tasks,apply-progress}.md. New: adapters/antigravity/ (generated).

## Deviations / notes
1. Task 2.3 as written computes the pad from the longest id. Today the longest id is `opencode` (8), so the old `padEnd(9)` had one extra space; the id column grows from 9 to 11 characters (width of `antigravity`), so EVERY existing agent line in `sdd doctor` gains two spaces. The test 1.13 is strict (width == longest id), so before the row it was red for that off-by-one and not only for the 11-char overflow.
2. The dry-run test builds the expected "would copy" list from `adapters/codex/skills` (codex and antigravity emit identical trees), so it does not hard-code 32.
3. Docs: the README/es sentence "Antigravity (`agy`) is not supported yet" became "reads AGENTS.md and skills only: no commands, subagents or hooks". The doctor double-discovery warning is documented as possibly false for CLI users (Open Question accepted in design).
4. Test 1.12 also asserts that the install docs mention `~/.gemini/config/skills` and `~/.gemini/antigravity-cli/skills`, and the Spanish note uses "sin comprobar" as the unproven marker.
5. `.atl/` shows a pre-existing modification (from before this run); untouched.
