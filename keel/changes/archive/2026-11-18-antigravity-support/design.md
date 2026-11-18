# Design: Experimental Antigravity support

## Technical Approach
Data-only: one `antigravity` row in `build/manifest.json`, shaped like `codex`, applying Resolved Q1-Q3, Q5. Order: tests (red) → row → `node bin/sdd build` → docs.

## Architecture Decisions

### Decision: No code change in `bin/sdd` or `build/generate.js`
**Choice**: none. **Alternatives considered**: fixing the false user-level warning (Q1); user accepted it.
**Rationale**: all paths are registry-driven:
- `AGENT_IDS = Object.keys(REGISTRY)` (bin/sdd:30) drives install usage, `dialect`, `doctor`.
- `readersOf` (73), `installedInProject` (212-221), `userSkillDirs` (118-123), `validateRegistry`/`validateSkillsInstall` (generate.js:182-223) read rows generically.
- Only hard-coded ids: `claude`, `generic`.

### Decision (for tasks): doctor misalignment
`id.padEnd(9)` (bin/sdd:440) misaligns columns for 11-char `antigravity`. Cosmetic; tasks picks: widen pad (with test) or accept.

### Decision: Row after `kimi`, before `generic`
**Alternatives considered**: beside `codex`. **Rationale**: `dialect()` returns the first installed agent in key order (bin/sdd:226-228); Codex+Antigravity repos keep `$sdd-continue`.

### Decision: Literal unverified names
**Choice**: `userSkillsDir`, `invoke`. **Alternatives considered**: prose labels. **Rationale**: match existing keys; doctor prints them verbatim.

## Interfaces / Contracts
```json
"antigravity": {
  "displayName": "Antigravity", "status": "experimental",
  "unverifiedFields": ["detect","userSkillsDir","userContextFile","invoke","subagents"],
  "notes": "Docs checked 2026-09-24 (https://antigravity.google/docs/skills/ and https://antigravity.google/docs/rules): project skills in .agents/skills (.agent/skills is legacy), user skills in ~/.gemini/config/skills (2.0 and IDE) or ~/.gemini/antigravity-cli/skills (CLI; Keel does not write it, copy by hand), skills invoked as /<skill-name>, context from AGENTS.md (global ~/.gemini/AGENTS.md). Not exercised in a real session; detect dirs come from one machine. A 0.3.0 headless test did not find skills in .agents/skills. Project scope installs skills once in the shared .agents/skills dir.",
  "detect": ["~/.gemini/antigravity","~/.gemini/antigravity-ide","~/.gemini/antigravity-cli"],
  "projectMarkers": [],
  "invoke": {"cmd":"/sdd-{name}","agent":"sdd-phase-{short}","skill":"{name}"},
  "neutralSkills": true, "skillsRead": [".agents/skills"],
  "args": "the user's arguments", "hooks": false,
  "emit": "<identical to codex emit: workflowSkill, phases/commands as skill, contextFile AGENTS.md/AGENTS.block.md>",
  "install": {"method":"copy",
    "project": {"root":".","map":[{"from":"skills","to":".agents/skills"}]},
    "user": {"root":"~","map":[{"from":"skills","to":".gemini/config/skills"}]},
    "contextFile": {"project":"AGENTS.md","user":"~/.gemini/AGENTS.md"}}
}
```

## Data Flow
    row ──> generate.js ──> adapters/antigravity/{skills/**,AGENTS.block.md}
    --project ──> .agents/skills (shared) + AGENTS.md block (+ guard if .git)
    --user ─────> ~/.gemini/config/skills + ~/.gemini/AGENTS.md

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `test/install.test.js`, `test/docs.test.js` | Modify | New tests first; docs say Experimental, never Tested |
| `build/manifest.json` | Modify | Row; codex `notes` "also read" list gains Antigravity |
| `adapters/antigravity/` | Create | Build: 32 `SKILL.md` (codex-identical) + `AGENTS.block.md`; separate `build: regenerate adapters` commit |
| `README.md`, `docs/es/README.md` | Modify | Line in install code block; `Experimental (5)` row + footnote; replace "not supported yet" |
| `docs/install.md`, `docs/es/instalacion.md` | Modify | Rewrite `## Antigravity` body: paths, CLI manual path, scoped 0.3.0 history (Q5); join "all read `.agents/skills`" list |
| `CHANGELOG.md` | Modify | Unreleased/Added; 0.3.0 untouched |
| `keel/steering/product.md`, `keel/steering/structure.md` | Modify | Experimental (docs only); adapters list |

Parity: `docs.test.js` counts `## ` headings and fences; edit within them, mirroring English in Spanish.

## Testing Strategy
`helpers.repo()` runs `git init`; `entries()` skips `.git`. User scope: mkdtemp cwd, HOME via `env()`. Install tests stay red until the build commit.
- **Status**: status, displayName, `fill(cmd,'spec')==='/sdd-spec'`; doctor lacks "Tested".
- **Order**: index = kimi+1; demo proposal, codex+antigravity (both orders) → `sdd next` prints `$sdd-continue`; alone `/sdd-continue`.
- **Install/rerun**: `entries == ['.agents','AGENTS.md']`, one block; rerun "already up to date", snapshot equal.
- **Coexistence**: codex/kimi first, re-install, reverse order: blocks intact.
- **Malformed**: exit ≠0, AGENTS.md unchanged, no `.agents`.
- **Provenance**: 5 fields, URLs, date; install and doctor print "unverified: detect, ...".
- **Readers**: codex output matches `/shared with [^)]*antigravity/`.
- **User double**: sdd-x in both user dirs: warning names "Antigravity"; nothing deleted.
- **Detection**: only `~/.gemini`: `tool —`; each dir alone: found.
- **User install**: `GEMINI.md` byte-identical; only the two paths.
- **Dry run**: `entries == []`; "would copy", "would append".

## Migration / Rollout
No migration required. Finish: `npm test`, clean `git status --porcelain adapters/`.

**Manual gate**: real session (2.0/IDE and CLI), scratch repo: `--project` install, `/sdd-init` listed, `/sdd-new demo` through proposal; `--user`, `~/.gemini/AGENTS.md` read? File an *Agent support report* (version, date). Only a later change may shrink `unverifiedFields` or print "Tested".

## Rollback & Reversibility
- No migrations or flag; Experimental label and warnings are the guardrail.
- Revert feature + build commits; install then fails "unknown tool".
- Leftovers harmless: shared `.agents/skills`; block parses (`scanBlocks` accepts any id); remove user files by hand. No data loss. Verify: `npm test`, no doctor antigravity line.

## Observability
- CLI only. Install always prints the unverified note; doctor too when detected/installed, plus double-discovery warnings.
- Success: support reports confirm skills load; no "silent no-op" issues.

## Open Questions
- [ ] Non-blocking: no `spec` command/skill; `sdd-spec` renders `/sdd-spec` is only testable as a string (real: `/sdd-new`, `/sdd-continue`, `/sdd-phase-spec`).
- [ ] Accepted: user-level "read twice" warning may be false for CLI users (#103).
