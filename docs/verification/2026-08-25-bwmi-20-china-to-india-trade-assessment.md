# BWMI-20 China-to-India trade assessment verification

**Date:** 2026-08-25  
**Runtime scope:** India and China only  
**Work item:** BWMI-20 - Complete the China-to-India trade assessment  
**Closure state:** Done; implementation complete after coordinator-approved independent audit

## Implemented bilateral assessment contract

- Added an admitted China export-source registry, China Coverage Manifest and deterministic China-to-India assessment tool on top of the verified India-import assessment.
- Added a bounded official-source product-profile seam for the reference TP-Link Archer AX12 (IN), hardware version 1.8 only. Public manufacturer facts remain dated candidate facts until the user confirms the exact purchased variant; ambiguous or different variants fail closed, and no universal catalogue was added.
- The Trade Case captures the China exporter and producer, Indian importer and end user, China manufacturing site and origin basis, exact model and technical parameters, end use, export/import ports, decimal INR value and effective date. Blank or unresolved material facts fail closed.
- Uploaded documents are explicitly typed against a case-specific checklist. The BWMI-19 intake now extracts and versions additional visible fields for end user/use, manufacturing/origin, ports, document date, expiry and Incoterm, and the preparation evaluator checks pending review, scope, dates, visible content and cross-document consistency.
- Each checklist requirement identifies why it is needed, its issuer, filing/upload destination and portal-access boundary. Statuses progress through `Needs information`, `Documents required`, `Uploads checked` and `Document Package Ready for Submission Within Verified Scope`; uploaded acknowledgement content can be reported with provenance but never establishes authenticity, filing, acceptance or clearance.
- Chinese source passages remain labelled `Authoritative Text`; English passages are labelled `Derived Translation`. A material translation ambiguity blocks the assessment.
- The China and India checklists, Working Classification, China export-control result, Indian Border Charge Estimate, exact claim source/version/locator, checked and not-checked scope, blockers and immutable assessment snapshot use the existing evidence, tool, calculation, citation and persistence contracts.
- China Single Window and MOFCOM dual-use transaction/status connectors remain `login_required`; direct protected-portal integration is not required for document-package preparation. The current GACC statutory-inspection row and authority-backed case-party result remain `manual`; neither is converted to checked coverage or authority status.
- The implementation adds no UAE or United States connector, source, assessment or positive coverage and does not add or start BWMI-21.

## Pinned China evidence

All admitted source bytes are local immutable official snapshots and their hashes are recomputed by the test suite:

- GACC Goods Declaration guide: `f9674fbca7de221a8ec6158f1225cb78def41bb6abf73f3e14ea9cc0057388f7`
- GACC Order 277 declaration rules: `f8a4f3dd6bcd7b97a025ee85817286482504fe3327676f1ecf4342904479ec63`
- Complete MOFCOM/GACC 2026 ordinary export-licence catalogue PDF: `c28b850eabed4ae8ba811dc41a04b2d01a32b1320df0d0edbeffd3aaa10fd500`
- PRC Import and Export Commodity Inspection Law: `251ea1b06803f190ad66c2df3af87797bc02aa0f9a13144d824a066691bc088c`
- Consolidated PRC dual-use list: `b4be9b44fd90d82301290d6c17851bb8c0b33cb563e6287c359dd7a4d162deee`
- State Council Order 792 dual-use regulation: `fdc382ab0b3b9b2f28f9cd6ff8347d225a650994f07b320cbeb50fe9d16a6e63`
- Current PRC Foreign Trade Law: `81334f4143fb03b025475fc242ab8baf3f908309acf5dc06984202cb7223eadf`

The catalogue test extracts all 59 pages of the official 2026 ordinary export-licence PDF. It proves the PDF title is present and that Chinese commodity code `8517623690`, heading `8517`, and the router terms used by the screen have no row. This exact negative does not prove the separate statutory-inspection, temporary-control, catch-all, end-use or party results.

## Bounded official product profile

The only admitted public product-profile candidate in BWMI-20 is TP-Link Archer AX12 (IN), hardware version 1.8. The source is the official manufacturer datasheet at `https://static.tp-link.com/upload/product-overview/2025/202511/20251125/Archer%20AX12%28IN%291.8_Datasheet.pdf`, retrieved 2026-08-25 and scheduled for review after 2026-11-25. Candidate facts are limited to the exact variant's stated wireless bands/speeds, Ethernet-port configuration and external power supply. The UI and domain contract require user confirmation before those facts enter a Trade Case; variant ambiguity and every other product return a bounded-scope question instead of an inferred profile.

## Coordinator integrity-audit repairs

- Product-profile confirmation is now resolved server-side against a closed normalized identity set whose canonical identity is `TP-Link Archer AX12 (IN) 1.8`. A generic, ambiguous or different model returns `Needs information`, withholds classification and calculation that depend on the reference pack, and cannot persist `product_profile_id`, `product_profile_confirmed_at` or the manufacturer source reference. The browser regression first proves this negative and then reruns the positive journey with the exact admitted variant.
- Every required checklist document now owns a bounded `requiredVisibleFacts` contract. These requirements cover only ordinary visible content appropriate to that document: identifiers and dates where documents normally provide them; relevant exporter/importer/end-user parties; exact model or adapter scope; China commodity code for the declaration/control/catalogue screens; route/ports for the transport document; value/quantity where applicable; and certificate/authorisation expiry where applicable.
- An empty or partial document shell remains `Uploads checked`. Missing reviewed fields, pending review, invalid/expired dates and case/cross-document conflicts produce exact file/field findings. Unique document numbers and document-specific dates/expiries are not incorrectly compared across documents.
- The server and rendered evidence ledger use the same minimum-visible-fact predicate; client-declared evidence and mere document-type presence cannot upgrade evidence possession.
- The UI, Trade Case creation route and live research scope now identify China-to-India as the only supported runtime direction before BWMI-21. Reverse-direction admission types remain an internal bounded future seam, not a current user-facing assessment or positive runtime path.

## Runtime fail-closed conditions

The software is complete, but a runtime assessment remains fail closed until the evidence required for that particular case is supplied and admitted. The rendered reference candidate reaches preparation status `Documents required` and regulatory status `Assessment Incomplete`, while the independently available India calculation remains `INR 43,960.00`. It does not reach `Assessment Complete Within Verified Scope` because:

1. no user-supplied real transaction corpus establishes the exact exporter, manufacturing site and records, importer/end user, route and evidence possession;
2. the current exact GACC statutory-inspection catalogue row for `8517623690` was not acquired or admitted;
3. no authority-backed current case-specific restricted-party result was acquired or admitted; and
4. authenticity, filing, acceptance and clearance remain unverified without authority evidence. Protected-portal integration itself is not a BWMI-20 preparation prerequisite.

These are runtime case-input and authority-evidence conditions under the coordinator-approved preparation workflow, not BWMI-20 implementation blockers. UI selections and test fixtures are not allowed to replace them. Accordingly, the browser journey demonstrates the visible incomplete state and persistence; it is not evidence of a real trade transaction or a positive assessment.

## Verification gates

- The integrity-repair tests failed first on the unbound profile, empty document shells, missing China commodity-code extraction and reverse runtime path. Final focused result: 26/26 across preparation, route, document-intake and live-research seams.
- `pnpm test`: 132 passed; 2 opt-in live hosted-model tests skipped because no live OpenAI environment was supplied.
- `pnpm lint`: passed without warnings.
- `pnpm typecheck`: passed.
- `pnpm verify:privacy`: passed; 72 text files scanned and deployment exclusions verified. Public tariff/document identifiers are narrowly allowlisted so they are not misclassified as personal phone numbers.
- `pnpm verify:security`: passed; no known production dependency vulnerabilities.
- `pnpm verify:links`: 66/66 official or admitted official-manufacturer/destination links resolved; 7 official PDF endpoints returned visible access-controlled `403` responses and remained labelled as such.
- `pnpm build`: passed with Next.js 16.3.0. Dynamic routes include `/api/assessments`, `/api/chat`, `/api/document-facts`, `/api/documents` and `/api/trade-cases`.
- `pnpm test:browser`: 3 required journeys passed and 3 opposite-project duplicates were intentionally skipped. Desktop proved the preparation/regulatory status split, checklist issuer/destination details, Chinese translation labels, exact citations, India calculation, login/manual gaps, persistence and case isolation. Mobile 360px proved keyboard focus, no horizontal overflow and no Axe WCAG 2.0/2.1 A/AA violations.
- Final full graph refresh: 1,307 nodes and 2,995 edges, zero skipped files. The graph traces server-owned profile resolution and document minimums into the assessment `POST` route and confirms the narrowed live scope is reached by chat guidance. One expected parse-partial range belongs to the pinned official HTML snapshot `evidence/official/prc-dual-use-regulation-792.html`; direct bytes/hash/text checks cover that non-code evidence. Every operated implementation, route, component and test path reports matching fresh metadata with no recorded graph issue.

## Process and listener audit

- Port `3210` was inspected before build and browser servers and was free. A temporary task-owned Next.js server was reused for the overflow diagnostic and final browser gate, then terminated with `SIGINT`; the final audit found no listener on `3210`.
- Task-created browser data and failure-artifact directories were deleted after verification.
- The existing shared codebase-memory service and its Node/LSP helpers were reused and preserved. No unrelated process was terminated.

## Plane and coordinator closure

The coordinator accepted both integrity repairs after independently rerunning the repaired focused suites at 21/21 and accepted the task's 132-test full gate plus the reported type, lint, privacy, security, link, build, browser, graph and process gates. BWMI-20 implementation is complete and its Plane state is **Done**. Future users' real case inputs and authority results remain runtime fail-closed assessment conditions; they are not reasons to keep the software ticket open. No BWMI-21 or successor is created or started because the coordinator will resume the existing paused BWMI-21 task.
