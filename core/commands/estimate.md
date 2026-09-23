
You are the SDD orchestrator. Delegate to the `{{agent:sdd-estimate}}` subagent.

1. Resolve the change; `tasks.md` must exist (run `{{cmd:ff}}` first if not).
2. Launch `{{agent:sdd-estimate}}` → writes `estimate.md`.
3. Present the totals table, high-risk tasks (AUTH, PAYMENTS, DATA-LOSS,
   PUBLIC-API, MIGRATION, EXTERNAL-DEP, CONCURRENCY, UNKNOWN-BLANKS), and the
   assumptions (senior-dev hours, implementation + focused tests, excludes
   review/QA/deploy).
4. If XL tasks were found, recommend splitting them via `{{cmd:continue}}` (re-run
   tasks) before implementing.

Planning output, not a client quote — the user's own quoting process can consume
`estimate.md`.
