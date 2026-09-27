# Workflow Skill Packaging Specification

## Purpose
Ship persistence backend docs inside the `sdd-workflow` skill (`inline`) or beside it (`side-files`).

## Requirements

### Requirement: Registry flag
Each registry row MAY set top-level `persistence_docs: inline | side-files`; absent means `inline`. Any other value MUST fail the build with an error naming the agent. Only `claude` MUST be `side-files`.

#### Scenario: Invalid value
- GIVEN one agent with `separate`
- WHEN `sdd build` runs
- THEN the build fails naming that agent

### Requirement: Shared skills directory agrees
Agents sharing the `.agents/skills` directory (opencode, codex, gemini, kimi, antigravity) MUST agree on one value.

#### Scenario: Mixed group
- GIVEN opencode `side-files` and codex `inline`
- WHEN `sdd build` runs
- THEN the build fails

### Requirement: Inline output
An `inline` agent's skill MUST be identical to the pre-change output except the load-path wording, and MUST have no persistence side files.

#### Scenario: Inline agent
- GIVEN an agent left `inline`
- WHEN `sdd build` runs
- THEN its `SKILL.md` differs only in the load-path wording
- AND no `persistence/` folder exists beside it

### Requirement: Side-files output
A `side-files` skill MUST keep `interface.md` and `files.md` inline in `SKILL.md`. Every other core persistence doc (`sqlite`, `mcp-generic`, `template`) MUST be emitted, resolved for that agent, as `persistence/<name>.md` beside `SKILL.md` and MUST NOT also appear in it. The generic adapter MUST keep shipping `.sdd/core/persistence/`.

#### Scenario: Flagged agent
- GIVEN `claude` set to `side-files`
- WHEN `sdd build` runs
- THEN the three side files exist beside its `SKILL.md`
- AND generic output is unchanged

### Requirement: Side files travel with the skill
In every install scope, side files MUST install in the skill folder.

#### Scenario: Both scopes
- GIVEN a `side-files` agent
- WHEN `sdd install` runs per scope
- THEN each skill folder holds `persistence/`

### Requirement: One load rule
Contract text naming persistence docs MUST state one mode-independent rule, with no new placeholder kind: any doc beyond `interface.md` and `files.md` is a section of the skill, a file in the `persistence/` folder beside `SKILL.md`, or under `.sdd/core/persistence/` in generic installs. If in none, the agent MUST tell the user to run `sdd install`.

#### Scenario: Every mode
- GIVEN skills for `inline`, `side-files` and generic
- WHEN the routing text is read
- THEN all state the same rule

### Requirement: Verified before side-files
`side-files` MUST require `persistenceDocsVerified` in the registry row: a real session in which the agent reads `persistence/sqlite.md`. README, CHANGELOG and steering MUST claim a saving only for verified agents, measured with `wc -w`. If `claude` fails verification, only `template.md` MUST be dropped from the skill.

#### Scenario: Unrecorded verification
- GIVEN `side-files` without `persistenceDocsVerified`
- WHEN `npm test` runs
- THEN a test fails

### Requirement: Build integrity
`sdd build` MUST be deterministic and `adapters/` MUST match its output.

#### Scenario: Rebuild
- GIVEN a committed build
- WHEN `sdd build` reruns
- THEN `adapters/` shows no diff

### Requirement: Test coverage
Tests MUST assert each `side-files` agent has its side files and fewer words than the same build forced to `inline`, in-process, and each `inline` agent has none.

#### Scenario: Dropped side files
- GIVEN a build omitting side files
- WHEN `npm test` runs
- THEN a test fails
