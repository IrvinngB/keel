# Blast Radius: validate-store-in-doctor

| Surface | Consumers (file:line) | Class |
|---|---|---|
| `main();` guard (bin/sdd:722) | Only spawners: test/helpers.js:7, package.json bin:25, scripts build/test/version:41-44, ci.yml:21 `node --check`. Nothing `require`s bin/sdd today. Spawn keeps `require.main===module`. Extensionless file loads as CJS via require on Node 18/22/Windows; shebang stripped. | NONE |
| doctor row (bin/sdd:587-588) | artifacts.test.js:22-42 (match/doesNotMatch, no adjacency); guard.test.js:107,176,179 (`commit guard\s+installed`); install.test.js:125-414 finders (`startsWith('  <id> ')`, sectionLines): rows only appear in project block, and only if n>0 | NONE |
| `round-trip files` then `commit guard` adjacency | No test asserts it (rg: none); design's new guard test is the first | NONE |
| docs quoting doctor rows | README:183,223; docs/install.md:23-62; docs/es/*: none quote project rows; docs.test.js parity untouched | NONE |
| activeChanges/stateOf/status/next (bin/sdd:21,186-215) | Unchanged; hooks/pre-commit:22-29,67 and hooks/tasks-guard.sh:19-58 read tasks.md directly | NONE |
| probeBackend files (bin/sdd:629-636) | Writes/removes `keel/.sdd-doctor-probe` (dotfile, file not dir) before the scan; scan skips dot-names and files | NONE |
| Module-load state in bin/sdd | ARTIFACTS/CHANGES (bin/sdd:21) are cwd-relative constants; `validateStore(root)` called from tests must use `root`, not them | WATCH |
| PR #11 (unmerged, same doctor block) | Edits lines 540-587 (legacyFindings, collisions); insertion after artifact_store try/catch will conflict textually; apply after merge, rebase | WATCH |
| Keel's own keel/ as fixture | 4 active changes, all completed-phase artifacts exist (specs/ optional, so `spec` without dir is fine); archive/ holds only `.gitkeep` (file, skipped). Predicted zero rows. Risk: open_questions lines contain ` #10`/` #11` (trim-workflow..., validate-store..., warn-on-foreign...:state.yaml); the ` #` check must apply to required keys only, else false positives | WATCH |
| CI matrix (ci.yml:38-40) | ubuntu/macos/windows x Node 18/22: new tests must use LF and `path.join`; validateName gets `\` input | WATCH |

## Must-handle
1. Scope the ` #`/quote check to required-key values, never list items; add a test with `- ... PR #10` in open_questions.
2. `validateStore(root)` and `validateName` take paths from `root`, not module constants; test with a temp dir.
3. Add tests: healthy run `round-trip files` followed by `commit guard`; `.gitkeep` under archive yields no row.
4. Begin apply only after PR #11 merges; rebase and re-check doctor block.
5. Before merging, run doctor in a temp copy of keel/ and expect zero `store checks` rows.
6. Tests must pass on Windows CRLF checkouts.

Verdict: CONTAINED
