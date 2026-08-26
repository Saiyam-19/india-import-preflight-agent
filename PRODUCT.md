# Product
<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Next.js 16.3 App Router, React, strict TypeScript, OpenAI Agents SDK for TypeScript, Zod, versioned SQLite stores, Vitest, Playwright, and Vercel.

## Users
The primary user is an India- or China-side trade operator researching a bilateral shipment before committing to it. A licensed broker or jurisdiction-qualified professional remains the review and handoff recipient, not a second primary workflow.

## Product Purpose
For China-to-India and India-to-China trade, provide an immediately usable conversational assistant that answers only what admitted official evidence supports and makes every remaining evidence gap explicit. Each conversation automatically owns an isolated internal Trade Case once relevant facts become known. Direction-specific deterministic tools produce and preserve guarded bilateral assessments behind the chat.

## Positioning
An independent bilateral trade Research Guidance agent. It discovers India and China official sources, admits evidence through a secure validation boundary, and returns cited guidance or an explicit incomplete result. Inside the specifically displayed India-import Coverage Manifest, it can return an evidence-gated assessment state without claiming legal approval or clearance. It is not an official government service, legal advice, a broker, a filing tool, or a guarantee of clearance.

## Version-one Boundary
- Runtime jurisdictions are India and China only, in both directions.
- The China-origin router reference candidate combines admitted China foreign-trade, Customs, export-licence, dual-use and commodity-inspection legal controls with the verified India-import assessment. The exact current statutory-inspection catalogue row and case-specific restricted-party result remain manual gaps, while authenticated filing and licence portals remain visible login-required gaps.
- India-to-China covers exact India export facts, Schedule II and SCOMET screens, China import declaration and licence checks, separate India and China classifications, Chinese tariff and VAT formulas, CCC/MIIT product-market triggers, Chinese Authoritative Text with labelled English, case evidence, citations and immutable snapshots. Runtime authority results and uploaded case documents remain mandatory inputs; empty searches never satisfy them.
- UAE and United States coverage is deferred and must not appear as a supported runtime connector or complete-assessment path.
- Product questions are not limited to a selector catalog; missing or stale coverage enters fail-closed official-source research.

## Capabilities and Constraints
- The first screen is a familiar chat with an immediately usable composer and document attachment control. No case creation, naming, selection, or assessment form is required before asking any India-China trade question.
- Trade Cases remain internal isolation and memory objects. The assistant creates and scopes one automatically from the conversation, persists confirmed answers behind the chat, and asks one relevant missing-fact group at a time before invoking deterministic tools.
- Conversation history is the user-facing way to resume or separate work. Case facts, document evidence, calculations, checked/not-checked scope, and snapshots appear inline or in optional Conversation details and never block ordinary chat.
- The China-origin India-import reference journey derives its Applicable-Agency Checklist, Working Classification or Classification Candidates, decimal Border Charge Estimate, validated claim blocks, and one of four closed assessment states through explicit deterministic tools.
- The India-origin China-import reference journey derives a bilateral Coverage Manifest, separate eight-digit India and ten-digit China codes, Schedule II/SCOMET and China import/product-market findings, Chinese source-language provenance, a deterministic CNY duty/VAT formula, validated claim blocks, checked/not-checked scope and an immutable snapshot. It reaches complete within scope only when both countries' current public sources, exact authority results, minimum reviewed document evidence, screenings, facts and translations are complete.
- A complete-within-scope China-to-India result requires confirmed real product, manufacturing, party, end-user, end-use, route, value and date facts; complete China and India Coverage Manifest entries; current admitted sources and rates; exact claim locators; reviewed translation provenance; resolved list, catch-all, inspection and restricted-party screens; a resolved classification; available public connectors; and confirmed evidence status. The current reference candidate cannot reach that state because the exact GACC inspection row, authority-backed party result, and real transaction corpus are absent. Login-required transactions stay under Not checked and never imply filing or portal status.
- Multiple Trade Cases, confirmed case facts and correction history, messages, citations, document metadata, and tool references persist in separated local SQLite stores with explicit case-ID isolation.
- Users can attach content-sniffed PDF, PNG, or JPEG documents within bounded count, byte, page, dimension, pixel, parser-time, and model-time limits. Upload bytes are temporary and are not retained; encrypted, corrupt, unreadable, unsupported, mismatched, instruction-like, and over-limit inputs fail closed with an explicit state.
- Every extracted visible fact carries document, page, region, method, and extraction-confidence provenance and remains pending until the user confirms or corrects it. Confirmation never establishes authenticity, signature, seal, QR, certificate validity, filing, payment, shipment status, release, clearance, classification, rate, or compliance.
- Deleting a document removes its derived fact history from that Trade Case. Deleting a Trade Case removes its document metadata, versioned corrections, messages, assessments, and snapshots; consequential tools never borrow facts from another case.
- Each assessment is stored as an append-only immutable Assessment Snapshot containing the case facts, tool outputs, manifest state, source versions, claims, calculation, checked/not-checked scope, exclusions, blockers, and preparation steps.
- Hosted web search is official-source discovery only. Search text and model output are never evidence.
- A factual claim is released only after secure retrieval and evidence admission validate immutable bytes, identity, currentness, conflict state, applicability, translation state, source ID, and exact locator.
- Stale, conflicting, inaccessible, unsupported, untranslated, scope-mismatched, or otherwise unadmitted material remains a visible gap and cannot support a positive conclusion.
- The model is pinned to `gpt-5.6-sol` with high reasoning for live legal-domain research; deterministic server checks own evidence admission and claim release.
- No government login, filing, payment, licence issuance, approval claim, private API, or restricted-data scraping.
- Authenticated authority or carrier verification, current eSanchit metadata, and final privacy/legal review remain unavailable integrations and visible gaps.

## Brand Commitments
Trust comes from visible evidence, uncertainty, dates, assumptions, and honest mock labels—not official-looking branding. Product status and next action must remain clearer than decoration.

## Evidence on Hand
- The Build What Moves India brief and FAQ, checked on 24 August 2026.
- `CONTEXT.md`, ADR 0001–0014, and the 2026-08-25 shared-understanding specification and adversarial review define the runtime boundary.
- Pinned DGFT, MOFCOM, GACC and PRC legal/list snapshots provide deterministic admission and citation tests; discovery results remain untrusted until admission. The complete 2026 MOFCOM ordinary export-licence catalogue is pinned and contains no `8517623690` or heading `8517` row, but that exact negative does not cure the separate inspection and party-screening gaps.

## Current Verification Boundary

The reusable arbitrary-product pipeline, deterministic gates, no-key behavior, and desktop/360-pixel browser journey are locally verified. The configured real Agents SDK black-box browser journey remains pending because neither allowlisted provider is configured in the task environment. OpenRouter requires `OPENROUTER_API_KEY`, `BWMI_OPENAI_BASE_URL=https://openrouter.ai/api/v1`, and `BWMI_OPENAI_MODEL=stealth/ox-alpha`; official OpenAI remains an alternative. This is not a completed shipment-readiness acceptance result; Plane remains In Progress until that live unseen-product gate passes.

## Product Principles
1. Keep India-China bilateral scope explicit; jurisdiction count is not a feature by itself.
2. Research before the trade commitment, not after the shipment is stuck.
3. Evidence before confidence; uncertainty before invention.
4. Every evidence gap remains visible and blocks broader factual claims.
5. Search discovery, model output, and unavailable records never become evidence by implication.
6. Professional review is a designed handoff, not a second workflow.
7. Every factual claim carries an admitted source ID and exact locator.

## Accessibility & Inclusion
Meet WCAG 2.2 AA for the core journey. Use plain English with trade terms explained in context, semantic form controls, keyboard-complete interaction, visible focus, 44-by-44-pixel minimum targets, error summaries, non-colour status cues, reduced-motion support, and responsive layouts for 360-pixel mobile screens.
