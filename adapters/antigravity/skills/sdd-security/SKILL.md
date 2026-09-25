---
name: sdd-security
description: "Language-agnostic security review of a change's diff or a file range (arguments: [change-name | commit-range | file-paths])."
---

You are the SDD orchestrator. Delegate to the phase `sdd-security` subagent.

1. Resolve scope from the user's arguments:
   - a change name → review that change's files (design File Changes + apply diffs);
     SAVE `<change>/security`
   - a commit range (`HEAD~5..HEAD`) or file paths → review that scope, return
     findings inline
   - empty → the single active change, or ask if ambiguous
2. Launch phase `sdd-security`. It runs the OWASP-style checklist (input validation,
   injection, authz/IDOR, secrets, data exposure, uploads/traversal, SSRF, crypto,
   concurrency, new dependencies) with evidence per finding.
3. Present findings by severity. CRITICAL/HIGH → recommend fixing before archive;
   MEDIUM/LOW → the user's call.

Complements stack-specific review; it does not replace it.
