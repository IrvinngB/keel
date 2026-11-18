# Install Collision Warnings Specification

## Purpose
Keel MUST warn about name collisions with files it does not own, without modifying them.

## Requirements

### Requirement: Ownership by name
Keel names MUST come from the adapter tree of each agent and scope, as named on disk (opencode files carry `.md`), never a union across agents.

#### Scenario: Non-prefixed Keel name
- GIVEN only `.opencode/agent/stack-detector.md` exists in the project
- WHEN `installedInProject` runs
- THEN opencode is detected

#### Scenario: Foreign agent file
- GIVEN only `.opencode/agent/sdd-foo.md` exists
- WHEN `installedInProject` runs
- THEN opencode is not detected

### Requirement: Neutral wording
New messages MUST NOT contain "stale", "remove", "earlier install" or "likely", nor advise deleting files. Double-discovery warnings MUST fire only for Keel names of the installing agent.

#### Scenario: Foreign and Keel-named skills
- GIVEN `~/.claude/skills/sdd-init` and `sdd-workflow` exist
- WHEN `sdd install opencode --user` runs
- THEN only `sdd-workflow` is warned about, as a Keel name possibly another tool's

### Requirement: Replace list
Install MUST print pre-existing target files as "will be replaced (a previous Keel install or another tool's)", capped at 10 names then "… and N more"; dry run says "would replace".
#### Scenario: Twelve files
- GIVEN 12 target files exist
- WHEN install runs
- THEN 10 names and "… and 2 more" are printed

#### Scenario: Fresh target, no overwrite line
- GIVEN an empty target
- WHEN install runs
- THEN no replace or overwrite line is printed and exact-output tests pass

### Requirement: Read-only collision scan
The scan MUST report only what Keel never writes: `opencode.json` `agent` keys with Keel names, a plural `commands/` or `agents/` dir beside its singular, and same-named skills in read dirs that are not install targets (`info:` prefix). The config and plural-dir paths are UNVERIFIED; docs and messages MUST say so.

#### Scenario: Existing key
- GIVEN an `agent` key `sdd-apply` in `opencode.json`
- WHEN the scan runs
- THEN the key is reported

#### Scenario: Unparseable config
- GIVEN `opencode.json` is JSONC or invalid JSON
- WHEN the scan runs
- THEN one note is printed, the key check is skipped, nothing crashes

#### Scenario: Plural dir and non-target skill
- GIVEN `commands/` beside `command/`, and a same-named skill in a non-target read dir
- WHEN the scan runs
- THEN the dir is reported as unverified and the skill with `info:`

### Requirement: Dry run
`--dry-run` MUST print the scan and replace list and MUST NOT write any file.

#### Scenario: Dry run
- GIVEN `agent/sdd-apply.md` exists
- WHEN `sdd install opencode --dry-run` runs
- THEN it is listed as would replace and nothing is written

### Requirement: Doctor section
`sdd doctor` MUST print a collision section, one line per agent, only when a collision exists. Target-dir files MUST NOT appear there.

#### Scenario: Two agents
- GIVEN collisions for two agents
- WHEN `sdd doctor` runs
- THEN the section has two agent lines

#### Scenario: No collisions
- GIVEN only Keel files in target dirs
- WHEN `sdd doctor` runs
- THEN the output is unchanged

### Requirement: Warn only
Install and doctor MUST NOT block, delete, rename or modify files because of a collision. Exit codes MUST be unchanged.

#### Scenario: Collision present
- GIVEN a foreign same-named file
- WHEN install runs
- THEN the exit code is unchanged and the file untouched

### Requirement: Documentation
`docs/install.md` and `docs/es/instalacion.md` MUST recommend `--project` when another SDD toolkit is installed globally, and mark opencode's choice and the config and plural paths UNVERIFIED. Their old wording (`docs/install.md` lines 45-46) MUST be replaced. Heading and fenced-block counts MUST match. CHANGELOG Unreleased MUST record the change.

#### Scenario: Docs and changelog
- GIVEN both install docs and CHANGELOG
- WHEN compared and read
- THEN counts match, "stale" and "earlier install" are absent, Unreleased records the change
