# Changelog

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
