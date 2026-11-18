# Session Resume Specification

## Purpose
Provide a zero-token CLI handover briefing (`sdd resume [change]`) for resuming long or compacted sessions, and optional cross-repo lesson distillation in `sdd-postmortem`.

## Requirements

### Requirement: Compact Handover Briefing
`sdd resume [change]` MUST print a concise summary of the target active change including current phase, task counts, up to 3 next unchecked tasks, open `BLOCKER` questions (if any), recent `apply-progress.md` items, and working-tree status, exiting `0`.

#### Scenario: Resume active change with pending tasks and blockers
- GIVEN an active change with `state.yaml`, `tasks.md` containing `- [ ]` items, and `apply-progress.md`
- WHEN `sdd resume <change>` runs
- THEN it prints the phase, task counts, next unchecked tasks, last progress, and exits `0`.

#### Scenario: Unknown change name
- GIVEN a project with `keel/changes/`
- WHEN `sdd resume nonexistent` runs
- THEN it exits `1` naming `nonexistent`.
