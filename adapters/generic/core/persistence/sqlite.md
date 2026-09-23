# Persistence backend: SQLite (local file)

Single local database, zero network, no MCP required. Good middle ground:
cross-session recovery like Engram, but portable with the machine and greppable.

## Operations

```
SAVE(key, content): INSERT OR REPLACE INTO sdd_artifacts(key, content, updated_at)
                    VALUES ('<key>', '<content>', datetime('now'));
LOAD(key):          SELECT content FROM sdd_artifacts WHERE key='<key>';
LIST(prefix):       SELECT key, updated_at FROM sdd_artifacts
                    WHERE key LIKE '<prefix>%';
```

Invoke via `sqlite3 openspec/.sdd-store.db "<sql>"`. Content with quotes: pass
through a temp file (`sqlite3 db ".read tmp.sql"`) or use parameter support if
available. Key slashes are kept verbatim (keys are plain TEXT).

## Setup (one-time, on first SAVE)

```sql
CREATE TABLE IF NOT EXISTS sdd_artifacts (
  key TEXT PRIMARY KEY, content TEXT NOT NULL, updated_at TEXT NOT NULL
);
```

## Capability notes

| | |
|---|---|
| Team-shareable | no — but the .db file can be committed if the team accepts binary churn |
| Survives new session | yes |
| Version history | no (add an sdd_history table + trigger if you want it) |
| Known limits | quoting via CLI; no full-text search without FTS5 module |
