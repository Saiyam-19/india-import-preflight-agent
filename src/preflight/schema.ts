import { z } from "zod";

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MoneyInputSchema = z.string().regex(/^\d+(?:\.\d{1,2})?$/);
const MoneyOutputSchema = z.string().regex(/^\d+\.\d{2}$/);
const EvidenceStatusSchema = z.enum(["present", "absent", "unknown"]);
const OutcomeSchema = z.enum(["ready", "blocked", "needs_verification"]);
const UniversalFactSchema = z.string().min(1).nullable();

export const OTHER_PRODUCT_ID = "other-product" as const;

export const OtherProductAssessmentRequestSchema = z.object({
  productPackId: z.literal(OTHER_PRODUCT_ID),
  assessmentDate: IsoDateSchema,
  product: z.object({
    description: UniversalFactSchema,
    modelIdentity: UniversalFactSchema,
    manufacturerIdentity: UniversalFactSchema,
    supplierIdentity: UniversalFactSchema,
  }).strict(),
  shipment: z.object({
    originCountryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
    importerIdentity: UniversalFactSchema,
    producerIdentity: UniversalFactSchema,
    exporterIdentity: UniversalFactSchema,
    quantity: UniversalFactSchema,
    incoterm: UniversalFactSchema,
    destination: UniversalFactSchema,
  }).strict(),
  commercialFacts: z.object({
    itemValueInr: UniversalFactSchema,
    freightInr: UniversalFactSchema,
    insuranceInr: UniversalFactSchema,
  }).strict(),
}).strict();

export const AssessmentRequestSchema = z.object({
  productPackId: z.string().min(1),
  assessmentDate: IsoDateSchema,
  scenario: z.record(z.string(), z.unknown()),
  parties: z.object({
    originCountryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
    importerIdentity: z.string().min(1).nullable(),
    producerIdentity: z.string().min(1).nullable(),
    exporterIdentity: z.string().min(1).nullable(),
  }),
  shipment: z.object({
    quantity: UniversalFactSchema,
    incoterm: UniversalFactSchema,
    destination: UniversalFactSchema,
  }).strict().optional(),
  tradeRemedyCheck: z.enum(["confirmed_no_match", "unknown", "possible_match"]),
  evidence: z.record(z.string(), EvidenceStatusSchema),
  costInputs: z.object({
    itemValueInr: MoneyInputSchema,
    freightInr: MoneyInputSchema,
    insuranceInr: MoneyInputSchema,
  }),
});

const DestinationSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export const ReportActionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  owner: z.string().min(1),
  instruction: z.string().min(1),
  prerequisites: z.array(z.string().min(1)),
  requiredDocuments: z.array(z.string().min(1)).min(1),
  destination: DestinationSchema,
  rerunCondition: z.string().min(1),
});

const FindingSourceSchema = z.object({
  sourceId: z.string().min(1),
  authority: z.string().min(1),
  title: z.string().min(1),
  url: z.string().url(),
  pinpoint: z.string().min(1),
  relevance: z.string().min(1),
  lastChecked: IsoDateSchema,
  reviewAfter: IsoDateSchema,
});

export const FindingSchema = z.object({
  ruleId: z.string().min(1),
  title: z.string().min(1),
  status: EvidenceStatusSchema,
  kind: z.enum(["satisfied", "clearance_blocker", "verification_gap", "warning"]),
  explanation: z.string().min(1),
  requiredEvidence: z.array(z.string().min(1)).min(1),
  missingEvidence: z.array(z.string().min(1)),
  source: FindingSourceSchema,
  action: ReportActionSchema,
});

const CostLineSchema = z.object({
  id: z.enum([
    "assessable_value",
    "basic_customs_duty",
    "agriculture_infrastructure_development_cess",
    "social_welfare_surcharge",
    "igst",
    "gst_compensation_cess",
    "total_import_duties",
  ]),
  amountInr: MoneyOutputSchema,
});

const AvailableCostSchema = z.object({
  status: z.literal("available"),
  formula: z.literal("item value + freight + insurance"),
  assessableValueInr: MoneyOutputSchema,
  inputs: z.object({
    itemValueInr: MoneyOutputSchema,
    freightInr: MoneyOutputSchema,
    insuranceInr: MoneyOutputSchema,
  }),
  lines: z.array(CostLineSchema).length(7),
  assumptions: z.array(z.string().min(1)).min(1),
  exclusions: z.array(z.string().min(1)).min(1),
});

const WithheldCostSchema = z.object({
  status: z.literal("withheld"),
  blocker: z.string().min(1),
});

export const PreflightReportSchema = z.object({
  productPackId: z.string().min(1),
  productTitle: z.string().min(1),
  assessmentDate: IsoDateSchema,
  outcome: OutcomeSchema,
  outcomeLabel: z.enum(["Ready within checked scope", "Blocked", "Needs verification"]),
  summary: z.string().min(1),
  customsClearanceBlocked: z.boolean(),
  mapping: z.object({
    matched: z.boolean(),
    hsCode: z.string().regex(/^\d{8}$/),
    label: z.string().min(1),
    rationale: z.string().min(1),
    mismatches: z.array(z.string()),
    checkedFacts: z.array(z.string().min(1)).min(1),
  }),
  scope: z.object({
    included: z.array(z.string().min(1)).min(1),
    excluded: z.array(z.string().min(1)).min(1),
  }),
  findings: z.array(FindingSchema).min(1),
  cost: z.discriminatedUnion("status", [AvailableCostSchema, WithheldCostSchema]),
  actions: z.array(ReportActionSchema),
  rerunNotice: z.string().min(1),
});

const BrokerFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const OtherProductReportSchema = z.object({
  reportKind: z.literal("unsupported_product"),
  productPackId: z.literal(OTHER_PRODUCT_ID),
  productTitle: z.literal("Other product"),
  assessmentDate: IsoDateSchema,
  outcome: z.enum(["blocked", "needs_verification"]),
  outcomeLabel: z.enum(["Blocked", "Needs verification"]),
  summary: z.string().min(1),
  customsClearanceBlocked: z.boolean(),
  classification: z.object({
    status: z.literal("withheld"),
    reason: z.string().min(1),
  }),
  cost: WithheldCostSchema,
  coverage: z.object({
    supportedChecks: z.array(z.string().min(1)).min(1),
    unsupportedChecks: z.array(z.string().min(1)).min(1),
    unresolvedFacts: z.array(z.string().min(1)).min(1),
    professionalReviewNeeded: z.string().min(1),
  }),
  universalFacts: z.object({
    product: OtherProductAssessmentRequestSchema.shape.product,
    shipment: OtherProductAssessmentRequestSchema.shape.shipment,
    commercialFacts: OtherProductAssessmentRequestSchema.shape.commercialFacts,
  }),
  brokerSummary: z.object({
    overview: z.string().min(1),
    facts: z.array(BrokerFactSchema).min(1),
    reviewRequest: z.string().min(1),
  }),
  rerunNotice: z.string().min(1),
});

const RequiredOutcomeSetSchema = z
  .array(OutcomeSchema)
  .length(3);

export const PromotionEvidenceSchema = z.object({
  productPackId: z.string().min(1),
  verifiedAt: IsoDateSchema,
  unit: RequiredOutcomeSetSchema,
  contract: RequiredOutcomeSetSchema,
  browser: z.object({
    desktop: RequiredOutcomeSetSchema,
    mobile360: RequiredOutcomeSetSchema,
  }),
});

export type AssessmentRequest = z.infer<typeof AssessmentRequestSchema>;
export type PreflightReport = z.infer<typeof PreflightReportSchema>;
export type OtherProductAssessmentRequest = z.infer<typeof OtherProductAssessmentRequestSchema>;
export type OtherProductReport = z.infer<typeof OtherProductReportSchema>;
export type PreflightResult = PreflightReport | OtherProductReport;
export type ReportAction = z.infer<typeof ReportActionSchema>;
export type ReportFinding = z.infer<typeof FindingSchema>;
export type PromotionEvidence = z.infer<typeof PromotionEvidenceSchema>;
export type PreflightOutcome = z.infer<typeof OutcomeSchema>;
