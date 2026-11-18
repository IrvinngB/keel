# SDD Help Command Specification

## Purpose
Provide an in-session `help` command (`{{cmd:help}}`) that explains Keel's SDD pipeline, every command, auxiliary review passes, and terminal CLI tools using each agent's native command syntax.

## Requirements

### Requirement: Tool-Agnostic Help Command
`core/commands/help.md` MUST use `{{cmd:*}}` placeholders so `node bin/sdd build` resolves native command names per agent with zero unresolved placeholders.

#### Scenario: Adapter generation resolves help command
- GIVEN `core/commands/help.md` and `commands.help` in `build/manifest.json`
- WHEN `node bin/sdd build` runs
- THEN generated adapters include the `help` command/skill for every agent with zero unresolved placeholders.

### Requirement: Complete Pipeline and CLI Coverage
The `help` command MUST cover the core pipeline (`init`, `new`, `continue`, `ff`, `explore`, `clarify`, `blast`, `apply`, `verify`, `archive`), auxiliary commands (`drift`, `security`, `compliance`, `estimate`, `steer`, `postmortem`), and zero-token terminal CLI commands (`sdd status`, `sdd next`, `sdd check`, `sdd drift`, `sdd archive`, `sdd ci`, `sdd doctor`, `sdd guard`).

#### Scenario: Help content includes core, auxiliary, and CLI sections
- GIVEN the generated `help` command for an adapter
- WHEN inspecting its content
- THEN it documents the SDD pipeline, auxiliary commands, and `sdd` CLI commands.
