import { createHash } from "node:crypto";

import type { ConversationStore, DocumentRecord } from "../conversations/conversation-store";
import {
  FieldEvidenceBindingSchema,
  evaluateCondition,
  type ActionDossier,
  type CaseSatisfactionEvidence,
  type DossierItem,
  type DossierStatus,
  type ElectronicsProfile,
  type EvidenceBoundValue,
  type EvidenceRefreshOverlay,
  type FieldEvidenceBindingJson,
  type FilingPortal,
  type KnowledgeNodeJson,
  type PolicyLocator,
  type SatisfactionCondition,
} from "../knowledge/electronics-domain";
import type {
  ElectronicsKnowledgeMatch,
  ElectronicsKnowledgeStore,
  KnowledgeEvidenceBinding,
} from "../knowledge/electronics-knowledge-store";
import type { ReferenceEvidence, RegulatoryStore } from "../knowledge/regulatory-store";

const REQUIRED_FIELDS: Record<KnowledgeNodeJson["kind"], readonly string[]> = {
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

const CLOSED_ENUM_SUPPORT: Record<string, Record<string, readonly string[]>> = {
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

type EffectiveBinding = KnowledgeEvidenceBinding | (FieldEvidenceBindingJson & {
  effectiveFrom: string;
  freshUntil: string;
  conflictStatus: "clear";
  fieldPath: string;
});

interface EffectiveMatch extends ElectronicsKnowledgeMatch {
  effectiveBindings: EffectiveBinding[];
  effectiveCurrent: boolean;
}

const verifiedSatisfactionEvidence = new WeakSet<object>();

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizedSha256(value: string) {
  return createHash("sha256").update(normalizeText(value)).digest("hex");
}

function recordPayload(node: KnowledgeNodeJson) {
  return node.payload as unknown as Record<string, unknown>;
}

function metadataCurrent(
  metadata: { effectiveFrom: string; freshUntil: string; conflictStatus: string },
  at: Date,
) {
  const instant = at.getTime();
  return metadata.conflictStatus === "clear" &&
    new Date(`${metadata.effectiveFrom}T00:00:00.000Z`).getTime() <= instant &&
    new Date(`${metadata.freshUntil}T23:59:59.999Z`).getTime() >= instant;
}

function fieldValueSupported(
  node: KnowledgeNodeJson,
  fieldPath: string,
  binding: FieldEvidenceBindingJson,
  exactExcerpt: string,
  finalUrl: string,
  authority: string,
) {
  const support = normalizeText(binding.supportText);
  const excerpt = normalizeText(exactExcerpt);
  if (!excerpt.includes(support)) throw new Error(`${node.id}.${fieldPath} support is not an exact admitted excerpt.`);
  if (normalizedSha256(binding.supportText) !== binding.supportSha256) {
    throw new Error(`${node.id}.${fieldPath} support hash does not match.`);
  }
  const value = recordPayload(node)[fieldPath];
  if (binding.supportMode === "exact_text") {
    const values = Array.isArray(value) ? value : [value];
    if (values.length === 0 || values.some((item) => typeof item !== "string" || !support.includes(normalizeText(item)))) {
      throw new Error(`${node.id}.${fieldPath} support does not contain the frozen field value.`);
    }
    return;
  }
  if (binding.supportMode === "exact_url") {
    if (typeof value !== "string" || (value !== finalUrl && !exactExcerpt.includes(value))) {
      throw new Error(`${node.id}.${fieldPath} URL is outside admitted evidence.`);
    }
    return;
  }
  if (binding.supportMode === "exact_number") {
    if (typeof value !== "number" || !new RegExp(`(?:^|\\D)${String(value).replace(".", "\\.")}(?:$|\\D)`).test(binding.supportText)) {
      throw new Error(`${node.id}.${fieldPath} exact number is unsupported.`);
    }
    return;
  }
  if (typeof value !== "string") throw new Error(`${node.id}.${fieldPath} is not a frozen enum.`);
  const phrases = value === "authority" && ["ownerRole", "filerRole", "issuerRole"].includes(fieldPath)
    ? [authority]
    : value === "OTHER" && fieldPath === "system"
      ? [node.label]
      : CLOSED_ENUM_SUPPORT[fieldPath]?.[value];
  if (!phrases?.some((phrase) => support.includes(normalizeText(phrase)))) {
    throw new Error(`${node.id}.${fieldPath} closed enum lacks exact admitted support.`);
  }
}

export function validateEvidenceRefreshOverlay({
  knowledgeStore,
  overlay,
  profile,
  regulatoryStore,
  at = new Date(),
}: {
  knowledgeStore: ElectronicsKnowledgeStore;
  overlay: EvidenceRefreshOverlay;
  profile: ElectronicsProfile;
  regulatoryStore: RegulatoryStore;
  at?: Date;
}): EvidenceRefreshOverlay {
  if (!overlay || typeof overlay.knowledgeNodeId !== "string" || !overlay.replacements || Array.isArray(overlay.replacements)) {
    throw new Error("Evidence refresh overlay has an invalid closed shape.");
  }
  if (Object.keys(overlay).some((key) => !["knowledgeNodeId", "replacements"].includes(key))) {
    throw new Error("Evidence refresh overlay contains an unknown field.");
  }
  const stored = knowledgeStore.getNode(overlay.knowledgeNodeId);
  if (!stored) throw new Error("Evidence refresh overlay references an unknown node.");
  const node = stored.node;
  if (node.kind === "coverage_gap" || !["actionable", "evidence_pending"].includes(node.state)) {
    throw new Error("Coverage gaps and unknown states cannot be activated by an overlay.");
  }
  const applicability = evaluateCondition(node.conditions, profile.characteristics);
  if (applicability.value !== true) throw new Error("Overlay node is not applicable to confirmed active-case characteristics.");
  const fields = Object.entries(overlay.replacements);
  if (fields.length === 0) throw new Error("Evidence refresh overlay must replace at least one frozen field binding.");
  const allowed = new Set(REQUIRED_FIELDS[node.kind]);
  for (const [fieldPath, unparsed] of fields) {
    if (!allowed.has(fieldPath) || !(fieldPath in recordPayload(node))) {
      throw new Error(`${node.id}.${fieldPath} is not an existing frozen evidence field.`);
    }
    const binding = FieldEvidenceBindingSchema.parse(unparsed);
    if (binding.claimId !== `kg:${node.id}:${fieldPath}`) {
      throw new Error(`${node.id}.${fieldPath} cannot change the frozen field claim.`);
    }
    const source = regulatoryStore.getAdmittedEvidenceForGuidance(binding.sourceVersionId, {
      appliesIn: "India",
      tradeDirection: profile.intake.direction,
    });
    if (source.locator !== binding.exactLocator) throw new Error(`${node.id}.${fieldPath} source locator is outside scope.`);
    if (!metadataCurrent({ ...source, conflictStatus: "clear" }, at)) throw new Error(`${node.id}.${fieldPath} evidence is not current.`);
    fieldValueSupported(node, fieldPath, binding, source.exactExcerpt, source.url, source.authority);
  }
  return {
    knowledgeNodeId: overlay.knowledgeNodeId,
    replacements: Object.fromEntries(fields.map(([field, value]) => [field, FieldEvidenceBindingSchema.parse(value)])),
  };
}

function effectiveMatches(input: {
  at: Date;
  evidenceRefreshOverlays: EvidenceRefreshOverlay[];
  knowledgeStore: ElectronicsKnowledgeStore;
  profile: ElectronicsProfile;
  regulatoryStore: RegulatoryStore;
}) {
  const overlays = new Map<string, EvidenceRefreshOverlay>();
  for (const overlay of input.evidenceRefreshOverlays) {
    const validated = validateEvidenceRefreshOverlay({ ...input, overlay });
    if (overlays.has(validated.knowledgeNodeId)) throw new Error("Only one evidence overlay per node is accepted.");
    overlays.set(validated.knowledgeNodeId, validated);
  }
  return input.knowledgeStore.matchNodes(input.profile.characteristics, { at: input.at }).map((match): EffectiveMatch => {
    const bindings = new Map(match.evidenceBindings.map((binding) => [binding.fieldPath, binding]));
    const overlay = overlays.get(match.node.id);
    for (const [fieldPath, binding] of Object.entries(overlay?.replacements ?? {})) {
      const source = input.regulatoryStore.getAdmittedEvidenceForGuidance(binding.sourceVersionId, {
        appliesIn: "India",
        tradeDirection: input.profile.intake.direction,
      });
      bindings.set(fieldPath, {
        ...binding,
        conflictStatus: "clear",
        effectiveFrom: source.effectiveFrom,
        freshUntil: source.freshUntil,
        fieldPath,
      });
    }
    const effectiveBindings = [...bindings.values()].sort((left, right) => left.fieldPath.localeCompare(right.fieldPath));
    const required = REQUIRED_FIELDS[match.node.kind];
    const effectiveCurrent = match.applicability === true && match.node.kind !== "coverage_gap" &&
      required.every((field) => {
        const binding = bindings.get(field);
        return binding ? metadataCurrent(binding, input.at) : false;
      });
    return { ...match, effectiveBindings, effectiveCurrent };
  });
}

function policyLocators(
  bindings: EffectiveBinding[],
  regulatoryStore: RegulatoryStore,
  at: Date,
  admittedPageNumbers?: EvidenceBoundValue<string>,
): PolicyLocator[] {
  const results = new Map<string, PolicyLocator>();
  for (const binding of bindings) {
    if (!metadataCurrent(binding, at)) continue;
    try {
      const source = regulatoryStore.getAdmittedEvidenceForGuidance(binding.sourceVersionId, {
        appliesIn: "India",
        tradeDirection: "china_to_india",
      });
      const key = `${source.sourceVersionId}:${binding.exactLocator}`;
      results.set(key, {
        authority: source.authority,
        instrumentTitle: source.instrumentTitle,
        exactLocator: binding.exactLocator,
        ...(admittedPageNumbers?.sourceVersionId === source.sourceVersionId
          && /^(?:p(?:age)?s?\.?\s*)?\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*(?:p(?:age)?s?\.?\s*)?\d+(?:\s*[-–]\s*\d+)?)*$/i.test(admittedPageNumbers.value.trim())
          ? { pageNumbers: admittedPageNumbers.value }
          : {}),
        canonicalUrl: source.url,
        sourceVersionId: source.sourceVersionId,
        verifiedAt: source.effectiveFrom,
        freshUntil: source.freshUntil,
      });
    } catch {
      // A binding that no longer resolves is deliberately omitted and cannot make an item current.
    }
  }
  return [...results.values()].sort((left, right) =>
    `${left.sourceVersionId}:${left.exactLocator}`.localeCompare(`${right.sourceVersionId}:${right.exactLocator}`)
  );
}

function bindingFromEdge(edge: EffectiveMatch["outgoingEdges"][number]): EffectiveBinding {
  return {
    ...edge.evidence,
    effectiveFrom: edge.effectiveFrom,
    freshUntil: edge.freshUntil,
    conflictStatus: edge.conflictStatus,
    fieldPath: `edge:${edge.id}`,
  };
}

function pendingReason(match: EffectiveMatch) {
  if (match.missingCharacteristics.length > 0) {
    const labels = match.missingCharacteristics.map((id) => ({
      "radio.frequency_hz": "radio frequency",
      "radio.transmit_power_w": "maximum radio transmit power",
    } as Record<string, string>)[id] ?? id.replaceAll(/[._]/g, " "));
    return `Confirm: ${labels.join(", ")}.`;
  }
  return match.node.pendingReason ?? "Current admitted field or relationship evidence is incomplete, stale, or conflicting.";
}

function humanOwner(owner: string) {
  return ({
    importer: "Importer",
    supplier: "Supplier",
    customs_broker: "Customs broker",
    authorized_indian_representative: "Authorised Indian representative",
    laboratory: "Testing laboratory",
    authority: "Named authority",
  } as Record<string, string>)[owner] ?? owner;
}

function humanStage(stage: string) {
  return stage.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase());
}

function sentenceCase(value: string) {
  return value.replace(/^./, (letter) => letter.toUpperCase());
}

function itemForMatch(
  match: EffectiveMatch,
  status: DossierStatus,
  action: string,
  owner: string,
  locators: PolicyLocator[],
  filingPortals: FilingPortal[] = [],
): DossierItem {
  return {
    id: match.node.id,
    status,
    label: match.node.label,
    action: sentenceCase(action),
    owner: humanOwner(owner),
    why: status === "pending" ? pendingReason(match) : "Current admitted evidence supports this bounded dossier item.",
    policyLocators: locators,
    filingPortals,
  };
}

function evidenceValue<T>(
  match: EffectiveMatch,
  fieldPath: string,
  value: T,
  at: Date,
): EvidenceBoundValue<T> | null {
  const binding = match.effectiveBindings.find((candidate) => candidate.fieldPath === fieldPath);
  return binding && metadataCurrent(binding, at) ? {
    value,
    claimId: binding.claimId,
    sourceVersionId: binding.sourceVersionId,
    exactLocator: binding.exactLocator,
  } : null;
}

function edgeCurrent(edge: EffectiveMatch["outgoingEdges"][number], profile: ElectronicsProfile, at: Date) {
  return metadataCurrent(edge, at) && evaluateCondition(edge.conditions, profile.characteristics).value === true;
}

function portalFor(
  match: EffectiveMatch,
  matches: Map<string, EffectiveMatch>,
  profile: ElectronicsProfile,
  regulatoryStore: RegulatoryStore,
  at: Date,
): FilingPortal | null {
  if (match.node.kind !== "filing_service" || match.applicability !== true) return null;
  const filingEdge = match.outgoingEdges.find((edge) => edge.relation === "filed_at" && edgeCurrent(edge, profile, at));
  if (!filingEdge) return null;
  const destination = matches.get(filingEdge.to);
  if (!destination || destination.node.kind !== "filing_service" || destination.applicability !== true) return null;
  const payload = destination.node.payload as KnowledgeNodeJson<"filing_service">["payload"];
  const serviceName = evidenceValue(destination, "officialServiceName", payload.officialServiceName, at);
  const canonicalUrl = evidenceValue(destination, "canonicalUrl", payload.canonicalUrl, at);
  const access = evidenceValue(destination, "access", payload.access, at);
  const filer = evidenceValue(destination, "filerRole", payload.filerRole, at);
  const loginRequirement = evidenceValue(destination, "loginRequirement", payload.loginRequirement, at);
  if (!serviceName || !canonicalUrl) return null;
  const authority = matches.get(payload.authorityNodeId)?.node.label ?? "Authority confirmation required";
  const requiredDocuments = match.outgoingEdges
    .filter((edge) => edge.relation === "requires" && edgeCurrent(edge, profile, at))
    .flatMap((edge) => {
      const target = matches.get(edge.to);
      if (!target || target.node.kind !== "document") return [];
      const documentPayload = target.node.payload as KnowledgeNodeJson<"document">["payload"];
      const officialName = evidenceValue(target, "officialName", documentPayload.officialName, at);
      return officialName ? [officialName] : [];
    });
  const unresolvedFields = [
    !access ? "access mode" : null,
    !filer ? "responsible filer" : null,
    !loginRequirement ? "login requirements" : null,
    requiredDocuments.length === 0 ? "documents uploaded there" : null,
    "submission sequence",
    "fee and deadline unless separately listed",
  ].filter((field): field is string => Boolean(field));
  return {
    authority,
    serviceName,
    canonicalUrl,
    ...(access ? { access } : {}),
    ...(filer ? { filer } : {}),
    ...(loginRequirement ? { loginRequirement } : {}),
    requiredDocuments,
    unresolvedFields,
    policyLocators: policyLocators([
      ...destination.effectiveBindings,
      ...(filingEdge ? [bindingFromEdge(filingEdge)] : []),
      ...match.outgoingEdges
        .filter((edge) => edge.relation === "requires" && edgeCurrent(edge, profile, at))
        .map(bindingFromEdge),
      ...match.outgoingEdges
        .filter((edge) => edge.relation === "requires" && edgeCurrent(edge, profile, at))
        .flatMap((edge) => matches.get(edge.to)?.effectiveBindings ?? []),
    ], regulatoryStore, at),
  };
}

function satisfactionMet(
  condition: SatisfactionCondition,
  evidence: CaseSatisfactionEvidence[],
  at: Date,
): boolean {
  if ("all" in condition) return condition.all.every((child) => satisfactionMet(child, evidence, at));
  return evidence.some((candidate) =>
    verifiedSatisfactionEvidence.has(candidate) &&
    candidate.kind === condition.kind &&
    candidate.targetNodeId === condition.targetNodeId &&
    (!candidate.validUntil || new Date(candidate.validUntil).getTime() >= at.getTime())
  );
}

function sorted(items: DossierItem[]) {
  return items.sort((left, right) => left.id.localeCompare(right.id));
}

function baselineImportDocuments(evidence: ReferenceEvidence | undefined): DossierItem[] {
  if (!evidence) return [];
  const documents = [
    ["baseline-transport-document", "Transport document", "Bill of Lading/Airway Bill/Lorry Receipt/Railway Receipt/Postal Receipt in form CN-22 or CN 23"],
    ["baseline-commercial-invoice-packing-list", "Commercial Invoice cum Packing List", "Commercial Invoice cum Packing List"],
    ["baseline-bill-of-entry", "Bill of Entry", "Bill of Entry"],
  ] as const;
  if (documents.some(([, , exactName]) => !normalizeText(evidence.excerpt).includes(normalizeText(exactName)))) {
    throw new Error("The admitted DGFT baseline no longer supports the frozen import-document checklist.");
  }
  const policyLocator: PolicyLocator = {
    authority: evidence.authority,
    instrumentTitle: evidence.versionLabel,
    exactLocator: evidence.locator,
    canonicalUrl: evidence.url,
    sourceVersionId: evidence.sourceVersionId,
    verifiedAt: evidence.effectiveFrom,
    freshUntil: evidence.freshUntil,
  };
  return documents.map(([id, label]) => ({
    id,
    status: "required" as const,
    label,
    action: `Prepare ${label} for the India import document set.`,
    owner: "Importer or authorised filer",
    why: "The current admitted DGFT baseline lists this as a mandatory import document; product-specific authorities may require more.",
    dueBefore: "Before Customs filing",
    policyLocators: [policyLocator],
    filingPortals: [],
  }));
}

export function buildElectronicsActionDossier({
  baselineEvidence,
  knowledgeStore,
  profile,
  regulatoryStore,
  evidenceRefreshOverlays = [],
  satisfactionEvidence = [],
  at = new Date(),
}: {
  baselineEvidence?: ReferenceEvidence;
  knowledgeStore: ElectronicsKnowledgeStore;
  profile: ElectronicsProfile;
  regulatoryStore: RegulatoryStore;
  evidenceRefreshOverlays?: EvidenceRefreshOverlay[];
  satisfactionEvidence?: CaseSatisfactionEvidence[];
  at?: Date;
}): ActionDossier {
  const traversed = effectiveMatches({ at, evidenceRefreshOverlays, knowledgeStore, profile, regulatoryStore })
    .filter((match) => match.node.kind !== "characteristic" && match.applicability !== false);
  const matches = new Map(traversed.map((match) => [match.node.id, match]));
  const locators = (match: EffectiveMatch) => {
    if (match.node.kind !== "policy_clause") {
      return policyLocators(match.effectiveBindings, regulatoryStore, at);
    }
    const payload = match.node.payload as KnowledgeNodeJson<"policy_clause">["payload"];
    const admittedPageNumbers = evidenceValue(match, "pageNumbers", payload.pageNumbers, at);
    return policyLocators(match.effectiveBindings, regulatoryStore, at, admittedPageNumbers ?? undefined);
  };

  const requirementItems = traversed.filter((match) => match.node.kind === "requirement").map((match) => {
    const payload = match.node.payload as KnowledgeNodeJson<"requirement">["payload"];
    const requires = match.outgoingEdges.filter((edge) => edge.relation === "requires" && edgeCurrent(edge, profile, at));
    const current = match.effectiveCurrent && requires.length === 1 && requires[0]?.to === payload.targetNodeId;
    const status: DossierStatus = !current
      ? "pending"
      : satisfactionMet(payload.satisfaction, satisfactionEvidence, at)
        ? "clear"
        : "required";
    const item = itemForMatch(
      match,
      status,
      `${payload.actionCode} ${matches.get(payload.targetNodeId)?.node.label ?? "the supported document"}`,
      payload.ownerRole,
      policyLocators([
        ...match.effectiveBindings,
        ...requires.map(bindingFromEdge),
      ], regulatoryStore, at),
    );
    return { ...item, dueBefore: humanStage(payload.dueStage) };
  });

  const documents = requirementItems.flatMap((requirement) => {
    const match = matches.get(requirement.id)!;
    const payload = match.node.payload as KnowledgeNodeJson<"requirement">["payload"];
    const target = matches.get(payload.targetNodeId);
    if (!target) return [];
    return [{
      ...itemForMatch(target, requirement.status, `Prepare ${target.node.label}`, requirement.owner, [...locators(target), ...requirement.policyLocators]),
      id: target.node.id,
    }];
  });
  const baselineDocuments = baselineImportDocuments(baselineEvidence).map((item) => (
    item.id === "baseline-commercial-invoice-packing-list"
      && profile.intake.purchaseStage === "already_purchased"
      && profile.intake.purchaseEvidenceAvailability === "unavailable"
      ? {
          ...item,
          action: "Obtain the Commercial Invoice cum Packing List from the supplier before Customs filing.",
          why: "Action Required: proof is not currently available, while the admitted DGFT baseline lists the Commercial Invoice cum Packing List in the import document set.",
        }
      : item
  ));
  documents.push(...baselineDocuments);

  const policyReview = traversed.filter((match) => match.node.kind === "policy_clause").map((match) =>
    itemForMatch(match, match.effectiveCurrent ? "clear" : "pending", "Review the exact official policy locator", match.node.verificationOwner ?? "importer", locators(match))
  );
  const onlineForms = traversed.filter((match) => match.node.kind === "filing_service").map((match) => {
    const portal = portalFor(match, matches, profile, regulatoryStore, at);
    const portalComplete = portal?.unresolvedFields.length === 0;
    const formLocators = policyLocators([
      ...match.effectiveBindings,
      ...match.outgoingEdges.filter((edge) => edgeCurrent(edge, profile, at)).map(bindingFromEdge),
    ], regulatoryStore, at);
    const item = itemForMatch(
      match,
      portalComplete ? "clear" : "pending",
      portal ? "Use only the verified service fields below and resolve every Pending portal field before filing" : "Confirm every missing portal field and filing sequence",
      match.node.kind === "filing_service" ? (match.node.payload as KnowledgeNodeJson<"filing_service">["payload"]).filerRole : "authority",
      formLocators,
      portal ? [portal] : [],
    );
    const filingEdge = match.outgoingEdges.find((edge) => edge.relation === "filed_at" && edgeCurrent(edge, profile, at));
    const filingTarget = filingEdge ? matches.get(filingEdge.to) : undefined;
    return portal && !portalComplete
      ? { ...item, why: `Verified service identity is available, but these filing fields remain Pending: ${portal.unresolvedFields.join(", ")}.` }
      : !portal && filingTarget?.node.kind === "filing_service"
      ? { ...item, why: `The admitted filing sequence points to ${filingTarget.node.label}, but the exact filing-destination URL is Pending; no submission link is released.` }
      : !portal && match.effectiveCurrent
      ? { ...item, why: "A current admitted filed_at or precedes edge is required to establish filing sequence." }
      : item;
  });
  const contacts = traversed.filter((match) => match.node.kind === "contact").map((match) => {
    const item = itemForMatch(match, match.effectiveCurrent ? "clear" : "pending", "Use this contact only for the stated verification purpose", "authority", locators(match));
    if (!match.effectiveCurrent) return item;
    const payload = match.node.payload as KnowledgeNodeJson<"contact">["payload"];
    const value = evidenceValue(match, "value", payload.value, at);
    const purpose = evidenceValue(match, "purpose", payload.purpose, at);
    return value && purpose
      ? { ...item, contact: { channel: payload.channel, value, purpose } }
      : { ...item, status: "pending" as const, why: "The contact value or purpose is not fully evidence-bound." };
  });
  const classificationAndRegulation = traversed
    .filter((match) => ["statutory_entry", "agency", "coverage_gap"].includes(match.node.kind))
    .map((match) => itemForMatch(
      match,
      match.effectiveCurrent ? "clear" : "pending",
      match.node.kind === "coverage_gap" ? "Obtain an authority determination for this uncovered branch" : "Review applicability against the confirmed product traits",
      match.node.verificationOwner ?? "importer",
      locators(match),
    ));
  const costs = traversed.filter((match) => match.node.kind === "calculation_rule").map((match) => {
    const currentRateEdge = match.outgoingEdges.some((edge) => edgeCurrent(edge, profile, at));
    return itemForMatch(
      match,
      match.effectiveCurrent && currentRateEdge ? "clear" : "pending",
      "Calculate only after every cited rate and input is confirmed",
      "importer",
      policyLocators([
        ...match.effectiveBindings,
        ...match.outgoingEdges.filter((edge) => edgeCurrent(edge, profile, at)).map(bindingFromEdge),
      ], regulatoryStore, at),
    );
  });
  const coverageActions = classificationAndRegulation.filter((item) => item.status === "pending" && item.id.startsWith("gap-"));
  const orderedNextActions = [...requirementItems, ...coverageActions];

  const completeSections = {
    documents: sorted(documents),
    policyReview: sorted(policyReview),
    onlineForms: sorted(onlineForms),
    contacts: sorted(contacts),
    classificationAndRegulation: sorted(classificationAndRegulation),
    costs: sorted(costs),
    orderedNextActions: sorted(orderedNextActions),
  };
  const material = Object.values(completeSections).flat();
  const decisionStatus: DossierStatus = material.some((item) => item.status === "pending")
    ? "pending"
    : material.some((item) => item.status === "required")
      ? "required"
      : "clear";
  const blockers = [...new Set(material.filter((item) => item.status === "pending").map((item) => item.why))].sort();
  return {
    decision: {
      status: decisionStatus,
      summary: decisionStatus === "pending"
        ? "One or more case facts or admitted evidence bindings remain Pending. Follow the first listed blocker or evidence-acquisition step."
        : decisionStatus === "required"
          ? "Current admitted evidence establishes one or more actions that remain Required."
          : "All graph-established actions are Clear within the verified scope; Customs clearance is not guaranteed.",
      blockers,
    },
    ...completeSections,
  };
}

function documentKindCompatible(document: DocumentRecord, target: KnowledgeNodeJson<"document">) {
  const kind = target.payload.documentKind;
  if (kind === "invoice") return document.documentType === "commercial_invoice";
  if (kind === "transport") return document.documentType === "transport_document";
  if (kind === "registration") return /registration|iec/.test(document.documentType);
  if (kind === "declaration") return /declaration|statement|screening/.test(document.documentType);
  if (kind === "approval" || kind === "certificate") {
    return /wpc|bis|mtcte|authori[sz]ation|acknowledgement/.test(document.documentType);
  }
  return false;
}

export function resolveCaseSatisfactionEvidence({
  conversationStore,
  knowledgeStore,
  tradeCaseId,
  recordId,
  targetNodeId,
  kind,
  at = new Date(),
}: {
  conversationStore: ConversationStore;
  knowledgeStore: ElectronicsKnowledgeStore;
  tradeCaseId: string;
  recordId: string;
  targetNodeId: string;
  kind: CaseSatisfactionEvidence["kind"];
  at?: Date;
}): CaseSatisfactionEvidence {
  const target = knowledgeStore.getNode(targetNodeId)?.node;
  if (!target || target.kind !== "document") throw new Error("Satisfaction target must be the exact graph document node.");
  if (kind === "verified_official_record") {
    throw new Error("No active-case admitted official-record resolver is configured; official-record satisfaction remains Pending.");
  }
  const tradeCase = conversationStore.getTradeCase(tradeCaseId);
  const document = tradeCase.documents.find((candidate) => candidate.id === recordId);
  if (!document) throw new Error("Resolved satisfaction record does not belong to the active case.");
  if (document.facts.length === 0 || document.facts.some((fact) => fact.current.reviewStatus === "pending")) {
    throw new Error("Resolved satisfaction record is pending deterministic document review.");
  }
  const confirmed = new Map(tradeCase.confirmedFacts.map((fact) => [fact.name, fact.value]));
  if (document.facts.some((fact) => confirmed.get(fact.field) !== fact.current.value)) {
    throw new Error("Resolved satisfaction record is contradicted by the active case.");
  }
  if (!documentKindCompatible(document, target as KnowledgeNodeJson<"document">)) {
    throw new Error("Resolved satisfaction record does not match the exact obligation target kind.");
  }
  const targetKind = (target as KnowledgeNodeJson<"document">).payload.documentKind;
  if (kind === "verified_approval" && !["approval", "certificate"].includes(targetKind)) {
    throw new Error("Approval satisfaction is incompatible with the obligation target.");
  }
  if (kind === "verified_registration" && targetKind !== "registration") {
    throw new Error("Registration satisfaction is incompatible with the obligation target.");
  }
  const verifiedAt = document.facts.map((fact) => fact.current.createdAt).sort().at(-1)!;
  if (new Date(verifiedAt).getTime() > at.getTime()) throw new Error("Satisfaction record verification time is invalid.");
  const pages = [...new Set(document.facts.map((fact) => fact.current.provenance.documentPage))].sort((a, b) => a - b);
  const evidence = Object.freeze<CaseSatisfactionEvidence>({
    targetNodeId,
    kind,
    provenance: "deterministic_document_review",
    recordId,
    exactLocator: `document:${recordId}:page:${pages.join(",")}`,
    verifiedAt,
  });
  verifiedSatisfactionEvidence.add(evidence);
  return evidence;
}
