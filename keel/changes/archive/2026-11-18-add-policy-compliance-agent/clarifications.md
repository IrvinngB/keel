# Clarifications: Add a policy/compliance review agent (`sdd-compliance`)

No open questions — spec is clear and grounded in the codebase and issue #13.

## Resolved
- R1: Does GitHub issue #13 contain any requirements missing from the proposal? → Checked `gh issue view 13`: issue #13 asks for app-type detection, checks across cookies/trackers, privacy policy, terms & conditions, copyright/user content, and forms/consent, read-only reporting, and opening/closing legal disclaimers. Jurisdiction mode and sub-agents were explicitly cut in `proposal.md` for v1 to preserve Keel's flat-contract and zero-dependency architecture. (2026-11-18)
- R2: How does `sdd-security` persist its report with `Read, Grep, Glob, Bash` tools? → Confirmed in `build/manifest.json` (`agents.sdd-security`) and `core/persistence/files.md`: `sdd-security` has `["Read", "Grep", "Glob", "Bash"]` and maps `<change>/security` to `keel/changes/<change>/security-report.md` (standalone without change: inline). `sdd-compliance` will mirror this exact pattern. (2026-11-18)
- R3: How does `sdd-verify` wire optional review passes? → Confirmed in `core/phases/sdd-verify.md` step 7 and `core/commands/verify.md`: `security_review: true` triggers the pass in `sdd-verify` and is surfaced in `commands/verify.md`. `compliance_review: false` in `keel/config.yaml` will mirror `security_review: false`. (2026-11-18)
