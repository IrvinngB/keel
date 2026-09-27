# Tasks: Trim persistence docs out of the sdd-workflow skill (PR1)

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Estimated changed lines: about 260 excluding adapters/, plus about 16 regenerated files · Delivery strategy: ask-on-risk

PR1 is one PR; the PR1/PR2 split exists for verification, not size.

## Phase 0: Precondition
- [x] 0.1 BLOCKING (orchestrator ticks): PR #10 merged; rebase over PR #11 if merged (doctor overlap); regenerate adapters LAST after resolving build/manifest.json conflicts.

## Phase 1: RED tests (run each; must fail for the right reason)
- [x] 1.1 Create test/build.test.js, in-process: invalid `persistence_docs` value errors naming the agent; mixed shared-dir group errors naming both; `side-files` without `persistenceDocsVerified` errors.
- [x] 1.2 test/build.test.js: inline doc order unchanged; forced side-files gives 3 side docs and FEWER words than the same build forced inline; load rule present in every mode.
- [x] 1.3 test/build.test.js: GUARD, no `persistence/` in committed adapters.
- [x] 1.4 test/install.test.js, real CLI, isolated HOME: missing doc warns; inline doc silent; healthy side file silent; claude/generic never checked; exit code 0; healthy output byte-identical.

## Phase 2: GREEN implementation
- [x] 2.1 build/generate.js: `fail` throws; `require.main === module` block catches, cleans BUILD, prints the same `generate: ERROR:` line, exits 1 (blast 1).
- [x] 2.2 build/generate.js: `ctx.persistence` becomes `[{name,text}]`; `skillBody` (:283,:316) returns `{body,side}`; `emitAgent` writes side files (blast 2).
- [x] 2.3 build/generate.js: `validateRegistry` (flag and verified gate), `validateSkillsInstall` (shared-dir agreement); export `skillBody`, `validateRegistry`, `loadCtx` (blast 3). All agents stay `inline`.
- [x] 2.4 core/persistence/interface.md §Selection: the exact load-rule text from design; core/orchestrator.md:54-59 and core/commands/init.md:13 point to it (blast 4).
- [x] 2.5 bin/sdd: doctor backend-doc check after `round-trip` lines when `!bad.length`; warning line per design; exit 0 (blast 6).
- [x] 2.6 Run `npm test`: Phase 1 tests now pass.

## Phase 3: Integration
- [x] 3.1 Test: `node bin/sdd build` (spawns generator, bin/sdd ~460) exits 0 on success and 1 on a forced generator error, with the `generate: ERROR:` line.
- [x] 3.2 Confirm test/install.test.js:239-259 and `keelNames().files` tolerate new `persistence/*.md` names; adjust only if needed (blast 7).
- [ ] 3.3 Commit `test`, then `feat` (generator, core, doctor).

## Phase 4: Docs
- [x] 4.1 README.md:218 and docs/es/README.md:228 layouts (keep `## `/fence parity); CONTRIBUTING.md:39; keel/steering/structure.md (blast 5).
- [x] 4.2 CHANGELOG.md Unreleased: mechanism, gate, load rule, doctor check; NO saving claimed.
- [ ] 4.3 Commit `docs`.

## Phase 5: Regenerate and close
- [x] 5.1 `node bin/sdd build`; commit `build: regenerate adapters` (about 16 files); `git status --porcelain adapters/` empty.
- [ ] 5.2 Commit `chore` for keel/ artifacts. Leave this change OPEN: do NOT archive until PR2.

## Follow-up PR2 (not part of this apply)
- Session in real Claude Code reading `persistence/sqlite.md` from the skill Base directory, then flip claude to `side-files`.
- Record `persistenceDocsVerified` with date, Claude Code version, before/after `wc -w`.
- If it fails, drop only `template.md`. Archive after PR2.
