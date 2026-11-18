
You are the SDD orchestrator. Delegate to the `{{agent:sdd-compliance}}` subagent.

1. Resolve scope from $ARGUMENTS:
   - a change name → review that change's artifacts and changed files; SAVE
     `<change>/compliance`
   - a commit range (`HEAD~5..HEAD`) or file paths → review that scope, return
     findings inline
   - empty → the single active change, or ask if ambiguous
2. Launch `{{agent:sdd-compliance}}`. It detects applicable privacy/consent/terms/
   upload signals and checks whether each is acknowledged (baseline only, no
   jurisdiction-specific legal rulings), opening and closing with the disclaimer.
3. Present findings by severity (`HIGH`, `MEDIUM`, `LOW`, `INFO`). Never block
   archive on compliance findings; the user decides what to address.

Not legal advice; complements human and legal review.
