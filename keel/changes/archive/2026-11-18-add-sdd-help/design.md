# Design: Add `help` command (`{{cmd:help}}`)

## Technical Approach
Create `core/commands/help.md` as an orchestrator-level reference command (no subagent delegation needed) and register `commands.help` in `build/manifest.json`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `core/commands/help.md` | Create | Tool-agnostic SDD & CLI reference command |
| `build/manifest.json` | Modify | Register `commands.help` |
| `test/build.test.js` | Modify | Verify `help` adapter generation across agents |
| `CHANGELOG.md` | Modify | Document `{{cmd:help}}` under `## Unreleased` |
| `adapters/**` | Regenerate | `node bin/sdd build` (separate commit) |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Build | `help` command generates cleanly for all adapters | `node --test test/build.test.js` |
| Full Suite | All tests pass | `npm test` |
