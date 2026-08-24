# BWMI-13 — Synthetic Router Pro-Forma-Invoice PDF Verification

Date: 24 August 2026  
Ticket: BWMI-13 — Extract one synthetic router pro-forma-invoice PDF  
Status: Verified locally

## Delivered Boundary

- Added `@openai/agents` 0.17.0 and a strict product-neutral Zod extraction schema.
- Added one deterministic, single-page synthetic router pro-forma-invoice PDF fixture, generated with invariant metadata.
- Pinned the only admitted PDF by exact filename and SHA-256:
  `31b92e2ff232113b1beef3d9d52aa31abb32cb89d3d1155d5e54de5b470372be`.
- Added an in-memory `/api/extract` route. Upload bytes and derived facts are not written or logged.
- Disabled Agents SDK tracing, excluded sensitive trace data, and set the OpenAI Responses request to `store: false`.
- Added `Cache-Control: no-store`, `Pragma: no-cache`, and `Expires: 0` to success and error responses.
- Added the router-only review panel to the existing shared journey. All 13 facts remain editable and show visible-text page/row provenance plus confidence.
- Editing a fact clears its confirmation. No mapped fact reaches the assessment form until every fact is explicitly confirmed.
- The agent schema and prompt cannot return product-pack choice, HS code, legal applicability, evidence status, outcome, rate, duty, or arithmetic.
- Images, certificate-named PDFs, other PDFs, and multiple documents are rejected clearly.
- Bluetooth headphones and indoor camera explicitly remain manual-entry only; no document-extraction coverage is claimed for them.

## Deterministic and Live Paths

- CI and the default fixture journey use the recorded extraction for the hash-pinned PDF.
- The live OpenAI Agents SDK route is server-opted-in with `BWMI_LIVE_OPENAI_EXTRACTION=1` and requires `OPENAI_API_KEY`.
- The live test is separately opt-in:
  `RUN_LIVE_OPENAI_EXTRACTION=1 pnpm test:live-extraction`.
- The normal test suite skips that live network test, so CI remains deterministic.

## Verification Evidence

- PDF QA: one A4 page, 3,976 bytes, fixed 1 January 2000 metadata, no encryption, form, JavaScript, or extra pages; rendered and visually inspected at high resolution.
- Focused extraction/schema/privacy: 9/9 passed.
- Full Vitest: 42/42 deterministic tests passed; 1 live OpenAI test skipped by design.
- Strict TypeScript: passed.
- ESLint: passed.
- Next.js 16.3 production build: passed; `/api/extract` is dynamic.
- Full Playwright matrix: 24/24 passed across desktop and 360px mobile.
- New browser journey proves image rejection, editability, confirmation reset on edit, all-fact gate, mapped form population, deterministic engine evaluation, Ready outcome, and ₹43,960.00 total duties.
- Axe checks and horizontal-overflow checks passed after extraction on both viewports.
- Production API smoke: admitted fixture returned 200 with 13 facts and no-store headers; image returned 415 with the same privacy headers.
- Production rendered journey: focused extraction-to-Ready browser flow passed 2/2 on desktop and 360px mobile.
- Codebase graph coverage recorded no known gaps for all operated-on source and test paths; graph trace connects the extraction route to the service and live Agents SDK function.

## Resource Audit

- Existing compatible servers were checked before each browser/build phase.
- Temporary Playwright servers exited after their test runs.
- Agent-owned production servers were PID 58711 and PID 59926, both bound only to `127.0.0.1:3210` in this project directory.
- Both production PIDs received SIGTERM, exited with code 143, did not respawn, and left port 3210 clear.
- No user-owned, product-owned, or unrelated process was terminated.

## Explicit Non-Claims

- No BWMI-14 or Other-product behavior.
- No second document, image/camera capture, certificate extraction, or multi-document reconciliation.
- No accounts, persistence, downloadable packet, legal decision, government integration, filing, or adjacent ticket.
- No extraction-coverage claim for headphones, camera, or any product other than the one hash-pinned synthetic router PDF.
