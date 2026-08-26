# BWMI-19 real document intake and isolated multi-case memory verification

**Date:** 2026-08-25  
**Runtime scope:** India-China bilateral Trade Cases only; one focused Research Guidance agent  
**Work item:** BWMI-19 — Add real document intake and isolated multi-case memory

## Reconciled predecessor boundary

- The generated worktree and `/Users/saiyamchaplot/.codex/worktrees/7d2a/Hackathon BWMI` were inspected before editing. Both resolved to detached commit `d0035790f9fa5fe129041152097432d96fc03c8d` and the same GitHub origin.
- A dry-run comparison preceded import. The predecessor's tracked modifications and intentional untracked source/evidence/specification files were copied into this worktree without writing to either source tree. Runtime data, dependency stores, build output and test results were excluded.
- The obsolete `/api/preflight` and promotion-harness routes remained deleted. BWMI-18's not-yet-effective source/rate gates, rate-derived display formulas, possible-trade-remedy `Action Required` state, snapshot execution provenance and agency-level exact-locator claims remain present and pass the full regression suite.
- The candidate research artifact was preserved byte-for-byte at SHA-256 `2448d156ef140ecb1db136790e828b84bd2133cf42d613f1416172a55fbbe46f`. It admitted no regulatory source and no source registry entry changed in BWMI-19.

## Implemented document-trust boundary

- Production accepts 1–3 real content-sniffed PDF, PNG or JPEG attachments. Per-file limits are 8 MiB, 20 PDF pages, 12,000 pixels per edge and 24,000,000 image pixels; the full multipart stream is bounded before parsing. PDF parsing has a ten-second deadline. Private vision extraction is one turn with a 45-second model/run timeout.
- Declared MIME type, extension and detected bytes must agree. Empty, unsupported, mismatched, encrypted, corrupt, unreadable and over-limit inputs return explicit non-success states without retaining upload bytes or derived facts.
- Text PDFs are parsed locally. Images and scanned PDFs use the private vision extractor only when configured; without it they return the explicit `unreadable` state. The hosted model was unavailable in this verification environment, so the live rendered proof uses a neutral locally generated text-PDF parser fixture and the image route is verified to fail closed.
- Document content is untrusted. Instruction-like text is quarantined before any fact enters memory; the model instruction independently prohibits following attachment instructions and prohibits authenticity, legal, classification, rate, cost or shipment conclusions.
- Only visibly printed supported fields are candidates. Each candidate stores the immutable document-fact ID and version plus 1-based page, region and unit, extraction method and extraction confidence. Database triggers reject direct updates to document-fact and confirmed-fact versions while allowing the explicit deletion/retention cascade.
- Candidate facts remain `pending` and absent from `confirmed_facts` until an explicit case-scoped confirm or correction request appends a new version. Confidence is labelled as extraction quality only, never truth, authenticity, validity or authority acceptance.

## Persistent isolated memory and retention

- Users can create and switch persistent China-to-India and India-to-China Trade Cases. Case creation prepends a new case without replacing prior cases.
- Confirmed ordinary facts, document candidates, confirmations and corrections use immutable version histories with a current case-scoped projection.
- Every read, write, document review, source reference, tool reference, message, assessment and snapshot requires an explicit Trade Case ID. A fact ID from another case is rejected; the assessment form only prefills from the selected case.
- Upload bytes are not stored. Document metadata and derived fact versions remain until the user deletes the document or Trade Case. Document deletion removes only that document and recomputes the affected current fact projection from remaining history. Trade Case deletion cascades its messages, session items, source/tool references, document metadata, fact histories and assessment snapshots without touching another case.
- Authenticated authority/carrier verification, current eSanchit metadata and final privacy/legal review remain explicit unavailable integrations or gaps. An upload never establishes authenticity, signature, seal, QR, certificate validity, filing, payment, shipment status, release or clearance.

## Responsive attachment review

- The existing Evidence Ledger interface now exposes persistent new-case actions, the active case count, bounded multi-file intake, processing authorisation, per-file states, document retention, pending/confirmed/corrected fact review, correction inputs, page/region/method/confidence provenance, version history and two-step document/Trade Case deletion.
- Native labels, regions, headings, details, inputs, checkboxes and buttons preserve keyboard semantics. Interactive targets are at least 44 pixels, focus remains visible, state is expressed in text as well as color and reduced-motion behavior remains unchanged.
- The 360-pixel layout collapses upload actions, provenance rows, fact actions and destructive confirmations to a single column. The final browser gate found no horizontal document overflow and no Axe WCAG 2 A/AA or 2.1 A/AA violations.
- Focused desktop and 360-pixel attachment-review captures were visually inspected against `DESIGN.md`. The implementation preserves the incumbent flat paper, ruled ledger, square controls, trust-blue action and semantic status system; no new visual world, decorative motion or unsupported scope was added.

## Removal of the synthetic production path

- Deleted the synthetic hash-pinned extraction API, recorded-router implementation, extraction service/schema/form adapters, seeded invoice UI and synthetic PDF generator/binary fixture.
- The privacy gate rejects production upload fixtures, recorded extraction behavior, runtime logging, credential/PII patterns, unauthorized durable writes and missing deployment exclusions.
- Neutral parser fixtures are generated in test memory and are visibly labelled `TEST DOCUMENT - NOT VALID - NOT A CERTIFICATE`. They contain no fabricated authority decision, rate, certificate, shipment state or compliance conclusion.
- Task-created workspace SQLite cases were removed after verification. Final browser runs used isolated disposable data directories, which were deleted during cleanup.

## Verification gates

- `pnpm test:documents` — 14/14 passed across document intake, prompt-injection quarantine, parser deadline, temporary cleanup, provenance, immutable versions, retention, routes and cross-case isolation.
- `pnpm test` — 116 passed; 2 opt-in live hosted-model tests skipped because no OpenAI API/model environment was supplied.
- `pnpm verify:privacy` — passed; 67 text files scanned and deployment exclusions verified.
- `pnpm verify:security` — passed; the production dependency audit found no known vulnerabilities at the high-severity gate.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed without warnings.
- `pnpm build` — passed with Next.js 16.3.0; optimized dynamic routes include `/api/documents`, `/api/document-facts` and `/api/trade-cases`.
- `node_modules/.bin/playwright test` in a fresh `BWMI_DATA_DIR` — 3 required journeys passed and 3 opposite-project copies were intentionally skipped. Desktop proved real PDF parsing, confirmation, persistence, second-case isolation and switching. Mobile proved keyboard focus, restored attachment review, Axe checks and no 360-pixel overflow.
- `pnpm verify:links` — intentionally not run because BWMI-19 changed no official-source registry or admitted evidence.
- `git diff --check` — passed before this record and was rerun after it.
- The refreshed full code graph contains 1,215 nodes and 2,743 edges with zero skipped or parse-partial files. Coverage checks recorded no issue for the changed document, conversation, API and component scopes.

## Process and listener audit

- Port `3210` was inspected before each Playwright server run and was free. Every Playwright-owned Next.js server stopped when its run ended; the final audit found no listener on `3210`.
- All browser data directories, the aborted dependency-install directory and the task-created workspace `.data` directory were deleted after verification.
- Existing Codex task helpers, app automation helpers and codebase-memory processes were preserved. The shared codebase-memory service on `127.0.0.1:9749` remained healthy. No unrelated process was terminated.

## Explicit boundary

BWMI-19 does not add a jurisdiction, add BWMI-20 country controls, admit a regulatory source, deploy the product, create a new architecture, authenticate an uploaded document, verify a certificate or transaction status, file with an authority, make a payment, track a shipment, provide legal approval or guarantee clearance. BWMI-20 was not created or started.
