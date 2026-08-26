"use client";

import Link from "next/link";
import {
  useId,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  type DocumentType,
} from "@/server/assessment/preparation-workflow";

import { DocumentWorkspace } from "./document-workspace";

interface Citation {
  label: string;
  locator: string;
  sourceVersionId: string;
  url: string;
}

interface Message {
  citations: Citation[];
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "user";
}

interface DocumentFactVersion {
  createdAt: string;
  id: string;
  provenance: {
    confidence: number;
    documentPage: number;
    method: "embedded_pdf_text" | "image_vision";
    region: {
      height: number;
      unit: "image_pixels" | "normalized_0_1000" | "pdf_points";
      width: number;
      x: number;
      y: number;
    };
  };
  rawValue: string;
  reviewStatus: "confirmed" | "corrected" | "pending";
  value: string;
  version: number;
}

interface ConversationCase {
  assessmentSnapshots: Array<{
    actionDossier?: unknown;
    agencies?: unknown;
    blockers?: string[];
    calculation?: unknown;
    checked?: string[];
    claims?: unknown;
    classificationCandidates?: unknown;
    confirmedFacts?: unknown;
    controls?: unknown;
    documentReviews?: unknown;
    documents?: unknown;
    executionProvenance?: { mode: string; modelVersion: string };
    missingInformation?: string[];
    nextActions?: string[];
    notChecked?: string[];
    productResearch?: unknown;
    risks?: string[];
    snapshotId: string;
    state: string;
    summary?: string;
  }>;
  confirmedFacts: Array<{ name: string; value: string }>;
  conversationId: string;
  createdAt: string;
  documents: Array<{
    bytesRetained: false;
    createdAt: string;
    documentType: DocumentType;
    facts: Array<{
      current: DocumentFactVersion;
      field: string;
      id: string;
      label: string;
      versions: DocumentFactVersion[];
    }>;
    fileName: string;
    id: string;
    mediaType: "application/pdf" | "image/jpeg" | "image/png";
    pageCount: number;
    retentionState: "derived_facts_until_case_deletion";
    sizeBytes: number;
  }>;
  id: string;
  memoryItems: Array<{
    key: string;
    kind: string;
    status: "active" | "resolved";
    value: unknown;
  }>;
  messages: Message[];
  sourceReferences: Array<{ locator: string; sourceVersionId: string }>;
  title: string;
  toolReferences: Array<{ toolCallId: string; toolName: string }>;
}

interface ActivityEvent {
  at: string;
  message: string;
  phase: string;
  status: string;
  type: "activity";
}

interface GuidanceOutput {
  actionDossier?: ActionDossier | null;
  acceptedFacts?: Array<{ name: string; value: string }>;
  journeyStage?: "intake" | "pre_purchase_research" | "post_purchase_remediation" | null;
  claims: Array<{
    authority?: string;
    claimId?: string;
    locator: string;
    sourceVersionId: string;
    text: string;
    url?: string;
  }>;
  missingInformation: string[];
  state: "action_required" | "assessment_incomplete" | "incomplete" | "ready_within_verified_scope" | "research_guidance";
  summary: string;
  confirmedFacts?: Array<{ name: string; value: string }>;
  productResearch?: Array<{
    productName: string;
    recordId: string;
    sourceLabel: string;
    sourceUrl: string;
    specifications: Array<{ name: string; value: string; whyMaterial: string }>;
  }>;
  classificationCandidates?: Array<{
    candidates: Array<{ code: string; label: string; rationale: string; system: string; uncertainty: string }>;
    missingMaterialFacts: string[];
    productName: string;
    recordId: string;
  }>;
  agencies?: DomainFinding[];
  controls?: DomainFinding[];
  documents?: DomainFinding[];
  documentReviews?: Array<{
    documentId: string;
    documentType: string;
    fileName: string;
    findings: string[];
    status: string;
  }>;
  calculation?: {
    assumptions: string[];
    blockers?: string[];
    calculationId: string;
    components: Array<{ amount: string; base: string; formula: string; id: string; ratePercent?: string }>;
    currency: string;
    exclusions: string[];
    rateClaimIds: string[];
    status: "available" | "withheld";
    totalBorderCharges?: string;
  } | null;
  risks?: string[];
  nextActions?: string[];
  nextQuestion?: string | null;
  checked?: string[];
  notChecked?: string[];
}

interface DomainFinding {
  authority: string;
  claimIds: string[];
  findingId: string;
  kind: string;
  label: string;
  reason: string;
  status: string;
}

type DossierStatus = "required" | "clear" | "pending";

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
  access?: EvidenceBoundValue<"public" | "login_required" | "broker_only" | "offline" | "unknown">;
  filer?: EvidenceBoundValue<string>;
  loginRequirement?: EvidenceBoundValue<string>;
  requiredDocuments: Array<EvidenceBoundValue<string>>;
  fee?: EvidenceBoundValue<string>;
  deadline?: EvidenceBoundValue<string>;
  sequence?: EvidenceBoundValue<number>;
  unresolvedFields: string[];
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
  contact?: {
    channel: "email" | "phone" | "helpdesk" | "office";
    value: EvidenceBoundValue<string>;
    purpose?: EvidenceBoundValue<string>;
  };
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

interface ChatFirstWorkspaceProps {
  ai: { available: boolean; message: string };
  assessmentDate: string;
  initialCases: ConversationCase[];
  source: {
    authority: string;
    effectiveFrom: string;
    label: string;
    locator: string;
    retrievedAt: string;
    sha256: string;
    url: string;
    versionLabel: string;
  };
}

interface UploadResult {
  factsFound: number;
  fileName: string;
  message: string;
  status: string;
}

const EXAMPLE_QUESTIONS = [
  "Can I import an industrial sensor module from China to India?",
  "What documents do I need to export this product from India to China?",
  "Estimate the import duties for this product.",
] as const;

function conversationDirection(tradeCase: ConversationCase) {
  const direction = tradeCase.confirmedFacts.find((fact) => fact.name === "trade_direction")?.value;
  if (direction === "china_to_india") return "China to India";
  if (direction === "india_to_china") return "India to China";
  return "Direction not confirmed";
}

function replaceOrInsert(cases: ConversationCase[], updated: ConversationCase) {
  const exists = cases.some((tradeCase) => tradeCase.id === updated.id);
  return exists
    ? cases.map((tradeCase) => tradeCase.id === updated.id ? updated : tradeCase)
    : [updated, ...cases];
}

function humanAssessmentState(state: GuidanceOutput["state"] | string) {
  return ({
    ready_within_verified_scope: "Ready within verified scope",
    action_required: "Action required",
    assessment_incomplete: "Assessment incomplete",
    incomplete: "Assessment incomplete",
    research_guidance: "Research guidance",
    "Assessment Complete Within Verified Scope": "Ready within verified scope",
    "Action Required": "Action required",
    "Assessment Incomplete": "Assessment incomplete",
  } as Record<string, string>)[state] ?? state;
}

function humanDossierStatus(status: DossierStatus) {
  return `${status.charAt(0).toUpperCase()}${status.slice(1)}`;
}

function humanPortalAccess(access: NonNullable<FilingPortal["access"]>["value"]) {
  return ({
    broker_only: "Broker only",
    login_required: "Login required",
    offline: "Offline",
    public: "Public access",
    unknown: "Access Pending",
  } as const)[access];
}

function authorityShortName(authority: string) {
  return ({
    "Directorate General of Foreign Trade": "DGFT",
    "Indian Customs Electronic Gateway": "ICEGATE",
  } as Record<string, string>)[authority] ?? authority;
}

function humanFactName(name: string) {
  return ({
    import_purpose: "Purpose",
    origin_location: "Supplier location",
    destination_location: "Delivery location",
    principal_function: "Product function",
    product_model: "Model",
    purchase_stage: "Purchase status",
    shipment_stage: "Shipment status",
    technical_specifications: "Technical specifications",
    unit_price: "Unit price",
  } as Record<string, string>)[name] ?? name.replaceAll(/[._]/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

function uniqueClaims(claims: GuidanceOutput["claims"]) {
  const seen = new Set<string>();
  return claims.filter((claim) => {
    const key = claim.claimId ?? `${claim.sourceVersionId}:${claim.locator}:${claim.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueCitations(citations: Citation[]) {
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = `${citation.sourceVersionId}:${citation.locator}:${citation.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function DossierStatusMark({ status }: { status: DossierStatus }) {
  return <span className={`dossier-status ${status}`}>{humanDossierStatus(status)}</span>;
}

function DossierItemList({ items, ordered = false }: { items: DossierItem[]; ordered?: boolean }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List className="dossier-item-list">
      {items.map((item) => (
        <li key={item.id}>
          <div className="dossier-item-heading">
            <strong>{item.label}</strong>
            <DossierStatusMark status={item.status} />
          </div>
          <p>{item.action}</p>
          <dl className="dossier-item-meta">
            <div><dt>Owner</dt><dd>{item.owner}</dd></div>
            {item.dueBefore ? <div><dt>Due</dt><dd>{item.dueBefore}</dd></div> : null}
          </dl>
          {item.contact ? <div className="dossier-contact-value">
            <p>{item.contact.channel.replace(/^./, (letter) => letter.toUpperCase())}: {item.contact.value.value}</p>
            {item.contact.purpose ? <p>Purpose: {item.contact.purpose.value}</p> : null}
          </div> : null}
          <p className="dossier-item-reason">{item.why}</p>
        </li>
      ))}
    </List>
  );
}

function ActionDossierAssessment({ dossier, output }: { dossier: ActionDossier; output: GuidanceOutput }) {
  const headingId = useId();
  const sectionId = (name: string) => `${headingId}-${name}`;
  const allDossierItems = [
    ...dossier.orderedNextActions,
    ...dossier.documents,
    ...dossier.policyReview,
    ...dossier.onlineForms,
    ...dossier.contacts,
    ...dossier.classificationAndRegulation,
    ...dossier.costs,
  ];
  const policyLocators = allDossierItems.flatMap((item) => item.policyLocators.map((locator) => ({ item, locator })));
  const filingPortals = allDossierItems
    .flatMap((item) => item.filingPortals.map((portal) => ({ item, portal })))
    .sort((left, right) => (left.portal.sequence?.value ?? Number.MAX_SAFE_INTEGER) - (right.portal.sequence?.value ?? Number.MAX_SAFE_INTEGER));
  const claims = uniqueClaims(output.claims);

  return (
    <section className="readiness-assessment dossier-assessment" aria-labelledby={headingId}>
      <header>
        <p>Shipment readiness</p>
        <h2 id={headingId}>{humanDossierStatus(dossier.decision.status)}</h2>
      </header>

      <section aria-labelledby={sectionId("decision")}>
        <h3 id={sectionId("decision")}>Decision and blockers</h3>
        <p className="dossier-decision-summary">{dossier.decision.summary}</p>
        {dossier.decision.blockers.length ? (
          <ul className="dossier-blockers">{dossier.decision.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>
        ) : <p>No current blocker is recorded within the verified scope.</p>}
        {dossier.classificationAndRegulation.length ? (
          <div className="dossier-subgroup">
            <strong>Classification and regulatory checks</strong>
            <DossierItemList items={dossier.classificationAndRegulation} />
          </div>
        ) : null}
      </section>

      <section aria-labelledby={sectionId("actions")}>
        <h3 id={sectionId("actions")}>Ordered actions</h3>
        <DossierItemList items={dossier.orderedNextActions} ordered />
      </section>

      <details><summary>Documents to prepare</summary>
        {dossier.documents.length
          ? <DossierItemList items={dossier.documents} />
          : <p>No document obligation is released until current admitted evidence establishes it for this product. Treat the document list as pending, not as “none required.”</p>}
      </details>

      <details>
        <summary>Exact policy locators</summary>
        {policyLocators.length ? <ul className="dossier-link-list">{policyLocators.map(({ item, locator }) => (
          <li key={`${item.id}-${locator.sourceVersionId}-${locator.exactLocator}`}>
            <div className="dossier-item-heading"><strong>{item.label}</strong><DossierStatusMark status={item.status} /></div>
            <p>Paragraph or section: {locator.exactLocator}</p>
            <p>Pages: {locator.pageNumbers ?? "Pending"}</p>
            <a href={locator.canonicalUrl} rel="noreferrer" target="_blank">
              Review {locator.instrumentTitle} on the {authorityShortName(locator.authority)} website
            </a>
            <small>Source {locator.sourceVersionId} · verified {locator.verifiedAt.slice(0, 10)} · fresh until {locator.freshUntil.slice(0, 10)}</small>
          </li>
        ))}</ul> : <p>No exact policy locator is released until its evidence binding is available.</p>}
      </details>

      <details>
        <summary>Government submission portals</summary>
        {dossier.onlineForms.length ? <DossierItemList items={dossier.onlineForms} /> : (
          <p>No online filing service is currently evidence-bound for this product branch.</p>
        )}
        {filingPortals.length ? <ol className="dossier-link-list">{filingPortals.map(({ item, portal }) => (
          <li key={`${item.id}-${portal.canonicalUrl.value}`}>
            <div className="dossier-item-heading"><strong>{portal.serviceName.value}</strong><DossierStatusMark status={item.status} /></div>
            <p>{item.action}</p>
            <p className="dossier-item-reason">{item.why}</p>
            <dl className="dossier-item-meta">
              <div><dt>Authority</dt><dd>{portal.authority}</dd></div>
              <div><dt>Access</dt><dd>{portal.access ? humanPortalAccess(portal.access.value) : "Pending verification"}</dd></div>
              <div><dt>Filer</dt><dd>{portal.filer?.value ?? "Pending verification"}</dd></div>
              <div><dt>Login</dt><dd>{portal.loginRequirement?.value ?? "Pending verification"}</dd></div>
              <div><dt>Fee</dt><dd>{portal.fee?.value ?? "Pending verification"}</dd></div>
              <div><dt>Deadline</dt><dd>{portal.deadline?.value ?? "Pending verification"}</dd></div>
              <div><dt>Sequence</dt><dd>{portal.sequence?.value ?? "Pending verification"}</dd></div>
            </dl>
            {portal.unresolvedFields?.length ? <p className="dossier-item-reason">Pending portal fields: {portal.unresolvedFields.join(", ")}.</p> : null}
            <div className="dossier-portal-documents">
              <strong>Documents uploaded here</strong>
              {portal.requiredDocuments.length ? <ul>{portal.requiredDocuments.map((document) => (
                <li key={`${document.claimId}-${document.value}`}>{document.value}</li>
              ))}</ul> : <p>Pending verification</p>}
            </div>
            <a href={portal.canonicalUrl.value} rel="noreferrer" target="_blank">
              Open the official {portal.serviceName.value} service
            </a>
            <small>The app does not access this service, sign in, submit, upload, or pay on your behalf.</small>
          </li>
        ))}</ol> : <p>No exact submission link is released until its service URL, access mode, filer and filing sequence are evidence-bound. This may mean login-protected, broker-only, offline, or not yet verified online; the app will not invent a portal.</p>}
      </details>

      <details><summary>Official contacts</summary>
        {dossier.contacts.length ? <DossierItemList items={dossier.contacts} /> : <p>No product-specific official contact is currently evidence-bound.</p>}
      </details>

      <details><summary>Costs and unresolved inputs</summary>
        {dossier.costs.length ? <DossierItemList items={dossier.costs} /> : <p>No duty or fee is released without current admitted rates and all required calculation inputs.</p>}
      </details>

      <details>
        <summary>Supporting citations</summary>
        {claims.length ? <ol className="claim-list">{claims.map((claim) => (
          <li key={claim.claimId ?? `${claim.sourceVersionId}-${claim.locator}`}>
            <p>{claim.text}</p>
            {claim.url ? <a href={claim.url} rel="noreferrer" target="_blank">{claim.authority ?? "Official source"}<small>{claim.locator}</small></a> : null}
          </li>
        ))}</ol> : <p>No additional supporting claim is released beyond the dossier’s exact policy locators.</p>}
        {output.checked?.length || output.notChecked?.length ? (
          <details className="dossier-scope"><summary>Checked and not checked</summary>
            {output.checked?.length ? <><strong>Checked</strong><ul>{output.checked.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
            {output.notChecked?.length ? <><strong>Not checked</strong><ul>{output.notChecked.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
          </details>
        ) : null}
      </details>
    </section>
  );
}

function ReadinessAssessment({ output }: { output: GuidanceOutput }) {
  const headingId = useId();
  if (output.actionDossier) return <ActionDossierAssessment dossier={output.actionDossier} output={output} />;
  if (output.journeyStage && !output.actionDossier) {
    const acceptedFacts = output.acceptedFacts ?? [];
    return (
      <section className="readiness-assessment journey-assessment" aria-labelledby={headingId}>
        <header>
          <p>{output.journeyStage === "post_purchase_remediation" ? "Purchased shipment" : output.journeyStage === "pre_purchase_research" ? "Pre-purchase research" : "Case intake"}</p>
          <h2 id={headingId}>{output.journeyStage === "post_purchase_remediation" ? "Recovery steps" : output.journeyStage === "pre_purchase_research" ? "Technical details needed" : "Information needed"}</h2>
        </header>
        {acceptedFacts.length ? <div className="accepted-facts"><strong>Saved from your answer</strong><dl>{acceptedFacts.map((fact) => (
          <div key={fact.name}><dt>{humanFactName(fact.name)}</dt><dd>{fact.value.replaceAll("_", " ")}</dd></div>
        ))}</dl></div> : null}
        <p>{output.journeyStage === "post_purchase_remediation"
          ? "We will establish purchase evidence and shipment status before product-specific regulatory research."
          : output.journeyStage === "pre_purchase_research"
            ? "Confirm the remaining technical traits before the evidence graph produces an actionable dossier."
            : "Answer the remaining case questions to unlock product-specific regulatory research."}</p>
      </section>
    );
  }
  const hasStructuredDetails = Boolean(
    output.confirmedFacts?.length
    || output.productResearch?.length
    || output.classificationCandidates?.length
    || output.agencies?.length
    || output.controls?.length
    || output.documents?.length
    || output.documentReviews?.length
    || output.calculation
    || output.risks?.length
    || output.nextActions?.length
    || output.checked?.length
    || output.notChecked?.length,
  );
  if (!hasStructuredDetails && output.claims.length === 0) return null;
  return (
    <section className="readiness-assessment" aria-labelledby={headingId}>
      <header>
        <p>Shipment readiness</p>
        <h2 id={headingId}>{humanAssessmentState(output.state)}</h2>
      </header>

      {output.confirmedFacts?.length ? (
        <section><h3>What is confirmed</h3><dl className="assessment-facts">
          {output.confirmedFacts.map((fact) => (
            <div key={fact.name}><dt>{fact.name.replaceAll("_", " ")}</dt><dd>{fact.value}</dd></div>
          ))}
        </dl></section>
      ) : null}

      {output.missingInformation.length ? (
        <section><h3>What is missing</h3><ul>{output.missingInformation.map((item) => <li key={item}>{item}</li>)}</ul></section>
      ) : null}

      {output.productResearch?.length ? (
        <section><h3>Product research</h3>{output.productResearch.map((record) => (
          <article key={record.recordId}>
            <p><strong>{record.productName}</strong> — <a href={record.sourceUrl} rel="noreferrer" target="_blank">{record.sourceLabel}</a></p>
            <dl className="assessment-facts">{record.specifications.map((specification) => (
              <div key={`${record.recordId}-${specification.name}`}>
                <dt>{specification.name}</dt>
                <dd>{specification.value}<small>{specification.whyMaterial}</small></dd>
              </div>
            ))}</dl>
          </article>
        ))}</section>
      ) : null}

      {output.classificationCandidates?.length ? (
        <section><h3>Classification candidates</h3>{output.classificationCandidates.map((record) => (
          <article key={record.recordId}>
            {record.candidates.map((candidate) => (
              <div className="classification-row" key={`${record.recordId}-${candidate.system}-${candidate.code}`}>
                <strong>{candidate.system} {candidate.code}</strong>
                <span>{candidate.label}</span>
                <p>{candidate.rationale}</p>
                <small>{candidate.uncertainty}</small>
              </div>
            ))}
            {record.missingMaterialFacts.length ? <ul>{record.missingMaterialFacts.map((fact) => <li key={fact}>{fact}</li>)}</ul> : null}
          </article>
        ))}</section>
      ) : null}

      {([
        ["Applicable agencies and requirements", output.agencies],
        ["Import and export controls", output.controls],
        ["Required documents", output.documents],
      ] as const).map(([label, findings]) => findings?.length ? (
        <section key={label}><h3>{label}</h3><ul className="finding-list">{findings.map((finding) => (
          <li key={finding.findingId}><strong>{finding.label}</strong><span>{finding.authority}</span><p>{finding.reason}</p></li>
        ))}</ul></section>
      ) : null)}

      {output.documentReviews?.length ? (
        <section><h3>Uploaded-document review</h3><ul>{output.documentReviews.map((review) => (
          <li key={review.documentId}><strong>{review.fileName}</strong>: {review.status.replaceAll("_", " ")}
            {review.findings.length ? <ul>{review.findings.map((finding) => <li key={finding}>{finding}</li>)}</ul> : null}
          </li>
        ))}</ul></section>
      ) : null}

      {output.calculation ? (
        <section><h3>Deterministic duty and tax estimate</h3>
          {output.calculation.status === "available" ? (
            <>
              <p className="calculation-total"><strong>{output.calculation.currency} {output.calculation.totalBorderCharges}</strong> estimated border charges</p>
              <div className="calculation-table" role="table" aria-label="Border-charge calculation">
                {output.calculation.components.map((component) => (
                  <div role="row" key={component.id}>
                    <span role="cell">{component.id.replaceAll("_", " ")}</span>
                    <span role="cell">{component.formula}</span>
                    <strong role="cell">{component.amount}</strong>
                  </div>
                ))}
              </div>
              <ul>{[...output.calculation.assumptions, ...output.calculation.exclusions].map((item) => <li key={item}>{item}</li>)}</ul>
            </>
          ) : <ul>{output.calculation.blockers?.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>}
        </section>
      ) : null}

      {output.claims.length ? (
        <section><h3>Validated official claims and citations</h3><ol className="claim-list">{uniqueClaims(output.claims).map((claim) => (
          <li key={claim.claimId ?? `${claim.sourceVersionId}-${claim.locator}`}>
            <p>{claim.text}</p>
            {claim.url ? <a href={claim.url} rel="noreferrer" target="_blank">{claim.authority ?? "Official source"}<small>{claim.locator}</small></a> : null}
          </li>
        ))}</ol></section>
      ) : null}

      {output.risks?.length ? <section><h3>Risks and unresolved issues</h3><ul>{output.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul></section> : null}
      {output.nextActions?.length ? <section><h3>Ordered next actions</h3><ol>{output.nextActions.map((action) => <li key={action}>{action}</li>)}</ol></section> : null}
      {output.checked?.length || output.notChecked?.length ? (
        <details><summary>Checked scope and exclusions</summary>
          {output.checked?.length ? <><strong>Checked</strong><ul>{output.checked.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
          {output.notChecked?.length ? <><strong>Not checked</strong><ul>{output.notChecked.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
        </details>
      ) : null}
    </section>
  );
}

function snapshotToOutput(snapshot: ConversationCase["assessmentSnapshots"][number]): GuidanceOutput | null {
  if (snapshot.executionProvenance?.mode !== "agents_sdk_with_deterministic_tools") return null;
  const state = ({
    "Assessment Complete Within Verified Scope": "ready_within_verified_scope",
    "Action Required": "action_required",
    "Assessment Incomplete": "assessment_incomplete",
  } as const)[snapshot.state as "Action Required" | "Assessment Complete Within Verified Scope" | "Assessment Incomplete"];
  if (!state || !snapshot.summary) return null;
  return {
    state,
    summary: snapshot.summary,
    claims: (snapshot.claims as GuidanceOutput["claims"] | undefined) ?? [],
    missingInformation: snapshot.missingInformation ?? [],
    ...(snapshot.confirmedFacts ? { confirmedFacts: snapshot.confirmedFacts as NonNullable<GuidanceOutput["confirmedFacts"]> } : {}),
    ...(snapshot.productResearch ? { productResearch: snapshot.productResearch as NonNullable<GuidanceOutput["productResearch"]> } : {}),
    ...(snapshot.classificationCandidates ? { classificationCandidates: snapshot.classificationCandidates as NonNullable<GuidanceOutput["classificationCandidates"]> } : {}),
    ...(snapshot.agencies ? { agencies: snapshot.agencies as NonNullable<GuidanceOutput["agencies"]> } : {}),
    ...(snapshot.controls ? { controls: snapshot.controls as NonNullable<GuidanceOutput["controls"]> } : {}),
    ...(snapshot.documents ? { documents: snapshot.documents as NonNullable<GuidanceOutput["documents"]> } : {}),
    ...(snapshot.documentReviews ? { documentReviews: snapshot.documentReviews as NonNullable<GuidanceOutput["documentReviews"]> } : {}),
    ...(snapshot.calculation !== undefined ? { calculation: snapshot.calculation as NonNullable<GuidanceOutput["calculation"]> | null } : {}),
    ...(snapshot.risks ? { risks: snapshot.risks } : {}),
    ...(snapshot.nextActions ? { nextActions: snapshot.nextActions } : {}),
    nextQuestion: null,
    ...(snapshot.checked ? { checked: snapshot.checked } : {}),
    ...(snapshot.notChecked ? { notChecked: snapshot.notChecked } : {}),
    ...(snapshot.actionDossier ? { actionDossier: snapshot.actionDossier as ActionDossier } : {}),
  };
}

export function ChatFirstWorkspace({
  ai,
  assessmentDate,
  initialCases,
  source,
}: ChatFirstWorkspaceProps) {
  const [cases, setCases] = useState(initialCases);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(initialCases[0]?.id ?? null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [startingNewChat, setStartingNewChat] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [missingInformation, setMissingInformation] = useState<string[]>([]);
  const [latestOutput, setLatestOutput] = useState<GuidanceOutput | null>(null);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentType, setAttachmentType] = useState<DocumentType>(DOCUMENT_TYPES[0]);
  const [attachmentConsent, setAttachmentConsent] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [deepResearchCapability, setDeepResearchCapability] = useState<"checking" | "available" | "unavailable">(
    ai.available ? "checking" : "unavailable",
  );
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!ai.available) return;
    const controller = new AbortController();
    void fetch("/api/deep-research-capability", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ available: boolean }> : { available: false })
      .then((capability) => setDeepResearchCapability(capability.available ? "available" : "unavailable"))
      .catch(() => {
        if (!controller.signal.aborted) setDeepResearchCapability("unavailable");
      });
    return () => controller.abort();
  }, [ai.available]);

  const activeCase = useMemo(
    () => cases.find((tradeCase) => tradeCase.id === activeCaseId) ?? null,
    [activeCaseId, cases],
  );
  const displayedOutput = useMemo(() => {
    if (latestOutput) return latestOutput;
    const snapshots = activeCase?.assessmentSnapshots ?? [];
    for (let index = snapshots.length - 1; index >= 0; index -= 1) {
      const output = snapshotToOutput(snapshots[index]!);
      if (output) return output;
    }
    return null;
  }, [activeCase, latestOutput]);

  function updateCase(updated: ConversationCase) {
    setCases((current) => replaceOrInsert(current, updated));
    setActiveCaseId(updated.id);
  }

  async function startNewChat() {
    setActiveCaseId(null);
    setDraft("");
    setActivities([]);
    setMissingInformation([]);
    setLatestOutput(null);
    setUploadResults([]);
    setStatus("");
    setError("");
    setStartingNewChat(true);
    try {
      const response = await fetch("/api/trade-cases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ automatic: true, title: "New chat" }),
      });
      const body = (await response.json()) as { error?: string; tradeCase?: ConversationCase };
      if (!response.ok || !body.tradeCase) {
        throw new Error(body.error ?? "A durable new conversation could not be started.");
      }
      updateCase(body.tradeCase);
      setStatus("New conversation started.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A durable new conversation could not be started.");
    } finally {
      setStartingNewChat(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  }

  async function ensureConversation() {
    if (activeCase) return activeCase;
    const response = await fetch("/api/trade-cases", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ automatic: true, title: "Document review" }),
    });
    const body = (await response.json()) as { error?: string; tradeCase?: ConversationCase };
    if (!response.ok || !body.tradeCase) {
      throw new Error(body.error ?? "A private conversation could not be started for the upload.");
    }
    updateCase(body.tradeCase);
    return body.tradeCase;
  }

  async function submitQuestion(question: string, mode: "instant" | "deep_research") {
    if (question.length < 3) {
      setError("Enter a question of at least 3 characters.");
      return;
    }

    setSending(true);
    setPendingQuestion(question);
    setDraft("");
    setError("");
    setStatus("Checking what is known and what must be confirmed next.");
    setActivities([]);
    setMissingInformation([]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(activeCase ? { tradeCaseId: activeCase.id } : {}),
          mode,
          question,
        }),
      });
      if (!response.ok || !response.body) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "The assistant could not answer this question.");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let resultBody: { output: GuidanceOutput; tradeCase: ConversationCase } | undefined;

      const consumeLine = (line: string) => {
        if (!line.trim()) return;
        const streamEvent = JSON.parse(line) as
          | ActivityEvent
          | { message: string; type: "error" }
          | { output: GuidanceOutput; tradeCase: ConversationCase; type: "result" };
        if (streamEvent.type === "activity") {
          setActivities((current) => [...current, streamEvent]);
          setStatus(streamEvent.message);
          return;
        }
        if (streamEvent.type === "error") throw new Error(streamEvent.message);
        resultBody = streamEvent;
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) consumeLine(line);
        if (done) break;
      }
      consumeLine(buffer);
      if (!resultBody) throw new Error("The assistant response ended before it could be saved.");
      const result = resultBody as { output: GuidanceOutput; tradeCase: ConversationCase };
      updateCase(result.tradeCase);
      setLatestOutput(result.output);
      setMissingInformation(result.output.missingInformation);
      setStatus(["incomplete", "assessment_incomplete", "action_required"].includes(result.output.state)
        ? "The next required information is shown in the conversation."
        : "The checked answer and its citations were saved.");
    } catch (caught) {
      setDraft(question);
      setError(caught instanceof Error ? caught.message : "The assistant could not answer this question.");
      setStatus("");
    } finally {
      setPendingQuestion("");
      setSending(false);
      requestAnimationFrame(() => composerRef.current?.focus());
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitQuestion(draft.trim(), "instant");
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  async function uploadAttachments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (attachmentFiles.length === 0) {
      setError("Choose at least one PDF, PNG, or JPEG document.");
      return;
    }
    if (!attachmentConsent) {
      setError("Confirm that you are authorised to process the selected documents.");
      return;
    }

    setUploading(true);
    setError("");
    setUploadResults([]);
    try {
      const conversation = await ensureConversation();
      const data = new FormData();
      data.set("tradeCaseId", conversation.id);
      data.set("documentType", attachmentType);
      data.set("documentConsent", "on");
      for (const file of attachmentFiles) data.append("documents", file);
      const response = await fetch("/api/documents", { method: "POST", body: data });
      const body = (await response.json()) as {
        error?: string;
        results?: UploadResult[];
        tradeCase?: ConversationCase;
      };
      if (!response.ok || !body.results || !body.tradeCase) {
        throw new Error(body.error ?? "The documents could not be inspected safely.");
      }
      updateCase(body.tradeCase);
      setUploadResults(body.results);
      setAttachmentFiles([]);
      setAttachmentConsent(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = "";
      setStatus("Document extraction finished. Confirm or correct visible fields in Conversation details.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The documents could not be inspected safely.");
    } finally {
      setUploading(false);
    }
  }

  async function deleteConversation(tradeCaseId: string) {
    setError("");
    const response = await fetch("/api/trade-cases", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tradeCaseId }),
    });
    const body = (await response.json()) as { error?: string; tradeCases?: ConversationCase[] };
    if (!response.ok || !body.tradeCases) {
      setError(body.error ?? "The conversation could not be deleted.");
      return;
    }
    setCases(body.tradeCases);
    const nextActiveCaseId = body.tradeCases[0]?.id ?? null;
    setActiveCaseId(nextActiveCaseId);
    setStatus("The conversation and its locally retained data were deleted.");
  }

  const messages = activeCase?.messages ?? [];
  const showEmptyState = messages.length === 0 && !pendingQuestion;

  return (
    <div className="chat-first-shell">
      <a className="skip-link" href="#chat-main">Skip to chat</a>
      <header className="chat-first-header">
        <Link className="wordmark" href="/" aria-label="India-China Trade Guidance home">
          <span aria-hidden="true">IC</span>
          India-China Trade Guidance
        </Link>
        <div className="chat-first-header-actions">
          <p>{deepResearchCapability === "available" ? "Deep research available" : "Instant official guidance available"}</p>
          <button className="new-chat-button" disabled={startingNewChat} onClick={() => void startNewChat()} type="button">
            {startingNewChat ? "Starting…" : "New chat"}
          </button>
        </div>
      </header>

      <div className="chat-first-layout">
        <main className="chat-thread" id="chat-main" tabIndex={-1}>
          <h1 className="sr-only">India-China Trade Guidance conversation</h1>
          {deepResearchCapability === "unavailable" ? (
            <aside className="ai-unavailable-notice" role="note" aria-label="AI configuration required">
              <strong>Deep research is temporarily unavailable.</strong>{" "}
              Instant guidance, saved facts and uploaded-document inspection remain available. You can retry after continuing the case.
            </aside>
          ) : null}
          {activeCase ? (
            <div className="active-conversation-strip" aria-label="Active conversation">
              <strong>{activeCase.title}</strong><span>{conversationDirection(activeCase)}</span>
            </div>
          ) : null}
          <div className="message-scroll">
            {showEmptyState ? (
              <section className="chat-empty-state" aria-labelledby="chat-empty-heading">
                <h2 id="chat-empty-heading">Ask about India-China trade</h2>
                <p>
                  Check import or export requirements, documents, regulators and duty estimates.
                  I’ll ask for missing facts in the conversation and cite checked official sources.
                </p>
                <div className="example-questions" aria-label="Example questions">
                  {EXAMPLE_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      onClick={() => {
                        setDraft(question);
                        requestAnimationFrame(() => composerRef.current?.focus());
                      }}
                      type="button"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="message-list" aria-label="Conversation">
              {messages.map((message) => (
                <article
                  aria-label={message.role === "assistant" ? "Assistant message" : "Your message"}
                  className={`chat-message ${message.role}`}
                  key={message.id}
                >
                  <p>{message.content}</p>
                  {message.citations.length > 0 ? (
                    <div className="inline-citations" aria-label="Inline citations">
                      {uniqueCitations(message.citations).map((citation) => (
                        <a
                          href={citation.url}
                          key={`${citation.sourceVersionId}-${citation.locator}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {citation.label}
                          <small>{citation.locator}</small>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
              {pendingQuestion ? (
                <article aria-label="Your message" className="chat-message user pending">
                  <p>{pendingQuestion}</p>
                </article>
              ) : null}
            </section>

            {displayedOutput ? <ReadinessAssessment output={displayedOutput} /> : null}

            {latestOutput?.state === "assessment_incomplete"
              && latestOutput.journeyStage !== "post_purchase_remediation"
              && activeCase !== null
              && !sending
              && deepResearchCapability === "available" ? (
                <section className="inline-next-steps" aria-label="Optional deep research">
                  <p>Optional. This checks broader product-specific sources and may take up to 5 minutes.</p>
                  <button
                    className="button-secondary"
                    onClick={() => void submitQuestion(
                      "Research the unresolved product-specific requirements for this saved shipment case.",
                      "deep_research",
                    )}
                    type="button"
                  >
                    Research this case deeply
                  </button>
                </section>
              ) : null}

            {activities.length > 0 ? (
              <details className="inline-evidence-details">
                <summary>What was checked</summary>
                <ol>
                  {activities.map((activity, index) => (
                    <li key={`${activity.at}-${index}`}>{activity.message}</li>
                  ))}
                </ol>
              </details>
            ) : null}

            {missingInformation.length > 0 ? (
              <section className="inline-next-steps" aria-label="Missing information and next steps">
                <strong>Still needed</strong>
                <ul>{missingInformation.map((item) => <li key={item}>{item}</li>)}</ul>
              </section>
            ) : null}

            {activeCase ? (
              <details className="conversation-details">
                <summary>Conversation details</summary>
                <div className="conversation-detail-summary">
                  <div><strong>Direction</strong><span>{conversationDirection(activeCase)}</span></div>
                  <div><strong>Confirmed facts</strong><span>{activeCase.confirmedFacts.length}</span></div>
                  <div><strong>Documents</strong><span>{activeCase.documents.length}</span></div>
                  <div><strong>Saved assessments</strong><span>{activeCase.assessmentSnapshots.length}</span></div>
                </div>
                {activeCase.confirmedFacts.length > 0 ? (
                  <details className="nested-detail">
                    <summary>Confirmed facts</summary>
                    <dl className="confirmed-fact-list">
                      {activeCase.confirmedFacts.map((fact) => (
                        <div key={fact.name}><dt>{fact.name.replaceAll("_", " ")}</dt><dd>{fact.value}</dd></div>
                      ))}
                    </dl>
                  </details>
                ) : null}
                {activeCase.memoryItems.some((item) => item.status === "active") ? (
                  <details className="nested-detail">
                    <summary>Assumptions and unresolved questions</summary>
                    <ul>
                      {activeCase.memoryItems.filter((item) => item.status === "active").map((item) => (
                        <li key={`${item.kind}-${item.key}`}><strong>{item.kind.replaceAll("_", " ")}</strong>: {JSON.stringify(item.value)}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
                <DocumentWorkspace
                  key={activeCase.id}
                  onDeleteCase={deleteConversation}
                  onTradeCaseChange={updateCase}
                  showUpload={false}
                  tradeCase={activeCase}
                />
                {activeCase.assessmentSnapshots.length > 0 ? (
                  <details className="nested-detail">
                    <summary>Checked assessment snapshots</summary>
                    {[...activeCase.assessmentSnapshots].reverse().map((snapshot) => (
                      <article className="snapshot-summary" key={snapshot.snapshotId}>
                        <h2>{snapshot.state}</h2>
                        {snapshot.blockers?.length ? <p>{snapshot.blockers.join(" ")}</p> : null}
                        <small>{snapshot.snapshotId}</small>
                      </article>
                    ))}
                  </details>
                ) : null}
                <details className="nested-detail">
                  <summary>Evidence boundary</summary>
                  <p>
                    Checked on {assessmentDate}. Current answers remain limited to admitted India and China
                    official evidence. Authenticated filing, payment, shipment, release and clearance status are not checked.
                  </p>
                  <p>
                    Reference source: <a href={source.url} rel="noreferrer" target="_blank">{source.label}</a>
                    {` (${source.authority}, ${source.locator})`}.
                  </p>
                </details>
              </details>
            ) : null}
          </div>

          <div className="composer-dock">
            {attachmentFiles.length > 0 ? (
              <form className="composer-attachments" onSubmit={uploadAttachments}>
                <div>
                  <strong>{attachmentFiles.length} {attachmentFiles.length === 1 ? "document" : "documents"} selected</strong>
                  <button onClick={() => setAttachmentFiles([])} type="button">Remove</button>
                </div>
                <label>
                  <span>Document type</span>
                  <select
                    onChange={(event) => setAttachmentType(event.target.value as DocumentType)}
                    value={attachmentType}
                  >
                    {DOCUMENT_TYPES.map((type) => <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type]}</option>)}
                  </select>
                </label>
                <label className="composer-consent">
                  <input
                    checked={attachmentConsent}
                    onChange={(event) => setAttachmentConsent(event.target.checked)}
                    type="checkbox"
                  />
                  <span>I am authorised to process these documents. Original bytes are not retained.</span>
                </label>
                <button className="button-secondary" disabled={uploading} type="submit">
                  {uploading ? "Inspecting documents..." : "Upload and review"}
                </button>
              </form>
            ) : null}

            {uploadResults.length > 0 ? (
              <ul className="composer-upload-results" aria-label="Document intake results">
                {uploadResults.map((result, index) => (
                  <li key={`${result.fileName}-${index}`}>{result.fileName}: {result.message}</li>
                ))}
              </ul>
            ) : null}

            <form className="chat-first-composer" onSubmit={sendMessage}>
              <label className="sr-only" htmlFor="chat-message">Message India-China Trade Guidance</label>
              <textarea
                aria-describedby="composer-help"
                disabled={sending || startingNewChat}
                id="chat-message"
                maxLength={2_000}
                name="question"
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Ask about an India-China shipment..."
                ref={composerRef}
                rows={1}
                value={draft}
              />
              <div className="composer-actions">
                <label className="attachment-button" htmlFor="composer-attachments">Attach documents</label>
                <input
                  accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
                  id="composer-attachments"
                  multiple
                  onChange={(event) => setAttachmentFiles(Array.from(event.target.files ?? []))}
                  ref={attachmentInputRef}
                  type="file"
                />
                <button className="button-primary" disabled={sending || startingNewChat || draft.trim().length < 3} type="submit">
                  {sending ? "Checking..." : "Send message"}
                </button>
              </div>
            </form>
            <p id="composer-help">Enter sends. Shift+Enter adds a line. Answers can be incomplete and are not clearance decisions.</p>
            {error ? <p className="chat-first-error" role="alert">{error}</p> : null}
            <p className="sr-status" role="status">{status}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
