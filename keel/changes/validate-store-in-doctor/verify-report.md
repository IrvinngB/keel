# Verification Report: Validate the files store in `sdd doctor`

## Completeness
| Task | Status |
|------|--------|
| 0.1, 1.1-1.14, 2.1-2.6, 3.1, 3.2, 4.1 | done |
| 3.3 CI matrix (node 18/22 x ubuntu/macos/windows) | OPEN, not verifiable locally (WARNING) |
| 4.2 commit artifacts | OPEN, orchestrator (cleanup, WARNING) |

## Execution Evidence
- `npm test` -> 102 pass, 0 fail, exit 0 (13 new in test/store.test.js).
- Adversarial temp store (crlf, block list, unknown phase, missing design.md, active+archived dup, bad archive names, dangling symlink state.yaml, symlinked dirs, empty state.yaml, 5 MB random file, 4-byte binary): doctor exit 0, no crash, one row per defect, tree untouched. Symlinked dirs are ignored (Dirent.isDirectory false), same as activeChanges.
- This repo's keel/ (5 active incl. uncommitted): doctor prints no `store checks` row; validateStore returns [].
- `node bin/sdd`, and `bin/sdd` via a symlink (npm-bin case): CLI runs (node resolves the realpath, so require.main === module). `require()` prints nothing.

## Spec Compliance Matrix
| Requirement | Scenario | Implementation | Test | Status |
|---|---|---|---|---|
| Read-only warnings | broken store | bin/sdd:~703 | store.test.js:37 | PASS |
| Findings section | no keel dir / healthy | doctor block | :145, :158 | PASS |
| Files backend only | other backend | bin/sdd:~699 | :49 | PASS |
| Scan scope | stray entries | dirs() | :145 | PASS |
| Scan scope | folder without state | validateStore | :62 | PASS |
| Unreadable not invalid | CRLF | readStateStrict | :69 | PASS |
| Unreadable not invalid | block-style | readStateStrict | :78 | PASS |
| State fields | unknown phase | checkState | :91 | PASS |
| Status matches location | date prefix differs | checkState | :101 | PASS |
| Completed have artifacts | artifact missing | checkState | :101 | PASS |
| Completed have artifacts | optional phase | REQUIRED_ARTIFACT | :145 | PASS |
| Change names | duplicate | validateStore | :101 | PASS |
| Change names | Windows separators | validateName | :118 | PASS |

## Issues
### CRITICAL
- none

### WARNING
- bin/sdd:231 (readStateStrict) and validateStore: an unreadable state.yaml (chmod 000) or a directory named state.yaml throws EACCES/EISDIR. Reproduced. The doctor run crashes with exit 1, but the first throw is the PRE-EXISTING `activeChanges()`/`stateOf` (bin/sdd:194/213), which runs before the new code, so the crash is not a regression. Still, validateStore called directly also throws. Recommend try/catch around readFileSync in readStateStrict returning `unreadable: <code>`, and a follow-up making stateOf/activeChanges safe. No test covers it.
- test/store.test.js:168 ("Keel's own keel/ has zero findings") is fragile:
  (a) It reads the live working tree, so uncommitted or in-flight changes, and any future committed change with block-style completed, CRLF, or a completed phase whose file is not yet written, fail an unrelated PR.
  (b) Windows CI: .gitattributes forces LF only for bin/sdd, hooks, *.sh. GitHub's Windows runners default to autocrlf=true, so keel/**/state.yaml checks out CRLF and the test reports "unreadable: CRLF line endings" and fails (task 3.3 is unverified). Real Windows users hit the same false report.
  Recommended fix: add `keel/**/state.yaml text eol=lf` (or `keel/** text eol=lf`) to .gitattributes, and make the test scan a snapshot restricted to tracked files (`git ls-files keel` copied to a temp dir, skipping when git or the checkout is absent), or downgrade it to a fixture-based healthy store already covered by :145/:158.
- Deviation (apply-progress): artifact checks also run for archived changes. Spec "Completed phases have artifacts" does not exclude them, so it is arguably fine, but older archived stores where the archive step deleted or renamed files (e.g. apply-progress.md) would produce noise. Consider limiting to active changes or documenting it in the spec.

### SUGGESTION
- bin/sdd:~272: empty or binary state.yaml gives three "invalid: missing X" rows (empty file, random bytes). Consider one "state.yaml unreadable: empty or not key: value text" row. A `current_phase:` with an empty value passes silently (f.current_phase is ''), missing-key check misses it.
- Symlinked change dirs and dangling state.yaml symlinks: dir symlinks are silently skipped, a dangling state.yaml symlink reports "no state.yaml". Acceptable, but undocumented.
- Design says "Q7 templates", changes labelled by folder name for archive rows: fine, documented in apply-progress.
- Docs: no mention; design chose to skip. OK.
- Add tests for validateStore throwing on unreadable state (see WARNING 1) and for CRLF-in-config, plus `completed: [a,,b]`.

## Design coherence
All 4 decisions match the code (separate strict reader, findings as data, row placement between artifact_store and commit guard, export guard). stateOf/status/next/probeBackend unchanged (git diff shows only the artifact_store block refactor into configuredStore()). Deviation `validateStore(root)` takes keel/ not project root: harmless.

## Strict TDD
Cycle table present in apply-progress.md; RED before GREEN documented (11 failed then 13 pass).

## Observability
CLI findings on stdout, exit 0, per design. No new logging gaps.

## Windows-safety of tests
Fixtures LF, path.join everywhere, HOME/USERPROFILE isolated through helpers.env(), realpathSync on temp dirs, no chmod or symlink use in tests. Only risk: the own-keel test (see WARNING 2).

## Verdict: PASS WITH WARNINGS
