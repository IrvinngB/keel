# Persistence — Backend Interface

Every artifact in the pipeline has ONE logical identity, independent of storage.
Phases, commands and the orchestrator name artifacts ONLY by these keys and never
by a path, table or vendor tool.

## Key scheme

```
config                          project configuration (stack, testing commands, artifact_store)
steering/<product|tech|structure>   project steering docs
specs/<capability>              main spec — the source of truth
<change>/state                  DAG state (orchestrator-owned; only the orchestrator SAVEs it)
<change>/<type>                 change artifact; type is one of:
                                explore · proposal · clarify · design · blast-radius ·
                                tasks · estimate · apply-progress · drift · security ·
                                verify-report · archive-report
<change>/spec/<capability>      spec delta or new full spec (one key per capability)
lessons/<change>                postmortem output
init/<project>                  project context (legacy key, kept)
caps/<project>                  testing capabilities (legacy key, kept)
```

Reserved first segments — never valid as a change name: `config`, `steering`,
`specs`, `lessons`, `init`, `caps`.

`<change>/state` fields: `current_phase`, `completed: [...]`, `open_questions`,
`updated`, `status: active|archived`, `archived_on: YYYY-MM-DD` (set when archived).

A **backend** is any store that implements three operations. Phases speak ONLY
these operations — never a vendor tool name.

| Operation | Contract |
|-----------|----------|
| `SAVE(key, content)` | create or REPLACE atomically by key (upsert). No append-mode backends qualify without a merge rule. |
| `LOAD(key)` | return the FULL content. A preview/truncated result is a contract violation — phases must re-fetch until they have full text. A missing key is reported as missing, never as empty content. |
| `LIST(prefix)` | enumerate keys under a prefix (used for recovery and `status`). SHOULD also return each key's last-updated time; a backend that cannot says so in its doc. |

Plus shared rules every backend inherits:

- **Read before write**: LOAD first when the key may exist; update, don't clobber.
- **apply-progress merges**: SAVE only after folding previous completions in.
- **Active changes**: `LIST` the `*/state` keys and keep those whose `status` is not
  `archived`.
- **Archived is immutable**: once `<change>/state` has `status: archived`, no phase
  SAVEs any `<change>/...` key. Every archived key stays readable by LOAD/LIST
  (postmortem depends on it).

## Bootstrap

`config` is the one key that names the backend, so it cannot be located through the
backend. The orchestrator always resolves it at the files-backend location (see
`openspec.md`); after that every phase LOADs `config` like any other key. A `+`
combination may mirror `config` to the other backends, but the file copy stays
authoritative.

## Selection

`artifact_store` inside `config`:

```yaml
artifact_store: openspec          # single backend
artifact_store: openspec+sqlite   # combination: write ALL, read in listed order
artifact_store: none              # conversation-only, warn about loss
```

Any backend name (or `+` combination) that has a doc in this folder is valid.
`none` always valid.

## Archiving

Archive is a state transition, not a file move: the archive phase LOADs the
`<change>/spec/*` deltas, merges each into `specs/<capability>` (LOAD + SAVE), and
SAVEs `<change>/archive-report`; the orchestrator then SAVEs `<change>/state` with
`status: archived` and `archived_on`.

A backend with native directories MAY relocate the change as a finalization step
(the files backend does — see `openspec.md`) as long as every key keeps resolving.
A backend without directories (SQLite, memory servers, MCP stores) needs nothing more: the
`status: archived` flag IS the archive, and its keys are simply never written again.

## Registered backends

| Key | Doc | Shareable | Cross-session | Needs |
|-----|-----|-----------|---------------|-------|
| `openspec` | openspec.md | ✅ (git) | via repo | — (always available) |
| `sqlite` | sqlite.md | ❌ local file | ✅ | `sqlite3` CLI |
| `mcp-generic` | mcp-generic.md | ❌ | depends on server | any MCP store with 3 mappable tools |

## Adding your own backend

Bring your own store: map any MCP memory server with `mcp-generic.md`, or copy
`template.md` for anything else.

1. Copy `template.md` → `<name>.md`, fill the three operations + tooling/paths.
2. Add a row to the table above.
3. Done — no phase, command or orchestrator file changes. `artifact_store` in `config` picks it.

Test it: run `LOAD` on a key you `SAVE`d in the same session and verify the
content is byte-identical and untruncated. Then SAVE and LOAD `config`, `steering/tech`,
`specs/<capability>`, `<change>/state` and `<change>/spec/<capability>` — the keys
with structure beyond `<change>/<type>`.
