# Agent-first trade compliance assistant — shared understanding

**Status:** Adversarially approved; awaiting explicit implementation confirmation
**Scope date:** 2026-08-25
**Phase:** Complete local development; deployment remains visible but out of scope
**Adversarial review:** `docs/reviews/2026-08-25-agent-first-trade-compliance-adversarial-review.md`

## Product promise

Replace the form-first India Import Preflight prototype with one focused, ChatGPT-like India Trade Compliance Assistant built with the OpenAI Agents SDK.

The assistant advises, explains, researches, calculates, and helps users prepare. It does not act as a customs authority, give legal approval, file declarations, make payments, submit applications, verify document authenticity, track live shipments, or guarantee clearance.

It supports:

- imports into India;
- exports from India;
- destination-side assessments for the United Arab Emirates, China, and the United States when the exact case passes the Coverage Manifest;
- cited Research Guidance for other countries or uncovered regulatory domains;
- natural questions about any product, without pretending that every product has complete regulator coverage.

“Any product” describes the conversation and research reach. It does not waive the evidence gate.

## What “complete” means

**Assessment Complete Within Verified Scope** means that, for the displayed jurisdictions, border stage, route, Regulatory Domains, product and intended use, parties, and effective date:

1. the Applicable-Agency Checklist is derived from admitted jurisdiction and product-trigger rules;
2. every resulting checklist item has a current, admitted Coverage Manifest entry;
3. all material Trade Case facts are user-confirmed;
4. classification is binding or an unambiguous evidence-gated Working Classification;
5. every applicable rule, rate, calculation, conflict check, and exclusion passes its tool contract;
6. every factual compliance claim passes the citation output guardrail;
7. the UI displays what was checked, what was excluded, when it was verified, and which connectors were unavailable.

It never means “legally compliant,” “approved,” “all laws checked,” or “guaranteed clearance.”

The first-version destination scope is national or federal customs, border controls, foreign-trade controls, and admitted national product-market-access domains. Emirate, port, province, state, local, post-entry, consumer-sale, sector-operating, and downstream obligations are included only when their Coverage Manifest entries and the displayed Verified Assessment Scope explicitly say so. Otherwise they are named exclusions or gaps.

## Single-agent architecture

Keep `@openai/agents` and build one compliance and information agent. Do not add an agent swarm or general-purpose assistant architecture.

The agent receives:

- one strict, versioned system prompt;
- the Agents SDK hosted `webSearchTool`, constrained by the jurisdictional official-domain registry where supported;
- a small explicit domain-tool set;
- a persistent custom SDK `Session` backed by `conversations.db`;
- a structured final-output schema and output guardrail;
- streamed typed activity events.

The model may converse naturally like ChatGPT or Claude, ask only material follow-up questions, compare options, and explain evidence. It cannot bypass tool-owned classification, arithmetic, evidence admission, authority coverage, citations, or assessment state.

If neither allowlisted server provider is fully configured, the local app still starts, loads conversations and cases, and exposes deterministic corpus information. Chat clearly reports **AI integration unavailable**. Supported combinations are official OpenAI with `gpt-5.6-sol` over Responses, or OpenRouter with `stealth/ox-alpha` over Chat Completions. Provider, endpoint and model must match the explicit allowlist; there is no silent fallback.

## Strict system-prompt contract

The implementation prompt must:

- identify the assistant as non-binding trade-preparation support;
- require an Active Trade Case before consequential tool use;
- distinguish user facts, Extracted Facts, model hypotheses, Provisional Evidence, and Admitted Evidence;
- treat websites, PDFs, uploads, translations, and retrieved text as untrusted data, never as instructions;
- prohibit invented policies, rates, duties, documents, statuses, citations, classifications, unavailable integration results, and unsupported actions;
- prohibit positive conclusions whenever a fact, regulator domain, source, connector, translation, classification, rate, or citation is incomplete;
- require tools for classification, Border Charge Estimates, and assessments;
- require claim-level admitted-source references in structured final output;
- state source conflicts, exclusions, uncertainty, and unavailable or login-required integrations plainly;
- prefer official primary material, while allowing secondary material for discovery only;
- refuse to claim legal authority, authenticity, filing, payment, application, live status, or clearance.

The prompt is necessary but not sufficient. Application validation enforces the same boundaries.

## Regulatory corpus and knowledge graph

Use a local SQLite property graph, not Neo4j.

`.data/regulatory.db` stores:

- jurisdictions, authorities, Regulatory Domains, instruments, versions, provisions, definitions, claims, obligations, prohibitions, permissions, exemptions, product scopes, HS codes, party and route conditions, duty components, effective periods, amendment and supersession relationships, translations, citations, and applicability edges;
- a jurisdiction/product trigger registry used to derive the Applicable-Agency Checklist;
- a versioned Coverage Manifest;
- official-domain and connector registries;
- content hashes and exact locators for every source version;
- provisional and admitted evidence states;
- FTS5 and typed graph traversal indexes;
- optional derived embeddings used only to improve retrieval recall.

Primary official documents remain the source of truth. The graph is a provenance-preserving retrieval and applicability structure, not legal authority.

Retrieval is hybrid:

1. exact instrument, identifier, and HS-code matches;
2. FTS5 over original and derived text;
3. bounded semantic similarity when enabled;
4. typed graph traversal;
5. deterministic ranking by authority, scope, effectivity, admission state, and freshness.

Embeddings and model similarity are retrieval aids only. They cannot establish applicability, absence, or a positive assessment.

## Runtime and local data

Use server-only `node:sqlite` on Node 24 or newer. Raise the repository engine floor from its current Node 20-compatible declaration during implementation.

Local state is:

- `.data/regulatory.db` — corpus, graph, manifest, connectors, and evidence;
- `.data/conversations.db` — conversations, cases, messages, confirmed facts, and assessment snapshots;
- `.data/learning.db` — opted-in redacted learning contributions only;
- `.data/sources/<sha256>/...` — immutable admitted official-source snapshots;
- a schema-migration ledger for every database.

The data directory is gitignored. Database access stays behind a server-only data-access layer, uses prepared statements, validates all tool inputs, and keeps synchronous SQLite operations bounded. No Docker service, graph server, watcher, or background sync daemon is required.

## Coverage Manifest

The Coverage Manifest is the answer to the adversarial question: “How can the system know it has checked enough to say complete?”

Each entry records:

- jurisdiction and trade direction;
- border, national/federal, route, and any admitted subnational scope;
- product, HS, intended-use, party, and transaction triggers;
- Regulatory Domain and competent authority;
- official source family and connector;
- evidence admission state and source versions;
- freshness policy and last verification;
- known exclusions and connector state;
- validation and schema version.

Country-module availability alone never authorizes a complete assessment. The assessment tool compares the case-specific Applicable-Agency Checklist to the manifest and fails closed on absent, provisional, stale, conflicting, manual, login-required, temporarily unavailable, or unsupported coverage.

The initial corpus contains the core customs, foreign-trade, tariff, prohibition, sanctions, trade-remedy, and regulator-trigger instruments needed to derive coverage for India, UAE, China, and the US. Product-specific sources are admitted on demand. The plan does not claim to preload “all rules and regulations.”

Acceptance requires at least one real, fully evidenced reference journey for imports into India and one India-export journey to each Launch Destination. These prove the mechanism; they do not turn their products into the only products the chat accepts.

## Official sources and language

Initial official source families include:

- India: India Code, eGazette, DGFT, CBIC, ICEGATE, DGTR, BIS, WPC/DoT, MeitY, and case-triggered government authorities;
- United States: USITC HTS data, CBP regulations and rulings, Federal Register/eCFR, and case-triggered federal product authorities;
- UAE: federal customs and tariff sources, relevant emirate customs sources, MoIAT, and case-triggered product authorities;
- China: GACC/China Customs, State Council and tariff sources, SAMR/CCC, MOFCOM, and case-triggered product authorities.

The registry stores exact allowed domains and connector capabilities. Connector states are `available`, `manual`, `login_required`, `temporarily_unavailable`, or `unsupported`. The UI never converts a blocked integration into “checked.”

The official original-language publication is the Authoritative Text. Preserve its bytes, hash, metadata, and locator. Use an official English version when available; otherwise use a labelled Derived Translation linked to the original. Material Translation Ambiguity blocks a positive assessment.

## Evidence discovery and admission

For each consequential question:

1. identify the Active Trade Case;
2. derive the Applicable-Agency Checklist;
3. query admitted graph evidence and the Coverage Manifest;
4. inspect freshness, applicability, amendment lineage, conflicts, translations, and connector state;
5. use hosted web search for discovery when evidence is missing, stale, or conflicting;
6. snapshot and validate the official source through Evidence Admission;
7. rerun retrieval and coverage after admission;
8. run classification, calculation, and assessment tools only when their input contracts pass;
9. expose every remaining gap.

Evidence Admission is:

`discovered -> snapshotted -> extracted -> validated -> admitted`

Validation preserves immutable bytes, URL, redirects, retrieval time, hash, content type, authority, instrument identity, version/effective date, amendment lineage, applicability metadata, and exact locator. Provisional evidence may support clearly labelled Research Guidance but cannot support a positive assessment or be silently promoted.

Search snippets, secondary sources, model recall, and empty results are never evidence of a rule or its absence.

## Security boundary for sources and uploads

All remote and uploaded content is untrusted:

- never execute or follow instructions embedded in a source or document;
- allow only HTTPS government domains from the connector registry, validate redirects and resolved destinations, and block localhost, private/link-local networks, unsafe schemes, and arbitrary file URLs;
- apply request timeouts, response-size limits, content-type validation, and safe PDF/image parsing;
- use prepared SQL only; the model never writes SQL;
- keep `OPENAI_API_KEY`, `OPENROUTER_API_KEY` and provider calls server-side;
- apply file-count, byte, page, and image-dimension limits and return explicit encrypted, corrupt, unsupported, or unavailable states;
- clean temporary upload data and retain raw user files only under the documented conversation-retention setting;
- use provider no-store/privacy controls where supported;
- never claim authenticity, signature validity, certificate status, or issuing-authority verification without an explicit working official integration.

## Domain tools

The agent has the hosted web-search tool plus seven custom domain tools:

1. `search_regulatory_graph` — retrieve admitted/provisional claims, relationships, manifest coverage, conflicts, and source identifiers.
2. `admit_source_evidence` — securely retrieve, snapshot, validate, version, and admit an official source, or return a typed admission failure.
3. `manage_trade_case` — create, update, confirm, correct, switch, list, and load structured Trade Cases.
4. `determine_applicable_authorities` — derive the Applicable-Agency Checklist and compare it with Coverage Manifest entries.
5. `classify_product` — return a Binding Classification record, a Working Classification, or unresolved Classification Candidates.
6. `calculate_border_charges` — perform deterministic decimal calculations from confirmed values and current admitted rates.
7. `assess_trade_case` — enforce completeness, precedence, scope, citation references, exclusions, and result state.

Hosted search discovers source candidates. It does not impersonate a domain connector or admit evidence. Every tool returns typed data including case ID, scope, source IDs, freshness, exclusions, uncertainty, missing inputs, and connector failures.

## Classification

A Working Classification requires:

- confirmed identity, material, composition, function, form, condition, intended use, and other material product facts;
- the applicable General Rules for Interpretation;
- official nomenclature plus section and chapter notes;
- explicit reasons for including the selected heading and excluding plausible alternatives;
- no unresolved material ambiguity.

Model confidence never substitutes for this record. Ambiguity produces Classification Candidates and blocks a positive assessment. A competent authority’s Binding Classification takes precedence inside the ruling’s scope.

## Border Charge Estimates

`calculate_border_charges` uses decimal-safe arithmetic and returns:

- formula and component order;
- confirmed customs value, quantity, currency, origin, route, classification, and effective date;
- cited duty, border-tax, surcharge, cess, or official-fee rates;
- currency source and date when conversion is needed;
- rounding rules, assumptions, exclusions, and source IDs.

It withholds a number when classification, valuation method, origin treatment, rate, currency, date, or another material input is unresolved.

It does not call its result “landed cost.” Freight quotations, insurance quotations, brokerage, storage, demurrage, domestic tax consequences, post-entry costs, incentives, drawbacks, and refunds are excluded unless a separately verified tool and manifest domain are added later.

## Structured answers, citations, and streaming

Permitted high-level states are:

- **Research Guidance**;
- **Assessment Incomplete**;
- **Action Required**;
- **Assessment Complete Within Verified Scope**.

Final regulatory output is structured as:

- answer state and Active Trade Case;
- Validated Claim Blocks;
- calculations;
- missing information and unresolved evidence;
- source conflicts;
- connector failures;
- Verified Assessment Scope and exclusions;
- last-verified times and source list;
- suggested preparation steps and permitted next actions.

Every Validated Claim Block carries claim text, scope, certainty, admitted source IDs, and exact locators. The application resolves source IDs from the database and an Agents SDK output guardrail rejects missing, unknown, stale, provisional, conflicting, or scope-mismatched evidence. Markdown links produced only by the model do not satisfy this contract.

The UI may stream typed progress events—searching, checking, extracting, calculating—and non-regulatory conversational text. Final factual compliance claims appear only after guardrail validation. Validate the request before opening the stream; later failures emit typed incomplete/error events because HTTP status cannot change after streaming begins.

Every accepted assessment is persisted as an immutable Assessment Snapshot containing case facts, prompt/model/tool versions, tool outputs, source versions, claim blocks, calculations, manifest state, scope, and result.

## Conversation and case memory

The interface behaves as an open ChatGPT-style Conversation. A conversation may include general questions, comparisons, and multiple Trade Cases.

`conversations.db` persists:

- conversations and messages;
- structured Trade Cases and their confirmed fact versions;
- Extracted Facts, provenance, confirmation, corrections, and supersession;
- Active Trade Case state;
- tool-call and source references;
- immutable Assessment Snapshots.

Consequential tools require an explicit case ID. A case switch is visible, corrections create new fact versions, and tools cannot read facts from another case by recency or conversational proximity.

## Learning dataset

`learning.db` is separate from regulatory knowledge and ordinary conversation memory.

Only an explicit Learning Contribution enters it. The contribution contains:

- immutable consent time and consent-contract version;
- a redacted copy, never a pointer that silently changes;
- dataset schema, prompt, model, tool, and evaluator versions;
- relevant tool traces, citations, corrections, ratings, preferred answers, or verified outcomes;
- a meaningful Feedback Signal;
- withdrawal status.

The local phase creates a governed offline evaluation/future-training dataset. It does not automatically train, fine-tune, perform reinforcement learning, update weights, or upload conversations. Ordinary conversations remain deletable. A user may withdraw a contribution before any later export/training action; any such action is a separate future phase requiring review and consent.

## Document handling

Replace the synthetic hash-pinned invoice demonstration with real PDF and image input for invoices, product specifications, and certificates.

Document processing:

- extracts visible facts only;
- stores page/region provenance, extraction method, and confidence;
- requires user confirmation or correction before a fact enters a Trade Case;
- treats document content as untrusted data;
- never converts an observation directly into a legal conclusion;
- never claims authenticity, validity, signature verification, certificate status, or issuing-authority confirmation without a real integration;
- states encrypted, corrupt, unreadable, unsupported, or over-limit files plainly.

No example upload, seeded case, recorded response, or fabricated source appears in a production path.

## Responsive chat UX

Keep the interface a calm, high-trust chat rather than a compliance dashboard:

- conversation sidebar, collapsing to a mobile drawer;
- one visible Active Trade Case pill with an accessible case switcher;
- streaming activity and natural assistant messages;
- multiline sticky composer with attachments;
- inline clickable citations;
- collapsible evidence, coverage, calculation, conflict, and exclusion details;
- an assessment card showing **checked**, **not checked**, **last verified**, **sources**, and **next preparation step**;
- neutral scoped states rather than green “compliant,” “approved,” or celebratory success language;
- delete and learning-contribution controls with clear consequences.

Accessibility and responsiveness are acceptance criteria: keyboard navigation, visible focus, accessible names, 44px controls, reduced motion, useful live-region behavior, no color-only status, no horizontal overflow at 360px, and usable error/empty/loading states. Motion is limited to purposeful progress and state transitions.

## Reuse and removal

Reuse after revalidation:

- OpenAI Agents SDK integration and privacy configuration;
- Zod validation boundaries;
- decimal-safe calculation techniques;
- source metadata and fail-closed gating concepts;
- the document-extraction boundary that allows visible facts but no legal conclusion;
- accessibility and responsive test patterns.

Replace or remove:

- fixed product selectors and the product-pack lifecycle as the public boundary;
- form-first `Journey` and sticky report UX;
- hard-routed product packs in `/api/preflight`;
- synthetic-only invoice hash, recorded extraction, seeded examples, and fabricated production data;
- static rates or regulatory claims without admitted current evidence;
- promotion harnesses, demo ticket flows, obsolete architecture, and unused dependencies.

Removal is scoped to obsolete app paths. Sound validation, calculation, citation, and test utilities are retained when they satisfy the new contracts.

## Small high-value test suite

Use real, hash-pinned official-source snapshots for deterministic tests. They remain test resources and never seed the production corpus. Minimal transaction inputs are explicitly test-only; no test fixture is displayed as a real shipment, ruling, policy, or status.

The suite has five groups:

1. **Evidence and graph contracts** — admission states, immutable snapshots, amendment/effective dates, hybrid retrieval, Coverage Manifest matching, connector failure, conflict handling, and exact citation resolution.
2. **Tool and guardrail contracts** — Working Classification ambiguity, Binding Classification precedence, decimal Border Charge Estimate from pinned official rates, missing-input blocking, invalid claim rejection, and no positive state with incomplete coverage.
3. **Memory and learning contracts** — persistent SDK session, multi-case isolation, confirmed-fact versioning, deletion, explicit contribution consent, redaction, and withdrawal.
4. **Document trust contracts** — visible-fact provenance and confirmation, encrypted/corrupt/over-limit handling, and embedded prompt-injection resistance.
5. **Browser journeys** — cited Research Guidance, visibly incomplete assessment, a complete verified-scope assessment, multi-case switch/upload, keyboard access, automated accessibility checks, desktop, and 360px.

Default tests do not require an API key and test deterministic domain boundaries directly. An opt-in live suite uses the configured model and real official connectors to detect integration drift; it never replaces deterministic contract tests.

Before completion run lint, type checking, focused tests, full deterministic tests, production build, optional live tests when credentials are available, local runtime, responsive browser journeys, citation-link checks, and process cleanup.

## Implementation sequence after confirmation

1. **Retire obsolete boundaries** — lock reusable behavior with focused tests, remove production fixtures/product routing, and establish Node 24/data migrations.
2. **Build evidence substrate** — source snapshots, admission state machine, graph schema, Coverage Manifest, connector registry, corpus sync, and case memory.
3. **Build domain contracts** — authority derivation, classification, Border Charge Estimate, assessment gating, structured claims, and output guardrail.
4. **Wire the one agent** — strict prompt, hosted web search, custom Session, typed activity stream, unavailable-key state, and assessment snapshots.
5. **Replace the UI** — responsive chat, case and document flows, citations, coverage/evidence/calculation panels, accessibility, and restrained motion.
6. **Verify real journeys** — India import plus India export to UAE, China, and US, fail-closed gaps, tests, build, local run, and exact documentation.

No implementation begins until the user explicitly confirms this revised shared understanding.

## Local acceptance

Completion requires:

- `npm install` and documented Node 24+ setup;
- explicit `knowledge:sync` and migration commands;
- one documented local development command;
- a clean start without an API key and a working chat with one;
- no mock, seed, recorded response, fabricated policy/rate/status/citation, or synthetic upload in production paths;
- real official-source snapshots and real deterministic formulas;
- per-claim clickable citations and visible scope/freshness;
- fail-closed behavior for every incomplete case;
- passing focused/full tests, type check, lint, build, browser/accessibility checks;
- verified process and listener cleanup instructions.

## Deployment boundary

Keep data-access interfaces, source snapshot storage, secrets, source refresh, model allowlisting, identity/tenancy, and hosted-database migration visible. Local SQLite and local files are not represented as serverless-safe or durable deployment storage.

Do not add deployment infrastructure, authentication, hosted storage, scheduled jobs, production ingestion workers, or model-training pipelines in this phase.
