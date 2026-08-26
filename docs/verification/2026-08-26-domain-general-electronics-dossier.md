# Wave 4 independent regression and adversarial gate

Date: 2026-08-26  
Scope: Wave 4 / Task Chat 7 only  
Verdict: **BLOCKED**

The domain-general electronics dossier is independently green for deterministic behavior, type checking, lint, build, production-graph admission, production-graph links, the runtime-supplied unseen-product harness, no-provider latency, and the desktop/360-pixel browser and accessibility journeys. Release verification is blocked by two exact plan gates: the full official-link regression resolves 86 of 92 URLs and leaves six failures, and the privacy gate rejects the release workspace because `.env.local` is present. This verification task did not repair either failure.

## Exact gate record

| Gate | Exact command | Result |
| --- | --- | --- |
| Full deterministic suite | `pnpm test` | PASS: 31 files passed, 2 skipped (33 total); 230 tests passed, 5 skipped (235 total). The suite's own latency sample reported engine p95 28.583 ms, first-useful-intake route p95 220.539 ms, and dossier route p95 97.114 ms. Standard PDF-font warnings were non-failing. |
| TypeScript | `pnpm typecheck` | PASS. |
| Lint | `pnpm lint` | PASS with no findings. |
| Production build | `pnpm build` | PASS under Next.js 16.3.0/Turbopack; compilation, TypeScript validation, and five-page generation completed. |
| Full official-link regression | `pnpm verify:links` | **FAIL:** 86/92 resolved, with seven access-controlled official responses and six failures: Consumer Affairs legal-metrology URL (ERR), MoEF PDF (ERR), ICEGATE `/Webappl/index_imp.jsp` (500), ICEGATE `/contact_us` (404), MIIT page (ERR), and MTCTE `/contact_us` (404). The initial sandbox run could not reach the network; this recorded result is the approved unrestricted rerun. |
| Privacy | `pnpm verify:privacy` | **FAIL:** `.env.local must not be present in the release workspace`; 96 text files scanned. The file was preserved and not inspected or altered. |
| Browser/accessibility | `BWMI_REUSE_SERVER=1 pnpm test:browser` | PASS on the approved unrestricted rerun: 8 passed and 8 intentional opt-in skips in 10.4 s. It reused PID 22140. Desktop and 360-pixel journeys passed keyboard navigation, Axe checks, and horizontal-overflow checks, including the dossier. The initial sandbox-only Chromium launch failed 16/16 on macOS MachPort permission and was superseded by this rerun. |
| Runtime-only unseen product | `BWMI_UNSEEN_ELECTRONICS_PRODUCT="magnetoelastic pipe-corrosion telemetry puck ZXQ-741" pnpm test:unseen-harness -- --product "magnetoelastic pipe-corrosion telemetry puck ZXQ-741" --spec "sealed industrial sensing puck; 915.375 MHz transmitter; 0.873 Ah 3.65 V lithium-ion cell; no camera; no public-network interface; commercial pre-purchase" --characteristics '{"productForm":"finished_product","condition":"new","decisionStage":"pre_purchase","importPurpose":"commercial","radio":{"hasTransmitter":true,"frequencyBands":[{"value":915.375,"unit":"mhz"}],"maxOutputPowerWatts":0.037},"network":{"connectsToPublicNetwork":false,"interfaces":[]},"battery":{"present":true,"chemistry":"lithium-ion","capacityAh":0.873,"voltage":3.65},"camera":{"present":false},"encryption":{"present":false},"endUse":{"controlled":false}}'` | PASS: 1 focused unseen-product test, 8 intentionally skipped. A preceding shell invocation expanded an unset variable into an empty `--product` and failed before exercising a product; the explicit-literal rerun above is the valid gate. |
| Exact unseen-string preflight | `rg -F 'magnetoelastic pipe-corrosion telemetry puck ZXQ-741' src tests evidence scripts` plus equivalent checks for `915375000` and `0.873` | PASS: the runtime product identity and distinctive values were absent from production code, JSON, scripts, and fixtures before the run. |
| No-provider latency | `node scripts/measure-electronics-latency.mjs` | PASS: first useful intake p95 **30.842 ms** under 1000 ms; dossier p95 **37.748 ms** under 2000 ms; provider use was false. |
| Production graph admission | `BWMI_VALIDATE_PRODUCTION_KNOWLEDGE=1 pnpm vitest run tests/agent-first/electronics-knowledge-loader.test.ts tests/agent-first/evidence-admission.test.ts` | PASS: 52/52. |
| Production graph links | `BWMI_VALIDATE_PRODUCTION_KNOWLEDGE=1 pnpm verify:links` | PASS: 7/10 resolved; the remaining three are explicitly `evidence_pending` and non-blocking (Consumer Affairs legal-metrology ERR, ICEGATE contact 404, MTCTE contact 404). |

## Evidence-domain admission state

Production graph facts: schema v1, 4 admitted records, 51 nodes, 1 `filed_at` edge; 26 actionable nodes, 20 evidence-pending nodes, and 5 coverage-pending nodes.

Admitted/actionable domain:

- WPC/DoT evidence for the ETA service identity, Saral Sanchar visible service identity, WPC application process, and portal technical-support contact. These are metadata-level admissions only.
- Exact policy locators and contact/service metadata are released only where their graph bindings are complete.

Pending/withheld domains:

- Battery EPR and e-waste EPR: CPCB coverage gaps.
- Legal metrology: Department of Consumer Affairs coverage gap.
- Used/refurbished electronics and unmapped electronics: DGFT coverage gaps.
- DGFT, BIS, and TEC/MTCTE material whose legal metadata or stable official endpoint is incomplete remains Pending.
- ICEGATE contact/legacy pages and inaccessible or unstable official documents remain Pending; login, filing, payment, approval, and clearance are never inferred.
- The production graph does not currently bind all required-document and filing-sequence edges for a filing portal, so a generic or partial portal is withheld instead of released.

## Graph and implementation coverage

The codebase knowledge graph was ready with 2,145 nodes and 7,265 edges. Discovery traced `withElectronicsProfile` to `buildElectronicsProfile`, `groupedElectronicsIntake`, and `buildElectronicsActionDossier`; it also traced `ActionDossierAssessment` through `ReadinessAssessment`, `ChatFirstWorkspace`, and `HomePage`. Relevant production scopes had no recorded substantive coverage gap. The best-effort index reports one partial parse at `src/server/knowledge/electronics-domain.ts:202`; direct inspection shows only the indexed TypeScript type reference `AdmissionRequest["amendment"]`, not missing dossier behavior. Production source fallback and deterministic tests were therefore used to close that best-effort graph limitation.

No named-product branch, old `router-pack`, `headphones-pack`, or `camera-pack` participation was found in the new engine/seed. The only camera reference is the trait `camera.present`. The dossier renderer orders actions before documents, policy locators, filing portals, contacts, costs, citations, and checked/not-checked scope. Its empty portal message explicitly withholds release until the service URL and access state are evidence-bound.

## Twelve acceptance gates

1. **PASS — grouped intake.** One grouped clarification collects product form, condition, decision stage, purpose, radio traits, public-network interface, battery, camera, encryption, and end-use traits.
2. **PASS — complete dossier shape.** Decision, ordered next actions, documents, policy review, online forms, contacts, classification/regulation, costs, citations, and checked/not-checked scope are always represented; missing evidence produces placeholders rather than omitted sections.
3. **PASS — portal release boundary.** A portal is released only with independently bound service URL, access state, filer, required documents, filing edge/sequence, and service identity. Partial production bindings remain Pending.
4. **PASS — policy locator boundary.** Released policy guidance carries admitted source identity and exact locators. Production-graph admission and production-graph link checks passed; the broader legacy link regression remains red as recorded above.
5. **PASS — trait-only runtime behavior.** The engine evaluates structured traits and graph conditions, not product names.
6. **PASS — unseen products.** The deterministic suite covers four arbitrary examples (USB-C thermal imaging module, GaN bench power supply, LoRa soil-moisture telemetry node, and e-paper shelf-label controller), and the independent runtime-only ZXQ-741 product passed.
7. **PASS — old-pack isolation.** Source and tests exclude old named-product packs from the domain-general engine.
8. **PASS — fail closed.** Missing, stale, inaccessible, or unadmitted evidence yields Pending/Action Required and cannot create Required/Clear evidence claims.
9. **PASS — stage and purpose conditioning.** Stage/purpose are inert unless an admitted graph condition supports a change; the current production graph has no such admitted condition, and tests prevent invented sequencing differences.
10. **FAIL — complete deterministic/privacy release gate.** The 230-test deterministic suite passed, but the exact privacy release gate failed because `.env.local` exists. This is an unresolved acceptance blocker.
11. **PASS — accessible responsive UI.** Eight browser checks passed with eight intentional opt-in skips across desktop and 360 pixels; keyboard, Axe, and overflow gates passed. Static detector output for the relevant workspace component was empty. Dossier motion is limited to brief operational feedback and the existing reduced-motion rule provides deterministic suppression.
12. **PASS — no guarantees.** Code and UI explicitly refuse to imply filing, login, payment, approval, or clearance.

## Final adversarial answers

1. **Can changing only the product name change the regulatory result? No.** Only structured traits and admitted graph conditions participate.
2. **Can an old named-product pack participate in this engine? No.** Old packs are isolated and absent from the new engine/seed path.
3. **Can missing, stale, inaccessible, or unadmitted evidence produce Required or Clear? No.** It remains Pending/Action Required.
4. **Can a dossier section disappear merely because supporting evidence is missing? No.** The section remains visible with a fail-closed placeholder.
5. **Can a generic homepage or partly bound service be released as a filing portal? No.** The portal stays Pending until every required binding exists.
6. **Does the UI lead with copied policy text instead of the user's work? No.** Ordered next actions appear first; policy locators and citations follow.
7. **Does the system claim all-electronics coverage? No.** Five explicit coverage gaps and other Pending domains remain visible.
8. **Did this wave introduce forbidden scope or cross-task changes? No.** Prior task reports stayed within their plan allowlists; this wave added only this verification note and did not modify production, tests, evidence, harnesses, dependencies, configuration, or the plan. The shared worktree remains dirty with unrelated pre-existing work, which was preserved.

## Allowlist and process audit

- Wave 1–3 reports were checked against their plan task boundaries; their final reported files stayed within the relevant allowlists. The accepted Wave 3 counts were also independently rerun rather than accepted on report alone.
- This task's only tracked change is `docs/verification/2026-08-26-domain-general-electronics-dossier.md`.
- Coordinator-owned Node listener PID **22140** remained healthy on `127.0.0.1:3210` with working directory `/Users/saiyamchaplot/Documents/ChatGPT/Hackathon BWMI`. It was reused for the browser gate and was never stopped or restarted.
- No server, watcher, daemon, container, database, or other long-running process was started by this task. All test/build commands exited.
- No reset, clean, stash, commit, push, deploy, Plane action, provider call, credential read, or secret exposure occurred.

## Remaining blocker

The wave cannot be accepted as complete until both exact red gates are resolved outside this verification-only task: the full official-link regression must account for all six failing legacy endpoints, and the release workspace must satisfy `verify:privacy` without `.env.local`. No repair is included here.
