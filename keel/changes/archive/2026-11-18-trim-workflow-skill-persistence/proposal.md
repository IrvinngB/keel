# Proposal: Trim persistence docs out of the sdd-workflow skill

## Intent
Every `/sdd:*` command loads `sdd-workflow` first (3325 words; claude 3290). Persistence docs are 57% of it; `sqlite` + `mcp-generic` + `template` (856 words, 26%) are rarely needed yet paid on every command.

## Scope

### In Scope
- Keep `interface.md` + `files.md` inline; emit the rest as `skills/sdd-workflow/persistence/*.md` side files.
- Per-agent manifest flag `persistence_docs: inline | side-files`, default `inline`.
- Load-path wording in `core/orchestrator.md:54-59`, `core/persistence/interface.md`, `core/commands/init.md`.
- `sdd doctor`: the configured `artifact_store` doc (both halves of `files+sqlite`) resolves in the installed skill dir.
- Docs: README.md:218, docs/es/README.md:228, CONTRIBUTING.md:39, keel/steering/structure.md:12, CHANGELOG.

### Out of Scope
- Persistence semantics, atomic writes, contract tests, SQLite history.
- Generic adapter (already ships `.sdd/core/persistence/`).

## Capabilities

### New Capabilities
- `workflow-skill-packaging`: inline vs side-file docs, per-agent flag, load path.
- `doctor-backend-doc-check`: doctor resolves the configured backend doc in the installed skill.

### Modified Capabilities
- None (`keel/specs/` is empty).

## Approach
- `build/generate.js`: `skillBody` inlines interface + files only for `side-files` agents; `emitAgent` writes side files; `copyTree` already installs them.
- **Reachability gate (task 1, open):** per tool, prove the agent reads a skill-relative file. opencode: `opencode debug skill` + a session; others: docs evidence or a manual session. Only verified agents flip to `side-files`.

## Slicing (open decision)
- **PR1:** `template.md` side-filed (-141 words), flag, wording, doctor check; opencode first.
- **PR2:** `sqlite` + `mcp-generic` for verified agents (-856 total).
- Each PR regenerates up to 6 `SKILL.md` + 18 new files in a separate `build: regenerate adapters` commit.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `build/generate.js`, `build/manifest.json` | Modified | split, emit, flag |
| `core/orchestrator.md`, `core/persistence/interface.md`, `core/commands/init.md` | Modified | load path |
| `bin/sdd`, `test/` | Modified | doctor check |
| `adapters/*/skills/sdd-workflow/` | Modified/New | regenerated |

## Risks
Level: **Medium**.

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Agent cannot read side file; sqlite/mcp project loses its doc | Medium | `inline` default; flip verified agents only |
| Conflicts with #10/#11 | High | start after #10 merges |

## Rollback Plan
Revert the feature and build commits; reinstalling refreshes skills. Partial: reset an agent to `inline`, rebuild.

## Dependencies
- #10 (feat/antigravity-support) merged.

## Success Criteria
- [ ] Reachability recorded per tool.
- [ ] `side-files` agents shrink by the claimed `wc -w`; `inline` agents unchanged.
- [ ] Doctor test fails without the new check.
- [ ] `npm test` passes; `adapters/` clean after build.
