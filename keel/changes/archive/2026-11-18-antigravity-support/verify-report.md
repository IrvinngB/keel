# Verification Report: Experimental Antigravity support

## Completeness
| Task | Status |
|------|--------|
| 1.1-1.13 RED tests | done (verified by executing npm test, 55/55) |
| 2.1-2.3 Core | done (bin/sdd diff is only the doctor width change) |
| 3.1-3.7 Docs | done |
| 4.1 Build | done (`git status --porcelain adapters/` = `?? adapters/antigravity/` only) |
| 4.2 build commit | unchecked (expected) |
| 5.1 feature commits | unchecked (expected) |
| 5.2 manual gate | unchecked (expected, must stay open) |

## Execution Evidence
- `npm test` -> 55 tests, 55 pass, 0 fail, exit 0.
- `node bin/sdd build` then `git status --porcelain adapters/` -> only `?? adapters/antigravity/`.
- Isolated HOME + temp git repo runs (real home never touched):
  - `--dry-run`: tree has 0 entries, prints unverified warning + "would copy" lines.
  - `--project` first run: only `.agents/skills` and `AGENTS.md` (plus `.git/hooks/pre-commit` guard, excluded by spec); rerun prints "block already up to date".
  - codex install then antigravity install: both blocks intact (lines 1-41 and 43-83), rerun idempotent; codex notice says "shared with opencode, gemini, kimi, antigravity".
  - `sdd next` with both blocks: `run $sdd-continue demo` (Codex form).
  - `sdd doctor`: id column aligned to 11 chars; warning line "unverified: detect, userSkillsDir, userContextFile, invoke, subagents".
  - `--user`: `~/.gemini/GEMINI.md` byte-identical (cmp, CRLF+LF content); only `~/.gemini/config/` and `~/.gemini/AGENTS.md` created; no `~/.agents`, no `~/.gemini/antigravity-cli`.
  - Malformed marker (begin without end): fails with "Nothing was written", AGENTS.md unchanged, no `.agents`.
  - Double discovery: with `~/.gemini/antigravity` + sdd-x in both `~/.agents/skills` and `~/.gemini/config/skills`, doctor warns naming "Antigravity"; both copies still present.

## Spec Compliance Matrix
Tests in test/install.test.js unless noted (test names per apply-progress rows 1.1-1.13; suite green).
| Requirement | Scenario | Implementation | Test / command | Status |
|-------------|----------|----------------|----------------|--------|
| Registry entry and Experimental | Status | build/manifest.json row | task 1.1 test; doctor output has no "Tested" (manual) | COMPLIANT |
| Registry order | Output unchanged | row after kimi | task 1.2 test; manual `sdd next` -> `$sdd-continue` | COMPLIANT |
| Project install | Install and re-run | manifest + adapters/antigravity | task 1.3 test; manual twice | COMPLIANT |
| Project install | Coexistence | idem | task 1.4 test; manual codex+antigravity | COMPLIANT |
| Project install | Malformed marker | idem | task 1.5 test; manual | COMPLIANT |
| Unverified fields and provenance | Declared and surfaced | manifest notes | task 1.6 test; manual doctor/install output | COMPLIANT |
| Shared-skills reader reporting | Notice and warning | codex notes, doctor | tasks 1.7, 1.8 tests; manual | COMPLIANT |
| Detection does not overlap Gemini | Detection | detect dirs, empty projectMarkers | task 1.9 test; manual: bare `.gemini` gives `tool —` in an earlier doctor, `.gemini/antigravity` gives `tool found` | COMPLIANT |
| User-scope install | User install | userSkillsDir/userContextFile | task 1.10 test; manual | COMPLIANT |
| Dry run | Dry run | existing flag | task 1.11 test; manual | COMPLIANT |
| Documentation parity | Docs | README, docs/install.md, es pair, CHANGELOG | test/docs.test.js (task 1.12); manual checks below | COMPLIANT |

Note: 11 scenarios in the spec map 1:1 to the rows above (Requirement 2 has 1, Requirement 4 has 2 statements). The apply-progress file lists tests by task id, not by full test title; I did not re-derive individual test titles, only the green suite plus manual reproduction.

## Additional checks
- (a) No doc calls Antigravity Tested/Verified. README.md:138 says "could not be tested" (history, not a status claim). Headless note is scoped history in docs/install.md:30 and docs/es/instalacion.md:32, dated 0.3.0, explanation marked unproven.
- (b) Parity: README 10 `##` / 16 fences in both; install docs 4 `##` in both (no fences).
- (c) CHANGELOG diff touches only the Unreleased block; no 0.3.0 line changed.
- (d) `git diff bin/sdd`: only `idw` computation and `padEnd(idw)`.
- (e) Checked boxes all backed by evidence; 4.2/5.1/5.2 unchecked.
- (f) TDD table: every new test (1.1-1.13) has a RED failure reason, most for the right reason (unknown tool / missing row). 1.12 and 1.13 explained. Phase 2/3 written after full RED run (17 failures).
- (g) Budgets: spec 585 words, design 760 words (as trimmed).

## Issues
### CRITICAL
- none
### WARNING
- Doctor prints the CLI-user double-discovery warning even when the user deliberately keeps both copies; documented as accepted open question in design. Not a spec violation.
- Task 1.13/2.3 are flagged ASSUMPTION in tasks.md; the doctor spacing shifts by one space for all agent lines (behavior change outside the registry). Confirm the user accepted it.
- The spec's "malformed marker" was reproduced with real marker syntax (`<!-- keel:begin agent=antigravity -->`); a first attempt with wrong syntax succeeded, which is expected, not a defect.
### SUGGESTION
- apply-progress cites tests by task id; adding exact test titles would make traceability audit-able without running.
- README.md:138 wording "could not be tested" contains the word "tested"; harmless but could trip a naive grep-based reviewer.
- `.atl/` drift is pre-existing and unrelated; keep it out of the commits.

## Verdict: PASS WITH WARNINGS
Counts: CRITICAL 0, WARNING 3 (informational), SUGGESTION 3. The change can be archived only after the manual gate 5.2 (real Antigravity session) and commits 4.2/5.1 are done; per the design, Antigravity stays Experimental until then.
