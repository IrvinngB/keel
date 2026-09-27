# Tasks: Add GitHub Copilot support

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Estimated changed lines: ~255 review lines (excluding generated `adapters/`) · Delivery strategy: ask-on-risk

Single PR. Strict TDD: RED, GREEN, then regenerate, then verify.

## Phase 1: RED tests

- [x] 1.1 `test/install.test.js`: change the :261 assertion to end `(shared with opencode, codex, gemini, kimi, copilot)`.
- [x] 1.2 `test/install.test.js`: row tests (`/sdd-spec`, exact `unverifiedFields`, docs URLs, date, no `install.user`, index = antigravity+1, `next` for codex+copilot and copilot alone).
- [x] 1.3 `test/install.test.js`: install tests (only `.agents` + `AGENTS.md`, byte-identical rerun, `.git/hooks/pre-commit`, coexistence with codex/kimi/antigravity in both orders, malformed marker writes nothing).
- [x] 1.4 `test/install.test.js`: `--user` fails `copilot has no user install target` with HOME untouched; `--dry-run` leaves the tree unchanged and prints the no-native-commit-hook line.
- [x] 1.5 `test/install.test.js`: `unverified:` line on install and doctor; doctor line `tool n/a · project installed · skills in .agents/skills · AGENTS.md: block present`; codex notice lists copilot; Keel name in `.github/skills` warns, other names silent.
- [x] 1.6 `test/docs.test.js`: Copilot Experimental and never Tested in EN+ES, no voseo, CHANGELOG Unreleased mentions Copilot.
- [x] 1.7 Run `npm test`; confirm the new tests fail for the right reason.

## Phase 2: GREEN (manifest)

- [x] 2.1 `build/manifest.json`: add the `copilot` row (data only) after `antigravity`, before `generic`, per design Interfaces. No edits to `bin/sdd` or `build/generate.js`.

## Phase 3: GREEN (docs and steering)

- [x] 3.1 `README.md` and `docs/es/README.md`: install line, table row `(6)`, footnote.
- [x] 3.2 `docs/install.md` and `docs/es/instalacion.md`: `## GitHub Copilot` section, same `##` headings in both, no code fences; add Copilot to the reader sentences (:38/:40) and block sentences (:57/:62).
- [x] 3.3 `CHANGELOG.md`: Unreleased entry.
- [x] 3.4 `keel/steering/product.md:48` status line and `keel/steering/structure.md:13` adapters list.

## Phase 4: Regenerate

- [x] 4.1 Run `node bin/sdd build`, which creates `adapters/copilot/` (32 `SKILL.md` plus `AGENTS.block.md`). Do this as its own step.
- [x] 4.2 `git diff --stat adapters/`: only `adapters/copilot/` changed.

## Phase 5: Verify

- [x] 5.1 `npm test` fully green (parity, doctor width, no-collision guards).

## Commit plan

- `test: add copilot agent install and docs tests`
- `feat: add GitHub Copilot agent row`
- `docs: document GitHub Copilot support`
- `build: regenerate adapters`
- `chore: record the add-copilot-support change`

No AI attribution.

## Phase 6: Manual gate

- [ ] 6.1 In an installed repo, run `/sdd-init` then `/sdd-new demo` in a real Copilot session in VS Code and in Copilot CLI. Confirm the `/sdd-*` skills load. Record version, date and result in the `docs/install.md` Copilot section and the verify report. Status stays Experimental.
