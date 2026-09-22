# sdd-kit — Spec-Driven Development for Claude Code

A stack-agnostic Claude Code plugin that turns substantial changes into a
disciplined pipeline of written artifacts before and during implementation:

```
explore → proposal → spec → clarify → design → tasks → apply → verify → archive
```

Artifacts are plain markdown under `openspec/` in your project — git-tracked,
team-shareable, resumable in any session. No MCP servers, no database, no vendor
lock-in.

## Install

```
/plugin marketplace add <your-github>/sdd-kit
/plugin install sdd@sdd-kit
```

Then in any project: `/sdd:init` (detects your stack and bootstraps `openspec/`).

## Commands

| Command | What it does |
|---------|--------------|
| `/sdd:init` | Detect stack via `stack-detector`, bootstrap `openspec/` + steering docs |
| `/sdd:new <change>` | Start a change: exploration + proposal |
| `/sdd:explore <topic>` | Investigate an idea; compares approaches, no code touched |
| `/sdd:continue [change]` | Run the next dependency-ready phase |
| `/sdd:ff [change]` | Fast-forward planning: propose → spec → clarify → design → tasks |
| `/sdd:clarify [change]` | Force the uncomfortable questions before design |
| `/sdd:apply [change] [range]` | Implement tasks (strict TDD optional per config) |
| `/sdd:estimate [change]` | Complexity, hours and risk flags per task |
| `/sdd:verify [change]` | Real test runs + spec compliance matrix |
| `/sdd:security [scope]` | Language-agnostic OWASP-style review |
| `/sdd:drift [change]` | Detect code that diverged from approved specs |
| `/sdd:steer` | Refresh project steering docs (product/tech/structure) |
| `/sdd:archive [change]` | Sync deltas into source-of-truth specs, close the cycle |

## Agents

Nine phase executors (`sdd-explore`, `sdd-propose`, `sdd-spec`, `sdd-clarify`,
`sdd-design`, `sdd-tasks`, `sdd-apply`, `sdd-verify`, `sdd-archive`) plus five
utilities (`stack-detector`, `sdd-drift`, `sdd-security`, `sdd-estimate`,
`sdd-steer`). The main session orchestrates; agents execute single phases and
never delegate further.

## What makes this pipeline different

- **Clarify gate.** Most SDD flows jump from requirements to design and let the
  model guess. `sdd-clarify` verifies assumptions against real code and forces
  BLOCKER questions (with recommended defaults) to be answered before a single
  line of design is written.
- **Drift detection.** `sdd-drift` compares git history of touched files against
  artifact dates and classifies every divergence: `CODE_UNTRACKED`, `SPEC_STALE`,
  `DESIGN_STALE`, `ARTIFACT_UNDONE`. Nothing else in the Claude Code ecosystem
  does this natively.
- **Steering docs.** Project-level `openspec/steering/{product,tech,structure}.md`
  keep long-term context fresh; `sdd-steer` updates them after every apply batch
  and archive, so sessions start with truth instead of archaeology.
- **Stack-agnostic core.** `stack-detector` inspects manifests, verifies real test
  commands and writes `openspec/config.yaml`; downstream phases read the config,
  never assume a language. Stack experts (e.g. a `laravel-expert` agent) stay in
  your project — the bridge recommends them by name.
- **Reviewer protection.** `sdd-tasks` forecasts changed lines against a 400-line
  review budget and the pipeline refuses to apply oversized work without a
  decision: chained PRs (stacked or feature-branch chain) or an explicit
  `size:exception`.
- **Commit guard.** A PreToolUse hook blocks `git commit` while active changes
  have unchecked tasks. Deliberate bypass (token must be in the command itself):
  `SDD_ALLOW_COMMIT=1 git commit -m "wip: ..."`.

## Configuration

Everything lives in your project:

```
openspec/
├── config.yaml      # stack, verified test commands, strict_tdd, security_review
├── steering/        # product.md · tech.md · structure.md
├── specs/           # source of truth (one spec per capability)
└── changes/         # active changes + archive/
```

Key `config.yaml` switches:

| Key | Default | Effect |
|-----|---------|--------|
| `strict_tdd` | `true` if a runner is detected | apply follows RED → GREEN → TRIANGULATE → REFACTOR with an evidence table |
| `security_review` | `false` | verify runs the built-in security pass; `/sdd:security` always available |

## Typical cycle

```
/sdd:new add-rate-limiting
/sdd:continue          # spec
/sdd:clarify           # BLOCKERs answered one at a time
/sdd:continue          # design → tasks
/sdd:estimate          # optional: hours + risk flags
/sdd:apply             # guarded by the 400-line forecast
/sdd:verify            # real test execution + compliance matrix
/sdd:archive           # specs synced, change archived, steering refreshed
```

## Repository layout

```
.claude-plugin/   # plugin.json + marketplace.json
agents/           # 14 subagent definitions
commands/         # 13 slash commands
skills/           # sdd-workflow contract (loaded by the orchestrator)
hooks/            # commit guard (PreToolUse)
```

Validate locally with `claude plugin validate .` after changes.

## License

MIT
