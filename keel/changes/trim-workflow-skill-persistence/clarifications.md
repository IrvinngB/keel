# Clarifications: Trim persistence docs out of the sdd-workflow skill

Automatic mode: every BLOCKER carries a RECOMMENDED default that proceeds as an ASSUMPTION unless corrected.

## BLOCKER — must answer before design

### Q1: The `persistence_docs` flag is per agent, but five agents write the SAME `.agents/skills/sdd-workflow/SKILL.md`. Which agents may flip, and what is the v1 slice?
- Targets: Requirement "Per-agent flag" and "Side-files output" (workflow-skill-packaging/spec.md); proposal Slicing.
- Evidence: opencode, codex, gemini, kimi and antigravity all have `neutralSkills: true` and install project skills to `.agents/skills` (build/manifest.json:92, 171, 241, 321, 396; install maps at 131-134, 201-203, 271-275, 351-355, 425-428). `skillBody` resolves with `neutralInvoke` for them (build/generate.js:283-291, 312), so their `SKILL.md` is byte-identical and installed once. The last `sdd install` wins. With opencode `side-files` and codex `inline`, a codex user gets a `SKILL.md` that points at `persistence/`, which codex is unverified to read. The reverse order re-inlines and leaves orphan `persistence/` files, because `copyTree` never deletes (bin/sdd:438-455).
- Also: no agent is verified for side files, and `inline` is the default, so the change saves nothing until a flip lands.
- Risk if guessed wrong: a project-scope install silently breaks `sqlite`/`mcp-generic` for an agent that cannot read side files, and the flag is order-dependent. That is exactly the risk the proposal set out to avoid.
- RECOMMENDED default (ASSUMPTION): v1 ships the mechanism, the reachability gate and ONE flip: `claude`.
  - claude has its own generated dir (`adapters/claude`, `source: ./adapters/claude` in .claude-plugin/marketplace.json:10), so the flag is coherent there.
  - It is the primary tool, and the maintainer can run a real session.
  - Saving is real and measurable: 3290 to about 2434 words (856 fewer). Measure with `wc -w` in the PR.
  - `validateRegistry` MUST reject mixed `persistence_docs` values among agents that share `sharedSkillsDir`. Either all neutral agents flip together (needs all verified) or none does. opencode therefore stays `inline` until the whole neutral group is verified.
  - No saving is claimed for the other five.
- Cost of the default: the neutral group keeps paying 3325 words. That is acceptable and honest. Cheapest alternative, if claude is not verified: Approach 3 (drop only `template.md` from the skill, keep it in `generic/core`; -141 words for all six, no reachability risk).

### Q2: What evidence counts as "verified" for a tool, and where is it recorded so the flag and the docs cannot drift?
- Targets: Requirement "Savings only for verified agents"; proposal task 1 (reachability gate).
- Risk if guessed wrong: a doc claim with no proof, or a flag flipped on a docs quote alone. The 0.3.0 antigravity test already showed docs can disagree with real behavior (manifest.json:384).
- RECOMMENDED default (ASSUMPTION): only a real session counts. The agent, told to run a sqlite-store step, reads `<skill dir>/persistence/sqlite.md`.
  - A docs quote or `opencode debug skill` output is supporting evidence, not sufficient. It shows the directory is exposed, not that the agent reads files from it.
  - Record it as a manifest row field `persistenceDocsVerified: "<yyyy-mm-dd> <how>"`, next to `notes`. The README table cites it.
  - Add a `test/` check that fails when an agent has `persistence_docs: side-files` and no `persistenceDocsVerified`. Also fail on a verified value on an `inline` row? No, that is allowed (evidence can precede the flip).
  - `unverifiedFields` already exists for this purpose, but it is free-form and not enforced. A dedicated field is testable.
- Cost: one manifest field and one test.

### Q3: claude — how does the flag work for a plugin-managed skill, and can doctor check it?
- Targets: Requirement "Side files travel with the skill"; doctor-backend-doc-check "No false warnings".
- Evidence (checked): the plugin cache at `~/.claude/plugins/cache/keel/sdd/0.4.1/skills/sdd-workflow/` exists beside `agents/` and `commands/`, so the cache copies whole directories and a `persistence/` subfolder will travel. Doctor is not aware of this path: `userSkillDirs` (bin/sdd:118-123) uses `skillsRead` (`.claude/skills`), and claude has `install.method: plugin` and no `install.user.map`. The cache path is version-keyed and Claude-internal.
- Risk if guessed wrong: a false doctor warning, or a claude flag that no check covers.
- RECOMMENDED default (ASSUMPTION): claude is `side-files` once the Q2 session passes. Doctor does NOT check claude; spec "cannot locate the skill folder" already permits this. Plugin updates re-copy the whole tree, so drift is unlikely. The SKILL.md load rule (Q5) carries a fallback line: if the file cannot be read, say so and stop rather than guess. Document "doctor checks copy-based agents only" in README.
- Cost: none in code; one sentence of docs.

## ASSUMPTION — proceeding with default unless corrected

### Q4: What is the exact "stale install" signal for doctor?
- Targets: Requirement "Stale installs reported" (doctor-backend-doc-check/spec.md).
- The spec scenario is wrong as written. An old install inlines every doc, so `sqlite` IS reachable and nothing is stale. The only broken state is a new `SKILL.md` (doc not inline) with the `persistence/<name>.md` file missing, for example a partial copy or a deleted file. That is the "missing" scenario, not a second one.
- Assumed: merge both into one warning. Doctor reads the installed `SKILL.md`, and if it does NOT contain the doc's own first heading line (taken from `core/persistence/<n>.md`, so no new marker in the generated output) and `persistence/<n>.md` is missing, it warns `run sdd install <agent>`. If the heading is present, the doc is inline and fine. Drop the separate "predates side files" requirement.
- Evidence: none — unverified against a real old install; confirm against `adapters/*/skills/sdd-workflow/SKILL.md` headings at design time.
- Related: doctor cannot tell which agent wrote the shared dir. `installedInProject` says so at bin/sdd:237-239. Scope the check per skills-dir row, from the agents whose flag matches (all-equal after Q1), not per agent.

### Q5: Exact load-path wording for orchestrator.md, interface.md and init.md
- Targets: Requirement "Load-path wording"; core/orchestrator.md:54-59, core/persistence/interface.md:53,78,86-95, core/commands/init.md:13.
- Assumed: one mode-independent sentence, with NO new placeholder. The `{{...}}` regexes accept only `agent|cmd|skill` (build/generate.js:21-22, 35), and a new kind would touch 3 regexes plus `verify()`. Shape: "`interface.md` and `files.md` are in this workflow. Any other backend doc `<name>.md` is a section below, or a file in the `persistence/` folder beside this skill's `SKILL.md`, or `.sdd/core/persistence/` in generic installs. If it is in neither place, tell the user to run `sdd install`; do not guess the backend." The same text serves inline, side-files and generic. The interface table keeps bare filenames, prefixed by this rule.
- Evidence: init.md:13 and orchestrator.md:54-59 reference docs by bare name only; no phase mentions persistence docs.

### Q6: Where does `persistence_docs` live, and how is an invalid value rejected?
- Targets: Requirement "Per-agent flag".
- Assumed: a top-level registry-row field, like `neutralSkills` and `skillsRead` (manifest.json:92-97), NOT under `emit`. Validate in `validateRegistry` (build/generate.js:185-203) next to the other checks. Fail as `registry.<id>.persistence_docs must be inline|side-files`, which names the agent as the spec requires. Add the shared-dir agreement check (Q1) inside `validateSkillsInstall` (209-223). Absent means `inline`. Generic (`floor`) is skipped at line 191 and needs no flag. The doctor reads the flag from the same manifest, so there is one source.

### Q7: Sequencing and review budget
- Targets: proposal Slicing and Dependencies.
- Assumed (with Q1's slice): PR1 = feature commit (generator, flag, validation, wording in core/, doctor check, tests) plus a separate `build: regenerate adapters` commit. With claude only, that is 1 modified `SKILL.md` plus 3 new files; the other five `SKILL.md` change only by the Q5 wording. Docs and CHANGELOG go with the feature commit. PR2 (later): flip the neutral group once all five are verified, which is 5 `SKILL.md` edits plus 15 files, or 3 shared paths if the adapters are deduplicated. Start after #10 (feat/antigravity-support) merges; the working tree already carries it, since bin/sdd has the antigravity rows and the keelNames doctor code.
- Uses `SDD_ALLOW_COMMIT=1` only at the chained-PR boundary.

## Spec statements false or in conflict with the code

1. **"Inline is unchanged... byte-identical to the pre-change output"** (workflow-skill-packaging/spec.md:17) is unsatisfiable. The load-path wording edits in `core/orchestrator.md` and `core/persistence/interface.md` are joined into every `SKILL.md` by `skillBody` (build/generate.js:283-291), so all six skills change. Reword: "identical except the load-path wording".
2. **Per-agent flag** (spec.md:9) ignores the shared `.agents/skills` dir for the five neutral agents (Q1).
3. **Stale installs** (doctor spec.md:43-47) says an old skill has "doc not inline". Old skills inline every doc, so they are healthy (Q4).
4. **"For each agent installed with side-files"** (doctor spec.md:9): doctor cannot tell which agent wrote the shared dir (bin/sdd:237-239), and claude has no locatable dir in `userSkillDirs` (Q3).
5. **"Test coverage: each side-files agent... lower word count"** (spec.md:67) needs a baseline; there is no golden file for `SKILL.md` today (test/ only uses `SKILL.md` as a stub, per exploration). Assumed: compare against the same build with the flag forced to `inline`, in-process.
6. Exploration says "Whether plugin caches copy non-SKILL files: UNVERIFIED"; it is now RESOLVED: the cache holds whole dirs (`agents/`, `commands/`, `skills/`), see Q3. Whether Claude Code exposes the skill base path to the agent is still unproven, and the Q2 session settles it.
7. Not false, but note `collisions`/`installedInProject` use `keelNames().files` (bin/sdd:245); new `persistence/*.md` paths join that list. This is harmless, and the design should confirm no test asserts the exact `files` list.

## Resolved

Automatic mode (chosen by the user on 2026-09-25): nobody answered Q1-Q7 individually; every RECOMMENDED default is an ASSUMPTION applied by the spec patch and the design. The user reviews them before apply.

- **Verified by the orchestrator (2026-09-25):** opencode, codex, gemini, kimi and antigravity all install to the shared `.agents/skills` and their generated `sdd-workflow/SKILL.md` is byte-identical (one md5 for the five). The Claude plugin cache holds `agents/`, `commands/`, `hooks/` and `skills/` side by side. Claude Code prints "Base directory for this skill: <path>" when a skill loads, so the agent knows the path to read side files from.
- **ASSUMPTION Q1 (v1 slice):** ship the mechanism, the reachability gate, and flip ONLY `claude` (own dir, primary tool). `validateRegistry` rejects mixed `persistence_docs` values among agents that share `.agents/skills`; the neutral group (opencode, codex, gemini, kimi, antigravity) flips together later or never. Saving for claude is about 3290 to 2434 words: measure with `wc -w` in the PR, do not claim it before. Fallback if claude fails verification: drop only `template.md` from the skill (-141 words for all six, no reachability risk).
- **ASSUMPTION Q2:** VERIFIED means a real session in which the agent reads `persistence/sqlite.md`; docs quotes and `opencode debug skill` output are supporting evidence only. Recorded in a new manifest row field `persistenceDocsVerified`; a test fails when an agent is `side-files` without it.
- **ASSUMPTION Q3:** doctor does not check claude (plugin cache path is version-keyed and Claude-internal; the spec already excuses folders it cannot locate). The load rule carries a fallback: if the doc cannot be read, say so and stop.
- **ASSUMPTION Q4:** the 'stale install' scenario is wrong: an old install inlines every doc, so it is healthy. The only broken state is a new `SKILL.md` (doc not inline) whose `persistence/<name>.md` is missing; merge it into the 'missing doc' warning. Detect 'inline' by the doc's first heading in `SKILL.md` (no new generator marker). The check is scoped per skills-dir row, not per agent (the shared dir cannot be attributed to one agent).
- **ASSUMPTION Q5:** one mode-independent load sentence covers inline, side-files and generic (`.sdd/core/persistence/`), with no new placeholder (`{{...}}` accepts only agent|cmd|skill). Fallback wording: 'if in neither place, tell the user to run `sdd install`'.
- **ASSUMPTION Q6:** `persistence_docs` is a top-level registry-row field like `neutralSkills`; validated in `validateRegistry` with an error naming the agent; the shared-dir agreement check lives in `validateSkillsInstall`.
- **ASSUMPTION Q7:** PR1 = the feature commit plus a separate `build: regenerate adapters` commit (claude: 1 modified + 3 new files; the other five SKILL.md change only by the load-path wording). PR2 flips the neutral group later. Start after PR #10 merges.
- **Spec fixes required:** 'inline is byte-identical' becomes 'identical except the load-path wording' (the wording edit changes every SKILL.md); the flag must account for the shared `.agents/skills` dir; the stale-install scenario is replaced by the merged missing-doc warning; doctor scope is per skills-dir row; the 'lower word count' test compares against the same build forced to `inline`, in-process.
