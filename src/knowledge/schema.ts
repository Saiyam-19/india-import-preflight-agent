import { z } from "zod";

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const SourceSchema = z.object({
  id: z.string().min(1),
  authority: z.string().min(1),
  title: z.string().min(1),
  instrumentId: z.string().min(1),
  url: z.string().url(),
  official: z.boolean(),
  sourceType: z.literal("primary_official"),
  pinpoint: z.object({
    locator: z.string(),
    relevance: z.string().min(1),
  }),
  effectiveFrom: IsoDateSchema,
  lastChecked: IsoDateSchema,
  reviewAfter: IsoDateSchema,
  reviewRationale: z.string().min(1),
});

export const ActionSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  owner: z.string().min(1),
  instruction: z.string().min(1),
  prerequisites: z.array(z.string().min(1)),
  requiredDocuments: z.array(z.string().min(1)).min(1),
  destination: z.object({
    label: z.string().min(1),
    url: z.string().url(),
  }),
  rerunCondition: z.string().min(1),
});

export const RuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  applicability: z.array(z.string().min(1)).min(1),
  requiredEvidence: z.array(z.string().min(1)).min(1),
  clearanceEffect: z.enum(["prevents_clearance", "conditions_clearance", "non_clearance"]),
  failureEffect: z.enum(["blocks_legal_readiness", "warning_only"]),
  clearanceProof: z
    .object({
      sourceId: z.string().min(1),
      pinpoint: z.string(),
    })
    .optional(),
  consequence: z.string().min(1),
  remediation: z.array(ActionSchema).min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  effectiveFrom: IsoDateSchema,
  lastChecked: IsoDateSchema,
  reviewAfter: IsoDateSchema,
});

export const RateSchema = z.object({
  id: z.enum([
    "basic_customs_duty",
    "agriculture_infrastructure_development_cess",
    "social_welfare_surcharge",
    "igst",
    "gst_compensation_cess",
  ]),
  percent: z.number().nonnegative(),
  base: z.enum([
    "assessable_value",
    "basic_customs_duty",
    "assessable_value_plus_bcd_plus_sws",
  ]),
  applicability: z.array(z.string().min(1)).min(1),
  formula: z.string().min(1),
  determination: z.string().min(1),
  sourceIds: z.array(z.string().min(1)).min(1),
  effectiveFrom: IsoDateSchema,
  lastChecked: IsoDateSchema,
  reviewAfter: IsoDateSchema,
});

export const ProductScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  includedFacts: z.record(z.string(), z.unknown()),
  requiredDistinguishingFacts: z.array(z.string().min(1)).min(1),
  excludedVariants: z.array(z.string().min(1)).min(1),
});

export const RouterScenarioSchema = ProductScenarioSchema;

export const FixtureFactsSchema = z.object({
  productPackId: z.string().min(1),
  assessmentDate: IsoDateSchema,
  assessableValueInr: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  originCountryCode: z.string().regex(/^[A-Z]{2}$/).nullable(),
  importerIdentity: z.string().min(1).nullable(),
  producerIdentity: z.string().min(1).nullable(),
  exporterIdentity: z.string().min(1).nullable(),
  preferentialTariffClaim: z.literal("none"),
  scenario: z.record(z.string(), z.unknown()),
  evidence: z.record(
    z.string(),
    z.enum(["present", "absent", "unknown"]),
  ),
  tradeRemedyCheck: z.enum(["confirmed_no_match", "unknown"]),
});

export const CostLineSchema = z.object({
  id: z.enum([
    "assessable_value",
    "basic_customs_duty",
    "agriculture_infrastructure_development_cess",
    "social_welfare_surcharge",
    "igst",
    "gst_compensation_cess",
    "total_import_duties",
  ]),
  amountInr: z.string().regex(/^\d+\.\d{2}$/),
});

export const FixtureSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  expectedOutcome: z.enum(["ready", "blocked", "needs_verification"]),
  expectedCustomsClearanceBlocked: z.boolean(),
  facts: FixtureFactsSchema,
  findings: z.array(z.string()),
  costLines: z.array(CostLineSchema),
  sourceIds: z.array(z.string().min(1)).min(1),
  actions: z.array(ActionSchema).min(1),
  reviewedAt: IsoDateSchema,
});

export const ProductPackSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  title: z.string().min(1),
  lifecycleStatus: z.enum(["candidate", "source_admitted", "full_support"]),
  admittedAt: IsoDateSchema,
  selectable: z.boolean(),
  publicRuntimeEnabled: z.boolean(),
  admissionScope: z.object({
    productPackId: z.string().min(1),
    mappingApplicability: z.record(z.string(), z.unknown()),
    rateApplicability: z.object({
      productPackId: z.string().min(1),
      hsCode: z.string().regex(/^\d{8}$/),
    }),
    sourceIds: z.array(z.string().min(1)).min(1),
    ruleIds: z.array(z.string().min(1)).min(1),
    fixtureIds: z.array(z.string().min(1)).min(1),
    actionIds: z.array(z.string().min(1)).min(1),
    sharedApplicabilityDeclarations: z
      .array(
        z.object({
          moduleId: z.string().min(1),
          applicableProductPackId: z.string().min(1),
          requiredScenarioFacts: z.record(z.string(), z.unknown()),
          ruleIds: z.array(z.string().min(1)).min(1),
          sourceIds: z.array(z.string().min(1)).min(1),
        }),
      )
      .min(1),
  }),
  scenario: ProductScenarioSchema,
  hsMapping: z.object({
    hsCode: z.string().regex(/^\d{8}$/),
    label: z.string().min(1),
    confidence: z.enum(["low", "medium", "high"]),
    provenance: z.enum(["provisional", "admitted_mapping"]),
    rationale: z.string().min(1),
    applicabilityFacts: z.record(z.string(), z.unknown()),
    distinguishingFacts: z.array(z.string().min(1)).min(1),
    sourceIds: z.array(z.string().min(1)).min(1),
  }),
  sources: z.array(SourceSchema).min(1),
  rules: z.array(RuleSchema).min(1),
  rates: z.array(RateSchema).length(5),
  fixtures: z.array(FixtureSchema).min(1),
});

export type ProductPack = z.infer<typeof ProductPackSchema>;
export type ProductScenario = z.infer<typeof ProductScenarioSchema>;
export type RouterScenario = ProductScenario;
export type FixtureFacts = z.infer<typeof FixtureFactsSchema>;
export type CostLine = z.infer<typeof CostLineSchema>;
export type FixtureOutcome = z.infer<typeof FixtureSchema>["expectedOutcome"];
