# Proposal: Add GitHub Copilot support

## Intent
Copilot users cannot install Keel. Adapt wip commit e01cfff to Keel's conventions. Its row used a private `.github/skills` with non-neutral skill bodies.

## Scope

### In Scope
- `copilot` row in `build/manifest.json`, after `antigravity` and before `generic`
- `adapters/copilot/`, in a separate `build: regenerate adapters` commit
- Tests
- README, `docs/install.md`, `docs/es/README.md`, `docs/es/instalacion.md` (parity), CHANGELOG Unreleased, `keel/steering/product.md`

### Out of Scope
- User scope (not emitted in v1)
- `.github/agents`, prompt files, `copilot-instructions.md`

## Capabilities

### New Capabilities
- `copilot-agent`: row, shared-dir install, AGENTS.md block, guard, doctor

### Modified Capabilities
- None (`keel/specs/` is empty)

## Approach

| Field | Value |
|---|---|
| status | experimental |
| neutralSkills | true, installed once to `.agents/skills` |
| skillsRead | `.github/skills`, `.claude/skills`, `.agents/skills` |
| invoke / args | `/sdd-{name}` / "the user's arguments" |
| hooks / projectMarkers | false / `[]` |
| contextFile | `AGENTS.md` block |
| detect | `[]`: `~/.copilot` exists only for the CLI, so VS Code users would get a false result |
| unverifiedFields | invoke, subagents, detect, userScope (not emitted) |
| notes | three official doc URLs, checked 2026-09-25 |

- `readersOf(SHARED)` gains copilot, so the other shared-dir agents list it.
- `skillsDirNotices` warns when `.github/skills` or `.claude/skills` holds Keel-named skills.
- `installAgent` installs the commit guard (contextFile, no hooks, project scope, git repo).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `build/manifest.json` | Modified | row |
| `adapters/copilot/` | New | generated |
| `test/install.test.js` | Modified | cases |
| `README.md`, `docs/**`, `CHANGELOG.md`, `keel/steering/product.md` | Modified | docs, status |

## Risks
Level: **Low**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Skills discovered twice | Med | existing warning, manual gate |
| `dialect()` changes | Low | row order |

## Rollback Plan
Revert the row commit and the adapters commit. Users remove the `agent=copilot` block, plus `.agents/skills/sdd-*` if no other agent reads that directory.

## Dependencies
- None (PR #10 is already on main)

## ASSUMPTIONS (accepted defaults)
- No user scope: `~/.agents/skills` is shared with Gentle AI 3.x, and how Copilot de-duplicates identical names is undocumented.

## Success Criteria
- [ ] Rerun is idempotent; dry run writes nothing
- [ ] doctor shows copilot; it is among the shared-dir readers
- [ ] Coexists with the codex, kimi and antigravity blocks
- [ ] Guard is installed in a git repo
- [ ] `dialect()` is unchanged for existing repos
- [ ] `npm test` passes; under 400 review lines
- [ ] Manual gate tracked and left unchecked (a phase runs in VS Code and the CLI)
