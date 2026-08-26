# BWMI-22 arbitrary-product compliance agent verification

Date: 2026-08-25  
Plane state: In Progress  
Completion state: blocked on the configured real provider browser gate

## Outcome under verification

An India-China user can ask a natural shipment question without creating or selecting a Trade Case. The application persists confirmed shipment facts behind the conversation and uses one Agents SDK compliance agent plus explicit server tools to research an arbitrary product, plan missing facts, admit official evidence, retrieve scoped regulatory requirements, calculate charges deterministically when inputs and admitted rates are sufficient, and synthesize a cited readiness result.

## Implemented boundary

- The primary chat path has one compliance agent and no product selector or canned primary answer.
- Direction and product facts are extracted and persisted from natural language. Corrections are versioned; contradictions stop the assessment until the user resolves them.
- Product research, classification candidates, agencies, controls, documents, document review, border charges, evidence admission, and readiness are explicit tools.
- Compliance findings are rendered only when their claim ID, admitted official source, exact locator, product scope, direction scope, and citation validate together.
- Search results and model prose cannot directly establish a factual compliance claim.
- The generic arbitrary-product research path cannot return `Ready within verified scope`: it lacks the server-owned Coverage Manifest and evidence-gated Working Classification required for that conclusion. Clearance is never guaranteed.
- Missing API configuration is shown as AI unavailable; the no-key path keeps only supported fact intake or bundled reference information.
- Provider selection is server-only and fail closed: OpenRouter `stealth/ox-alpha` uses Agents SDK Chat Completions plus bounded function-based web search, while official OpenAI `gpt-5.6-sol` uses Responses and hosted search. Endpoint, model and provider-specific key must match the allowlist; document vision uses the same resolved provider.
- Model prose is not rendered or persisted. The model returns only strict IDs for results created by tools; the server derives the displayed product, findings, calculations, claims, risks and actions.
- Confirmed facts and memory are read through an explicit tool as untrusted data and are never interpolated into the trusted system instructions.
- The older deterministic `/api/assessments` endpoint rejects products outside its explicit admitted router profiles with HTTP 409 and directs arbitrary products to `/api/chat`.

## Verified gates

- Permanent two-turn China-to-India Bluetooth-headphones direction regression.
- Table-driven arbitrary-electronics variation and cross-product leakage rejection.
- Deterministic India border-charge arithmetic and mismatched-rate withholding.
- Contradiction detection, correction history, general questions, ambiguous input, document isolation, stale/conflicting evidence, and two-conversation isolation.
- A real Agents SDK `Runner` test with an injected `ModelProvider` exercised fifteen ordered generic tool calls over multiple turns, including injected hosted-search transports, an evidence-admission attempt and scoped claim retrieval. It verifies persistent session/fact/memory updates, server-owned synthesis, admitted-citation resolution, rate withholding, semantic claim-kind rejection, unsupported prose rejection and invented-claim rejection. This is an orchestration integration test, not the live-provider gate.
- A runtime-supplied unseen-product harness passed with `infrared photoacoustic gas-sensing daughterboard`; no application or fixture change was made for that product.
- Focused suite: 133 passed, 2 live tests skipped.
- Full suite: 169 passed, 2 live tests skipped.
- TypeScript typecheck and ESLint passed.
- Production build passed.
- Official-link verification passed for all resolved links; access-controlled official endpoints stayed labelled as such.
- Production dependency audit and privacy scan passed.
- Real Playwright production-browser suite passed 5 no-key tests at desktop and 360 px, with 7 project-inapplicable/live tests skipped. It verified the immediately usable composer, explicit `.env.local` configuration request, limited-function disclosure, persistent conversation facts, document upload, keyboard/accessibility and horizontal overflow.
- The optimized production server started without a key on `127.0.0.1:3210` and was stopped after the browser gate; port 3210 had no remaining listener. No pre-existing process was terminated.
- TypeScript, ESLint, production build, privacy scan, official-link verification and production dependency audit passed.

## Open acceptance gate

Neither the task process environment nor the framework-loaded local environment has `OPENROUTER_API_KEY` or `OPENAI_API_KEY`, and no provider base URL or model is configured. Only presence/non-empty status was inspected; no credential value was read, echoed, logged or persisted. Therefore the configured real Agents SDK black-box browser journey for a genuinely unseen product is deliberately skipped. A fake key and the injected-provider orchestration test are not evidence of live-provider behavior. The primary runtime now allowlists OpenRouter `stealth/ox-alpha` over Chat Completions and official OpenAI `gpt-5.6-sol` over Responses, with no cross-provider key or model fallback. Follow `docs/setup/local-ai.md` without sharing the credential, supply the black-box product through `BWMI_BLACK_BOX_PRODUCT`, and run the named Playwright gate. BWMI-22 remains In Progress until that journey passes without product-specific code or fixture changes.
