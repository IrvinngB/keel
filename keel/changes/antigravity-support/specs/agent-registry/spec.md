# Agent Registry Specification

## Purpose
Registry contract for Antigravity (`agy`), a skills-only agent.

## Requirements

### Requirement: Registry entry and Experimental status
The registry MUST contain `antigravity`, displayName "Antigravity", status `experimental`, invocation `/<skill-name>`. Nothing MAY call it Tested or verified until a real session running a phase is documented.

#### Scenario: Status
- GIVEN the entry WHEN read THEN status is `experimental`, `sdd-spec` renders `/sdd-spec`, and no doc or `sdd doctor` output says "Tested"

### Requirement: Registry order
The `antigravity` row MUST sit after `kimi`.

#### Scenario: Output unchanged
- GIVEN `codex` and `antigravity` blocks WHEN `sdd next` runs THEN it prints the Codex invocation

### Requirement: Project install
`sdd install antigravity --project` MUST write only `.agents/skills` and the `antigravity` block in `AGENTS.md`, MUST be idempotent, MUST coexist with `codex`/`kimi` blocks, and MUST refuse without writing on a malformed Keel marker. It MUST NOT emit command, agent, workflow or hook files.

#### Scenario: Install and re-run
- GIVEN an empty project WHEN the command runs twice THEN only skills and one block exist (excluding `.git/hooks`) and the rerun changes nothing

#### Scenario: Coexistence
- GIVEN a `codex` or `kimi` block WHEN Antigravity is installed, re-installed, or installed before `codex` THEN each block stays intact

#### Scenario: Malformed marker
- GIVEN an unbalanced marker WHEN the command runs THEN it fails and `AGENTS.md` is unchanged

### Requirement: Unverified fields and provenance
`unverifiedFields` MUST include `detect`, `userContextFile`, `subagents`, user skills path and invocation. Notes MUST cite https://antigravity.google/docs/skills/ , https://antigravity.google/docs/rules and 2026-09-24.

#### Scenario: Declared and surfaced
- GIVEN the entry WHEN read THEN fields, URLs and date appear
- GIVEN Antigravity detected or installed WHEN `sdd doctor` runs THEN it prints them; `sdd install antigravity` always does

### Requirement: Shared-skills reader reporting
`sdd doctor` MUST list `antigravity` as a reader of `.agents/skills`. The double-discovery warning is user-level only and MUST name "Antigravity".

#### Scenario: Notice and warning
- GIVEN a Codex project install WHEN the "shared with" notice prints THEN it lists `antigravity`
- GIVEN skills in `~/.agents/skills` and its user path WHEN `sdd doctor` runs THEN a warning names "Antigravity" and deletes nothing

### Requirement: Detection does not overlap Gemini CLI
Detection MUST use `~/.gemini/antigravity`, `~/.gemini/antigravity-ide`, `~/.gemini/antigravity-cli`, never bare `~/.gemini`; `projectMarkers` MUST be empty.

#### Scenario: Detection
- GIVEN only `~/.gemini` WHEN detection runs THEN Antigravity is not detected; with any of the three directories it is

### Requirement: User-scope install
User scope MUST write skills only to `~/.gemini/config/skills` and the block to `~/.gemini/AGENTS.md`, and MUST NEVER modify `~/.gemini/GEMINI.md`. `~/.gemini/antigravity-cli/skills` MUST appear only in notes and docs.

#### Scenario: User install
- GIVEN an existing `GEMINI.md` WHEN `sdd install antigravity --user` runs THEN output exists only at those two paths and `GEMINI.md` is byte-identical

### Requirement: Dry run
With `--dry-run`, install MUST write nothing and MUST print planned actions.

#### Scenario: Dry run
- GIVEN an empty project WHEN run with `--dry-run` THEN the tree is unchanged and writes are listed

### Requirement: Documentation parity
README, `docs/install.md`, `docs/es/README.md`, `docs/es/instalacion.md` MUST list Antigravity as Experimental, never Tested. The headless-test note MUST stay as scoped history in both install docs: the 0.3.0 test found no skills in `.agents/skills`; official docs now say project `.agents/skills` works; the user-level explanation is an unproven hypothesis. CHANGELOG Unreleased MUST record the addition; the 0.3.0 entry MUST NOT be edited.

#### Scenario: Docs
- GIVEN the docs WHEN read THEN each shows Experimental, and the note is dated 0.3.0, marks the explanation unproven, and never says project `.agents/skills` both fails and works
