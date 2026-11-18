# Verification Report: trim-workflow-skill-persistence (PR1)

## Completeness
| Task | Status |
|------|--------|
| 0.1, 1.1-1.4, 2.1-2.6, 3.1, 3.2, 4.1, 4.2, 5.1 | done |
| 3.3, 4.3, 5.2 (commits) | open, maintainer commits (WARNING, expected) |
| PR2 (flip claude) | out of scope, change stays OPEN |

## Execution Evidence
- `npm test` -> 116 passed, 0 failed, exit 0.
- `npm run build` and a symlinked `bin/sdd build`: adapters byte-identical before/after (deterministic, 18 files differ from main, wording only).
- Doctor vs `git show main:bin/sdd` in temp repos (isolated HOME): healthy inline, side-file present, claude-only: output IDENTICAL, exit 0 in both. Missing doc: exactly one added line `backend doc  warning: no sqlite doc in .agents/skills/sdd-workflow — run sdd install opencode (...)`, exit 0.
- Mutations (copy of repo):
  - remove doctor call: 2 tests fail. OK
  - side-files keeps all docs inline: fails. OK
  - drop verified gate / shared-dir agreement / enum check: each fails its test. OK
  - `process.exit(1)` -> `exit(0)`: build-error test fails. OK
  - drop `for (const d of side) write(...)` in emitAgent: ALL TESTS STILL PASS (see WARNING 1).

## Spec Compliance Matrix
| Requirement | Scenario | Implementation | Test | Status |
|---|---|---|---|---|
| Registry flag | Invalid value | generate.js validateRegistry | build.test "invalid persistence_docs" | PASS |
| Registry flag | "Only claude MUST be side-files" | no agent flipped (PR1 by design) | GUARD test | PASS for PR1 (deferred PR2) |
| Shared dir agrees | Mixed group | validateSkillsInstall | build.test "sharing the skills dir" | PASS |
| Inline output | Inline agent | 5 neutral SKILL.md md5-identical; diffs vs main are wording only; no sdd-workflow/persistence dirs (only generic core/persistence) | GUARD test | PASS |
| Side-files output | Flagged agent (files on disk) | skillBody split OK; emitAgent write loop untested | in-process skillBody test only | UNTESTED for emit wiring (WARNING 1) |
| Side files travel | Both scopes | copyTree recursive, unchanged | none (no side-files agent) | UNTESTED, deferred to PR2 (WARNING 2) |
| One load rule | Every mode | interface.md Selection; orchestrator/init pointers | build.test rule test (inline, side-files, generic adapters) | PASS |
| Verified before side-files | Unrecorded | validateRegistry | build.test | PASS |
| Build integrity | Rebuild | verified | manual | PASS |
| Test coverage | Dropped side files | skillBody covered | emitAgent not | see WARNING 1 |
| Missing doc warning | neither inline nor beside | bin/sdd backendDocWarnings | install.test warn | PASS |
| Missing doc warning | Doc inline / Files or none | same | install.test silent tests | PASS |
| Warn, never fail | exit 0, other sections | said() only | install.test | PASS |
| Silent when healthy | Side file present | byte-identical vs main (manual) and inline vs side (test) | yes | PASS |
| No false warnings | claude / not installed / unknown store | method copy only, `!bad.length` | yes | PASS |
| Doctor test coverage | Check removed | mutation confirmed | yes | PASS |

## Issues
### CRITICAL
- None.
### WARNING
1. build/generate.js:~340 (`for (const d of side) write(...)`): removing it leaves `npm test` green. Spec "Dropped side files" is only covered at skillBody level, not for files written by emitAgent. Add a test that runs emitAgent/generate with a forced side-files row (or defer explicitly to PR2 and note it).
2. Side files travel (both scopes) has no test; no agent is side-files. Cover in PR2.
3. Tasks 3.3/4.3/5.2 unchecked: `sdd guard` will block commits; use SDD_ALLOW_COMMIT=1 or tick after committing.
4. Doctor warning line hint is `agents[0]` (opencode) plus the group list; fine, but the "run sdd install" text is only loosely asserted (regex stops at `run sdd install `).
### SUGGESTION
- core/orchestrator.md:55-56: rewrap left one over-long line ("found), addressing artifacts ... any mapped"); cosmetic.
- core/persistence/interface.md rule says interface.md/files.md are "part of this workflow", which is not literally true for generic installs (they live in .sdd/core/persistence/). Harmless since the rule lists that path, but slightly imprecise.
- Load rule coherence: for agents that never see side files (all of them in PR1) the rule resolves via "a section of this workflow", so behavior is unchanged; fallback "run sdd install and stop" is safe.
- Docs: README.md and docs/es/README.md both 16 fences and 10 `##`, same as main; CHANGELOG makes no saving claim ("no size saving is claimed yet"). Design listed README:218 as PR2 but a PR1 paragraph was added to both in parity; acceptable.
- `sdd --version` is not a command (unrelated).
- `require.main === module` guard: `npm run build`, `node bin/sdd build`, and symlinked bin all work; exit 1 preserved (test-mutation verified). Tests use path.join and cp to tmp dir, no Windows-hostile constructs seen (not executed on Windows).

## Verdict: PASS WITH WARNINGS
