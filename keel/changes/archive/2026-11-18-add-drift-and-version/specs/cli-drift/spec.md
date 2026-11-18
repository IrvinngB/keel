# CLI Drift and Version Specification

## Purpose
Provide deterministic `sdd drift` comparison between `design.md` and `git diff`, and `sdd --version` reporting from `build/manifest.json`.

## Requirements

### Requirement: CLI Version Reporting
`sdd --version`, `sdd -v`, and `sdd version` MUST print `keel-sdd <version>` using `MANIFEST.version` and exit `0`.

#### Scenario: Version flag
- GIVEN the CLI is installed
- WHEN `sdd --version` runs
- THEN it prints `keel-sdd <version>` and exits `0`.

### Requirement: Deterministic Drift Detection
`sdd drift [change] [--base=<ref>] [--strict]` MUST parse `## File Changes` from `design.md` and compare non-`keel/`, non-`adapters/` paths against `git diff --name-only <base>...HEAD`, reporting unplanned and untouched files.

#### Scenario: Unplanned and untouched files detected
- GIVEN a change whose `design.md` lists `a.js` while git modified `b.js`
- WHEN `sdd drift <change> --strict` runs
- THEN it reports `b.js` as unplanned, `a.js` as untouched, and exits `1`.

#### Scenario: Clean match
- GIVEN a change whose `design.md` lists `a.js` and git modified `a.js`
- WHEN `sdd drift <change> --strict` runs
- THEN it reports no drift and exits `0`.
