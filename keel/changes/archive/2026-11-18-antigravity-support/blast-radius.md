# Blast Radius: antigravity-support

| Surface | Consumers (file:line) | Class |
|---|---|---|
| bin/sdd:30 AGENT_IDS; usage 365/366/495 | derive from keys | NONE |
| bin/sdd:73 readersOf, 326-333 notices | derive; no test pins "shared with" | NONE (new test) |
| bin/sdd:92-93 context scan, 212-221 installedInProject, 118-126 userSkillDirs | generic | NONE |
| bin/sdd:226-228 dialect (key order) | row after kimi keeps existing `next` | WATCH (test order) |
| bin/sdd:440 `id.padEnd(9)` | 11-char id misaligns doctor | MUST-HANDLE (widen + test, or accept) |
| build/generate.js:182-223, 256 | generic validate/emit; codex-shaped row passes | NONE |
| build/generate.js:303 (`e.floor` only generic) | no per-agent case | NONE |
| adapters/antigravity/ (new) | 32 SKILL.md + AGENTS.block.md | MUST-HANDLE (build commit) |
| ci.yml:24-30 adapters-in-sync | fails until regenerated; no agent list | WATCH |
| package.json:31 `files` "adapters/"; test/package.test.js:20 | dir-level, covers new dir; no version/count assert | NONE |
| test/install.test.js (only codex/kimi at :75-82), docs.test.js, artifacts, guard | no agent-list, dir-count or registry-count asserts | NONE (new tests go in install/docs) |
| test/docs.test.js:17-23 | `## ` and fence parity README<->es/README, install<->es/instalacion, CONTRIBUTING<->es | MUST-HANDLE |
| build/manifest.json:161 codex notes "Kimi and Gemini also read" | hard-coded list | MUST-HANDLE |
| README.md:105-110 (code block), 117-126 table, 132-144 footnotes | agent table, "Antigravity not supported" at 136/140 | MUST-HANDLE |
| docs/es/README.md:107-112, 125-129, 138-148 | mirror | MUST-HANDLE |
| docs/install.md:6-11 (## Antigravity), :15, :29-30 | rewrite; list of readers | MUST-HANDLE |
| docs/es/instalacion.md:8-12, 18, 34-35 | mirror | MUST-HANDLE |
| CHANGELOG.md Unreleased (line 3-9); 0.3.0 at :123 | add entry; 0.3.0 untouched | MUST-HANDLE / WATCH |
| keel/steering/product.md:48 | "Antigravity unsupported" | MUST-HANDLE |
| keel/steering/structure.md:13 | adapters list omits antigravity | MUST-HANDLE |
| CONTRIBUTING.md, docs/es/contribuir.md | mention adapters/ generically only | NONE |
| hooks/, .claude-plugin/marketplace.json:10 | claude only, no agent lists | NONE |
| keel/config.yaml, steering tech.md | generic adapter wording | NONE |
| README "N agents" count phrases | none found (rg) | NONE |

## Must-handle
1. Failing tests first (install.test.js, docs.test.js) per design Testing Strategy.
2. Add `antigravity` row after `kimi`, before `generic`.
3. Decide doctor padEnd(9) at bin/sdd:440: widen with test, or accept.
4. Update codex `notes` (manifest.json:161) to include Antigravity.
5. `node bin/sdd build`; separate `build: regenerate adapters` commit; `git status --porcelain adapters/` empty.
6. README.md + docs/es/README.md: install line, `Experimental (5)` row, footnote, replace "not supported".
7. docs/install.md + docs/es/instalacion.md: rewrite `## Antigravity` inside the same heading/fence counts; add to readers list.
8. CHANGELOG Unreleased/Added.
9. steering product.md:48 and structure.md:13.

## Published surfaces
npm tarball (`adapters/`) grows; additive only. Verdict: CONTAINED.
