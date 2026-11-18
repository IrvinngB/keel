# Design: Validate the files store in `sdd doctor`

## Technical Approach
Exploration approach 2; clarify Resolved Q1-Q7 are constraints. `bin/sdd` gains pure functions returning findings; `doctor` only renders them. `stateOf`, `activeChanges`, `status`, `next`, `probeBackend` stay unchanged. Apply starts after PR #11 merges.

## Architecture Decisions

### Decision: separate strict reader
**Choice**: `readStateStrict(file)` reuses `stateOf`'s rules (`\n` split, `/^([a-z_]+):\s*(.*)$/`), adding reasons and key counts.
**Alternatives considered**: changing `stateOf`; a YAML parser.
**Rationale**: doctor sees what `status`/`next` see (Q2); zero dependencies.

### Decision: findings as data
**Choice**: `validateStore(root)` returns `[{ change, problem }]` sorted by name; no printing, no writes.
**Alternatives considered**: inline in the `doctor` case.
**Rationale**: testable in-process; smaller PR #11 conflict.

### Decision: render as a project row
**Choice**: after the `artifact_store` try/catch, before `commit guard`: `  store checks         <n> finding(s), read-only`, then `    <change>  <problem>`; only when n > 0. Skip note: `  store checks         skipped — artifact_store is <v>; only the files backend is validated`.
**Alternatives considered**: a `\n`-headed block like collisions.
**Rationale**: a header there would visually absorb the `commit guard` rows; matches the Q4 note.

### Decision: export for unit tests
**Choice**: `main();` becomes `if (require.main === module) main(); else module.exports = { validateStore, validateName, readStateStrict };`.
**Alternatives considered**: e2e only.
**Rationale**: `changes\Foo_Bar` cannot be a portable real folder.

## Rules

| Order | Condition | Problem |
|---|---|---|
| file-unreadable | `\r`, BOM, required value starting `"`/`'` or containing ` #` | `state.yaml unreadable: <reason>`; stop |
| key-unreadable | `completed` empty or not `[..]`; required key only as `^\s+key:` | same; key skipped |
| invalid | missing key, bad status, bad/missing `archived_on` when archived, unknown phase, duplicate key | `invalid: ...` |
| location | archived under `changes/`, active under `archive/`, folder date ≠ `archived_on` | Q7 templates |
| artifacts | completed phase without file | `completed "<p>" but <file> is missing` |

Required: explore `exploration.md`, proposal, design, tasks, apply `apply-progress.md`, verify `verify-report.md`, archive `archive-report.md`. Optional: spec, clarify, blast-radius.

Scan: directories only, dot-names skipped; missing `state.yaml` reported for active only. Archive entries must match `^\d{4}-\d{2}-\d{2}-<kebab>$`; `slice(11)` among active names gives `exists as active and archived (<folder>)`. `validateName(relPath)`: `\`→`/`, last segment, kebab `^[a-z0-9]+(-[a-z0-9]+)*$`, reserved list.

`artifact_store`: extract the existing regex into `configuredStore()` (output unchanged). Absent config/key validates (UNVERIFIED default); any `+` segment `files` validates; else one skip note.

## Data Flow

```
doctor ─ configuredStore ─┬─ no files ─> skip note
                          └─ validateStore ─> validateName, readStateStrict ─> rules ─> rows if n>0
```

## File Changes

| File | Action | Description | Lines |
|---|---|---|---|
| `bin/sdd` | Modify | functions, doctor wiring, export guard, help text | ~100 |
| `test/store.test.js` | Create | `repo()`/`write()`/`sdd()` fixtures, regex asserts | ~140 |
| `CHANGELOG.md` | Modify | Unreleased/Added | ~3 |

Docs skipped: no `docs/install.md` section covers doctor's `keel/` rows; `docs.test.js` parity untouched. ~245 lines: one PR.

## Interfaces / Contracts

```js
validateStore(root)   // [{ change, problem }]
readStateStrict(file) // { fields, counts, unreadable, skipped }
validateName(relPath) // string|null
```

## Testing Strategy (Strict TDD)

| Scenario | Assertion | State |
|---|---|---|
| broken store | exit 0, tree snapshot equal, row present | RED |
| other backend | `sqlite`, `none`: one note | RED |
| no state | `foo\s+no state\.yaml` | RED |
| CRLF | `unreadable`, no `invalid` | RED |
| block list, unknown phase, date mismatch, missing `design`, duplicate | row names the item | RED |
| Windows | `validateName('changes\\Foo_Bar')` | RED |
| no keel/, stray entries, optional spec | no `store checks` | guard |
| healthy store | `round-trip files` line followed by `commit guard` | guard, passes today |

Extra RED units: quoted value, duplicate key. Apply diffs one healthy run against a pre-change capture.

## Migration / Rollout
No migration required.

## Rollback & Reversibility
- No migrations or flag; validation writes nothing, so no data loss.
- `git revert`, `npm test`, confirm no `store checks` row.

## Observability
- CLI: findings on stdout, exit 0.
- Success: Keel's own `keel/` yields zero rows; each injected defect yields one.

## Open Questions
- [ ] Absent `artifact_store` = files: UNVERIFIED (non-blocking).
- [ ] Deferred: archived-edited-via-git check.
- [ ] Deferred: `stateOf` `split(/\r?\n/)` follow-up.
