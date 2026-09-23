# Persistence backend: openspec (files)

Canonical backend, always available. Everything lives in the user project,
git-tracked, team-shareable, versioned by git itself.

## Operations

```
SAVE(key, content): write to the mapped path (mkdir -p parents); read-before-write applies
LOAD(key):          read the mapped file — full content by definition
LIST(prefix):       ls openspec/changes/<change>/ (+ find for specs)
```

## Mapping

| Logical artifact | Path |
|------------------|------|
| config | `openspec/config.yaml` |
| steering docs | `openspec/steering/{product,tech,structure}.md` |
| main spec (source of truth) | `openspec/specs/<capability>/spec.md` |
| state | `openspec/changes/<change>/state.yaml` |
| exploration | `openspec/changes/<change>/exploration.md` |
| proposal | `openspec/changes/<change>/proposal.md` |
| spec delta / new spec | `openspec/changes/<change>/specs/<capability>/spec.md` |
| clarifications | `openspec/changes/<change>/clarifications.md` |
| design | `openspec/changes/<change>/design.md` |
| tasks | `openspec/changes/<change>/tasks.md` |
| estimate | `openspec/changes/<change>/estimate.md` |
| apply progress | `openspec/changes/<change>/apply-progress.md` |
| drift | `openspec/changes/<change>/drift-report.md` |
| security | `openspec/changes/<change>/security-report.md` |
| verify | `openspec/changes/<change>/verify-report.md` |
| archive report | `openspec/changes/<change>/archive-report.md` (moves with folder) |

Rules: read-before-write (update, never blind overwrite); archived changes under
`openspec/changes/archive/YYYY-MM-DD-<change>/` are immutable.
