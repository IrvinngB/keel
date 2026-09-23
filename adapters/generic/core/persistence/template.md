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

Key sanitization: `<change>/<type>` maps to
<how slashes/namespacing are handled in this store>.

## Setup (one-time)

<schema creation / server config / folder init — or "none">

## Capability notes

| | |
|---|---|
| Team-shareable | yes/no — why |
| Survives new session | yes/no |
| Version history | yes/no |
| Known limits | <truncation, auth, size> |
