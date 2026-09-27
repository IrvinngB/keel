# Clarifications: Add GitHub Copilot support

Automatic mode: nobody answers. Every BLOCKER carries a recommended default that the pipeline
proceeds with, so each is also an ASSUMPTION. Verified by reading `bin/sdd`, `build/manifest.json`,
`build/generate.js`, `test/install.test.js`, `test/docs.test.js` (no shell, no reproduction run).
The wip commit e01cfff was not read.

## BLOCKER: must answer before design

### Q1: Do existing tests, `steering/structure.md` and the docs prose that lists the shared-dir readers belong in scope?
- Targets: Requirement "Shared-skills reading" and "Documentation parity" (`specs/copilot-agent/spec.md`); Proposal "Affected Areas".
- Evidence: `test/install.test.js:261` hardcodes `shared with opencode, codex, gemini, kimi`. `readersOf(SHARED)` follows registry order (`bin/sdd:73`), and copilot sits after antigravity, so the antigravity dry-run notice becomes `... kimi, copilot` and that existing test FAILS. `keel/steering/structure.md:13` lists the adapters dirs and omits copilot. `docs/install.md:38` and `:57` name the readers (Codex, opencode, Gemini, Kimi, Antigravity) and the block-sharing agents. The proposal lists none of these.
- Risk if guessed wrong: red `npm test` at apply, or docs that contradict the registry.
- Recommended default: in scope. Update line 261 to the new string (1 line), add copilot to `structure.md:13`, and to both prose lists in `docs/install.md` and its Spanish twin. Cost: about 6 lines.

### Q2: What exactly are the `unverifiedFields` strings, and is `userScope` really "unverified"?
- Targets: Requirement "Unverified fields and provenance" (spec.md:41-46).
- Evidence: the spec writes `userScope` ("not emitted"). `unverifiedNote` (`bin/sdd:157-163`) prints the array verbatim as `unverified: a, b, c`, and the antigravity test pins the exact string and order (`install.test.js:117,186`). A literal `userScope (not emitted)` would print oddly, and it is a deliberate omission, not an unverified claim.
- Risk if guessed wrong: the test and the doctor text differ from what design assumes.
- Recommended default: the array is exactly `["invoke","subagents","detect","userScope"]` in that order (spec order). The "not emitted" explanation goes in `notes` (`userScope is not emitted: ...`), and the test asserts the exact string `unverified: invoke, subagents, detect, userScope`. Cost: zero.

## ASSUMPTION: proceeding with default unless corrected

### Q3: Manifest fields so that install writes only `.agents/skills` plus the AGENTS.md block, and does the build emit `adapters/copilot/`?
- Targets: Requirement "Project install" (spec.md:20-33), "No user scope".
- Assumed: copy the antigravity row, drop `install.user` and `install.contextFile.user`. Fields: `status: experimental`, `neutralSkills: true`, `skillsRead` (3 dirs), `detect: []`, `projectMarkers: []`, `hooks: false`, `emit` identical to antigravity (`workflowSkill`, phases/commands `as: skill`, `contextFile {name: AGENTS.md, block: skills, blockFile: AGENTS.block.md}`), `install {method: copy, project {root ".", map [{from: skills, to: .agents/skills}]}, contextFile {project: AGENTS.md}}`, `invoke {cmd: /sdd-{name}, agent: sdd-phase-{short}, skill: {name}}`, `args: "the user's arguments"`.
- Evidence: `generate.js:182-205` requires displayName, status, invoke, args, emit, install; the "emits skills but declares no install target" check passes with project only (`:200`). `validateSkillsInstall` (`:209-223`) passes: reads include SHARED, skills.to is SHARED, and reads include skills.to. `emitAgent` (`:312-372`) writes skills via `neutral = Boolean(r.neutralSkills)` and, for `e.contextFile`, an `AGENTS.block.md` wrapped by `agentBlock(id, ...)` with `keel:begin/end agent=copilot`. The block text is resolved with copilot's own `invoke`, so it renders `/sdd-init`, `/sdd-new`, `/sdd-continue` and `GitHub Copilot` automatically, like `adapters/antigravity/AGENTS.block.md`. `--user` dies at `bin/sdd:324` with `copilot has no user install target` before any write. Every user-scope path tolerates the missing `install.user`: `userSkillDirs` `:118-123`, `keelNames` `:133`, and doctor `:558`.
- Consequence: NO edit to `bin/sdd` is needed. `readersOf`, `skillsDirNotices`, the guard (`:347`: contextFile, no hooks, project, git repo) and dry-run are all row-driven already. The proposal's "Approach" bullets at lines 40-43 read like code changes and are not. Design should say "zero `bin/sdd` changes".

### Q4: Is `skillsRead = [.github/skills, .claude/skills, .agents/skills]` safe for `collisions()`, `skillsDirNotices` and the doctor "twice" warnings?
- Targets: Requirement "Shared-skills reading" (spec.md:48-56).
- Assumed: yes, keep all three.
- Evidence:
  - `collisions()` (`bin/sdd:429-434`) builds `written` from SHARED plus every agent's project `to`. Nobody writes `.github/skills` or `.claude/skills`, so it emits `info:` items, but only for Keel-owned names present there. `keelEntriesIn(dir, skillNames(...))` filters by names from `adapters/copilot/skills`, never a bare dir listing. A user with their own Claude Code skills in `.claude/skills` therefore gets nothing, and healthy doctor output stays byte-identical apart from the new copilot line. opencode and kimi already read `.claude/skills` with the same behavior (test `install.test.js:352-361`).
  - `info:` items never print on install (`:336`). In doctor they appear only when copilot is installed in the project (`:557`), because the `found` branch is null.
  - `skillsDirNotices` (`:363-369`) skips `.agents/skills` (a dest) and warns for the other two only on Keel-named hits, with the message `warning: GitHub Copilot also reads .github/skills, which holds ... ` Scenarios match.
  - The doctor "twice" project variant (`:553`) needs `inProject` (the block). The user variant (`:550`) needs `found`, and `found` is `null` with `detect: []`, so it never fires for copilot. The spec has no user-level scenario, so this is consistent.
  - Narrowing `skillsRead` to `.agents/skills` alone would drop the warnings and contradict the docs, so it is not safer.
- The Keel-only doctor tests (`install.test.js:373-417`) stay green: copilot is not installed there, so it adds no collision lines.

### Q5: Is detection through the AGENTS.md block alone acceptable and testable, and what does doctor print with `detect: []`?
- Targets: Requirement "Unverified fields and provenance", scenario "Declared and surfaced".
- Assumed: acceptable.
- Evidence: `installedInProject` (`bin/sdd:240-248`) ignores SHARED, so copilot counts as installed only if `hasBlock(AGENTS.md, 'copilot')`. Doctor line (`:532,544`): `found` is `null`, so it prints `tool n/a · project installed · skills in .agents/skills · AGENTS.md: block present`; before install: `project —` with `AGENTS.md: —`. The unverified warning prints only when `found || inProject` (`:546`), so it appears after install, and `sdd install copilot` always prints it (`:297`). A Copilot user with skills but no block is invisible to doctor; that is inherent to the shared dir and accepted. Testable with `repo()`, `sdd install copilot --project`, `sdd doctor` and a regex on `^  copilot\s`.
- `dialect()` (`:250-259`): copilot sits after every non-generic agent, so codex+copilot blocks resolve to codex (`$sdd-continue`), which is what the spec wants. A copilot-only repo resolves to `/sdd-continue`. Block markers coexist because `scanBlocks` keys on `agent=<id>` (`:38`, `[a-z0-9-]+`).

### Q6: Do the copilot tests need a git repo, and which existing tests must change?
- Targets: Requirement "Project install" scenarios Guard and Dry run.
- Assumed: use `repo()` everywhere (as the antigravity tests do), since the guard needs `hooksDir()`. `repo()` also gives an isolated HOME. Plain dirs are only needed for a "non-git means no guard" case, which the spec does not require.
- Evidence: `test/helpers.js:27-33`, `bin/sdd:347`. Assert `.git/hooks/pre-commit` exists after install and is absent after `--dry-run`. Dry-run expected action list ends with `GitHub Copilot has no native commit hook — would install the universal git guard.`, and the notice reads `shared with opencode, codex, gemini, kimi, antigravity`.
- Also note the existing test at `install.test.js:130` pins antigravity's index to kimi+1; add a similar `copilot` right after antigravity, and before generic. For docs, `docs.test.js` needs Copilot cases modeled on `:48-74`, which cost about 25 lines.

### Q7: Is one PR under 400 review lines realistic?
- Targets: Success criterion "under 400 review lines" (proposal.md:76).
- Assumed: yes, no split.
- Estimate (excluding `adapters/`, which is a separate regenerate commit and is skipped): manifest row about 58; `install.test.js` about 90 (row and order, install/idempotent, coexistence, malformed, dry-run, unverified, user refusal, double-discovery, doctor line, guard) plus 1 changed line; `docs.test.js` about 25; README about 6; `docs/install.md` about 22; `docs/es/README.md` about 6 and `docs/es/instalacion.md` about 24; CHANGELOG about 4; `steering/product.md` and `structure.md` about 4. Total about 240-280. Split only if the docs run long; test counts stay bounded by the pair parity rules (same `## ` count and same fence count per pair, `docs.test.js:18-26`). The wip commit was not reviewed; if it pulls extra material the estimate rises.

## Spec statements checked against the code (none false)
- "sdd-spec renders /sdd-spec": `fill(cmd, ...)` with `/sdd-{name}` is consistent with antigravity's row.
- "Copilot line shows tool n/a, project installed": true (`bin/sdd:532,544`).
- "refuse without writing on malformed marker": `assertMarkersSane` runs at `:327`, before `copyTree` (`:331`).
- "Coexists with codex, kimi, antigravity in any order": per-agent markers, as tested for antigravity.
- "Double-discovery warnings count only Keel-owned names": `keelNames` reads the adapter tree.
- Not verifiable without a shell or the web: that Copilot actually reads `.agents/skills`, that `/sdd-*` invocation works in the CLI and JetBrains, and that AGENTS.md is honored. These stay behind the manual gate.

## Resolved

Automatic mode (chosen by the user on 2026-09-25): nobody answered individually; every RECOMMENDED default is recorded as an ASSUMPTION, applied by the design. The user reviews them before merge.

- **Verified by the orchestrator (2026-09-25):** `test/install.test.js:261` pins the exact notice `shared with opencode, codex, gemini, kimi`, so it breaks when `copilot` joins the readers of `.agents/skills`; `bin/sdd` has no per-agent hardcoded id (no code edit needed); the antigravity row has `install.user` and `contextFile.user`, which the copilot row must NOT have.
- **ASSUMPTION Q1 (scope gap):** IN scope: update the pinned test line and add `copilot` to the expected reader list; `keel/steering/structure.md` adapters list; every docs sentence that enumerates the readers of the shared dir (docs/install.md and docs/es/instalacion.md, check each), about 6 lines.
- **ASSUMPTION Q2:** `unverifiedFields` is exactly `["invoke","subagents","detect","userScope"]` in that order; the 'not emitted' wording lives in `notes`; the test asserts the exact string `unverified: invoke, subagents, detect, userScope`.
- **ASSUMPTION Q3:** the row is the antigravity row minus `install.user` and `install.contextFile.user`; the build then emits `adapters/copilot/skills` plus `AGENTS.block.md` with its own `keel:begin/end agent=copilot` markers; `sdd install copilot --user` dies with 'copilot has no user install target' before any write; zero `bin/sdd` edits.
- **ASSUMPTION Q4:** `skillsRead` keeps all three dirs (`.github/skills`, `.claude/skills`, `.agents/skills`); `collisions()` filters by Keel-owned names, so a user's own `.claude/skills` prints nothing; `info:` lines show only in doctor and only when copilot is installed.
- **ASSUMPTION Q5:** block-only detection is accepted: doctor prints `tool n/a · project installed · skills in .agents/skills · AGENTS.md: block present`; `dialect()` prefers codex when both blocks exist and copilot when only its block exists; tests install the block.
- **ASSUMPTION Q6:** every copilot test uses `repo()` (git repo, isolated HOME) because the commit guard needs `hooksDir()`; add an order test (copilot right after antigravity), docs cases modelled on `docs.test.js:48-74`, and a dry-run test expecting a guard line naming 'GitHub Copilot'.
- **ASSUMPTION Q7:** about 240-280 review lines excluding `adapters/`: one PR, no split.
- **Manual gate:** discovery of `.agents/skills`, `/sdd-*` in VS Code and the CLI, JetBrains invocation and AGENTS.md being honored stay UNVERIFIED behind a manual session; status stays Experimental.
