# Clarifications: Warn on foreign SDD files

Verified against bin/sdd, build/manifest.json (working tree, includes `antigravity`), adapters/, test/install.test.js, test/helpers.js. Automatic mode: every BLOCKER carries a RECOMMENDED default, to be recorded as an ASSUMPTION.

## BLOCKER — must answer before design

### Q1: What may "collision" mean for same-named files in the target dirs, given that after any normal install they are Keel's own?
- Targets: Requirement "Read-only collision scan", "Doctor section", "Overwrite list" (spec.md); Success criterion "reported by install, dry-run, doctor" (proposal.md)
- Evidence: `copyTree` writes `agent/sdd-apply.md` etc. (bin/sdd:337-354). No marker exists, so Keel cannot tell its own previous file from another tool's. A doctor scan for "same-named files in target dirs" would fire on EVERY healthy install; a re-install would list all of Keel's own files as collisions.
- Risk if guessed wrong: permanent false-positive noise in `doctor` (the very bug this change fixes, one level up), and scenarios "Existing file and key" / "Two agents" become untestable as written.
- RECOMMENDED default (ASSUMPTION): target-dir file matches are reported only by `install` and `install --dry-run`, worded as "will be replaced (a previous Keel install or another tool's)", never as a collision. `doctor` reports only signals Keel never writes itself: `opencode.json` `agent` keys with Keel names, plural `commands/`/`agents/` dirs, and same-named skills in read dirs that are NOT install targets. Cost: spec + success criterion edited; no marker needed.

### Q2: Is the "names Keel installs" set per installing agent, or the union over all adapters?
- Targets: Requirement "Ownership by name" (spec.md)
- Evidence: opencode's skills tree holds only `sdd-workflow` (adapters/opencode/skills). But `sdd-init`, `sdd-apply`, `sdd-new`... ARE Keel skill names for codex and kimi (adapters/codex/skills/sdd-init, adapters/kimi/skills/sdd-init). A union set would count Gentle's `~/.claude/skills/sdd-init` as Keel's and defeat scenario "Foreign skill".
- Risk if guessed wrong: the reported bug persists.
- RECOMMENDED default (ASSUMPTION): per agent. One helper `keelNames(id, scope)`, computed once per process, defined next to `userSkillDirs` (bin/sdd:118) and used by install, doctor and `installedInProject`. For each `map` entry it walks `adapters/<id>/<from>` and returns (a) top-level entry names as on disk, extension included (`sdd-apply.md`, `stack-detector.md`, skill dir `sdd-workflow`) for the skills-dir checks, and (b) relative file paths for overwrite listing and project detection. `adapters/` ships in the npm package (package.json `files`), so the walk works when installed. Cost: ~30 readdir/stat calls per agent, negligible.

### Q3: What exactly changes in the 4 `hasSddEntry` callers?
- Targets: Requirements "Ownership by name", "Neutral wording" (spec.md)
- Evidence and smallest safe diff: replace `hasSddEntry(dir)` (bin/sdd:205-207) with `hasKeelEntry(dir, names)` and delete the old one.
  1. `installedInProject` (l.218): own dirs are `.opencode/agent`, `.opencode/command`, `.gemini/commands`. Use relative FILE paths, not top-level names: gemini installs `commands/sdd/*.toml`, so a top-level name would be the dir `sdd`, which any tool may own. Effect: a foreign `.opencode/agent/sdd-foo.md` no longer makes `dialect()` pick opencode; `stack-detector.md` alone now does count.
  2. `skillsDirNotices` (l.331): names = the installing agent's skill names (Q2). Reword l.332-333.
  3. doctor `seen` (l.432): the "skills in ..." suffix lists only dirs holding Keel-named skills of that agent.
  4. doctor `seenUser` (l.444) and the l.448 "twice" warning: same; reword l.446-447, l.449-450.
- Existing test breaks: `test/install.test.js:204-212` seeds `sdd-x` (not a Keel name) and asserts "may discover the sdd skills twice at user level". It must be changed to `sdd-workflow` and the new wording. The plan must say this explicitly.
- RECOMMENDED default (ASSUMPTION): as above. Risk if wrong: dialect detection regresses for existing users (mitigated by the file-path rule).

### Q4: Which real paths does the scan read?
- Targets: Requirement "Read-only collision scan" (spec.md)
- Evidence: target dirs come from the manifest map (`.config/opencode/{agent,command,skills}` user; `.opencode/{agent,command}` and `.agents/skills` project; manifest.json:117-153). Nothing in the repo mentions `opencode.json` (rg finds it only in this change's artifacts), and the manifest already lists `agentDir`/`commandDir` as UNVERIFIED (manifest.json:76-79), so the config path and plural dirs are conventions, not verified facts.
- RECOMMENDED default (ASSUMPTION, mark UNVERIFIED in the code comment and docs): config = `~/.config/opencode/opencode.json` (user) or `./opencode.json` (project), also try `opencode.jsonc`; read `agent` only if it is a plain object. Plural check = `commands/` beside `command/` and, at the same cost, `agents/` beside `agent/`, inside the same parent (`~/.config/opencode` or `.opencode`). JSONC or invalid JSON: `JSON.parse` failure prints ONE neutral note ("opencode.json could not be parsed (JSONC?); key check skipped"), no comment-stripper (zero deps, no new parser risk). Silent skipping is rejected: the user would think there is no collision.

### Q5: Doctor section format and cost on a machine with no collisions?
- Targets: Requirement "Doctor section" (spec.md); doctor code bin/sdd:424-453
- Evidence: agent lines are asserted with `startsWith('  <id> ')` and `/^ {2}antigravity\s/` using `find` (first match; test lines 116, 262-271), and `idw` is sized to the longest id, which changes once `antigravity` merges (this change must start after feat/antigravity-support lands).
- RECOMMENDED default (ASSUMPTION): print the section after the agent block and warnings, only when at least one collision exists; header `collisions (same name as a Keel definition, possibly another tool's):` then one line per agent `  <id>: <n> item(s) — <first 3 names>, and N more`. No collisions = zero extra output (output byte-identical, so no existing test moves). Scope: only agents that are `found` or `inProject`, matching the existing warning guards (l.443, 445, 448). Line prefix is `  <id>:` (colon, no space after id) so it cannot match the agent-line finders. Cost: at most 2 readdirs + 1 JSON parse per opencode.

## ASSUMPTION — proceeding with default unless corrected

### Q6: What wording is neutral and testable?
- Targets: Requirement "Neutral wording" (spec.md); old text at bin/sdd:332-333, 446-450, 304; docs/install.md:45-46
- Assumed (tests assert these phrases; `doesNotMatch(/stale|remove|earlier install|likely/i)` on every new message):
  - Keel-name match in a read dir: `warning: <Agent> also reads <dir>, which holds <name> with the same name as a Keel definition, possibly another tool's — it may be discovered twice. sdd never changes your files.`
  - Install overwrite (only when >=1 pre-existing file; dry run says `would replace`): `notice: N existing file(s) will be replaced (a previous Keel install or another tool's): a, b, … and 2 more.` Cap 10 names, then `… and N more`.
  - Key: `warning: opencode.json agent "<name>" has the same name as a Keel definition, possibly another tool's.`
  - Plural dir: `warning: <dir>commands/ sits beside command/; which one opencode reads is unverified.`
  - User-level `.claude/skills` match: prefix `info:` not `warning:`.
- Evidence: current text calls entries "likely from an earlier install" and says "Remove the sdd* entries" (bin/sdd:332-333, 447, 450); docs/install.md:45-46 repeats it and must change too (not in the spec's Documentation requirement; add it).

### Q7: Restore the dropped scenario "fresh target, no overwrite line"?
- Targets: Requirement "Overwrite list" (spec.md)
- Assumed: YES, restore it. GIVEN an empty target WHEN install runs THEN no replace/overwrite line is printed and the existing exact-output test `antigravity --dry-run writes nothing and lists exactly the planned actions` (test/install.test.js:241-260) stays green. Also add: `note: existing same-named files were overwritten; others untouched.` (bin/sdd:304) is removed for real installs and replaced by the conditional list, because it is unconditional today.
- Evidence: bin/sdd:304 prints the "overwritten" note for every non-dry install; the exact-action-list test would otherwise break.

## Spec statements false against the code
- Scenario "Non-prefixed Keel name" (skills dir holds `stack-detector`, counted): false for skills dirs. `stack-detector` is an opencode AGENT file (adapters/opencode/agent/stack-detector.md); the skill form is `sdd-phase-stack-detector` (adapters/codex|gemini|kimi|antigravity/skills/). Rewrite the scenario against `.opencode/agent/stack-detector.md` and `installedInProject` (bin/sdd:212-221).
- Requirement "Ownership by name": names "without the `sdd` prefix" exist only for that agent file; the opencode on-disk names carry `.md` (Q2).
- Scenario "Existing file and key" for doctor and Success criterion 2: contradicted by Q1 (target-dir files are Keel's own after any install).
- Scenario "Keel-named entry" (`~/.claude/skills/sdd-workflow` with `install opencode --user`): holds. `skillsRead` includes `.claude/skills` and base is HOME for user scope (bin/sdd:298, 330-331), and `sdd-workflow` is in the opencode set. Confirmed.
- Scenario "Foreign skill": holds only with per-agent sets (Q2).
- Requirement "Dry run": `--dry-run` already prints `would copy` per file and writes nothing (bin/sdd:346); the scan must run before `copyTree` so it sees pre-install state. Holds.
- Requirement "Documentation": omits docs/install.md:45-46 (Q6) and the README (proposal says "if it fits").
- Sequencing: `build/manifest.json` and `test/install.test.js` in the working tree carry the uncommitted `antigravity` row and tests (id column width, `agLine`); apply must start after feat/antigravity-support merges.

## Resolved

Automatic mode (chosen by the user on 2026-09-25): nobody answered Q1-Q7 individually. Every RECOMMENDED default above is recorded here as an ASSUMPTION and applied by the spec update and the design; the user reviews them in the combined summary before apply.

- **ASSUMPTION Q1:** target-dir same-name matches are reported only by `install` and `install --dry-run` ("will be replaced (a previous Keel install or another tool's)"). `doctor` reports only signals Keel never writes: `opencode.json` `agent` keys, the plural `commands/` and `agents/` dirs, and same-named skills in read dirs that are not install targets. This CHANGES the proposal (success criterion 2) and the spec ("Existing file and key" for doctor).
- **ASSUMPTION Q2:** the set of names Keel installs is per agent and scope (`keelNames(id, scope)`, next to `userSkillDirs`), never a union.
- **ASSUMPTION Q3:** `hasSddEntry` is replaced by `hasKeelEntry(dir, names)`; `installedInProject` uses relative file paths; the test at `test/install.test.js:204-212` changes to `sdd-workflow` and the new wording.
- **ASSUMPTION Q4 (UNVERIFIED paths, say so in code comment and docs):** `~/.config/opencode/opencode.json` (user) or `./opencode.json` (project), also `.jsonc`; read `agent` only if a plain object; plural dirs `commands/` and `agents/`; on JSONC or invalid JSON print one note and skip the key check (no comment stripper, zero dependencies).
- **ASSUMPTION Q5:** doctor prints the collisions section after the agent block only when at least one exists (no-collision output byte-identical); lines prefixed `  <id>:`.
- **ASSUMPTION Q6:** neutral phrases as listed in Q6; new messages never match `/stale|remove|earlier install|likely/i`; `docs/install.md:45-46` is added to the docs requirement.
- **ASSUMPTION Q7:** restore the scenario "fresh target, no overwrite line".
- Sequencing: apply starts only after `feat/antigravity-support` merges (doctor id width and antigravity tests overlap).
