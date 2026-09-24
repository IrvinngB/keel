# Working on Keel

Keel is developed with Keel. These rules apply to every coding agent in this repo.

## Spec-driven changes

- SDD here means Keel's own pipeline. Do not use other SDD workflows or stores in
  this repo (for example Gentle AI's `/sdd-new` / `/sdd-ff`, OpenSpec's `/opsx:*`,
  or artifacts kept only in a memory server).
- Artifacts live in `keel/` (files backend) and are committed together with the code
  they describe, so every PR shows its proposal, spec, design and tasks.
- Start a change with the `new` command for anything that changes behavior: a phase or
  command contract, the CLI, the agent registry, a persistence backend, a hook.
- No change needed for typo fixes, docs-only edits, dependency-free chores and
  release commits.

## Which Keel runs the pipeline

Use the **released** Keel (the installed plugin or `sdd` from npm), not this working
copy. Like a compiler built with its previous release: a half-edited phase contract
must not break the pipeline that is reviewing it. After a release, update the
installed plugin before starting the next change.

## Code rules

- Edit `core/`, never `adapters/`: regenerate with `node bin/sdd build` and commit the
  result as a separate `build: regenerate adapters` commit.
- `npm test` must pass. A bug fix in `bin/sdd` comes with a test that fails without it.
- Zero runtime dependencies; `core/` stays tool-agnostic. See
  [CONTRIBUTING.md](CONTRIBUTING.md) for the full list.
- Conventional Commits.

## Commit guard

Run `node bin/sdd guard install` once per clone. It blocks commits while a change in
`keel/changes/` has unchecked tasks; bypass deliberately with
`SDD_ALLOW_COMMIT=1 git commit ...` for WIP or chained-PR boundaries.

## Local agent installs

Install Keel for your agent with `--user` scope while working on this repo, so
`sdd install` does not write agent blocks into this tracked `AGENTS.md`.
