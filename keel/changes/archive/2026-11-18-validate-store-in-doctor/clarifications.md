# Clarifications: Validate the files store in `sdd doctor`

Mode: AUTOMATIC. Nobody answers; every BLOCKER carries a recommended default that is treated as an ASSUMPTION.
Evidence was gathered by reading code; the environment had no shell, so nothing was executed (JS semantics cited below are from the language spec and are cheap to confirm with one test).

## Spec statements that are false against the code

- F1. Spec "Unreadable is not invalid" and the design note "`stateOf` splits on \n and trims, so CRLF IS readable" are wrong. `bin/sdd:194-195` runs `/^([a-z_]+):\s*(.*)$/` (no `m` flag) on each `\n` split line. In JS `.` does not match `\r`, so `status: active\r` fails to match (`.*` stops before `\r`, `$` then fails). A CRLF `state.yaml` yields `{}` (only a final line with no line terminator parses). The proposal was right; the spec is wrong.
- F2. Spec "Read-only warnings: the doctor MUST NOT write, rename or delete anything" is already false today. `probeBackend('files')` (`bin/sdd:629-637`) writes and removes `keel/.sdd-doctor-probe` during every doctor run when `artifact_store` includes `files`. The requirement must be scoped to `validateStore` and the new section, and the probe file must not be seen as a finding (validate after the probe, or ignore dotfiles).
- F3. Spec "Completed phases have artifacts" would flag Keel's own store. `keel/changes/antigravity-support/state.yaml:2` and `warn-on-foreign-sdd-files/state.yaml:2` list `spec` in `completed`, yet neither folder has a `specs/` directory (repo listing). Only `clarify` and `blast-radius` are exempted, so a healthy real store produces false positives.
- F4. The "healthy store => byte-identical doctor output" promise conflicts with "Non-files backends: one skipped note" only if the note is printed for files stores; see Q5. Also, `keel/changes/archive/.gitkeep` exists in the real store (dotfile inside `archive/`), so archive scanning must ignore non-directories and dotfiles.

## BLOCKER — must answer before design

### Q1: Is `spec` a required artifact when listed in `completed`?
- Targets: Requirement "Completed phases have artifacts" (specs/store-validation/spec.md); F3.
- Why it matters: two of the three real active changes would be reported on the first run of the released doctor, which trains users to ignore the section.
- Recommended default (ASSUMPTION): `spec`, `clarify` and `blast-radius` are all optional (never reported when absent). Required-if-completed: `explore`, `proposal`, `design`, `tasks`, `apply` (apply-progress.md), `verify` (verify-report.md), `archive` (archive-report.md). If `spec` is present it need not be validated deeper.
- Cost: one line in the phase-to-file table and one spec scenario. Zero if decided now; a false-positive fix release if guessed wrong.

### Q2: CRLF and quoted values: unreadable, or normalized and read?
- Targets: Requirement "Unreadable is not invalid" (spec); F1; `stateOf` `bin/sdd:190-199`; `activeChanges` `bin/sdd:213`.
- Why it matters: `status`/`next`/`activeChanges` use `stateOf` and will NOT see CRLF or quoted values (a quoted `"archived"` still counts as active). If `validateStore` reads them more leniently than the rest of the CLI, doctor says "fine" while `sdd status` misbehaves.
- Recommended default (ASSUMPTION): report both as unreadable and do not change `stateOf`. Rule: the raw file text contains `\r`, or a BOM, or a required key's value starts with `"` or `'`, or contains ` #` => finding "state.yaml unreadable by sdd status: <reason>" and skip field checks for that file (no invalid findings from it). No quote stripping, no YAML dependency. Reason: consistent with what the rest of Keel actually sees.
- Cost: low. The alternative (stripping quotes and normalizing CRLF inside `validateStore`) is about the same code but hides a real `status` bug.

### Q3: Exact boundary between "unreadable" and "invalid"?
- Targets: Requirements "State fields" and "Unreadable is not invalid" (spec).
- Why it matters: without a rule, two implementers classify block lists, empty values and duplicates differently and tests cannot pin it.
- Recommended default (ASSUMPTION), evaluated per file in this order:
  1. Unreadable (whole file, no further checks): `\r`, BOM, quoted or `#`-commented value on a required key (Q2).
  2. Unreadable (that key only): `completed:` with empty value (block list or empty, indistinguishable to the regex) or a `completed` value not shaped `[...]`; a required key that is absent from the parse but appears indented (`^\s+key:`), i.e. nested.
  3. Invalid: a required key entirely absent; `status` not `active|archived`; `archived_on` absent or not `YYYY-MM-DD` when archived; `current_phase` or any `completed` item outside the ten pipeline phases; a key that appears twice (last wins in `stateOf`, so report "duplicate key"). `completed: []` is valid and empty.
  Unknown extra keys (`open_questions`, `updated`, indented list items) are ignored; the real sample has them (`keel/changes/antigravity-support/state.yaml:3-6`).
- Cost: medium-low; it is a small classification function, all cases become unit tests.

## ASSUMPTION — proceeding with default unless corrected

### Q4: Which `artifact_store` values count as "files backend"?
- Targets: Requirement "Files backend only" (spec); doctor block `bin/sdd:574-587`.
- Assumed: split on `+` exactly as the existing check does (`bin/sdd:581,585`). Validate when any segment is `files` (`files`, `files+sqlite`, `sqlite+files`); mirror comparison stays out of scope. Skip for `none`, `sqlite`, `mcp-generic`, other known names and unknown values. If the key is absent or `config.yaml` is missing but `keel/changes/` exists: validate (files is the canonical, always-available backend, `core/persistence/files.md:3`; evidence for an explicit default in core: none found, flag it). Quoted values already tolerated by the regex at line 576, reuse that match; CRLF in config: the regex `[^\s"'#]+` stops before `\r`, so it works.
- Skipped note text: `  store checks         skipped — artifact_store is <value>; only the files backend is validated`. For unknown values the existing "unknown artifact_store value" line already explains; print the skip note anyway (one line, still one note).

### Q5: Does the skipped note break "healthy store => byte-identical output"?
- Targets: Requirement "Findings section", Success Criteria 1 (proposal).
- Assumed: no, because the note prints ONLY when the store is non-files. A healthy files store (or no `keel/` at all, or no `artifact_store` key) prints exactly today's output, no header, no blank line. Wording of the promise should be "for a healthy files store". Test: capture doctor output before and after on a clean fixture, compare equal; separate test asserts the note for `sqlite` and `none`. Evidence: doctor already prints its collisions block only when non-empty (`bin/sdd:568`).

### Q6: No `keel/`, stray files, dotfiles, and archive entries?
- Targets: Requirements "Findings section / no keel directory", "Missing state", "Change names" (spec).
- Assumed: no `keel/` or no `keel/changes/` => `validateStore` returns `[]` (doctor already prints `keel/ NO` at `bin/sdd:570`). Only directories are scanned (same as `activeChanges`, `bin/sdd:212`); files such as `README.md`, `.DS_Store` and dirs starting with `.` are ignored, never reported. Under `archive/`, only directories are considered; an entry must match `^\d{4}-\d{2}-\d{2}-<kebab>$` or it gets a name finding; archived folders without `state.yaml` are not reported (spec scopes "missing state" to active folders). Duplicate check strips the fixed 10-char prefix + `-` (`core/persistence/files.md:46-49`) and compares to active names. `keel/.sdd-doctor-probe` is a dotfile at `keel/`, not under `changes/`, so it does not interfere.

### Q7: Finding wording and Windows separators?
- Targets: Requirement "Change names", scenario "Windows separators" (spec).
- Assumed: one line per finding under the header `store checks (read-only, exit code unaffected):`, format `  <change>  <problem>`, neutral and grep-testable, no words like "corrupt" or "broken". Templates: `no state.yaml`; `state.yaml unreadable: <reason>`; `invalid: missing <key>` / `invalid: status "<v>"` / `invalid: unknown phase "<p>"` / `invalid: duplicate key <k>`; `status archived but folder is under changes/` / `status active but folder is under archive/` / `archived_on <d> differs from folder date <d2>`; `completed "<phase>" but <file> is missing`; `name is not kebab-case` / `name "<n>" is reserved`; `exists as active and archived (<archive folder>)`. Tests assert regexes on the change name plus a key fragment, as `test/artifacts.test.js:21-42` already does.
- Windows: `readdirSync` never yields separators, so normalization only matters for the pure name function. `validateName(relPath)` does `relPath.replace(/\\/g, '/')`, takes the last segment, then applies kebab and reserved checks; the scenario tests that function directly with `changes\Foo_Bar` (no Windows runner needed). On POSIX a literal backslash in a real folder name is then reported as non-kebab, which is correct.

## Resolved

Automatic mode (chosen by the user on 2026-09-25): nobody answered Q1-Q7 individually; every RECOMMENDED default is recorded as an ASSUMPTION and applied by the spec update and the design. The user reviews them in the combined summary before apply.

- **Verified by the orchestrator (node, 2026-09-25):** `stateOf` returns `{}` for a CRLF state.yaml (the proposal was right, the spec author was wrong), keeps the quotes of `status: "active"`, and returns `completed: ""` for a block-style list.
- **ASSUMPTION Q1:** `spec`, `clarify` and `blast-radius` are OPTIONAL when checking completed phases against artifacts. Required when completed: explore, proposal, design, tasks, apply (apply-progress.md), verify (verify-report.md), archive (archive-report.md). Reason: Keel's own stores list `spec` in `completed` with no `specs/` dir.
- **ASSUMPTION Q2:** CRLF, a BOM, quoted values or ` #` comments on a required key make the file "unreadable" and skip its field checks. `stateOf` is NOT changed and quotes are NOT stripped (doctor stays consistent with what `status` and `next` see; no YAML dependency).
- **ASSUMPTION Q3 (order):** file-level unreadable (`\r`, BOM, quoted or commented required value); key-level unreadable (empty or non-`[..]` `completed`, required key only indented); invalid (required key missing, bad `status`, missing or non-`YYYY-MM-DD` `archived_on` when archived, unknown phase, duplicate key). `completed: []` is valid; extra keys ignored.
- **ASSUMPTION Q4:** split `artifact_store` on `+`; validate when any segment is `files`; skip with one note for `none`, `sqlite`, `mcp-generic` and unknown values; an absent key or config still validates (UNVERIFIED default).
- **ASSUMPTION Q5:** the skipped note prints only for a non-files store; a healthy files store, or no `keel/`, stays byte-identical.
- **ASSUMPTION Q6:** no `keel/` or no `keel/changes/` returns no findings; only directories are scanned (stray files and dotfiles such as `.gitkeep` ignored); archive entries match `^\d{4}-\d{2}-\d{2}-<kebab>$`; archived folders without state.yaml are not reported; the duplicate check strips the 10-character date prefix and `-`.
- **ASSUMPTION Q7:** neutral finding templates (`no state.yaml`, `state.yaml unreadable: <reason>`, `invalid: ...`, `completed "<p>" but <file> is missing`); tests assert regexes on the change name plus a fragment; `validateName(relPath)` normalizes `\` to `/` before the kebab-case and reserved-name checks.
- **Scope fix F2:** "read-only" applies to `validateStore` and its section. `doctor` already writes and deletes `keel/.sdd-doctor-probe` (bin/sdd `probeBackend('files')`); dotfiles are ignored by the scan.
- **Out of scope, reported as a separate follow-up:** making `stateOf` tolerate CRLF (`split(/\r?\n/)`), a one-line fix with a test that would also help `status` and `next` on Windows.
- Sequencing: apply starts only after PR #11 merges (same doctor code).
