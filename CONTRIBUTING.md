# Contributing to Keel

Thanks for helping. Keel is small on purpose: markdown contracts in `core/`, one
zero-dependency generator, one zero-dependency CLI. Contributions that keep it that
way are the easiest to merge.

## Before you start

- **Open an issue first** for anything beyond a typo or a one-line fix. A short
  discussion saves a rejected PR.
- **Agent support reports are contributions.** If you ran Keel inside an agent marked
  Experimental and it worked (or did not), open an *Agent support report* issue. That
  is how rows move from Experimental to Tested.
- Be kind. This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Keel is developed with Keel

Changes that alter behavior go through the pipeline, and their artifacts in `keel/`
are part of the PR. [AGENTS.md](AGENTS.md) has the rules, including which Keel version
runs the pipeline. Reviewers read the proposal and spec first, then the code.

## Setup

Requirements: Node.js 18+ and git. There is nothing to install.

```bash
git clone https://github.com/IrvinngB/keel && cd keel
node bin/sdd help
node bin/sdd build        # regenerate adapters/ from core/
```

## Where changes go

| You want to change | Edit | Never edit |
|--------------------|------|------------|
| A phase or command's behavior | `core/phases/`, `core/commands/` | `adapters/` |
| Artifact layout, envelope, guards | `core/conventions.md` | `adapters/` |
| Orchestrator routing | `core/orchestrator.md` | `adapters/` |
| A persistence backend | `core/persistence/` (start from `template.md`) | — |
| Support for a new agent | a row in `registry` in `build/manifest.json` | `core/` |
| A new output file format | a formatter in `build/generate.js` | — |
| CLI behavior | `bin/sdd` + a test in `test/` | — |

`adapters/` is generated. Hand edits are overwritten by the next build and CI rejects
a PR whose `adapters/` does not match `sdd build` output.

## The rules that keep Keel portable

1. **Core stays tool-agnostic.** No agent names, slash syntax or tool-specific paths in
   `core/`. Use the placeholders (`{{cmd:X}}`, `{{agent:X}}`, `{{skill:X}}`) and let the
   registry resolve them.
2. **Skill bodies stay invocation-neutral.** Write "phase `sdd-apply`" and
   "command `continue`", never `/sdd:continue` or `$sdd-continue`.
3. **Zero runtime dependencies.** `bin/sdd` and `build/generate.js` use only Node
   built-ins.
4. **Never delete user files.** Install and doctor may warn; they do not remove.
5. **Be honest about status.** Mark an agent `verified` only after checking its
   official docs, and say "Tested" in the README only after a real session. List
   anything inferred in `unverifiedFields`.

## Before opening a PR

```bash
npm test                            # node:test suite, zero dependencies
node bin/sdd build                  # must succeed (it runs a self-check)
git status --porcelain adapters/    # must be empty after committing the rebuild
```

Tests live in `test/` and run the real CLI against throwaway git repos with an
isolated `HOME`. A bug fix in `bin/sdd` comes with a test that fails without it. CI
runs the suite on Linux, macOS and Windows with Node 18 and 22.

Then:

- Commit the regenerated `adapters/` in the same PR as the `core/` change, as a
  separate `build: regenerate adapters` commit.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(cli): ...`,
  `fix(core): ...`, `docs: ...`, `build: ...`, `chore: ...`.
- Add a line under an `Unreleased` heading in `CHANGELOG.md` for user-visible changes.
- If you change `README.md`, `docs/install.md` or this file, update the Spanish version in
  `docs/es/` (a test checks that the structure matches).
- Keep PRs under roughly 400 changed lines, excluding `adapters/`. Split larger work
  into stacked PRs, the same rule Keel enforces on its users.

## Releasing (maintainers)

The version lives in `package.json`, `build/manifest.json` and
`.claude-plugin/marketplace.json`; a test fails if they disagree.

1. `npm version <patch|minor> --no-git-tag-version` bumps `package.json`, syncs the other
   fields and regenerates `adapters/`.
2. Date the `CHANGELOG.md` heading, commit `chore: release X.Y.Z`, open a PR, merge it.
3. Tag `main`: `git tag -a vX.Y.Z -m "Keel X.Y.Z" && git push origin vX.Y.Z`, then
   `gh release create vX.Y.Z --notes-file <the changelog section>`.
4. `npm publish` from a clean checkout of the tag. `prepublishOnly` runs the tests and
   refuses to publish if `adapters/` is stale.

## Reporting security issues

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## License

By contributing you agree that your contributions are licensed under the
[MIT License](LICENSE).
