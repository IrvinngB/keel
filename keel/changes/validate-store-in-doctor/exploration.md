## Exploration: validate the files store in `sdd doctor`

### Current State (CONFIRMED)
- `stateOf` (bin/sdd:190-199) parses with `^([a-z_]+):\s*(.*)$`; values stay raw strings (`completed` is the text `[a, b]`). Missing file gives `{}`; malformed lines are silently ignored; nested lists are skipped.
- `activeChanges` (208-215): any non-`archive` directory whose `status` is not `archived`. No state.yaml still counts as active.
- `status` (471-495) shows STATE `-` when state is missing; `next` (497-521) derives phase from artifact files (`PHASES` 165-173), never from state.yaml. Neither warns on broken state. Not reproduced live.
- `doctor` (525-599) always exits 0; only `die` (24) exits 1. Warnings accumulate in `warnings[]`; the collisions block (568) prints only when non-empty. `artifact_store` check at 574-587 already flags unknown values.
- Key-to-file mapping: core/persistence/files.md:18-38. Archive rules and reserved `archive`: files.md:40-58. `PHASES` lacks apply, verify, archive (files apply-progress.md, verify-report.md, archive-report.md). `spec` maps to a `specs/` directory.
- Tests: test/helpers.js `repo()`, `sdd()`, `write()`; doctor assertions are regexes (test/artifacts.test.js:21-42). A fixture store is a few `write()` calls.
- Real sample: keel/changes/antigravity-support/state.yaml (inline list plus block list).

### Checks: feasibility
| Check | Verdict |
|---|---|
| (a) no state.yaml | Trivial. |
| (b) fields, status, phase names, folder/status mismatch | Feasible: existing regex plus splitting `[..]`. Do not parse block lists. Archive folder date should equal `archived_on`. |
| (b) completed artifact missing | Feasible via key-to-file table. Whether `clarify` and `blast-radius` are optional: UNVERIFIED (check core/phases). |
| (c) edited after archive | Feasible: `git log --since=<archived_on> -- <dir>`, git repos only. The archive move commit is same-day, so false positives need a date-granularity policy. One git spawn per archived change. |
| (d) names | Feasible: kebab-case regex, reserved list, `..` and separators. Duplicates: strip the 10-char date prefix from archive entries. |
| (e) artifact_store | Exists already; reuse. |
| (f) files+sqlite mirror | Not worth it: bin/sdd defines no sqlite schema or db path (only a scratch db, 638-643). Emit a note and skip. |

### Approaches
1. **Inline in the `doctor` case**: cheapest, but PR #11 edits the same code. Effort Low; conflict risk High.
2. **Pure `validateStore(cwd)` returning findings, printed by doctor**: testable without spawning. Effort Medium.
3. **New `sdd check` command**: more CLI surface than the goal needs. Effort High.

### Recommendation
Approach 2. Findings go in a `store checks` section printed only when non-empty (collisions pattern). Keep every finding a warning with exit 0, since doctor never fails today (open decision). Skip with a note when `artifact_store` lacks `files`. Sequence after PR #11 merges.

### Risks
- Conflict with feat/warn-on-foreign-sdd-files.
- Model-written YAML varies (quotes, CRLF, block-style `completed`): report "unreadable", not "invalid".
- Check (c) can be noisy.
- Windows: normalize `\` before name checks (UNVERIFIED).

### Ready for Proposal
Yes. Decide: exit-code policy, whether to include (c), optional phases.
