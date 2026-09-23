# Persistence — Backend Interface

Every artifact in the pipeline has ONE logical identity, independent of storage:

```
<change>/<type>          e.g. add-rate-limiting/proposal
init/<project>           project context        → project-context
caps/<project>           testing capabilities   → testing-capabilities
lessons/<change>         postmortem output      → lessons
```

A **backend** is any store that implements three operations. Phases speak ONLY
these operations — never a vendor tool name.

| Operation | Contract |
|-----------|----------|
| `SAVE(key, content)` | create or REPLACE atomically by key (upsert). No append-mode backends qualify without a merge rule. |
| `LOAD(key)` | return the FULL content. A preview/truncated result is a contract violation — phases must re-fetch until they have full text. |
| `LIST(prefix)` | enumerate keys under a prefix (used for recovery and `status`). |

Plus two shared rules every backend inherits:

- **Read before write**: LOAD first when the key may exist; update, don't clobber.
- **apply-progress merges**: SAVE only after folding previous completions in.

## Selection

`openspec/config.yaml`:

```yaml
artifact_store: openspec          # single backend
artifact_store: openspec+engram   # combination: write ALL, read in listed order
artifact_store: none              # conversation-only, warn about loss
```

Any backend name (or `+` combination) that has a doc in this folder is valid.
`none` always valid.

## Registered backends

| Key | Doc | Shareable | Cross-session | Needs |
|-----|-----|-----------|---------------|-------|
| `openspec` | openspec.md | ✅ (git) | via repo | — (always available) |
| `engram` | engram.md | ❌ local DB | ✅ | Engram MCP configured |
| `sqlite` | sqlite.md | ❌ local file | ✅ | `sqlite3` CLI |
| `mcp-generic` | mcp-generic.md | ❌ | depends on server | any MCP store with 3 mappable tools |

## Adding your own backend

1. Copy `template.md` → `<name>.md`, fill the three operations + tooling/paths.
2. Add a row to the table above.
3. Done — no phase, command or orchestrator file changes. `config.yaml` picks it.

Test it: run `LOAD` on a key you `SAVE`d in the same session and verify the
content is byte-identical and untruncated.
