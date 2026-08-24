# India Import Preflight Agent Implementation Plan

Date: 24 August 2026  
Deadline: 28 August 2026, 8:00 PM IST  
Execution: one Plane ticket per Codex task; the completing task creates exactly one next task.

## Goal

Answer one promise across a small admitted electronics catalog:

> Before I place this order, can this shipment clear Indian customs, what is missing, what will it cost, and what must I do next?

Release requires at least two independently admitted product scenarios. Three are targeted. Four is the absolute deadline cap. The pack registry may enforce a maximum of 10, but the product must never present unused capacity as coverage.

## Architecture

One product-neutral journey feeds one deterministic assessment and cost engine. Each supported product contributes an independent versioned pack. OpenAI is limited to editable extraction, normalization, bounded candidate suggestions, material questions, and explanation. It does not own legal applicability, outcomes, or arithmetic.

Core contracts:

- `ProductScenario`: exact attributes, assumptions, and exclusions.
- `ProductPack`: scenario, lifecycle status (`candidate`, `source_admitted`, `full_support`), sources, admitted mappings, rules, rates, services, fixtures, and freshness.
- `EvidenceFact`: value, provenance, confidence, confirmation, and source locator.
- `ClassificationCandidate`: HS code, rationale, confidence, provenance, mapping ID, and matched distinguishing facts.
- `Finding`: rule, evidence, missing evidence, clearance effect, source, consequence, and actions.
- `Assessment`: selected pack, coverage state, one top-level outcome, classification candidates, findings, cost, actions, and checked scope.

The pack registry rejects more than 10 entries. The supported selector is derived only from manifests whose status is `full_support`. Source-admitted packs are available solely to the restricted promotion harness.

## Global Safety Gates

- A pack cannot return a public Ready, Blocked, or numeric statutory cost while `candidate`, `source_admitted`, stale, ambiguous, or missing required evidence.
- Only a high-confidence deterministic `admitted_mapping` matching all material distinguishing facts can control rules, rates, or Ready.
- A rule can create Blocked only when its official source and pinpoint locator prove it prevents or conditions import clearance for the exact scenario.
- Ready requires current admitted coverage, complete facts/evidence, acceptable classification, complete cost, positive evaluation, and no unresolved findings.
- Shared rule modules require explicit per-pack applicability declarations and cross-pack isolation tests.
- Missing evidence produces Needs verification unless a separate admitted blocker applies.

## Task 1 — BWMI-9: Admit the First Wi-Fi-Router Pack

**Stop condition:** The router pack reaches `source_admitted` with three reviewed fixtures while remaining non-selectable and public-runtime-disabled, or the task reports an evidence boundary failure and stops the chain.

1. Inspect and preserve the existing non-destructive bootstrap files and router admission test.
2. Write failing contract tests for exact boundary, source dates, pinpoint clearance effects, admitted HS mapping, rates, evidence, remediation, fixtures, and fail-closed status.
3. Research only primary official sources. Record exact citations and source locators; never treat the supplied DOCX as authority.
4. Confirm or narrow the provisional router scenario.
5. Encode the versioned pack and Ready/Blocked/Needs verification fixtures, then mark only `source_admitted`.
6. Prove another or ambiguous router variant cannot match the pack.
7. Run focused admission tests, type checks, and source-link checks.
8. If complete, mark BWMI-9 Done and create exactly one new Codex task for BWMI-10. Otherwise mark blocked and create no task.

Do not build UI, admit another product, or implement a legal-result engine in this task.

## Task 2 — BWMI-10: Admit the Second Bluetooth-Headphones Pack

**Stop condition:** A legally distinct headphones pack independently reaches `source_admitted`; public multi-product support is established only after Ticket 3 promotes both packs.

1. Write pack-isolation and admission tests before implementation.
2. Confirm or narrow the provisional over-ear Bluetooth-headphones scenario using primary official sources.
3. Encode its exact mapping, rules, rates, evidence, actions, sources, and three fixtures.
4. Reference common rules only through explicit applicability declarations.
5. Prove the pack cannot inherit router admission, mapping, rates, or outcomes.
6. Run both product-pack suites and the registry-cap test.
7. Keep the pack non-selectable and public-runtime-disabled. If complete, mark BWMI-10 Done and create exactly one new task for BWMI-11. If source admission fails, stop the chain.

Do not build UI or the third product.

## Task 3 — BWMI-11: Build the Safe Two-Product Journey

**Stop condition:** Router and headphones independently move from `source_admitted` to `full_support` by completing Ready, Blocked, and Needs verification through the same public browser journey.

1. Bootstrap the Next.js application manually without destructive scaffolding.
2. Write failing engine, cost, registry-selector, and complete-journey tests.
3. Implement product-neutral fact capture, applicability, classification gating, readiness, cost, findings, ordered actions, and report contracts.
4. Evaluate both source-admitted packs through a restricted promotion harness, then derive public supported choices only from `full_support` manifests.
5. Render scope/exclusions, one outcome, why blocked, missing evidence, line-item cost or named blocker, source dates, official destinations, and rerun conditions.
6. Verify edits to decisive facts recompute outcomes instead of retaining fixture labels.
7. Test both products and all outcomes at desktop and 360-pixel widths; independently promote each pack only after its full suite passes.
8. If either pack fails promotion, stop the chain because the two-product release floor is unmet. Otherwise mark BWMI-11 Done and create exactly one task for BWMI-12.

Do not add PDF extraction, Other product, or another product pack.

## Task 4 — BWMI-12: Admit and Add the Third Indoor IP-Camera Product

**Stop condition:** The task returns one explicit, verified result: the camera is independently admitted and added end to end, or it is evidenced as deferred and remains completely absent while the two-product release floor stays green.

1. Write admission, isolation, and end-to-end tests first.
2. Confirm or narrow the provisional indoor Wi-Fi/IP-camera scenario from primary official sources.
3. Encode its independent mapping, sources, rules, rates, evidence, actions, and fixtures and reach `source_admitted`.
4. Promote it to `full_support` only through the existing restricted harness, registry, engine, and product-neutral journey.
5. Re-run router and headphones suites to detect cross-pack leakage.
6. If admission succeeds, prove all three camera outcomes and existing-product regression tests.
7. If admission cannot pass, record every failed gate, keep the camera entirely out of runtime coverage and claims, and prove the two-product release remains green. This evidenced deferral is the planned alternative result for the optional target, not a release blocker.
8. Mark BWMI-12 Done only after one of those two results is verified, then create exactly one task for BWMI-13.

Do not add a fourth product or product-specific UI.

## Task 5 — BWMI-13: Extract One Synthetic Pro-Forma-Invoice PDF

**Stop condition:** One synthetic router PDF yields confirmed editable facts and material questions that feed the existing shared engine; no other product's document extraction is claimed as verified.

1. Write recorded extraction and browser tests first.
2. Implement structured OpenAI Agents SDK extraction with strict schema validation.
3. Show provenance/confidence and require user confirmation of all extracted fields before they reach a product pack; highlight low-confidence fields.
4. Restrict follow-up questions to facts that can change clearance, evidence, or cost.
5. Keep model output out of applicability, outcome, and arithmetic.
6. Reject unsupported file types and multi-document flows.
7. Prevent durable storage/logging; use `no-store`.
8. If complete, mark BWMI-13 Done and create exactly one task for BWMI-14.

## Task 6 — BWMI-14: Add Fail-Closed Other Product

**Stop condition:** An unsupported product preserves useful facts but cannot receive Ready or guessed product-specific conclusions.

1. Write a complete fail-closed browser test.
2. Add `Other product` outside the admitted-product registry.
3. Return Needs verification unless an independently admitted universal blocker applies.
4. Name supported and unsupported checks, unresolved facts, and professional review required.
5. Render a concise on-screen Customs Broker summary without accounts, downloads, or overrides.
6. If complete, mark BWMI-14 Done and create exactly one task for the release ticket.

## Task 7 — Release Ticket: Verify and Ship

**Stop condition:** A public no-login deployment and submission evidence prove the same multi-product journey.

1. Run unit, contract, type, lint, production-build, and complete browser suites from a clean install.
2. Verify at least two `full_support` products complete all three outcomes and only passed products appear or are claimed.
3. Complete keyboard, 360-pixel, accessibility, privacy, and synthetic-data checks.
4. Verify official links and visible checked/freshness dates.
5. Confirm no real documents, identifiers, credentials, or sensitive data in code, fixtures, logs, or deployment.
6. Deploy publicly and smoke-test without login.
7. Produce a two-minute demo script and sub-250-word summary using verified behavior only.
8. Mark the release ticket Done. Do not create another implementation task.

## Explicit Non-Goals

- Mixed-industry packs or products 5-10 before the deadline
- A fourth product unless release gates are already green
- API Setu runtime integration without a verified relevant sandbox
- Government login, filing, payment, issuance, status, or approval
- Broker workspace, downloadable packet, supplier drafting, durable accounts/cases
- Cost ranges, optional commercial fees, image OCR, or multi-document reconciliation
- Product-specific screens, parallel engines, or multiple agents

## Process and Resource Rule

Before starting any server or worker, inspect current listeners and ownership and reuse only a compatible healthy instance. Track every process started by a task and stop verified task-owned long-running processes before completion. Every task reports what it started, reused, stopped, and preserved.
