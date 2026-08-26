# Adversarial review — agent-first trade compliance plan

**Review date:** 2026-08-25
**Target:** `docs/specs/2026-08-25-agent-first-trade-compliance-shared-understanding.md`
**Verdict:** **Approved after revision; implementation still requires explicit user confirmation**

## Review standard

The plan is approved only if it can preserve the requested product while failing safely under incomplete facts, missing regulators, stale sources, hostile content, source conflict, unavailable integrations, model error, and local runtime failure.

The review treats these user requirements as fixed:

- India imports and exports;
- one focused OpenAI Agents SDK agent;
- natural ChatGPT-like conversation for any product;
- destination assessment capability for UAE, China, and the US;
- a persistent regulatory knowledge graph plus live official research;
- persistent conversations and a separate opted-in future-learning dataset;
- real sources, calculations, documents, and citations;
- responsive accessible chat;
- no positive conclusion on incomplete evidence;
- complete local development now, without deployment scope expansion.

## Blocking findings and resolutions

| # | Adversarial finding | Failure if unchanged | Required revision | Status |
|---|---|---|---|---|
| 1 | “Any product” plus “complete country assessments” implied unlimited regulatory coverage. | The model could turn search confidence into a false positive for an obscure or regulated product. | Separate conversational reach from assessment eligibility. Add a case-specific Applicable-Agency Checklist and machine-readable Coverage Manifest; any absent or stale domain blocks completion. | Resolved |
| 2 | “Destination Module” was treated as a country-level yes/no capability. | Selecting UAE, China, or US could imply all product, subnational, post-entry, and sector obligations were checked. | Define Verified Assessment Scope. Cover national/federal border and admitted product-market domains; include emirate/port/province/state/local requirements only when explicitly manifested and displayed. | Resolved |
| 3 | Live official web research could support an answer before a rigorous trust transition. | A search snippet, outdated page, redirect, or misidentified instrument could become “law” in the graph. | Add `discovered -> snapshotted -> extracted -> validated -> admitted`, immutable bytes/hash, authority and amendment validation, and no silent provisional promotion. | Resolved |
| 4 | The plan treated official-domain search as if it proved regulator completeness. | Search cannot prove that no additional agency or product rule applies. | Build regulator/domain trigger rules and compare them to Coverage Manifest entries. Explicitly state that empty search results are not evidence of absence. | Resolved |
| 5 | Citation compliance depended mainly on the system prompt. | The model could emit a plausible but nonexistent link or an uncited sentence during streaming. | Use structured Validated Claim Blocks, database-resolved source IDs, and an Agents SDK output guardrail. Stream activity, but release final regulatory claims only after validation. | Resolved |
| 6 | The web-search and custom-tool responsibilities overlapped. | A wrapper might pretend to control or validate hosted search while actually returning unadmitted results. | Use the SDK hosted web-search tool for discovery and a separate `admit_source_evidence` tool for secure retrieval, snapshots, validation, and admission. | Resolved |
| 7 | “Trade costs” or “landed cost” was too broad for a customs calculator. | The app could imply freight, brokerage, domestic tax, storage, or final payable amounts it cannot verify. | Rename to Border Charge Estimate, define included official border components, show formulas and rate citations, and explicitly exclude unverified commercial/post-entry costs. | Resolved |
| 8 | Working Classification could be mistaken for a confidence-scored model prediction. | A confident model could drive a duty calculation from the wrong heading. | Require confirmed product facts, GRI reasoning, legal notes, excluded alternatives, and no ambiguity; preserve Binding Classification precedence. | Resolved |
| 9 | Source and uploaded content lacked an explicit hostile-input boundary. | Prompt injection, SSRF, unsafe redirects, oversized files, or model-generated SQL could compromise the app or its reasoning. | Treat all content as untrusted; add domain/redirect/network validation, resource limits, safe parsing, prepared SQL, server-only secrets, and a ban on following embedded instructions. | Resolved |
| 10 | Persistent conversation memory did not fully prevent cross-case contamination. | Facts from one product or route could leak into another assessment in the same chat. | Require explicit case IDs for consequential tools, version confirmed facts, make switches visible, and prohibit recency-based fact borrowing. | Resolved |
| 11 | “Memory for all rules” risked conflating conversation memory, model memory, and regulatory evidence. | Private user facts could pollute the graph, and the model could claim the corpus is exhaustive. | Keep three separate SQLite stores; define the graph as versioned retrieval evidence, not model memory or a universal rulebook. | Resolved |
| 12 | The learning-data choice retained conversations but did not fully specify contribution governance. | Ordinary retention could be confused with consent to train, or contributed data could be unverifiable and undeletable. | Require an explicit immutable consent event, redacted copy, schema/model/tool versions, Feedback Signal, withdrawal status, and a separate future review before export/training. | Resolved |
| 13 | Document handling replaced one fake fixture without defining authenticity and parser limits. | The assistant could treat an uploaded certificate as valid or follow malicious PDF text. | Extract visible facts only with page/region provenance and confirmation; add size/type/encryption errors and prohibit authenticity/signature/certificate claims without a real integration. | Resolved |
| 14 | The SQLite choice was not reconciled with the repository’s Node engine. | Built-in SQLite would fail for developers using the stated Node 20 floor. | Standardize local development on Node 24+, server-only `node:sqlite`, migrations, prepared statements, bounded synchronous operations, and no service dependency. | Resolved |
| 15 | The proposed test list was broad but did not distinguish real evidence from unstable live web tests. | CI could rely on mocks or become flaky when government sites changed. | Use hash-pinned real official snapshots for deterministic contracts, never production seeds; add an opt-in live connector/model suite for drift. Group tests into five high-value contract/journey areas. | Resolved |
| 16 | Streaming behavior did not account for guardrail failure after headers were sent. | The endpoint could partially display an invalid claim and then be unable to change the response status. | Validate requests before streaming; stream typed progress only; emit typed in-stream incomplete/error events; release final claim blocks only after guardrail validation. | Resolved |
| 17 | An API key was implicitly required for the entire local app. | Local startup and deterministic inspection could fail before the user configured a provider. | Start without a key and show AI integration unavailable; enable chat only with an allowed configured model. | Resolved |
| 18 | The responsive design could grow into a dense dashboard. | Evidence and workflow chrome could overwhelm the requested natural chat experience, especially on mobile. | Keep a restrained chat surface with a sidebar/drawer, case pill, inline citations, collapsible evidence, neutral status language, 360px acceptance, and purposeful minimal motion. | Resolved |

## Real-source and calculation challenge

The plan now distinguishes three things that must never be blended:

1. **Real production evidence** — admitted official source versions and exact locators.
2. **Deterministic test evidence** — hash-pinned copies of real official publications used only to verify contracts.
3. **Test transaction inputs** — minimal, clearly labelled values that exercise formulas and never appear as a real shipment, policy, ruling, document, citation, or production seed.

A calculation may be numerically correct but still withheld if its classification, origin, valuation basis, date, exchange rate, or legal rate is not admitted and applicable. Arithmetic correctness cannot repair legal-evidence incompleteness.

## Knowledge-graph challenge

The user’s goal of regulatory memory converted into a knowledge graph is preserved, but the graph cannot truthfully mean “all rules.”

The revised graph has:

- source-version nodes and immutable snapshots;
- claims with exact provenance;
- jurisdiction, regulator, domain, product, route, party, date, and intended-use applicability;
- amendment and supersession relationships;
- original/translated text relationships;
- provisional/admitted states;
- a Coverage Manifest that records what the system can and cannot verify.

Hybrid retrieval improves recall, but only authority, applicability, admission, effectivity, and coverage checks may authorize assessment use.

## Foreign-country challenge

The selected countries remain UAE, China, and the US. The plan now prevents a misleading interpretation of “complete”:

- UAE cases may require an entry emirate or port;
- China cases may have port, province, or product-specific authority conditions;
- US customs/federal product rules do not automatically cover state/local sale or operating obligations.

The app asks for those details only when they materially change the checklist. Uncovered subnational or downstream obligations are shown as exclusions or gaps, not silently treated as cleared.

## UX and trust challenge

The adversarial UX standard is: a user must understand the result without mistaking the interface for official approval.

Therefore:

- no green “compliant” badge;
- no celebratory complete-state animation;
- no hidden source or coverage drawer that contains the only caveat;
- every assessment card shows checked, not checked, last verified, sources, and next step;
- missing data and unavailable integrations are first-class results;
- citations are inline and clickable;
- mobile preserves case identity, composer access, citations, and status details without horizontal overflow.

## Deferred risks, explicitly outside this phase

These are visible but do not block the local implementation:

- multi-user identity, tenancy, and authorization;
- hosted durable graph/database and object storage;
- scheduled corpus refresh and production ingestion operations;
- paid or login-protected government integrations;
- filing, payment, shipment, licensing, and authenticity-verification integrations;
- a production learning pipeline or any model training;
- formal legal review of the assistant’s advice.

The local architecture must expose interfaces for these seams but must not implement them now.

## Approval invariants

The adversarial review withdraws approval if implementation:

- uses country selection, model confidence, or search absence as proof of completeness;
- allows provisional, secondary, stale, conflicting, or uncited evidence to support a positive assessment;
- releases final factual compliance prose before citation validation;
- mixes Trade Case facts;
- hides connector or scope gaps;
- includes seeded/fabricated production policies, rates, documents, statuses, cases, or citations;
- represents Border Charge Estimate as a guaranteed landed cost or payable demand;
- claims document authenticity, legal authority, filing, payment, live status, or clearance;
- expands the local phase into deployment or training infrastructure.

## Final verdict

The original plan was **not approved** because its broad any-product/country language, provisional web-evidence path, prompt-only citation rule, and undefined scope could produce unjustified positive conclusions.

The revised plan is **approved** because it preserves natural any-product assistance and the selected destinations while making completeness, evidence admission, citations, calculations, case isolation, learning consent, and UX trust machine-enforced and visible.

Approval authorizes planning only. Implementation remains paused until the user explicitly confirms the revised shared understanding.
