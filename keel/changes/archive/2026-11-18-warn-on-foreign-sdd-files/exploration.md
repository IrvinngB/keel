## Exploration: warn-on-foreign-sdd-files

### Current State
Keel decides "is this an sdd install?" by name prefix, and never checks who owns a file it writes.

### CONFIRMED (read in code)
| Fact | Where |
|---|---|
| `hasSddEntry(dir)` = any entry whose name starts with `sdd`; no ownership check | bin/sdd:205-207 |
| `skillsDirNotices` warns for each `skillsRead` dir not in the install map if `hasSddEntry` is true; advice text says "Remove the sdd* entries" | bin/sdd:322-335 |
| Same broad check feeds 3 more places: `installedInProject` (project detection / `dialect()`, l.218), doctor per-agent "skills in ..." line and the "twice" warning (l.431, 447-449), doctor user-level "twice" warning via `userSkillDirs` (l.443-446, also says "remove the sdd* entries") | bin/sdd |
| `installedInProject` uses it on the agent's own dirs (`.opencode/agent` etc.), so a foreign `sdd-*` file there also makes dialect() pick opencode | bin/sdd:212-221 |
| `copyTree` does a blind `copyFileSync` (no exists check, no marker); install always prints "existing same-named files were overwritten" | bin/sdd:337-354, 304 |
| opencode user map: agent -> `~/.config/opencode/agent`, command -> `.../command`, skills -> `.../skills`; `skillsRead` = `.opencode/skills`, `.claude/skills`, `.agents/skills`. Project scope maps skills to `.agents/skills` | build/manifest.json:73-153 |
| Adapter tree (`adapters/opencode/`) is the exact Keel-owned set: 1 skill (`sdd-workflow`), 17 agents (incl. non-`sdd-` `stack-detector.md`), 16 commands. So a "names Keel installs" set can be derived by walking the source tree; a prefix rule would miss `stack-detector` | adapters/opencode |
| Generated frontmatter: agent = description/mode/temperature/tools; command = description/agent; skill = name/description. Only generate.js (`PHASE_FORMATS`/`COMMAND_FORMATS`, ~l.144-172) emits it. No marker exists. opencode's tolerance of extra frontmatter keys is UNVERIFIED | build/generate.js |
| `upsertBlock` already has a marker scheme (`keel:begin/end agent=<id>`) for context files only | bin/sdd:247 |
| Tests: only `test/install.test.js` (generic + codex/kimi); `helpers.js` gives isolated `HOME` per `env()`, `sdd(cwd, env, ...)` returns `{status,out}`. No test covers opencode install, `skillsDirNotices` or doctor warnings | test/ |
| Rules: never delete user files (messages already say so), bin/sdd fix needs a failing-first test, zero deps, edit core/ not adapters/ (a marker in generate.js means regenerate adapters as a separate commit); strict_tdd: true | AGENTS.md, config.yaml |

### UNVERIFIED
- Which definition opencode uses when `agent/sdd-x.md` and an `opencode.json` `agent.sdd-x` entry (or `commands/` plural vs `command/`) coexist; not tested. Also whether opencode reads plural `commands/` at all.
- Whether opencode ignores unknown frontmatter keys (relevant to a marker).
- Machine facts (Gentle AI layout, 8+8 overlaps) are given by the caller, not re-read.

### Affected Areas
- `bin/sdd` — `hasSddEntry` and its 4 callers, `installAgent`, `copyTree`, doctor.
- `build/generate.js` (+ regenerated `adapters/`) — only if a marker is chosen.
- `test/install.test.js` (or new `test/foreign.test.js`), `docs/install.md` (l.23-24 advice), possibly `docs/es/`.

### Approaches
1. **Owned-names set (goal a)** — build the set of names from the adapter source tree per install target; `hasSddEntry` becomes "entry name is in Keel's set" (fixes false positive; `sdd-init` etc. from Gentle would still match by name, so message must say "same name as a Keel skill, possibly another tool's" and drop the "earlier install" claim). Low effort; cannot tell Keel's `sdd-workflow` from a foreign one if names equal, but Gentle ships no `sdd-workflow` so the reported case is fixed.
2. **Pre-install collision scan (goal b)** — before `copyTree`, list target-dir files that already exist with a name Keel will write; for opencode also read `opencode.json` `agent` keys (JSON.parse, tolerate JSONC failure -> skip with note) and the plural `commands/` dir; print a warning, change nothing. Replace the unconditional "overwritten" line with the actual count/list. Medium effort. Without a marker it cannot say whether an existing file is Keel's or foreign.
3. **Ownership marker (goal c)** — stamp files (frontmatter key or first-line comment) in generate.js; scan classifies existing same-named files as keel/foreign/unknown-legacy (pre-marker Keel files look "foreign" once, needs a legacy rule such as byte-equal to a prior release or a content sniff). Medium-High; touches generated adapters and all agents' formats, and depends on the UNVERIFIED tolerance for extra keys. Alternative: sidecar manifest file listing installed paths (no format risk, but drifts if the user copies files).
4. **Doctor reporting (goal d)** — reuse the scan from 2 read-only in `sdd doctor` for installed agents. Low once 2 exists.

### Recommendation
Do 1 + 2 + 4 now, defer 3. Extract one helper (`keelNames(id, scope)` from the adapter tree, `foreignCollisions(id, scope)`), used by install and doctor, and stop `installedInProject`/doctor "twice" logic from using the prefix check. Warn only ("same-named definitions from another tool; which one opencode uses is undocumented here"); never block, never delete. Overwrite of an existing same-named FILE should be listed explicitly (that part needs no marker: it is a plain exists-check before copy). Marker (3) is a separate change once opencode's frontmatter tolerance is tested. Tests: HOME-isolated opencode `--user` install with fake `~/.claude/skills/sdd-init` (must NOT warn), `sdd-workflow` there (must warn), a prewritten `agent/sdd-apply.md`, and an `opencode.json` `agent` key; each must fail on current code.

### Risks
- Name-only ownership still flags a foreign file that reuses a Keel name; wording must not assert "stale Keel copy".
- `opencode.json` may be JSONC/commented; parse failure must degrade to no-scan, not a crash.
- `--dry-run` must scan without writing; doctor must not touch real HOME in tests.
- Marker changes rewrite every generated adapter (large diff, separate build commit).
- 4 message sites and the docs advice must change together or wording drifts.

### Ready for Proposal
Yes. Open decision for the proposer: ship (3) now or defer; whether the collision list should be capped in output.
