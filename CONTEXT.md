# India Trade Compliance

This context covers advisory support for businesses preparing commercial goods for import into or export from India. It deliberately stops short of acting as a customs authority or performing regulated transactions.

## Language

**India Trade Compliance Assistant**:
The single advisory agent that helps users research, understand, calculate, and prepare for commercial imports into or exports from India.
_Avoid_: General trade platform, customs authority, legal adviser

**Trade Preparation**:
Pre-transaction and pre-shipment preparation for goods entering or leaving India, including customs-clearance information. It excludes live shipment tracking, customs filing, payments, licence applications, and post-clearance disputes.
_Avoid_: End-to-end customs clearance, shipment execution

**Destination Module**:
A versioned set of official-source connectors, Coverage Manifest entries, graph claims, applicability checks, and calculation rules for the supported national or federal import scope of one foreign jurisdiction. Route- or subnational rules are included only when the displayed Verified Assessment Scope says so.
_Avoid_: Country summary, generic foreign guidance

**Launch Destination**:
One of the three foreign jurisdictions with first-version Destination Modules: the United Arab Emirates, China, and the United States. Assessment completeness remains case-specific and depends on the Coverage Manifest.
_Avoid_: Any foreign market, worldwide coverage

**End-to-End Export Assessment**:
A Compliance Assessment that combines India-side export requirements with every admitted destination-side Regulatory Domain in the displayed Verified Assessment Scope.
_Avoid_: India-only export check, worldwide compliance guarantee

**Regulatory Domain**:
A distinct body of requirements that may apply to a Trade Case, such as customs, foreign-trade controls, sanctions, product safety, labelling, licensing, standards, or trade remedies. Applicable domains are derived from product, use, parties, origin, destination, route, and date rather than from a fixed universal checklist.
_Avoid_: Agency name only, generic compliance category

**Coverage Manifest**:
A versioned, machine-readable ledger stating which jurisdiction, trade direction, product or HS scope, Regulatory Domain, authority, connector, source family, and freshness rule the assistant can verify. An absent, stale, failed, or merely provisional manifest entry is a coverage gap and prevents a positive Compliance Assessment.
_Avoid_: Marketing coverage claim, list of websites, model knowledge

**Verified Assessment Scope**:
The explicit combination of jurisdictions, border stage, Regulatory Domains, product and route conditions, effective date, authorities checked, exclusions, and last-verification times covered by one assessment. “Complete” is meaningful only inside this displayed boundary.
_Avoid_: Entire law, all commercial activity, worldwide compliance

**Regulatory Knowledge Corpus**:
The versioned collection of official source documents and extracted regulatory claims used by the assistant. Every claim retains its source, authority, effective dates, retrieval time, and review status.
_Avoid_: Agent memory, universal rulebook, model knowledge

**Authoritative Text**:
The original-language text published by the responsible authority. It controls when an official or machine-produced English rendering differs or is ambiguous.
_Avoid_: Model translation, unofficial summary

**Derived Translation**:
An English rendering linked to an Authoritative Text and labelled with its translation method. It aids retrieval and explanation but does not replace the original instrument unless the authority published it as an official version.
_Avoid_: Official English version, controlling text

**Translation Ambiguity**:
A material uncertainty between the Authoritative Text and a Derived Translation that could change applicability, duty, or required action. It is an Unresolved Evidence Gap.
_Avoid_: Harmless wording difference

**Compliance Knowledge Graph**:
A queryable, provenance-preserving representation derived from the Regulatory Knowledge Corpus. It helps retrieve applicable evidence but is not itself a legal authority or permission to infer missing rules.
_Avoid_: Source of truth, complete law database, autonomous policy engine

**Regulatory Database**:
The local SQLite property graph containing versioned corpus metadata, claims, applicability conditions, citations, and typed relationships. It contains no user conversation data.
_Avoid_: Conversation store, model memory, Neo4j server

**Corpus Sync**:
An explicit local refresh that retrieves primary official sources, preserves content-addressed versions, and updates provisional graph claims without running a background daemon.
_Avoid_: Silent background update, model-memory refresh

**Provisional Evidence**:
Official-source material discovered by Corpus Sync or Live Official Research that is versioned in the graph but has not yet passed every admission check required for a complete assessment.
_Avoid_: Trusted rule, verified absence, model fact

**Official Source Snapshot**:
Immutable retrieved bytes plus URL, retrieval time, content type, hash, authority metadata, redirect chain, and exact locator for an official publication or database record.
_Avoid_: Search-result snippet, copied model text, mutable bookmark

**Evidence Admission**:
The stateful process `discovered -> snapshotted -> extracted -> validated -> admitted` that verifies official authority, instrument identity, effective or amendment lineage, applicability metadata, and locator before evidence may support a positive Compliance Assessment.
_Avoid_: Web result found, automatic trust, silent graph promotion

**Admitted Evidence**:
An Official Source Snapshot and its extracted claim that passed Evidence Admission for a declared use and scope. Admission is version-specific and can expire or be superseded.
_Avoid_: Generally true rule, permanent fact, provisional evidence

**Connector State**:
The current operating state of an official-source integration: `available`, `manual`, `login_required`, `temporarily_unavailable`, or `unsupported`. Any state other than `available` is shown when relevant and cannot be disguised as a successful check.
_Avoid_: Hidden tool failure, assumed access

**Time-Sensitive Evidence**:
A tariff, sanction, trade remedy, restriction, exchange rate, or other claim whose current applicability must be reverified during each assessment.
_Avoid_: Permanent graph fact, cached rate

**Live Official Research**:
On-demand retrieval from relevant government sources when graph evidence is missing, stale, or conflicting. Retrieved evidence may support the current answer when it has an exact locator and applicability basis, but discovery alone does not prove that every applicable rule has been found.
_Avoid_: General web search, gap-free proof, automatic approval

**Applicable-Agency Checklist**:
The evidence-backed set of authorities and regulatory domains that must be checked for a particular product and trade transaction before a positive Compliance Assessment is possible.
_Avoid_: Search results, generic checklist, model intuition

**Unresolved Evidence Gap**:
A missing, stale, inaccessible, ambiguous, or conflicting item in the Applicable-Agency Checklist after Live Official Research. It prevents a positive Compliance Assessment but does not prevent clearly scoped Research Guidance.
_Avoid_: No regulation applies, search returned nothing

**Compliance Citation**:
A clickable reference from a factual compliance claim to its authority, instrument, version or date, and exact section, page, table, or record locator.
_Avoid_: Search-result link, source list, uncited summary

**Validated Claim Block**:
A structured answer element whose factual claim, scope, certainty, source identifiers, exact locators, and evidence freshness have passed the application citation guardrail. Regulatory prose that has not passed this validation is not released as a final compliance claim.
_Avoid_: Markdown with a plausible link, model-generated citation

**Source Conflict**:
Two or more official sources that appear to prescribe materially different outcomes and whose authority, amendment chain, scope, or effective dates do not resolve the difference. It is an Unresolved Evidence Gap.
_Avoid_: Silently choosing the newest source, majority view

**Conversation Memory**:
Persistent user and conversation context, such as previously supplied product and shipment facts. It must remain separate from the Regulatory Knowledge Corpus and cannot establish a regulatory fact.
_Avoid_: Knowledge graph, regulation store

**Conversation**:
A natural, persistent ChatGPT-like interaction that may contain general questions, comparisons, and multiple Trade Cases.
_Avoid_: Single shipment form, one-case-only chat

**Trade Case**:
The structured product, direction, route, party, shipment, and value facts for one intended transaction inside a Conversation. Calculations and Compliance Assessments operate on an explicitly identified Trade Case so facts from different transactions cannot mix.
_Avoid_: Entire conversation, global user profile

**Active Trade Case**:
The Trade Case currently selected for a tool-backed calculation or assessment. The assistant must identify it before consequential tool use and switch it when the user changes product or route.
_Avoid_: Last product mentioned, implicit global context

**Conversation Database**:
The separate local SQLite database that persists conversations and user-supplied trade facts. Its contents cannot create, amend, or override anything in the Regulatory Database.
_Avoid_: Regulatory database, shared rule store

**Learning Dataset**:
The separate local SQLite store of explicitly contributed, redacted conversations, tool traces, citations, corrections, and feedback signals prepared for later offline model improvement.
_Avoid_: Conversation memory, automatic reinforcement learning, regulatory knowledge

**Learning Contribution**:
A conversation the user explicitly opts into the Learning Dataset. Contribution is separate from ordinary persistence and does not itself train, fine-tune, or update a model.
_Avoid_: Default retention, silent training consent

**Feedback Signal**:
An explicit rating, correction, preferred answer, or verified outcome attached to a Learning Contribution so later evaluation or training has a meaningful quality signal.
_Avoid_: Conversation count, model confidence

**Research Guidance**:
Cited information that can cover any product while clearly identifying missing facts, source conflicts, and limits. It is not a positive compliance conclusion.
_Avoid_: Approval, clearance, compliance verdict

**Compliance Assessment**:
A dated, tool-produced evaluation released only when all material product, direction, shipment, party, and current official evidence required by that tool are available.
_Avoid_: Legal opinion, customs approval, guaranteed clearance

**Assessment Incomplete**:
A tool-backed result with at least one Unresolved Evidence Gap or missing confirmed Trade Case fact. It identifies what is missing and cannot express a positive conclusion.
_Avoid_: Failed assessment, probably compliant

**Action Required**:
A tool-backed result identifying a sourced obligation, restriction, or unresolved condition that the Trade Case must address before proceeding.
_Avoid_: Customs rejection, legal order

**Assessment Complete Within Verified Scope**:
A tool-backed result issued only when the Applicable-Agency Checklist and Coverage Manifest agree, every applicable Regulatory Domain is current and admitted, and the Trade Case facts, classification, sources, and calculations have no unresolved gaps inside the displayed Verified Assessment Scope. It is advisory and never means legal approval or guaranteed clearance.
_Avoid_: Compliant, approved, guaranteed clearance

**Assessment Snapshot**:
The immutable record of the Trade Case facts, tool outputs, source versions, citations, calculations, scope, and result state used for one assessment.
_Avoid_: Current law, reusable verdict

**Extracted Fact**:
A product, document, party, shipment, or value fact obtained from an uploaded file with visible provenance and confidence. It cannot enter a Trade Case until the user confirms or corrects it.
_Avoid_: Verified fact, authentic document evidence

**Working Classification**:
A non-binding HS classification produced by an explicit tool when confirmed product facts, the applicable General Rules for Interpretation, official nomenclature and legal notes, and explicit exclusion of plausible alternative headings support one code without unresolved ambiguity.
_Avoid_: Binding classification, model guess, guaranteed HS code

**Classification Candidate**:
One of multiple plausible HS headings presented when the available facts or legal interpretation do not support a single Working Classification. It cannot drive a positive Compliance Assessment.
_Avoid_: Final classification, selected code

**Binding Classification**:
A product- and transaction-specific classification issued by the competent customs authority. It overrides a conflicting Working Classification within its stated scope.
_Avoid_: Agent classification, user-selected code

**Border Charge Estimate**:
A deterministic, dated calculation of admitted customs duties, border taxes, and official border fees from confirmed classification, origin, customs value, route, currency, and cited rates. Freight quotations, brokerage, storage, demurrage, domestic tax consequences, and unverified incentives are excluded unless separately covered and displayed.
_Avoid_: Guaranteed landed cost, quotation, payable customs demand
