# Generic install (any coding agent)

1. Copy this folder's `core/` (already resolved for generic use — no template
   placeholders) into your project as `.sdd/core/` (layout: `orchestrator.md`,
   `conventions.md`, `phases/`, `commands/`, `persistence/`).
2. Append `AGENTS.block.md` (this folder) to your project's `AGENTS.md` — create
   the file if absent. The block is wrapped in `sdd-kit:begin/end agent=generic`
   markers; if they are already there, replace that region instead of appending.
   Agents that read another context file (for example `GEMINI.md`) need the same
   block appended there.
3. Run `sdd guard install` in the project to install the commit guard
   (`.git/hooks/pre-commit` blocks commits while active changes have unchecked tasks).

Or do all three at once from a clone of sdd-kit: `sdd install generic --project`
(add `--context-file=GEMINI.md` for a second context file).
Then tell your agent to read `.sdd/core/orchestrator.md` and start the pipeline.
