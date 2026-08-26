import { createHash } from "node:crypto";

import type { ProductPack } from "@/knowledge";
import {
  assessTradeCase,
  type AssessmentState,
  type ConnectorState,
  type EvidenceState,
  type IndiaImportAssessmentInput,
} from "@/server/assessment/india-import-assessment";
import {
  CHINA_EXPORT_COVERAGE_MANIFEST,
  CHINA_EXPORT_SOURCES,
  chinaSourceState,
  connectorBlocksCompletion,
  validateChinaSourceTranslations,
  type ChinaExportSource,
} from "@/server/assessment/china-export-evidence";

type EvidencePresence = "present" | "absent" | "unknown";
type ScreeningState = "confirmed_no_match" | "confirmed_no_match_with_parameters" | "confirmed_no_concern" | "confirmed_not_listed" | "unknown";

export interface ChinaToIndiaAssessmentInput extends IndiaImportAssessmentInput {
  chinaScreening: {
    catchAll: ScreeningState;
    dualUseList: ScreeningState;
    ordinaryExportLicence: ScreeningState;
    restrictedParty: ScreeningState;
    statutoryInspection: ScreeningState;
  };
  confirmations: IndiaImportAssessmentInput["confirmations"] & {
    chinaScreeningConfirmed: boolean;
    translationReviewConfirmed: boolean;
  };
  connectorStates: Record<string, ConnectorState>;
  endUse: string;
  evidence: Record<string, EvidencePresence>;
  manufacturing: {
    countryCode: "CN";
    originBasis: string;
    site: string;
  };
  parties: IndiaImportAssessmentInput["parties"] & {
    endUserIdentity: string;
  };
  route: {
    exportPort: string;
    importPort: string;
    transitCountries: string[];
  };
}

export interface ChinaClaimBlock {
  appliesIn: "China";
  authoritativeLanguage: "zh-CN";
  claimId: string;
  label: string;
  locator: string;
  sourceVersionId: string;
  text: string;
  tradeDirection: "china_to_india";
  translationKind: "Official Translation" | "Derived Translation";
  url: string;
}

export interface ChinaToIndiaAssessmentOptions {
  chinaEvidenceStates?: Partial<Record<string, EvidenceState>>;
  chinaSources?: ChinaExportSource[];
  indiaConnectorStates?: Partial<Record<string, ConnectorState>>;
  indiaEvidenceStates?: Partial<Record<string, EvidenceState>>;
}

function sourceById(sources: ChinaExportSource[], id: string) {
  const source = sources.find((candidate) => candidate.id === id);
  if (!source) throw new Error(`China claim references unknown source ${id}.`);
  return source;
}

function nonBlank(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function assessChinaToIndiaTradeCase(
  pack: ProductPack,
  input: ChinaToIndiaAssessmentInput,
  options: ChinaToIndiaAssessmentOptions = {},
) {
  const sources = options.chinaSources ?? CHINA_EXPORT_SOURCES;
  const blockers: string[] = [];
  const translationBlockers = validateChinaSourceTranslations(sources);
  blockers.push(...translationBlockers);

  const materialFacts: Array<[string, unknown]> = [
    ["China exporter", input.parties.exporterIdentity],
    ["China producer", input.parties.producerIdentity],
    ["end user", input.parties.endUserIdentity],
    ["manufacturing site", input.manufacturing.site],
    ["origin basis", input.manufacturing.originBasis],
    ["product model", input.productFacts.modelIdentity],
    ["China tariff code", input.productFacts.chinaTariffCode],
    ["end use", input.endUse],
    ["China export port", input.route.exportPort],
    ["India import port", input.route.importPort],
  ];
  blockers.push(...materialFacts.filter(([, value]) => !nonBlank(value)).map(([name]) => `Missing material Trade Case fact: ${name}.`));
  if (input.manufacturing.countryCode !== "CN") blockers.push("The manufacturing country does not match the China-origin scope.");
  if (!input.confirmations.chinaScreeningConfirmed) blockers.push("The case-specific China screening has not been confirmed.");
  if (!input.confirmations.translationReviewConfirmed) blockers.push("The Chinese text and labelled English translation review has not been confirmed.");

  const publicConnectorIds = new Set(CHINA_EXPORT_COVERAGE_MANIFEST.map((entry) => entry.connectorId));
  for (const connectorId of publicConnectorIds) {
    const state = input.connectorStates[connectorId] ?? "unsupported";
    if (connectorBlocksCompletion(state)) blockers.push(`The ${connectorId} connector is ${state.replaceAll("_", " ")}.`);
  }

  const checklist = CHINA_EXPORT_COVERAGE_MANIFEST.map((entry) => {
    const sourceBlocker = entry.sourceIds
      .map((id) => sourceById(sources, id))
      .map((source) => ({ source, state: chinaSourceState(source, input.assessmentDate, options.chinaEvidenceStates) }))
      .find(({ state }) => state !== "admitted");
    const evidenceState = input.evidence[entry.requiredEvidenceId] ?? "unknown";
    const connectorState = input.connectorStates[entry.connectorId] ?? "unsupported";
    let blocker: string | undefined;
    if (entry.coverageState !== "full_support") blocker = entry.limitation ?? `The ${entry.domainId} domain is not fully supported.`;
    else if (sourceBlocker) blocker = `China source ${sourceBlocker.source.id} is ${sourceBlocker.state.replaceAll("_", " ")}.`;
    else if (connectorState !== "available") blocker = `The ${entry.connectorId} connector is ${connectorState.replaceAll("_", " ")}.`;
    else if (evidenceState !== "present") blocker = `Case evidence ${entry.requiredEvidenceId} is ${evidenceState}.`;
    if (blocker) blockers.push(blocker);
    return { ...entry, coverage: blocker ? "incomplete" as const : "complete" as const, ...(blocker ? { blocker } : {}) };
  });

  const requiredScreening: Array<[string, ScreeningState, ScreeningState[]]> = [
    ["ordinary export-licence catalogue", input.chinaScreening.ordinaryExportLicence, ["confirmed_no_match"]],
    ["dual-use list and technical parameters", input.chinaScreening.dualUseList, ["confirmed_no_match_with_parameters"]],
    ["catch-all and end-use", input.chinaScreening.catchAll, ["confirmed_no_concern"]],
    ["statutory inspection catalogue", input.chinaScreening.statutoryInspection, ["confirmed_not_listed"]],
    ["restricted parties", input.chinaScreening.restrictedParty, ["confirmed_no_match"]],
  ];
  if (input.evidence.china_catch_all_end_use_screening !== "present") {
    blockers.push(`Case evidence china_catch_all_end_use_screening is ${input.evidence.china_catch_all_end_use_screening ?? "unknown"}.`);
  }
  blockers.push(...requiredScreening.filter(([, state, allowed]) => !allowed.includes(state)).map(([name]) => `The ${name} screening is unresolved.`));

  if (input.productFacts.chinaTariffCode !== "8517623690") {
    blockers.push("The China commodity code is outside the exact 8517623690 catalogue screening preserved for this reference product.");
  }

  const encryptedVpnThroughput = input.productFacts.encryptedVpnThroughputGbps;
  if (typeof encryptedVpnThroughput !== "number") blockers.push("The encrypted VPN throughput needed for the 5A002 threshold match is missing.");
  else if (encryptedVpnThroughput >= 10) blockers.push("The confirmed encrypted VPN throughput reaches the reviewed 5A002 threshold; a licence determination is required.");
  if (input.productFacts.isCryptanalysisEquipment !== false) blockers.push("Cryptanalysis-equipment scope is not excluded by confirmed facts.");
  if (input.productFacts.isSpeciallyDesignedForControlledItem !== false) blockers.push("Specially-designed controlled-item scope is not excluded by confirmed facts.");

  const claims: ChinaClaimBlock[] = checklist
    .filter((entry) => entry.coverage === "complete")
    .map((entry) => {
      const source = sourceById(sources, entry.claimSourceId);
      return {
        claimId: `china-domain-${entry.domainId}`,
        text: entry.whyApplicable,
        label: source.title,
        sourceVersionId: source.id,
        locator: source.locator,
        url: source.url,
        appliesIn: "China" as const,
        authoritativeLanguage: "zh-CN" as const,
        tradeDirection: "china_to_india" as const,
        translationKind: source.translation.kind,
      };
    });

  const chinaState: AssessmentState = blockers.length === 0
    ? "Assessment Complete Within Verified Scope"
    : "Assessment Incomplete";
  const india = assessTradeCase(pack, input, {
    ...(options.indiaConnectorStates ? { connectorStates: options.indiaConnectorStates } : {}),
    ...(options.indiaEvidenceStates ? { evidenceStates: options.indiaEvidenceStates } : {}),
  });
  const state: AssessmentState = chinaState === "Assessment Complete Within Verified Scope" && india.state === "Assessment Complete Within Verified Scope"
    ? "Assessment Complete Within Verified Scope"
    : india.state === "Research Guidance" ? "Research Guidance" : "Assessment Incomplete";
  if (india.state !== "Assessment Complete Within Verified Scope") {
    blockers.push(...india.blockers);
    blockers.push(`India import assessment state is ${india.state}.`);
  }

  const loginGaps = [
    input.connectorStates["china-single-window"] === "login_required"
      ? "China Single Window transaction/status — login required; no filing or release status checked"
      : "China Single Window transaction/status — not checked",
    input.connectorStates["china-dual-use-licensing"] === "login_required"
      ? "MOFCOM dual-use licensing transaction/status — login required; no licence status checked"
      : "MOFCOM dual-use licensing transaction/status — not checked",
  ];

  const snapshotBody = {
    version: "bwmi-20-china-to-india-assessment-v1",
    executionProvenance: {
      mode: "deterministic_domain_tools",
      modelVersion: "not_used",
      promptVersion: "not_used",
      toolVersions: {
        assess_china_export: "bwmi-20-v1",
        assess_trade_case: "bwmi-20-v1",
        calculate_border_charges: "bwmi-18-v1",
        classify_product: "bwmi-18-v1",
        validate_china_translation: "bwmi-20-v1",
      },
    },
    state,
    caseFacts: structuredClone(input),
    checklist: [...checklist, ...india.checklist],
    chinaExport: {
      state: chinaState,
      checklist,
      sourceLanguageEvidence: sources.map((source) => ({
        sourceVersionId: source.id,
        label: source.title,
        url: source.url,
        locator: source.locator,
        authoritativeTextKind: source.authoritativeText.kind,
        authoritativeLanguage: source.authoritativeText.language,
        translationKind: source.translation.kind,
        materialAmbiguity: source.translation.materialAmbiguity ?? null,
      })),
      exportControlFinding: blockers.some((blocker) => /5A002|dual-use|catch-all|Cryptanalysis|controlled-item/.test(blocker))
        ? "Export-control finding withheld because the technical, list, party, end-user or end-use screen is incomplete."
        : "No listed match within the verified technical scope; catch-all review remains case-specific.",
      claims,
      blockers: blockers.filter((blocker) => !blocker.startsWith("India import assessment")),
    },
    classification: india.classification,
    calculation: india.calculation,
    claims: [...claims, ...india.claims],
    blockers,
    actionItems: blockers,
    checked: [
      ...checklist.filter((entry) => entry.coverage === "complete").map((entry) => ({
        "china-foreign-trade": "China foreign-trade authority",
        "china-customs-declaration": "China Customs export declaration",
        "china-ordinary-export-licence": "China ordinary export-licence catalogue screening",
        "china-dual-use-export-control": "China dual-use list, technical thresholds and catch-all screening",
        "china-export-commodity-inspection": "China statutory export-inspection screening",
        "china-case-party-screening": "China case-specific restricted-party screening",
      })[entry.domainId]!),
      ...india.checked,
    ],
    notChecked: [
      ...loginGaps,
      ...checklist.flatMap((entry) => entry.coverage === "incomplete" && entry.blocker ? [entry.blocker] : []),
      ...india.notChecked.filter((entry) => !entry.includes("China export-side controls")),
    ],
    exclusions: india.exclusions,
    nextPreparationSteps: [
      "Retain the exact Chinese commodity-code catalogue screens, product technical dossier, end-user/end-use statement and restricted-party result.",
      "Retain the China export declaration documents and the India import evidence identified in the combined checklist.",
      "Use the authenticated portals for any filing or licence transaction; this assessment does not establish portal status.",
      ...india.nextPreparationSteps.filter((entry) => !entry.includes("China export-side")),
    ],
  };
  const createdAt = new Date().toISOString();
  const snapshotId = `assessment-${createHash("sha256").update(JSON.stringify({ ...snapshotBody, createdAt })).digest("hex").slice(0, 24)}`;
  return { ...snapshotBody, createdAt, snapshotId };
}

export type ChinaToIndiaAssessment = ReturnType<typeof assessChinaToIndiaTradeCase>;
