# Blast Radius: warn-on-foreign-sdd-files

| Surface | Consumer (file:line) | Class |
|---|---|---|
| hasSddEntry def | bin/sdd:205 | MUST-HANDLE (replace) |
| installedInProject | bin/sdd:218; feeds dialect() 228, `sdd next`/`status` 392/398/413, doctor 431, 482 | MUST-HANDLE (per-agent names) |
| skillsDirNotices | bin/sdd:331 (stale-copy warning); line 327 "shared with" notice | MUST-HANDLE caller; notice WATCH (test pins it) |
| doctor `seen` | bin/sdd:432 and "twice" warning ~455 | MUST-HANDLE |
| doctor `seenUser` | bin/sdd:444 via userSkillDirs (118) and user "twice" warning ~446 | MUST-HANDLE |
| overwritten line | bin/sdd:304 shares ternary with dry-run note | MUST-HANDLE (keep dry-run text) |
| readersOf | bin/sdd:73 | NONE |
| install.test.js:204-212 | old `sdd-x` fixtures and "may discover the sdd skills twice" | MUST-HANDLE (fixtures need Keel names; wording) |
| install.test.js:241-260 | exact dry-run actions plus notice line 256 | WATCH (preexisting() output under --dry-run must not alter it on a clean dir) |
| install.test.js:116, 262-271 | `agLine` regex and `startsWith('  <id> ')` finders | WATCH (collisions section must never begin with `  <id> `) |
| guard, artifacts, package tests | artifacts.test.js:22-42 use regexes | NONE |
| adapters layouts | manifest.json map `to`: skills, gemini `.gemini/commands` (sdd/*.toml, nested), opencode `agent`/`command` singular | WATCH: keelNames must recurse for gemini; no map entry breaks the walk |
| package.json:31 `files` | adapters/ shipped, so keelNames reading adapters at runtime is OK | NONE |
| docs | docs/install.md:45-46, docs/es/instalacion.md:49 quote "twice" wording | MUST-HANDLE (EN+ES together) |
| docs.test.js parity | `##` headings and fenced blocks per EN/ES pair | WATCH (a new section or block goes in both) |
| CHANGELOG.md:3 Unreleased | add entry | MUST-HANDLE |
| README, CONTRIBUTING:44 | no old wording | NONE |
| keel/steering, ci.yml | ci runs `npm test` (34-46) plus adapters drift check (24-30); no bin/sdd change touches adapters | NONE |

Published surface: none (human output only).

## Must-handle
1. Replace hasSddEntry with keelNames/hasKeelEntry at all 4 callers (205, 218, 331, 432, 444).
2. Remove the overwritten claim at 304, keeping the dry-run note.
3. Rewrite the "twice" warnings (user and project) and their tests (install.test.js:204-212).
4. Update docs/install.md and docs/es/instalacion.md wording together, keeping docs.test.js parity.
5. Add a CHANGELOG Unreleased entry.
6. Keep dry-run and doctor-line tests (241-260, 262-271) green; the collisions section must not start with `  <id> `.

Verdict: CONTAINED
