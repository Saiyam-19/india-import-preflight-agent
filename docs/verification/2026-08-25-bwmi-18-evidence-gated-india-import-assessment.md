# BWMI-18 evidence-gated India import assessment verification

**Date:** 2026-08-25  
**Runtime scope:** China-origin goods imported into India; China export-side controls explicitly not checked  
**Work item:** BWMI-18 — Deliver an evidence-gated China-origin India import assessment

## Implemented boundary

- `determine_applicable_authorities` derives a case-specific India Applicable-Agency Checklist for Customs/tariff, DGFT, WPC, BIS/MeitY adapter controls, TEC/MTCTE, DoT REPA, and imported retail-package declarations. Every entry is reconciled to the source-admitted Coverage Manifest. Missing source records, expired review dates, scope mismatch, and manual, login-required, unavailable, or unsupported connectors make that entry incomplete and prevent a complete assessment.
- `classify_product` returns either an evidence-gated Working Classification or Classification Candidates. The admitted router path records all distinguishing facts, applies GRI 1 and GRI 3(b), uses the official 85176290 nomenclature, and expressly excludes 85176230 modems and residual 85176990 apparatus. Removing the confirmed modem fact returns candidates and withholds the calculation.
- `calculate_border_charges` uses `decimal.js`, accepts INR values only for the matching valuation/assessment date, requires China origin, no preference claim, a Working Classification, current admitted rates, and a confirmed dated trade-remedy no-match check. It exposes component bases, formula order, two-decimal half-up rounding, rate dates and source IDs, exclusions, and the label **Border Charge Estimate**.
- `assess_trade_case` returns only `Research Guidance`, `Assessment Incomplete`, `Action Required`, or `Assessment Complete Within Verified Scope`. The conversation-store migration persists every accepted result as an append-only Assessment Snapshot; update and delete triggers reject mutation.
- The output guardrail resolves every factual claim block to a source-admitted source ID and exact locator. Absent, unknown, not-yet-effective, stale, provisional, conflicting, untranslated, scope-mismatched, or locator-mismatched citations are rejected before the claim list reaches the saved result or UI.
- The interface collects or confirms exact product, party, valuation, trade-remedy, and evidence facts; renders checked/not-checked scope, the agency ledger, classification reasoning and alternatives, the auditable calculation or withholding reasons, official citation links, exclusions, and preparation steps; and keeps China export-side controls under **Not checked**.

## Production-server reference journey

The optimized Next.js build was started with `next start` on `127.0.0.1:3210` against a fresh SQLite data directory. Playwright entered and confirmed a China-origin new dual-band MIMO Wi-Fi router reference case with an exact model, China manufacturer/producer/exporter, Indian importer, dedicated adapter, no integrated modem, INR 100,000 assessable value, present India-side evidence statuses, no preference claim, and a dated trade-remedy no-match confirmation.

The rendered journey returned:

- state: `Assessment Complete Within Verified Scope`;
- Working Classification: `85176290`;
- assessable value: `INR 100000.00`;
- BCD: `INR 20000.00` at 20%;
- AIDC: `INR 0.00` at 0%;
- SWS: `INR 2000.00` at 10% of BCD;
- IGST: `INR 21960.00` at 18% of assessable value plus BCD, AIDC and SWS;
- compensation cess: `INR 0.00` at 0%;
- total border charges: `INR 43960.00`;
- explicit not-checked item: `China export-side controls — explicitly not checked in BWMI-18`.

The final production SQLite query returned one immutable snapshot, `assessment-177fafb85a0ad0cdc5261d25`, in the complete-within-scope state. It also returned one persisted tool reference for each of `determine_applicable_authorities`, `classify_product`, `calculate_border_charges`, and `assess_trade_case`.

## Persisted validated claim blocks

The final assessment persists fourteen clickable claim blocks: seven agency/domain claims, two classification claims and five rate claims. Each uses a source selected for that exact claim rather than treating the ledger's full source list as interchangeable support.

| Source/version ID | Exact locator |
| --- | --- |
| `cbic-current-tariff-85176290` | Printed page 1018 / PDF page 15, rows 851762, 85176230 and 85176290 |
| `cbic-current-tariff-gri` | General Rules for Interpretation, rule 3(b) |
| `customs-aidc-11-2021` | Page 2, table S. No. 17: Any Chapter, residual goods, Nil |
| `finance-act-2018-sws` | Section 110(1)–(3), especially subsection (3) |
| `igst-rate-9-2025` | Schedule II, S. No. 490, heading 8517; commencement clause |
| `gst-compensation-cess-1-2017` | Page 5, Schedule S. No. 56: Any chapter, residual goods, Nil |

The separately persisted DGFT baseline source remains `dgft-ftp-2023-ch2-f16265d88b82`, located at Foreign Trade Policy 2023 Chapter 2 paragraphs 2.05(a)–(c) and 2.06(b)–(d).

## Fail-closed journeys

- Missing party fact: `Assessment Incomplete`; number withheld.
- Ambiguous classification: `Classification Candidates`, `Assessment Incomplete`; number withheld.
- Stale source/rate review date: `Assessment Incomplete`; stale/review blocker visible.
- WPC connector `temporarily_unavailable`: WPC checklist entry incomplete and `Assessment Incomplete`.
- Confirmed missing WPC ETA: `Action Required`; the absence is not rewritten as uncertainty or a positive result.
- Every incomplete path retains the China-side not-checked boundary and never invents a source, rate, classification, calculation, citation, connector result, or clearance status.

## Independent coordinator audit repairs

- Added an effective-period gate for every source and rate. A historical assessment date before an admitted instrument or rate became effective now returns `Assessment Incomplete` and withholds the calculation.
- Removed duplicated display-rate literals. Component percentages and formulas now come from the same admitted rate records used for Decimal arithmetic.
- A confirmed possible trade-remedy match now returns `Action Required` when no separate completeness gap exists; unknown or unconfirmed checks remain incomplete.
- Every Assessment Snapshot now records explicit prompt, model and deterministic tool-version provenance. Prompt and model versions are recorded as `not_used` because this assessment path is owned by deterministic domain tools.
- Added one exact-locator clickable claim for every Applicable-Agency Checklist entry, closing the gap between the factual agency ledger and the claim guardrail.

## Verification gates

- `pnpm test:agent-first` — 64 passed; 2 opt-in live hosted-model tests skipped because no API key/model environment was supplied.
- `pnpm test` — 108 passed; 3 opt-in live OpenAI tests skipped.
- `pnpm typecheck` — passed.
- `pnpm lint` — passed without warnings.
- `pnpm build` — passed with Next.js 16.3.0; `/api/assessments` is present in the optimized route manifest.
- `pnpm test:browser` against the optimized production server — 2 passed and 2 intentional project skips. The desktop journey reached the complete-within-scope state, verified the official classification citation link and exact `INR 43960.00` result, restored the immutable snapshot after reload, and found no prohibited cost label. The 360px journey verified keyboard focus, WCAG 2.2 A/AA axe checks, the restored assessment, and no document overflow.
- `pnpm verify:privacy` — passed; 70 text files scanned and excluded research/verification/test/runtime data remained outside the deployment bundle.
- `pnpm verify:security` — passed; the production dependency audit found no known vulnerabilities at the high-severity gate.
- `pnpm verify:links` — 53/53 registered official links resolved; 7 access-controlled 403 responses remained explicitly labelled as access-controlled rather than content proof.
- `git diff --check` — passed.
- The Impeccable design detector was run once after the assessment UI was complete; its findings were advisory design-system drift from the existing shared stylesheet plus four new off-ramp type/color values, which were normalized to the documented Evidence Ledger tokens. The final rendered desktop and 360px surfaces were visually inspected.

## Process and listener audit

- Before every browser/server run, `lsof -nP -iTCP:3210 -sTCP:LISTEN` showed no existing listener, so no user-owned or other-task server was reused or displaced.
- The final production server was the task-owned Node PID `57305`, listening only on `127.0.0.1:3210` with cwd `/Users/saiyamchaplot/.codex/worktrees/7d2a/Hackathon BWMI`. Playwright used that existing built server rather than starting a duplicate.
- After the production browser gate, the task sent Ctrl-C to its own execution session. Port `3210` was clear, PID `57305` had exited, and no verification process respawned.
- Existing system/application listeners and the codebase-memory service on `127.0.0.1:9749` were preserved. No unrelated process was terminated.

## Explicit boundary

BWMI-18 does not check or imply China export-side controls. It does not add a country, file with Customs, make a payment or application, authenticate evidence, verify certificate status, track a shipment, provide legal approval, or guarantee clearance. BWMI-20 owns the China export-side control layer and was not created or started here.
