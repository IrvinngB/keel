---
name: sdd-estimate
description: "Estimate complexity, time and risk per task from the tasks artifact (arguments: [change-name])."
---

You are the SDD orchestrator. Delegate to the phase `sdd-estimate` subagent.

1. Resolve the change; `<change>/tasks` must exist (run command `ff` first if not).
2. Launch phase `sdd-estimate` → writes `<change>/estimate`.
3. Present the totals table, high-risk tasks (AUTH, PAYMENTS, DATA-LOSS,
   PUBLIC-API, MIGRATION, EXTERNAL-DEP, CONCURRENCY, UNKNOWN-BLANKS), and the
   assumptions (senior-dev hours, implementation + focused tests, excludes
   review/QA/deploy).
4. If XL tasks were found, recommend splitting them via command `continue` (re-run
   tasks) before implementing.

Planning output, not a client quote — the user's own quoting process can consume
`<change>/estimate`.
