import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";

import { getOfficialConnector, hostMatchesAllowedDomain } from "../evidence/registry";
import {
  CHARACTERISTIC_CATALOG,
  ElectronicsKnowledgeGraphSchema,
  type AdmissionSeedJson,
  type ElectronicsKnowledgeGraphJson,
  type FieldEvidenceBindingJson,
  type KnowledgeEdgeJson,
  type KnowledgeNodeJson,
  type KnowledgeNodeKind,
  type SatisfactionCondition,
} from "./electronics-domain";
import type { RegulatoryStore } from "./regulatory-store";

const REQUIRED_FIELDS: Record<KnowledgeNodeKind, readonly string[]> = {
  characteristic: [],
  statutory_entry: ["system", "entryId", "officialLabel"],
  requirement: ["actionCode", "ownerRole", "dueStage"],
  document: ["documentKind", "officialName", "issuerRole", "acceptedForm"],
  policy_clause: ["authority", "instrumentTitle", "exactLocator", "pageNumbers", "canonicalUrl"],
  agency: ["authorityName", "role"],
  filing_service: ["officialServiceName", "canonicalUrl", "access", "filerRole", "loginRequirement"],
  contact: ["value", "purpose"],
  calculation_rule: ["componentId"],
  coverage_gap: [],
};

const CLOSED_ENUM_PHRASES: Record<string, Record<string, readonly string[]>> = {
  access: {
    public: ["no login required", "publicly accessible"],
    login_required: ["login", "log in", "sign in", "registered user"],
    broker_only: ["customs broker only", "only by a customs broker"],
    offline: ["service unavailable", "temporarily unavailable"],
  },
  actionCode: {
    obtain: ["obtain", "must hold", "shall have"],
    prepare: ["prepare", "shall furnish", "required document"],
    file: ["file", "submit"],
    upload: ["upload"],
    review: ["review", "verify", "check"],
    confirm: ["confirm", "determine"],
    engage: ["engage", "appoint"],
  },
  ownerRole: {
    importer: ["importer", "applicant"],
    supplier: ["supplier", "manufacturer"],
    customs_broker: ["customs broker"],
    authorized_indian_representative: ["authorized indian representative"],
    laboratory: ["laboratory"],
  },
  filerRole: {
    importer: ["importer", "applicant"],
    supplier: ["supplier", "manufacturer"],
    customs_broker: ["customs broker"],
    authorized_indian_representative: ["authorized indian representative"],
    laboratory: ["laboratory"],
  },
  issuerRole: {
    importer: ["importer", "applicant"],
    supplier: ["supplier", "manufacturer"],
    customs_broker: ["customs broker"],
    authorized_indian_representative: ["authorized indian representative"],
    laboratory: ["laboratory"],
  },
  dueStage: {
    before_purchase: ["before purchase"],
    before_shipment: ["before shipment", "prior to shipment"],
    before_arrival: ["before arrival", "prior to arrival"],
    before_customs_filing: ["before filing", "prior to filing"],
    before_sale: ["before sale", "prior to sale"],
  },
  system: {
    ITC_HS: ["itc (hs)", "indian trade classification"],
    BIS_CRS: ["bureau of indian standards", "bis", "compulsory registration scheme"],
    TEC_MTCTE: ["telecommunication engineering centre", "tec", "mtcte"],
    WPC_ETA: ["wireless planning and coordination", "wpc", "equipment type approval"],
  },
  role: {
    customs: ["customs"],
    licensing: ["licence", "license", "licensing"],
    standards: ["standard", "conformity assessment"],
    telecom: ["telecom", "telecommunication"],
    environmental: ["environment", "pollution control"],
    consumer_protection: ["consumer protection", "legal metrology"],
  },
  documentKind: {
    invoice: ["invoice"],
    transport: ["transport"],
    approval: ["approval"],
    registration: ["registration"],
    certificate: ["certificate"],
    declaration: ["declaration"],
  },
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizedSha256(value: string) {
  return createHash("sha256").update(normalizeText(value)).digest("hex");
}

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertContained(needle: string, haystack: string, description: string) {
  if (!normalizeText(haystack).includes(normalizeText(needle))) {
    throw new Error(`${description} is not present in admitted exact evidence.`);
  }
}

function snapshotPath(snapshotRoot: string, path: string) {
  if (isAbsolute(path)) throw new Error("Snapshot paths must be relative.");
  const root = resolve(snapshotRoot);
  const resolved = resolve(root, path);
  if (relative(root, resolved).startsWith("..")) throw new Error("Snapshot path escapes the configured root.");
  return resolved;
}

function satisfactionLeaves(condition: SatisfactionCondition): Array<Exclude<SatisfactionCondition, { all: unknown }>> {
  if ("all" in condition) return condition.all.flatMap(satisfactionLeaves);
  return [condition];
}

function requireNode(nodes: Map<string, KnowledgeNodeJson>, id: string, description: string) {
  const node = nodes.get(id);
  if (!node) throw new Error(`${description} references missing node ${id}.`);
  return node;
}

function validateNodeReferences(node: KnowledgeNodeJson, nodes: Map<string, KnowledgeNodeJson>) {
  if (node.contactNodeId) {
    if (requireNode(nodes, node.contactNodeId, node.id).kind !== "contact") {
      throw new Error(`${node.id} contactNodeId must reference a contact node.`);
    }
  }
  if (["filing_service", "contact", "coverage_gap"].includes(node.kind)) {
    const authorityNodeId = (node.payload as { authorityNodeId: string }).authorityNodeId;
    if (requireNode(nodes, authorityNodeId, node.id).kind !== "agency") {
      throw new Error(`${node.id} authorityNodeId must reference an agency node.`);
    }
  }
  if (node.kind === "characteristic") {
    const id = (node.payload as { characteristicId: string }).characteristicId;
    if (!(id in CHARACTERISTIC_CATALOG)) throw new Error(`${node.id} uses an uncatalogued characteristic.`);
  }
  if (node.kind === "calculation_rule") {
    for (const id of (node.payload as { requiredCharacteristicIds: string[] }).requiredCharacteristicIds) {
      if (!(id in CHARACTERISTIC_CATALOG)) throw new Error(`${node.id} uses an uncatalogued calculation input.`);
    }
  }
  if (node.kind === "contact") {
    const payload = node.payload as { channel: string; value: string };
    const valid = payload.channel === "official_web"
      ? /^https:\/\//i.test(payload.value)
      : payload.channel === "email"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.value)
        : /^\+?[0-9][0-9 ()-]{5,}[0-9]$/.test(payload.value);
    if (!valid) throw new Error(`${node.id} contact channel does not match its value syntax.`);
  }
  if (
    node.kind === "document" &&
    (node.payload as KnowledgeNodeJson<"document">["payload"]).documentKind === "other" &&
    node.state === "actionable"
  ) {
    throw new Error(`${node.id} documentKind other cannot be actionable.`);
  }
}

function validatePendingState(node: KnowledgeNodeJson) {
  const pending = node.state === "evidence_pending" || node.state === "coverage_pending";
  if (pending && (!node.pendingReason || !node.verificationOwner || !node.contactNodeId)) {
    throw new Error(`${node.id} pending state requires pendingReason, verificationOwner, and contactNodeId.`);
  }
  if (node.kind === "coverage_gap" && Object.keys(node.fieldEvidence).length > 0) {
    throw new Error(`${node.id} coverage gaps cannot carry activation evidence.`);
  }
}

function validateClosedEnum(
  node: KnowledgeNodeJson,
  field: string,
  value: unknown,
  supportText: string,
  admission: AdmissionSeedJson,
) {
  if (typeof value !== "string") throw new Error(`${node.id}.${field} is not a closed string enum.`);
  let phrases = CLOSED_ENUM_PHRASES[field]?.[value];
  if (["ownerRole", "filerRole", "issuerRole"].includes(field) && value === "authority") {
    phrases = [admission.evidence.authorityName];
  }
  if (field === "system" && value === "OTHER") phrases = [node.label];
  if (!phrases?.some((phrase) => normalizeText(supportText).includes(normalizeText(phrase)))) {
    throw new Error(`${node.id}.${field} lacks closed-enum support.`);
  }
}

function validateFieldSupport(
  node: KnowledgeNodeJson,
  field: string,
  binding: FieldEvidenceBindingJson,
  admission: AdmissionSeedJson,
) {
  if (binding.claimId !== `kg:${node.id}:${field}`) throw new Error(`${node.id}.${field} has an invalid claimId.`);
  if (binding.exactLocator !== admission.evidence.exactLocator.value) {
    throw new Error(`${node.id}.${field} locator does not match its admission.`);
  }
  if (normalizedSha256(binding.supportText) !== binding.supportSha256) {
    throw new Error(`${node.id}.${field} support hash does not match.`);
  }
  assertContained(binding.supportText, admission.exactExcerpt, `${node.id}.${field} support text`);
  const value = (node.payload as Record<string, unknown>)[field];
  if (binding.supportMode === "exact_text") {
    const values = Array.isArray(value) ? value : [value];
    if (values.length === 0 || values.some((item) => typeof item !== "string" || !normalizeText(binding.supportText).includes(normalizeText(item)))) {
      throw new Error(`${node.id}.${field} lacks exact-text payload support.`);
    }
  } else if (binding.supportMode === "exact_url") {
    if (typeof value !== "string" || (!admission.exactExcerpt.includes(value) && value !== admission.evidence.finalUrl)) {
      throw new Error(`${node.id}.${field} lacks exact URL support.`);
    }
  } else if (binding.supportMode === "exact_number") {
    if (typeof value !== "number") throw new Error(`${node.id}.${field} exact_number requires a number.`);
    const unit = "unit" in node.payload ? String((node.payload as { unit?: unknown }).unit ?? "") : "";
    const pattern = new RegExp(`(?:^|\\D)${escapePattern(String(value))}\\s*${escapePattern(unit)}(?:$|\\D)`, "i");
    if (!unit || !pattern.test(binding.supportText) || !pattern.test(admission.exactExcerpt)) {
      throw new Error(`${node.id}.${field} lacks exact number and canonical unit support.`);
    }
  } else {
    validateClosedEnum(node, field, value, binding.supportText, admission);
  }
}

function orderedEdgePattern(edge: KnowledgeEdgeJson, fromLabel: string, toLabel: string, supportText: string) {
  const text = normalizeText(supportText);
  const from = escapePattern(normalizeText(fromLabel));
  const to = escapePattern(normalizeText(toLabel));
  const bounded = ".{0,500}?";
  if (edge.relation === "precedes") {
    return new RegExp(`${from}${bounded}(?:before|prior to)${bounded}${to}|${to}${bounded}after${bounded}${from}`).test(text);
  }
  if (edge.relation === "requires") {
    return new RegExp(`${from}${bounded}(?:requires|shall require|must require)${bounded}${to}`).test(text);
  }
  if (edge.relation === "filed_at") {
    return new RegExp(`${from}${bounded}(?:file|submit|upload)${bounded}(?:at|through|on)${bounded}${to}`).test(text);
  }
  if (edge.relation === "owned_by") {
    return new RegExp(`${to}${bounded}(?:shall|must|is responsible for)${bounded}${from}`).test(text);
  }
  const verb = edge.relation.replaceAll("_", " ");
  return text.includes(normalizeText(fromLabel)) && text.includes(normalizeText(toLabel)) && text.includes(verb);
}

function validateEdgeSupport(
  edge: KnowledgeEdgeJson,
  from: KnowledgeNodeJson,
  to: KnowledgeNodeJson,
  admission: AdmissionSeedJson,
) {
  if (edge.evidence.claimId !== `kg-edge:${edge.id}`) throw new Error(`${edge.id} has an invalid edge claimId.`);
  if (edge.evidence.exactLocator !== admission.evidence.exactLocator.value) throw new Error(`${edge.id} locator does not match its admission.`);
  if (normalizedSha256(edge.evidence.supportText) !== edge.evidence.supportSha256) throw new Error(`${edge.id} support hash does not match.`);
  assertContained(edge.evidence.supportText, admission.exactExcerpt, `${edge.id} support text`);
  if (!orderedEdgePattern(edge, from.label, to.label, edge.evidence.supportText)) {
    throw new Error(`${edge.id} evidence does not prove the ordered relationship direction.`);
  }
}

function validateRequirements(graph: ElectronicsKnowledgeGraphJson, nodes: Map<string, KnowledgeNodeJson>) {
  for (const node of graph.nodes) {
    if (node.kind !== "requirement") continue;
    const requirement = node as KnowledgeNodeJson<"requirement">;
    const requires = graph.edges.filter((edge) => edge.from === node.id && edge.relation === "requires");
    if (requires.length !== 1) throw new Error(`${node.id} must have exactly one outgoing requires edge.`);
    const target = requireNode(nodes, requirement.payload.targetNodeId, node.id);
    if (requires[0]?.to !== target.id) throw new Error(`${node.id} targetNodeId must equal its requires edge target.`);
    if (target.kind !== "document") throw new Error(`${node.id} requires target must be a document node.`);
    const document = target as KnowledgeNodeJson<"document">;
    for (const leaf of satisfactionLeaves(requirement.payload.satisfaction)) {
      if (leaf.targetNodeId !== target.id) throw new Error(`${node.id} satisfaction target does not match its obligation target.`);
      const kind = document.payload.documentKind;
      if (leaf.kind === "verified_approval" && !["approval", "certificate"].includes(kind)) {
        throw new Error(`${node.id} approval satisfaction has an incompatible document kind.`);
      }
      if (leaf.kind === "verified_registration" && kind !== "registration") {
        throw new Error(`${node.id} registration satisfaction has an incompatible document kind.`);
      }
      if (leaf.kind === "verified_official_record" && !["approval", "registration", "certificate", "declaration"].includes(kind)) {
        throw new Error(`${node.id} official-record satisfaction has an incompatible document kind.`);
      }
    }
  }
}

async function validateSnapshot(seed: AdmissionSeedJson, snapshotRoot: string) {
  const bytes = await readFile(snapshotPath(snapshotRoot, seed.evidence.snapshotRelativePath));
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== seed.evidence.sha256) {
    throw new Error(`Snapshot hash mismatch for ${seed.evidence.sourceVersionId}.`);
  }
}

function validateAdmissionScope(seed: AdmissionSeedJson) {
  const evidence = seed.evidence;
  const connector = getOfficialConnector(evidence.connectorId);
  const expectedDocumentVersionId = `${evidence.connectorId}-${evidence.sha256.slice(0, 16)}`;
  const claimFingerprint = createHash("sha256")
    .update(JSON.stringify({
      applicability: evidence.applicability,
      applicabilityEvidence: evidence.applicabilityEvidence,
      amendment: seed.amendment,
      authorityName: evidence.authorityName,
      effectiveFrom: evidence.effectiveFrom,
      exactExcerpt: seed.exactExcerpt,
      exactLocator: evidence.exactLocator,
      instrumentId: evidence.instrumentId,
      instrumentTitle: evidence.instrumentTitle,
      identityEvidence: evidence.identityEvidence,
      translation: evidence.translation,
    }))
    .digest("hex")
    .slice(0, 10);
  const expectedSourceVersionId = `${expectedDocumentVersionId}-${claimFingerprint}`;
  const transitionStates = evidence.transitions.map((transition) => transition.state);
  const transitionTimes = evidence.transitions.map((transition) => Date.parse(transition.at));
  const finalHost = new URL(evidence.finalUrl).hostname;
  if (
    !connector ||
    connector.jurisdiction !== "India" ||
    !hostMatchesAllowedDomain(finalHost, connector.allowedDomains) ||
    evidence.documentVersionId !== expectedDocumentVersionId ||
    evidence.sourceVersionId !== expectedSourceVersionId ||
    evidence.jurisdiction !== "India" ||
    evidence.applicability.appliesIn !== "India" ||
    evidence.applicability.tradeDirection !== "china_to_india" ||
    evidence.promptInjectionDetected ||
    evidence.translation.materialAmbiguity ||
    transitionStates.join(",") !== "discovered,snapshotted,extracted,validated,admitted" ||
    transitionTimes.some((time, index) => !Number.isFinite(time) || (index > 0 && time < (transitionTimes[index - 1] ?? time))) ||
    Date.parse(`${evidence.effectiveFrom}T00:00:00.000Z`) > Date.parse(`${evidence.freshUntil}T23:59:59.999Z`) ||
    (seed.amendment.status === "superseding") !== Boolean(seed.amendment.supersedesDocumentVersionId)
  ) {
    throw new Error(`${evidence.sourceVersionId} is not a clean India china_to_india admission.`);
  }
  assertContained(evidence.applicabilityEvidence.exactExcerpt, seed.exactExcerpt, "Applicability evidence");
  for (const span of Object.values(evidence.identityEvidence)) {
    assertContained(span.exactExcerpt, seed.exactExcerpt, "Identity evidence");
  }
}

function conflictStatus(seed: AdmissionSeedJson, all: AdmissionSeedJson[]) {
  const conflicting = all.some((candidate) => candidate !== seed &&
    candidate.evidence.instrumentId === seed.evidence.instrumentId &&
    JSON.stringify(candidate.evidence.applicability) === JSON.stringify(seed.evidence.applicability) &&
    candidate.evidence.exactLocator.value === seed.evidence.exactLocator.value &&
    normalizeText(candidate.exactExcerpt) !== normalizeText(seed.exactExcerpt) &&
    candidate.amendment.supersedesDocumentVersionId !== seed.evidence.documentVersionId &&
    seed.amendment.supersedesDocumentVersionId !== candidate.evidence.documentVersionId);
  return conflicting ? "conflicting" as const : "clear" as const;
}

export async function loadElectronicsKnowledgeGraph({
  input,
  regulatoryStore,
  snapshotRoot,
}: {
  input: unknown;
  regulatoryStore: RegulatoryStore;
  snapshotRoot: string;
}): Promise<ElectronicsKnowledgeGraphJson> {
  const graph = ElectronicsKnowledgeGraphSchema.parse(input) as ElectronicsKnowledgeGraphJson;
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const sourceIds = new Set<string>();
  for (const admission of graph.admissions) {
    if (sourceIds.has(admission.evidence.sourceVersionId)) throw new Error(`Duplicate source version ${admission.evidence.sourceVersionId}.`);
    sourceIds.add(admission.evidence.sourceVersionId);
    validateAdmissionScope(admission);
    await validateSnapshot(admission, snapshotRoot);
  }
  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) throw new Error(`Duplicate knowledge node ${node.id}.`);
    nodeIds.add(node.id);
  }
  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) throw new Error(`Duplicate knowledge edge ${edge.id}.`);
    edgeIds.add(edge.id);
  }
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const admissions = new Map(graph.admissions.map((seed) => [seed.evidence.sourceVersionId, seed]));
  for (const node of graph.nodes) {
    validatePendingState(node);
    validateNodeReferences(node, nodes);
    const allowed = new Set(REQUIRED_FIELDS[node.kind]);
    for (const field of Object.keys(node.fieldEvidence)) {
      if (!allowed.has(field)) throw new Error(`${node.id} has unknown field evidence ${field}.`);
    }
    if (node.state === "actionable") {
      for (const field of allowed) {
        if (!node.fieldEvidence[field]) throw new Error(`${node.id} is missing evidence for ${field}.`);
      }
    }
    for (const [field, binding] of Object.entries(node.fieldEvidence)) {
      const admission = admissions.get(binding.sourceVersionId);
      if (!admission) throw new Error(`${node.id}.${field} references an unknown admission.`);
      validateFieldSupport(node, field, binding, admission);
    }
  }
  for (const edge of graph.edges) {
    const from = requireNode(nodes, edge.from, edge.id);
    const to = requireNode(nodes, edge.to, edge.id);
    const admission = admissions.get(edge.evidence.sourceVersionId);
    if (!admission) throw new Error(`${edge.id} references an unknown admission.`);
    validateEdgeSupport(edge, from, to, admission);
  }
  validateRequirements(graph, nodes);

  const metadata = new Map<string, {
    effectiveFrom: string;
    freshUntil: string;
    sourceVersionId: string;
    conflictStatus: "clear" | "conflicting" | "unverified";
  }>();
  for (const admission of graph.admissions) {
    const evidence = admission.evidence;
    const conflict = conflictStatus(admission, graph.admissions);
    regulatoryStore.recordAdmittedEvidence({
      ...evidence,
      amendment: {
        status: admission.amendment.status,
        note: admission.amendment.note,
        ...(admission.amendment.supersedesDocumentVersionId
          ? { supersedesDocumentVersionId: admission.amendment.supersedesDocumentVersionId }
          : {}),
      },
      exactExcerpt: admission.exactExcerpt,
      originalLanguage: evidence.originalLanguage,
      translation: evidence.translation,
    });
    metadata.set(evidence.sourceVersionId, {
      sourceVersionId: evidence.sourceVersionId,
      effectiveFrom: evidence.effectiveFrom,
      freshUntil: evidence.freshUntil,
      conflictStatus: conflict,
    });
  }
  regulatoryStore.electronicsKnowledge.replaceGraph(graph, metadata);
  return graph;
}

export async function loadElectronicsKnowledgeGraphFile({
  filePath,
  regulatoryStore,
  snapshotRoot = dirname(filePath),
}: {
  filePath: string;
  regulatoryStore: RegulatoryStore;
  snapshotRoot?: string;
}) {
  const input: unknown = JSON.parse(await readFile(filePath, "utf8"));
  return loadElectronicsKnowledgeGraph({ input, regulatoryStore, snapshotRoot });
}

export async function loadProductionElectronicsKnowledgeGraph(
  regulatoryStore: RegulatoryStore,
  {
    projectRoot = process.cwd(),
    required = process.env.BWMI_VALIDATE_PRODUCTION_KNOWLEDGE === "1",
  }: { projectRoot?: string; required?: boolean } = {},
) {
  const filePath = join(projectRoot, "evidence", "knowledge", "china-india-electronics-v1.json");
  if (!existsSync(filePath)) {
    if (required) throw new Error(`Production electronics knowledge graph is missing at ${filePath}.`);
    return null;
  }
  return loadElectronicsKnowledgeGraphFile({ filePath, regulatoryStore, snapshotRoot: projectRoot });
}
