# Design: Warn on foreign SDD files

## Technical Approach
Per-agent Keel names from the adapter tree replace the `sdd` prefix rule (Q2/Q3); a pure collision scan (Q1/Q4); neutral messages (Q6). Warn only. Apply after `feat/antigravity-support` merges.

## Architecture Decisions
- **Names**: `keelNames(id, scope)` beside `userSkillDirs`, walking `adapters/<id>/<from>` per map entry, cached in a `Map`. Rationale: per agent (Q2); `adapters/` is in package `files`; manual walk like `copyTree`; a missing tree gives `[]`, never `die`.
- **Ownership**: `hasKeelEntry(dir, names)` replaces `hasSddEntry`; `existsSync` per name.
- **Plural dirs**: map `to` basename `agent`/`command` plus `s`, existence only. Rationale: spec wording, no id checks.
- **Keys**: `id === 'opencode'` only, `JSON.parse`, no stripper (zero deps, Q4).
- **Cap**: `capList(items, n)` gives `a, b, … and N more`; install 10, doctor 3.

## Interfaces / Contracts

```js
// [{ from, to, top: ['sdd-apply.md', 'sdd-workflow'], files: ['sdd/apply.toml'] }]
function keelNames(id, scope)
const skillNames = (id, scope) => keelNames(id, scope).filter((e) => e.from === 'skills').flatMap((e) => e.top);
const keelEntriesIn = (dir, names) => names.filter((n) => fs.existsSync(path.join(dir, n)));
const hasKeelEntry = (dir, names) => keelEntriesIn(dir, names).length > 0;
function preexisting(id, scope, base) // existing target paths, before copyTree
// UNVERIFIED: ~/.config/opencode/opencode.json(c) user, ./opencode.json(c) project
function collisions(id, scope, base)  // { items: [{ label, msg }], notes: [] }
```

Callers: `installedInProject` uses `hasKeelEntry(path.join(proj.root, e.to), e.files)` (non-shared entries); `skillsDirNotices` uses `keelEntriesIn(path.join(base, d), skillNames(id, scope))`; doctor `seen` / `seenUser` use `skillNames(id, 'project' | 'user')`.

Messages (never `/stale|remove|earlier install|likely/i`):
- Read dir: `warning: <Agent> also reads <dir>, which holds <names> with the same name as a Keel definition, possibly another tool's — it may be discovered twice. sdd never changes your files.`
- Twice: `warning: <Agent> may discover <names> twice at user level — <a> and <b> each hold a skill with the same name as a Keel definition, possibly another tool's. sdd never changes your files.` (`seen` omits "at user level")
- Replace, only if N>0, after the summary: `notice: N existing file(s) will be replaced (a previous Keel install or another tool's): <list>.`; dry run `would be replaced`. The unconditional `overwritten` note is deleted.
- Key: `warning: opencode.json agent "<name>" has the same name as a Keel definition, possibly another tool's.`
- Plural: `warning: <parent>/commands/ sits beside command/; which one opencode reads is unverified.`
- Parse: `note: <file> could not be parsed (JSONC?); key check skipped.`

Install prints key/plural messages. Doctor scans `user` if `found`, `project` if `inProject`; notes join `warnings`; the section prints after them only if items exist:
```
collisions (same name as a Keel definition, possibly another tool's):
  opencode: 3 item(s) — agent key sdd-apply, .config/opencode/commands/ (unverified), info: .claude/skills/sdd-workflow
```
`<id>:` never matches the `'  <id> '` finders; no items gives byte-identical output.

## Data Flow
```
install: names -> preexisting + collisions -> copyTree -> notices
doctor:  agents -> collisions -> warnings -> [section]
```

## File Changes
- `bin/sdd`: +95 / -15.
- `test/install.test.js`: 12 tests, edit 204-212, +150. `test/docs.test.js`: scenario 13, +15.
- `docs/install.md`, `docs/es/instalacion.md`: rewrite 44-46, `--project` advice, UNVERIFIED; no new `##` or fences (parity), +8 each.
- `README.md` + `docs/es/README.md`: one sentence in an existing section if it fits. `CHANGELOG.md`: Unreleased.

~290 lines: single PR. Over 400: PR1 names + callers, PR2 scan + docs.

## Testing Strategy
Strict TDD, `helpers.repo()`, isolated HOME. Each is RED on current code except 11.
1. `.opencode/agent/stack-detector.md`: `project installed`.
2. `.opencode/agent/sdd-foo.md`: not installed.
3. `~/.claude/skills/{sdd-init,sdd-workflow}`, `install opencode --user`: only `sdd-workflow`.
4. 12 agent files: 10 names, `… and 2 more`.
5. Fresh HOME: no replace/overwritten line.
6. Key `sdd-apply`: install warning, doctor line.
7. JSONC: one note, status 0.
8. `commands/`, `.claude/skills/sdd-workflow`: `unverified`, `info:`.
9. `--dry-run` with `agent/sdd-apply.md`: `would be replaced`, HOME snapshot unchanged.
10. opencode key + antigravity `~/.agents/skills/sdd-workflow`: one line each.
11. Keel files only: no header (guard, green today).
12. Foreign `opencode.json`: bytes and status unchanged, warning printed.
13. Docs advice, no banned words, Unreleased entry.
- Modified 204-212: `sdd-workflow`, new regex, banned-word check. The exact-output antigravity dry-run test stays unchanged.

## Migration / Rollout
No migration required.

## Rollback & Reversibility
- No migration, no flag, no user file written; late revert loses nothing.
- Revert: `git revert`, then `npm test`.

## Observability
- CLI output only; parse failures print one line naming the file.
- Success: no "stale copy" reports about other toolkits.

## Open Questions
- [ ] None blocking. opencode's precedence among files, keys and plural dirs stays UNVERIFIED (documented).
