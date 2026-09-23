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
  server. Every logical key in interface.md (`config`, `steering/<name>`,
  `specs/<capability>`, `<change>/state`, `<change>/spec/<capability>`, …) maps
  verbatim under that prefix.
- `config` is a mirror only; the file copy stays authoritative (interface.md
  Bootstrap). Archiving needs no extra step — `status: archived` in
  `<change>/state` is the archive.
- LOAD must match the EXACT key. Free-text or fuzzy search can return a
  neighbouring key (`<change>/design` hitting `other-<change>/design`): after
  resolving, compare the stored key to the requested one and reject mismatches.
- LIST must page until exhausted (or use a limit larger than the store). A
  silent cap truncates active-change and `<change>/spec/` listings.
- Active changes = `sdd/*/state` records whose content is not `status: archived`.
  Reserve the names `config`, `specs`, `steering` and `lessons`, since they
  share the namespace with change names.

## Key mapping (default, under the `sdd/` prefix)

| Logical key | Stored key |
|-------------|------------|
| `<change>/<type>` | `sdd/<change>/<type>` |
| `<change>/state` | `sdd/<change>/state` |
| `<change>/spec/<capability>` | `sdd/<change>/spec/<capability>` |
| `specs/<capability>` | `sdd/specs/<capability>` |
| `steering/<name>` | `sdd/steering/<name>` |
| `config` | `sdd/config` (mirror only) |
| `lessons/<change>` | `sdd/lessons/<change>` |

`lessons/<change>` must never live under `sdd/<change>/`: postmortem runs after
archive, and no phase may SAVE inside an archived change namespace.

## Worked example (hypothetical server exposing `put`, `get`, `find`)

```
server:   notes
SAVE:     put(key: "sdd/<key>", body: content)          — put overwrites: upsert OK
LOAD:     r = find(prefix: "sdd/<key>", limit: 1) → id; get(id) → body
          reject unless r.key == "sdd/<key>"; find returns 200-char snippets, so get(id) is required
LIST:     find(prefix: "sdd/<prefix>", page: 1..n) until empty
```

## Capability notes

| | |
|---|---|
| Team-shareable | depends on server (remote/HTTP: usually yes) |
| Survives new session | yes (that's the point) |
| Version history | server-dependent — record it here if supported |
| Known limits | <auth, truncation, rate limits> |
