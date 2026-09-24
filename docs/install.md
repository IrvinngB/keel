# Installing Keel: the details

The [README](../README.md#install) has the commands. This page explains what they
write and why.

## Antigravity

Antigravity (`agy`) is not supported yet. It is a different product from Gemini
CLI with its own conventions (its global skills live in `~/.gemini/config/skills`),
and a headless test did not find skills placed in `.agents/skills`. It gets a registry
entry once its project-level skills and commands paths are confirmed interactively.

## Skills are installed once

Codex, opencode, Gemini and Kimi all read `.agents/skills`, so at project scope every
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
(`<!-- keel:begin agent=<id> -->` … `<!-- keel:end agent=<id> -->`). Codex and Kimi can
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
