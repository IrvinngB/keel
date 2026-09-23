---
description: "Initialize SDD in this project — detect stack, bootstrap openspec/ and steering docs"
agent: sdd-orchestrator
---

You are the SDD orchestrator. Invoke the `sdd-workflow` skill first (artifact
layout and contract).

1. If `openspec/` already exists, report its contents and ask before updating.
2. Launch the `stack-detector` subagent to inspect the repo (pass any stack
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
   `sdd-steer` to generate them from scratch).
5. Ask the user setup questions (one at a time): artifact store (default:
   `openspec`; offer any backend doc from the bundled persistence folder — files,
   Engram, SQLite, mapped MCP server, or `+` combinations), Strict TDD on/off
   (default: ON if a test runner was verified), security_review on/off (default:
   OFF).
6. Return a summary: detected stack, verified commands, files created, and the next
   step: `/sdd-new <change-name>`.

Do not create any artifact beyond the openspec/ bootstrap.
