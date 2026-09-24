## What and why

<!-- One or two sentences. Link the issue: Closes #123 -->

## Checklist

- [ ] `node bin/sdd build` succeeds and the regenerated `adapters/` is committed
- [ ] No edits made by hand under `adapters/`
- [ ] `core/` stays tool-agnostic (no agent-specific syntax or paths)
- [ ] `CHANGELOG.md` updated under `Unreleased` (if user-visible)
- [ ] Commits follow Conventional Commits
- [ ] Under ~400 changed lines excluding `adapters/`, or split into stacked PRs
