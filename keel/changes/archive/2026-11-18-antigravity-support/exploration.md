## Exploration: antigravity-support

### Current State
- Antigravity (`agy`) is documented as unsupported in README.md, docs/install.md, docs/es/*, CHANGELOG 0.3.0 "Known limitations", keel/steering/product.md (agent-status section).
- Registry is data (`build/manifest.json`). `emit.phases.as: "skill"` / `emit.commands.as: "skill"` need no new formatter (Codex precedent, manifest.json:155-220). `bin/sdd` consumes rows generically (`skillsRead`, `readersOf(SHARED)`, `detect`, `projectMarkers`, `install.*`, `unverifiedFields`).

### CONFIRMED (official docs: https://antigravity.google/docs/skills/ and https://antigravity.google/docs/rules)
- Project skills: `<workspace>/.agents/skills/<skill>/`. `.agent/skills` is only kept as backward compatibility (legacy, not the default).
- User skills, two distinct paths: `~/.gemini/config/skills/` (Antigravity 2.0 and IDE) and `~/.gemini/antigravity-cli/skills/` (CLI). Plugin skills: `~/.gemini/antigravity-cli/plugins/<name>/skills/`.
- SKILL.md frontmatter: `description` required, `name` optional (defaults to folder name).
- Invocation: 2.0 types `/<skill-name>`; the CLI turns every skill into a slash command.
- Context: workspace `AGENTS.md` or `GEMINI.md` (equivalent), then `.agents/AGENTS.md|GEMINI.md`, then `.agents/rules/*.md` (these need frontmatter `trigger`). Global: `~/.gemini/AGENTS.md`, `~/.gemini/GEMINI.md`. Limits: 24 KB per file, 20,000-token rules budget.
- Workflows in `.agents/workflows/` (secondary: atamel.dev/posts/2026/07-13_where_agy_rules_workflows/); the CLI cannot trigger them. Not needed: skills already become slash commands.

### SECONDARY (not official)
- google-antigravity/antigravity-cli issue #103: the CLI does NOT read user-level `~/.agents/skills`, only project `.agents/skills` or `~/.gemini/antigravity-cli/skills`.

### INFERRED (checked against repo code)
- Project scope: Antigravity is just another reader of the shared `.agents/skills` (like codex/opencode/gemini/kimi). Row: `skillsRead: [".agents/skills"]` (plus its user paths), project map only `skills -> .agents/skills`, `phases.as`/`commands.as: "skill"`, `neutralSkills: true`, `hooks: false`, `contextFile: AGENTS.md` (same shape as Codex).
- `readersOf(SHARED)` grows by one, so the "shared with ..." notice (bin/sdd:325-327) and double-discovery warnings now list `antigravity`; data-driven, no code change expected. Tests asserting reader lists may need updating.
- `installedInProject` (bin/sdd:212) ignores the shared dir and falls back to the per-agent context-file block by id, so sharing AGENTS.md with Codex is safe (blocks are per id). `projectMarkers: []` is viable (Codex does it).
- Gemini clash risk RETIRED: context file is AGENTS.md, not GEMINI.md. Detect overlap is also avoidable: gemini uses `~/.gemini`; Antigravity should use a narrower path (`~/.gemini/antigravity-cli` and/or `~/.gemini/config`, both exist locally), to be decided. Local dirs seen: `~/.gemini/antigravity`, `antigravity-ide`, `config/skills`.
- User scope needs a decision: IDE/2.0 path vs CLI path. `install.user.map` is a single target per row; a row can list several maps, but writing both doubles copies for anyone with both products. Also `~/.gemini/config/skills` mirrors `~/.gemini/skills` locally, so Gemini user installs may double-load there.

### CONTRADICTION (recorded honestly)
docs/install.md and CHANGELOG say a headless test did not find skills in `.agents/skills`; official docs say project `.agents/skills` works. Hypothesis (unproven): that test ran at user level (`~/.agents/skills`, which the CLI does not read), or the product changed since.

### STILL UNVERIFIED
- Keel skills actually load and a phase runs in a real Antigravity session (so never "Tested").
- Which user-scope path a given install uses (IDE vs CLI); which `detect`/`projectMarkers`.
- Global context file behavior for `~/.gemini/AGENTS.md` (docs list it; not exercised); `subagents` (none assumed).

### Approaches
1. **Experimental row** (recommended): project via shared `.agents/skills` + AGENTS.md; user scope with the documented path(s); `status: experimental`, `unverifiedFields: ["subagents","userSkillsDir","detect"]` or similar, notes cite both doc URLs + date; docs-verified only. Effort: Low. Con: user path may be wrong for some installs.
2. **Wait for an interactive test** before any row. Zero claim risk; docs stay "unsupported"; blocks on human. Effort: Low after test.

### Recommendation
Approach 1, with the interactive test as a documented gate for ever leaving experimental. Decide user scope: prefer one primary path (`~/.gemini/config/skills`, covers 2.0 + IDE) and mention the CLI path in notes/docs, or install both; pick in proposal.

### Docs that must change together
README.md table, docs/install.md, docs/es/README.md, docs/es/instalacion.md, CHANGELOG (add Unreleased entry; 0.3.0 Known limitations stays historical), keel/steering/product.md agent-status section, plus regenerate adapters (`node bin/sdd build`, separate commit) and update tests.

### Risks
- Wrong/insufficient user-scope path (IDE vs CLI) gives a silent no-op for some users.
- Double-loading via `~/.gemini/config/skills` vs `~/.gemini/skills`.
- Contradiction with the earlier headless test remains unexplained.
- Fast-moving product: doc-verified claims age; record re-check date.
- Bilingual docs easy to miss.

### Open questions
1. User scope: one path or both, and which `detect` value?
2. Does the old `.agents/skills` headless failure reproduce at project level?
3. Confirm `~/.gemini/AGENTS.md` as the user context path for `install.contextFile.user`.

### Ready for Proposal
Yes. Scope: experimental skills-only Antigravity row (Codex-shaped), with user-scope decision and interactive test as explicit gates.
