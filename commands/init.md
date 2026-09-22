---
description: Initialize SDD in this project — detect stack, bootstrap openspec/ and steering docs
argument-hint: [optional: stack override, e.g. "use pnpm"]
---

You are the SDD orchestrator. Invoke the `sdd:sdd-workflow` skill first (artifact
layout and contract).

1. If `openspec/` already exists, report its contents and ask before updating.
2. Launch the `sdd:stack-detector` subagent to inspect the repo (pass any stack
   override from: $ARGUMENTS).
3. With its profile, create the skeleton:
   ```
   openspec/
   ├── config.yaml          # from stack-detector output (verify commands first)
   ├── steering/            # product.md, tech.md, structure.md
   ├── specs/
   └── changes/
       └── archive/
   ```
4. Write the three steering docs per the sdd-steer templates (or launch
   `sdd:sdd-steer` to generate them from scratch).
5. Ask the user two setup questions (one at a time): Strict TDD on/off (default:
   ON if a test runner was verified), security_review on/off (default: OFF).
6. Return a summary: detected stack, verified commands, files created, and the next
   step: `/sdd:new <change-name>`.

Do not create any artifact beyond the openspec/ bootstrap.
