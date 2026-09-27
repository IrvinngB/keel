# Design: Add GitHub Copilot support

## Technical Approach
Data-only: one `copilot` row, regenerated adapters, tests, docs. **No `bin/sdd` or `build/generate.js` changes.** Row-driven: `validateRegistry`, `validateSkillsInstall`, `emitAgent`, `agentBlock`; in `bin/sdd`: `installAgent` (dies `copilot has no user install target` before writing; guard when `cf && !r.hooks && project && hooksDir()`), `readersOf`, `skillsDirNotices`, `collisions`, `installedInProject` (block-only), `dialect`, doctor loop (`found === null` gives `tool n/a`).

## Architecture Decisions

### Decision: Row = antigravity minus user scope
**Choice**: drop `install.user` and `install.contextFile.user`.
**Alternatives considered**: private `.github/skills` (wip e01cfff): duplicate, non-neutral skills.
**Rationale**: Clarify Q3; `validateSkillsInstall` enforces the shared dir.

### Decision: After `antigravity`, before `generic`
**Rationale**: `dialect()` follows registry order; existing repos keep their next-command.

### Decision: `skillsRead` keeps three dirs
**Rationale**: Clarify Q4; warnings filter by Keel names only.

## Data Flow
```
row --sdd build--> adapters/copilot/{skills,AGENTS.block.md}
install --> assertMarkersSane -> copyTree(.agents/skills)
  -> skillsDirNotices -> upsertBlock(AGENTS.md) -> runGuard
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `build/manifest.json` | Modify | row (~55 lines) |
| `adapters/copilot/` | Create | 32 `SKILL.md` (1+16+15) + `AGENTS.block.md`; separate `build: regenerate adapters` commit; other adapters unchanged |
| `test/install.test.js` | Modify | ~90 new lines; line 261 gains `, copilot` |
| `test/docs.test.js` | Modify | ~25 lines |
| `README.md`, `docs/es/README.md` | Modify | install line, table row `(6)`, footnote (~6 each) |
| `docs/install.md`, `docs/es/instalacion.md` | Modify | `## GitHub Copilot` section, no fences (~18 each); Copilot in reader sentence (:38/:40) and block sentence (:57/:62) |
| `CHANGELOG.md` | Modify | Unreleased entry (~4) |
| `keel/steering/product.md`, `structure.md` | Modify | status line :48; adapters list :13 |

Estimate: ~255 review lines excluding `adapters/`; one PR.

## Interfaces / Contracts
```json
"copilot": {
  "displayName": "GitHub Copilot", "status": "experimental",
  "unverifiedFields": ["invoke", "subagents", "detect", "userScope"],
  "notes": "Docs checked 2026-09-25 (https://docs.github.com/en/copilot/concepts/agents/about-agent-skills, https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills, https://code.visualstudio.com/docs/copilot/customization/agent-skills): skills in .github/skills, .claude/skills, .agents/skills; context from AGENTS.md. userScope is not emitted: ~/.agents/skills is shared and duplicate handling is undocumented. Not Tested. Project skills installed once in .agents/skills.",
  "detect": [], "projectMarkers": [],
  "invoke": { "cmd": "/sdd-{name}", "agent": "sdd-phase-{short}", "skill": "{name}" },
  "neutralSkills": true,
  "skillsRead": [".github/skills", ".claude/skills", ".agents/skills"],
  "args": "the user's arguments", "hooks": false,
  "emit": "<identical to antigravity>",
  "install": { "method": "copy",
    "project": { "root": ".", "map": [{ "from": "skills", "to": ".agents/skills" }] },
    "contextFile": { "project": "AGENTS.md" } }
}
```

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Unit | row fields, `/sdd-spec`, exact `unverifiedFields`, URLs, date, no `install.user` | `node:test`, RED |
| Unit | index = antigravity+1; `next`: codex+copilot `$sdd-continue`, copilot alone `/sdd-continue` | RED |
| Integration | `repo()` install: only `.agents` + `AGENTS.md`; rerun byte-identical; `.git/hooks/pre-commit` exists | RED |
| Integration | coexistence (codex, kimi, antigravity, both orders); malformed marker writes nothing | RED |
| Integration | `--user` fails `copilot has no user install target`, HOME untouched | RED |
| Integration | `--dry-run` unchanged tree/hooks; line `GitHub Copilot has no native commit hook — would install the universal git guard.` | RED |
| Integration | `unverified: invoke, subagents, detect, userScope` on install and doctor; doctor `tool n/a · project installed · skills in .agents/skills · AGENTS.md: block present` | RED |
| Integration | codex notice `shared with [^)]*copilot`; Keel name in `.github/skills` warns "GitHub Copilot", other names silent | RED |
| Modified | line 261 ends `kimi, copilot)` | RED after row |
| Docs | pairs Experimental, never Tested, no voseo; CHANGELOG Unreleased | RED |
| Guards | parity, doctor width, Keel-only no-collision | green today |

## Migration / Rollout
No migration required. Status stays Experimental. **Manual gate** (unchecked task): in VS Code Copilot Chat and in Copilot CLI, run `/sdd-init` then `/sdd-new demo` in an installed repo; record version, date, result in `docs/install.md` Copilot section and the verify report.

## Rollback & Reversibility
- No migrations; no feature flag (unlisted row equals off).
- Revert the row commit and the adapters commit; `npm test` verifies.
- Users remove the `agent=copilot` block; shared `.agents/skills/sdd-*` stays if other agents read it. No data lost.

## Observability
- CLI only: install/doctor print `unverified:`; doctor shows the copilot line and double-discovery warnings.
- Success metric: manual gate passes in both hosts.

## Open Questions
- [ ] Copilot de-duplication across its three read dirs (manual gate).
