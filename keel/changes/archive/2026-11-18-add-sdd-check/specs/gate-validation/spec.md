# Gate Validation Specification

## Purpose
Provide a deterministic, zero-token CLI command (`sdd check [change]`) that enforces SDD gate invariants on active changes under `keel/changes/`.

## Requirements

### Requirement: Scope Resolution and Exit Codes
`sdd check` MUST validate all active changes under `keel/changes/` when called without arguments, or only the named active change when `<change>` is provided. It MUST exit `0` when all checked changes pass (or no active changes exist) and exit `1` when any check fails or `<change>` does not exist.

#### Scenario: No active changes
- GIVEN a project with no active changes in `keel/changes/`
- WHEN `sdd check` runs
- THEN it exits `0` and reports that there are no active changes to check.

#### Scenario: Unknown change name
- GIVEN a project with `keel/changes/`
- WHEN `sdd check nonexistent-change` runs
- THEN it exits `1` with an error naming `nonexistent-change`.

### Requirement: Clarify Blocker Gate
When `design.md` or `apply-progress.md` exists for a change, `sdd check` MUST fail if `clarifications.md` contains an unresolved `## BLOCKER` section with one or more `### Q` questions.

#### Scenario: Design exists with open blocker
- GIVEN a change with `design.md` and a `clarifications.md` containing `## BLOCKER` followed by `### Q1: ...`
- WHEN `sdd check` runs
- THEN it exits `1` and reports the open clarify blocker.

#### Scenario: Clarifications resolved or no blockers
- GIVEN a change with `design.md` and `clarifications.md` containing `## Resolved` (and no `### Q` under `## BLOCKER`)
- WHEN `sdd check` runs
- THEN the clarify blocker check passes.

### Requirement: Spec Requirement and Scenario Structure
Every `specs/<capability>/spec.md` file in an active change MUST contain at least one `### Requirement:` block, and every `### Requirement:` block MUST contain at least one `#### Scenario:` with `GIVEN`, `WHEN`, and `THEN`.

#### Scenario: Requirement missing scenario or GIVEN/WHEN/THEN
- GIVEN a change spec file with `### Requirement: Foo` and no `#### Scenario:` containing `GIVEN`, `WHEN`, and `THEN`
- WHEN `sdd check` runs
- THEN it exits `1` and names the spec file and requirement.

#### Scenario: Valid spec file
- GIVEN a change spec file where every `### Requirement:` has a `#### Scenario:` with `GIVEN`, `WHEN`, and `THEN`
- WHEN `sdd check` runs
- THEN the spec structure check passes.

### Requirement: Design and Workload Guard Checks
When `design.md` exists, it MUST contain `## File Changes` and `## Testing Strategy`. When `tasks.md` has `Decision needed before apply: Yes` and `Chain strategy: pending`, `sdd check` MUST fail if `apply-progress.md` exists or any task is checked (`- [x]`).

#### Scenario: Apply started with pending workload decision
- GIVEN a change with `tasks.md` having `Decision needed before apply: Yes`, `Chain strategy: pending`, and `- [x] 1.1 Done`
- WHEN `sdd check` runs
- THEN it exits `1` and reports the unresolved workload decision.
