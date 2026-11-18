# Proposal: Add `help` command (`{{cmd:help}}`)

## Intent
Provide an in-session command (`{{cmd:help}}` — `/sdd:help` in Claude/Gemini, `/sdd-help` in opencode/Antigravity/Copilot, `$sdd-help` in Codex, `/skill:sdd-help` in Kimi) that explains what SDD is, the pipeline phases, every slash/skill command, and the zero-token `sdd` terminal CLI commands.

## Scope

### In Scope
- New `core/commands/help.md` using `{{cmd:*}}` placeholders (tool-agnostic).
- Register `commands.help` in `build/manifest.json`.
- Test in `test/build.test.js` verifying `help` builds into adapters with 0 unresolved placeholders.
- Regenerate `adapters/` via `node bin/sdd build` (separate `build: regenerate adapters` commit).
- Update `CHANGELOG.md`.

### Out of Scope
- Adding a dedicated `core/phases/sdd-help.md` subagent (unnecessary: the orchestrator can answer directly from the command).

## Capabilities

### New Capabilities
- `sdd-help-command`: interactive in-session reference for Keel's SDD methodology, commands, and CLI.

### Modified Capabilities
- None.

## Risks
Level: **Low** (additive command; no phase contract or CLI runtime change).
