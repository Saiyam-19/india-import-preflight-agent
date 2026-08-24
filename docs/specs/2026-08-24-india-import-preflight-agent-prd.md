# India Import Preflight Agent PRD

Status: Adversarially approved multi-product scope  
Date: 24 August 2026  
Primary deadline: 28 August 2026, 8:00 PM IST

## Core Promise

> Before I place this order, can this shipment clear Indian customs, what is missing, what will it cost, and what must I do next?

The prototype solves this one problem across a small catalog. It does not become ten separate products or ten separate workflows.

## Problem Statement

An Indian MSME importer often commits money before knowing whether a proposed shipment is correctly classified, legally importable, supported by the evidence Customs or an allied authority requires at clearance, or financially viable after duties. The answer is fragmented across tariff schedules, DGFT policy, Customs guidance, regulator instruments, certificates, and public-service websites.

The supplied research documents are useful leads but are incomplete, can become stale, and are not legal authority.

## Scope Decision

The submission is an electronics-import preflight agent with:

- 2 independently admitted product scenarios required for release;
- 3 scenarios targeted;
- 4 scenarios as an absolute deadline cap;
- runtime architecture capped at 10 packs;
- one `Other product` fail-closed path for everything else.

The provisional admission order is:

1. New retail consumer Wi-Fi router, currently bounded to 2.4/5 GHz, external AC adapter, no battery/cellular/satellite, for resale.
2. New retail over-ear Bluetooth headphones, provisionally bounded to Bluetooth-only radio, integrated rechargeable battery, no Wi-Fi/cellular/satellite, for resale.
3. New retail indoor Wi-Fi/IP security camera, provisionally bounded to 2.4/5 GHz Wi-Fi, external DC power, no battery/cellular, for resale.

Each admission ticket must confirm or narrow its exact boundary from primary official sources. No candidate appears as supported merely because its evidence pack passes source admission. A fourth product is not planned into the critical path.

## Solution

The importer selects a `full_support` product, enters shipment facts manually, and may later extract editable facts from one synthetic router pro-forma-invoice PDF. A deterministic engine returns exactly one outcome:

- `Ready within the checked scope`
- `Blocked`
- `Needs verification`

The report explains whether the exact scenario appears able to clear within the checked scope, what facts or evidence are missing, the supported import-duty estimate or exact calculation blocker, why the result was reached, and ordered next actions with owners and verified official destinations.

`Other product` preserves universal shipment facts, states the coverage gap, and returns Needs verification unless a separately admitted universal Customs blocker applies. It cannot return Ready or a guessed product-specific cost.

## User Stories

1. As an importer, I want to choose from multiple `full_support` electronics scenarios, so that the product is useful beyond one SKU.
2. As an importer, I want unsupported and source-only products clearly separated from `full_support` products, so that dropdown coverage is not misleading.
3. As an importer, I want to enter product, supplier, origin, value, freight, insurance, quantity, Incoterm, and destination facts before placing an order.
4. As an importer, I want up to three bounded HS candidates with evidence, confidence, distinguishing facts, and provenance.
5. As an importer, I want low or materially conflicting classification confidence to force Needs verification.
6. As an importer, I want only officially evidenced clearance conditions to create Blocked.
7. As an importer, I want one clear outcome with checked scope and exclusions visible.
8. As an importer, I want Ready to require an admitted selected pack, current sources/rates, complete mandatory facts/evidence, acceptable classification, complete supported cost, positive evaluated coverage, and no unresolved findings.
9. As an importer, I want every blocker tied to an official rule, its clearance effect, my evidence, and the exact missing evidence.
10. As an importer, I want assessable value, BCD, SWS, IGST, and any supported cess or trade remedy shown line by line.
11. As an importer, I want actions ordered by prerequisite, assigned to an owner, linked to the official service, and paired with a rerun condition.
12. As an importer, I want to upload one synthetic pro-forma-invoice PDF and correct extracted facts.
13. As an importer, I want only follow-up questions that can change clearance, missing evidence, or cost.
14. As an importer with another product, I want a safe coverage-gap result and broker-sharing summary instead of guessed advice.
15. As a reviewer, I want every synthetic fact, source date, and unavailable integration clearly labelled.
16. As a mobile or keyboard user, I want to complete the core journey accessibly.

## Admission and Decision Rules

- Each product pack progresses through explicit states:
  1. `candidate`: research or evidence is incomplete; non-selectable and unable to produce runtime legal results or numeric statutory cost;
  2. `source_admitted`: boundary, mappings, sources, rules, rates, actions, and three fixtures pass independent contract review, but the pack remains non-selectable and runtime-disabled; and
  3. `full_support`: the shared engine and all three complete browser journeys pass for that pack, making it eligible for the public supported selector.
- Each product pack independently declares its exact scenario, exclusions, required facts, evidence, admitted HS mapping, rules, rates, official sources, clearance effects, actions, and three outcome fixtures.
- Shared rule modules are allowed only through explicit product-pack applicability declarations and tests.
- Before a pack reaches `full_support`, it cannot appear as publicly supported or return a public Ready, Blocked, or numeric statutory cost. A restricted test harness may evaluate `source_admitted` fixtures solely to decide promotion.
- `Blocked` requires an active deterministic finding whose admitted rule has `clearanceEffect` equal to `prevents_clearance` or `conditions_clearance`, supported by an official URL and pinpoint locator proving that effect.
- `Ready within the checked scope` requires:
  1. the selected product pack is `full_support`;
  2. the assessment date falls within official effect dates and before the internal `reviewAfter` date;
  3. all mandatory facts and evidence are user-confirmed;
  4. a high-confidence deterministic `admitted_mapping` matches every distinguishing fact that can change a rule or rate;
  5. supported statutory cost is complete;
  6. no Blocked or Needs verification finding exists; and
  7. at least one positive coverage finding proves evaluation occurred.
- Any failed readiness gate returns Needs verification unless an independently admitted clearance blocker requires Blocked.
- Environmental, consumer, transport, EPR, labelling, post-import, or business obligations cannot be described as Customs blockers without pinpoint official proof of clearance effect.

## Agent, Cost, and Data Boundaries

- OpenAI may extract visible facts from one synthetic router pro-forma-invoice PDF, normalize fields, propose at most three HS candidates, and formulate material questions.
- Model suggestions have `model_suggestion` provenance and cannot control rules, rates, outcome, or arithmetic.
- Extracted facts remain editable and require user confirmation before they reach any product pack; low-confidence facts are highlighted. The schema is product-neutral, but extraction is verified only for the one router document and is not claimed for every admitted product.
- Decimal-safe deterministic code calculates assessable value, BCD, SWS, IGST, and any admitted cess or trade remedy from entered value, freight, and insurance.
- No ranges, inland transport, warehousing, broker fees, or unsupported commercial costs.
- No login or durable case storage. Uploads and derived data are temporary and excluded from logs.
- API Setu runtime work remains deferred unless a directly relevant documented and permitted sandbox is verified without delaying the core journey.

## Testing Decisions

- Contract tests reject source admission for any pack missing its scenario boundary, independent admitted mapping, current official sources, effect/freshness dates, pinpoint clearance evidence, rates, required evidence, actions, or three fixtures.
- Cross-pack tests prove one pack cannot inherit another pack's admission, mapping, rates, or decision.
- Readiness tests prove partial coverage, stale evidence, missing facts, classification uncertainty, incomplete cost, unresolved findings, and empty findings prevent Ready.
- Blocker tests prove a non-clearance obligation cannot create Blocked.
- Complete browser journeys cover every `full_support` product at desktop and 360-pixel widths; the release floor is two products.
- Recorded extraction fixtures keep CI deterministic; a live OpenAI test is opt-in.
- Release checks cover accessibility, privacy, official-link validity, production build, and public deployment.

## Out of Scope

- Mixed-industry submission packs.
- More than 4 `full_support` products before the deadline or any claim that architecture capacity equals working coverage.
- Any variant outside an admitted scenario boundary.
- JPG/PNG extraction, multiple documents, certificate extraction, or contradiction reconciliation.
- Supplier-message drafting, downloadable packets, broker workspaces, professional overrides, accounts, or durable cases.
- Cost ranges, inland transport, warehousing, broker fees, or unsupported commercial costs.
- Live Customs/regulator login, filing, payment, licence issuance, status, or approval.
- Legally final classification or guaranteed clearance.
- FSSAI, CDSCO, quarantine, chemicals, automotive, solar, drones/SCOMET, textiles, agriculture, exports, or universal ITC-HS coverage.

## Delivery Rule

Exactly one Plane ticket is implemented per Codex task. Each additional product pack receives its own ticket and task. A completed task creates exactly one next implementation task. Failure to admit either of the two release-floor products stops the chain. The optional third-product ticket instead completes with either an admitted pack or an evidenced deferral that keeps the product out of the selector. Selector count is never increased by weakening evidence gates.

References checked on 24 August 2026:

- [Build What Moves India builder brief](https://buildwhatmovesindia.com/brief)
- [Build What Moves India FAQ](https://buildwhatmovesindia.com/faq)
- [OpenAI Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/)
- [API Setu overview](https://docs.apisetu.gov.in/document-central/explore-apisetu/Overview.html)
- [API Setu sandbox](https://docs.apisetu.gov.in/document-central/explore-apisetu/Sandbox.html)
