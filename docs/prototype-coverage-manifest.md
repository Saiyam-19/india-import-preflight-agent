# Import Preflight Agent: Prototype Coverage Manifest

Last updated: 24 August 2026  
Status: Verified three-product full-support boundary, one synthetic router PDF extraction, and fail-closed `Other product`

## Core Promise

> Before I place this order, can this shipment clear Indian customs, what is missing, what will it cost, and what must I do next?

The primary user is an Indian MSME importer or procurement decision-maker. A licensed Customs Broker is the professional escalation recipient, not a second workflow. The agent provides pre-flight decision support, not approval, legal advice, filing, payment, or guaranteed clearance.

## Catalog Contract

- Sector: connected consumer electronics imports.
- Release floor: 2 `full_support` product scenarios.
- Target: 3, achieved.
- Deadline hard cap: 4.
- Runtime architecture cap: 10.
- Only `full_support` packs are selectable as supported products.
- Everything else uses `Other product` and fails closed.

Architecture capacity is never described as current coverage.

## Admission Queue

### 1. Wi-Fi router

New, finished, retail-packaged consumer router; 2.4/5 GHz only; external AC adapter; no battery, cellular, or satellite; imported for resale; excludes used/refurbished goods, enterprise chassis, components, and bundles.

Status: `full_support`, selectable through the shared public journey.

### 2. Bluetooth headphones

New, finished, single-model retail-packaged over-ear headphones whose left/right sound channels are joined by a headband; Bluetooth-only 2400–2483.5 MHz radio; integrated microphone and one exact-model rechargeable lithium-ion battery; passive USB charging cable only; ordinary foreign import for resale, not SEZ-to-DTA clearance or manufacturing inputs; excludes TWS/earbuds/in-ear/neckbands, any wired audio input, hearing devices, other radios, removable/separately supplied batteries, charging cases, chargers, power banks, components, bundles, and used/refurbished goods.

Status: `full_support`, selectable through the shared public journey. Admitted mapping: `85183019` for this exact boundary only.

### 3. Indoor Wi-Fi/IP security camera

New, finished, single-model retail-packaged indoor IP security camera; 2.4/5 GHz Wi-Fi only; one dedicated external DC adapter; no battery, Ethernet/PoE, integrated recorder, cellular, 6 GHz or other radio; imported for resale; excludes analog CCTV, webcams, still cameras, dashcams, DVR/NVR and multi-camera bundles, modules/components, outdoor/industrial/special-subheading cameras, separate adapters, and used/refurbished or ambiguous sets.

Status: `full_support`, selectable through the shared public journey. Admitted mapping: `85258900` for this exact boundary only.

All three boundaries passed independent source admission, deterministic Ready/Blocked/Needs verification fixtures, cross-pack isolation, and complete desktop and 360-pixel browser journeys before promotion to `full_support`. A `candidate` or `source_admitted` pack still cannot produce a public legal result or public numeric statutory cost.

### Other product fallback

Everything outside those three independently admitted scenarios uses `Other product`, which is not a product pack and does not expand the supported catalog. It preserves product description, model, manufacturer, supplier, origin, parties, quantity, Incoterm, destination, and entered commercial facts for an on-screen Customs Broker handoff. It returns `Needs verification` in this release because no independently admitted universal Customs blocker exists, and it withholds product-specific classification, rules, required documents, rates, and cost.

## Pack Lifecycle

- `candidate`: research or required evidence is incomplete. The pack is non-selectable and runtime-disabled.
- `source_admitted`: exact boundary, mappings, sources, rules, rates, actions, and Ready/Blocked/Needs verification fixtures pass independent contract review. The pack remains non-selectable and cannot produce public runtime legal results.
- `full_support`: the source-admitted pack passes the shared deterministic engine and all three complete browser journeys. Only then may it appear in the supported selector.

A restricted test harness may evaluate source-admitted fixtures solely for promotion. It is disabled in production and is not a public eligibility bypass.

## Independent Product-Pack Standard

Every selectable pack must contain and pass:

1. Exact scenario boundary and exclusions.
2. Required product and shipment facts.
3. High-confidence deterministic admitted HS mapping with distinguishing facts.
4. Primary official sources with authority/instrument identifiers.
5. Official `effectiveFrom`, optional official `effectiveTo`, `lastCheckedAt`, and internal `reviewAfter` with rationale.
6. Exact applicability predicates, required evidence, and supported exemptions.
7. Clearance effect: `prevents_clearance`, `conditions_clearance`, or `non_clearance`.
8. For a clearance effect, an official URL and pinpoint clause, paragraph, page, or schedule entry proving it.
9. Versioned duty rates and valuation assumptions.
10. Ordered remediation with owner, prerequisites, required documents, verified destination, and rerun condition.
11. Reviewed Ready, Blocked, and Needs verification fixtures.
12. Source admission completes after items 1-11 pass. Full support additionally requires a complete browser journey for all three outcomes after the shared journey exists.

Shared rule modules may be referenced, but each pack must explicitly declare and test applicability. Another pack's admission is never evidence.

## Answer Contract

The agent returns exactly one top-level result:

- `Ready within the checked scope`
- `Blocked`
- `Needs verification`

Ready requires the selected pack to be admitted, current sources/rates, complete facts/evidence, an exact deterministic admitted mapping, complete supported cost, no unresolved findings, and positive evaluated coverage. Empty findings never mean Ready.

Blocked requires an admitted official rule that explicitly prevents or conditions import clearance, a pinpoint locator proving that effect, and an unmet condition in the shipment evidence.

Any other gap returns Needs verification.

## Cost and Actions

For an admitted scenario, the engine may calculate assessable value, BCD, SWS, IGST, admitted cess/trade remedies, and entered freight and insurance. Missing inputs or rates produce a named blocker, not a range. Inland transport, warehousing, broker fees, and other commercial costs are excluded.

Every blocker or verification gap includes reason, clearance effect, source and dates, used/missing evidence, ordered next action, owner, required document, official destination, prerequisites, and rerun condition.

## Agent Boundary

- Manual entry is primary.
- OpenAI Agents SDK extraction is limited to one recorded, hash-pinned synthetic router pro-forma-invoice PDF, with an opt-in live path.
- Extracted facts show provenance, remain editable, and require user confirmation before reaching any product pack.
- The schema is product-neutral, but the prototype claims extraction verification only for that one router document.
- The model may extract, normalize, propose bounded candidates, and ask material questions.
- Deterministic TypeScript owns applicability, outcome, and arithmetic.
- Images, certificates, additional PDFs, and multi-document extraction are rejected; headphones and camera remain manual-entry only.

## Explicitly Deferred

- A fourth product remains outside this release and requires a separate ticket even though the three-product suite is green.
- Products 5-10; the architecture cap is not a submission promise.
- Mixed-industry packs.
- API Setu runtime integration without a verified relevant sandbox.
- Broker workspaces, downloadable packets, supplier drafting, accounts, and durable cases.
- Cost ranges and unsupported commercial fees.
- JPG/PNG or multi-document intelligence.
- Live government integrations, filings, payments, and approvals.
- FSSAI, CDSCO, quarantine, chemicals, automotive, solar, drones/SCOMET, textiles, agriculture, exports, and universal tariff coverage.
