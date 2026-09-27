# Copilot Agent Specification

## Purpose
Registry and install contract for GitHub Copilot, a skills-based agent that reads `AGENTS.md`.

## Requirements

### Requirement: Registry entry and Experimental status
The registry MUST contain `copilot`, displayName "GitHub Copilot", status `experimental`, invocation `/sdd-{name}`, args "the user's arguments" (not `$ARGUMENTS`). Nothing MAY call it Tested or verified until a real VS Code session and a real CLI session each run a phase; that manual gate MUST stay tracked and unchecked.

#### Scenario: Status
- GIVEN the entry WHEN read THEN status is `experimental`, `sdd-spec` renders `/sdd-spec`, and no doc or `sdd doctor` output calls Copilot Tested or verified

### Requirement: Registry order
The `copilot` row MUST sit after `antigravity` and before `generic`.

#### Scenario: Output unchanged
- GIVEN `codex` and `antigravity` blocks and no `.claude` WHEN `sdd next` runs THEN it prints the Codex invocation

### Requirement: Project install
`sdd install copilot --project` MUST write only `.agents/skills` (neutral skills, installed once) and the `copilot` block in `AGENTS.md`. It MUST be idempotent, MUST coexist with `codex`, `kimi` and `antigravity` blocks in any install order, and MUST refuse without writing on a malformed Keel marker. In a git repository it MUST install the commit guard, as for every context-file agent.

#### Scenario: Install and re-run
- GIVEN an empty project WHEN the command runs twice THEN only `.agents/skills` and one `copilot` block exist (excluding `.git/hooks`) and the rerun changes nothing

#### Scenario: Coexistence
- GIVEN a `codex`, `kimi` or `antigravity` block WHEN Copilot is installed before or after it THEN every block stays intact

#### Scenario: Malformed marker
- GIVEN an unbalanced Keel marker in `AGENTS.md` WHEN the command runs THEN it fails and writes nothing

#### Scenario: Guard
- GIVEN a git repository WHEN the command runs THEN the commit guard is installed

### Requirement: No user scope
Copilot MUST NOT have a user install target.

#### Scenario: User install refused
- GIVEN any home directory WHEN `sdd install copilot --user` runs THEN it fails with "copilot has no user install target" and writes nothing

### Requirement: Unverified fields and provenance
`unverifiedFields` MUST include `invoke`, `subagents`, `detect` and `userScope` ("not emitted"), and MUST NOT include `commandsLayout`. `detect` and `projectMarkers` MUST be empty. Notes MUST cite docs.github.com/en/copilot/concepts/agents/about-agent-skills, the Copilot CLI add-skills page, code.visualstudio.com/docs/copilot/customization/agent-skills, and 2026-09-25.

#### Scenario: Declared and surfaced
- GIVEN the entry WHEN read THEN fields, URLs and date appear
- GIVEN the `copilot` block in a project WHEN `sdd doctor` runs THEN the Copilot line shows tool `n/a` and project `installed`, and the unverified warning prints; `sdd install copilot` always prints it

### Requirement: Shared-skills reading
`skillsRead` MUST be `.github/skills`, `.claude/skills`, `.agents/skills`, so Copilot MUST be a reader of `.agents/skills`. Double-discovery warnings MUST count only Keel-owned skill names.

#### Scenario: Shared notice
- GIVEN a Codex project install WHEN the "shared with" notice prints THEN it lists `copilot`

#### Scenario: Double discovery
- GIVEN a Keel-named skill in `.github/skills` or `.claude/skills` WHEN Copilot is installed THEN a warning names "GitHub Copilot" and that directory, and no file is changed
- GIVEN only non-Keel names there WHEN the install runs THEN no such warning prints

### Requirement: Dry run
With `--dry-run`, install MUST write nothing and MUST print planned actions.

#### Scenario: Dry run
- GIVEN an empty git repository WHEN `sdd install copilot --project --dry-run` runs THEN the tree is unchanged, including `.git/hooks`

### Requirement: Documentation parity
README (table row and install command), `docs/install.md`, `docs/es/README.md` and `docs/es/instalacion.md` MUST list Copilot as Experimental, never Tested. Each English/Spanish pair MUST have identical heading and code-fence counts. Spanish MUST be neutral, without voseo. CHANGELOG Unreleased MUST record the addition.

#### Scenario: Docs
- GIVEN the four docs WHEN read THEN each shows Experimental, counts match per pair, and no voseo appears
- GIVEN CHANGELOG WHEN read THEN Unreleased mentions Copilot
