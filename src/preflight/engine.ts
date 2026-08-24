import Decimal from "decimal.js";

import {
  assessPackAdmission,
  calculateProductCosts,
  canProducePublicLegalResult,
  matchProductScenario,
  type ProductPack,
} from "@/knowledge";

import {
  AssessmentRequestSchema,
  PreflightReportSchema,
  type AssessmentRequest,
  type PreflightReport,
  type ReportAction,
  type ReportFinding,
} from "./schema";

export interface EvaluationOptions {
  access: "public" | "promotion_harness";
  asOf?: string;
}

const OUTCOME_LABELS = {
  ready: "Ready within checked scope",
  blocked: "Blocked",
  needs_verification: "Needs verification",
} as const;

const COST_EXCLUSIONS = [
  "Domestic transport, port handling, broker fees, storage, demurrage, testing, certification, registration, interest, penalties, and post-import taxes are excluded.",
  "No currency conversion, preferential tariff, exemption, or trade-remedy amount is assumed.",
];

function firstSource(pack: ProductPack, preferredIds: string[] = []) {
  return (
    preferredIds.map((id) => pack.sources.find((source) => source.id === id)).find(Boolean) ??
    pack.sources[0]!
  );
}

function reportSource(pack: ProductPack, sourceIds: string[], clearanceSourceId?: string) {
  const source = firstSource(pack, [clearanceSourceId ?? "", ...sourceIds]);
  return {
    sourceId: source.id,
    authority: source.authority,
    title: source.title,
    url: source.url,
    pinpoint: source.pinpoint.locator,
    relevance: source.pinpoint.relevance,
    lastChecked: source.lastChecked,
    reviewAfter: source.reviewAfter,
  };
}

function cloneAction(action: ProductPack["rules"][number]["remediation"][number]): ReportAction {
  return {
    id: action.id,
    order: action.order,
    owner: action.owner,
    instruction: action.instruction,
    prerequisites: [...action.prerequisites],
    requiredDocuments: [...action.requiredDocuments],
    destination: { ...action.destination },
    rerunCondition: action.rerunCondition,
  };
}

function verificationAction(
  pack: ProductPack,
  id: string,
  instruction: string,
  documents: string[],
  preferredSourceIds: string[] = [],
): ReportAction {
  const source = firstSource(pack, preferredSourceIds);
  return {
    id,
    order: 0,
    owner: "Indian importer or customs adviser",
    instruction,
    prerequisites: ["Keep the exact product model and shipment parties frozen while resolving this fact."],
    requiredDocuments: documents.length > 0 ? documents : ["Documented evidence resolving this verification gap"],
    destination: { label: source.authority, url: source.url },
    rerunCondition: "Update the missing or mismatched fact, then run the complete preflight again.",
  };
}

function syntheticFinding(
  pack: ProductPack,
  input: {
    id: string;
    title: string;
    explanation: string;
    missingEvidence: string[];
    action: ReportAction;
    sourceIds?: string[];
  },
): ReportFinding {
  return {
    ruleId: input.id,
    title: input.title,
    status: "unknown",
    kind: "verification_gap",
    explanation: input.explanation,
    requiredEvidence:
      input.missingEvidence.length > 0
        ? input.missingEvidence
        : ["Evidence resolving the named verification gap"],
    missingEvidence:
      input.missingEvidence.length > 0
        ? input.missingEvidence
        : ["Evidence resolving the named verification gap"],
    source: reportSource(pack, input.sourceIds ?? pack.hsMapping.sourceIds),
    action: input.action,
  };
}

function ruleFindings(pack: ProductPack, evidence: Record<string, "present" | "absent" | "unknown">) {
  return pack.rules.map((rule): ReportFinding => {
    const status = evidence[rule.id] ?? "unknown";
    let kind: ReportFinding["kind"] = "satisfied";
    if (status === "unknown") kind = "verification_gap";
    if (status === "absent" && rule.clearanceEffect !== "non_clearance") {
      kind = "clearance_blocker";
    } else if (status === "absent" && rule.failureEffect === "warning_only") {
      kind = "warning";
    } else if (status === "absent") {
      kind = "verification_gap";
    }

    const action = cloneAction(rule.remediation[0]!);
    const explanation =
      kind === "satisfied"
        ? `Confirmed evidence satisfies the checked ${rule.title} gate.`
        : kind === "clearance_blocker"
          ? `${rule.consequence} The cited official pinpoint is admitted as a Customs-clearance condition for this exact product.`
          : kind === "warning"
            ? `${rule.consequence} This remains a warning and is not represented as a Customs-clearance blocker.`
            : `${rule.consequence} The checked evidence does not establish a Customs-clearance block, so the result fails closed to verification.`;

    return {
      ruleId: rule.id,
      title: rule.title,
      status,
      kind,
      explanation,
      requiredEvidence: [...rule.requiredEvidence],
      missingEvidence: status === "present" ? [] : [...rule.requiredEvidence],
      source: reportSource(
        pack,
        rule.sourceIds,
        rule.clearanceProof?.sourceId,
      ),
      action,
    };
  });
}

function parseCostInputs(input: AssessmentRequest["costInputs"]) {
  const itemValue = new Decimal(input.itemValueInr);
  const freight = new Decimal(input.freightInr);
  const insurance = new Decimal(input.insuranceInr);
  const assessableValue = itemValue.plus(freight).plus(insurance);
  if (assessableValue.lte(0)) throw new Error("Assessable value must be greater than zero.");
  return { itemValue, freight, insurance, assessableValue };
}

function outcomeSummary(outcome: PreflightReport["outcome"], customsBlocked: boolean) {
  if (outcome === "ready") {
    return "Every applicability, evidence, identity, source-review, trade-remedy, and cost gate passed for the exact checked scope.";
  }
  if (outcome === "blocked" && customsBlocked) {
    return "An exact admitted rule and fact match establishes a Customs-clearance blocker for this shipment.";
  }
  return "One or more facts or evidence gates remain unresolved. No public legal conclusion or numeric estimate is released.";
}

function unavailableReport(
  pack: ProductPack,
  request: AssessmentRequest,
  asOf: string,
  summary: string,
  missingEvidence: string[],
): PreflightReport {
  const action = verificationAction(
    pack,
    "resolve_runtime_eligibility",
    "Resolve the named pack or source-review eligibility failure before running a public assessment.",
    missingEvidence,
  );
  return PreflightReportSchema.parse({
    productPackId: pack.id,
    productTitle: pack.title,
    assessmentDate: asOf,
    outcome: "needs_verification",
    outcomeLabel: OUTCOME_LABELS.needs_verification,
    summary,
    customsClearanceBlocked: false,
    mapping: {
      matched: false,
      hsCode: pack.hsMapping.hsCode,
      label: pack.hsMapping.label,
      rationale: pack.hsMapping.rationale,
      mismatches: missingEvidence,
      checkedFacts: [...pack.scenario.requiredDistinguishingFacts],
    },
    scope: {
      included: Object.entries(pack.scenario.includedFacts).map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
      excluded: [...pack.scenario.excludedVariants],
    },
    findings: [
      syntheticFinding(pack, {
        id: "runtime_eligibility",
        title: "Public runtime eligibility",
        explanation: summary,
        missingEvidence,
        action,
      }),
    ],
    cost: { status: "withheld", blocker: summary },
    actions: [action],
    rerunNotice: "Rerun only after the product pack and all source-review gates are eligible again.",
  });
}

export function evaluatePreflight(
  pack: ProductPack,
  candidateRequest: AssessmentRequest,
  options: EvaluationOptions,
): PreflightReport {
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  const publicEligible = canProducePublicLegalResult(pack, asOf);
  const restrictedEligible = assessPackAdmission(pack, asOf).admitted;

  if (options.access === "public" && !publicEligible) {
    return unavailableReport(
      pack,
      candidateRequest,
      asOf,
      "This product pack is not available for public assessment because it has not passed every full-support runtime gate.",
      ["Independent full-support promotion evidence"],
    );
  }
  if (options.access === "promotion_harness" && !restrictedEligible) {
    return unavailableReport(
      pack,
      candidateRequest,
      asOf,
      "The source review or admission contract is stale, incomplete, or mismatched, so the restricted harness cannot evaluate this pack.",
      ["Current source review and complete source-admission contract"],
    );
  }

  const parsed = AssessmentRequestSchema.safeParse(candidateRequest);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.path.join(".") || "request");
    return unavailableReport(
      pack,
      candidateRequest,
      asOf,
      "The assessment input is incomplete or invalid and must be verified before any result or numeric cost can be released.",
      issues,
    );
  }

  const request = parsed.data;
  const match = matchProductScenario(pack.scenario, request.scenario);
  const synthetic: ReportFinding[] = [];
  const addGap = (finding: Parameters<typeof syntheticFinding>[1]) => {
    synthetic.push(syntheticFinding(pack, finding));
  };

  if (request.productPackId !== pack.id) {
    const action = verificationAction(
      pack,
      "select_matching_product_pack",
      "Select the product pack that owns this exact product and do not reuse another product's rules, rates, or evidence.",
      ["Exact product-pack identity"],
    );
    addGap({
      id: "product_pack_identity",
      title: "Product-pack identity",
      explanation: `The request names ${request.productPackId}, but this assessment is isolated to ${pack.id}.`,
      missingEvidence: ["Matching product-pack identity"],
      action,
    });
  }

  if (!match.matched) {
    const action = verificationAction(
      pack,
      "resolve_exact_product_mapping",
      "Resolve every missing or mismatched product fact against the exact supported scenario.",
      match.mismatches.map((fact) => `Confirmed ${fact}`),
      pack.hsMapping.sourceIds,
    );
    addGap({
      id: "mapping_applicability",
      title: "Exact product applicability",
      explanation: `The exact admitted mapping cannot be applied because these facts are missing or mismatched: ${match.mismatches.join(", ")}.`,
      missingEvidence: match.mismatches.map((fact) => `Confirmed ${fact}`),
      action,
      sourceIds: pack.hsMapping.sourceIds,
    });
  }

  if (request.assessmentDate !== asOf) {
    const action = verificationAction(
      pack,
      "refresh_assessment_date",
      "Refresh all time-sensitive checks for the current assessment date.",
      ["Current assessment date and dated source checks"],
    );
    addGap({
      id: "assessment_date",
      title: "Current assessment date",
      explanation: `The request date ${request.assessmentDate} does not match the required assessment date ${asOf}.`,
      missingEvidence: ["Current dated assessment"],
      action,
    });
  }

  const missingParties = Object.entries(request.parties)
    .filter(([, value]) => value === null || value === "")
    .map(([name]) => name);
  if (missingParties.length > 0) {
    const tradeSources = pack.sources
      .filter((source) => /trade.remedy|dgtr|assessment/i.test(`${source.id} ${source.title}`))
      .map((source) => source.id);
    const action = verificationAction(
      pack,
      "resolve_shipment_parties",
      "Confirm the exact origin, importer, producer, and exporter identities for this shipment.",
      missingParties.map((party) => `Exact ${party}`),
      tradeSources,
    );
    addGap({
      id: "shipment_parties",
      title: "Origin and party identities",
      explanation: `The trade-remedy and shipment identity gates are incomplete: ${missingParties.join(", ")}.`,
      missingEvidence: missingParties.map((party) => `Exact ${party}`),
      action,
      sourceIds: tradeSources,
    });
  }

  if (request.tradeRemedyCheck !== "confirmed_no_match") {
    const tradeSources = pack.sources
      .filter((source) => /trade.remedy|dgtr|assessment/i.test(`${source.id} ${source.title}`))
      .map((source) => source.id);
    const action = verificationAction(
      pack,
      "complete_trade_remedy_check",
      "Complete a dated ICEGATE and DGTR check for the exact product, origin, producer, and exporter.",
      ["Dated no-match trade-remedy record"],
      tradeSources,
    );
    addGap({
      id: "trade_remedy_gate",
      title: "Dated trade-remedy gate",
      explanation:
        request.tradeRemedyCheck === "possible_match"
          ? "A possible trade-remedy match must be resolved before classification, rates, or cost can be released."
          : "The dated trade-remedy check is unresolved, so numeric cost is withheld.",
      missingEvidence: ["Dated ICEGATE and DGTR no-match record"],
      action,
      sourceIds: tradeSources,
    });
  }

  const findings = [...synthetic, ...ruleFindings(pack, request.evidence)];
  const hasVerificationGap = findings.some((finding) => finding.kind === "verification_gap");
  const clearanceBlockers = findings.filter((finding) => finding.kind === "clearance_blocker");
  const outcome: PreflightReport["outcome"] = hasVerificationGap
    ? "needs_verification"
    : clearanceBlockers.length > 0
      ? "blocked"
      : "ready";
  const customsClearanceBlocked = outcome === "blocked" && clearanceBlockers.length > 0;

  let cost: PreflightReport["cost"];
  if (outcome === "needs_verification") {
    cost = {
      status: "withheld",
      blocker:
        findings.find((finding) => finding.kind === "verification_gap")?.title ??
        "An unresolved verification gate prevents numeric cost.",
    };
  } else {
    const parsedCost = parseCostInputs(request.costInputs);
    cost = {
      status: "available",
      formula: "item value + freight + insurance",
      assessableValueInr: parsedCost.assessableValue.toFixed(2),
      inputs: {
        itemValueInr: parsedCost.itemValue.toFixed(2),
        freightInr: parsedCost.freight.toFixed(2),
        insuranceInr: parsedCost.insurance.toFixed(2),
      },
      lines: calculateProductCosts(pack, parsedCost.assessableValue.toFixed(2)),
      assumptions: [
        `Exact admitted mapping ${pack.hsMapping.hsCode} applies to the confirmed scenario.`,
        "No preferential tariff claim is admitted.",
        `Rates and sources were last checked on ${pack.admittedAt}.`,
      ],
      exclusions: COST_EXCLUSIONS,
    };
  }

  const actionMap = new Map<string, ReportAction>();
  for (const finding of findings) {
    if (finding.kind !== "satisfied") actionMap.set(finding.action.id, finding.action);
  }
  const actions = [...actionMap.values()].sort(
    (left, right) => left.order - right.order || left.id.localeCompare(right.id),
  );

  return PreflightReportSchema.parse({
    productPackId: pack.id,
    productTitle: pack.title,
    assessmentDate: asOf,
    outcome,
    outcomeLabel: OUTCOME_LABELS[outcome],
    summary: outcomeSummary(outcome, customsClearanceBlocked),
    customsClearanceBlocked,
    mapping: {
      matched: match.matched && request.productPackId === pack.id,
      hsCode: pack.hsMapping.hsCode,
      label: pack.hsMapping.label,
      rationale: pack.hsMapping.rationale,
      mismatches: [
        ...(request.productPackId === pack.id ? [] : ["productPackId"]),
        ...match.mismatches,
      ],
      checkedFacts: [...pack.scenario.requiredDistinguishingFacts],
    },
    scope: {
      included: Object.entries(pack.scenario.includedFacts).map(([key, value]) => `${key}: ${JSON.stringify(value)}`),
      excluded: [...pack.scenario.excludedVariants],
    },
    findings,
    cost,
    actions,
    rerunNotice:
      "Rerun after any change to the model, technical facts, accessories, origin, parties, evidence, rates, source-review date, or cost inputs.",
  });
}

export function requestFromFixture(
  pack: ProductPack,
  fixture: ProductPack["fixtures"][number],
): AssessmentRequest {
  return {
    productPackId: fixture.facts.productPackId,
    assessmentDate: fixture.facts.assessmentDate,
    scenario: structuredClone(fixture.facts.scenario),
    parties: {
      originCountryCode: fixture.facts.originCountryCode,
      importerIdentity: fixture.facts.importerIdentity,
      producerIdentity: fixture.facts.producerIdentity,
      exporterIdentity: fixture.facts.exporterIdentity,
    },
    tradeRemedyCheck: fixture.facts.tradeRemedyCheck,
    evidence: structuredClone(fixture.facts.evidence),
    costInputs: {
      itemValueInr: fixture.facts.assessableValueInr,
      freightInr: "0",
      insuranceInr: "0",
    },
  };
}
