## Exploration: add-copilot-support

Limit: no shell, so wip commit e01cfff was NOT read. Its defects are taken from the brief (UNVERIFIED by me). Shape reference: build/manifest.json.

### Current State
- CONFIRMED: registry order is claude, opencode, codex, gemini, kimi, antigravity, generic. `AGENT_IDS` is `Object.keys(REGISTRY)` (bin/sdd:30).
- CONFIRMED: `dialect()` (bin/sdd:250) returns claude if `.claude`/`CLAUDE.md` exists, else the FIRST non-claude id where `installedInProject` is true, else generic.
- CONFIRMED: `installedInProject` (:240) ignores the shared `.agents/skills`; it counts only agent-specific dirs or that agent's own context block. Blocks use per-agent markers `keel:begin agent=<id>` (:38), so codex, kimi and antigravity blocks coexist in one AGENTS.md.
- CONFIRMED: `unverifiedNote` (:157) prints unverifiedFields plus notes on install.

### Registry fields (antigravity/codex shape)

| Field | Value | Status |
|---|---|---|
| status | experimental | inferred |
| neutralSkills | true | CONFIRMED |
| skillsRead | `.github/skills`, `.claude/skills`, `.agents/skills` | CONFIRMED (docs 2026-09-25) |
| install.project | skills to `.agents/skills` | CONFIRMED |
| emit | as codex: skills only | inferred |
| invoke.cmd | `/sdd-{name}` | VS Code CONFIRMED; CLI and JetBrains UNVERIFIED |
| args | "the user's arguments" | `$ARGUMENTS` unverified |
| hooks | false | inferred |
| detect | `~/.copilot` | UNVERIFIED |
| projectMarkers | `[]` (only plugin agents use them, :242) | CONFIRMED |
| notes | cite the three doc URLs plus a check date (rule 2) | required |

unverifiedFields: invoke, detect, subagents (plus contextFile if added). Drop `commandsLayout` (unimplemented); userScope is documented.

### Context block
| Option | Consequence |
|---|---|
| AGENTS.md block | Copilot reads AGENTS.md (CONFIRMED). Reuses the contextFile mechanism; shares the file via separate markers. Copilot sits last, so `dialect()` reports it only when no earlier agent has a block. |
| `.github/copilot-instructions.md` | Documented, Copilot-only, a distinct signal. Whether `contextFile` supports that path is UNVERIFIED. |
| none | `/sdd-*` syntax missing from context. |

Placing copilot before codex would change `dialect()` for projects using both.

### User scope
- `~/.copilot/skills`: Copilot-only, no collision. CONFIRMED in docs.
- `~/.agents/skills`: shared with codex. CONFIRMED in docs. Gentle AI 3.x writes `sdd-*` there (per maintainer), so `collisions()` (:390) would fire.
- `~/.claude/skills`: docs disagree (VS Code lists it, CLI omits it).
- Cross-dir dedup is undocumented (UNVERIFIED).

### Human check in a real session
- Skills in `.agents/skills` are discovered in VS Code and the CLI (an Antigravity test failed on that dir, cause unproven).
- `/sdd-new` runs; JetBrains invocation.
- The AGENTS.md block is read.
- No duplicates when `.claude/skills` and `.agents/skills` both hold Keel skills.

### Docs and tests
- CHANGELOG entry, README, docs/install.md, docs/es/README.md, docs/es/instalacion.md, test/docs.test.js parity. Drop "default skills mode".
- test/install.test.js (antigravity pattern): idempotent rerun, dry-run writes nothing, doctor line, coexistence with codex/kimi, shared-dir readers, no guard.
- Regenerate adapters in a separate commit.

### Risks
- Shared `.agents/skills` has no per-agent ownership; uninstall must not delete skills codex uses (check existing logic).
- Gentle AI collision on user scope.
- Row order changes `dialect()`.
- No real-session evidence, so status stays experimental.

### Ready for Proposal
Yes. Decide: context file, user scope target, row order.
