# Blast Radius: Add GitHub Copilot support

| Surface | Consumer (file:line) | Class | Handling |
|---|---|---|---|
| `build/manifest.json` row after antigravity (:374), before generic (:446) | source of truth | must-change | add row |
| `build/generate.js` REGISTRY loop :256, validate :184, invoke templates :461 | row-driven | verify-only | no edit; build must pass |
| `bin/sdd` AGENT_IDS :30, readersOf :73, dialect :250, installedInProject :240, skillsDirNotices :355, collisions :390, doctor idw :527 | row-driven | verify-only | no edit; tests cover |
| `test/install.test.js:261` exact notice `(shared with opencode, codex, gemini, kimi)` | BREAKS | must-change | append `, copilot` |
| `test/install.test.js:130,201` index/notice pins | AFFECTED | verify-only | still hold (copilot is after antigravity) |
| `test/install.test.js:318` count of 11 | unrelated (file list) | safe | none |
| `test/docs.test.js:24` code-block count EN vs ES; `## ` parity | BREAKS if unequal | must-change | Copilot section without fences, both languages |
| `docs/install.md:38,57`; `docs/es/instalacion.md:40,62` reader lists | stale | must-change | add Copilot |
| `README.md:128` / `docs/es/README.md:130` tables, install lines :109/:111 | stale | must-change | row `(6)`, footnote |
| `CHANGELOG.md` Unreleased | test pins Unreleased (docs.test.js:72) | must-change | entry |
| `keel/steering/product.md:48`, `structure.md:13` | stale | must-change | update |
| `adapters/copilot/` | new generated | must-change | `node bin/sdd build`, separate commit |
| other `adapters/*` | unchanged | verify-only | diff empty after build |
| `package.json` files (`adapters/`) | covers new dir | safe | none |
| `.claude-plugin/marketplace.json` | no agent list (rg: none) | safe | none |

## Must-handle list
- Update install.test.js:261 notice.
- Add docs/README/CHANGELOG/steering edits above, EN and ES in parity.
- Regenerate adapters in a separate commit; confirm other adapters unchanged.

## Published surfaces & compatibility
`sdd` npm package and `adapters/`: additive only; existing agents' output unchanged.

## Verdict: CONTAINED
