# Tasks: Experimental Antigravity support

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Estimated changed lines: 280-350 (tests ~150, manifest ~25, docs ~120, CHANGELOG/steering ~10; adapters/ excluded) · Delivery strategy: ask-on-risk

Strict TDD: every behavior test is RED first and must fail for the right reason (missing row, not a typo). Install tests stay red until the build commit. Tests use `helpers.env()` (isolated HOME) and `helpers.repo()` (`git init`); `entries()` skips `.git`.

## Phase 1: RED tests (must-handle 1)
- [x] 1.1 test/install.test.js: Status (scenario 1): registry status `experimental`, displayName `Antigravity`, `fill(cmd,'spec')==='/sdd-spec'`, doctor output lacks "Tested". Fails: no row.
- [x] 1.2 test/install.test.js: Registry order (scenario 2): index equals `kimi`+1; setup `keel/changes/demo/proposal.md` with codex+antigravity blocks in both orders, `sdd next` prints `$sdd-continue`; antigravity alone prints `/sdd-continue`.
- [x] 1.3 test/install.test.js: Install and re-run (3): `--project` twice in an empty repo; `entries == ['.agents','AGENTS.md']`, one block, rerun prints "already up to date", tree snapshot equal.
- [x] 1.4 test/install.test.js: Coexistence (4): codex/kimi first, re-install, and reverse order; every block intact.
- [x] 1.5 test/install.test.js: Malformed marker (5): exit != 0, AGENTS.md unchanged, no `.agents`.
- [x] 1.6 test/install.test.js: Provenance (6): manifest lists the 5 unverified fields, both URLs, `2026-09-24`; install and doctor print "unverified: detect, ...".
- [x] 1.7 test/install.test.js: Readers (7): codex project install output matches `/shared with [^)]*antigravity/`.
- [x] 1.8 test/install.test.js: User double-discovery (8): with a detect dir present, `sdd-x` in `~/.agents/skills` and `~/.gemini/config/skills`; doctor warning names "Antigravity" and BOTH copies still exist (nothing deleted).
- [x] 1.9 test/install.test.js: Detection (9): only `~/.gemini` gives `tool —`; each of the three dirs alone is found.
- [x] 1.10 test/install.test.js: User install (10): existing `~/.gemini/GEMINI.md` stays byte-identical; output only at `~/.gemini/config/skills` and `~/.gemini/AGENTS.md`; no `~/.agents` and no `~/.gemini/antigravity-cli` created.
- [x] 1.11 test/install.test.js: Dry run (11): `--dry-run` in an empty repo; `entries == []`; stdout equals the exact expected "would copy" / "would append" lines and nothing else.
- [x] 1.12 test/docs.test.js: README, docs/install.md and es pairs contain Antigravity as Experimental, never Tested; 0.3.0 note scoped and marked unproven; CHANGELOG 0.3.0 line untouched.
- [x] 1.13 ASSUMPTION — user may prefer to accept the misalignment; if so drop 1.13 and 2.3. test/install.test.js: doctor id column width equals the longest registry id (11-char `antigravity` aligned).

## Phase 2: Core (GREEN)
- [x] 2.1 build/manifest.json: add `antigravity` row after `kimi`, before `generic`, exactly per design (must-handle 2).
- [x] 2.2 build/manifest.json:161: codex `notes` "also read" list gains Antigravity (4).
- [x] 2.3 ASSUMPTION (see 1.13). bin/sdd:440: replace `id.padEnd(9)` with width computed from the longest `AGENT_IDS` entry (3).

## Phase 3: Docs (must-handle 6-9)
- [x] 3.1 README.md: install-code-block line, `Experimental (5)` row, footnote; replace "not supported yet" (l.105-144).
- [x] 3.2 docs/es/README.md: mirror 3.1 with identical `## ` and fence counts.
- [x] 3.3 docs/install.md: rewrite `## Antigravity` (paths, CLI manual copy, scoped 0.3.0 history); add to "all read `.agents/skills`" list.
- [x] 3.4 docs/es/instalacion.md: mirror 3.3, same heading/fence counts.
- [x] 3.5 CHANGELOG.md: Unreleased/Added entry; 0.3.0 line untouched.
- [x] 3.6 keel/steering/product.md:48 (Experimental, docs only) and keel/steering/structure.md:13 (add antigravity to adapters list).
- [x] 3.7 Run `npm test`; docs parity passes.

## Phase 4: Build (must-handle 5)
- [x] 4.1 Run `node bin/sdd build`; `git status --porcelain adapters/` shows only the new tree.
- [x] 4.2 Commit `build: regenerate adapters` separately; afterwards `git status --porcelain adapters/` empty, `npm test` all green.

## Phase 5: Commits and gate
- [x] 5.1 Feature commits (no AI attribution): `test: add antigravity registry tests`, `feat: add experimental antigravity agent`, `docs: document experimental antigravity`; then 4.2. Use `SDD_ALLOW_COMMIT=1` at unchecked boundaries. (Actual: test, fix(cli) doctor width, feat(registry), docs, build.)
- [ ] 5.2 MANUAL GATE, do not mark done: a real Antigravity session (2.0/IDE and CLI) runs `--project` install, `/sdd-init`, `/sdd-new demo` through proposal, `--user` install; file an Agent support report. Only a later change may shrink `unverifiedFields` or print "Tested".
