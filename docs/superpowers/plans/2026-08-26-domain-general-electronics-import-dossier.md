# Domain-General Electronics Import Dossier — Scope-Locked Implementation Plan

**Decision:** Replace the generic “official-source viewer” instant response with a trait-driven China-to-India electronics import agent. Preserve the existing case memory, evidence admission, deterministic calculation, document intake, and opt-in deep-research machinery.

**Execution target:** One bounded 3–4 hour implementation run, split into one independently scoped implementation task per Codex chat. Only disjoint tasks run concurrently; the coordinator alone creates tasks, waits for reports, verifies allowlists, and advances the dependency gates.

**Core promise:** For any electronics product, the agent first gathers the shipment facts needed to make a useful decision, then returns a complete action dossier. Every conclusion is derived from confirmed product traits plus admitted official evidence. Where evidence or facts are insufficient, the dossier remains complete but marks the affected item `Pending`; it never invents a rule, portal, fee, filing, or clearance result.

## 1. Locked product ideology

The product is not a chatbot that summarizes portals. It is a preparation and decision agent for people importing electronics from China into India.

The runtime must:

1. Accept any electronics product description, URL, photo, datasheet, invoice, or bill.
2. Understand the product through regulatory traits—not product-name branches or fixed product packs.
3. Distinguish personal versus commercial imports and pre-purchase versus already-purchased cases.
4. Convert admitted official policy into ordered actions, documents, exact policy locators, filing portals, forms, contacts, costs, blockers, owners, and sequence.
5. Show `Required`, `Clear`, or `Pending` for every material dossier item.
6. Keep live web/agent research optional and use it only to fill missing or stale evidence; indexed evidence must answer locally.
7. Never claim a filing was made, a portal was accessed behind login, a fee was paid, or Customs clearance is guaranteed.

“All electronics” means domain-general intake and trait-driven reasoning. It does not authorize fake universal coverage. An unfamiliar product must still receive the complete dossier structure, with unsupported branches marked `Pending` and the exact authority or professional that must confirm them.

## 2. Scope boundary

### In scope

- Trade lane: China to India only.
- Product domain: electronics and electrical/electronic assemblies, including unfamiliar products supplied only at runtime.
- Purposes: personal and commercial.
- Purchase stages: considering/pre-purchase and already-purchased/post-purchase.
- Intake fields:
  - product description and principal function;
  - quantity;
  - price per piece and currency;
  - origin PIN/postal/location and destination PIN/port;
  - product URL, photo, model, datasheet, or technical specifications;
  - purchase status;
  - invoice, bill, or proof of purchase when already purchased;
  - personal or commercial purpose;
  - freight, insurance, and Incoterm when needed for cost calculation.
- Regulatory trait vocabulary at minimum: radio/wireless, cellular/telecom, battery, external power supply, camera/video, encryption, sensing/measurement, used/refurbished, retail-packaged, and controlled/end-use uncertainty.
- Dossier sections always returned:
  1. immediate decision and blockers;
  2. documents to prepare;
  3. exact policy paragraphs/pages/locators to review;
  4. online forms and verified government portal links;
  5. points of contact and responsible owner;
  6. classification and regulatory checks;
  7. duties/cost inputs, available calculations, and unresolved cost blockers;
  8. ordered next actions.
- Official evidence and portal metadata for the baseline India import path plus trait-triggered authorities represented by admitted sources.
- Existing uploads, case memory, conflict handling, citations, and opt-in deep research remain available.

### Explicitly out of scope

- India-to-China as an active journey; preserve its code and data but do not expand or delete it.
- Non-electronics products.
- Logging into portals, submitting forms, paying fees, booking inspections, tracking filings, or representing the user.
- Guaranteed HS classification, duty, approval, or Customs clearance where the required evidence is absent.
- Automatic/background regulatory monitoring, embeddings, a vector database, a new provider/model, authentication, deployment, Plane, commits, or pushes.
- New pages, navigation, branding, design-system replacement, animation work, or visual redesign.
- Extending the old router/headphones/camera product-pack architecture or using those packs in the new runtime path.
- Cleanup, reset, stash, or modification of unrelated dirty work.

### Scope-change rule

The scope is immutable during the run. A worker may not add a country, trade direction, product catalog, product-name branch, dependency, provider, autonomous background job, page, or filing capability. If a prerequisite is missing, the worker stops and reports it. Any scope expansion requires explicit user approval and removal of equal or greater work from this plan.

## 3. Architecture contract

### 3.1 Product understanding layer

Create a canonical `ElectronicsImportIntake` and `ElectronicsProfile` independent of product names.

```ts
type PurchaseStage = "pre_purchase" | "already_purchased";
type ImportPurpose = "personal" | "commercial";
type DossierStatus = "required" | "clear" | "pending";

interface ElectronicsImportIntake {
  direction: "china_to_india";
  productDescription: string;
  principalFunction?: string;
  quantity?: string;
  unitPrice?: string;
  currency?: string;
  originLocation?: string;
  destinationLocation?: string;
  productUrl?: string;
  productModel?: string;
  technicalSpecifications?: string;
  purchaseStage?: PurchaseStage;
  purchaseEvidenceDocumentIds: string[];
  purpose?: ImportPurpose;
  freight?: string;
  insurance?: string;
  incoterm?: string;
}

interface RegulatoryCharacteristic {
  id: string;
  namespace: "product" | "radio" | "telecom" | "battery" | "power" | "camera" | "encryption" | "packaging" | "end_use" | "classification";
  value: string | number | boolean | "unknown";
  unit?: string;
  basis: string;
  provenance: "user" | "document" | "url" | "derived";
  confirmed: boolean;
}

interface ElectronicsProfile {
  intake: ElectronicsImportIntake;
  characteristics: RegulatoryCharacteristic[];
  classificationCandidates: Array<{
    system: "ITC_HS" | "BIS_CRS" | "TEC_MTCTE" | "WPC_ETA" | "OTHER";
    codeOrEntry: string;
    evidenceState: "admitted" | "pending";
    claimId?: string;
    sourceVersionId?: string;
    exactLocator?: string;
    missingThresholdFacts: string[];
  }>;
  unresolvedCharacteristicQuestions: string[];
}
```

The characteristic vocabulary is extensible and unit-aware. Rules may require technical threshold facts such as frequency bands, transmit power, cellular/network function, battery chemistry/capacity, rated input/output, product form (finished product/component/part/accessory), new/used state, packaging, intended user, and statutory schedule entry. Coarse booleans alone cannot establish BIS/QCO, TEC, WPC, or ITC-HS applicability.

Consequential characteristics or classification entries inferred from words, URLs, photos, or documents remain unconfirmed until the user confirms them or an admitted official schedule plus exact product facts establishes them. Product names can supply search terms only; they cannot select a requirement. The language model may help extract a candidate profile during explicit deep research, but it cannot decide legal applicability. The local deterministic engine operates only on confirmed characteristics and labels unknown thresholds `Pending`.

`evidenceState: "admitted"` is valid only when `claimId`, `sourceVersionId`, and `exactLocator` are present and resolve together through `RegulatoryStore`; otherwise parsing fails or the candidate is `pending`.

### 3.2 Indexed regulatory knowledge graph

Store the graph in the existing regulatory SQLite database. Do not add a dependency. `RegulatoryStore` owns the graph-store connection/lifecycle so existing routes cannot leak a second database handle.

Tables:

- `knowledge_nodes`: trait, requirement, document, policy clause, agency, filing service, contact, calculation rule.
- `knowledge_edges`: `triggered_by`, `requires`, `supported_by`, `filed_at`, `owned_by`, `precedes`, and `supersedes`, with declarative condition JSON.
- `knowledge_node_search`: FTS5 index over labels, aliases, keywords, and descriptions.

Required indexes cover node kind/jurisdiction, edge relation/source/target, source-version binding, and effective/freshness dates. Every actionable rule node must bind to an admitted `source_version_id` and exact locator. A node with missing, stale, conflicting, or out-of-scope evidence can produce only `Pending`.

The seed is versioned JSON data, not TypeScript product logic. It contains regulatory traits and obligations, never prepared answers for “router”, “headphones”, “camera”, or any other named product. Existing product-pack research may identify candidate official sources, but the packs cannot be imported or queried by the new engine.

#### Frozen production JSON grammar

Both Wave 1 workers implement exactly this serialization; neither worker may invent another shape.

```ts
type KnowledgeNodeKind =
  | "characteristic"
  | "statutory_entry"
  | "requirement"
  | "document"
  | "policy_clause"
  | "agency"
  | "filing_service"
  | "contact"
  | "calculation_rule"
  | "coverage_gap";

type CanonicalUnit = "hz" | "w" | "v" | "ah" | "kg";
type Scalar = string | number | boolean;

type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | {
      characteristic: string;
      op: "eq" | "in" | "present" | "absent" | "gte" | "lte";
      value?: Scalar | Scalar[];
      unit?: CanonicalUnit;
    };

interface FieldEvidenceBindingJson {
  claimId: string;
  sourceVersionId: string;
  exactLocator: string;
  supportMode: "exact_text" | "exact_url" | "exact_number" | "closed_enum";
  supportText: string;
  supportSha256: string;
}

type OwnerRole = "importer" | "supplier" | "customs_broker" | "authorized_indian_representative" | "laboratory" | "authority";
type DueStage = "before_purchase" | "before_shipment" | "before_arrival" | "before_customs_filing" | "before_sale";
type ActionCode = "obtain" | "prepare" | "file" | "upload" | "review" | "confirm" | "engage";

type SatisfactionCondition =
  | { kind: "verified_document"; targetNodeId: string }
  | { kind: "verified_approval"; targetNodeId: string }
  | { kind: "verified_registration"; targetNodeId: string }
  | { kind: "verified_official_record"; targetNodeId: string }
  | { all: [SatisfactionCondition, ...SatisfactionCondition[]] };

interface NodePayloadByKind {
  characteristic: { characteristicId: string };
  statutory_entry: { system: "ITC_HS" | "BIS_CRS" | "TEC_MTCTE" | "WPC_ETA" | "OTHER"; entryId: string; officialLabel: string };
  requirement: { actionCode: ActionCode; targetNodeId: string; ownerRole: OwnerRole; dueStage: DueStage; satisfaction: SatisfactionCondition };
  document: { documentCode: string; documentKind: "invoice" | "transport" | "approval" | "registration" | "certificate" | "declaration" | "other"; officialName: string; issuerRole: OwnerRole; acceptedForm: string[] };
  policy_clause: { authority: string; instrumentTitle: string; exactLocator: string; pageNumbers: string; canonicalUrl: string };
  agency: { authorityName: string; role: "customs" | "licensing" | "standards" | "telecom" | "environmental" | "consumer_protection" };
  filing_service: { authorityNodeId: string; officialServiceName: string; canonicalUrl: string; access: "public" | "login_required" | "broker_only" | "offline"; filerRole: OwnerRole; loginRequirement: string };
  contact: { authorityNodeId: string; channel: "official_web" | "email" | "phone"; value: string; purpose: string };
  calculation_rule: { componentId: string; formulaId: "bcd" | "sws" | "igst" | "cess" | "landed_cost"; requiredCharacteristicIds: string[] };
  coverage_gap: { domain: "battery_epr" | "e_waste_epr" | "legal_metrology" | "used_refurbished" | "unmapped_electronics"; authorityNodeId: string };
}

type EvidenceRequiredFieldsByKind = {
  characteristic: never;
  statutory_entry: "system" | "entryId" | "officialLabel";
  requirement: "actionCode" | "ownerRole" | "dueStage";
  document: "documentKind" | "officialName" | "issuerRole" | "acceptedForm";
  policy_clause: "authority" | "instrumentTitle" | "exactLocator" | "pageNumbers" | "canonicalUrl";
  agency: "authorityName" | "role";
  filing_service: "officialServiceName" | "canonicalUrl" | "access" | "filerRole" | "loginRequirement";
  contact: "value" | "purpose";
  calculation_rule: "componentId";
  coverage_gap: never;
};

interface KnowledgeNodeJson<K extends KnowledgeNodeKind = KnowledgeNodeKind> {
  id: string;
  kind: K;
  jurisdiction: "India";
  label: string;
  aliases: string[];
  state: K extends "coverage_gap" ? "coverage_pending" : "actionable" | "evidence_pending";
  conditions: Condition;
  payload: NodePayloadByKind[K];
  fieldEvidence: Partial<Record<EvidenceRequiredFieldsByKind[K], FieldEvidenceBindingJson>>;
  pendingReason?: string;
  verificationOwner?: string;
  contactNodeId?: string;
}

interface KnowledgeEdgeJson {
  id: string;
  from: string;
  relation: "triggered_by" | "requires" | "supported_by" | "filed_at" | "owned_by" | "precedes" | "supersedes";
  to: string;
  conditions: Condition;
  evidence: FieldEvidenceBindingJson;
}

interface AdmissionSeedJson {
  // Exact JSON projection of the existing exported AdmittedEvidence type.
  // No field may be omitted or renamed.
  evidence: import("../../src/server/evidence/admission").AdmittedEvidence;
  amendment: import("../../src/server/evidence/admission").AdmissionRequest["amendment"];
  exactExcerpt: string;
}

interface ElectronicsKnowledgeGraphJson {
  schemaVersion: 1;
  graphId: "china-india-electronics-v1";
  admissions: AdmissionSeedJson[];
  nodes: KnowledgeNodeJson[];
  edges: KnowledgeEdgeJson[];
}
```

Closed evaluation rules:

- Conditions evaluate to `true`, `false`, or `unknown`.
- A missing characteristic, unconfirmed characteristic, or literal `"unknown"` value produces `unknown`; it never means absent.
- `present`/`absent` are valid only for boolean characteristics. Confirmed `true` makes `present=true, absent=false`; confirmed `false` makes `present=false, absent=true`; missing/unconfirmed makes both `unknown`.
- `eq` and `in` require exact normalized scalar equality when confirmed; otherwise `unknown`.
- `gte`/`lte` require confirmed numeric operands in the same canonical unit; otherwise `unknown`.
- `all`: any `false` → `false`; all `true` → `true`; otherwise `unknown`.
- `any`: any `true` → `true`; all `false` → `false`; otherwise `unknown`.
- `not`: flips `true/false` and preserves `unknown`.
- A node condition of `true` is applicable, `false` is inapplicable, and `unknown` yields a Pending dossier item with the exact missing characteristics. Only an applicable node with current admitted evidence can yield Required/Clear.
- Input units normalize only by this fixed table: Hz/kHz/MHz/GHz → `hz`; mW/W/kW → `w`; mV/V/kV → `v`; mAh/Ah → `ah`; g/kg → `kg`. Use `Decimal`; reject all unknown units and dimensions.
- No regex, JavaScript expression, model call, arbitrary code, fuzzy comparison, implicit classification, or product-name predicate is permitted.
- Node payloads are strict discriminated records; extra/missing payload fields are rejected. Every field named by `EvidenceRequiredFieldsByKind` and every decision-affecting edge must have its own evidence binding.
- The loader verifies claim/source/locator scope, `supportMode`, payload-value support, normalized `supportText` occurrence in the admitted exact excerpt, and `supportSha256`.
- Node-field `claimId` is not free text: it must equal `kg:${node.id}:${fieldPath}` for that exact node field.
- Edge `claimId` must equal `kg-edge:${edge.id}`. Derived portal document requirements use the supporting `requires` edge claim; derived sequence uses the supporting `precedes` edge claim. Replay rejects any edge/source/locator mismatch.
- Every referenced source version must exist in `admissions`. The loader rechecks the bundled snapshot hash and strict admitted-evidence shape, then replays only that previously admitted record through `RegulatoryStore.recordAdmittedEvidence`; it never converts a source log or raw page directly into an admission.
- An `evidence_pending` non-gap node freezes its strict payload and closed conditions but cannot expose that payload or produce Required/Clear until every required field and decision edge receives a valid overlay binding. Only `kind: "coverage_gap"` may use `state: "coverage_pending"`; its payload is limited to the closed domain enum and authority reference, and it cannot be activated by an overlay. Both pending states require `pendingReason`, `verificationOwner`, and `contactNodeId`.
- Unknown operators, fields, units, relations, dangling edges, or unbound actionable fields reject the entire graph.

#### Frozen field-support validation

- `exact_text`: the normalized payload string (or every string-array member) must occur in normalized `supportText`, which must occur in the admitted exact excerpt.
- `exact_url`: the payload URL must equal the admitted canonical/final URL or occur literally in the admitted exact excerpt.
- `exact_number`: the exact decimal token and canonical unit must occur together in `supportText` and the admitted exact excerpt.
- `closed_enum`: the payload enum is supported only when `supportText` contains one of these exact normalized phrases:
  - access: `public` → `no login required` or `publicly accessible`; `login_required` → `login`, `log in`, `sign in`, or `registered user`; `broker_only` → `customs broker only` or `only by a customs broker`; `offline` → `service unavailable` or `temporarily unavailable`;
  - action: `obtain` → `obtain`, `must hold`, or `shall have`; `prepare` → `prepare`, `shall furnish`, or `required document`; `file` → `file` or `submit`; `upload` → `upload`; `review` → `review`, `verify`, or `check`; `confirm` → `confirm` or `determine`; `engage` → `engage` or `appoint`;
  - owner: `importer` → `importer` or `applicant`; `supplier` → `supplier` or `manufacturer`; `customs_broker` → `customs broker`; `authorized_indian_representative` → `authorized indian representative`; `laboratory` → `laboratory`; `authority` → the exact authority name;
  - due stage: `before_purchase` → `before purchase`; `before_shipment` → `before shipment` or `prior to shipment`; `before_arrival` → `before arrival` or `prior to arrival`; `before_customs_filing` → `before filing` or `prior to filing`; `before_sale` → `before sale` or `prior to sale`.
  - statutory system: `ITC_HS` → `ITC (HS)` or `Indian Trade Classification`; `BIS_CRS` → `Bureau of Indian Standards`, `BIS`, or `Compulsory Registration Scheme`; `TEC_MTCTE` → `Telecommunication Engineering Centre`, `TEC`, or `MTCTE`; `WPC_ETA` → `Wireless Planning and Coordination`, `WPC`, or `Equipment Type Approval`; `OTHER` requires the exact official system name stored as the node label;
  - agency role: `customs` → `customs`; `licensing` → `licence`, `license`, or `licensing`; `standards` → `standard` or `conformity assessment`; `telecom` → `telecom` or `telecommunication`; `environmental` → `environment` or `pollution control`; `consumer_protection` → `consumer protection` or `legal metrology`.
  - document kind: each value requires its literal noun (`invoice`, `transport`, `approval`, `registration`, `certificate`, or `declaration`); `other` cannot be actionable and remains evidence_pending.
- Contact `channel` is not semantically admitted: the loader derives/checks it from `value` syntax (`https` official URL, syntactically valid email, or normalized phone) and rejects a mismatch.
- Calculation `formulaId` is a server-owned closed deterministic formula selector, not a sourced legal claim. The component/rate and applicability edges remain evidence-bound; unknown formulas are rejected.
- A relationship edge is supported only when its excerpt contains both endpoint official labels plus: `requires` → `required`, `shall`, or `must`; `filed_at` → service label plus `file`, `submit`, or `upload`; `owned_by` → the closed owner phrase; `precedes` → `before`, `prior to`, or `after`. Other relations require both labels and the literal relation verb.
- Direction is mandatory, not inferred from mere co-occurrence:
  - `A precedes B` passes only for the ordered pattern `A ... before|prior to ... B` or `B ... after ... A`; `B before A` and `A after B` are rejected.
  - `A requires B` passes only for `A ... requires|shall require|must require ... B`, or an official imperative whose grammatical subject resolves exactly to node A and object exactly to node B; reversed subject/object is rejected.
  - `A filed_at B` passes only for `A ... file|submit|upload ... at|through|on ... B`; reversed direction is rejected.
  - `A owned_by B` passes only when B is the explicit grammatical actor followed by `shall|must|is responsible for` and A is the explicit object; reversed responsibility is rejected.
  - If the normalized excerpt does not match one allowed ordered pattern exactly, the edge stays Pending. A model may not interpret direction.
- No substring/hash check alone can activate a field; all applicable support-mode rules must pass.

#### Frozen characteristic catalog

Task Chats 2–4 use only these IDs and normalized values. The loader rejects any condition characteristic outside this catalog; the profile stores uncatalogued user specifications as non-decisional notes. Catalog expansion requires a later schema-version change, not a product-name shortcut.

| Characteristic ID | Type / allowed normalized values | Canonical unit |
|---|---|---|
| `product.form` | `finished_product`, `component`, `part`, `accessory` | — |
| `product.condition` | `new`, `used`, `refurbished` | — |
| `purchase.stage` | `pre_purchase`, `already_purchased` | — |
| `import.purpose` | `personal`, `commercial` | — |
| `packaging.retail_prepackaged` | boolean | — |
| `radio.transmitter_present` | boolean | — |
| `radio.frequency_hz` | number | `hz` |
| `radio.transmit_power_w` | number | `w` |
| `telecom.public_network_connection` | boolean | — |
| `telecom.interface` | `none`, `ip`, `cellular`, `pstn`, `satellite`, `multiple` | — |
| `battery.present` | boolean | — |
| `battery.chemistry` | `lithium_ion`, `lithium_metal`, `lead_acid`, `nickel_metal_hydride`, `other` | — |
| `battery.capacity_ah` | number | `ah` |
| `battery.voltage_v` | number | `v` |
| `power.external_supply_present` | boolean | — |
| `power.input_voltage_v` | number | `v` |
| `power.rated_output_w` | number | `w` |
| `camera.present` | boolean | — |
| `encryption.present` | boolean | — |
| `end_use.controlled_or_dual_use` | boolean | — |
| `classification.itc_hs` | normalized digit string | — |
| `classification.bis_entry` | exact admitted schedule-entry ID | — |
| `classification.tec_entry` | exact admitted schedule-entry ID | — |
| `classification.wpc_entry` | exact admitted schedule-entry ID | — |

Free-text principal function, model, descriptions, and specifications remain intake/search context and cannot be operands in the condition grammar.

### 3.3 Deterministic decision and dossier layer

```ts
interface PolicyLocator {
  authority: string;
  instrumentTitle: string;
  exactLocator: string;
  pageNumbers?: string;
  canonicalUrl: string;
  sourceVersionId: string;
  verifiedAt: string;
  freshUntil: string;
}

interface EvidenceBoundValue<T> {
  value: T;
  claimId: string;
  sourceVersionId: string;
  exactLocator: string;
}

interface FilingPortal {
  authority: string;
  serviceName: EvidenceBoundValue<string>;
  canonicalUrl: EvidenceBoundValue<string>;
  access: EvidenceBoundValue<"public" | "login_required" | "broker_only" | "offline" | "unknown">;
  filer: EvidenceBoundValue<string>;
  loginRequirement?: EvidenceBoundValue<string>;
  requiredDocuments: Array<EvidenceBoundValue<string>>;
  fee?: EvidenceBoundValue<string>;
  deadline?: EvidenceBoundValue<string>;
  sequence: EvidenceBoundValue<number>;
  policyLocators: PolicyLocator[];
}

interface DossierItem {
  id: string;
  status: DossierStatus;
  label: string;
  action: string;
  owner: string;
  why: string;
  dueBefore?: string;
  policyLocators: PolicyLocator[];
  filingPortals: FilingPortal[];
}

interface ActionDossier {
  decision: { status: DossierStatus; summary: string; blockers: string[] };
  documents: DossierItem[];
  policyReview: DossierItem[];
  onlineForms: DossierItem[];
  contacts: DossierItem[];
  classificationAndRegulation: DossierItem[];
  costs: DossierItem[];
  orderedNextActions: DossierItem[];
}
```

The same graph nodes generate all sections. The UI must not independently infer or rewrite policy.

Every material portal field is independently evidence-bound. A valid portal URL does not prove who files, access mode, documents, fee, deadline, or sequence. Any unsupported field is omitted and represented by a `Pending` dossier item.

#### Deterministic Required / Clear / Pending contract

```ts
interface CaseSatisfactionEvidence {
  targetNodeId: string;
  kind: "verified_document" | "verified_approval" | "verified_registration" | "verified_official_record";
  provenance: "deterministic_document_review" | "admitted_official_record";
  recordId: string;
  exactLocator: string;
  verifiedAt: string;
  validUntil?: string;
}
```

`CaseSatisfactionEvidence` is not accepted from API/model/user JSON. The dossier module exposes one producer, `resolveCaseSatisfactionEvidence`, which receives store-owned resolved document-review/official-record IDs, verifies the record exists in the active case, verifies its status/provenance/target locator, rejects expiry or contradiction, and returns schema-parsed evidence. No other constructor or cast is used in production.

Loader invariants tie satisfaction to the admitted obligation:

- every requirement node has exactly one outgoing `requires` edge;
- `requirement.payload.targetNodeId` must equal that edge's `to` node;
- every leaf in `requirement.payload.satisfaction` must use the same target node ID;
- the target must be a `document` node;
- `verified_approval` requires documentKind `approval` or `certificate`; `verified_registration` requires `registration`; `verified_official_record` requires `approval`, `registration`, `certificate`, or `declaration`; `verified_document` uses the exact target document kind;
- `CaseSatisfactionEvidence.targetNodeId` must equal that same supported target and its resolved record must name the same active-case document/official record.

Any mismatch rejects the graph or satisfaction record; an unrelated document can never clear a requirement.

- `Pending`: applicability is `unknown`; knowledge evidence is missing/stale/conflicting; required profile thresholds are missing; or claimed satisfaction is unverified/expired/contradictory.
- `Required`: applicability is `true`, all knowledge fields/edges have current admitted evidence, and the node's `satisfaction` condition is not met by valid `CaseSatisfactionEvidence`.
- `Clear`: applicability is `true`, knowledge evidence is current, and the complete `satisfaction` condition is met by non-expired, non-conflicting `CaseSatisfactionEvidence` matching the exact target node.
- A user assertion, filename, model prose, raw upload, or merely extracted visible fact cannot produce `Clear`. Deterministic document review must verify the required visible fields; approvals/registrations that cannot be authenticated remain `Pending` or `Required`.
- An empty satisfaction group is invalid at schema parse time and can never vacuously produce `Clear`.
- Applicability `false` means the node is inapplicable and omitted from material items; it does not become `Clear`.

### 3.4 Deep-research feedback path

Deep research can refresh stale evidence or complete the missing bindings of an `evidence_pending` current-case node only through this closed overlay; it cannot author a new rule or value:

```ts
interface EvidenceRefreshOverlay {
  knowledgeNodeId: string;
  replacements: Record<string, FieldEvidenceBindingJson>;
}
```

1. research discovers a current official source;
2. the existing evidence gate admits the source with scope and exact locator;
3. the tool selects an existing graph node and supplies replacement evidence bindings for existing field paths;
4. the server accepts a replacement or missing binding only when the node is `actionable` or `evidence_pending`, the node's closed conditions evaluate `true` against confirmed facts, the proposed field path/value is already frozen and unchanged, claim/source/locator scope matches, normalized `supportText` occurs verbatim in the admitted excerpt, and its hash matches;
5. the validated overlay is persisted in case memory and the readiness snapshot;
6. the current and later responses for that case can resolve the `Pending` item.

When every required frozen field of an `evidence_pending` node has a valid binding, that node may become actionable for the current case only. A `coverage_pending` node can never be activated by an overlay. No semantic derivation is allowed. New values, conditions, nodes, classifications, or obligations remain `Pending`. Case overlays do not silently mutate the global graph. Promoting a newly researched rule into the shared graph requires a separately reviewed knowledge-data change and is outside this four-hour run.

### 3.5 Runtime sequence and latency

1. First message: save clear facts and immediately request the missing intake groups in one concise checklist.
2. Once enough facts exist: build the profile, query the local graph, and return the dossier without provider or web calls.
3. If evidence or a trait is missing/stale: return the dossier with explicit `Pending` items and offer the existing opt-in deep-research action.
4. Deep research may propose new evidence; the existing admission gates must accept it before any local rule becomes actionable.

Measured local targets:

- first useful intake response: p95 under 1 second;
- dossier from confirmed facts and indexed evidence: p95 under 2 seconds;
- no provider/model/search construction on either local path.

## 4. Non-negotiable acceptance gates

1. The first router question asks for quantity, unit price/currency, locations, URL/photo/model/specs, purchase status/evidence, and personal/commercial purpose—not only make/model.
2. A complete answer produces every dossier section, even when some entries are `Pending`.
3. Portal entries contain an official canonical URL, exact service/page, filer, access state, document requirements, sequence, and evidence locator. Unknown fees/deadlines remain unknown.
4. Policy entries show the exact admitted paragraph/page/record locator; a homepage link alone fails.
5. The engine branches only on normalized facts and traits. Product names cannot select requirements.
6. At least four runtime-supplied electronics examples with different trait combinations pass without fixture or production-code changes; one must be supplied only to the test command at runtime.
7. A source scan/test rejects runtime imports of `router-pack`, `headphones-pack`, or `camera-pack` and rejects named-product condition branches in the new engine/seed.
8. Missing, stale, conflicting, or inapplicable evidence fails closed to `Pending` and cannot produce `Clear` or an unqualified `Required` legal conclusion.
9. Personal/commercial and pre-/post-purchase inputs produce different owners, documents, and action sequence where supported by admitted rules.
10. Existing case isolation, contradiction handling, document privacy, citation validation, deterministic calculation, and explicit deep research remain green.
11. Desktop and 360 px browser paths are keyboard-accessible, Axe-clean, and have no horizontal overflow.
12. No response implies guaranteed clearance or completed filing.

## 5. Time and coordination contract

- Hard wall-clock cap: 240 minutes; target completion: 220 minutes.
- Worst-case allocation: Wave 1 80 minutes + production-data gate/repair 10; Wave 2 90 + review 5; seam integration 25; independent verification 20; final audit/handoff 5 = 235 minutes, leaving a 5-minute contingency.
- Wave 1 runs Task Chats 1 and 2 concurrently because code/schema and evidence capture have disjoint allowlists and use the frozen JSON contract in this plan.
- After both Wave 1 reports, the coordinator runs the production graph/admission/link gate. Wave 2 cannot start until the actual production JSON—not only fixtures—passes. A graph-data failure returns to Task Chat 2; a loader/schema failure returns to Task Chat 1, using the same chat and allowlist.
- Only after that gate passes, Wave 2 runs Task Chats 3, 4, and 5 concurrently. Intake/persistence, decision engine, and rendering have disjoint allowlists and use the frozen contracts in this plan.
- Task Chat 6 performs only bounded seam integration after all Wave 2 reports pass review.
- Task Chat 7 starts only after Task Chat 6 passes.
- One task per Codex chat. A worker cannot dispatch a successor.
- The coordinator creates each named task once, waits for its report, checks its allowlist/diff, and does not create duplicates.
- A task blocked for 10 minutes stops and reports; it does not improvise new scope.
- No task may commit, push, deploy, create Plane work, reset, clean, or stash.
- Before starting or stopping any process, obey `AGENTS.md` process ownership checks. Reuse the current healthy port-3210 server if compatible and never terminate a reused process.

Every worker reports only:

1. `complete` or `blocked`;
2. exact files changed;
3. red test observed before production edits;
4. exact verification commands and results;
5. allowlist/scope audit;
6. processes reused, started, stopped, and preserved;
7. remaining blocker.

---

## Wave 1 / Task Chat 1 — Domain contract, indexed graph store, and strict loader

**Timebox:** 75 minutes, concurrent with Task Chat 2.

**Outcome:** The repository has product-agnostic intake/profile/dossier contracts and a migrated, indexed regulatory knowledge graph that fails closed.

**Allowed files:**

- Modify: `src/server/data/migrate.ts`
- Modify: `src/server/bootstrap.ts`
- Modify: `src/server/knowledge/regulatory-store.ts`
- Add: `src/server/knowledge/electronics-domain.ts`
- Add: `src/server/knowledge/electronics-knowledge-store.ts`
- Add: `src/server/knowledge/electronics-knowledge-loader.ts`
- Modify: `scripts/verify-official-links.mjs`
- Add: `tests/agent-first/electronics-knowledge-store.test.ts`
- Add: `tests/agent-first/electronics-knowledge-loader.test.ts`
- Add only loader fixtures under: `tests/fixtures/electronics-knowledge/`
- Modify: `tests/agent-first/migrations.test.ts`

**Steps:**

1. Read the current Next.js route-handler guide only for constraints that affect server lifecycle: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`.
2. Write red migration/store tests for graph schema, indexes, FTS lookup, characteristic/threshold traversal, statutory-entry facts, source-version binding, freshness, and fail-closed status.
3. Add the typed contracts from Section 3 without named products.
4. Add a regulatory-database migration for nodes, edges, FTS5, and indexes.
5. Implement a strict loader that rejects missing field-level evidence bindings, unknown relations, named-product conditions, duplicate IDs, invalid portal URLs, and rules that lack required threshold facts.
6. Implement `ElectronicsKnowledgeStore`; it returns graph matches plus evidence state, never final prose.
7. Make `RegulatoryStore` own and close the graph store so existing `bootstrapApplication` callers keep one lifecycle contract; bootstrap loads the production graph only after validation.

**Verification:**

```bash
pnpm vitest run tests/agent-first/migrations.test.ts tests/agent-first/electronics-knowledge-store.test.ts tests/agent-first/electronics-knowledge-loader.test.ts
pnpm typecheck
```

**Stop condition:** Graph traversal, exact evidence binding, indexes, and fail-closed behavior pass with no product pack or product-name condition.

### Mandatory Wave 1 production-data gate

After Task Chats 1 and 2 both report, the coordinator runs:

```bash
BWMI_VALIDATE_PRODUCTION_KNOWLEDGE=1 pnpm vitest run tests/agent-first/electronics-knowledge-loader.test.ts tests/agent-first/evidence-admission.test.ts
pnpm verify:links
```

The loader test uses fixtures in ordinary Task Chat 1 runs; with `BWMI_VALIDATE_PRODUCTION_KNOWLEDGE=1` it must load `evidence/knowledge/china-india-electronics-v1.json`, replay its admissions into a temporary regulatory database, validate all nodes/edges/field bindings/directions/satisfaction links, and traverse at least one actionable and one coverage-Pending branch. Wave 2 is forbidden until this passes. Repairs stay in the original Wave 1 task chat and original allowlist.

---

## Wave 1 / Task Chat 2 — Verify evidence and author domain graph data

**Timebox:** 80 minutes, concurrent with Task Chat 1.

**Outcome:** The graph contains a useful baseline and trait-triggered India electronics path with verified policy locators, portals, services, and contacts.

**Allowed files:**

- Add/modify only relevant files under `evidence/official/`
- Add: `evidence/knowledge/china-india-electronics-v1.json`
- Add: `evidence/knowledge/china-india-electronics-v1-source-log.md`
- Add: `tests/agent-first/electronics-evidence-capture.live.test.ts`

**Required admitted evidence for this fast domain-general slice:**

- DGFT baseline import policy/IEC and ITC-HS navigation;
- CBIC/ICEGATE declaration/document submission and eSANCHIT service access;
- WPC/DoT ETA path for radio traits;
- TEC/MTCTE path for telecom traits;
- BIS CRS/Scheme II/QCO path where product scope is evidenced;
- official contact/helpdesk pages for those admitted filing services.

Battery/E-Waste, Legal Metrology, used/refurbished, and other electronics branches stay in the domain model but may remain `Pending` in this run unless an already-captured official source can be reverified and admitted within the timebox. This limits evidence breadth—not intake, dossier sections, reasoning architecture, or future product coverage. Each actionable node must carry declarative characteristic/purpose/stage/threshold conditions and field-level evidence bindings. If a source cannot be verified, create only a `Pending` authority-routing node; do not state the legal requirement as established.

**Steps:**

1. Before using any research note, re-open the current official primary source; candidate notes are not evidence.
2. Add an opt-in live Vitest capture harness that calls the existing exported `admitSourceEvidence` against a temporary regulatory database and the task-owned snapshot root; do not hand-author an admitted record. Export each successful `AdmittedEvidence` plus amendment/exactExcerpt into the frozen `admissions` array. A failed admission stays Pending. The harness stays skipped in ordinary test runs.
3. Write graph JSON containing admission records plus characteristic, threshold, statutory-entry, and obligation nodes only—no named-product answer or catalog.
4. Bind every portal metadata field independently. Unknown fees, deadlines, access rules, filer roles, and sequence remain absent/Pending.
5. Record every checked URL, locator, access limitation, and reason for Pending in the source log.

**Verification:**

```bash
RUN_LIVE_ELECTRONICS_EVIDENCE_CAPTURE=1 pnpm vitest run tests/agent-first/electronics-evidence-capture.live.test.ts
node -e "JSON.parse(require('node:fs').readFileSync('evidence/knowledge/china-india-electronics-v1.json','utf8'))"
```

**Stop condition:** The data file is valid JSON; actionable fields have current official source/locator bindings; all unverifiable branches are explicitly Pending. Production-data loader/integration verification belongs to Task Chat 7.

---

## Wave 2 / Task Chat 3 — Intake, normalized profile, and snapshot persistence

**Timebox:** 55 minutes, concurrent with Task Chats 4 and 5 after Wave 1 approval.

**Outcome:** Any electronics question receives the finalized grouped intake request; confirmed answers become a normalized, evidence-aware electronics profile that survives save/reload.

**Allowed files:**

- Modify: `src/app/api/chat/route.ts`
- Modify: `src/server/conversations/conversation-store.ts`
- Add: `src/server/assessment/electronics-profile.ts`
- Modify: `tests/agent-first/routes.test.ts`
- Add: `tests/agent-first/electronics-profile.test.ts`
- Modify: `tests/agent-first/session.test.ts`

**Steps:**

1. Write red tests for the exact intake fields, personal/commercial, pre/post-purchase, locations, URL/photo/document evidence, and grouped—not one-field-at-a-time—questions.
2. Replace make/model-first gating with `ElectronicsImportIntake`; preserve confirmation/version/conflict handling.
3. Build the profile from confirmed facts and confirmed visible document facts. Candidate inferred characteristics and statutory entries remain `unknown` until confirmed; unit/threshold gaps produce targeted follow-up questions.
4. Enforce admitted classification provenance: admitted candidates require claim/source/locator resolution; all others remain Pending.
5. Extend `ConversationReadinessSnapshot` with the frozen `actionDossier` and `EvidenceRefreshOverlay` types; prove full save/reload round trips even before the engine is wired.

**Required tests:**

- product names cannot confirm characteristics or statutory entries;
- unit normalization uses only the frozen table and rejects unknown dimensions;
- unknown characteristic/threshold remains Pending;
- no cross-case or cross-product memory leakage;
- snapshot save/reload preserves the dossier and case overlay;

**Verification:**

```bash
pnpm vitest run tests/agent-first/routes.test.ts tests/agent-first/electronics-profile.test.ts tests/agent-first/session.test.ts tests/agent-first/document-memory.test.ts
pnpm typecheck
```

**Stop condition:** The route captures the grouped intake, produces only confirmed/evidence-aware profile facts, and preserves frozen dossier/overlay shapes across reloads.

---

## Wave 2 / Task Chat 4 — Deterministic dossier, evidence refresh, and latency

**Timebox:** 80 minutes, concurrent with Task Chats 3 and 5 after Wave 1 approval.

**Outcome:** Confirmed characteristics traverse the graph into a complete persisted dossier; stale evidence can be refreshed only through the closed overlay; local paths meet latency targets.

**Allowed files:**

- Modify: `src/server/agent/compliance-tools.ts`
- Modify: `src/server/agent/guidance.ts`
- Add: `src/server/assessment/electronics-dossier.ts`
- Add: `tests/agent-first/electronics-dossier.test.ts`
- Add: `tests/agent-first/electronics-latency.test.ts`
- Modify: `scripts/run-unseen-product-harness.mjs`
- Add: `scripts/measure-electronics-latency.mjs`

**Steps:**

1. Write red tests for the frozen condition grammar, threshold comparisons, graph traversal, full dossier sections, and fail-closed evidence states.
2. Implement deterministic dossier synthesis against `ElectronicsProfile` and `ElectronicsKnowledgeStore`. Unknown facts or evidence always produce Pending with owner/verifier.
3. Extend `ComplianceOutputSchema` with `actionDossier` while preserving legacy saved/deep fields.
4. Implement `EvidenceRefreshOverlay` exactly as Section 3.4. It can refresh bindings for an existing unchanged node/field only; no semantic derivation or new rule/value.
5. Prove field-level portal evidence rejects unsupported access/filer/document/fee/deadline/sequence values.
6. Extend the unseen harness to accept a runtime product/spec/characteristics payload and reject product-pack/name selection.
7. Add direct-engine p95 measurements and optimize within this allowlist until Section 3.5 passes.

**Required tests:**

- same characteristics/thresholds under unrelated product names yield the same obligations;
- the same product name with different characteristics/thresholds yields different obligations;
- personal/commercial and purchase stage alter action sequence only where admitted rules support it;
- every dossier section exists even when all branch-specific items are Pending;
- missing/stale/conflicting evidence cannot produce Required/Clear;
- overlay rejects new field values, semantic paraphrases, unbound paths, mismatched hashes, or scope mismatch;
- satisfaction schema rejects empty `all`; only `resolveCaseSatisfactionEvidence` with an active-case resolved deterministic-review/admitted-record ID can produce Clear; raw user assertions, filenames, model objects, pending reviews, foreign-case IDs, expired records, and casts fail;
- no provider/search construction on local dossier path;
- source/literal scan rejects old product-pack runtime imports and named-product predicates;
- direct-engine dossier p95 is under two seconds.

**Verification:**

```bash
pnpm vitest run tests/agent-first/electronics-dossier.test.ts tests/agent-first/electronics-latency.test.ts tests/agent-first/evidence-admission.test.ts
pnpm test:unseen-harness -- --product "$BWMI_UNSEEN_ELECTRONICS_PRODUCT"
node scripts/measure-electronics-latency.mjs --engine-only
pnpm typecheck
```

**Stop condition:** The engine produces complete evidence-bound dossiers without product-name logic, unsafe overlay admission, or provider latency.

---

## Wave 2 / Task Chat 5 — Action-first dossier rendering

**Timebox:** 90 minutes, concurrent with Task Chats 3 and 4 after Wave 1 approval.

**Outcome:** The existing interface presents the dossier as a usable importer/exporter action plan rather than a source dump.

**Allowed files:**

- Modify: `src/components/chat-first-workspace.tsx`
- Modify: `src/app/styles.css`
- Modify: `tests/browser/preflight.spec.ts`
- Add only browser fixtures under: `tests/fixtures/browser/`

**Design constraint:** Before UI edits, read and apply the complete approved design-skill suite required by `AGENTS.md`. Preserve the existing evidence-led visual system. This task is an information-priority extension, not a redesign.

**Presentation order:**

1. decision/status and blockers;
2. ordered actions with owner and `Required/Clear/Pending` status;
3. documents;
4. exact policy locators;
5. filing portals/forms and access state;
6. contacts;
7. costs;
8. supporting citations and checked/not-checked details.

**Steps:**

1. Write a red browser test before component edits for the complete router workflow and dossier headings/statuses/official links.
2. Extend `ReadinessAssessment`; do not create another page or independent response renderer.
3. Ensure links have descriptive labels and external-link behavior; do not claim the app uploads anything.
4. Verify 360 px layout, keyboard use, focus, Axe, and no overflow.
5. Run the focused browser journey when server work is available; otherwise report the test as written but blocked on integration. Do not change server files.

**Verification:**

```bash
pnpm typecheck
pnpm playwright test tests/browser/preflight.spec.ts
```

**Stop condition:** The focused browser workflow renders every dossier section accessibly at desktop and 360 px. Full verification belongs to Task Chat 7.

---

## Wave 3 / Task Chat 6 — Bounded seam integration

**Timebox:** 25 minutes after all three Wave 2 tasks pass coordinator review.

**Outcome:** The independently built intake/profile, engine, persistence, and renderer contracts are wired end to end without adding behavior or scope.

**Allowed files:**

- Modify only if required for contract wiring: `src/app/api/chat/route.ts`
- Modify only if required for contract wiring: `src/server/agent/guidance.ts`
- Modify only if required for contract wiring: `src/components/chat-first-workspace.tsx`
- Modify: `tests/agent-first/routes.test.ts`
- Modify: `tests/browser/preflight.spec.ts`

**Steps:**

1. Validate all Wave 2 reports and diff allowlists.
2. Write/confirm one red end-to-end route assertion covering grouped intake → confirmed profile → local dossier → saved snapshot → renderer contract.
3. Wire only imports, calls, schema serialization, and renderer prop shape. New conditions, rules, fields, UI sections, or fallbacks are forbidden.
4. Measure the route-level first-response and dossier p95. A latency failure may be fixed only by removing integration overhead; engine redesign returns to the user as blocked.
5. Run focused route, dossier, persistence, and browser tests.

**Verification:**

```bash
pnpm typecheck
pnpm vitest run tests/agent-first/routes.test.ts tests/agent-first/electronics-profile.test.ts tests/agent-first/electronics-dossier.test.ts tests/agent-first/session.test.ts
node scripts/measure-electronics-latency.mjs
pnpm playwright test tests/browser/preflight.spec.ts
```

**Stop condition:** The frozen contracts operate end to end and route-level latency passes with seam-only edits.

---

## Wave 4 / Task Chat 7 — Independent regression and adversarial gate

**Timebox:** 20 minutes after Task Chat 6 passes.

**Outcome:** Independent evidence proves the combined implementation satisfies the locked ideology and did not regress existing capabilities.

**Allowed files:**

- Add: `docs/verification/2026-08-26-domain-general-electronics-dossier.md`
- No production, test, evidence, or harness edits.

**Steps:**

1. Validate every task report, final diff allowlists, graph coverage, and the eight adversarial questions.
2. Run production graph loader/evidence/link checks.
3. Run the full deterministic, type, lint, build, privacy, and browser gates.
4. Run the unseen harness with a product and characteristics absent from production code, JSON, and fixtures.
5. Re-measure both latency targets; report rather than repair any failure.
6. Write the verification note with exact commands/counts, admitted versus Pending evidence domains, latency, accessibility, process ownership, and blockers.

**Verification:**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm verify:links
pnpm verify:privacy
pnpm test:browser
pnpm test:unseen-harness -- --product "$BWMI_UNSEEN_ELECTRONICS_PRODUCT"
node scripts/measure-electronics-latency.mjs
```

**Stop condition:** Every gate and every adversarial question passes. Otherwise the implementation is not called complete.

## 6. Final adversarial audit

The coordinator rejects completion if any answer is “yes”:

1. Can a product name—not traits—change a regulatory result?
2. Does any old product pack participate in the new runtime path?
3. Can a missing/stale/unadmitted source produce `Required` or `Clear`?
4. Is any dossier section omitted merely because evidence is missing?
5. Is any portal represented only by a generic homepage?
6. Does the interface lead with copied policy prose instead of actions?
7. Does the implementation claim coverage for all electronics rather than domain-general handling with honest evidence limits?
8. Did any task add a jurisdiction, filing/submission ability, provider, dependency, background job, page, redesign, deployment, Plane work, commit, push, reset, clean, or stash?

The plan is approved only when an independent adversarial reviewer answers all eight with `No` and confirms that the acceptance gates are executable within the stated task boundaries.

**Independent adversarial verdict (2026-08-26): APPROVE.** No blocking findings; all eight drift/safety audit answers are `No`. The reviewer concluded that the plan is executable within the stated boundaries and preserves the fail-closed, characteristic-driven core.
