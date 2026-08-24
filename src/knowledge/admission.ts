import Decimal from "decimal.js";

import {
  ProductPackSchema,
  type CostLine,
  type FixtureFacts,
  type FixtureOutcome,
  type ProductPack,
  type ProductScenario,
} from "./schema";

const ADMISSION_DATE = "2026-08-24";
const REQUIRED_OUTCOMES = ["blocked", "needs_verification", "ready"] as const;
const REQUIRED_RATE_IDS = [
  "agriculture_infrastructure_development_cess",
  "basic_customs_duty",
  "gst_compensation_cess",
  "igst",
  "social_welfare_surcharge",
] as const;

function valuesEqual(expected: unknown, actual: unknown): boolean {
  if (Array.isArray(expected) && Array.isArray(actual)) {
    return (
      expected.length === actual.length &&
      expected.every((value, index) => valuesEqual(value, actual[index]))
    );
  }
  return Object.is(expected, actual);
}

export function matchRouterScenario(
  scenario: ProductScenario,
  facts: Record<string, unknown>,
): { matched: boolean; mismatches: string[] } {
  const mismatches: string[] = [];

  for (const [name, expected] of Object.entries(scenario.includedFacts)) {
    if (!valuesEqual(expected, facts[name])) {
      mismatches.push(name);
    }
  }
  for (const name of scenario.requiredDistinguishingFacts) {
    const value = facts[name];
    if (value === undefined || value === null || value === "") {
      mismatches.push(name);
    }
  }

  return { matched: mismatches.length === 0, mismatches: [...new Set(mismatches)].sort() };
}

export const matchProductScenario = matchRouterScenario;

export function calculateRouterCosts(pack: ProductPack, assessableValueInr: string): CostLine[] {
  const rate = (id: ProductPack["rates"][number]["id"]) =>
    new Decimal(pack.rates.find((item) => item.id === id)!.percent).dividedBy(100);
  const assessableValue = new Decimal(assessableValueInr);
  const bcd = assessableValue.times(rate("basic_customs_duty"));
  const aidc = assessableValue.times(rate("agriculture_infrastructure_development_cess"));
  const sws = bcd.times(rate("social_welfare_surcharge"));
  const igst = assessableValue.plus(bcd).plus(aidc).plus(sws).times(rate("igst"));
  const compensationCess = assessableValue.times(rate("gst_compensation_cess"));
  const total = bcd.plus(aidc).plus(sws).plus(igst).plus(compensationCess);

  return [
    { id: "assessable_value", amountInr: assessableValue.toFixed(2) },
    { id: "basic_customs_duty", amountInr: bcd.toFixed(2) },
    {
      id: "agriculture_infrastructure_development_cess",
      amountInr: aidc.toFixed(2),
    },
    { id: "social_welfare_surcharge", amountInr: sws.toFixed(2) },
    { id: "igst", amountInr: igst.toFixed(2) },
    { id: "gst_compensation_cess", amountInr: compensationCess.toFixed(2) },
    { id: "total_import_duties", amountInr: total.toFixed(2) },
  ];
}

export const calculateProductCosts = calculateRouterCosts;

export function evaluateRouterFixture(
  pack: ProductPack,
  facts: FixtureFacts,
): {
  outcome: FixtureOutcome;
  customsClearanceBlocked: boolean;
  findings: string[];
  costLines: CostLine[];
} {
  if (facts.productPackId !== pack.id) {
    return {
      outcome: "needs_verification",
      customsClearanceBlocked: false,
      findings: [
        `product_pack:needs_verification:expected=${pack.id}:actual=${facts.productPackId}`,
      ],
      costLines: [],
    };
  }

  const match = matchProductScenario(pack.scenario, facts.scenario);
  if (!match.matched) {
    return {
      outcome: "needs_verification",
      customsClearanceBlocked: false,
      findings: [`scenario:needs_verification:${match.mismatches.join(",")}`],
      costLines: [],
    };
  }

  const findings = pack.rules.map((rule) => {
    const status = facts.evidence[rule.id] ?? "unknown";
    return `${rule.id}:${rule.clearanceEffect}:${status}`;
  });
  const customsClearanceBlocked = pack.rules.some(
    (rule) =>
      rule.clearanceEffect !== "non_clearance" && facts.evidence[rule.id] === "absent",
  );
  const blockingRuleMissing = pack.rules.some(
    (rule) =>
      rule.failureEffect === "blocks_legal_readiness" && facts.evidence[rule.id] === "absent",
  );
  const blockingRuleUnknown = pack.rules.some(
    (rule) =>
      rule.failureEffect === "blocks_legal_readiness" &&
      (facts.evidence[rule.id] === undefined || facts.evidence[rule.id] === "unknown"),
  );

  let outcome: FixtureOutcome = "ready";
  if (blockingRuleMissing) {
    outcome = "blocked";
  } else if (
    blockingRuleUnknown ||
    facts.originCountryCode === null ||
    facts.importerIdentity === null ||
    facts.producerIdentity === null ||
    facts.exporterIdentity === null ||
    facts.tradeRemedyCheck === "unknown"
  ) {
    outcome = "needs_verification";
  }

  return {
    outcome,
    customsClearanceBlocked,
    findings,
    costLines:
      outcome === "needs_verification"
        ? []
        : calculateProductCosts(pack, facts.assessableValueInr),
  };
}

export const evaluatePackFixture = evaluateRouterFixture;

function isPrimaryGovernmentUrl(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return /(?:gov|nic)\.in$/.test(hostname);
  } catch {
    return false;
  }
}

function sortedUnique(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function hasExactIds(actual: string[], declared: string[]): boolean {
  return (
    actual.length === sortedUnique(actual).length &&
    declared.length === sortedUnique(declared).length &&
    JSON.stringify(sortedUnique(actual)) === JSON.stringify(sortedUnique(declared))
  );
}

function recordsEqual(
  expected: Record<string, unknown>,
  actual: Record<string, unknown>,
): boolean {
  const expectedKeys = Object.keys(expected).sort();
  const actualKeys = Object.keys(actual).sort();
  return (
    JSON.stringify(expectedKeys) === JSON.stringify(actualKeys) &&
    expectedKeys.every((key) => valuesEqual(expected[key], actual[key]))
  );
}

function hasCurrentReviewGates(pack: ProductPack, asOf: string): boolean {
  return (
    pack.sources.every((source) => source.lastChecked === pack.admittedAt && source.reviewAfter > asOf) &&
    pack.rules.every((rule) => rule.lastChecked === pack.admittedAt && rule.reviewAfter > asOf) &&
    pack.rates.every((rate) => rate.lastChecked === pack.admittedAt && rate.reviewAfter > asOf)
  );
}

export function assessPackAdmission(
  candidate: unknown,
  asOf = ADMISSION_DATE,
): { admitted: boolean; failures: string[] } {
  const parsed = ProductPackSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      admitted: false,
      failures: parsed.error.issues.map((issue) => `schema.${issue.path.join(".")}`),
    };
  }

  const pack = parsed.data;
  const failures: string[] = [];
  const sourceById = new Map(pack.sources.map((source) => [source.id, source]));
  const ruleById = new Map(pack.rules.map((rule) => [rule.id, rule]));
  const rateIds = pack.rates.map((rate) => rate.id).sort();
  const hasCompleteRateSet =
    JSON.stringify(rateIds) === JSON.stringify(REQUIRED_RATE_IDS);

  if (pack.lifecycleStatus !== "source_admitted") failures.push("lifecycleStatus");
  if (pack.selectable) failures.push("runtime.selectable");
  if (pack.publicRuntimeEnabled) failures.push("runtime.publicRuntimeEnabled");
  if (pack.hsMapping.confidence !== "high") failures.push("hsMapping.confidence");
  if (pack.hsMapping.provenance !== "admitted_mapping") failures.push("hsMapping.provenance");
  if (!hasCompleteRateSet) failures.push("rates.identities");

  if (pack.admissionScope.productPackId !== pack.id) {
    failures.push("admissionScope.productPackId");
  }
  if (pack.admissionScope.rateApplicability.productPackId !== pack.id) {
    failures.push("admissionScope.rateApplicability.productPackId");
  }
  if (pack.admissionScope.rateApplicability.hsCode !== pack.hsMapping.hsCode) {
    failures.push("admissionScope.rateApplicability.hsCode");
  }
  if (
    !recordsEqual(pack.scenario.includedFacts, pack.hsMapping.applicabilityFacts) ||
    !recordsEqual(pack.scenario.includedFacts, pack.admissionScope.mappingApplicability)
  ) {
    failures.push("admissionScope.mappingApplicability");
  }
  if (!hasExactIds(pack.sources.map((source) => source.id), pack.admissionScope.sourceIds)) {
    failures.push("admissionScope.sourceIds");
  }
  if (!hasExactIds(pack.rules.map((rule) => rule.id), pack.admissionScope.ruleIds)) {
    failures.push("admissionScope.ruleIds");
  }
  if (!hasExactIds(pack.fixtures.map((fixture) => fixture.id), pack.admissionScope.fixtureIds)) {
    failures.push("admissionScope.fixtureIds");
  }
  const actionIds = pack.rules.flatMap((rule) => rule.remediation.map((action) => action.id));
  if (!hasExactIds(actionIds, pack.admissionScope.actionIds)) {
    failures.push("admissionScope.actionIds");
  }

  const sharedModuleIds = pack.admissionScope.sharedApplicabilityDeclarations.map(
    (declaration) => declaration.moduleId,
  );
  if (sortedUnique(sharedModuleIds).length !== sharedModuleIds.length) {
    failures.push("admissionScope.sharedApplicabilityDeclarations.identities");
  }
  for (const declaration of pack.admissionScope.sharedApplicabilityDeclarations) {
    if (declaration.applicableProductPackId !== pack.id) {
      failures.push(`admissionScope.shared.${declaration.moduleId}.productPackId`);
    }
    for (const [fact, expected] of Object.entries(declaration.requiredScenarioFacts)) {
      if (!valuesEqual(expected, pack.scenario.includedFacts[fact])) {
        failures.push(`admissionScope.shared.${declaration.moduleId}.facts.${fact}`);
      }
    }
    for (const ruleId of declaration.ruleIds) {
      if (!ruleById.has(ruleId)) {
        failures.push(`admissionScope.shared.${declaration.moduleId}.rules.${ruleId}`);
      }
    }
    for (const sourceId of declaration.sourceIds) {
      if (!sourceById.has(sourceId)) {
        failures.push(`admissionScope.shared.${declaration.moduleId}.sources.${sourceId}`);
      }
    }
  }

  for (const source of pack.sources) {
    if (!source.official || source.sourceType !== "primary_official" || !isPrimaryGovernmentUrl(source.url)) {
      failures.push(`sources.${source.id}.authority`);
    }
    if (source.pinpoint.locator.trim() === "") failures.push(`sources.${source.id}.pinpoint`);
    if (source.lastChecked !== pack.admittedAt || source.reviewAfter <= asOf) {
      failures.push(`sources.${source.id}.review`);
    }
  }

  for (const sourceId of pack.hsMapping.sourceIds) {
    if (!sourceById.has(sourceId)) failures.push(`hsMapping.sources.${sourceId}`);
  }
  for (const fact of pack.scenario.requiredDistinguishingFacts) {
    if (!pack.hsMapping.distinguishingFacts.includes(fact)) {
      failures.push(`hsMapping.distinguishingFacts.${fact}`);
    }
  }

  for (const rule of pack.rules) {
    for (const sourceId of rule.sourceIds) {
      if (!sourceById.has(sourceId)) failures.push(`rules.${rule.id}.sources.${sourceId}`);
    }
    if (rule.lastChecked !== pack.admittedAt || rule.reviewAfter <= asOf) {
      failures.push(`rules.${rule.id}.review`);
    }
    if (rule.clearanceEffect !== "non_clearance") {
      const proof = rule.clearanceProof;
      if (
        !proof ||
        proof.pinpoint.trim() === "" ||
        !sourceById.get(proof.sourceId)?.official
      ) {
        failures.push(`rules.${rule.id}.clearanceProof`);
      }
    }
  }

  for (const rate of pack.rates) {
    if (rate.lastChecked !== pack.admittedAt || rate.reviewAfter <= asOf) {
      failures.push(`rates.${rate.id}.review`);
    }
    if (rate.sourceIds.some((sourceId) => !sourceById.get(sourceId)?.official)) {
      failures.push(`rates.${rate.id}.sources`);
    }
  }

  const outcomes = pack.fixtures.map((fixture) => fixture.expectedOutcome).sort();
  if (JSON.stringify(outcomes) !== JSON.stringify(REQUIRED_OUTCOMES)) {
    failures.push("fixtures.outcomes");
  }
  for (const fixture of pack.fixtures) {
    if (fixture.facts.productPackId !== pack.id) {
      failures.push(`fixtures.${fixture.id}.productPackId`);
    }
    if (!hasCompleteRateSet) continue;
    const evaluated = evaluatePackFixture(pack, fixture.facts);
    if (evaluated.outcome !== fixture.expectedOutcome) {
      failures.push(`fixtures.${fixture.id}.outcome`);
    }
    if (evaluated.customsClearanceBlocked !== fixture.expectedCustomsClearanceBlocked) {
      failures.push(`fixtures.${fixture.id}.customsClearanceEffect`);
    }
    if (JSON.stringify(evaluated.findings) !== JSON.stringify(fixture.findings)) {
      failures.push(`fixtures.${fixture.id}.findings`);
    }
    if (JSON.stringify(evaluated.costLines) !== JSON.stringify(fixture.costLines)) {
      failures.push(`fixtures.${fixture.id}.costLines`);
    }
    if (fixture.reviewedAt !== pack.admittedAt) failures.push(`fixtures.${fixture.id}.review`);
    if (fixture.sourceIds.some((sourceId) => !sourceById.has(sourceId))) {
      failures.push(`fixtures.${fixture.id}.sources`);
    }
  }

  return { admitted: failures.length === 0, failures };
}

export function canProducePublicLegalResult(
  pack: ProductPack,
  asOf = new Date().toISOString().slice(0, 10),
): boolean {
  const parsed = ProductPackSchema.safeParse(pack);
  if (!parsed.success) return false;
  const sourceAdmissionCandidate = structuredClone(parsed.data);
  sourceAdmissionCandidate.lifecycleStatus = "source_admitted";
  sourceAdmissionCandidate.selectable = false;
  sourceAdmissionCandidate.publicRuntimeEnabled = false;
  if (!assessPackAdmission(sourceAdmissionCandidate, asOf).admitted) return false;

  return (
    pack.lifecycleStatus === "full_support" &&
    pack.selectable &&
    pack.publicRuntimeEnabled &&
    pack.hsMapping.confidence === "high" &&
    pack.hsMapping.provenance === "admitted_mapping" &&
    pack.admissionScope.productPackId === pack.id &&
    pack.admissionScope.rateApplicability.productPackId === pack.id &&
    pack.admissionScope.rateApplicability.hsCode === pack.hsMapping.hsCode &&
    hasCurrentReviewGates(pack, asOf)
  );
}

export function getPublicRuntimePacks(
  packs: ProductPack[],
  asOf = new Date().toISOString().slice(0, 10),
): ProductPack[] {
  return packs.filter((pack) => canProducePublicLegalResult(pack, asOf));
}
