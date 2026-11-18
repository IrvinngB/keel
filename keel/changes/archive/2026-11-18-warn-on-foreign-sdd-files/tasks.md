# Tasks: Warn on foreign SDD files

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Estimated changed lines: ~290 · Delivery strategy: ask-on-risk. Single PR; if over 400, split PR1 names/callers, PR2 scan/docs. Commits: test, feat, docs. No adapters regeneration (bin/sdd only).

## Phase 0: Precondition
- [x] 0.1 BLOCKER resolved by stacking (user approved 2026-09-25): branch `feat/warn-on-foreign-sdd-files` is cut FROM `feat/antigravity-support` (PR #10, not merged yet); this PR targets that branch and GitHub retargets it to main when #10 merges.

## Phase 1: RED tests (test/install.test.js, test/docs.test.js)
- [x] 1.1 Edit test ~204-212: `sdd-workflow`, new wording regex, ban `/stale|remove|earlier install|likely/i`.
- [x] 1.2 Test: only `.opencode/agent/stack-detector.md` is `project installed`.
- [x] 1.3 Test: only `.opencode/agent/sdd-foo.md` is not installed.
- [x] 1.4 Test: `~/.claude/skills/{sdd-init,sdd-workflow}`, `install opencode --user` warns only `sdd-workflow`.
- [x] 1.5 Test: 12 existing agent files print 10 names plus `… and 2 more`.
- [x] 1.6 Test: fresh HOME prints no replace/overwritten line.
- [x] 1.7 Test: `opencode.json` key `sdd-apply` warns on install and in doctor.
- [x] 1.8 Test: JSONC `opencode.json` gives one note, status 0.
- [x] 1.9 Test: `commands/` beside `command/` prints `unverified`; `.claude/skills/sdd-workflow` prints `info:`.
- [x] 1.10 Test: `--dry-run` with `agent/sdd-apply.md` prints `would be replaced`, HOME unchanged.
- [x] 1.11 Test: opencode key plus antigravity `~/.agents/skills/sdd-workflow` gives two doctor agent lines.
- [x] 1.12 Test: foreign `opencode.json` bytes and status unchanged, warning printed.
- [x] 1.13 Regression guard, NOT RED (passes today): Keel-only files give no collisions header.
- [x] 1.14 test/docs.test.js: docs recommend `--project`, no banned words, CHANGELOG Unreleased entry.
- [x] 1.15 `npm test`: 1.1-1.12 and 1.14 fail for the right reasons. Commit `test:`.

## Phase 2: Core (bin/sdd)
- [x] 2.1 Add `keelNames(id, scope)` (recursive walk, Map cache, `[]` if missing) and `skillNames`.
- [x] 2.2 Add `hasKeelEntry`; replace `hasSddEntry` in `installedInProject`.
- [x] 2.3 Switch `skillsDirNotices`, doctor `seen`, `seenUser` to `skillNames`.
- [x] 2.4 Rewrite user and project "twice" warnings, neutral wording.
- [x] 2.5 Add `capList`; `preexisting()` before `copyTree`, also under `--dry-run`.
- [x] 2.6 Delete `overwritten` line at 304, keep dry-run note; print replace list only if N>0.
- [x] 2.7 Add `collisions()`: `opencode.json(c)` keys via `JSON.parse` (one note on failure), plural dirs, `info:` skills; comment marks paths UNVERIFIED.
- [x] 2.8 Print collisions on install; doctor section only if items exist, never starting `  <id> `.
- [x] 2.9 `npm test` green, including dry-run (~241-260) and doctor finders (~116, ~262-271). Commit `feat:`.

## Phase 3: Docs
- [x] 3.1 docs/install.md 44-46: replace "twice" wording, advise `--project` when another toolkit is global, opencode UNVERIFIED. No `## `, no fence.
- [x] 3.2 docs/es/instalacion.md ~49: same, neutral Spanish, no voseo.
- [x] 3.3 CHANGELOG.md Unreleased entry.
- [x] 3.4 `npm test` green (parity). Commit `docs:`.
