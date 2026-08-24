# Plane Issue Draft: India Import Preflight Agent

Target project: `BWMI` (`265538e4-b321-46a7-89da-ed81d552d8ca`)  
Status: Adversarially approved revision published to Plane on 24 August 2026  
Execution invariant: one ticket per Codex task, one sequential handoff at completion.

## Proposed Work Items

- Parent: `BWMI-8` — India Import Preflight Agent
- Ticket 1: `BWMI-9` — Admit the first Wi-Fi-router product pack
- Ticket 2: `BWMI-10` — Admit the second Bluetooth-headphones product pack
- Ticket 3: `BWMI-11` — Build the safe two-product preflight journey
- Ticket 4: `BWMI-12` — Admit and add the third indoor IP-camera product
- Ticket 5: `BWMI-13` — Extract one synthetic pro-forma-invoice PDF
- Ticket 6: `BWMI-14` — Add fail-closed Other product behavior
- Ticket 7: `BWMI-15` — Verify and ship the multi-product hackathon submission

Tickets execute sequentially. Two `full_support` products are the release floor; the third is the target. A fourth product is outside the active chain and may be considered only after Ticket 7 gates are already green.

All seven tickets are native children of `BWMI-8`, carry `ready-for-agent`, target 28 August 2026, and have verified native blocking relations in this order: `BWMI-9 → BWMI-10 → BWMI-11 → BWMI-12 → BWMI-13 → BWMI-14 → BWMI-15`.

## Parent Scope

Build only this promise across a bounded connected-consumer-electronics catalog:

> Before I place this order, can this shipment clear Indian customs, what is missing, what will it cost, and what must I do next?

Do not create separate product workflows. Every pack feeds the same facts, decision, cost, report, and action contracts.

## 1. Admit the First Wi-Fi-Router Product Pack

**Blocked by:** None — can start immediately.  
**User stories covered:** Evidence-backed product coverage; safe classification; current rules, rates, costs, and actions.

**What to build:** Confirm or narrow the provisional router scenario from primary official sources and encode its independent pack through `source_admitted`. Preserve the partial non-destructive package/test bootstrap already present. Do not build UI, expose it in a selector, or enable a public legal result.

**Acceptance criteria:**
- [ ] Exact scenario boundary and exclusions are explicit.
- [ ] Every rule and rate has primary official evidence, official effect dates, `lastCheckedAt`, internal `reviewAfter`, applicability, required evidence, clearance effect, consequence, and remediation.
- [ ] Every clearance effect has a pinpoint official locator proving it.
- [ ] Any HS mapping used by rules/rates is deterministic, high confidence, and matches all recorded distinguishing facts.
- [ ] Ready, Blocked, and Needs verification fixtures contain exact facts, findings, cost lines, sources, and actions.
- [ ] The ticket ends at `source_admitted`: fixtures and evidence pass, but the pack remains non-selectable and public-runtime-disabled until Ticket 3 promotion.
- [ ] If coherent admission is impossible, the ticket stops as blocked instead of widening scope.

## 2. Admit the Second Bluetooth-Headphones Product Pack

**Blocked by:** Ticket 1.  
**User stories covered:** Genuine multi-product support without inherited or guessed rules.

**What to build:** Confirm or narrow the provisional over-ear Bluetooth-headphones scenario and take it independently to `source_admitted`. Reuse common rule modules only through explicit applicability declarations and tests. Keep it non-selectable and public-runtime-disabled.

**Acceptance criteria:**
- [ ] The product is legally distinct from the router and has its own boundary, HS mapping, sources, rates, evidence, clearance effects, actions, and three fixtures.
- [ ] Cross-pack tests prove the headphones cannot inherit router admission, mappings, rates, or decisions.
- [ ] Shared requirements are explicitly declared applicable to headphones and independently tested.
- [ ] The pack cannot produce a public legal result or numeric cost while `candidate`, `source_admitted`, stale, or ambiguous.
- [ ] If admission fails, the chain stops; the selector must not pretend the product is supported.

## 3. Build the Safe Two-Product Preflight Journey

**Blocked by:** Ticket 2.  
**User stories covered:** Product selection, manual facts, Ready/Blocked/Needs verification, cost, missing evidence, why blocked, and next actions.

**What to build:** Create one public no-login journey. Exercise the two `source_admitted` packs through a restricted test harness, implement deterministic applicability, readiness, cost, explanations, and actions, and independently promote each to `full_support` only after all three complete browser journeys pass. The public selector derives only from `full_support` manifests.

**Acceptance criteria:**
- [ ] Only `full_support` products appear as supported choices; `candidate` and `source_admitted` packs remain absent.
- [ ] Both release-floor packs independently pass promotion from `source_admitted` to `full_support`; failure of either stops the chain.
- [ ] Both products complete the same journey from scope confirmation to report at desktop and 360-pixel widths.
- [ ] Ready requires every assessment-level gate and positive evaluated coverage; empty findings cannot produce Ready.
- [ ] Blocked requires an exact admitted product/rule/fact match; edits that remove the decisive fact fail closed.
- [ ] Non-clearance obligations cannot create Blocked.
- [ ] Cost is decimal-safe and auditable or replaced by one exact named blocker; no ranges are invented.
- [ ] Every finding includes source, evidence, missing evidence, owner, ordered action, official destination, and rerun condition.
- [ ] Unit, contract, and complete-browser tests cover three outcomes for both products.

## 4. Admit and Add the Third Indoor IP-Camera Product

**Blocked by:** Ticket 3.  
**User stories covered:** Broader but still coherent electronics coverage through the same journey.

**What to build:** Evaluate the provisional indoor Wi-Fi/IP-camera scenario against the full admission contract. If it passes, independently admit it and expose it through the existing shared journey. If it cannot pass without ambiguity, document the evidence boundary, keep it out of the selector, and preserve the valid two-product release. Do not create product-specific screens or a second engine.

**Acceptance criteria:**
- [ ] Research produces one of two explicit results: independently admitted, or evidenced deferral with the failed gates named.
- [ ] If admitted, the camera has its own exact boundary, mapping, sources, rates, evidence, clearance effects, actions, three fixtures, and complete browser journeys.
- [ ] Cross-pack tests prevent inherited admission from router or headphones.
- [ ] If deferred, no camera choice, rules, rate, cost, or claim appears in the product.
- [ ] Existing router and headphones journeys remain green in either result.

## 5. Extract One Synthetic Pro-Forma-Invoice PDF

**Blocked by:** Ticket 4.  
**User stories covered:** Editable agent-assisted fact extraction and material follow-up questions.

**What to build:** Use the OpenAI Agents SDK to extract visible facts from one synthetic router PDF into the existing journey. Keep the schema product-neutral, require user confirmation before facts reach a pack, and do not claim extraction is verified for other products. The model cannot decide applicability, outcome, or arithmetic.

**Acceptance criteria:**
- [ ] Only synthetic PDF input is accepted; images, certificates, and multiple-document reconciliation are rejected with clear scope copy.
- [ ] Every extracted fact shows provenance/confidence, remains editable, and requires confirmation before assessment.
- [ ] Low-confidence facts require confirmation; questions are limited to facts that can change clearance, evidence, or cost.
- [ ] Uploaded bytes and derived facts are not durably stored or logged and responses use `no-store`.
- [ ] Recorded fixtures keep CI deterministic; a live OpenAI test is opt-in.
- [ ] The one router document feeds the shared engine without a parallel decision path; no other product's extraction is claimed as verified.

## 6. Add Fail-Closed Other Product Behavior

**Blocked by:** Ticket 5.  
**User stories covered:** Honest handling of unsupported products and professional handoff.

**What to build:** Add `Other product` outside the supported catalog. Preserve universal shipment facts, explain the coverage gap, return Needs verification unless an independently admitted universal Customs blocker applies, and render an on-screen broker-sharing summary.

**Acceptance criteria:**
- [ ] Other product never returns Ready or a guessed product-specific classification, rule, document, rate, or cost.
- [ ] The result names supported checks, unsupported checks, unresolved facts, and professional review needed.
- [ ] The broker summary is on screen; no dashboard, downloadable packet, or override workflow is added.
- [ ] An automated journey proves fail-closed behavior.

## 7. Verify and Ship the Public Submission

**Blocked by:** Ticket 6.  
**User stories covered:** Public, accessible, honest end-to-end review.

**What to build:** Complete accessibility, privacy, security-patch, build, official-link, deployment, demo-video, and summary gates using only admitted behavior.

**Acceptance criteria:**
- [ ] Unit, contract, type, lint, production-build, and browser suites pass from a clean install.
- [ ] At least two `full_support` products complete all three outcomes; the selector and submission text claim only the products that passed.
- [ ] The core journey completes by keyboard at desktop and 360-pixel widths with no serious or critical automated accessibility violations.
- [ ] No real identifiers, documents, credentials, or sensitive data exist in fixtures, logs, or deployment.
- [ ] Official URLs resolve, dates are visible, and mock/synthetic dependencies are clearly labelled.
- [ ] The public link requires no login and passes a production smoke test.
- [ ] The two-minute video and sub-250-word summary demonstrate the core promise without claiming architecture capacity or deferred coverage as working.

## Deferred

- Fourth product unless release gates are already green
- Products 5-10 and mixed-industry packs
- API Setu runtime integration without a verified relevant sandbox
- Supplier drafting, downloadable packets, broker dashboards, cost ranges, optional fees, image OCR, multi-document reconciliation, filings, payments, and approvals
