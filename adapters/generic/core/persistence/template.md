# Persistence backend: <name>   ← copy this file, fill <>

<!-- One paragraph: what this store is and when to prefer it. -->

## Operations

```
SAVE(key, content):
  <exact command/tool call — upsert semantics>
LOAD(key):
  <exact command/tool call — must return FULL content>
LIST(prefix):
  <exact command/tool call>
```

Key sanitization: every logical key in interface.md (including `config`,
`steering/<name>`, `specs/<capability>`, `<change>/state`,
`<change>/spec/<capability>`) maps to
<how slashes/namespacing are handled in this store>.

Archiving: `status: archived` in `<change>/state` is the archive; state here only
what extra relocation this store performs, if any ("none" is fine).

## Setup (one-time)

<schema creation / server config / folder init — or "none">

## Capability notes

| | |
|---|---|
| Team-shareable | yes/no — why |
| Survives new session | yes/no |
| Version history | yes/no |
| Known limits | <truncation, auth, size> |
