# ADR 0015: Use one reusable compliance agent for arbitrary products

Date: 2026-08-25  
Status: Accepted

## Context

The primary experience must turn an ordinary India-China shipment question into an evidence-backed readiness assessment. A fixed product catalogue, prewritten product answer, or token-only router cannot satisfy that outcome. The product may be an electronics item that the implementation has never seen before.

Compliance facts also have a higher trust requirement than ordinary chat. Search results and model prose can help discover and reason, but neither may become a rendered legal or regulatory claim unless the server has admitted the supporting official evidence and validated the exact claim and locator.

## Decision

The compliance path uses exactly one focused OpenAI Agents SDK agent. The agent chooses among explicit tools for:

- confirmed-fact persistence and correction handling;
- product and specification research;
- classification candidates with uncertainty;
- official India and China source discovery and evidence admission;
- scoped agency, control, and document retrieval;
- uploaded-document review;
- deterministic border-charge calculation; and
- deterministic shipment-readiness gating.

The agent is product-agnostic. It starts from the product words and facts in the conversation, records research that is scoped to that product, asks only the next material missing fact group, and may not borrow product-specific rules, classifications, rates, documents, or citations from another profile or conversation.

The model owns reasoning and tool choice. Server code owns arithmetic, evidence admission, claim-to-citation validation, product and case isolation, correction conflicts, renderable prose, and the positive-readiness gate. Search text and model prose are not evidence. Confirmed facts and memory reach the model only through a tool that labels the values untrusted; they are not interpolated into system instructions. If current official evidence is missing, stale, conflicting, inaccessible, untranslated, or outside the active product and direction scope, the result stays incomplete and explains what was checked and what must happen next.

General India-China questions may use the same agent without manufacturing a shipment assessment. If the API key or the pinned model is unavailable, the interface labels AI unavailable and exposes only saved facts or bundled claims that the server can actually support.

## Consequences

- Product coverage expands through research and admitted evidence rather than code fixtures.
- A new product can still receive a substantial incomplete result without fabricated completeness.
- The generic public-research pipeline cannot issue a positive `Ready within verified scope` state until a separate server-owned Coverage Manifest and evidence-gated Working Classification exist for the exact scope.
- The assistant never guarantees Customs clearance.
- Live black-box acceptance requires a configured real model path; offline fixtures and no-key browser checks cannot substitute for that gate.
