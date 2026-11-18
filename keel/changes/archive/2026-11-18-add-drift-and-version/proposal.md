# Proposal: Add `sdd drift` and `sdd --version`

## Intent
Provide deterministic drift detection (`sdd drift`) comparing `design.md` File Changes against `git diff`, and standard CLI version reporting (`sdd --version` / `-v` / `version`) reading `MANIFEST.version` (safe for published npm installs where `package.json` may not be in `files`).

## Scope

### In Scope
- `sdd --version` / `-v` / `version`: prints `keel-sdd <MANIFEST.version>` and exits `0`.
- `sdd drift [change] [--base=<ref>] [--strict]`:
  - Extracts planned file paths from `design.md` `## File Changes` table.
  - Compares against `git diff --name-only <base>...HEAD` (default `<base>` = `main` if present, else `HEAD~1`) + working tree changes, ignoring `keel/` and `adapters/`.
  - Reports `unplanned` (touched in git, not in design) and `untouched` (in design, not touched in git).
  - Exits `0` by default, or `1` if drift is found and `--strict` is passed.
- Tests in `test/drift-version.test.js`, help text, `README.md`, `docs/es/README.md`, `CHANGELOG.md`.

### Out of Scope
- Modifying `core/phases/sdd-drift.md` (the LLM phase contract).

## Capabilities

### New Capabilities
- `cli-drift`: deterministic CLI drift detection and version reporting.

### Modified Capabilities
- None.

## Risks
Level: **Low** (read-only CLI commands).
