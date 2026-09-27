## Exploration: trim persistence docs out of the sdd-workflow skill

### Current State (CONFIRMED)
- `build/generate.js:249` reads every `core/persistence/*.md`; `skillBody` (283-291) joins conventions + orchestrator + all docs into ONE `SKILL.md`. `emitAgent` (314-317) writes only that file per skill: no side files are emitted for any agent.
- `emitGeneric` (432-445) copies all of `core/**/*.md` to `generic/core/`, so generic already ships every backend doc as separate files (installs to `.sdd/core`).
- `copyTree` (`bin/sdd:438`) is recursive and copies every file kind, so extra files next to a `SKILL.md` would install for free in every copy-based adapter.
- Skills dir per adapter (manifest.json): claude = plugin `skills/`; opencode, codex, gemini, kimi, antigravity = `.agents/skills` (project scope); user scope uses tool-specific dirs.
- `validateSkillsInstall` (209-223) only checks the skills dir maps and is unaffected by side files.
- The skill is 6 adapters (claude, opencode, codex, gemini, kimi, antigravity); the generic adapter has no skill.

### How docs are referenced today (CONFIRMED)
| Where | Text |
|---|---|
| `core/orchestrator.md:54-59` | "persistence interface (bundled with this workflow ... `.sdd/core/persistence/` in generic installs)"; `artifact_store` "selects the backend doc" |
| `interface.md:53,78,86-95` | backend table names `files.md`, `sqlite.md`, `mcp-generic.md`, `template.md` as sibling docs |
| `core/commands/init.md:5-15` | LOAD config, offer "any backend doc from the bundled persistence folder" |
| phases | none mention persistence docs (rg count 0 outside init) |

No phase or command uses a path: references are by bare filename, relative to a folder the agent is told is "bundled".

### Doctor (CONFIRMED)
- `bin/sdd:576-585`: reads `artifact_store`; a name is known if in the hardcoded list (`none`, `files`, `sqlite`, `mcp-generic`) or if `<name>.md` exists in the package `core/persistence` or `.sdd/core/persistence`. Then runs `probeBackend` per backend.
- It never inspects the skills dir, so it would not notice a missing backend doc in an installed skill.

### Self-checks and tests (CONFIRMED)
- `verify()` (~468-477): unresolved placeholders, nested backticks, `` `this document` `` outside generic. Moving docs does not touch these, but generated backend files need to pass the same walk.
- `test/install.test.js` only uses `SKILL.md` as a stub file (lines 209-377); no test asserts skill content or persistence text.

### Estimate
- UNVERIFIED (not re-measured): saved words per skill = sqlite 246 + mcp-generic 469 + template 141 = ~856, so 3325 to ~2470 (26%); claude 3290 to ~2434. Interface + files remain ~1030.
- Files changing in `adapters/`: 6 `SKILL.md` edits (modified) plus, if side files ship, 3 new files x 6 adapters = 18 additions. Generic unchanged.

### Approaches
1. **Side files beside SKILL.md** (`skills/sdd-workflow/persistence/{sqlite,mcp-generic,template}.md`), skill says "LOAD `persistence/<backend>.md` relative to this skill". Effort Low-Medium. Pro: `copyTree` and plugin dir already carry them. Con: relative-to-skill reachability is UNVERIFIED per tool; an agent may only receive the SKILL.md text (codex/kimi/antigravity behavior unproven).
2. **Reference the repo copy** only in generic. Not viable: non-generic installs have no `core/`.
3. **Status quo minus template.md** (keep sqlite and mcp-generic, drop only the authoring doc). Effort Low, saves ~141 words, zero reachability risk.

### Recommendation
Approach 1 with a fallback line, but only after verifying that each tool exposes the skill directory path to the agent. Otherwise approach 3 as a safe first slice. Doctor should gain a check that the configured backend's doc resolves in an installed skill.

### UNVERIFIED
- Whether each tool resolves relative paths from the skill dir, or exposes the skill path at all.
- Whether plugin caches for claude copy non-SKILL files (docs suggest yes; not tested here).
- Behavior of `artifact_store: none` (no doc needed; interface covers it) and `files+sqlite` (both docs must be reachable).

### Risks
- Sqlite/mcp-generic project silently loses its doc if the agent cannot read side files.
- `init` offers "any backend doc from the bundled folder": needs the new layout wording.
- Docs mentioning bundled layout: README.md:218, docs/es/README.md:228, CONTRIBUTING.md:39, steering/structure.md:12, CHANGELOG.md:102; docs/install.md has none.
- Wording in `orchestrator.md` and `interface.md` must change, which is a contract edit (needs the new-change pipeline).

### Ready for Proposal
Yes, provided the per-tool reachability check is scheduled as the first task.

Word count measured: ~590 (see caller's `wc -w`).
