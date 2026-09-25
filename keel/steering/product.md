# Product
Last refreshed: 2026-09-24

Keel (npm `keel-sdd`, CLI `sdd`, commands `/sdd:*`) is a spec-driven-development toolkit for
AI coding agents. It runs every change through a gated pipeline and keeps all artifacts as
plain files in git. For developers and teams who use coding agents and want plans questioned,
consumers mapped, and work verified before it is archived. MIT, v0.4.1.

Pipeline: explore -> proposal -> spec -> clarify -> design -> blast-radius -> tasks -> apply
-> verify -> archive.

## Domain concepts

| Concept | Meaning |
|---------|---------|
| Change | One unit of work under `keel/changes/<name>/` with `state.yaml` |
| Phase | A pipeline step defined by a markdown contract in `core/phases/` |
| Command | User entry point (`new`, `continue`, `ff`, ...) in `core/commands/` |
| Envelope | Standard phase result: status, summary, artifacts, next, risks |
| Steering | `keel/steering/{product,tech,structure}.md`, refreshed after apply |
| Lessons | Postmortem notes (plan vs git reality) in `keel/lessons/` |
| Backend | Persistence layer (files, SQLite, generic MCP) behind SAVE/LOAD/LIST |
| Adapter | Generated per-agent output built from `core/` + registry row |
| Workload guard | 400-line forecast; oversized work needs chained PRs or `size:exception` |

## Capabilities

- Pipeline gates: clarify, blast-radius (BREAKS rows must become tasks), design must include
  Rollback and Observability sections.
- Utilities: estimate, drift detection, security review, steer, postmortem, stack-detector.
- CLI: `build`, `install`, `status`, `next`, `doctor`, `guard install` (no tokens spent).
- Commit guard: git pre-commit + Claude PreToolUse blocks commits with unchecked tasks.
- Two execution modes: subagent delegation, or strict single-phase for tools without subagents.

## Differentiators vs OpenSpec / spec-kit

- Honest note: the clarify gate is NOT unique. OpenSpec and spec-kit are mature and widely
  used; Keel is younger.
- Bets: blast-radius phase with file:line evidence, drift + postmortem loop after apply,
  enforced guards (not only suggested), one core with generated adapters (new agent = one
  registry row), pluggable persistence.

## Agent status (be honest, never overclaim)

- opencode: Tested (real headless session, opencode 1.18.18, 2026-09-23). This is the ONLY
  tested agent.
- Claude Code, Generic: Verified against docs only.
- Codex CLI, Gemini CLI, Kimi: Experimental (docs or inferred). Antigravity: Experimental (docs only).
- Promotion to Tested comes from agent support reports (issues).

## Current specs

`keel/specs/` is empty; `keel/changes/` has no active change yet.
