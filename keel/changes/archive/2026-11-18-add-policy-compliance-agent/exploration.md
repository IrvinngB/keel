## Exploration: policy/legal-compliance review agent (issue #13)

Note on sourcing: I could not run `gh issue view 13` (no Bash tool available to this
explore agent). This exploration treats the task brief's detailed paraphrase of issue
#13 as the seed. If the actual issue body has scope details not reflected in that
brief, re-check before `sdd-propose`.

### Current State

Keel already has one standalone-or-pipeline review agent with the exact shape this
idea wants: `sdd-security` (`core/phases/sdd-security.md`, command
`core/commands/security.md`, registry entry in `build/manifest.json`).

- **Flat contract, no sub-agents.** Every phase contract I read (`sdd-explore`,
  `sdd-security`, `sdd-verify`, `sdd-estimate`, `sdd-drift`, `sdd-postmortem`) opens
  with "Do the phase work yourself. Do NOT delegate, do NOT launch subagents, do NOT
  call the Task/Agent tool." This is a hard, universal rule, not a per-agent choice.
- **Tools**: `sdd-security` gets `Read, Grep, Glob, Bash` — no `Write`. It still
  persists `<change>/security` (mapped to `keel/changes/<change>/security-report.md`
  in `core/persistence/files.md`); it must be doing that through `Bash` (heredoc/
  redirect), not a dedicated Write tool. Read-only review agents in this kit are
  "read-only on the reviewed code", not "cannot touch disk".
- **Off by default, opt-in via config.** `keel/config.yaml` has `security_review:
  false`. `core/phases/sdd-verify.md` step 7: "If `config` has `security_review:
  true`: run the built-in security pass ... (or recommend the standalone
  `sdd-security` agent for a full OWASP pass)." `core/commands/verify.md` surfaces
  the same rule to the orchestrator. `core/orchestrator.md` and
  `core/conventions.md` both list `sdd-security` under "Auxiliary anytime" phases,
  invokable standalone or from verify.
- **Report-only contract.** `sdd-security`'s rules: "Report, don't fix... A finding
  needs evidence: quote the code. No speculative 'might be vulnerable'... Absence of
  findings is a valid result." Same posture (read-only, evidence-based, no fixing) as
  `sdd-drift` and `sdd-postmortem`.
- **Registry entry** (`build/manifest.json` → `agents.sdd-security`) is a plain
  `description` + `tools` array — nothing fancier. This is the "phase/review
  subagent" registry the task brief flagged as distinct from the per-coding-agent
  `registry` block (claude/opencode/codex/...) that maps *installed adapters*, which
  is a different concern entirely (installer surface, not phase content).
- **Precedent for standalone vs pipeline-wired utilities**: `sdd-estimate` (after
  tasks, writes `<change>/estimate`), `sdd-drift` (before verify/archive, writes
  `<change>/drift`), `sdd-postmortem` (after archive, writes `lessons/<change>`,
  proposals require human approval before `sdd-steer` applies them). All are
  "Auxiliary anytime" in the orchestrator's pipeline diagram — invoked on demand by
  command, never automatically gating the pipeline, except `sdd-security` which is
  the one case *conditionally* auto-run from inside `sdd-verify`.
- **Nothing like this exists today.** `rg -i "cookie|privacy policy|terms and
  conditions|GDPR|consent|compliance"` across the repo only matches "Spec Compliance
  Matrix" boilerplate in `sdd-verify`'s report template and generated verify
  artifacts — zero hits on legal/privacy/cookie content. Confirmed: this is a wholly
  new concern for Keel.
- **No live-fetch capability exists anywhere in the kit.** No phase agent has
  `WebFetch`/`WebSearch` in its `tools` array in `build/manifest.json`; the project's
  stated principle is "zero runtime dependencies" and offline-by-design (`core/`
  stays tool-agnostic, `bin/sdd` and `build/generate.js` use only Node built-ins).
  Giving one phase agent a live-legal-lookup capability no other agent has would be a
  first-of-its-kind architectural exception.

### Affected Areas

New files (none exist yet):
- `core/phases/sdd-policy.md` — new phase contract, modeled on
  `core/phases/sdd-security.md` (flat, no sub-agents, `Read/Grep/Glob/Bash`).
- `core/commands/policy.md` — new command body, modeled on
  `core/commands/security.md`.

Existing files that would need edits:
- `build/manifest.json` — add `agents.sdd-policy` (description + tools) and
  `commands.policy` (description + argumentHint), same shape as the `sdd-security` /
  `security` entries (lines ~634-642 and ~743-746).
- `core/orchestrator.md` — add `sdd-policy` to the "Auxiliary anytime" line and the
  "What you may do" routing list (lines ~15-28), alongside `sdd-security`.
- `core/conventions.md` — add an artifact-key row `<change>/policy` (lines ~27-51)
  and update the "Auxiliary (run anytime)" bullet (lines ~21-25).
- `core/persistence/files.md` — add the key→path mapping row, e.g. `<change>/policy`
  → `keel/changes/<change>/policy-report.md` (lines ~17-38), following the
  `<change>/security` row's "(standalone, no change: report inline)" pattern.
- `core/phases/sdd-verify.md` + `core/commands/verify.md` — IF this should be
  wireable from verify like security (open design question, see Approaches): add a
  step analogous to step 7 ("If `config` has `policy_review: true`: ...").
- `keel/config.yaml` + `keel/steering/tech.md` — new config key (e.g.
  `policy_review: false`), documented next to `security_review: false` in the
  steering "Testing and quality" section. For Keel's own repo this will almost
  always stay `false` — Keel-the-CLI has no cookies, payments, or user uploads; it's
  a realistic "off by default, rarely relevant to this project" example, which is
  useful as a real test of the opt-in wiring.
- `adapters/**` — regenerated via `node bin/sdd build`, never hand-edited; committed
  as a separate `build: regenerate adapters` commit (per `AGENTS.md`,
  `keel/steering/structure.md`).
- `test/build.test.js`, `test/artifacts.test.js` — likely need no new agent-specific
  assertions (no existing test file asserts on `sdd-security`/`sdd-estimate`/
  `sdd-drift` by name — checked, zero matches), but both run generic structural
  checks (manifest/adapter consistency, artifact-key conventions) that a new agent
  must not break.

### Approaches

1. **Mirror `sdd-security` exactly, baseline-only, static/read-only (recommended for v1)**
   - A single flat phase contract (`sdd-policy`), `Read/Grep/Glob/Bash` tools only.
     Step 1 detects applicable concerns from real signals already on disk: spec/
     design text, UI copy/form labels in the diff, route/dependency names (payment
     SDKs, analytics/ad SDKs, cookie libs, upload endpoints, auth presence, age
     fields). Step 2 checks only what applied — not "is this GDPR-compliant" but "did
     the spec/design/UI even account for this" (is there a cookie consent notice
     mentioned where tracking was added, a ToS/privacy-policy link where accounts
     signup is added, a content-license/takedown mention where uploads are added, a
     consent checkbox where a form collects PII). "Baseline" = the lowest common
     denominator across major markets, framed as "consider this", never "jurisdiction
     X requires this." No jurisdiction parameter.
   - Every report opens with a hard-coded, non-negotiable disclaimer sentence; the
     agent cannot omit it (unlike security's optional "fix" column, this line is not
     a finding, it is boilerplate).
   - Pros: fits every existing architectural constraint (no sub-agents, no network,
     off by default, report-only); reuses the exact wiring Keel already has for
     `security_review`; genuinely checkable by grep/read without inventing legal
     facts.
   - Cons: materially smaller than the issue — no jurisdiction mode, no "what does
     France require" answers. Some users filing the issue may feel shortchanged.
   - Effort: Medium (one new phase/command file + 6 small edits to existing core
     files + manifest/adapters regen).

2. **Full issue scope: jurisdiction mode + baseline mode, "possibly with sub-agents"**
   - Adds a per-country mode backed by a maintained table of jurisdiction
     requirements (GDPR/EU, CCPA/US-CA, LGPD/BR, etc.), and multiple sub-agents (e.g.
     one per concern area: cookies, uploads/copyright, forms/consent).
   - Pros: matches the issue's literal ask.
   - Cons: (a) directly violates the kit-wide "do NOT launch subagents" rule — every
     other phase contract is flat; this would be the first exception and needs a
     conventions-level change, not just a new agent. (b) a jurisdiction table baked
     into Keel turns an MIT-licensed, zero-dependency dev-tool into the asserted
     source of "what French/Brazilian/Californian law requires" — that content goes
     stale the moment a law changes, and Keel (the project, and whoever merges the
     PR) is on record asserting a legal claim it has no mechanism to keep current.
     (c) "live legal lookups" would need a fetch tool no other agent has, breaking
     the offline/zero-runtime-dependency principle and introducing non-determinism
     (law-as-fetched-today vs law-as-fetched-tomorrow) with no caching/versioning
     story. (d) false confidence: a developer who sees "Policy Agent: PASS (France
     mode)" will treat that as legal clearance, which Keel cannot responsibly imply
     even with a disclaimer — the disclaimer becomes decorative if the UX elsewhere
     (PASS/FAIL verdict, severities) reads as authoritative.
   - Effort: High, and some of it (jurisdiction data maintenance) is not a one-time
     engineering cost — it is an ongoing liability the maintainers must own forever
     or let rot.

3. **Middle ground: ship approach 1, explicitly park jurisdiction mode as a future, separate decision**
   - Same as (1), but the report's "Checklist coverage" section can *name* the
     jurisdiction-specific areas it did NOT check (e.g., "age-of-consent threshold
     varies by country — not evaluated; cross-border transfer mechanism (SCCs/
     adequacy) — not evaluated") so the gap is visible rather than silently cut.
   - Pros: honest about scope without engineering the risky part.
   - Cons: none beyond (1); it's really (1) with better report wording.
   - Effort: Medium (same as 1, plus report-template wording).

### Recommendation

Approach 3 (= approach 1 with explicit "not evaluated" callouts). Ship a single flat
`sdd-policy` phase, off by default (`policy_review: false`), `Read/Grep/Glob/Bash`
only, baseline-mode only, wired the same way `sdd-security` is (standalone command +
optional step from `sdd-verify`). It detects applicability from real artifacts
(spec/design text, routes, dependency names, UI copy in the diff) and only flags
whether the spec/design/UI *acknowledges* the concern (consent notice, policy link,
content-license clause) — never whether that acknowledgment satisfies any specific
law. The jurisdiction-mode half of the issue should be explicitly **cut from v1** and
escalated as a separate, maintainer-level product decision (not an engineering
default) precisely because it changes what Keel is willing to assert and maintain,
not just what code ships.

Two naming notes worth settling before `sdd-propose`, because they are visible in
every report and config file forever:
- `sdd-policy` / `policy_review` overloads "policy" — the config switch name and the
  artifacts the agent is checking (privacy *policy*) collide. `sdd-compliance` /
  `compliance_review` reads less ambiguously; worth deciding in the proposal, not
  silently.
- The severity table should probably avoid `CRITICAL` (which `sdd-verify` and
  `sdd-security` use to mean "blocks archive") — a missing cookie banner is not the
  same class of urgency as a SQL injection, and reusing the word invites developers
  to treat it as equally gating.

### Risks

- **False confidence is the primary risk, not a secondary one.** A developer who
  reads "0 findings" will treat it as "we're legally fine", no matter how the
  disclaimer is worded. This is the same risk `sdd-security` carries ("the agent
  said it's fine" for security), but legal exposure is a worse place for it to land
  than a missed OWASP item, because the output format (severity + PASS-style
  framing) inherently reads as a verdict.
- **Liability of the project asserting legal requirements.** Even "baseline mode" is
  a judgment call about what counts as a shared minimum across markets; if Keel's
  checklist is wrong or outdated, Keel (an MIT open-source project with no legal
  team) is the one who published the claim. This argues for the narrowest possible
  framing: "is this concern addressed by *something* in your spec/design/UI" rather
  than "is this concern addressed *correctly*."
- **Maintenance burden of jurisdiction data, if ever added.** Laws change; a static
  per-country table is stale the day after it's merged, and nobody in this
  zero-dependency, agent-tooling project is positioned to track global privacy-law
  changes. This is why jurisdiction mode should stay out of scope rather than be
  built "simply" and revisited later — the ongoing cost is the problem, not the
  initial build.
- **Scope/architecture mismatch with the issue as filed.** The issue's "possibly
  with sub-agents" framing conflicts with Keel's universal flat-contract rule. If
  the issue author or reviewers expect a multi-agent system, that expectation needs
  correcting during `sdd-propose`, not discovered during `sdd-design`.
- **Static-analysis blind spots on detection.** Signals like "targets minors" or
  "cross-border data transfer" are not reliably inferable from grep/read of spec,
  design, and code — these should be reported as low-confidence flags for the human
  to confirm, never as detected facts, or dropped from v1's detection list entirely.

### Ready for Proposal

Yes, for the v1 scope recommended above (flat agent, baseline-only, read-only,
off-by-default, wired like `sdd-security`). Two things should be decided explicitly
in `sdd-propose` rather than left implicit:
1. Whether jurisdiction mode is cut from the issue entirely (recommended) or
   explicitly deferred to a separate future issue/change — this is a product
   decision for the maintainer, not something to default silently.
2. Final naming for the agent/command/config key (`sdd-policy` vs `sdd-compliance`,
   `policy_review` vs `compliance_review`) given the "privacy policy" naming
   collision noted above.
