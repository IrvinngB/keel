# Apply progress: warn-on-foreign-sdd-files

Single batch, all phases. Commit tasks left to the orchestrator (1.15, 2.9, 3.4 stay unchecked: their tests are done, only the commits remain).

## Tasks done
0.1 (orchestrator), 1.1-1.14, 2.1-2.8, 3.1-3.3.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | test/install.test.js (doctor warns by name...) | integration | existing suite green before edit | fails: old text "the sdd skills twice", no `sdd-workflow` | pass | two dirs, banned-word check on the line | n/a |
| 1.2 | install.test.js (non-prefixed Keel agent file) | integration | yes | fails: `project —` instead of `project installed` | pass | paired with 1.3 | n/a |
| 1.3 | install.test.js (foreign sdd-prefixed agent file) | integration | yes | fails: `project installed` for `sdd-foo.md` | pass | paired with 1.2 | n/a |
| 1.4 | install.test.js (install opencode --user ...) | integration | yes | fails: old warning does not name `sdd-workflow` | pass | sdd-init present but not named | n/a |
| 1.5 | install.test.js (twelve pre-existing) | integration | yes | fails: no `notice: 12 existing file(s) will be replaced` line | pass | 10 names + `… and 2 more` | n/a |
| 1.6 | install.test.js (fresh target) | integration | yes | fails: `overwritten` line printed | pass | fresh target | n/a |
| 1.7 | install.test.js (opencode.json agent key) | integration | yes | fails: no `agent "sdd-apply"` warning, no doctor section | pass | non-Keel key `mine` not reported | n/a |
| 1.8 | install.test.js (JSONC) | integration | yes | fails: 0 notes, expected 1 | pass | status 0, no key warning | n/a |
| 1.9 | install.test.js (plural commands/ + info:) | integration | yes | fails: no collision line for opencode | pass | both item kinds in one line | n/a |
| 1.10 | install.test.js (--dry-run) | integration | yes | fails: no `would be replaced` notice | pass | dir and HOME snapshots unchanged | n/a |
| 1.11 | install.test.js (two agents) | integration | yes | fails: 0 collision lines, expected 2 | pass | see deviation 3 | n/a |
| 1.12 | install.test.js (foreign opencode.json) | integration | yes | fails: warning missing (bytes/status already held) | pass | bytes and status 0 | n/a |
| 1.13 | install.test.js (regression guard) | integration | yes | NOT RED: passes before and after (guard) | pass | n/a | n/a |
| 1.14 | test/docs.test.js (3 tests: EN, ES, CHANGELOG) | docs | yes | fails: no `another SDD toolkit`/`otro toolkit SDD`, no `same name as a Keel definition` | pass | EN + ES + changelog | n/a |

Note on RED for 1.4: the first run failed for the wrong reason (I used displayName `OpenCode`, real one is `opencode`, so the line was undefined). Fixed the test, re-ran, and it then failed on the missing name (right reason) before implementing.

Phase 1 run (before implementation): 14 new/changed tests failed for assertion reasons, 1 (guard) passed; docs 3 failed.

## Files changed
- bin/sdd: `keelNames`, `skillNames`, `keelEntriesIn`, `hasKeelEntry`, `capList` (removed `hasSddEntry`); `preexisting`, `collisions`; install prints replace notice + collisions; `skillsDirNotices(id, target, base, scope)`; doctor twice warnings, collisions section.
- test/install.test.js (modified ~204, +12 tests), test/docs.test.js (+3 tests).
- docs/install.md, docs/es/instalacion.md (rewritten paragraph, no new `##` or fence), CHANGELOG.md (Unreleased/Added).
- keel/changes/warn-on-foreign-sdd-files/tasks.md (ticks).

## Final `npm test`
70 tests, 70 pass, 0 fail (existing dry-run exact-output test and doctor-line finders green).

## git diff --stat (tracked)
CHANGELOG.md +8, bin/sdd 148, docs/es/instalacion.md 14, docs/install.md 13, test/docs.test.js +22, test/install.test.js +132: 307 insertions, 30 deletions (under the 400 budget). .atl/ modifications pre-existed and were not touched.

## Deviations
1. `info:` items (read-dir Keel-named skills) are shown only in the doctor section; install prints key and plural warnings plus the existing `skillsDirNotices` warning (which already covers read dirs) to avoid printing the same skill twice.
2. The doctor "twice" warnings list the union of Keel-named entries found in the duplicated dirs (as in design), not only names present in both dirs.
3. Test 1.11 expects three doctor lines (opencode, gemini, antigravity): creating `~/.gemini/antigravity` also makes gemini "found", and it reads the same `~/.agents/skills`. One line per agent holds.
4. Replace-list entries are paths relative to the install base (e.g. `.opencode/agent/sdd-apply.md`).
5. Test 1.9 exercises plural dir and `info:` through doctor (the design puts both in the doctor example); install output for plural dir is covered by code path only.
6. README/docs-es README sentence (design "if it fits") skipped: not named in tasks.md.

## Remaining
Commits (`test:`, `feat:`, `docs:`) by the orchestrator; tasks 1.15, 2.9, 3.4 to tick after committing.

## Review fixes

Spec/design wording refined: "non-target read-dir skills" now reads "read dirs that no registry agent installs into". A read dir is skipped as a collision source when it is SHARED or appears in any `REGISTRY[*].install[scope].map[].to`; for opencode only `.claude/skills` remains.

### RED evidence (run before touching bin/sdd)
| Finding | Test | RED result |
|---|---|---|
| 1 (false collisions) | `codex --user` + empty `~/.gemini` => no collisions section | FAIL: `collisions (` present (right reason) |
| 1b (project scope) | `codex --project` + empty `~/.gemini` | passes before and after (guard, not reproducible) |
| 3 | opencode.json `null` gets `has no agent object` note | FAIL: got the JSONC note |
| 3 | opencode.json with leading BOM still key-checked | FAIL: got the JSONC note |
| 2 (Windows) | no new test; existing tests assert '/' and now hold on every OS by construction | n/a |

### Changes
- `collisions()`: `written` set replaces the `dests.includes(d)` check for read dirs.
- Displayed paths built with `path.posix.join` (`preexisting`, plural dir label) and `path.relative(...).split(path.sep).join('/')` (opencode.json label); fs access unchanged. Windows not runnable here: reasoned from code only.
- opencode.json: BOM stripped; parse failure keeps the JSONC note; valid JSON that is not an object prints `note: <file> has no agent object; key check skipped.`; an object without an `agent` key stays silent (normal config). Directory or empty file hit the parse-failure note; never crashes.
- Test "doctor prints one collision line per agent..." renamed and now expects only `opencode` (the foreign sdd-workflow in `~/.agents/skills` is indistinguishable from Keel's own shared copy, so gemini/antigravity no longer report it).

### Manual check (isolated HOME)
- `codex --user` + `~/.gemini`: doctor prints no collisions section.
- Foreign `sdd-workflow` in `~/.claude/skills`: `install opencode --user` still warns (`opencode also reads .claude/skills ...`).

### Final `npm test`
74 tests, 74 pass, 0 fail.

### git diff --stat (tracked)
8 files, 376 insertions, 33 deletions (bin/sdd 155, test/install.test.js 167, test/docs.test.js 22, CHANGELOG 8, docs 14+13, .atl pre-existing).

### Accepted risks (not fixed)
- Review finding 4: no diagnostics for adapter tree.
- Review finding 5: no detection of older installs.
- Related, unfixed: `skillsDirNotices` (install-time) still says `opencode also reads .agents/skills, which holds sdd-workflow ...` after a Keel codex install, because opencode does not install into SHARED per its map. Same false-positive class as finding 1 but on the install warning; out of this brief's scope.
