# Design: Trim persistence docs out of the sdd-workflow skill

## Technical Approach
Two chained PRs, starting after #10 merges.
- **PR1**: mechanism, gate, load rule and doctor check. Every agent stays `inline`.
- **PR2**: flips `claude` after a recorded session. If claude fails, PR2 drops only `template.md` instead.

## Architecture Decisions

### Decision: Flag and validation
**Choice**: The registry row gets top-level `persistence_docs` and `persistenceDocsVerified`.
- `validateRegistry(registry = REGISTRY)` fails with `registry.<id>.persistence_docs must be inline|side-files`, or when `side-files` lacks `persistenceDocsVerified`.
- `validateSkillsInstall` fails when two agents whose skills go to `sharedSkillsDir` disagree, naming both.

**Alternatives considered**: putting the fields under `emit`; using `unverifiedFields`.
**Rationale**: Same shape as `neutralSkills`, and it can be tested.

### Decision: Split in `skillBody`
**Choice**: `ctx.persistence` becomes `[{name, text}]` in its existing order. `skillBody(id, ctx, neutral, mode)` returns `{body, side}`.
- `inline`: every doc, same order.
- `side-files`: `files` and `interface` stay in the body. `emitAgent` writes the rest to `<workflowSkill>/persistence/<name>` (claude: the plugin's `skills/sdd-workflow/`).

The plugin cache and `copyTree` copy directories recursively, and `verify()` checks the new files.
**Alternatives considered**: a new `{{...}}` kind.
**Rationale**: Smallest diff.

### Decision: Generator testable in-process
**Choice**: `fail` throws. The `require.main` block catches it, cleans `BUILD`, prints the same error and exits 1. The module exports `skillBody`, `validateRegistry`, `loadCtx`.
**Rationale**: No test runs the generator today.

### Decision: One load rule
**Choice**: The rule goes in `interface.md` §Selection, replacing "has a doc in this folder":
> `interface.md` and `files.md` are part of this workflow. Any other backend doc `<name>.md` is a section of this workflow, a file in the `persistence/` folder beside this skill's `SKILL.md`, or in `.sdd/core/persistence/` in generic installs. If it is in none of these places, tell the user to run `sdd install` and stop; do not guess the backend.

`orchestrator.md:54-59` and `init.md:13` replace "bundled…" with a pointer to this rule.
**Rationale**: No placeholder, and only one copy of the rule.

### Decision: Doctor check
**Choice**: It runs after the `round-trip` lines, only when the `artifact_store` value was valid (`!bad.length`).
- **Backends**: each non-`files` backend in `artifact_store` that has a core doc.
- **Folders**: every folder that a copy-method agent installs its skills into, deduped, if it holds `sdd-workflow/SKILL.md`. Claude and generic install none, so they are never checked.
- **Warning**: printed if the doc's first heading is missing from `SKILL.md` and `persistence/<n>.md` is also missing:
  `  backend doc          warning: no <n> doc in <dir>/sdd-workflow — run sdd install <agent> (<agents>)`

Otherwise nothing is printed, and the exit code stays 0.
**Rationale**: Q3/Q4.

## Data Flow
```
row ─> emitAgent ─> SKILL.md (+ persistence/) ─> installed folder ─> doctor
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `build/generate.js` | Modify | ~+55 |
| `bin/sdd` | Modify | doctor, ~+25 |
| `core/persistence/interface.md`, `core/orchestrator.md`, `core/commands/init.md` | Modify | rule, ~10 |
| `test/build.test.js` | Create | ~+100 |
| `test/install.test.js` | Modify | doctor, ~+60 |
| `CONTRIBUTING.md:39`, `keel/steering/structure.md:12`, `CHANGELOG.md` | Modify | notes |
| `README.md:218`, `docs/es/README.md:228` | Modify (PR2) | one fence line each |
| `adapters/**` | Regenerate | separate `build: regenerate adapters` commit |

PR1: about 260 lines excluding `adapters/`, plus about 16 regenerated files. PR2: 1 `SKILL.md` plus 3 side files.

## Interfaces / Contracts
```js
"persistence_docs": "inline" | "side-files",   // absent = inline
"persistenceDocsVerified": "<yyyy-mm-dd> <how>"
skillBody(id, ctx, neutral, mode) -> { body, side }
```

## Testing Strategy

| Layer | What to test | Approach |
|-------|-------------|----------|
| Unit | build checks (invalid value, mixed group, unverified), inline order, forced side-files has 3 docs and fewer words than inline, rule present, no committed `persistence/` | `node:test`, in-process |
| Integration | missing doc: warning, exit 0; inline vs side file: identical output; `files`/`none`, no skill, claude: silent | CLI, isolated `HOME` |

## Migration / Rollout
None. PR2 gate: install the flipped local plugin and run `/sdd:new probe` in a sqlite repo. It passes if the transcript reads `persistence/sqlite.md`. Record the date, version and `wc -w` in `persistenceDocsVerified`.

## Rollback & Reversibility
- No migrations. `inline` is the kill switch.
- A revert loses nothing, and orphaned `persistence/` files are harmless.
- `git revert` both commits, then `npm test` and `node bin/sdd build` must leave `adapters/` clean.

## Observability
- Doctor warns in one line; build errors name the agent.
- Success metric: the claude `wc -w` delta.

## Open Questions
- [ ] Claude `side-files` lands only in PR2, so archive after PR2. This is not blocking.
