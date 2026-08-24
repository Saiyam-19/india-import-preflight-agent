# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Next.js 16.3 App Router, React, strict TypeScript, OpenAI Agents SDK for TypeScript, Zod, deterministic TypeScript compliance and cost engines, versioned product rule packs, Vitest, Playwright, and Vercel. The runtime catalog is capped at 10 product packs. API Setu integration is omitted unless a directly relevant, documented, permitted sandbox is verified.

## Users
The primary user is an Indian MSME importer or procurement decision-maker evaluating a shipment before issuing a purchase order, paying a supplier, or dispatching goods. A licensed Customs Broker is the expert reviewer and handoff recipient, not a second primary workflow.

## Product Purpose
Before an Indian importer places an overseas order, answer: can this shipment clear Indian customs, what is missing, what will it cost, why is it blocked, how can the blocker be resolved, and what must happen next?

## Positioning
An independent electronics-import pre-flight decision-support agent. It turns fragmented product, shipment, document, tariff, and regulator requirements into an evidence-backed decision and an actionable handoff. It is not an official government service, legal advice, a Customs Broker, a filing tool, or a guarantee of clearance.

## Submission Catalog Strategy
- One industry: connected consumer electronics imports into India.
- Multi-product release floor: 2 independently admitted product scenarios.
- Target: 3 independently admitted scenarios, achieved through independent full-support promotion.
- Hard deadline cap: 4 scenarios; do not weaken admission standards to reach the cap.
- Architecture cap: 10 packs, but capacity is not claimed as working coverage.
- Admitted release catalog: Wi-Fi router, Bluetooth headphones, and indoor Wi-Fi/IP security camera. A fourth product remains deferred to separate work; this release does not add one.
- Only `full_support` products appear as supported selector choices. Every candidate, source-only, or unknown product uses one fail-closed `Other product` path.

Each selectable product is an exact legal scenario, not a broad commercial family. Its pack records form factor, radio capabilities, power/battery configuration, condition, intended use, packaging/resale status, material origin assumptions, and explicit exclusions. Research may narrow a provisional scenario but may not widen it to save admission.

## Capabilities and Constraints
- One shared journey: choose a `full_support` product, enter shipment facts manually, optionally extract one synthetic router pro-forma-invoice PDF, answer only material questions, and receive a report.
- A product progresses through `candidate`, `source_admitted`, and `full_support`. Source admission proves the independent evidence pack but keeps it non-selectable and unable to produce public runtime legal results. Full support additionally requires the shared engine and all three complete browser journeys to pass.
- Shared rules may be reused only when each product pack explicitly declares and tests exact applicability. Similarity to another electronics product is not evidence.
- Return at most three HS candidates with evidence, confidence, and provenance; never claim a legally final classification. Only a deterministic admitted mapping whose distinguishing facts match the exact scenario may control rules, rates, or Ready.
- Return exactly one top-level outcome: `Ready within the checked scope`, `Blocked`, or `Needs verification`.
- Ready requires the selected pack to be admitted, sources and rates current, mandatory facts and evidence complete, HS mapping acceptable, supported cost complete, positive evaluated coverage present, and no blocking or unresolved findings. Empty findings never produce Ready.
- Only an obligation whose official source and pinpoint clause, paragraph, page, or schedule entry proves that it prevents or conditions import clearance may create Blocked.
- Estimate assessable value, BCD, SWS, IGST, applicable cess and supported trade remedies, plus entered freight and insurance. Do not estimate inland transport, warehousing, broker fees, or unsupported ranges.
- If a required input or supported rate is missing, name exactly what prevents the calculation.
- Explain every blocker with source, evidence, missing evidence, ordered resolution steps, owner, required documents, rerun condition, and exact verified official destination.
- Provide a concise on-screen summary to share with a Customs Broker; do not build a broker workspace or downloadable packet.
- The language model may extract one verified synthetic router invoice, normalize, ask questions, propose HS candidates, and explain. The extraction schema is product-neutral, but the submission does not claim document extraction is verified for every supported product. User confirmation is required before extracted facts reach a product pack. Deterministic code owns applicability, outcome aggregation, and arithmetic.
- No login or durable account. Session data is temporary.
- No government login, filing, payment, licence issuance, approval claim, private API, or restricted-data scraping.

## Brand Commitments
Trust comes from visible evidence, uncertainty, dates, assumptions, and honest mock labels—not official-looking branding. Product status and next action must remain clearer than decoration.

## Evidence on Hand
- The Build What Moves India brief and FAQ, checked on 24 August 2026.
- `docs/prototype-coverage-manifest.md` as the scope boundary.
- `research/indoor-wifi-ip-camera-product-pack-primary-sources-2026-08-24.md` as the independently admitted third-product record.
- `research/importer-vs-customs-broker-persona-2026.md` as persona research.
- `research/high-friction-exim-product-families-2026.md` and `research/india-non-fuel-trade-sector-options-2026.md` as option research.
- The supplied strategy and compliance-research DOCX files as starting references only. Their claims are not runtime authority and require primary-source verification.

## Product Principles
1. Solve one problem across a small admitted catalog; product count is not a feature by itself.
2. Decide before the order, not after the shipment is stuck.
3. Evidence before confidence; uncertainty before invention.
4. Every blocker leads to an owner and next action.
5. A product earns selector visibility only at `full_support`; candidate or source-only coverage is never implied.
6. Professional review is a designed handoff, not a second workflow.
7. Every demoed capability works end to end and every mock is named.

## Accessibility & Inclusion
Meet WCAG 2.2 AA for the core journey. Use plain English with trade terms explained in context, semantic form controls, keyboard-complete interaction, visible focus, 44-by-44-pixel minimum targets, error summaries, non-colour status cues, reduced-motion support, and responsive layouts for 360-pixel mobile screens.
