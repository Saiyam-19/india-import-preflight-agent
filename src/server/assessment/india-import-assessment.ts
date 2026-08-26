import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import {
  assessPackAdmission,
  matchProductScenario,
  type ProductPack,
} from "@/knowledge";

export const ASSESSMENT_STATES = [
  "Research Guidance",
  "Assessment Incomplete",
  "Action Required",
  "Assessment Complete Within Verified Scope",
] as const;

export type AssessmentState = (typeof ASSESSMENT_STATES)[number];
export type EvidenceState =
  | "admitted"
  | "not_yet_effective"
  | "stale"
  | "provisional"
  | "conflicting"
  | "untranslated"
  | "scope_mismatched";
export type ConnectorState =
  | "available"
  | "manual"
  | "login_required"
  | "temporarily_unavailable"
  | "unsupported";

export interface IndiaImportAssessmentInput {
  assessmentDate: string;
  confirmations: {
    datedTradeRemedyCheckConfirmed: boolean;
    evidencePossessionConfirmed: boolean;
    productAndTransactionFactsConfirmed: boolean;
  };
  customsValue: {
    currency: "INR";
    freight: string;
    insurance: string;
    itemValue: string;
    valuationDate: string;
  };
  destinationCountryCode: "IN";
  evidence: Record<string, "present" | "absent" | "unknown">;
  originCountryCode: "CN";
  parties: {
    exporterIdentity: string;
    importerIdentity: string;
    producerIdentity: string;
  };
  preferentialTariffClaim: "none";
  productFacts: Record<string, unknown>;
  tradeDirection: "china_to_india";
  tradeRemedyCheck: "confirmed_no_match" | "possible_match" | "unknown";
}

export interface ValidatedClaimBlock {
  appliesIn: "India";
  claimId: string;
  locator: string;
  sourceVersionId: string;
  text: string;
  tradeDirection: "china_to_india";
  label?: string;
  url?: string;
}

interface AssessmentOptions {
  connectorStates?: Partial<Record<string, ConnectorState>>;
  evidenceStates?: Partial<Record<string, EvidenceState>>;
}

const AGENCY_MANIFEST = [
  {
    agencyId: "india-customs-and-tariff",
    authority: "CBIC / ICEGATE",
    claimSourceId: "icegate-current-85176290",
    whyApplicable: "India is the destination and the confirmed goods require classification, valuation, border-charge and origin/remedy checks.",
    sourceIds: [
      "cbic-current-tariff-85176290",
      "icegate-current-85176290",
      "icegate-duty-calculator",
      "finance-act-2018-sws",
      "igst-rate-9-2025",
    ],
  },
  {
    agencyId: "india-foreign-trade",
    authority: "Directorate General of Foreign Trade",
    claimSourceId: "dgft-general-import-notes-2025",
    whyApplicable: "The goods are being imported into India and require an ITC (HS) import-policy check.",
    sourceIds: ["dgft-itc-hs-851762", "dgft-general-import-notes-2025"],
  },
  {
    agencyId: "india-wpc",
    authority: "DoT Wireless Planning and Coordination Wing",
    claimSourceId: "dot-wpc-eta-service",
    whyApplicable: "The confirmed finished device intentionally transmits in the 2.4 GHz and 5 GHz licence-exempt bands.",
    sourceIds: ["dot-wpc-eta-service", "dot-wpc-import-compendium", "dot-license-exempt-bands"],
  },
  {
    agencyId: "india-bis-adapter",
    authority: "Bureau of Indian Standards / MeitY",
    claimSourceId: "dgft-general-import-notes-2025",
    whyApplicable: "The confirmed retail set contains an external AC-to-DC IT power adapter.",
    sourceIds: ["bis-cro-2021-adapter", "bis-scheme-ii-adapter", "dgft-general-import-notes-2025"],
  },
  {
    agencyId: "india-mtcte",
    authority: "Telecommunication Engineering Centre",
    claimSourceId: "mtcte-framework-2025",
    whyApplicable: "The confirmed device is Wi-Fi customer-premises equipment intended for sale and use in India.",
    sourceIds: ["mtcte-framework-2025", "mtcte-products-current", "mtcte-procedure-2024"],
  },
  {
    agencyId: "india-repa",
    authority: "Department of Telecommunications",
    claimSourceId: "dot-repa-2026",
    whyApplicable: "The confirmed Indian importer will possess and deal in radio equipment for sale.",
    sourceIds: ["dot-repa-2026"],
  },
  {
    agencyId: "india-legal-metrology",
    authority: "Department of Consumer Affairs / DGFT import notes",
    claimSourceId: "dgft-general-import-notes-2025",
    whyApplicable: "The confirmed goods are prepackaged for retail resale in India.",
    sourceIds: ["dgft-general-import-notes-2025"],
  },
] as const;

function humanConnectorState(state: ConnectorState) {
  return state.replaceAll("_", " ");
}

function sourceState(
  sourceId: string,
  pack: ProductPack,
  asOf: string,
  evidenceStates: AssessmentOptions["evidenceStates"] = {},
): EvidenceState | "unknown" {
  const override = evidenceStates[sourceId];
  if (override) return override;
  const source = pack.sources.find((candidate) => candidate.id === sourceId);
  if (!source) return "unknown";
  if (source.effectiveFrom > asOf) return "not_yet_effective";
  return source.reviewAfter <= asOf ? "stale" : "admitted";
}

export function determineApplicableAuthorities(
  pack: ProductPack,
  input: IndiaImportAssessmentInput,
  options: AssessmentOptions = {},
) {
  const scopeMatches =
    input.tradeDirection === "china_to_india" &&
    input.originCountryCode === "CN" &&
    input.destinationCountryCode === "IN";
  return AGENCY_MANIFEST.map((agency) => {
    const connector = options.connectorStates?.[agency.agencyId] ?? "available";
    const sourceBlocker = agency.sourceIds
      .map((id) => ({ id, state: sourceState(id, pack, input.assessmentDate, options.evidenceStates) }))
      .find(({ state }) => state !== "admitted");
    let blocker: string | undefined;
    if (!scopeMatches) blocker = "The confirmed trade direction does not match the India-import Coverage Manifest.";
    else if (connector !== "available") blocker = `The ${agency.authority} connector is ${humanConnectorState(connector)}.`;
    else if (sourceBlocker) blocker = `Source ${sourceBlocker.id} is ${sourceBlocker.state}.`;
    return {
      ...agency,
      sourceIds: [...agency.sourceIds],
      coverage: blocker ? "incomplete" as const : "complete" as const,
      ...(blocker ? { blocker } : {}),
    };
  });
}

export type ProductClassification =
  | {
      status: "working_classification";
      hsCode: string;
      nomenclature: string;
      confirmedMaterialFacts: string[];
      reasoning: string[];
      excludedAlternatives: Array<{ hsCode: string; reason: string }>;
      claims: ValidatedClaimBlock[];
    }
  | {
      status: "classification_candidates";
      missingFacts: string[];
      candidates: Array<{ hsCode: string; nomenclature: string; reason: string }>;
      claims: [];
    };

export function classifyProduct(
  pack: ProductPack,
  productFacts: Record<string, unknown>,
): ProductClassification {
  const match = matchProductScenario(pack.scenario, productFacts);
  if (!match.matched) {
    return {
      status: "classification_candidates",
      missingFacts: match.mismatches,
      candidates: [
        {
          hsCode: "85176230",
          nomenclature: "Modems (modulators-demodulators)",
          reason: "This remains plausible until the modem and network-termination functions are explicitly excluded.",
        },
        {
          hsCode: "85176290",
          nomenclature: pack.hsMapping.label,
          reason: "This remains plausible if the exact facts establish a finished switching/routing apparatus without modem or excluded functions.",
        },
      ],
      claims: [],
    };
  }
  const classificationSource = pack.sources.find((source) => source.id === "cbic-current-tariff-85176290")!;
  const griSource = pack.sources.find((source) => source.id === "cbic-current-tariff-gri")!;
  return {
    status: "working_classification",
    hsCode: pack.hsMapping.hsCode,
    nomenclature: pack.hsMapping.label,
    confirmedMaterialFacts: pack.scenario.requiredDistinguishingFacts.map(
      (name) => `${name}: ${JSON.stringify(productFacts[name])}`,
    ),
    reasoning: [
      "GRI 1: heading 8517 covers the confirmed apparatus for reception, conversion and transmission or regeneration of data.",
      "GRI 3(b): in the confirmed one-router/one-adapter retail set, the router main unit imparts the essential character.",
      "The confirmed switching/routing function and explicit exclusion of an integrated modem support tariff item 85176290.",
    ],
    excludedAlternatives: [
      { hsCode: "85176230", reason: "Excluded because the confirmed device has no integrated modem or modulation-demodulation principal function." },
      { hsCode: "85176990", reason: "Excluded because the confirmed principal function is specifically switching and routing under subheading 851762." },
    ],
    claims: [
      {
        claimId: "working-classification-85176290",
        text: "The confirmed router facts support a Working Classification at tariff item 85176290.",
        sourceVersionId: classificationSource.id,
        locator: classificationSource.pinpoint.locator,
        appliesIn: "India",
        tradeDirection: "china_to_india",
        label: `${classificationSource.authority} — ${classificationSource.title}`,
        url: classificationSource.url,
      },
      {
        claimId: "classification-gri-3b",
        text: "GRI 3(b) assigns the retail set's essential character to the router main unit.",
        sourceVersionId: griSource.id,
        locator: griSource.pinpoint.locator,
        appliesIn: "India",
        tradeDirection: "china_to_india",
        label: `${griSource.authority} — ${griSource.title}`,
        url: griSource.url,
      },
    ],
  };
}

export type BorderChargeEstimate =
  | {
      status: "withheld";
      blockers: string[];
    }
  | {
      status: "available";
      currency: "INR";
      valuationDate: string;
      assessableValue: string;
      components: Array<{ id: string; ratePercent?: string; base: string; formula: string; amount: string }>;
      totalBorderCharges: string;
      formulaOrder: string[];
      rounding: string;
      rateProvenance: Array<{ id: string; percent: string; effectiveFrom: string; checkedOn: string; sourceIds: string[] }>;
      exclusions: string[];
    };

function money(value: Decimal) {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function calculateBorderCharges(
  pack: ProductPack,
  classification: ProductClassification,
  values: IndiaImportAssessmentInput["customsValue"],
  context: {
    asOf: string;
    originCountryCode: string;
    preferentialTariffClaim: string;
    tradeRemedyCheck: IndiaImportAssessmentInput["tradeRemedyCheck"];
  },
): BorderChargeEstimate {
  const blockers: string[] = [];
  if (classification.status !== "working_classification") blockers.push("A Working Classification is required.");
  if (values.currency !== "INR") blockers.push("The admitted calculation supports INR inputs only.");
  if (values.valuationDate !== context.asOf) blockers.push("The valuation date must match the assessment date.");
  if (context.originCountryCode !== "CN") blockers.push("The admitted reference scope requires confirmed China origin.");
  if (context.preferentialTariffClaim !== "none") blockers.push("No preferential tariff claim is admitted.");
  if (context.tradeRemedyCheck !== "confirmed_no_match") blockers.push("A dated origin-, producer- and exporter-specific trade-remedy check is required.");
  if (pack.rates.some((rate) => rate.effectiveFrom > context.asOf)) blockers.push("At least one admitted rate is not effective on the assessment date.");
  if (pack.rates.some((rate) => rate.reviewAfter <= context.asOf)) blockers.push("At least one admitted rate is stale.");
  let item: Decimal;
  let freight: Decimal;
  let insurance: Decimal;
  try {
    item = new Decimal(values.itemValue);
    freight = new Decimal(values.freight);
    insurance = new Decimal(values.insurance);
    if ([item, freight, insurance].some((value) => !value.isFinite() || value.isNegative())) throw new Error();
  } catch {
    blockers.push("Item value, freight and insurance must be non-negative decimal amounts.");
    return { status: "withheld", blockers };
  }
  if (blockers.length > 0) return { status: "withheld", blockers };

  const rate = (id: ProductPack["rates"][number]["id"]) =>
    pack.rates.find((candidate) => candidate.id === id)!;
  const percent = (id: ProductPack["rates"][number]["id"]) =>
    new Decimal(rate(id).percent).div(100);
  const percentLabel = (id: ProductPack["rates"][number]["id"]) =>
    new Decimal(rate(id).percent).toFixed(2);
  const assessable = item.plus(freight).plus(insurance);
  const bcd = assessable.times(percent("basic_customs_duty"));
  const aidc = assessable.times(percent("agriculture_infrastructure_development_cess"));
  const sws = bcd.times(percent("social_welfare_surcharge"));
  const igstBase = assessable.plus(bcd).plus(aidc).plus(sws);
  const igst = igstBase.times(percent("igst"));
  const compensationCess = assessable.times(percent("gst_compensation_cess"));
  const total = bcd.plus(aidc).plus(sws).plus(igst).plus(compensationCess);
  const components = [
    { id: "assessable_value", base: "item value + freight + insurance", formula: `${values.itemValue} + ${values.freight} + ${values.insurance}`, amount: money(assessable) },
    { id: "basic_customs_duty", ratePercent: percentLabel("basic_customs_duty"), base: "assessable value", formula: `${money(assessable)} × ${percentLabel("basic_customs_duty")}%`, amount: money(bcd) },
    { id: "aidc", ratePercent: percentLabel("agriculture_infrastructure_development_cess"), base: "assessable value", formula: `${money(assessable)} × ${percentLabel("agriculture_infrastructure_development_cess")}%`, amount: money(aidc) },
    { id: "social_welfare_surcharge", ratePercent: percentLabel("social_welfare_surcharge"), base: "basic customs duty", formula: `${money(bcd)} × ${percentLabel("social_welfare_surcharge")}%`, amount: money(sws) },
    { id: "igst", ratePercent: percentLabel("igst"), base: "assessable value + BCD + AIDC + SWS", formula: `${money(igstBase)} × ${percentLabel("igst")}%`, amount: money(igst) },
    { id: "compensation_cess", ratePercent: percentLabel("gst_compensation_cess"), base: "assessable value", formula: `${money(assessable)} × ${percentLabel("gst_compensation_cess")}%`, amount: money(compensationCess) },
    { id: "total_border_charges", base: "BCD + AIDC + SWS + IGST + compensation cess", formula: `${money(bcd)} + ${money(aidc)} + ${money(sws)} + ${money(igst)} + ${money(compensationCess)}`, amount: money(total) },
  ];
  return {
    status: "available",
    currency: "INR",
    valuationDate: values.valuationDate,
    assessableValue: money(assessable),
    components,
    totalBorderCharges: money(total),
    formulaOrder: components.map(({ id }) => id),
    rounding: "Each displayed component is rounded to two decimal places using decimal half-up rounding.",
    rateProvenance: pack.rates.map((itemRate) => ({
      id: itemRate.id,
      percent: new Decimal(itemRate.percent).toFixed(2),
      effectiveFrom: itemRate.effectiveFrom,
      checkedOn: itemRate.lastChecked,
      sourceIds: [...itemRate.sourceIds],
    })),
    exclusions: [
      "Domestic transport, port handling, broker fees, storage, demurrage, testing, certification, registration, interest, penalties and post-import taxes are excluded.",
      "No preference, exemption, anti-dumping, safeguard or countervailing amount is assumed beyond the confirmed dated no-match check.",
    ],
  };
}

export function validateClaimBlocks(
  claims: ValidatedClaimBlock[],
  pack: ProductPack,
  options: { asOf: string; evidenceStates?: AssessmentOptions["evidenceStates"] },
) {
  for (const claim of claims) {
    if (!claim.sourceVersionId) throw new Error("A claim has an absent source ID.");
    const source = pack.sources.find((candidate) => candidate.id === claim.sourceVersionId);
    if (!source) throw new Error(`Claim ${claim.claimId} references an unknown source.`);
    if (!claim.locator || claim.locator !== source.pinpoint.locator) {
      throw new Error(`Claim ${claim.claimId} does not resolve to the admitted exact locator.`);
    }
    const state = sourceState(source.id, pack, options.asOf, options.evidenceStates);
    if (state !== "admitted") throw new Error(`Claim ${claim.claimId} citation is ${state.replaceAll("_", " ")}.`);
    if (claim.appliesIn !== "India" || claim.tradeDirection !== "china_to_india") {
      throw new Error(`Claim ${claim.claimId} citation is scope mismatched.`);
    }
  }
  return claims;
}

function snapshotId(value: unknown) {
  const hash = createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 24);
  return `assessment-${hash}`;
}

const RATE_CLAIM_SOURCE: Record<ProductPack["rates"][number]["id"], string> = {
  basic_customs_duty: "cbic-current-tariff-85176290",
  agriculture_infrastructure_development_cess: "customs-aidc-11-2021",
  social_welfare_surcharge: "finance-act-2018-sws",
  igst: "igst-rate-9-2025",
  gst_compensation_cess: "gst-compensation-cess-1-2017",
};

function rateClaimBlocks(pack: ProductPack): ValidatedClaimBlock[] {
  return pack.rates.map((rate) => {
    const source = pack.sources.find((candidate) => candidate.id === RATE_CLAIM_SOURCE[rate.id])!;
    return {
      claimId: `rate-${rate.id}`,
      text: `${rate.id.replaceAll("_", " ")} uses the admitted ${rate.percent}% rate for the confirmed reference scope, effective ${rate.effectiveFrom}.`,
      sourceVersionId: source.id,
      locator: source.pinpoint.locator,
      appliesIn: "India",
      tradeDirection: "china_to_india",
      label: `${source.authority} — ${source.title}`,
      url: source.url,
    };
  });
}

function agencyClaimBlocks(
  checklist: ReturnType<typeof determineApplicableAuthorities>,
  pack: ProductPack,
): ValidatedClaimBlock[] {
  return checklist.flatMap((entry) => {
    const source = pack.sources.find((candidate) => candidate.id === entry.claimSourceId);
    if (!source) return [];
    return [{
      claimId: `agency-${entry.agencyId}`,
      text: source.pinpoint.relevance,
      sourceVersionId: source.id,
      locator: source.pinpoint.locator,
      appliesIn: "India" as const,
      tradeDirection: "china_to_india" as const,
      label: `${source.authority} — ${source.title}`,
      url: source.url,
    }];
  });
}

export function assessTradeCase(
  pack: ProductPack,
  input: IndiaImportAssessmentInput,
  options: AssessmentOptions = {},
) {
  const checklist = determineApplicableAuthorities(pack, input, options);
  const classification = input.confirmations.productAndTransactionFactsConfirmed
    ? classifyProduct(pack, input.productFacts)
    : classifyProduct(pack, {});
  const calculated = calculateBorderCharges(pack, classification, input.customsValue, {
    asOf: input.assessmentDate,
    originCountryCode: input.originCountryCode,
    preferentialTariffClaim: input.preferentialTariffClaim,
    tradeRemedyCheck: input.tradeRemedyCheck,
  });
  const calculation: BorderChargeEstimate =
    !input.confirmations.productAndTransactionFactsConfirmed ||
    !input.confirmations.datedTradeRemedyCheckConfirmed
      ? {
          status: "withheld",
          blockers: [
            ...(!input.confirmations.productAndTransactionFactsConfirmed
              ? ["Confirmed product and transaction facts are required."]
              : []),
            ...(!input.confirmations.datedTradeRemedyCheckConfirmed
              ? ["The dated trade-remedy check must be explicitly confirmed."]
              : []),
          ],
        }
      : calculated;
  const missingFacts = Object.entries(input.parties)
    .filter(([, value]) => value.trim() === "")
    .map(([name]) => name);
  const unknownEvidence = pack.rules
    .filter((rule) => !input.evidence[rule.id] || input.evidence[rule.id] === "unknown")
    .map((rule) => rule.id);
  const absentEvidence = pack.rules
    .filter((rule) => input.evidence[rule.id] === "absent" && rule.failureEffect === "blocks_legal_readiness")
    .map((rule) => rule.id);
  const admission = assessPackAdmission(pack, input.assessmentDate);
  const coverageBlockers = checklist.flatMap((entry) => entry.blocker ? [entry.blocker] : []);
  const actionableTradeRemedyBlocker =
    input.tradeRemedyCheck === "possible_match"
      ? "A dated origin-, producer- and exporter-specific trade-remedy check is required."
      : undefined;
  const blockers = [
    ...missingFacts.map((name) => `Missing confirmed party fact: ${name}.`),
    ...unknownEvidence.map((id) => `Evidence status is unresolved: ${id}.`),
    ...coverageBlockers,
    ...admission.failures.map((failure) => `Coverage Manifest admission failure: ${failure}.`),
    ...(classification.status === "classification_candidates" ? [`Classification is ambiguous: ${classification.missingFacts.join(", ")}.`] : []),
    ...(calculation.status === "withheld" ? calculation.blockers : []),
    ...(!input.confirmations.evidencePossessionConfirmed ? ["Evidence possession has not been confirmed."] : []),
    ...(!input.confirmations.datedTradeRemedyCheckConfirmed ? ["The dated trade-remedy check has not been confirmed."] : []),
  ];

  let claims: ValidatedClaimBlock[] = [
    ...(input.confirmations.productAndTransactionFactsConfirmed
      ? agencyClaimBlocks(checklist, pack)
      : []),
    ...classification.claims,
    ...(calculation.status === "available" ? rateClaimBlocks(pack) : []),
  ];
  try {
    claims = validateClaimBlocks(claims, pack, {
      asOf: input.assessmentDate,
      evidenceStates: options.evidenceStates,
    });
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : "A claim citation failed validation.");
    claims = [];
  }

  let state: AssessmentState;
  if (!input.confirmations.productAndTransactionFactsConfirmed) state = "Research Guidance";
  else if (
    (absentEvidence.length > 0 || input.tradeRemedyCheck === "possible_match") &&
    blockers.every((blocker) => blocker === actionableTradeRemedyBlocker)
  ) state = "Action Required";
  else if (blockers.length > 0) state = "Assessment Incomplete";
  else state = "Assessment Complete Within Verified Scope";

  const snapshotBody = {
    version: "bwmi-18-india-import-assessment-v1",
    executionProvenance: {
      mode: "deterministic_domain_tools",
      modelVersion: "not_used",
      promptVersion: "not_used",
      toolVersions: {
        assess_trade_case: "bwmi-18-v1",
        calculate_border_charges: "bwmi-18-v1",
        classify_product: "bwmi-18-v1",
        determine_applicable_authorities: "bwmi-18-v1",
      },
    },
    state,
    caseFacts: structuredClone(input),
    checklist,
    classification,
    calculation,
    claims,
    blockers,
    actionItems: [
      ...absentEvidence.map((id) => `Resolve and document the confirmed missing requirement: ${id}.`),
      ...blockers,
    ],
    checked: [
      "India import classification",
      "India Applicable-Agency Checklist",
      "India border charges",
      "Confirmed product and transaction evidence",
    ],
    notChecked: [
      "China export-side controls — explicitly not checked in BWMI-18",
      "Certificate authenticity or live issuing-authority status",
      "Port-, state-, local-, post-entry and downstream obligations outside the displayed Coverage Manifest",
    ],
    exclusions: [
      "This is not a customs clearance decision or legal approval.",
      "No filing, payment, application, certificate verification or shipment tracking was performed.",
    ],
    nextPreparationSteps: [
      "Retain the exact-model technical dossier, confirmed party identities and dated origin evidence.",
      "Retain the WPC, BIS, MTCTE, REPA, package-labelling and trade-remedy records referenced by this assessment.",
      "Re-run the assessment after any product, shipment, rate, source, certificate or date change.",
      "Check China export-side controls separately before relying on the bilateral journey.",
    ],
  };
  const createdAt = new Date().toISOString();
  return { snapshotId: snapshotId({ ...snapshotBody, createdAt }), createdAt, ...snapshotBody };
}

export type IndiaImportAssessment = ReturnType<typeof assessTradeCase>;
