# CI Gate Specification

## Purpose
Provide a single read-only `sdd ci [--strict-tasks]` command for CI pipelines to validate store health and gate invariants.

## Requirements

### Requirement: Store and Gate Enforcement
`sdd ci` MUST run `validateStore` and `checkChange` across all active changes and exit `1` if any error is found, or `0` if all pass (or `keel/` does not exist).

#### Scenario: Gate failure in CI
- GIVEN an active change with a failing spec or store error
- WHEN `sdd ci` runs
- THEN it exits `1` and prints the failing change and issue.

### Requirement: Optional Strict Task Enforcement
By default, `sdd ci` MUST warn on active changes with unchecked `- [ ]` tasks without failing; when `--strict-tasks` is passed, it MUST exit `1` if any active change has unchecked tasks.

#### Scenario: Strict tasks flag
- GIVEN an active change with one `- [ ]` task and valid gates
- WHEN `sdd ci --strict-tasks` runs
- THEN it exits `1` and reports the pending task count.
