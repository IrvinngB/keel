# Proposal: Add `sdd archive` and `sdd ci` CLI commands

## Intent
Automate the mechanical parts of closing an SDD change (`sdd archive`) and provide a single CI entry point (`sdd ci`) that enforces store validity and gate invariants without spending LLM tokens.

## Scope

### In Scope
- `sdd archive [change] [--dry-run]`:
  - Resolves `<change>` (explicit argument or the single active change).
  - Enforces gates: `verify-report.md` exists with `PASS` / `PASS WITH WARNINGS`, 0 pending `- [ ]` tasks, 0 `validateStore` or `checkChange` errors.
  - Syncs `specs/<cap>/spec.md` to `keel/specs/<cap>/spec.md` (full spec or `ADDED`/`MODIFIED`/`REMOVED` delta).
  - Writes `archive-report.md` if missing, updates `state.yaml` (`status: archived`, `archived_on`), and moves `keel/changes/<change>` to `keel/changes/archive/<YYYY-MM-DD>-<change>`.
- `sdd ci [--strict-tasks]`:
  - Runs `validateStore` + `checkChange` on all active changes; exits `1` on any error.
  - Reports unchecked tasks (`- [ ]`) as warnings by default, or failures when `--strict-tasks` is passed.
- Unit & CLI tests in `test/archive-ci.test.js`.
- Docs updates in `README.md`, `docs/es/README.md`, `CHANGELOG.md`, and `bin/sdd` help.

### Out of Scope
- Modifying `.github/workflows/ci.yml` in this repo (can adopt `sdd ci` separately).

## Capabilities

### New Capabilities
- `cli-archive`: deterministic CLI archiving of verified changes.
- `ci-gate`: deterministic CI verification command (`sdd ci`).

### Modified Capabilities
- None.

## Risks
Level: **Low** (additive CLI commands; `--dry-run` supported for `sdd archive`).

## Success Criteria
- [ ] `sdd archive` refuses unverified or incomplete changes and archives passing ones cleanly.
- [ ] `sdd ci` exits `0` on valid stores and `1` on store/gate failures (or pending tasks with `--strict-tasks`).
- [ ] `npm test` passes.
