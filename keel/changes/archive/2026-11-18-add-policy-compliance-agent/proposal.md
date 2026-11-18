# Proposal: Add a policy/compliance review agent (`sdd-compliance`)

> Note: `gh issue view 13` could not be run from this phase (no Bash tool available
> here either). This proposal is built on the task brief's paraphrase of issue #13,
> as explore already flagged; re-check against the real issue body before design.

## Intent
Issue #13 asks for a review pass that flags missing privacy/legal-adjacent
acknowledgments (cookie notices, ToS links, upload/consent clauses) the way
`sdd-security` flags OWASP gaps. Nothing like this exists in Keel today.

## Scope

### In Scope
- New flat phase `sdd-compliance` + command `compliance`, mirroring `sdd-security`:
  `Read, Grep, Glob, Bash` only, no sub-agents.
- Config key `compliance_review: false` (default off), wired like
  `security_review`: standalone command + optional step inside `sdd-verify`.
- Artifact key `<change>/compliance` -> `keel/changes/<change>/compliance-report.md`
  (standalone, no-change: report inline).
- Detection step: infer applicable concerns from real signals (spec/design text,
  UI copy in the diff, route/dependency names — payment, analytics/ad, cookie SDKs,
  upload endpoints, auth, age fields).
- Check step: whether the concern is ACKNOWLEDGED somewhere (consent notice,
  privacy/ToS link, content-license/takedown clause, consent checkbox) — never
  whether it satisfies a specific law.
- Hard-coded disclaimer opening AND closing every report: not legal advice, verify
  with current law and counsel.
- Severity scale excludes CRITICAL (reserved by verify/security for archive-blocking).
- Low-confidence signals (targets minors, cross-border transfer) reported as flags
  for a human to confirm, never as detected facts.

### Out of Scope
- Jurisdiction mode. Cut entirely from v1, not deferred: no per-country checklist, no
  "does this satisfy GDPR/CCPA" answers. Keel has no legal team and no mechanism to
  keep jurisdiction data current.
- Any live web-fetch/network tool.
- Multiple sub-agents (violates the kit-wide flat-contract rule).

## Capabilities

### New Capabilities
- `compliance-review`: the `sdd-compliance` agent/command, `compliance_review`
  config flag, `<change>/compliance` artifact, and its optional wiring into
  `sdd-verify`.

### Modified Capabilities
- None (`keel/specs/` is empty).

## Approach
Copy `sdd-security`'s shape: Read-only checklist agent, evidence-based findings,
report-don't-fix. Severity scale: HIGH / MEDIUM / LOW / INFO (no CRITICAL).

## Affected Areas

| Area | Impact | Description |
|------|--------|--------------|
| `core/phases/sdd-compliance.md` | New | phase contract |
| `core/commands/compliance.md` | New | command body |
| `build/manifest.json` | Modified | `agents.sdd-compliance`, `commands.compliance` |
| `core/orchestrator.md`, `core/conventions.md` | Modified | auxiliary routing + artifact key row |
| `core/persistence/files.md` | Modified | `<change>/compliance` mapping |
| `core/phases/sdd-verify.md`, `core/commands/verify.md` | Modified | optional step when `compliance_review: true` |
| `keel/config.yaml`, `keel/steering/tech.md` | Modified | `compliance_review: false` |
| `adapters/**` | Regenerated | `node bin/sdd build`, separate commit |

## Risks

Level: **Low** (off by default, additive, no runtime behavior change until opted in).

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Report read as legal clearance | Medium | hard-coded open/close disclaimer, no PASS-style verdict framing |
| Scope creep back to jurisdiction mode | Medium | explicitly cut in this doc; separate future decision |
| False detection on low-confidence signals | Low | reported as flags, not facts |

## Rollback Plan
Revert the new phase/command files and the manifest/core edits; regenerate
adapters. Default `compliance_review: false` means no behavior changes until a
project opts in, so rollback has no data migration.

## Dependencies
None.

## Success Criteria
- [ ] `sdd-compliance` runs standalone and as an optional `sdd-verify` step.
- [ ] Every report opens and closes with the disclaimer.
- [ ] No jurisdiction logic anywhere in the shipped agent.
- [ ] `npm test` passes; `adapters/` clean after `node bin/sdd build`.
