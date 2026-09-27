# Doctor Backend Doc Check Specification

## Purpose
Make `sdd doctor` notice when an installed `sdd-workflow` skill lacks the doc of the configured persistence backend.

## Requirements

### Requirement: Missing doc warning
For each skills-dir row (not per agent), `sdd doctor` MUST warn when the installed `SKILL.md` does not inline the doc of a backend in the project's `artifact_store` AND its `persistence/<name>.md` side file is missing. A doc counts as inline when its first heading, taken from the core doc, appears in `SKILL.md`. For `files+sqlite` both halves MUST be checked. `files` and `none` MUST need nothing beyond the inline default. The warning MUST name the backend, the skill folder checked and `sdd install <agent>`.

#### Scenario: Doc neither inline nor beside
- GIVEN `artifact_store: files+sqlite` and an installed skill whose `SKILL.md` lacks the sqlite heading and has no `persistence/sqlite.md`
- WHEN `sdd doctor` runs
- THEN a warning names `sqlite`, the skill folder and `sdd install`

#### Scenario: Doc inline
- GIVEN `artifact_store: sqlite` and a skill that inlines the sqlite doc, with no `persistence/` folder
- WHEN `sdd doctor` runs
- THEN no backend doc warning is printed

#### Scenario: Files or none
- GIVEN `artifact_store: files` (or `none`) and a skill with no `persistence/` folder
- WHEN `sdd doctor` runs
- THEN no backend doc warning is printed

### Requirement: Warn, never fail
A missing doc MUST produce a warning line only; doctor MUST exit 0 and still print every other section.

#### Scenario: Missing doc
- GIVEN a missing backend doc
- WHEN `sdd doctor` runs
- THEN the exit code is 0
- AND the commit guard and dialect lines are still printed

### Requirement: Silent when healthy
When every required doc is inline or present as a side file, output MUST be byte-identical to the pre-change output.

#### Scenario: Side file present
- GIVEN `artifact_store: sqlite` and an installed skill containing `persistence/sqlite.md`
- WHEN `sdd doctor` runs
- THEN the output equals the pre-change output for that project

### Requirement: No false warnings
Doctor MUST NOT run this check for plugin-managed `claude`, whose skill folder it cannot locate. It MUST NOT warn for a skills-dir row with no installed Keel skill, or for an unknown `artifact_store` value the existing check reports. It MUST NOT modify files.

#### Scenario: Plugin-managed claude
- GIVEN `claude` installed by plugin with `sqlite` configured
- WHEN `sdd doctor` runs
- THEN nothing is reported for it

#### Scenario: Not installed
- GIVEN a skills-dir row with no Keel skill in project or user folders
- WHEN `sdd doctor` runs
- THEN nothing is reported for it

### Requirement: Test coverage
Tests MUST cover a missing doc (warning, exit 0), an inline doc and a healthy side file (output unchanged), and MUST fail if the check is removed.

#### Scenario: Check removed
- GIVEN the check is deleted
- WHEN `npm test` runs
- THEN the missing-doc test fails
