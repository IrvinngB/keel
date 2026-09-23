# Persistence backend: generic MCP memory server

Any MCP server that exposes store / fetch / enumerate tools (memory, knowledge,
vector-DB bridges…) can back the pipeline. This doc maps the three abstract
operations onto YOUR server's tools — fill the blanks once per project.

## Tool mapping (fill in)

```
server:   <mcp server name as configured>
SAVE:     <tool + args template>   — MUST upsert by key (else wrap: delete-then-create)
LOAD:     <tool + args template>   — MUST return full content (if the server returns
                                     snippets, require its get-by-id follow-up call)
LIST:     <tool + args template>   — enumerate by key prefix
```

## Rules

- Verify the mapping before first real use: SAVE a probe key, LIST it, LOAD it,
  diff content. A server that cannot return FULL content on LOAD fails the
  interface contract — do not use it (see interface.md).
- Upsert: if the server only appends, SAVE = delete matching key + create.
- Namespacing: prefix every key with `sdd/` to coexist with other users of the
  server.

## Capability notes

| | |
|---|---|
| Team-shareable | depends on server (remote/HTTP: usually yes) |
| Survives new session | yes (that's the point) |
| Version history | server-dependent — record it here if supported |
| Known limits | <auth, truncation, rate limits> |
