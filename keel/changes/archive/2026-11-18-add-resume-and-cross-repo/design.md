# Design: Add `sdd resume` and cross-repo lesson distillation

## Technical Approach
Add `runResume(target)` and `sharedSteeringPath()` in `bin/sdd`, add optional cross-repo distillation guidance to `core/phases/sdd-postmortem.md`, and list `sdd resume` in `core/commands/help.md`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `bin/sdd` | Modify | Add `sharedSteeringPath`, `runResume`, `case 'resume'`, and help text |
| `core/phases/sdd-postmortem.md` | Modify | Add optional cross-repo distillation step |
| `core/commands/help.md` | Modify | Document `sdd resume [change]` |
| `test/resume.test.js` | Create | Tests for `sdd resume` |
| `README.md`, `docs/es/README.md`, `CHANGELOG.md` | Modify | Document `sdd resume` |
| `adapters/**` | Regenerate | `node bin/sdd build` (separate commit) |

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| CLI / Integration | `sdd resume` output on active/empty/unknown change | `node --test test/resume.test.js` |
| Full Suite | All tests pass | `npm test` |
