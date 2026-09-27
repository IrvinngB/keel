# Store Validation Specification

## Purpose
`sdd doctor` reports structural problems in the files store (`keel/`).

## Requirements

### Requirement: Read-only warnings
Store validation MUST NOT write, rename or delete anything (doctor's existing probe file is separate). Every finding MUST be a warning; exit code MUST stay 0. `sdd status`, `sdd next` and state parsing MUST be unchanged.

#### Scenario: broken store
- GIVEN a store with defects
- WHEN `sdd doctor` runs
- THEN the exit code is 0 and no file changed

### Requirement: Findings section
A `store checks` section MUST print only when a finding exists. A healthy files store, or no `keel/`, MUST leave output byte-identical to today's, without crashing.

#### Scenario: no keel directory
- GIVEN no `keel/`
- WHEN `sdd doctor` runs
- THEN output is unchanged

### Requirement: Files backend only
`artifact_store` MUST be split on `+`; validate when any segment is `files`. Otherwise (`none`, `sqlite`, `mcp-generic`, unknown) the doctor MUST print one skipped note and nothing else.

#### Scenario: other backend
- GIVEN `artifact_store` is `sqlite`
- WHEN `sdd doctor` runs
- THEN exactly one skipped note is printed

### Requirement: Scan scope
Only directories MUST be scanned; stray files, `.gitkeep` and dot-directories MUST be ignored. Archive entries MUST match `^\d{4}-\d{2}-\d{2}-<kebab>$`. Archived folders without `state.yaml` MUST NOT be reported. An active folder without it MUST be reported `no state.yaml`.

#### Scenario: stray entries
- GIVEN `archive/.gitkeep` and `changes/.cache/`
- WHEN `sdd doctor` runs
- THEN nothing is reported

#### Scenario: folder without state
- GIVEN `changes/foo/` has no `state.yaml`
- WHEN `sdd doctor` runs
- THEN `foo` is reported `no state.yaml`

### Requirement: Unreadable is not invalid
CRLF, a BOM, or a quoted or ` #`-commented value on a required key MUST make the file `state.yaml unreadable: <reason>` with field checks skipped. Empty or block-style `completed` MUST be unreadable for that key only. Neither MAY be reported invalid or crash. Order: file-level unreadable, key-level unreadable, invalid.

#### Scenario: CRLF file
- GIVEN a CRLF `state.yaml`
- WHEN `sdd doctor` runs
- THEN it is unreadable, not invalid

#### Scenario: block-style list
- GIVEN `completed:` followed by `- proposal` lines
- WHEN `sdd doctor` runs
- THEN `completed` is unreadable

### Requirement: State fields
`state.yaml` MUST have `current_phase`, `completed` and `status` (`active` or `archived`), plus `archived_on` (`YYYY-MM-DD`) when archived. A missing key, other status, bad `archived_on`, phase outside explore, proposal, spec, clarify, design, blast-radius, tasks, apply, verify, archive, or duplicate key MUST be reported `invalid: ...`. `completed: []` is valid; extra keys are ignored.

#### Scenario: unknown phase
- GIVEN `completed: [proposal, deploy]`
- WHEN `sdd doctor` runs
- THEN a finding names `deploy`

### Requirement: Status matches location
`status: archived` MUST live in `archive/<archived_on>-<change>/`; `status: active` MUST NOT live under `archive/`. Mismatches MUST be reported.

#### Scenario: date prefix differs
- GIVEN `archive/2026-09-01-foo` has `archived_on: 2026-09-02`
- WHEN `sdd doctor` runs
- THEN a mismatch is reported

### Requirement: Completed phases have artifacts
Each `completed` phase MUST have its artifact, else `completed "<phase>" but <file> is missing`. `spec`, `clarify` and `blast-radius` are optional. Required: explore, proposal, design, tasks, apply (`apply-progress.md`), verify (`verify-report.md`), archive (`archive-report.md`).

#### Scenario: artifact missing
- GIVEN `completed: [design]` and no `design.md`
- WHEN `sdd doctor` runs
- THEN a finding names `design`

#### Scenario: optional phase
- GIVEN `completed: [spec]` and no `specs/`
- WHEN `sdd doctor` runs
- THEN nothing is reported

### Requirement: Change names
Names MUST be kebab-case and not reserved: config, steering, specs, lessons, init, caps, archive. A name MUST NOT exist both active and archived. `\` MUST be normalized to `/` before those checks.

#### Scenario: duplicate
- GIVEN `changes/foo/` and `changes/archive/2026-09-01-foo/`
- WHEN `sdd doctor` runs
- THEN `foo` is reported duplicated

#### Scenario: Windows separators
- GIVEN a path `changes\Foo_Bar`
- WHEN names are checked
- THEN `Foo_Bar` is reported
