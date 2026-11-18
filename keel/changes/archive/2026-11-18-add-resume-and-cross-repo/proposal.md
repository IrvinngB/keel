# Proposal: Add `sdd resume` and cross-repo lesson distillation

## Intent
Solve two persistent-context gaps without moving `keel/` out of git:
1. Long/compacted sessions lose context or burn tokens re-reading 7+ markdown files → `sdd resume [change]` emits a compact handover briefing from `bin/sdd` at zero token cost.
2. Lessons learned in one repo don't carry across repos → `sdd-postmortem` optionally distills reusable patterns to `shared_steering` (`~/.keel/steering/` or `config.shared_steering`) or an active session's persistent memory tool.

## Scope
- `bin/sdd`: add `sdd resume [change]` (`runResume`) and `sharedSteeringPath()`, plus help text.
- `core/phases/sdd-postmortem.md`: add optional cross-repo distillation step.
- `core/commands/help.md`: document `sdd resume [change]`.
- `test/resume.test.js`: unit/CLI tests for `sdd resume`.
- Regenerate `adapters/` via `node bin/sdd build` (separate commit) and update `CHANGELOG.md` / `README.md` / `docs/es/README.md`.

## Capabilities

### New Capabilities
- `session-resume`: deterministic CLI handover briefing (`sdd resume`) and cross-repo lesson distillation guidance.

### Modified Capabilities
- None.
