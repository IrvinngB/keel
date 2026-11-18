# Tasks: Add a policy/compliance review agent (`sdd-compliance`)

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: single-pr
400-line budget risk: Low

Estimated changed lines: ~160 lines (excluding regenerated `adapters/`) · Delivery strategy: single-pr

## Phase 1: Core Phase & Command Contracts
- [x] 1.1 Create `core/phases/sdd-compliance.md` with signal detection, acknowledgment checklist, opening/closing disclaimers, `HIGH/MEDIUM/LOW/INFO` severity scale, and read-only rules.
- [x] 1.2 Create `core/commands/compliance.md` delegating to `{{agent:sdd-compliance}}` with scope resolution (`change-name | commit-range | file-paths`).

## Phase 2: Manifest & Core Wiring
- [x] 2.1 Add `agents.sdd-compliance` (`Read, Grep, Glob, Bash`) and `commands.compliance` to `build/manifest.json`.
- [x] 2.2 Update `core/orchestrator.md` and `core/conventions.md` to register `{{agent:sdd-compliance}}` and `<change>/compliance`.
- [x] 2.3 Update `core/persistence/files.md` to map `<change>/compliance` to `keel/changes/<change>/compliance-report.md` (standalone inline).
- [x] 2.4 Update `core/phases/sdd-verify.md` and `core/commands/verify.md` to run/surface compliance review when `compliance_review: true`.

## Phase 3: Project Config & Steering
- [x] 3.1 Add `compliance_review: false` to `keel/config.yaml`.
- [x] 3.2 Document `Compliance review: OFF (compliance_review: false)` in `keel/steering/tech.md`.

## Phase 4: Testing & Adapter Build
- [x] 4.1 Add test in `test/build.test.js` verifying `sdd-compliance` phase/command generation and disclaimer/severity contract presence.
- [x] 4.2 Run `node bin/sdd build` to regenerate `adapters/` and verify `npm test` passes.

## Phase 5: Cleanup
- [x] 5.1 Update `CHANGELOG.md` under `## Unreleased` with the new `sdd-compliance` agent and `compliance_review` config option.
