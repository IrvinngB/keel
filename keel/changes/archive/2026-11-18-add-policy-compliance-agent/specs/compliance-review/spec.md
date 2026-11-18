# Compliance Review Specification

## Purpose
Provide a read-only, evidence-based review pass (`sdd-compliance`) that detects privacy, consent, terms, and user-content signals in a project or change and checks whether those concerns are acknowledged, without offering legal advice or jurisdiction-specific rulings.

## Requirements

### Requirement: Signal-Based Concern Detection
The compliance review MUST inspect available project artifacts (proposals, specs, designs, diffs, UI copy, routes, and dependency manifests) to detect applicable concern areas (cookies/trackers, privacy policy, terms and conditions, user-uploaded content/copyright, and consent/age gates on forms) before running checks.

#### Scenario: Change introduces tracking or cookie SDK
- GIVEN a change diff or dependency manifest adds an analytics, advertising, or cookie SDK
- WHEN the compliance review runs
- THEN the review MUST mark the cookies and trackers concern as applicable and check for a cookie/consent acknowledgment.

#### Scenario: Change has no user-facing or data-collection signals
- GIVEN a CLI or internal library change with no cookies, tracking, accounts, payments, uploads, or PII forms
- WHEN the compliance review runs
- THEN the review MUST report applicable areas as N/A with justification rather than fabricating findings.

#### Scenario: Low-confidence signals are flagged, not asserted
- GIVEN signals that might imply targeting minors or cross-border data transfers
- WHEN the compliance review runs
- THEN the review MUST report them as low-confidence flags for human confirmation rather than stated facts.

### Requirement: Acknowledgment-Only Checklist (No Jurisdiction Mode)
The compliance review MUST check only whether each applicable concern is acknowledged (such as a consent notice, privacy/ToS link, content-license/takedown clause, or explicit consent control) and MUST NOT evaluate compliance against country- or region-specific laws.

#### Scenario: Missing privacy or terms link on signup flow
- GIVEN a change adds user registration or account signup without any reference to a privacy policy or terms of service
- WHEN the compliance review runs
- THEN the review MUST report a finding with file:line or artifact evidence and explain the missing acknowledgment.

#### Scenario: Jurisdiction-specific legal question
- GIVEN a project or user asks whether an implementation satisfies a specific law (such as GDPR or CCPA)
- WHEN the compliance review runs
- THEN the review MUST NOT issue a legal-compliance verdict and MUST state that jurisdiction-specific legal evaluation is out of scope.

### Requirement: Mandatory Legal Disclaimer
Every compliance report MUST open and close with an explicit disclaimer stating that the report is not legal advice and that the developer must verify requirements with current law and qualified legal counsel.

#### Scenario: Report generation with or without findings
- GIVEN any scope (a named change, commit range, or file list)
- WHEN the compliance review produces a report
- THEN both the opening and closing of the report MUST include the non-legal-advice disclaimer, and the report MUST NOT use a PASS/FAIL legal-clearance verdict.

### Requirement: Severity Scale and Non-Blocking Gate
The compliance review MUST use the severity scale `HIGH`, `MEDIUM`, `LOW`, and `INFO`, and MUST NOT emit `CRITICAL` findings.

#### Scenario: Report severity levels
- GIVEN one or more missing acknowledgments are found
- WHEN the compliance review assigns severities
- THEN every finding MUST use `HIGH`, `MEDIUM`, `LOW`, or `INFO`, never `CRITICAL`.

### Requirement: Read-Only Execution and Persistence
The compliance review MUST NOT modify source code or policy text. When invoked for a named change, it MUST persist the report to `<change>/compliance`; when invoked without a change name, it MUST return the report inline.

#### Scenario: Standalone run for a named change
- GIVEN an active change `<change>`
- WHEN the compliance command runs for `<change>`
- THEN it writes `<change>/compliance` and leaves all source code and policy files untouched.

### Requirement: Optional Verify Integration
The compliance review MUST be off by default (`compliance_review: false` in project configuration). When `compliance_review: true`, the verification phase MUST run or invoke the compliance pass over the changed files.

#### Scenario: Default configuration
- GIVEN a project where `compliance_review` is `false` or unset
- WHEN verification runs
- THEN the compliance pass MUST NOT run automatically.

#### Scenario: Opt-in configuration
- GIVEN a project where `compliance_review: true`
- WHEN verification runs
- THEN the compliance pass MUST run and include its findings or recommendation in the verification output.
