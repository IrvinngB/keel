# Design: Add a policy/compliance review agent (`sdd-compliance`)

## Technical Approach
Add `sdd-compliance` as a flat, read-only auxiliary phase agent and `compliance` command, mirroring `sdd-security` across `core/`, `build/manifest.json`, and `keel/config.yaml`. The agent detects applicable privacy/consent/terms/content signals from artifacts and diffs, checks only whether each applicable concern is acknowledged, wraps every report in an opening and closing non-legal-advice disclaimer, and uses `HIGH / MEDIUM / LOW / INFO` severities (never `CRITICAL`).

## Architecture Decisions

### Decision: Mirror `sdd-security` as a single flat phase contract
**Choice**: One phase contract (`core/phases/sdd-compliance.md`) and one command (`core/commands/compliance.md`) with `Read, Grep, Glob, Bash` tools and no sub-agents.
**Alternatives considered**: A coordinator launching separate sub-agents per domain (cookies, privacy, terms, forms).
**Rationale**: Every phase contract in Keel enforces the flat-contract rule ("Do NOT delegate, do NOT launch subagents"). Matching `sdd-security` keeps the architecture uniform and works identically across all generated adapters.

### Decision: Acknowledgment-only baseline without jurisdiction mode
**Choice**: Detect signals (cookies/trackers, auth/accounts, payments, user uploads, PII forms, minors/cross-border flags) and check for acknowledgment evidence only.
**Alternatives considered**: Bundling per-country legal tables or fetching live legal rules.
**Rationale**: Keel has zero runtime dependencies and no legal maintenance process; bundled legal claims go stale and imply legal clearance.

### Decision: Non-blocking severity scale (`HIGH / MEDIUM / LOW / INFO`)
**Choice**: Exclude `CRITICAL` from `sdd-compliance` findings.
**Alternatives considered**: Using `CRITICAL` like `sdd-security`.
**Rationale**: `sdd-verify` reserves `CRITICAL` for archive-blocking failures; missing policy acknowledgments should surface clearly without blocking code archival.

## Data Flow
```
User / sdd-verify (when compliance_review: true)
  │
  ▼
{{cmd:compliance}} [change | range | paths]
  │
  ▼
{{agent:sdd-compliance}}
  ├─ 1. Inspect proposal/spec/design/diff/manifests for signals
  ├─ 2. Mark applicable areas + low-confidence flags (minors, cross-border)
  ├─ 3. Check for acknowledgments (notice, link, consent control, license/takedown)
  └─ 4. Emit report with opening + closing disclaimer
        ├─ named change → SAVE <change>/compliance (keel/changes/<change>/compliance-report.md)
        └─ range/paths  → return inline
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `core/phases/sdd-compliance.md` | Create | Flat phase contract for `sdd-compliance` |
| `core/commands/compliance.md` | Create | Orchestrator command delegating to `{{agent:sdd-compliance}}` |
| `build/manifest.json` | Modify | Add `agents.sdd-compliance` and `commands.compliance` |
| `build/generate.js` | Modify | Derive expected phase/command counts from manifest and list `sdd-compliance` in generic block |
| `core/orchestrator.md` | Modify | List `{{agent:sdd-compliance}}` in auxiliary phases and routing |
| `core/conventions.md` | Modify | Document `{{agent:sdd-compliance}}` and `<change>/compliance` key |
| `core/persistence/files.md` | Modify | Map `<change>/compliance` → `keel/changes/<change>/compliance-report.md` |
| `core/phases/sdd-verify.md` | Modify | Add optional `compliance_review: true` pass after `security_review` |
| `core/commands/verify.md` | Modify | Surface `compliance_review: true` in verify command |
| `keel/config.yaml` | Modify | Add `compliance_review: false` |
| `keel/steering/tech.md` | Modify | Document `Compliance review: OFF (compliance_review: false)` |
| `test/build.test.js` | Modify | Verify `sdd-compliance` and `compliance` build cleanly into adapters |
| `adapters/**` | Regenerate | Run `node bin/sdd build` (committed separately) |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Unit / Build | `sdd-compliance` agent & `compliance` command appear in generated adapters, `core/` stays tool-agnostic | `node --test test/build.test.js` |
| Full Suite | All existing build, artifact, store, install, guard, and docs tests pass | `npm test` |

## Migration / Rollout
Additive change with `compliance_review: false` by default. Existing repos require no migration; projects opt in by setting `compliance_review: true` in `keel/config.yaml` or invoking `{{cmd:compliance}}` directly.

## Rollback
Revert the core/manifest/config edits and regenerate `adapters/` via `node bin/sdd build`.
