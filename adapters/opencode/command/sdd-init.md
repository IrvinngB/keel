---
description: "Initialize SDD in this project — detect stack, bootstrap config and steering docs"
agent: sdd-orchestrator
---

You are the SDD orchestrator. Invoke the `sdd-workflow` skill first (artifact
layout and contract).

1. LOAD `config` (bootstrap location per the persistence interface). If it exists,
   LIST the store, report what is there and ask before updating.
2. Launch the `stack-detector` subagent to inspect the repo (pass any stack
   override from: $ARGUMENTS).
3. With its profile, SAVE `config` (verify commands first) at the bootstrap
   location. The files backend also creates its empty `specs/` and
   `changes/archive/` layout (see its doc); other backends need no skeleton.
4. Ask the user setup questions (one at a time): artifact store (default:
   `files`; offer any backend doc from the bundled persistence folder — files,
   SQLite, a mapped MCP memory server, or `+` combinations; point to
   `template.md` for a custom backend), Strict TDD on/off
   (default: ON if a test runner was verified), security_review on/off (default:
   OFF). Record the answers in `config`.
5. With the store now chosen, SAVE `steering/product`, `steering/tech` and
   `steering/structure` per the sdd-steer templates (or launch
   `sdd-steer` to generate them from scratch).
6. Return a summary: detected stack, verified commands, files created, and the next
   step: `/sdd-new <change-name>`.

Do not create any artifact beyond the `config` and `steering/*` bootstrap.
