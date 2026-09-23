# Persistence backend: Engram (MCP)

Local memory DB via the Engram MCP server. Cross-session recovery and compaction
survival; NOT team-shareable (local DB) — for team workflows combine
(`openspec+engram`) or prefer the files backend.

## Operations

```
SAVE(key, content): mem_save(title: key, topic_key: key, type: "architecture",
                  project: "{project}", capture_prompt: false, content)
                  — topic_key makes SAVE an upsert
LOAD(key):          mem_search(query: key, project: "{project}") → id,
                    THEN mem_get_observation(id) → FULL content.
                    ⚠ search results are 300-char PREVIEWS — using them as
                    source material violates the LOAD contract. Always follow
                    with mem_get_observation.
LIST(prefix):       mem_search(query: prefix, project: "{project}", limit: 20)
```

`capture_prompt: false` is mandatory for pipeline artifacts (automated outputs,
not human saves); omit the field only if the tool schema lacks it.

## Key mapping

| Logical key | topic_key |
|-------------|-----------|
| `init/<project>` | `sdd-init/<project>` |
| `caps/<project>` | `sdd/<project>/testing-capabilities` |
| `<change>/<type>` | `sdd/<change>/<type>` |
| `lessons/<change>` | `sdd/<change>/postmortem` |

`type` argument of mem_save: `architecture` for pipeline artifacts, `config`
for caps.

## Capability notes

| | |
|---|---|
| Team-shareable | no — local DB |
| Survives new session | yes |
| Version history | no — upsert overwrites (git-combine via `openspec+engram` if needed) |
| Known limits | preview-only search (see LOAD), conflict-review prompts on save |
