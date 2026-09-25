# Installing Keel: the details

The [README](../README.md#install) has the commands. This page explains what they
write and why.

## Antigravity

Antigravity (`agy`) is Experimental: Keel wrote the registry entry from its official docs
(checked 2026-09-24) and has not exercised it in a real Antigravity session. It is a
different product from Gemini CLI. Keel installs only skills and an `AGENTS.md` block for
Antigravity; it writes no commands, agents, workflows or hooks. Whether Antigravity
supports them was not checked.

- Project scope (`--project`): skills in `.agents/skills` (shared with the other agents)
  and an `antigravity` block in `AGENTS.md`. Skills are invoked as `/<skill-name>`, for
  example `/sdd-new` (unverified: see below).
- User scope (`--user`): skills in `~/.gemini/config/skills` (Antigravity 2.0 and the IDE)
  and the block in `~/.gemini/AGENTS.md`. Keel never modifies `~/.gemini/GEMINI.md`.
- The Antigravity CLI reads user skills from `~/.gemini/antigravity-cli/skills`; Keel does
  not write there, so copy the `sdd*` skill folders by hand if you use the CLI.
- Detection looks for `~/.gemini/antigravity`, `~/.gemini/antigravity-ide` or
  `~/.gemini/antigravity-cli`, never the bare `~/.gemini` that Gemini CLI also uses.
- `sdd doctor` may warn that skills exist in both `~/.agents/skills` and
  `~/.gemini/config/skills`. That warning can be a false alarm for CLI users; keep one
  copy if you want to be safe. Keel never deletes your files.

Unverified: the detection dirs, the user skills path, the user context file, the
invocation and subagent support. Only a later change that documents a real session may
shrink that list or promote Antigravity beyond Experimental.

History: a headless test during 0.3.0 found no skills placed in `.agents/skills`. The
official docs now say project `.agents/skills` works. Why the 0.3.0 test failed is an
unproven hypothesis (a user-level skills location); it has not been reproduced or
confirmed.

## Skills are installed once

Codex, opencode, Gemini, Kimi and Antigravity all read `.agents/skills`, so at project scope every
one of them installs its skills there and nowhere else. Skill bodies are invocation-neutral for every agent: they say "phase
`sdd-apply`" and "command `continue`", never `$sdd-continue`, `/sdd:continue` or
`/skill:sdd-continue`, so the same file is correct for every reader and cannot drift.
Each agent's own syntax lives only in its context-file block and in its native
command/agent files. User scope (`--user`) keeps each agent's own skills dir, because a
user-level `~/.agents/skills` is only verified for Codex. The one way to get a real
double copy is a leftover from an older install (for example `.kimi/skills`): `sdd
install` warns and `sdd doctor` reports "would discover the sdd skills twice"; remove the
extra `sdd*` entries yourself — sdd never deletes your files.

## Per-agent context blocks

Every agent owns one marked region in the context file
(`<!-- keel:begin agent=<id> -->` … `<!-- keel:end agent=<id> -->`). Codex, Kimi and Antigravity can
share one `AGENTS.md`; re-running `sdd install` replaces only that agent's region and
never touches your own content outside the markers, and keeps the file's existing line
endings. If the markers are malformed (a begin without an end, a duplicate block, a
mismatched end), `sdd install` refuses to touch the file and names the line to fix;
`sdd doctor` reports the same. A generic block from an early version with no end marker
(`<!-- sdd-kit generic block vN -->`) cannot be delimited safely: `sdd doctor` reports it
as unmanaged, and `sdd install` appends a managed block and leaves it untouched.

## Dry run

`sdd install <agent> --dry-run` prints what it would do and writes
nothing: no files, no directories, no context-file edits, no git hook.
`--context-file=<name>` must be a relative path inside the project (no `..`, no
symlink escape).
