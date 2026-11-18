# Apply progress: trim-workflow-skill-persistence (PR1)

Done: 0.1, 1.1-1.4, 2.1-2.6, 3.1, 3.2, 4.1, 4.2, 5.1. Left for the maintainer: 3.3, 4.3, 5.2 (commits) and PR2.
Tests: 103 before, 116 after (13 new), all passing.

Files: build/generate.js, bin/sdd, core/{persistence/interface,orchestrator,commands/init}.md,
test/build.test.js (new), test/install.test.js, README.md, docs/es/README.md, CONTRIBUTING.md,
keel/steering/structure.md, CHANGELOG.md, adapters/** (19 files, wording only, no persistence/ dirs).

TDD: RED run first (8 failures: missing exports, no doctor warning), then GREEN. 3.1 tests and the
inline/side-file silence tests are regression guards and passed at RED by design.

Deviations: see final report (validation ordering, doctor scans user dirs too, sandboxed build test).
