# Verification Report: Add GitHub Copilot support

## Completeness
| Task | Status |
|------|--------|
| 1.1-1.7 RED tests | done |
| 2.1 manifest row | done |
| 3.1-3.4 docs, CHANGELOG, steering | done |
| 4.1-4.2 regenerate | done |
| 5.1 npm test | done |
| 6.1 manual gate (real VS Code + Copilot CLI) | OPEN by design (unchecked, tracked) |

## Execution Evidence
- `npm test` -> 89 pass, 0 fail, exit 0.
- Mutation: deleting `registry.copilot` from build/manifest.json -> 78 pass, 11 fail (row tests are real, not tautologies); manifest restored (diff intact).
- `node bin/sdd build` rerun: no tracked adapter changed; adapters/copilot has 33 files (32 SKILL.md + AGENTS.block.md).
- `install copilot --project --dry-run` in a fresh git repo: only .git present, prints planned copies, AGENTS.md block, "GitHub Copilot has no native commit hook — would install the universal git guard.", unverified line. Exit 0.
- `install copilot --user`: exit 1, "sdd: copilot has no user install target", HOME empty.
- Real install then `doctor`: `copilot experimental tool n/a · project installed · skills in .agents/skills · AGENTS.md: block present`; unverified warning printed; guard installed; only .agents + AGENTS.md written.
- No diff in bin/sdd or build/generate.js. Nothing staged (`git diff --cached` empty).

## Spec Compliance Matrix
| Requirement | Scenario | Test | Status |
|---|---|---|---|
| Registry/Experimental | Status | install.test.js:273 (+docs tests never Tested) | PASS |
| Registry order | Output unchanged | install.test.js:292, 300-302 | PASS |
| Project install | Install and re-run | :305 | PASS |
| | Coexistence (both orders) | :318 | PASS |
| | Malformed marker | :337 | PASS |
| | Guard | :305 | PASS |
| No user scope | User refused | :348 (+ manual run) | PASS |
| Unverified/provenance | Declared and surfaced | :273, :367 (+ manual doctor) | PASS |
| Shared-skills reading | Shared notice | :377, :261 | PASS |
| | Double discovery (warn / silent) | :384 | PASS (only .github/skills exercised in test; see W2) |
| Dry run | Dry run | :358 | PASS |
| Docs parity | Docs, counts, no voseo, CHANGELOG | docs.test.js:98-128 | PASS |

Docs: heading/fence counts match per pair (README 17/16 both; install 6/0 both). Copilot is Experimental everywhere, never Tested. ES regex scan found no voseo (`Usa` is tuteo imperative). Steering updated (product.md:48, structure.md:13).

## Issues
### CRITICAL
- None.
### WARNING
- W1: Task 6.1 manual gate is unchecked (expected). The commit guard (`node bin/sdd guard`) will block commits until checked; committing needs `SDD_ALLOW_COMMIT=1` or a deliberate chained boundary. Promotion beyond Experimental is not allowed until then.
- W2: Double-discovery test covers only `.github/skills`; `.claude/skills` scenario is not asserted separately (test/install.test.js:384-392).
- W3: `.atl/.skill-registry.cache.json` and `.atl/skill-registry.md` show unstaged modifications (large diff in skill-registry.md); unrelated to this change. Keep them out of the commit. Also untracked changes `trim-workflow-skill-persistence/` and `validate-store-in-doctor/` are present; keep out of this PR.
- W4: Not verified by me: claims against the official docs (paths .github/skills, .claude/skills, .agents/skills; personal ~/.copilot/skills). I had no web access; docs cite 2026-09-25 as checked by the author. The docs state userScope is deliberately unsupported, consistent with the design.
### SUGGESTION
- S1: `install copilot --user` prints the full unverified warning before failing; harmless but noisy.
- S2: docs.test.js:98 VOSEO regex is a small word list, so it is a weak guard; manual scan was clean.
- S3: test/install.test.js:261 comment: the spec/design says the notice ends `kimi, copilot`; it holds for the antigravity install case (real copilot install lists antigravity instead). Consistent, just be aware.

## Verdict: PASS WITH WARNINGS
