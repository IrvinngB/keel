# Persistence backend: files

Canonical backend, always available. Everything lives in the user project,
git-tracked, team-shareable, versioned by git itself. This is the ONLY document that
maps logical keys to `keel/` paths.

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
| `config` | `keel/config.yaml` (bootstrap: always this location) |
| `steering/<name>` | `keel/steering/<name>.md` |
| `specs/<capability>` | `keel/specs/<capability>/spec.md` |
| `lessons/<change>` | `keel/lessons/<change>.md` |
| `init/<project>`, `caps/<project>` | not stored separately — covered by `config` (stack, testing) |
| `<change>/state` | `keel/changes/<change>/state.yaml` |
| `<change>/explore` | `keel/changes/<change>/exploration.md` |
| `<change>/proposal` | `keel/changes/<change>/proposal.md` |
| `<change>/spec/<capability>` | `keel/changes/<change>/specs/<capability>/spec.md` |
| `<change>/clarify` | `keel/changes/<change>/clarifications.md` |
| `<change>/design` | `keel/changes/<change>/design.md` |
| `<change>/blast-radius` | `keel/changes/<change>/blast-radius.md` |
| `<change>/tasks` | `keel/changes/<change>/tasks.md` |
| `<change>/estimate` | `keel/changes/<change>/estimate.md` |
| `<change>/apply-progress` | `keel/changes/<change>/apply-progress.md` |
| `<change>/drift` | `keel/changes/<change>/drift-report.md` |
| `<change>/security` | `keel/changes/<change>/security-report.md` (standalone, no change: report inline) |
| `<change>/verify-report` | `keel/changes/<change>/verify-report.md` |
| `<change>/archive-report` | `keel/changes/<change>/archive-report.md` |

## Archive finalization (files backend only)

After the orchestrator SAVEs `<change>/state` with `status: archived`, move the
folder: `keel/changes/<change>/` → `keel/changes/archive/<archived_on>-<change>/`
(create `archive/` if missing; `mv`).

Resolution rule: when `keel/changes/<change>/` is absent, LOAD and LIST resolve
`<change>/...` inside the archived folder whose name is EXACTLY
`<YYYY-MM-DD>-<change>` (fixed 10-character date prefix, then `-`, then the full
change name — never a loose `*-<change>` glob, which would also match
`2026-09-23-bar-<change>`), read-only. If several dates match, the most recent
wins. Active-change listing is `keel/changes/*/` excluding `archive/`.

Name reuse: a change name that exists as an active folder or as an archived folder
is taken. `new` must reject it and ask for a different name. `archive` is reserved
(it is the archive directory).

Rules: read-before-write (update, never blind overwrite); archived changes are
immutable — SAVE into an archived folder is refused.
