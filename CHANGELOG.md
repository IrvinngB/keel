# Changelog

## 0.4.1 - 2026-09-24

First release published to npm as `keel-sdd`: `npx keel-sdd install <agent> --project`
or `npm install -g keel-sdd`. No behavior change in the CLI or the phase contracts.

### Added

- Install with `npx keel-sdd` or `npm install -g keel-sdd`.
- npm-ready package metadata (homepage, bugs, keywords, public access) and a
  `prepublishOnly` guard that runs the tests and rejects stale `adapters/`.
- `npm version` now keeps `build/manifest.json` and the marketplace version in step with
  `package.json`, and tests fail if any version field or the published `files` list
  drifts from what the CLI reads at runtime.

## 0.4.0 - 2026-09-24

Keel moves its artifacts to `keel/` so it can live next to OpenSpec, the commit guard
works with hook managers, worktrees and Windows, and the CLI has a test suite.
Upgrading from 0.3: run `sdd doctor` in each project, it prints every migration step.

### Breaking

- Artifacts moved from `openspec/` to `keel/`, and the files backend is now named
  `files` (was `openspec`). `openspec/` is the directory of OpenSpec, a different tool:
  sharing it mixed two tools' contracts, and the commit guard blocked OpenSpec users
  whose own tasks were unchecked. Keel no longer reads or guards `openspec/`.
  Migrate with `git mv openspec keel` and `artifact_store: files`; `sdd status` and
  `sdd doctor` detect an old Keel `openspec/` (its config has `artifact_store:`) and
  print this hint. Then re-run `sdd guard install`: guards older than v4 check
  `openspec/` and let every commit through; `sdd doctor` reports them as OUTDATED.

### Added

- Community files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue
  templates (bug, feature, agent support report) and a pull request template.
- CI: syntax check, `sdd build` self-check, adapters-in-sync check, and the test suite
  on Linux, macOS and Windows with Node 18 and 22.
- Test suite (`npm test`, `node:test`, zero dependencies) covering the commit guard,
  context-block upserts, `--context-file` path checks and dry runs.
- README reorganized around a pitch, quick start, real `sdd status` output and an
  honest comparison with OpenSpec and spec-kit; install details moved to
  `docs/install.md`.
- `package.json` with a `sdd` bin: `npm install -g github:IrvinngB/keel` works on
  every platform, including Windows.

### Fixed

- `sdd doctor` no longer suggests `/sdd:init` while an old Keel `openspec/` is waiting
  to be migrated, which would have created an empty `keel/` beside it.
- `sdd status` keeps its columns aligned when a change lists every planning phase.
- The commit guard is installed where git actually runs hooks
  (`git rev-parse --git-path hooks`): it honors `core.hooksPath` (husky, lefthook),
  linked worktrees, submodules and subdirectories. Before, it was written to
  `.git/hooks` and silently never ran, or failed with "not a git repository".
- An existing pre-commit hook is no longer inlined into the guard: it is kept intact as
  `pre-commit.keel-chained` and executed last, so Python, Node or bash hooks keep
  working. v2 guards with an inlined chain are migrated on reinstall.
- `.gitattributes` forces LF for `bin/sdd` and `hooks/`, and the guard template is
  normalized before writing, so a CRLF checkout on Windows no longer breaks `sh`.
- User-scope paths use `os.homedir()` instead of `$HOME`, which is unset on Windows.
- `sdd guard install|remove --dry-run` no longer writes, renames or deletes hooks.

### Changed

- Commit guard v3. `SDD_ALLOW_COMMIT=1` now bypasses only Keel's checks; a chained
  hook of your own still runs.

## 0.3.0 - 2026-09-23

The project is now called **Keel**. The `sdd` CLI, the `/sdd:*` commands and the skill
names are unchanged.

### Breaking

- Plugin and marketplace identifiers are now `keel` (`sdd@keel`, `IrvinngB/keel`).
- Managed context blocks use `keel:begin/end agent=<id>` markers. Older `sdd-kit`
  markers are no longer migrated.
- The product-specific memory backend was removed. Persistence is bring-your-own: files
  and SQLite are built in; any memory server maps through the generic MCP backend or
  `core/persistence/template.md`. An unknown `artifact_store` value is reported by
  `sdd doctor` with a migration hint.

### Added

- Logical-key persistence: phases, commands and the orchestrator speak only
  SAVE/LOAD/LIST over keys (`config`, `<change>/state`, `<change>/<type>`,
  `specs/<cap>`, ...). Only the files backend maps keys to `openspec/` paths.
- Data-driven agent registry in `build/manifest.json`. Adding an agent is one row.
- New targets: Codex CLI, Gemini CLI and Kimi Code CLI, with `SKILL.md` output.
- Skills are installed once into the shared `.agents/skills` at project scope, with
  invocation-neutral bodies; each agent's own syntax lives in its context block.
- Per-agent context blocks with strict marker parsing: malformed or duplicate markers
  abort without writing, CRLF is preserved, re-runs are idempotent.
- `sdd doctor` reports unmanaged legacy blocks, per-agent status, and duplicate skill
  discovery, at project and user scope.
- Archive is re-entrant and deduplicates merged requirements; archived changes resolve
  by exact `<YYYY-MM-DD>-<change>`; `/sdd:new` rejects reserved and existing names.

### Fixed

- `--dry-run` now writes nothing, not even directories.
- The generator builds into `adapters.build/` and swaps atomically; stale generated
  files can no longer linger. The build fails on nested backticks or a dangling
  "this document" reference.
- `--context-file` rejects absolute paths, `..` and symlink escapes.
- `sdd status` skips archived changes.

### Known limitations

- Only opencode was tested in a real session. Claude Code, Codex, Gemini CLI, Kimi and
  the generic floor are docs-verified or experimental; see the README table.
- Gemini CLI is being retired for individual accounts, so it could not be tested.
- Antigravity (`agy`) is not supported yet: its project-level skills and commands paths
  are unconfirmed.
- Hooks and the pre-commit guard read only the files layout and do nothing on other
  backends.

## 0.2.1

Pluggable persistence: abstract SAVE/LOAD/LIST interface.

## 0.2.0

Cross-agent architecture: core, generated adapters and the `sdd` CLI.
