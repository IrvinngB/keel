# Proposal: Experimental Antigravity support

## Intent
Every doc says Antigravity (`agy`) is unsupported. Its official docs (antigravity.google/docs/skills, /docs/rules) now say project skills load from `.agents/skills` and context comes from `AGENTS.md`. Keel already writes both for Codex. Adding one registry row lets Antigravity users install Keel, and we only claim what the docs support.

## Scope

### In Scope
- `antigravity` row in `build/manifest.json`, same shape as Codex: `status: experimental`, project `skills -> .agents/skills` (shared), `phases.as`/`commands.as: "skill"`, `neutralSkills: true`, `hooks: false`, `contextFile: AGENTS.md`, `unverifiedFields` for every inferred field, notes citing the doc URLs and 2026-09-24
- Tests written first (Strict TDD) in `test/install.test.js`: project install, AGENTS.md shared with codex (separate blocks), doctor, user scope
- Docs updated together: README table, `docs/install.md`, `docs/es/README.md`, `docs/es/instalacion.md`, CHANGELOG Unreleased, `keel/steering/product.md` agent status
- Regenerated `adapters/` in a separate `build: regenerate adapters` commit

### Out of Scope
- Native workflows in `.agents/workflows`
- A new generator formatter
- Marking the row verified or "Tested" (CONTRIBUTING rule 5)
- Editing the 0.3.0 "Known limitations" entry, which stays as history

## Capabilities

### New Capabilities
- `agent-registry`: Antigravity row contract (paths, emission, detection, status honesty)

### Modified Capabilities
- None (`keel/specs/` is empty)

## Approach
Data-only change. `bin/sdd` reads rows generically, so it should need no code change. Antigravity becomes one more reader of `.agents/skills`: `readersOf(SHARED)` and the "shared with ..." notice (bin/sdd:325-327) pick it up automatically.

## Open Decisions (clarify gate)
1. **User scope path**: `~/.gemini/config/skills` (2.0/IDE), `~/.gemini/antigravity-cli/skills` (CLI), or both. Both means two copies for users of both products. On this machine `~/.gemini/config/skills` mirrors `~/.gemini/skills`, so Gemini user installs may load skills twice.
2. **`detect`/`projectMarkers`**: must be narrower than Gemini's `~/.gemini` (candidates: `~/.gemini/antigravity-cli`, `~/.gemini/config`). `projectMarkers: []` like Codex?
3. **`install.contextFile.user`**: `~/.gemini/AGENTS.md`? The docs list it, but nobody has tested it.
4. **`readersOf(SHARED)` +1**: no current test checks reader lists, so we expect to add tests, not update existing ones. Confirm in blast-radius.
5. **Contradiction**: `docs/install.md` and the CHANGELOG record a failed headless test with `.agents/skills`. Should the docs keep that record next to the new claim (hypothesis: that test ran at user level), or replace it?

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `build/manifest.json` | Modified | New `antigravity` row |
| `test/install.test.js` | Modified | Install/doctor tests for the row |
| `README.md`, `docs/es/README.md` | Modified | Agent table |
| `docs/install.md`, `docs/es/instalacion.md` | Modified | Install section and contradiction note |
| `CHANGELOG.md` | Modified | Unreleased entry |
| `keel/steering/product.md` | Modified | Agent status |
| `adapters/` | Regenerated | Separate commit |

**Review size**: ~150-250 lines without `adapters/` (row ~70, tests ~60-90, docs ~60-80). Under the 400-line budget.

## Risks

**Risk level: Low** (data-only, experimental label)

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wrong user path makes install a silent no-op | Medium | Decision 1; list the path in `unverifiedFields`; mention the other path in docs |
| Skills loaded twice via `~/.gemini/config/skills` | Medium | Decision 1; doctor warning |
| Claims go stale (product changes fast) | Medium | Record the date the docs were checked in notes |
| Spanish docs missed | Low | `docs.test.js` pairs README/es |

## Rollback Plan
Revert the feature commit and the `build: regenerate adapters` commit. Users who already installed can remove the `keel:begin agent=antigravity` block from AGENTS.md. Shared `.agents/skills` stays because other agents also read it.

## Dependencies
- Clarify decisions 1-3 before spec

## Success Criteria
- [ ] `sdd install antigravity --project` writes `.agents/skills` and its own AGENTS.md block; tests pass
- [ ] `npm test` passes; `git status --porcelain adapters/` is empty after the rebuild commit
- [ ] All six docs show Antigravity as Experimental; none says "Tested"
- [ ] Manual gate documented: one real Antigravity session runs a phase before the status can change
