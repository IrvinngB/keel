# Proposal: Warn on foreign SDD files

## Intent
`hasSddEntry` treats any `sdd*` entry as Keel's. A real opencode run called Gentle AI's `~/.claude/skills/sdd-*` a stale Keel copy. Install overwrites same-named files unchecked and always prints "overwritten".

## Scope

### In Scope
- Per-agent, per-scope helper listing Keel's adapter-tree names (includes `stack-detector`)
- 4 `hasSddEntry` callers match only Keel names; never call a foreign file a stale copy
- Read-only scan (unparsable JSONC: skip). `install`/`--dry-run`: same-named target-dir files "will be replaced (a previous Keel install or another tool's)". `doctor` (only if any): `opencode.json` `agent` keys, plural `commands/`/`agents/`, same-named skills in non-target read dirs (info)
- Print the files that existed before install
- Docs: recommend `--project` next to a global SDD toolkit, in `docs/install.md` (incl. lines 45-46) + `docs/es/instalacion.md`, README if it fits, CHANGELOG

### Out of Scope
- Renaming `sdd-*` to `keel-*` (breaking; later)
- Ownership marker (untested opencode behavior)
- Blocking, deleting or editing files (CONTRIBUTING rule 4)

## Capabilities

### New Capabilities
- `install-collision-warnings`: Keel-name detection, collision scan, install/doctor wording

### Modified Capabilities
- None (`keel/specs/` is empty)

## Approach
Exploration approaches 1, 2 and 4. Warn only. Wording: "same name as a Keel definition, possibly another tool's". Docs say which definition opencode picks is UNVERIFIED.

## Open Decisions
1. Doctor gets a separate collision section, one line per agent (resolved: Q5)
2. Scan also reports user-level `.claude/skills` name matches as info (resolved: Q6)

## Assumptions
- Clarify Q1-Q7 defaults (automatic mode)
- Printed list capped at 10 names, then "… and N more"
- Tests use `helpers.env()` isolated HOME; each fails on current code

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bin/sdd` | Modified | Helper, scan, callers, output |
| `test/install.test.js` | Modified | opencode, notices, doctor, dry-run |
| `docs/install.md`, `docs/es/instalacion.md` | Modified | Scope advice |
| `README.md`, `CHANGELOG.md` | Modified | Note, Unreleased |

## Risks
**Risk level: Low-Medium** (warn-only; output changes)

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conflict with `feat/antigravity-support` | High | Apply from `main` after it merges |
| Foreign file reusing a Keel name | Medium | Neutral wording |
| JSONC crashes scan | Medium | Skip; test |
| `--dry-run` writes | Low | Test |

## Rollback Plan
Revert the feature commits. No user files are written, so nothing needs cleanup.

## Dependencies
- `feat/antigravity-support` merged before apply

## Success Criteria
- [ ] Foreign `sdd-init` skill: no warning; `sdd-workflow`: warning
- [ ] `agent/sdd-apply.md`: install/dry-run "will be replaced", doctor silent; `agent.sdd-apply` key: doctor
- [ ] Install lists only files that existed before
- [ ] `npm test` passes, including docs parity
