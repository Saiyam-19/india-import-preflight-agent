# BWMI-21 India-to-China trade assessment verification

Date: 2026-08-25  
Plane work item: BWMI-21 (`ac6c622d-4073-41e2-bf66-bfe989d8106f`)  
Verification state: implementation complete; awaiting independent coordinator audit

## Scope and predecessor reconciliation

- The independently approved BWMI-20 tree at `/Users/saiyamchaplot/.codex/worktrees/33f6/Hackathon BWMI` was inspected and dry-run compared before transfer.
- Its final content was reconciled without copying `.git`, `.next`, `node_modules`, or `tsconfig.tsbuildinfo` and then content-compared with no remaining BWMI-20 differences.
- BWMI-21 changes are limited to the bilateral India-to-China capability. No BWMI-22 task was created and no BWMI-22 implementation was started.
- The capability adds no UAE or United States connector, source, assessment, or positive coverage.

## Implemented capability

- Added a nine-domain `full_support` Coverage Manifest spanning DGFT, India Customs, GACC, MOFCOM, PRC tariff and tax authorities, CNCA, and MIIT.
- Added 13 hash-pinned admitted official sources with exact locators, effective/review dates, local immutable snapshots, Chinese `Authoritative Text`, and labelled English `Derived Translation` where applicable.
- Added a direction-aware Trade Case and server-owned India-to-China assessment contract for exact product, origin, manufacturer/producer, exporter/importer, end user/end use, Indian eight-digit and Chinese ten-digit codes, route, China province, assessment date, and CNY value inputs.
- Added deterministic India Schedule II and SCOMET screens; China import-licence, CCC, network-access, radio-approval, party, end-use, trade-remedy, consumption-tax, classification, duty, and VAT checks.
- Added a 14-document preparation workflow with document-specific minimum reviewed-visible-field requirements. Upload presence cannot establish filing, licence, certificate, authority acceptance, payment, or Customs release status.
- Added protected-portal gaps for ICEGATE, China Single Window, and case-specific CNCA/MIIT status. Public guidance and protected transaction status remain distinct.
- Added immutable assessment persistence, direction-aware live official-source research scope, and schema migration v6 for the expanded document types.
- Added desktop and 360 px India-to-China UI, labelled source-language evidence, exact formulas, visible gaps, and fail-closed `Number withheld` rendering when uploaded tariff evidence is absent.

## Coordinator audit repair: ChatGPT-first interaction

- Replaced the primary form-led workspace with an immediately usable chat composer. An arbitrary India-China trade question now starts and persists a conversation without explicit case creation, naming, direction selection, or case-picker interaction.
- Trade Cases remain server-owned memory and isolation objects. The chat route creates one automatically, infers and persists direction when the user states it, persists product context, rejects any supplied unknown case ID, and never falls back across conversations.
- Added focused conversational intake for unknown direction, exact product identity and valuation inputs. The existing admitted-evidence guidance and deterministic direction-specific engines remain the downstream authority once the relevant facts are available.
- Moved chat history to an optional left rail on desktop and native disclosure on mobile. Confirmed facts, documents, provenance, checked snapshots and the evidence boundary are optional inline Conversation details, not prerequisites.
- Moved document intake into the composer. A provisional internal conversation is created automatically for attachment-first use; successful extraction appends a normal assistant message asking the user to confirm or correct visible fields, while all BWMI-19/20 document sufficiency and trust boundaries remain unchanged.
- Updated the product and design contracts to make question-first conversation, automatic case isolation, one-group-at-a-time clarification, normal cited answers, persistent chat memory, and 360 px behavior normative. No UAE/US or BWMI-22 scope was added.

## Deterministic reference proof

The bounded reference fixture uses one confirmed India-manufactured dual-band Wi-Fi router case with separate India `85176290` and China `8517623690` codes, exact parties, origin, use, ports, Shanghai destination, current authority results, all case evidence present, and confirmed translation review.

It reaches `Assessment Complete Within Verified Scope` only when both sides are complete. The server calculates:

- Customs value: CNY 100,000.00
- Duty at 10%: CNY 10,000.00
- Consumption tax: CNY 0.00 only after confirmed inapplicability
- Import VAT at 13% of customs value plus duty and consumption tax: CNY 14,300.00
- Total border charges: CNY 24,300.00

Missing facts, missing case evidence, stale evidence, unavailable connectors, unresolved or adverse screens, an unconfirmed tariff result, or material translation ambiguity all keep the result `Assessment Incomplete`. The rendered browser journey intentionally has no qualifying uploads, stays `Documents required`, shows protected-portal gaps, and withholds the numeric estimate.

## Verification evidence

| Gate | Result |
| --- | --- |
| Focused BWMI-21 assessment, preparation, and route suites | 16/16 passed |
| Focused live-research and assessment suites | 13/13 passed |
| Full Vitest suite | 144 passed; 2 opt-in live tests skipped |
| TypeScript | `tsc --noEmit` passed |
| ESLint | passed |
| Privacy/deployment gate | passed; 77 text files scanned |
| Production dependency security audit | no known vulnerabilities |
| Official-link gate | 83/83 resolved; 7 official endpoints returned access-controlled 403 responses |
| Next.js production build | passed; all app and API routes compiled |
| Desktop and 360 px Playwright suite | 5 applicable journeys passed; 5 deliberate cross-project skips |
| Accessibility | WCAG 2 A/AA and 2.1 A/AA Axe scan passed with zero violations |
| Responsive behavior | 360 px journey had no horizontal overflow and remained keyboard operable |
| UI detector | no errors; one new stylistic warning was repaired; remaining findings are advisory design-token findings in the preserved stylesheet |
| Graph | full index written; 1,412 nodes, 3,303 edges, zero skipped files, persistent artifact present |
| Graph coverage | every operated-on code, test, UI, script, and documentation path had no recorded indexing issue |
| Official snapshot integrity | every admitted BWMI-21 source digest matched its local immutable bytes |
| Diff hygiene | `git diff --check` passed |

The graph reported eight parse-partial official HTML files caused by malformed publisher markup. Each flagged line range was inspected directly; zero source files were skipped. The source-integrity tests and exact-locator assertions remain the authority for those snapshots.

Final visual captures were generated and inspected at:

- `/private/tmp/bwmi-21-india-to-china-desktop.png`
- `/private/tmp/bwmi-21-india-to-china-mobile-360.png`
- `/private/tmp/bwmi-21-mobile.png` (ChatGPT-first 360 px audit repair)

## Process cleanup

- Reused and preserved the shared codebase-memory listener on `127.0.0.1:9749` (PID 45496).
- Terminated the task-owned development server and verified port 3210 stopped listening.
- Started the optimized production build only after a listener check, recorded PID 31413 and the exact BWMI working directory, ran the final browser gate, sent an interrupt to the owned session, and verified port 3210 no longer listened.
- No user-owned or shared process was terminated.

For the ChatGPT-first audit repair, the existing healthy development server on `127.0.0.1:3210` was inspected and reused. It remains preserved because it is owned outside this task; no duplicate long-running process was started and no shared process was terminated.

## Independent audit handoff

BWMI-21 remains `In Progress`. This record and the Plane evidence comment are the handoff for independent coordinator audit. The coordinator decides whether to move the work item to `Done`; this implementation task does not create BWMI-22.
