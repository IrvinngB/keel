# Persistence backend: openspec (files)

Canonical backend, always available. Everything lives in the user project,
git-tracked, team-shareable, versioned by git itself. This is the ONLY document that
maps logical keys to `openspec/` paths.

## Operations

```
SAVE(key, content): write to the mapped path (mkdir -p parents); read-before-write applies
LOAD(key):          read the mapped file — full content by definition
LIST(prefix):       list the mapped directory for the prefix (find for spec keys);
                    updated time = `git log -1 --format=%ci -- <path>`, else file mtime
```

## Mapping

| Logical key | Path |
|-------------|------|
| `config` | `openspec/config.yaml` (bootstrap: always this location) |
| `steering/<name>` | `openspec/steering/<name>.md` |
| `specs/<capability>` | `openspec/specs/<capability>/spec.md` |
| `lessons/<change>` | `openspec/lessons/<change>.md` |
| `init/<project>`, `caps/<project>` | not stored separately — covered by `config` (stack, testing) |
| `<change>/state` | `openspec/changes/<change>/state.yaml` |
| `<change>/explore` | `openspec/changes/<change>/exploration.md` |
| `<change>/proposal` | `openspec/changes/<change>/proposal.md` |
| `<change>/spec/<capability>` | `openspec/changes/<change>/specs/<capability>/spec.md` |
| `<change>/clarify` | `openspec/changes/<change>/clarifications.md` |
| `<change>/design` | `openspec/changes/<change>/design.md` |
| `<change>/blast-radius` | `openspec/changes/<change>/blast-radius.md` |
| `<change>/tasks` | `openspec/changes/<change>/tasks.md` |
| `<change>/estimate` | `openspec/changes/<change>/estimate.md` |
| `<change>/apply-progress` | `openspec/changes/<change>/apply-progress.md` |
| `<change>/drift` | `openspec/changes/<change>/drift-report.md` |
| `<change>/security` | `openspec/changes/<change>/security-report.md` (standalone, no change: report inline) |
| `<change>/verify-report` | `openspec/changes/<change>/verify-report.md` |
| `<change>/archive-report` | `openspec/changes/<change>/archive-report.md` |

## Archive finalization (files backend only)

After the orchestrator SAVEs `<change>/state` with `status: archived`, move the
folder: `openspec/changes/<change>/` → `openspec/changes/archive/<archived_on>-<change>/`
(create `archive/` if missing; `mv`).

Resolution rule: when `openspec/changes/<change>/` is absent, LOAD and LIST resolve
`<change>/...` inside the archived folder whose name is EXACTLY
`<YYYY-MM-DD>-<change>` (fixed 10-character date prefix, then `-`, then the full
change name — never a loose `*-<change>` glob, which would also match
`2026-09-23-bar-<change>`), read-only. If several dates match, the most recent
wins. Active-change listing is `openspec/changes/*/` excluding `archive/`.

Name reuse: a change name that exists as an active folder or as an archived folder
is taken. `new` must reject it and ask for a different name. `archive` is reserved
(it is the archive directory).

Rules: read-before-write (update, never blind overwrite); archived changes are
immutable — SAVE into an archived folder is refused.
