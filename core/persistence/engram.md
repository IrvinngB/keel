# Persistence backend: Engram (MCP)

Optional backend for tools with the Engram MCP server configured. Cross-session
recovery and compaction survival; NOT team-shareable (local DB) — for team
workflows prefer `openspec` or `hybrid`.

## Topic-key mapping (same logical identity as openspec)

| Logical artifact | topic_key | type |
|------------------|-----------|------|
| project context | `sdd-init/{project}` | architecture |
| testing capabilities | `sdd/{project}/testing-capabilities` | config |
| state | `sdd/{change}/state` | — (also write state.yaml to disk; cheap insurance) |
| explore | `sdd/{change}/explore` | architecture |
| proposal | `sdd/{change}/proposal` | architecture |
| spec | `sdd/{change}/spec` | architecture |
| clarifications | `sdd/{change}/clarifications` | architecture |
| design | `sdd/{change}/design` | architecture |
| tasks | `sdd/{change}/tasks` | architecture |
| estimate | `sdd/{change}/estimate` | architecture |
| apply-progress | `sdd/{change}/apply-progress` | architecture |
| drift | `sdd/{change}/drift` | architecture |
| security | `sdd/{change}/security` | architecture |
| verify | `sdd/{change}/verify-report` | architecture |
| archive | `sdd/{change}/archive-report` | architecture |

## Phase protocol

Retrieval (search returns PREVIEWS — full content is mandatory):

```
mem_search(query: "sdd/{change}/{type}", project: "{project}") → id
mem_get_observation(id)                                        → full content
```

Persistence (upsert via topic_key — re-running updates, never duplicates):

```
mem_save(title: "sdd/{change}/{type}", topic_key: same, type: "architecture",
         project: "{project}", capture_prompt: false, content: "{full artifact}")
```

`capture_prompt: false` is mandatory for pipeline artifacts (they are automated
outputs, not human saves); omit the field only if the tool schema lacks it.

## apply-progress continuity

Before starting, search for existing `sdd/{change}/apply-progress`; if found, read
it, skip completed tasks, and MERGE on save. Overwriting without reading loses
prior batches.

## Hybrid mode

Write BOTH backends for every artifact; read Engram first, filesystem fallback.
Higher token cost — use when you need recovery AND team sharing.

## none mode

Return artifacts inline only; create no files, no saves. Warn that downstream
phases depend on what only the conversation holds.
