import { Decimal } from "decimal.js";
import { z } from "zod";

export type PurchaseStage = "pre_purchase" | "already_purchased";
export type ShipmentStage = "paid_not_dispatched" | "dispatched" | "in_transit" | "arrived" | "held_by_customs";
export type CaseJourneyStage = "intake" | "pre_purchase_research" | "post_purchase_remediation";
export type ImportPurpose = "personal" | "commercial";
export type PurchaseEvidenceAvailability = "available" | "unavailable";
export type DossierStatus = "required" | "clear" | "pending";

export interface ElectronicsImportIntake {
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
  shipmentStage?: ShipmentStage;
  purchaseEvidenceDocumentIds: string[];
  purchaseEvidenceAvailability?: PurchaseEvidenceAvailability;
  purpose?: ImportPurpose;
  freight?: string;
  insurance?: string;
  incoterm?: string;
}

export interface RegulatoryCharacteristic {
  id: string;
  namespace:
    | "product"
    | "radio"
    | "telecom"
    | "battery"
    | "power"
    | "camera"
    | "encryption"
    | "packaging"
    | "end_use"
    | "classification";
  value: string | number | boolean | "unknown";
  unit?: string;
  basis: string;
  provenance: "user" | "document" | "url" | "derived";
  confirmed: boolean;
}

export interface ElectronicsProfile {
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

export type KnowledgeNodeKind =
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
export type CanonicalUnit = "hz" | "w" | "v" | "ah" | "kg";
export type Scalar = string | number | boolean;

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | {
      characteristic: string;
      op: "eq" | "in" | "present" | "absent" | "gte" | "lte";
      value?: Scalar | Scalar[];
      unit?: CanonicalUnit;
    };

export interface FieldEvidenceBindingJson {
  claimId: string;
  sourceVersionId: string;
  exactLocator: string;
  supportMode: "exact_text" | "exact_url" | "exact_number" | "closed_enum";
  supportText: string;
  supportSha256: string;
}

export type OwnerRole =
  | "importer"
  | "supplier"
  | "customs_broker"
  | "authorized_indian_representative"
  | "laboratory"
  | "authority";
export type DueStage =
  | "before_purchase"
  | "before_shipment"
  | "before_arrival"
  | "before_customs_filing"
  | "before_sale";
export type ActionCode = "obtain" | "prepare" | "file" | "upload" | "review" | "confirm" | "engage";

export type SatisfactionCondition =
  | { kind: "verified_document"; targetNodeId: string }
  | { kind: "verified_approval"; targetNodeId: string }
  | { kind: "verified_registration"; targetNodeId: string }
  | { kind: "verified_official_record"; targetNodeId: string }
  | { all: [SatisfactionCondition, ...SatisfactionCondition[]] };

export interface NodePayloadByKind {
  characteristic: { characteristicId: string };
  statutory_entry: {
    system: "ITC_HS" | "BIS_CRS" | "TEC_MTCTE" | "WPC_ETA" | "OTHER";
    entryId: string;
    officialLabel: string;
  };
  requirement: {
    actionCode: ActionCode;
    targetNodeId: string;
    ownerRole: OwnerRole;
    dueStage: DueStage;
    satisfaction: SatisfactionCondition;
  };
  document: {
    documentCode: string;
    documentKind: "invoice" | "transport" | "approval" | "registration" | "certificate" | "declaration" | "other";
    officialName: string;
    issuerRole: OwnerRole;
    acceptedForm: string[];
  };
  policy_clause: {
    authority: string;
    instrumentTitle: string;
    exactLocator: string;
    pageNumbers: string;
    canonicalUrl: string;
  };
  agency: {
    authorityName: string;
    role: "customs" | "licensing" | "standards" | "telecom" | "environmental" | "consumer_protection";
  };
  filing_service: {
    authorityNodeId: string;
    officialServiceName: string;
    canonicalUrl: string;
    access: "public" | "login_required" | "broker_only" | "offline";
    filerRole: OwnerRole;
    loginRequirement: string;
  };
  contact: {
    authorityNodeId: string;
    channel: "official_web" | "email" | "phone";
    value: string;
    purpose: string;
  };
  calculation_rule: {
    componentId: string;
    formulaId: "bcd" | "sws" | "igst" | "cess" | "landed_cost";
    requiredCharacteristicIds: string[];
  };
  coverage_gap: {
    domain: "battery_epr" | "e_waste_epr" | "legal_metrology" | "used_refurbished" | "unmapped_electronics";
    authorityNodeId: string;
  };
}

export interface KnowledgeNodeJson<K extends KnowledgeNodeKind = KnowledgeNodeKind> {
  id: string;
  kind: K;
  jurisdiction: "India";
  label: string;
  aliases: string[];
  state: K extends "coverage_gap" ? "coverage_pending" : "actionable" | "evidence_pending";
  conditions: Condition;
  payload: NodePayloadByKind[K];
  fieldEvidence: Record<string, FieldEvidenceBindingJson>;
  pendingReason?: string;
  verificationOwner?: string;
  contactNodeId?: string;
}

export interface KnowledgeEdgeJson {
  id: string;
  from: string;
  relation: "triggered_by" | "requires" | "supported_by" | "filed_at" | "owned_by" | "precedes" | "supersedes";
  to: string;
  conditions: Condition;
  evidence: FieldEvidenceBindingJson;
}

export interface AdmissionSeedJson {
  evidence: import("../evidence/admission").AdmittedEvidence;
  amendment: import("../evidence/admission").AdmissionRequest["amendment"];
  exactExcerpt: string;
}

export interface ElectronicsKnowledgeGraphJson {
  schemaVersion: 1;
  graphId: "china-india-electronics-v1";
  admissions: AdmissionSeedJson[];
  nodes: KnowledgeNodeJson[];
  edges: KnowledgeEdgeJson[];
}

export interface PolicyLocator {
  authority: string;
  instrumentTitle: string;
  exactLocator: string;
  pageNumbers?: string;
  canonicalUrl: string;
  sourceVersionId: string;
  verifiedAt: string;
  freshUntil: string;
}

export interface EvidenceBoundValue<T> {
  value: T;
  claimId: string;
  sourceVersionId: string;
  exactLocator: string;
}

export interface FilingPortal {
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

export interface DossierItem {
  id: string;
  status: DossierStatus;
  label: string;
  action: string;
  owner: string;
  why: string;
  dueBefore?: string;
  policyLocators: PolicyLocator[];
  filingPortals: FilingPortal[];
  contact?: {
    channel: "official_web" | "email" | "phone";
    value: EvidenceBoundValue<string>;
    purpose: EvidenceBoundValue<string>;
  };
}

export interface ActionDossier {
  decision: { status: DossierStatus; summary: string; blockers: string[] };
  documents: DossierItem[];
  policyReview: DossierItem[];
  onlineForms: DossierItem[];
  contacts: DossierItem[];
  classificationAndRegulation: DossierItem[];
  costs: DossierItem[];
  orderedNextActions: DossierItem[];
}

export interface CaseSatisfactionEvidence {
  targetNodeId: string;
  kind: "verified_document" | "verified_approval" | "verified_registration" | "verified_official_record";
  provenance: "deterministic_document_review" | "admitted_official_record";
  recordId: string;
  exactLocator: string;
  verifiedAt: string;
  validUntil?: string;
}

export interface EvidenceRefreshOverlay {
  knowledgeNodeId: string;
  replacements: Record<string, FieldEvidenceBindingJson>;
}

const enumValues = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values);
const ownerRoleSchema = enumValues([
  "importer", "supplier", "customs_broker", "authorized_indian_representative", "laboratory", "authority",
] as const);
const dueStageSchema = enumValues([
  "before_purchase", "before_shipment", "before_arrival", "before_customs_filing", "before_sale",
] as const);
const actionCodeSchema = enumValues(["obtain", "prepare", "file", "upload", "review", "confirm", "engage"] as const);
const canonicalUnitSchema = enumValues(["hz", "w", "v", "ah", "kg"] as const);

export const CHARACTERISTIC_CATALOG = {
  "product.form": { type: "enum", values: ["finished_product", "component", "part", "accessory"] },
  "product.condition": { type: "enum", values: ["new", "used", "refurbished"] },
  "purchase.stage": { type: "enum", values: ["pre_purchase", "already_purchased"] },
  "import.purpose": { type: "enum", values: ["personal", "commercial"] },
  "packaging.retail_prepackaged": { type: "boolean" },
  "radio.transmitter_present": { type: "boolean" },
  "radio.frequency_hz": { type: "number", unit: "hz" },
  "radio.transmit_power_w": { type: "number", unit: "w" },
  "telecom.public_network_connection": { type: "boolean" },
  "telecom.interface": { type: "enum", values: ["none", "ip", "cellular", "pstn", "satellite", "multiple"] },
  "battery.present": { type: "boolean" },
  "battery.chemistry": { type: "enum", values: ["lithium_ion", "lithium_metal", "lead_acid", "nickel_metal_hydride", "other"] },
  "battery.capacity_ah": { type: "number", unit: "ah" },
  "battery.voltage_v": { type: "number", unit: "v" },
  "power.external_supply_present": { type: "boolean" },
  "power.input_voltage_v": { type: "number", unit: "v" },
  "power.rated_output_w": { type: "number", unit: "w" },
  "camera.present": { type: "boolean" },
  "encryption.present": { type: "boolean" },
  "end_use.controlled_or_dual_use": { type: "boolean" },
  "classification.itc_hs": { type: "digit_string" },
  "classification.bis_entry": { type: "string" },
  "classification.tec_entry": { type: "string" },
  "classification.wpc_entry": { type: "string" },
} as const satisfies Record<string, { type: string; unit?: CanonicalUnit; values?: readonly string[] }>;

export type CharacteristicId = keyof typeof CHARACTERISTIC_CATALOG;

const scalarSchema = z.union([z.string(), z.number().finite(), z.boolean()]);
const conditionSchemaBase: z.ZodType<Condition> = z.lazy(() => z.union([
  z.object({ all: z.array(conditionSchemaBase) }).strict(),
  z.object({ any: z.array(conditionSchemaBase) }).strict(),
  z.object({ not: conditionSchemaBase }).strict(),
  z.object({
    characteristic: z.string(),
    op: enumValues(["eq", "in", "present", "absent", "gte", "lte"] as const),
    value: z.union([scalarSchema, z.array(scalarSchema).min(1)]).optional(),
    unit: canonicalUnitSchema.optional(),
  }).strict().superRefine((value, context) => {
    const catalog = CHARACTERISTIC_CATALOG[value.characteristic as CharacteristicId];
    if (!catalog) {
      context.addIssue({ code: "custom", message: `Unknown characteristic ${value.characteristic}.` });
      return;
    }
    if (["present", "absent"].includes(value.op)) {
      if (catalog.type !== "boolean") context.addIssue({ code: "custom", message: `${value.op} requires a boolean characteristic.` });
      if (value.value !== undefined || value.unit !== undefined) context.addIssue({ code: "custom", message: `${value.op} does not accept value or unit.` });
      return;
    }
    if (value.op === "in") {
      if (!Array.isArray(value.value)) context.addIssue({ code: "custom", message: "in requires a non-empty scalar array." });
    } else if (value.value === undefined || Array.isArray(value.value)) {
      context.addIssue({ code: "custom", message: `${value.op} requires one scalar value.` });
    }
    const operands = Array.isArray(value.value) ? value.value : value.value === undefined ? [] : [value.value];
    const validOperand = (operand: Scalar) => {
      if (catalog.type === "boolean") return typeof operand === "boolean";
      if (catalog.type === "number") return typeof operand === "number";
      if (catalog.type === "enum") return typeof operand === "string" && catalog.values.includes(operand as never);
      if (catalog.type === "digit_string") return typeof operand === "string" && /^\d+$/.test(operand);
      return typeof operand === "string" && operand.length > 0;
    };
    if (operands.some((operand) => !validOperand(operand))) {
      context.addIssue({ code: "custom", message: `${value.characteristic} condition uses a non-canonical operand.` });
    }
    if (["gte", "lte"].includes(value.op)) {
      if (catalog.type !== "number" || typeof value.value !== "number") {
        context.addIssue({ code: "custom", message: `${value.op} requires a numeric characteristic and operand.` });
      }
      if (!("unit" in catalog) || value.unit !== catalog.unit) {
        context.addIssue({ code: "custom", message: `${value.op} requires the catalog canonical unit.` });
      }
    } else if (catalog.type === "number") {
      if (!("unit" in catalog) || value.unit !== catalog.unit) {
        context.addIssue({ code: "custom", message: `${value.op} requires the catalog canonical unit.` });
      }
    } else if (value.unit !== undefined) {
      context.addIssue({ code: "custom", message: `${value.op} does not accept a unit.` });
    }
  }),
])) as unknown as z.ZodType<Condition>;
export const ConditionSchema = conditionSchemaBase;

export const FieldEvidenceBindingSchema = z.object({
  claimId: z.string().min(1),
  sourceVersionId: z.string().min(1),
  exactLocator: z.string().min(1),
  supportMode: enumValues(["exact_text", "exact_url", "exact_number", "closed_enum"] as const),
  supportText: z.string().min(1),
  supportSha256: z.string().regex(/^[a-f0-9]{64}$/),
}).strict();

const satisfactionLeafSchema = z.object({
  kind: enumValues(["verified_document", "verified_approval", "verified_registration", "verified_official_record"] as const),
  targetNodeId: z.string().min(1),
}).strict();
export const SatisfactionConditionSchema: z.ZodType<SatisfactionCondition> = z.lazy(() => z.union([
  satisfactionLeafSchema,
  z.object({ all: z.array(SatisfactionConditionSchema).min(1) }).strict(),
])) as z.ZodType<SatisfactionCondition>;

const payloadSchemas = {
  characteristic: z.object({ characteristicId: z.string() }).strict(),
  statutory_entry: z.object({
    system: enumValues(["ITC_HS", "BIS_CRS", "TEC_MTCTE", "WPC_ETA", "OTHER"] as const),
    entryId: z.string().min(1),
    officialLabel: z.string().min(1),
  }).strict(),
  requirement: z.object({
    actionCode: actionCodeSchema,
    targetNodeId: z.string().min(1),
    ownerRole: ownerRoleSchema,
    dueStage: dueStageSchema,
    satisfaction: SatisfactionConditionSchema,
  }).strict(),
  document: z.object({
    documentCode: z.string().min(1),
    documentKind: enumValues(["invoice", "transport", "approval", "registration", "certificate", "declaration", "other"] as const),
    officialName: z.string().min(1),
    issuerRole: ownerRoleSchema,
    acceptedForm: z.array(z.string().min(1)).min(1),
  }).strict(),
  policy_clause: z.object({
    authority: z.string().min(1),
    instrumentTitle: z.string().min(1),
    exactLocator: z.string().min(1),
    pageNumbers: z.string().min(1),
    canonicalUrl: z.string().url().startsWith("https://"),
  }).strict(),
  agency: z.object({
    authorityName: z.string().min(1),
    role: enumValues(["customs", "licensing", "standards", "telecom", "environmental", "consumer_protection"] as const),
  }).strict(),
  filing_service: z.object({
    authorityNodeId: z.string().min(1),
    officialServiceName: z.string().min(1),
    canonicalUrl: z.string().url().startsWith("https://"),
    access: enumValues(["public", "login_required", "broker_only", "offline"] as const),
    filerRole: ownerRoleSchema,
    loginRequirement: z.string().min(1),
  }).strict(),
  contact: z.object({
    authorityNodeId: z.string().min(1),
    channel: enumValues(["official_web", "email", "phone"] as const),
    value: z.string().min(1),
    purpose: z.string().min(1),
  }).strict(),
  calculation_rule: z.object({
    componentId: z.string().min(1),
    formulaId: enumValues(["bcd", "sws", "igst", "cess", "landed_cost"] as const),
    requiredCharacteristicIds: z.array(z.string()).min(1),
  }).strict(),
  coverage_gap: z.object({
    domain: enumValues(["battery_epr", "e_waste_epr", "legal_metrology", "used_refurbished", "unmapped_electronics"] as const),
    authorityNodeId: z.string().min(1),
  }).strict(),
} as const;

const commonNode = {
  id: z.string().min(1),
  jurisdiction: z.literal("India"),
  label: z.string().min(1),
  aliases: z.array(z.string().min(1)),
  conditions: ConditionSchema,
  fieldEvidence: z.record(z.string(), FieldEvidenceBindingSchema),
  pendingReason: z.string().min(1).optional(),
  verificationOwner: z.string().min(1).optional(),
  contactNodeId: z.string().min(1).optional(),
};

const actionableNode = <K extends Exclude<KnowledgeNodeKind, "coverage_gap">>(kind: K) => z.object({
  ...commonNode,
  kind: z.literal(kind),
  state: enumValues(["actionable", "evidence_pending"] as const),
  payload: payloadSchemas[kind],
}).strict();

export const KnowledgeNodeSchema = z.discriminatedUnion("kind", [
  actionableNode("characteristic"),
  actionableNode("statutory_entry"),
  actionableNode("requirement"),
  actionableNode("document"),
  actionableNode("policy_clause"),
  actionableNode("agency"),
  actionableNode("filing_service"),
  actionableNode("contact"),
  actionableNode("calculation_rule"),
  z.object({
    ...commonNode,
    kind: z.literal("coverage_gap"),
    state: z.literal("coverage_pending"),
    payload: payloadSchemas.coverage_gap,
  }).strict(),
]);

export const KnowledgeEdgeSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  relation: enumValues(["triggered_by", "requires", "supported_by", "filed_at", "owned_by", "precedes", "supersedes"] as const),
  to: z.string().min(1),
  conditions: ConditionSchema,
  evidence: FieldEvidenceBindingSchema,
}).strict();

const locatorSchema = z.object({
  kind: enumValues(["section", "paragraph", "page", "table", "record"] as const),
  value: z.string().min(2).max(500),
}).strict();
const exactSpanSchema = z.object({ locator: locatorSchema, exactExcerpt: z.string().min(2).max(4_000) }).strict();
const admissionStateSchema = enumValues(["discovered", "snapshotted", "extracted", "validated", "admitted"] as const);
export const AdmittedEvidenceProjectionSchema = z.object({
  admissionId: z.string().min(1),
  applicability: z.object({
    appliesIn: enumValues(["India", "China"] as const),
    tradeDirection: enumValues(["china_to_india", "india_to_china"] as const),
    productScope: z.string().min(2).max(500),
    regulatoryDomain: z.string().min(2).max(200),
  }).strict(),
  applicabilityEvidence: exactSpanSchema,
  authorityName: z.string().min(2).max(300),
  connectorId: z.string().min(2),
  contentType: z.string().min(1),
  documentVersionId: z.string().min(1),
  effectiveFrom: z.string().date(),
  exactLocator: locatorSchema,
  finalUrl: z.string().url().startsWith("https://"),
  freshUntil: z.string().date(),
  instrumentId: z.string().min(2).max(300),
  instrumentTitle: z.string().min(2).max(500),
  identityEvidence: z.object({ authority: exactSpanSchema, instrumentId: exactSpanSchema, instrumentTitle: exactSpanSchema }).strict(),
  jurisdiction: enumValues(["India", "China"] as const),
  originalLanguage: enumValues(["en", "zh-CN"] as const),
  promptInjectionDetected: z.boolean(),
  redirectHistory: z.array(z.string().url()),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  snapshotRelativePath: z.string().min(1),
  sourceVersionId: z.string().min(1),
  state: z.literal("admitted"),
  translation: z.object({
    status: enumValues(["authoritative_original", "official_translation", "derived_translation", "untranslated"] as const),
    method: z.string().min(2).max(300),
    englishExcerpt: z.string().min(8).max(4_000).optional(),
    materialAmbiguity: z.boolean(),
  }).strict(),
  transitions: z.array(z.object({ at: z.string().datetime(), state: admissionStateSchema }).strict()).min(1),
}).strict();

export const AdmissionSeedSchema = z.object({
  evidence: AdmittedEvidenceProjectionSchema,
  amendment: z.object({
    status: enumValues(["original", "amended", "superseding", "unknown"] as const),
    note: z.string().min(2).max(500),
    supersedesDocumentVersionId: z.string().min(2).optional(),
  }).strict(),
  exactExcerpt: z.string().min(8).max(4_000),
}).strict();

export const ElectronicsKnowledgeGraphSchema = z.object({
  schemaVersion: z.literal(1),
  graphId: z.literal("china-india-electronics-v1"),
  admissions: z.array(AdmissionSeedSchema),
  nodes: z.array(KnowledgeNodeSchema),
  edges: z.array(KnowledgeEdgeSchema),
}).strict();

const UNIT_TABLE: Record<string, { unit: CanonicalUnit; multiplier: string }> = {
  hz: { unit: "hz", multiplier: "1" },
  khz: { unit: "hz", multiplier: "1000" },
  mhz: { unit: "hz", multiplier: "1000000" },
  ghz: { unit: "hz", multiplier: "1000000000" },
  mw: { unit: "w", multiplier: "0.001" },
  w: { unit: "w", multiplier: "1" },
  kw: { unit: "w", multiplier: "1000" },
  mv: { unit: "v", multiplier: "0.001" },
  v: { unit: "v", multiplier: "1" },
  kv: { unit: "v", multiplier: "1000" },
  mah: { unit: "ah", multiplier: "0.001" },
  ah: { unit: "ah", multiplier: "1" },
  g: { unit: "kg", multiplier: "0.001" },
  kg: { unit: "kg", multiplier: "1" },
};

export function normalizeCharacteristicValue(value: number | string, unit: string): { value: number; unit: CanonicalUnit } {
  const conversion = UNIT_TABLE[unit.trim().toLowerCase()];
  if (!conversion) throw new Error(`Unknown unit: ${unit}.`);
  let decimal: Decimal;
  try {
    decimal = new Decimal(value).times(conversion.multiplier);
  } catch {
    throw new Error("Characteristic value must be a finite decimal.");
  }
  if (!decimal.isFinite()) throw new Error("Characteristic value must be a finite decimal.");
  return { value: decimal.toNumber(), unit: conversion.unit };
}

export type ThreeValued = true | false | "unknown";
export interface ConditionEvaluation {
  value: ThreeValued;
  missingCharacteristics: string[];
}

function mergeMissing(...values: string[][]) {
  return [...new Set(values.flat())].sort();
}

function evaluateLeaf(condition: Extract<Condition, { characteristic: string }>, characteristics: RegulatoryCharacteristic[]): ConditionEvaluation {
  const found = characteristics.find((candidate) => candidate.id === condition.characteristic);
  if (!found || !found.confirmed || found.value === "unknown") {
    return { value: "unknown", missingCharacteristics: [condition.characteristic] };
  }
  if (condition.op === "present" || condition.op === "absent") {
    if (typeof found.value !== "boolean") return { value: "unknown", missingCharacteristics: [condition.characteristic] };
    const present = found.value;
    return { value: condition.op === "present" ? present : !present, missingCharacteristics: [] };
  }
  if (condition.op === "gte" || condition.op === "lte") {
    if (typeof found.value !== "number" || typeof condition.value !== "number" || !condition.unit || !found.unit) {
      return { value: "unknown", missingCharacteristics: [condition.characteristic] };
    }
    let normalized: { value: number; unit: CanonicalUnit };
    try {
      normalized = normalizeCharacteristicValue(found.value, found.unit);
    } catch {
      return { value: "unknown", missingCharacteristics: [condition.characteristic] };
    }
    if (normalized.unit !== condition.unit) return { value: "unknown", missingCharacteristics: [condition.characteristic] };
    const result = condition.op === "gte"
      ? new Decimal(normalized.value).gte(condition.value)
      : new Decimal(normalized.value).lte(condition.value);
    return { value: result, missingCharacteristics: [] };
  }
  const expected = condition.value;
  if (expected === undefined) return { value: "unknown", missingCharacteristics: [condition.characteristic] };
  const catalog = CHARACTERISTIC_CATALOG[condition.characteristic as CharacteristicId];
  let actual = found.value;
  if (catalog?.type === "number") {
    if (typeof found.value !== "number" || !found.unit || !condition.unit) {
      return { value: "unknown", missingCharacteristics: [condition.characteristic] };
    }
    try {
      const normalized = normalizeCharacteristicValue(found.value, found.unit);
      if (normalized.unit !== condition.unit) return { value: "unknown", missingCharacteristics: [condition.characteristic] };
      actual = normalized.value;
    } catch {
      return { value: "unknown", missingCharacteristics: [condition.characteristic] };
    }
  }
  const equals = (candidate: Scalar) => typeof actual === typeof candidate && actual === candidate;
  return {
    value: condition.op === "in" && Array.isArray(expected) ? expected.some(equals) : !Array.isArray(expected) && equals(expected),
    missingCharacteristics: [],
  };
}

export function evaluateCondition(condition: Condition, characteristics: RegulatoryCharacteristic[]): ConditionEvaluation {
  if ("characteristic" in condition) return evaluateLeaf(condition, characteristics);
  if ("not" in condition) {
    const result = evaluateCondition(condition.not, characteristics);
    return { value: result.value === "unknown" ? "unknown" : !result.value, missingCharacteristics: result.missingCharacteristics };
  }
  const children = "all" in condition ? condition.all : condition.any;
  const results = children.map((child) => evaluateCondition(child, characteristics));
  const missing = mergeMissing(...results.filter((result) => result.value === "unknown").map((result) => result.missingCharacteristics));
  if ("all" in condition) {
    if (results.some((result) => result.value === false)) return { value: false, missingCharacteristics: [] };
    if (results.every((result) => result.value === true)) return { value: true, missingCharacteristics: [] };
    return { value: "unknown", missingCharacteristics: missing };
  }
  if (results.some((result) => result.value === true)) return { value: true, missingCharacteristics: [] };
  if (results.every((result) => result.value === false)) return { value: false, missingCharacteristics: [] };
  return { value: "unknown", missingCharacteristics: missing };
}
