# CLI Archive Specification

## Purpose
Provide a deterministic `sdd archive [change] [--dry-run]` command to close verified changes under `keel/changes/`.

## Requirements

### Requirement: Pre-Archive Verification Gate
`sdd archive` MUST refuse to archive a change if `verify-report.md` is missing, if its verdict is `FAIL`, if any `- [ ]` tasks remain unchecked, or if `validateStore` or `checkChange` reports issues.

#### Scenario: Missing verify report or pending tasks
- GIVEN an active change with unchecked tasks or without `verify-report.md`
- WHEN `sdd archive <change>` runs
- THEN it exits `1` and leaves `keel/changes/<change>` untouched.

### Requirement: Spec Sync and Archive Finalization
When gates pass, `sdd archive` MUST sync `specs/<cap>/spec.md` into `keel/specs/<cap>/spec.md`, write `archive-report.md` if absent, update `state.yaml` (`status: archived`, `archived_on`), and move the folder to `keel/changes/archive/<YYYY-MM-DD>-<change>`. With `--dry-run`, it MUST write or move nothing.

#### Scenario: Successful archive
- GIVEN a verified active change with all tasks `[x]` and a `PASS` verify report
- WHEN `sdd archive <change>` runs
- THEN it syncs specs, updates `state.yaml`, moves the folder to `keel/changes/archive/<YYYY-MM-DD>-<change>`, and exits `0`.
