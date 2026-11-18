# Blast Radius: trim-workflow-skill-persistence

| Surface | Consumers (file:line) | Class |
|---|---|---|
| `fail` throws | build/generate.js:53,69,88,123-124,174,183-252,267,276,309,479-480 (all callers); only exit: :76 | MUST-HANDLE |
| generator run | bin/sdd:460 spawns via execFileSync (stdio inherit); verify() is in generate.js:466 | WATCH |
| CI / prepublish | ci.yml:22,25 (`node --check`, build), package.json:43-44 | WATCH |
| `ctx.persistence` | generate.js:249,252,283 (only reader) | MUST-HANDLE |
| `skillBody` | generate.js:283,316 only | MUST-HANDLE |
| `listFiles` | generate.js:115,227-228,249 | NONE |
| tests requiring generator | none (test/package.test.js:20 only checks the path is in `files`) | NONE |
| keelNames/copyTree/hasKeelEntry | bin/sdd:130,240,245,314,331,438,533-548 walk adapters recursively; new persistence/*.md just appear in `files` | WATCH |
| install/package tests | test/install.test.js:239-259 list gemini/antigravity trees; package.test.js:17-21 | WATCH |
| load-rule wording | core/orchestrator.md:54-59, core/commands/init.md:13, core/persistence/interface.md | MUST-HANDLE |
| docs layout | README.md:218, docs/es/README.md:228 (parity), CONTRIBUTING.md:39, keel/steering/structure.md:46, CHANGELOG.md:102 | WATCH |
| plugin layout | .claude-plugin/marketplace.json:10 source adapters/claude; claude row unchanged in PR1 | NONE |
| hooks | hooks/ not touched by generator except :241 existence check | NONE |
| PR #10 / #11 | build/manifest.json diffs (+74 each) and bin/sdd (#10 +3, #11 +158 lines) | MUST-HANDLE |

## Generated-file impact (PR1)
- All agents inline: every SKILL.md (6), init outputs (6), opencode sdd-orchestrator.md change by wording; 3 generic core docs change.
- claude: unchanged persistence layout; wording only.
- Node 18/22 and Windows: `require.main === module` is correct; bin/sdd:460 spawns a child, so the guard runs. Exit code must stay 1 via the catch block.

## Must-handle
1. Convert every `fail` caller to throw; keep the `generate: ERROR:` line, BUILD cleanup and exit 1 in the `require.main` block (execFileSync at bin/sdd:460 relies on it).
2. Change `ctx.persistence` to `[{name,text}]` and update `skillBody` (:283,:316) to return `{body,side}`.
3. Export `skillBody`, `validateRegistry`, `loadCtx`; add test/build.test.js.
4. Reword orchestrator.md:54-59, init.md:13, interface.md §Selection; regenerate adapters.
5. Update docs layouts (README, es README with `##`/fence parity, CONTRIBUTING, structure.md, CHANGELOG).
6. Add doctor check in bin/sdd; rebase on #10/#11 to resolve manifest.json and bin/sdd conflicts before regenerating adapters.
7. Confirm new files pass the install tests' file lists.

Verdict: CONTAINED
