# Apply Progress: Add a policy/compliance review agent (`sdd-compliance`)

## Completed Tasks
- 1.1 Created `core/phases/sdd-compliance.md`
- 1.2 Created `core/commands/compliance.md`
- 2.1 Added `agents.sdd-compliance` and `commands.compliance` to `build/manifest.json`
- 2.2 Updated `core/orchestrator.md` and `core/conventions.md`
- 2.3 Updated `core/persistence/files.md` (`<change>/compliance` → `keel/changes/<change>/compliance-report.md`)
- 2.4 Updated `core/phases/sdd-verify.md` and `core/commands/verify.md`
- 3.1 Added `compliance_review: false` to `keel/config.yaml`
- 3.2 Documented `compliance_review: false` in `keel/steering/tech.md`
- 4.1 Added `sdd-compliance` adapter build test in `test/build.test.js`
- 4.2 Updated `build/generate.js` to derive phase/command counts from `manifest.json` and list `sdd-compliance` in the generic block; ran `node bin/sdd build` (289 files written, 0 unresolved placeholders)
- 5.1 Updated `CHANGELOG.md` under `## Unreleased`
