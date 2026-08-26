import { randomUUID } from "node:crypto";

import { z } from "zod";

import { loadRouterPack } from "@/knowledge";
import {
  type ConnectorState,
} from "@/server/assessment/india-import-assessment";
import {
  assessChinaToIndiaTradeCase,
  type ChinaToIndiaAssessmentInput,
} from "@/server/assessment/china-to-india-assessment";
import {
  assessIndiaToChinaTradeCase,
  type IndiaToChinaAssessmentInput,
} from "@/server/assessment/india-to-china-assessment";
import {
  REFERENCE_PRODUCT_PROFILE,
  documentMeetsRequiredVisibleFacts,
  evaluatePreparationWorkflow,
  evaluateIndiaToChinaPreparationWorkflow,
  resolveReferenceProductProfileConfirmation,
  type DocumentType,
} from "@/server/assessment/preparation-workflow";
import { bootstrapApplication } from "@/server/bootstrap";
import { getOfficialConnector } from "@/server/evidence/registry";

export const runtime = "nodejs";

const EvidenceSchema = z.enum(["present", "absent", "unknown"]);
const ChinaToIndiaRequestSchema = z.object({
  tradeCaseId: z.string().uuid(),
  tradeDirection: z.literal("china_to_india").optional(),
  assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  modelIdentity: z.string().trim().min(3).max(200),
  manufacturerIdentity: z.string().trim().min(3).max(200),
  adapterModelIdentity: z.string().trim().min(3).max(200),
  importerIdentity: z.string().trim().max(200),
  producerIdentity: z.string().trim().max(200),
  exporterIdentity: z.string().trim().max(200),
  endUserIdentity: z.string().trim().max(200),
  manufacturingSite: z.string().trim().max(300),
  originBasis: z.string().trim().max(500),
  endUse: z.string().trim().max(500),
  exportPort: z.string().trim().max(200),
  importPort: z.string().trim().max(200),
  chinaTariffCode: z.string().regex(/^\d{10}$/),
  wifiThroughputMbps: z.number().positive().max(100000),
  encryptedVpnThroughputGbps: z.number().nonnegative().max(100000),
  isCryptanalysisEquipment: z.boolean().nullable(),
  isSpeciallyDesignedForControlledItem: z.boolean().nullable(),
  itemValue: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  freight: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  insurance: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  hasIntegratedModem: z.boolean().nullable(),
  tradeRemedyCheck: z.enum(["confirmed_no_match", "possible_match", "unknown"]),
  evidence: z.object({
    wpc_eta: EvidenceSchema,
    bis_power_adapter: EvidenceSchema,
    mtcte_wifi_cpe: EvidenceSchema,
    repa_import_for_sale: EvidenceSchema,
    legal_metrology_labels: EvidenceSchema,
    china_exporter_registration: EvidenceSchema,
    china_customs_declaration_pack: EvidenceSchema,
    china_ordinary_export_licence_screening: EvidenceSchema,
    china_dual_use_list_screening: EvidenceSchema,
    china_catch_all_end_use_screening: EvidenceSchema,
    china_statutory_inspection_screening: EvidenceSchema,
  }).strict(),
  chinaScreening: z.object({
    ordinaryExportLicence: z.enum(["confirmed_no_match", "unknown"]),
    dualUseList: z.enum(["confirmed_no_match_with_parameters", "unknown"]),
    catchAll: z.enum(["confirmed_no_concern", "unknown"]),
    statutoryInspection: z.enum(["confirmed_not_listed", "unknown"]),
    restrictedParty: z.enum(["confirmed_no_match", "unknown"]),
  }).strict(),
  confirmations: z.object({
    productProfileConfirmed: z.boolean(),
    productAndTransactionFactsConfirmed: z.boolean(),
    evidencePossessionConfirmed: z.boolean(),
    datedTradeRemedyCheckConfirmed: z.boolean(),
    chinaScreeningConfirmed: z.boolean(),
    translationReviewConfirmed: z.boolean(),
  }).strict(),
}).strict();

const IndiaToChinaRequestSchema = z.object({
  tradeCaseId: z.string().uuid(),
  tradeDirection: z.literal("india_to_china"),
  assessmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  modelIdentity: z.string().trim().min(3).max(200),
  manufacturerIdentity: z.string().trim().min(3).max(200),
  productDescription: z.string().trim().min(3).max(500),
  technicalSpecifications: z.string().trim().min(3).max(2_000),
  indiaTariffCode: z.string().regex(/^\d{8}$/),
  chinaTariffCode: z.string().regex(/^\d{10}$/),
  exporterIdentity: z.string().trim().min(3).max(200),
  producerIdentity: z.string().trim().min(3).max(200),
  importerIdentity: z.string().trim().min(3).max(200),
  endUserIdentity: z.string().trim().min(3).max(200),
  manufacturingSite: z.string().trim().min(3).max(300),
  originBasis: z.string().trim().min(3).max(500),
  intendedUse: z.string().trim().min(3).max(500),
  endUse: z.string().trim().min(3).max(500),
  exportPort: z.string().trim().min(2).max(200),
  importPort: z.string().trim().min(2).max(200),
  destinationProvince: z.string().trim().min(2).max(200),
  itemValue: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  freight: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  insurance: z.string().regex(/^\d+(?:\.\d{1,2})?$/),
  basicDutyRatePercent: z.string().regex(/^\d+(?:\.\d{1,6})?$/),
  importVatRatePercent: z.string().regex(/^\d+(?:\.\d{1,6})?$/),
  consumptionTaxRatePercent: z.string().regex(/^\d+(?:\.\d{1,6})?$/),
  tariffEffectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  tariffExactLocator: z.string().trim().min(3).max(500),
  tariffAuthoritativeText: z.string().trim().min(3).max(4_000),
  tariffTranslationText: z.string().trim().min(3).max(4_000),
  tariffTranslationKind: z.enum(["Official Translation", "Derived Translation"]),
  tariffMaterialAmbiguity: z.string().trim().max(1_000).nullable(),
  screening: z.object({
    indiaExportPolicy: z.enum(["confirmed_free", "authorisation_required_and_valid", "prohibited", "unknown"]),
    indiaScomet: z.enum(["confirmed_no_match_with_parameters", "licence_required_and_valid", "unknown"]),
    chinaImportLicence: z.enum(["confirmed_no_match", "licence_required_and_valid", "unknown"]),
    chinaCcc: z.enum(["confirmed_not_applicable", "certificate_required_and_valid", "unknown"]),
    chinaNetworkAccess: z.enum(["confirmed_not_applicable", "permit_required_and_valid", "unknown"]),
    chinaRadioTypeApproval: z.enum(["confirmed_not_applicable", "approval_required_and_valid", "unknown"]),
    restrictedParty: z.enum(["confirmed_no_match", "possible_match", "unknown"]),
    tradeRemedy: z.enum(["confirmed_no_match", "possible_match", "unknown"]),
    consumptionTax: z.enum(["confirmed_not_applicable", "applicable", "unknown"]),
  }).strict(),
  confirmations: z.object({
    productAndTransactionFactsConfirmed: z.boolean(),
    evidencePossessionConfirmed: z.boolean(),
    indiaScreeningConfirmed: z.boolean(),
    chinaScreeningConfirmed: z.boolean(),
    tariffResultConfirmed: z.boolean(),
    translationReviewConfirmed: z.boolean(),
  }).strict(),
}).strict();

const RequestSchema = z.union([IndiaToChinaRequestSchema, ChinaToIndiaRequestSchema]);

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

function configuredWpcState(): ConnectorState {
  const value = process.env.BWMI_WPC_CONNECTOR_STATE;
  if (
    value === "available" ||
    value === "manual" ||
    value === "login_required" ||
    value === "temporarily_unavailable" ||
    value === "unsupported"
  ) return value;
  return "available";
}

function connectorState(id: string): ConnectorState {
  return getOfficialConnector(id)?.state ?? "unsupported";
}

const CHINA_TO_INDIA_EVIDENCE_DOCUMENT_TYPES: Record<string, DocumentType[]> = {
  wpc_eta: ["india_wpc_eta"],
  bis_power_adapter: ["india_bis_adapter"],
  mtcte_wifi_cpe: ["india_mtcte"],
  repa_import_for_sale: ["india_repa"],
  legal_metrology_labels: ["india_retail_labels"],
  china_exporter_registration: ["china_exporter_registration"],
  china_customs_declaration_pack: ["china_customs_declaration", "commercial_invoice", "packing_list", "transport_document"],
  china_ordinary_export_licence_screening: ["china_export_control_screening"],
  china_dual_use_list_screening: ["china_export_control_screening"],
  china_catch_all_end_use_screening: ["china_export_control_screening", "end_user_end_use_statement"],
  china_statutory_inspection_screening: ["china_statutory_inspection_screening"],
};

const INDIA_TO_CHINA_EVIDENCE_DOCUMENT_TYPES: Record<string, DocumentType[]> = {
  india_exporter_iec: ["india_exporter_iec"],
  india_shipping_bill_pack: ["india_shipping_bill", "commercial_invoice", "packing_list", "transport_document"],
  india_schedule_ii_screening: ["india_export_policy_screening"],
  india_scomet_screening: ["india_scomet_screening"],
  china_customs_declaration_pack: ["china_import_declaration", "commercial_invoice", "packing_list", "transport_document"],
  china_import_licence_screening: ["china_import_licence_screening"],
  china_tariff_classification_result: ["china_tariff_classification"],
  china_product_market_access_screening: ["china_product_market_access_screening"],
  china_party_end_use_screening: ["china_party_end_use_screening", "end_user_end_use_statement"],
  china_trade_remedy_screening: ["china_trade_remedy_screening"],
};

export async function POST(request: Request) {
  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Confirmed product, party, evidence and decimal valuation inputs are required." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const application = await bootstrapApplication();
  try {
    application.conversationStore.assertTradeCase(parsed.data.tradeCaseId);
    if (parsed.data.tradeDirection === "india_to_china") {
      const isReferenceRouter = parsed.data.modelIdentity === "Confirmed India-manufactured dual-band Wi-Fi router model"
        && parsed.data.productDescription === "New finished 2.4/5 GHz indoor MIMO Wi-Fi router"
        && parsed.data.technicalSpecifications === "2.4/5 GHz Wi-Fi; routing principal function; no cellular, modem, battery or 6 GHz radio"
        && parsed.data.indiaTariffCode === "85176290"
        && parsed.data.chinaTariffCode === "8517623690";
      if (!isReferenceRouter) {
        return Response.json(
          { error: "This legacy deterministic endpoint is limited to its explicit admitted Wi-Fi-router reference profile. Use /api/chat for arbitrary products." },
          { status: 409, headers: NO_STORE_HEADERS },
        );
      }
      const caseBeforeAssessment = application.conversationStore.getTradeCase(parsed.data.tradeCaseId);
      const evidence = Object.fromEntries(Object.entries(INDIA_TO_CHINA_EVIDENCE_DOCUMENT_TYPES).map(([id, requiredTypes]) => {
        const present = requiredTypes.every((type) => caseBeforeAssessment.documents.some((document) => (
          document.documentType === type &&
          documentMeetsRequiredVisibleFacts(type, document.facts.map((fact) => ({
            field: fact.field,
            reviewStatus: fact.current.reviewStatus,
            value: fact.current.value,
          })), "india_to_china")
        )));
        return [id, present ? "present" as const : "unknown" as const];
      }));
      const completeUploadedEvidence = Object.values(evidence).every((state) => state === "present");
      const input: IndiaToChinaAssessmentInput = {
        assessmentDate: parsed.data.assessmentDate,
        tradeDirection: "india_to_china",
        productFacts: {
          modelIdentity: parsed.data.modelIdentity,
          manufacturerIdentity: parsed.data.manufacturerIdentity,
          productDescription: parsed.data.productDescription,
          technicalSpecifications: parsed.data.technicalSpecifications,
          indiaTariffCode: parsed.data.indiaTariffCode,
          chinaTariffCode: parsed.data.chinaTariffCode,
        },
        parties: {
          exporterIdentity: parsed.data.exporterIdentity,
          producerIdentity: parsed.data.producerIdentity,
          importerIdentity: parsed.data.importerIdentity,
          endUserIdentity: parsed.data.endUserIdentity,
        },
        manufacturing: {
          countryCode: "IN",
          site: parsed.data.manufacturingSite,
          originBasis: parsed.data.originBasis,
        },
        intendedUse: parsed.data.intendedUse,
        endUse: parsed.data.endUse,
        route: {
          exportPort: parsed.data.exportPort,
          importPort: parsed.data.importPort,
          destinationProvince: parsed.data.destinationProvince,
          transitCountries: [],
        },
        evidence,
        screening: parsed.data.screening,
        connectorStates: {
          "india-dgft-publications": connectorState("india-dgft-publications"),
          "india-customs-publications": connectorState("india-customs-publications"),
          "india-icegate": connectorState("india-icegate"),
          "china-gacc-publications": connectorState("china-gacc-publications"),
          "china-mofcom-publications": connectorState("china-mofcom-publications"),
          "china-tariff-tax-publications": connectorState("china-tariff-tax-publications"),
          "china-product-market-publications": connectorState("china-product-market-publications"),
          "china-single-window": connectorState("china-single-window"),
          "china-product-market-portals": connectorState("china-product-market-portals"),
        },
        chinaTariffResult: {
          effectiveFrom: parsed.data.tariffEffectiveFrom,
          exactLocator: parsed.data.tariffExactLocator,
          authoritativeText: parsed.data.tariffAuthoritativeText,
          translation: {
            kind: parsed.data.tariffTranslationKind,
            text: parsed.data.tariffTranslationText,
            materialAmbiguity: parsed.data.tariffMaterialAmbiguity,
          },
          basicDutyRatePercent: parsed.data.basicDutyRatePercent,
          importVatRatePercent: parsed.data.importVatRatePercent,
          consumptionTaxRatePercent: parsed.data.consumptionTaxRatePercent,
        },
        customsValue: {
          currency: "CNY",
          valuationDate: parsed.data.assessmentDate,
          itemValue: parsed.data.itemValue,
          freight: parsed.data.freight,
          insurance: parsed.data.insurance,
        },
        preferentialTariffClaim: "none",
        confirmations: {
          ...parsed.data.confirmations,
          evidencePossessionConfirmed:
            parsed.data.confirmations.evidencePossessionConfirmed && completeUploadedEvidence,
        },
      };
      const regulatoryAssessment = assessIndiaToChinaTradeCase(input);
      for (const [name, value] of [
        ["product_model", parsed.data.modelIdentity],
        ["manufacturer", parsed.data.manufacturerIdentity],
        ["product_description", parsed.data.productDescription],
        ["technical_specifications", parsed.data.technicalSpecifications],
        ["india_tariff_code", parsed.data.indiaTariffCode],
        ["china_tariff_code", parsed.data.chinaTariffCode],
        ["exporter", parsed.data.exporterIdentity],
        ["producer", parsed.data.producerIdentity],
        ["importer", parsed.data.importerIdentity],
        ["end_user", parsed.data.endUserIdentity],
        ["manufacturing_site", parsed.data.manufacturingSite],
        ["origin_basis", parsed.data.originBasis],
        ["intended_use", parsed.data.intendedUse],
        ["end_use", parsed.data.endUse],
        ["export_port", parsed.data.exportPort],
        ["import_port", parsed.data.importPort],
        ["destination_province", parsed.data.destinationProvince],
        ["item_value_cny", parsed.data.itemValue],
        ["freight_cny", parsed.data.freight],
        ["insurance_cny", parsed.data.insurance],
        ["assessment_date", parsed.data.assessmentDate],
        ["origin_country_code", "IN"],
        ["destination_country_code", "CN"],
      ] as const) {
        application.conversationStore.confirmFact(parsed.data.tradeCaseId, name, value);
      }
      const tradeCaseForPreparation = application.conversationStore.getTradeCase(parsed.data.tradeCaseId);
      const preparation = evaluateIndiaToChinaPreparationWorkflow({
        confirmedFacts: tradeCaseForPreparation.confirmedFacts,
        documents: tradeCaseForPreparation.documents.map((document) => ({
          documentType: document.documentType,
          fileName: document.fileName,
          facts: document.facts.map((fact) => ({
            field: fact.field,
            reviewStatus: fact.current.reviewStatus,
            value: fact.current.value,
          })),
        })),
      });
      const assessment = { ...regulatoryAssessment, preparation };
      for (const toolName of [
        "determine_india_export_authorities",
        "determine_china_import_authorities",
        "screen_india_export_controls",
        "screen_china_import_and_product_market_controls",
        "validate_china_translation",
        "classify_china_import_product",
        "calculate_china_border_charges",
        "assess_india_to_china_trade_case",
        "evaluate_document_package",
      ]) {
        application.conversationStore.addToolReference(parsed.data.tradeCaseId, toolName, randomUUID());
      }
      for (const claim of assessment.claims) {
        application.conversationStore.addSourceReference(parsed.data.tradeCaseId, claim.sourceVersionId, claim.locator);
      }
      application.conversationStore.saveAssessmentSnapshot(parsed.data.tradeCaseId, assessment);
      return Response.json(
        { assessment, tradeCase: application.conversationStore.getTradeCase(parsed.data.tradeCaseId) },
        { headers: NO_STORE_HEADERS },
      );
    }
    const caseBeforeAssessment = application.conversationStore.getTradeCase(parsed.data.tradeCaseId);
    const profileResolution = parsed.data.confirmations.productProfileConfirmed
      ? resolveReferenceProductProfileConfirmation(
          parsed.data.modelIdentity,
          `${parsed.data.assessmentDate}T00:00:00.000Z`,
        )
      : null;
    if (profileResolution?.status !== "confirmed") {
      return Response.json(
        { error: "This legacy deterministic endpoint is limited to the exact admitted Archer AX12 (IN) 1.8 reference profile. Use /api/chat for arbitrary products." },
        { status: 409, headers: NO_STORE_HEADERS },
      );
    }
    const pack = await loadRouterPack();
    const evidence = Object.fromEntries(Object.entries(CHINA_TO_INDIA_EVIDENCE_DOCUMENT_TYPES).map(([id, requiredTypes]) => {
      const present = requiredTypes.every((type) => caseBeforeAssessment.documents.some((document) => (
        document.documentType === type &&
        documentMeetsRequiredVisibleFacts(type, document.facts.map((fact) => ({
          field: fact.field,
          reviewStatus: fact.current.reviewStatus,
          value: fact.current.value,
        })))
      )));
      return [id, present ? "present" as const : "unknown" as const];
    }));
    const completeUploadedEvidence = Object.values(evidence).every((state) => state === "present");
    const productFacts: Record<string, unknown> = {
      ...(profileResolution?.status === "confirmed" ? pack.scenario.includedFacts : {}),
      modelIdentity: parsed.data.modelIdentity,
      manufacturerIdentity: parsed.data.manufacturerIdentity,
      adapterModelIdentity: parsed.data.adapterModelIdentity,
      chinaTariffCode: parsed.data.chinaTariffCode,
      wifiThroughputMbps: parsed.data.wifiThroughputMbps,
      encryptedVpnThroughputGbps: parsed.data.encryptedVpnThroughputGbps,
      isCryptanalysisEquipment: parsed.data.isCryptanalysisEquipment,
      isSpeciallyDesignedForControlledItem: parsed.data.isSpeciallyDesignedForControlledItem,
    };
    if (parsed.data.hasIntegratedModem === null) delete productFacts.hasIntegratedModem;
    else productFacts.hasIntegratedModem = parsed.data.hasIntegratedModem;

    const input: ChinaToIndiaAssessmentInput = {
      assessmentDate: parsed.data.assessmentDate,
      tradeDirection: "china_to_india",
      originCountryCode: "CN",
      destinationCountryCode: "IN",
      productFacts,
      parties: {
        importerIdentity: parsed.data.importerIdentity,
        producerIdentity: parsed.data.producerIdentity,
        exporterIdentity: parsed.data.exporterIdentity,
        endUserIdentity: parsed.data.endUserIdentity,
      },
      manufacturing: {
        countryCode: "CN",
        site: parsed.data.manufacturingSite,
        originBasis: parsed.data.originBasis,
      },
      endUse: parsed.data.endUse,
      route: {
        exportPort: parsed.data.exportPort,
        importPort: parsed.data.importPort,
        transitCountries: [],
      },
      evidence,
      chinaScreening: parsed.data.chinaScreening,
      connectorStates: {
        "china-mofcom-publications": connectorState("china-mofcom-publications"),
        "china-gacc-publications": connectorState("china-gacc-publications"),
        "china-export-control-publications": connectorState("china-export-control-publications"),
        "china-single-window": connectorState("china-single-window"),
        "china-dual-use-licensing": connectorState("china-dual-use-licensing"),
        "china-structured-records": connectorState("china-structured-records"),
      },
      tradeRemedyCheck: parsed.data.tradeRemedyCheck,
      customsValue: {
        currency: "INR",
        valuationDate: parsed.data.assessmentDate,
        itemValue: parsed.data.itemValue,
        freight: parsed.data.freight,
        insurance: parsed.data.insurance,
      },
      preferentialTariffClaim: "none",
      confirmations: {
        ...parsed.data.confirmations,
        evidencePossessionConfirmed:
          parsed.data.confirmations.evidencePossessionConfirmed && completeUploadedEvidence,
      },
    };
    const regulatoryAssessment = assessChinaToIndiaTradeCase(pack, input, {
      indiaConnectorStates: { "india-wpc": configuredWpcState() },
    });

    for (const [name, value] of [
      ["product_model", parsed.data.modelIdentity],
      ["manufacturer", parsed.data.manufacturerIdentity],
      ["adapter_model", parsed.data.adapterModelIdentity],
      ["importer", parsed.data.importerIdentity],
      ["producer", parsed.data.producerIdentity],
      ["exporter", parsed.data.exporterIdentity],
      ["end_user", parsed.data.endUserIdentity],
      ["manufacturing_site", parsed.data.manufacturingSite],
      ["origin_basis", parsed.data.originBasis],
      ["end_use", parsed.data.endUse],
      ["export_port", parsed.data.exportPort],
      ["import_port", parsed.data.importPort],
      ["china_tariff_code", parsed.data.chinaTariffCode],
      ["wifi_throughput_mbps", String(parsed.data.wifiThroughputMbps)],
      ["encrypted_vpn_throughput_gbps", String(parsed.data.encryptedVpnThroughputGbps)],
      ["item_value_inr", parsed.data.itemValue],
      ["freight_inr", parsed.data.freight],
      ["insurance_inr", parsed.data.insurance],
      ["assessment_date", parsed.data.assessmentDate],
      ["origin_country_code", "CN"],
      ["destination_country_code", "IN"],
    ] as const) {
      if (value.trim()) application.conversationStore.confirmFact(parsed.data.tradeCaseId, name, value);
    }
    if (profileResolution?.status === "confirmed") {
      application.conversationStore.confirmFact(
        parsed.data.tradeCaseId,
        "product_profile_id",
        profileResolution.confirmation.profileId,
      );
      application.conversationStore.confirmFact(
        parsed.data.tradeCaseId,
        "product_profile_confirmed_at",
        profileResolution.confirmation.confirmedAt,
      );
      application.conversationStore.addSourceReference(
        parsed.data.tradeCaseId,
        REFERENCE_PRODUCT_PROFILE.profileId,
        REFERENCE_PRODUCT_PROFILE.source.title,
      );
    }
    const tradeCaseForPreparation = application.conversationStore.getTradeCase(parsed.data.tradeCaseId);
    const preparation = evaluatePreparationWorkflow({
      confirmedFacts: tradeCaseForPreparation.confirmedFacts,
      documents: tradeCaseForPreparation.documents.map((document) => ({
        documentType: document.documentType,
        fileName: document.fileName,
        facts: document.facts.map((fact) => ({
          field: fact.field,
          reviewStatus: fact.current.reviewStatus,
          value: fact.current.value,
        })),
      })),
      productProfileConfirmation: profileResolution?.status === "confirmed"
        ? profileResolution.confirmation
        : null,
    });
    const assessment = { ...regulatoryAssessment, preparation };
    for (const toolName of [
      "determine_applicable_authorities",
      "determine_china_export_authorities",
      "classify_product",
      "screen_china_export_controls",
      "validate_china_translation",
      "calculate_border_charges",
      "assess_trade_case",
      "discover_official_product_profile",
      "evaluate_document_package",
    ]) {
      application.conversationStore.addToolReference(parsed.data.tradeCaseId, toolName, randomUUID());
    }
    for (const claim of assessment.claims) {
      application.conversationStore.addSourceReference(
        parsed.data.tradeCaseId,
        claim.sourceVersionId,
        claim.locator,
      );
    }
    application.conversationStore.saveAssessmentSnapshot(parsed.data.tradeCaseId, assessment);
    return Response.json(
      {
        assessment,
        tradeCase: application.conversationStore.getTradeCase(parsed.data.tradeCaseId),
      },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "The assessment could not be completed." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}
