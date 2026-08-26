import { createHash } from "node:crypto";

import Decimal from "decimal.js";

import type {
  AssessmentState,
  ConnectorState,
  EvidenceState,
} from "@/server/assessment/india-import-assessment";
import {
  INDIA_TO_CHINA_COVERAGE_MANIFEST,
  INDIA_TO_CHINA_SOURCES,
  indiaToChinaSourceState,
  validateIndiaToChinaTranslations,
  type IndiaToChinaSource,
} from "@/server/assessment/india-to-china-evidence";

type EvidencePresence = "present" | "absent" | "unknown";

export interface IndiaToChinaAssessmentInput {
  assessmentDate: string;
  chinaTariffResult: {
    authoritativeText: string;
    basicDutyRatePercent: string;
    consumptionTaxRatePercent: string;
    effectiveFrom: string;
    exactLocator: string;
    importVatRatePercent: string;
    translation: {
      kind: "Official Translation" | "Derived Translation";
      materialAmbiguity: string | null;
      text: string;
    };
  };
  confirmations: {
    chinaScreeningConfirmed: boolean;
    evidencePossessionConfirmed: boolean;
    indiaScreeningConfirmed: boolean;
    productAndTransactionFactsConfirmed: boolean;
    tariffResultConfirmed: boolean;
    translationReviewConfirmed: boolean;
  };
  connectorStates: Record<string, ConnectorState>;
  customsValue: {
    currency: "CNY";
    freight: string;
    insurance: string;
    itemValue: string;
    valuationDate: string;
  };
  endUse: string;
  evidence: Record<string, EvidencePresence>;
  intendedUse: string;
  manufacturing: {
    countryCode: string;
    originBasis: string;
    site: string;
  };
  parties: {
    endUserIdentity: string;
    exporterIdentity: string;
    importerIdentity: string;
    producerIdentity: string;
  };
  preferentialTariffClaim: "none" | "apta";
  productFacts: {
    chinaTariffCode: string;
    indiaTariffCode: string;
    manufacturerIdentity: string;
    modelIdentity: string;
    productDescription: string;
    technicalSpecifications: string;
  };
  route: {
    destinationProvince: string;
    exportPort: string;
    importPort: string;
    transitCountries: string[];
  };
  screening: {
    chinaCcc: "confirmed_not_applicable" | "certificate_required_and_valid" | "unknown";
    chinaImportLicence: "confirmed_no_match" | "licence_required_and_valid" | "unknown";
    chinaNetworkAccess: "confirmed_not_applicable" | "permit_required_and_valid" | "unknown";
    chinaRadioTypeApproval: "confirmed_not_applicable" | "approval_required_and_valid" | "unknown";
    consumptionTax: "confirmed_not_applicable" | "applicable" | "unknown";
    indiaExportPolicy: "confirmed_free" | "authorisation_required_and_valid" | "prohibited" | "unknown";
    indiaScomet: "confirmed_no_match_with_parameters" | "licence_required_and_valid" | "unknown";
    restrictedParty: "confirmed_no_match" | "possible_match" | "unknown";
    tradeRemedy: "confirmed_no_match" | "possible_match" | "unknown";
  };
  tradeDirection: "india_to_china";
}

export interface IndiaToChinaAssessmentOptions {
  evidenceStates?: Partial<Record<string, EvidenceState>>;
  sources?: IndiaToChinaSource[];
}

interface BilateralClaimBlock {
  appliesIn: "China" | "India";
  authoritativeLanguage?: "zh-CN";
  claimId: string;
  label: string;
  locator: string;
  sourceVersionId: string;
  text: string;
  tradeDirection: "india_to_china";
  translationKind?: "Official Translation" | "Derived Translation";
  url: string;
}

function nonBlank(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceById(sources: IndiaToChinaSource[], id: string) {
  const source = sources.find((candidate) => candidate.id === id);
  if (!source) throw new Error(`Unknown India-to-China source: ${id}`);
  return source;
}

function money(value: Decimal) {
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

function percentage(value: string, label: string, blockers: string[]) {
  try {
    const parsed = new Decimal(value);
    if (parsed.isNegative() || parsed.greaterThan(100)) throw new Error("out of range");
    return parsed;
  } catch {
    blockers.push(`${label} must be a confirmed decimal percentage from 0 to 100.`);
    return null;
  }
}

function calculateChinaBorderCharges(input: IndiaToChinaAssessmentInput, blockers: string[]) {
  const calculationBlockers: string[] = [];
  let itemValue: Decimal;
  let freight: Decimal;
  let insurance: Decimal;
  try {
    itemValue = new Decimal(input.customsValue.itemValue);
    freight = new Decimal(input.customsValue.freight);
    insurance = new Decimal(input.customsValue.insurance);
    if (itemValue.isNegative() || freight.isNegative() || insurance.isNegative()) throw new Error("negative");
  } catch {
    calculationBlockers.push("China Customs value, freight and insurance must be non-negative decimal CNY amounts.");
    itemValue = new Decimal(0);
    freight = new Decimal(0);
    insurance = new Decimal(0);
  }
  const dutyRate = percentage(input.chinaTariffResult.basicDutyRatePercent, "Basic duty rate", calculationBlockers);
  const vatRate = percentage(input.chinaTariffResult.importVatRatePercent, "Import VAT rate", calculationBlockers);
  const consumptionRate = percentage(input.chinaTariffResult.consumptionTaxRatePercent, "Consumption-tax rate", calculationBlockers);
  if (input.screening.consumptionTax !== "confirmed_not_applicable" || !consumptionRate?.isZero()) {
    calculationBlockers.push("Consumption-tax applicability or its product-specific statutory calculation remains unresolved; the border-charge number is withheld.");
  }
  if (!input.confirmations.tariffResultConfirmed) calculationBlockers.push("The exact China tariff result and rates have not been confirmed.");
  if (!input.confirmations.evidencePossessionConfirmed || input.evidence.china_tariff_classification_result !== "present") {
    calculationBlockers.push("The reviewed case evidence for the exact China tariff classification and rate result is missing.");
  }
  if (input.chinaTariffResult.effectiveFrom > input.assessmentDate) calculationBlockers.push("The confirmed China tariff result is not effective on the assessment date.");
  if (!nonBlank(input.chinaTariffResult.exactLocator)) calculationBlockers.push("The exact China tariff-result locator is missing.");
  if (input.customsValue.valuationDate !== input.assessmentDate) calculationBlockers.push("The valuation date does not match the assessment date.");
  if (input.customsValue.currency !== "CNY") calculationBlockers.push("This China import calculation supports confirmed CNY inputs only.");
  if (calculationBlockers.length > 0 || !dutyRate || !vatRate) {
    blockers.push(...calculationBlockers);
    return { status: "withheld" as const, blockers: calculationBlockers };
  }

  const assessableValue = itemValue.plus(freight).plus(insurance);
  const duty = assessableValue.times(dutyRate).dividedBy(100);
  const consumptionTax = new Decimal(0);
  const vatBase = assessableValue.plus(duty).plus(consumptionTax);
  const vat = vatBase.times(vatRate).dividedBy(100);
  const total = duty.plus(consumptionTax).plus(vat);
  return {
    status: "available" as const,
    currency: "CNY" as const,
    valuationDate: input.customsValue.valuationDate,
    assessableValue: money(assessableValue),
    components: [
      {
        id: "customs_duty",
        base: money(assessableValue),
        ratePercent: dutyRate.toString(),
        formula: "China Customs value × confirmed case-applicable duty rate",
        amount: money(duty),
      },
      {
        id: "consumption_tax",
        base: money(assessableValue.plus(duty)),
        ratePercent: "0",
        formula: "0 because the exact product screen confirms consumption tax is not applicable",
        amount: "0.00",
      },
      {
        id: "import_vat",
        base: money(vatBase),
        ratePercent: vatRate.toString(),
        formula: "(China Customs value + Customs duty + consumption tax) × confirmed import VAT rate",
        amount: money(vat),
      },
    ],
    rateProvenance: [
      {
        id: "customs_duty",
        percent: dutyRate.toString(),
        effectiveFrom: input.chinaTariffResult.effectiveFrom,
        checkedOn: input.assessmentDate,
        sourceIds: ["prc-tariff-law-2024", "prc-tariff-schedule-2026", "case-china-tariff-result"],
      },
      {
        id: "import_vat",
        percent: vatRate.toString(),
        effectiveFrom: input.chinaTariffResult.effectiveFrom,
        checkedOn: input.assessmentDate,
        sourceIds: ["prc-vat-law-2024", "prc-vat-implementation-2026", "case-china-tariff-result"],
      },
    ],
    totalBorderCharges: money(total),
    rounding: "Each displayed amount and the total are rounded to two decimal CNY using half-up rounding after calculation at full precision.",
    exclusions: [
      "No preferential APTA rate is applied.",
      "China inland transport, storage, broker fees, testing, certification and commercial charges are excluded.",
      "The estimate is not a Customs assessment, filing, payment or release decision.",
    ],
  };
}

export function assessIndiaToChinaTradeCase(
  input: IndiaToChinaAssessmentInput,
  options: IndiaToChinaAssessmentOptions = {},
) {
  const sources = options.sources ?? INDIA_TO_CHINA_SOURCES;
  const blockers: string[] = validateIndiaToChinaTranslations(sources);
  const tariffAmbiguity = input.chinaTariffResult.translation.materialAmbiguity;
  if (tariffAmbiguity) blockers.push(`The exact China tariff result has material translation ambiguity: ${tariffAmbiguity}`);
  if (!nonBlank(input.chinaTariffResult.authoritativeText)) blockers.push("The exact China tariff result does not preserve Chinese Authoritative Text.");
  if (!nonBlank(input.chinaTariffResult.translation.text)) blockers.push("The exact China tariff result has no labelled English translation.");

  const materialFacts: Array<[string, unknown]> = [
    ["product model", input.productFacts.modelIdentity],
    ["manufacturer", input.productFacts.manufacturerIdentity],
    ["product description", input.productFacts.productDescription],
    ["technical specifications", input.productFacts.technicalSpecifications],
    ["Indian tariff code", input.productFacts.indiaTariffCode],
    ["China tariff code", input.productFacts.chinaTariffCode],
    ["India exporter", input.parties.exporterIdentity],
    ["India producer", input.parties.producerIdentity],
    ["China importer", input.parties.importerIdentity],
    ["end user", input.parties.endUserIdentity],
    ["manufacturing site", input.manufacturing.site],
    ["origin basis", input.manufacturing.originBasis],
    ["intended use", input.intendedUse],
    ["end use", input.endUse],
    ["India export port", input.route.exportPort],
    ["China import port", input.route.importPort],
    ["China destination province", input.route.destinationProvince],
    ["assessment date", input.assessmentDate],
  ];
  blockers.push(...materialFacts.filter(([, value]) => !nonBlank(value)).map(([name]) => `Missing material Trade Case fact: ${name}.`));
  if (input.tradeDirection !== "india_to_china") blockers.push("The Trade Case direction does not match India-to-China scope.");
  if (input.manufacturing.countryCode !== "IN") blockers.push("The manufacturing country does not match the India-origin reference scope.");
  if (!/^\d{8}$/.test(input.productFacts.indiaTariffCode)) blockers.push("The Indian ITC(HS) code must be an exact eight-digit confirmed code.");
  if (!/^\d{10}$/.test(input.productFacts.chinaTariffCode)) blockers.push("The China commodity code must be an exact ten-digit confirmed code.");
  if (!input.confirmations.productAndTransactionFactsConfirmed) blockers.push("The product and transaction facts have not been confirmed.");
  if (!input.confirmations.evidencePossessionConfirmed) blockers.push("Possession of the case evidence has not been confirmed.");
  if (!input.confirmations.indiaScreeningConfirmed) blockers.push("The case-specific India export screens have not been confirmed.");
  if (!input.confirmations.chinaScreeningConfirmed) blockers.push("The case-specific China import and market-access screens have not been confirmed.");
  if (!input.confirmations.translationReviewConfirmed) blockers.push("The Chinese Authoritative Text and labelled English translation review has not been confirmed.");
  if (input.preferentialTariffClaim !== "none") blockers.push("APTA preference is not within verified scope until the exact concession row, origin rule, certificate and direct-transport evidence are admitted.");

  for (const evidenceId of [
    "india_exporter_iec",
    "india_shipping_bill_pack",
    "india_schedule_ii_screening",
    "india_scomet_screening",
    "china_customs_declaration_pack",
    "china_import_licence_screening",
    "china_tariff_classification_result",
    "china_product_market_access_screening",
    "china_party_end_use_screening",
    "china_trade_remedy_screening",
  ]) {
    const evidenceState = input.evidence[evidenceId] ?? "unknown";
    if (evidenceState !== "present") blockers.push(`Case evidence ${evidenceId} is ${evidenceState}.`);
  }

  const checklist = INDIA_TO_CHINA_COVERAGE_MANIFEST.map((entry) => {
    const sourceBlocker = entry.sourceIds
      .map((id) => sourceById(sources, id))
      .map((source) => ({ source, state: indiaToChinaSourceState(source, input.assessmentDate, options.evidenceStates) }))
      .find(({ state }) => state !== "admitted");
    const connectorIds = entry.connectorIds ?? [entry.connectorId];
    const connectorBlocker = connectorIds
      .map((connectorId) => ({
        connectorId,
        state: input.connectorStates[connectorId] ?? "unsupported",
      }))
      .find(({ state }) => state !== "available");
    const evidenceState = input.evidence[entry.requiredEvidenceId] ?? "unknown";
    let blocker: string | undefined;
    if (sourceBlocker) blocker = `Source ${sourceBlocker.source.id} is ${sourceBlocker.state.replaceAll("_", " ")}.`;
    else if (connectorBlocker) blocker = `The ${connectorBlocker.connectorId} connector is ${connectorBlocker.state.replaceAll("_", " ")}.`;
    else if (evidenceState !== "present") blocker = `Case evidence ${entry.requiredEvidenceId} is ${evidenceState}.`;
    if (blocker) blockers.push(blocker);
    return { ...entry, coverage: blocker ? "incomplete" as const : "complete" as const, ...(blocker ? { blocker } : {}) };
  });

  const allowedScreening: Array<[string, string, string[]]> = [
    ["India Schedule II export policy", input.screening.indiaExportPolicy, ["confirmed_free", "authorisation_required_and_valid"]],
    ["India SCOMET technical and end-use", input.screening.indiaScomet, ["confirmed_no_match_with_parameters", "licence_required_and_valid"]],
    ["China import-licence catalogue", input.screening.chinaImportLicence, ["confirmed_no_match", "licence_required_and_valid"]],
    ["China CCC scope and certificate", input.screening.chinaCcc, ["confirmed_not_applicable", "certificate_required_and_valid"]],
    ["China telecom network access", input.screening.chinaNetworkAccess, ["confirmed_not_applicable", "permit_required_and_valid"]],
    ["China radio type approval", input.screening.chinaRadioTypeApproval, ["confirmed_not_applicable", "approval_required_and_valid"]],
    ["restricted parties", input.screening.restrictedParty, ["confirmed_no_match"]],
    ["trade remedies", input.screening.tradeRemedy, ["confirmed_no_match"]],
    ["consumption tax", input.screening.consumptionTax, ["confirmed_not_applicable"]],
  ];
  blockers.push(...allowedScreening.filter(([, state, allowed]) => !allowed.includes(state)).map(([name]) => `The ${name} screening is unresolved or adverse.`));
  if (input.screening.indiaExportPolicy === "prohibited") blockers.push("The confirmed India export-policy result is prohibited; this assessment cannot complete.");

  const calculation = calculateChinaBorderCharges(input, blockers);
  const claims: BilateralClaimBlock[] = checklist
    .map((entry) => {
      const source = sourceById(sources, entry.claimSourceId);
      const appliesIn = entry.domainId.startsWith("india-") ? "India" as const : "China" as const;
      const tariffLocator = entry.domainId === "china-tariff-and-origin" || entry.domainId === "china-import-vat"
        ? `; case result: ${input.chinaTariffResult.exactLocator}`
        : "";
      return {
        claimId: `india-to-china-domain-${entry.domainId}`,
        text: entry.whyApplicable,
        label: source.title,
        sourceVersionId: source.id,
        locator: `${source.locator}${tariffLocator}`,
        url: source.url,
        appliesIn,
        ...(source.authoritativeText.language === "zh-CN" ? {
          authoritativeLanguage: "zh-CN" as const,
          translationKind: source.translation!.kind,
        } : {}),
        tradeDirection: "india_to_china" as const,
      };
    });

  const indiaBlockers = blockers.filter((blocker) => /India|DGFT|SCOMET|india-|exporter|shipping/i.test(blocker));
  const chinaBlockers = blockers.filter((blocker) => !indiaBlockers.includes(blocker));
  const indiaState: AssessmentState = indiaBlockers.length === 0 ? "Assessment Complete Within Verified Scope" : "Assessment Incomplete";
  const chinaState: AssessmentState = chinaBlockers.length === 0 ? "Assessment Complete Within Verified Scope" : "Assessment Incomplete";
  const state: AssessmentState = blockers.length === 0 && calculation.status === "available"
    ? "Assessment Complete Within Verified Scope"
    : "Assessment Incomplete";

  const loginGaps = [
    input.connectorStates["india-icegate"] === "login_required"
      ? "ICEGATE export filing/status — login required; no shipping-bill filing, acceptance or export status checked"
      : "ICEGATE export filing/status — not checked",
    input.connectorStates["china-single-window"] === "login_required"
      ? "China Single Window import transaction/status — login required; no declaration, payment or release status checked"
      : "China Single Window import transaction/status — not checked",
    input.connectorStates["china-product-market-portals"] === "login_required"
      ? "CNCA/MIIT case registry status — login or exact-model authority result required; uploads do not authenticate registry status"
      : "CNCA/MIIT case registry status — not checked",
  ];
  const sourceLanguageEvidence = sources
    .filter((source) => source.authoritativeText.language === "zh-CN")
    .map((source) => ({
      sourceVersionId: source.id,
      label: source.title,
      url: source.url,
      locator: source.locator,
      authoritativeTextKind: source.authoritativeText.kind,
      authoritativeLanguage: "zh-CN" as const,
      translationKind: source.translation!.kind,
      materialAmbiguity: source.translation!.materialAmbiguity,
    }));

  const snapshotBody = {
    version: "bwmi-21-india-to-china-assessment-v1",
    executionProvenance: {
      mode: "deterministic_domain_tools",
      modelVersion: "not_used",
      promptVersion: "not_used",
      toolVersions: {
        assess_india_export: "bwmi-21-v1",
        assess_china_import: "bwmi-21-v1",
        calculate_china_border_charges: "bwmi-21-v1",
        validate_china_translation: "bwmi-21-v1",
      },
    },
    state,
    tradeDirection: input.tradeDirection,
    assessmentDate: input.assessmentDate,
    caseFacts: structuredClone(input),
    checklist,
    indiaExport: { state: indiaState, blockers: indiaBlockers },
    chinaImport: { state: chinaState, blockers: chinaBlockers, sourceLanguageEvidence },
    classification: blockers.some((blocker) => /tariff code|classification|tariff result|Schedule II/i.test(blocker))
      ? {
          status: "classification_candidates" as const,
          missingFacts: [...new Set(blockers.filter((blocker) => /tariff code|classification|tariff result|Schedule II/i.test(blocker)))],
          candidates: [{ hsCode: input.productFacts.chinaTariffCode || "unresolved", nomenclature: "Network data transmission apparatus candidate", reason: "Authority row confirmation is required." }],
        }
      : {
          status: "working_classification" as const,
          hsCode: input.productFacts.chinaTariffCode,
          nomenclature: "Confirmed China tariff-row description for the exact router case",
          reasoning: [
            `India export code ${input.productFacts.indiaTariffCode} and China import code ${input.productFacts.chinaTariffCode} are preserved as separate case facts.`,
            `The exact China authority-result locator is ${input.chinaTariffResult.exactLocator}.`,
          ],
          excludedAlternatives: [],
        },
    calculation,
    claims,
    blockers: [...new Set(blockers)],
    actionItems: [...new Set(blockers)],
    checked: checklist.filter((entry) => entry.coverage === "complete").map((entry) => ({
      "india-exporter-and-customs": "India exporter and Customs declaration",
      "india-export-policy": "India Schedule II export policy",
      "india-scomet-export-control": "India SCOMET technical and end-use screen",
      "china-customs-import-declaration": "China Customs import declaration",
      "china-import-licence": "China import-licence catalogue",
      "china-tariff-and-origin": "China tariff classification and border-charge formula",
      "china-import-vat": "China import VAT formula",
      "china-product-market-access": "China CCC, network-access and radio type-approval triggers",
      "china-case-party-and-trade-remedy": "China case parties and trade-remedy screen",
    })[entry.domainId]!),
    notChecked: [...new Set([
      ...loginGaps,
      ...checklist.flatMap((entry) => entry.coverage === "incomplete" && entry.blocker ? [entry.blocker] : []),
    ])],
    exclusions: [
      "No UAE or United States connector, source, assessment or positive coverage is in this release.",
      "No filing, licence issuance, certificate validity, payment, authority acceptance or Customs release status is inferred from an upload.",
      "APTA preference is excluded unless its exact concession, origin rule, certificate and direct-transport evidence are separately admitted.",
    ],
    nextPreparationSteps: [
      "Retain the exact India Schedule II and SCOMET screens with the product parameters, parties, end user and end use.",
      "Retain the exact China tariff row, import-licence screen, CCC/MIIT trigger results, rates and dated party/trade-remedy results.",
      "Use ICEGATE, China Single Window and the relevant product-market portals for transactions; this assessment does not establish portal status.",
    ],
  };
  const createdAt = new Date().toISOString();
  const snapshotId = `assessment-${createHash("sha256").update(JSON.stringify({ ...snapshotBody, createdAt })).digest("hex").slice(0, 24)}`;
  return { ...snapshotBody, createdAt, snapshotId };
}

export type IndiaToChinaAssessment = ReturnType<typeof assessIndiaToChinaTradeCase>;
