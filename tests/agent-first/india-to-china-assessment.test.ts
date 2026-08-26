import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  assessIndiaToChinaTradeCase,
  type IndiaToChinaAssessmentInput,
} from "@/server/assessment/india-to-china-assessment";
import {
  INDIA_TO_CHINA_COVERAGE_MANIFEST,
  INDIA_TO_CHINA_SOURCES,
  validateIndiaToChinaTranslations,
} from "@/server/assessment/india-to-china-evidence";
import { OFFICIAL_CONNECTORS } from "@/server/evidence/registry";

const AS_OF = "2026-08-25";

function completeInput(): IndiaToChinaAssessmentInput {
  return {
    assessmentDate: AS_OF,
    tradeDirection: "india_to_china",
    productFacts: {
      modelIdentity: "Confirmed India-manufactured dual-band Wi-Fi router model",
      manufacturerIdentity: "Confirmed Indian manufacturer legal entity",
      productDescription: "New finished 2.4/5 GHz indoor MIMO Wi-Fi router",
      technicalSpecifications: "2.4/5 GHz Wi-Fi; routing principal function; no cellular, modem, battery or 6 GHz radio",
      indiaTariffCode: "85176290",
      chinaTariffCode: "8517623690",
    },
    parties: {
      exporterIdentity: "Confirmed Indian exporter legal entity",
      producerIdentity: "Confirmed Indian producer legal entity",
      importerIdentity: "Confirmed China importer legal entity",
      endUserIdentity: "Confirmed China commercial end user",
    },
    manufacturing: {
      countryCode: "IN",
      site: "Confirmed manufacturing site in India",
      originBasis: "Confirmed India manufacturing records and non-preferential origin basis",
    },
    intendedUse: "Indoor civilian broadband routing for commercial distribution in China",
    endUse: "Indoor civilian broadband routing",
    route: {
      exportPort: "Nhava Sheva, India",
      importPort: "Shanghai, China",
      destinationProvince: "Shanghai",
      transitCountries: [],
    },
    evidence: {
      india_exporter_iec: "present",
      india_shipping_bill_pack: "present",
      india_schedule_ii_screening: "present",
      india_scomet_screening: "present",
      china_customs_declaration_pack: "present",
      china_import_licence_screening: "present",
      china_tariff_classification_result: "present",
      china_product_market_access_screening: "present",
      china_party_end_use_screening: "present",
      china_trade_remedy_screening: "present",
    },
    screening: {
      indiaExportPolicy: "confirmed_free",
      indiaScomet: "confirmed_no_match_with_parameters",
      chinaImportLicence: "confirmed_no_match",
      chinaCcc: "confirmed_not_applicable",
      chinaNetworkAccess: "permit_required_and_valid",
      chinaRadioTypeApproval: "approval_required_and_valid",
      restrictedParty: "confirmed_no_match",
      tradeRemedy: "confirmed_no_match",
      consumptionTax: "confirmed_not_applicable",
    },
    connectorStates: {
      "india-dgft-publications": "available",
      "india-customs-publications": "available",
      "china-gacc-publications": "available",
      "china-mofcom-publications": "available",
      "china-tariff-tax-publications": "available",
      "china-product-market-publications": "available",
      "india-icegate": "login_required",
      "china-single-window": "login_required",
      "china-product-market-portals": "login_required",
    },
    chinaTariffResult: {
      effectiveFrom: "2026-01-01",
      exactLocator: "2026 tariff row 8517623690, confirmed authority result",
      authoritativeText: "税则号列8517623690及该案适用税率经海关税则查询结果确认。",
      translation: {
        kind: "Derived Translation",
        text: "The Customs tariff result confirms heading 8517623690 and the case-applicable rate.",
        materialAmbiguity: null,
      },
      basicDutyRatePercent: "10",
      importVatRatePercent: "13",
      consumptionTaxRatePercent: "0",
    },
    customsValue: {
      currency: "CNY",
      valuationDate: AS_OF,
      itemValue: "99999.98",
      freight: "0.01",
      insurance: "0.01",
    },
    preferentialTariffClaim: "none",
    confirmations: {
      productAndTransactionFactsConfirmed: true,
      evidencePossessionConfirmed: true,
      indiaScreeningConfirmed: true,
      chinaScreeningConfirmed: true,
      tariffResultConfirmed: true,
      translationReviewConfirmed: true,
    },
  };
}

describe("BWMI-21 India-to-China evidence and assessment", () => {
  it("registers the bilateral public and protected connectors without UAE or US scope", () => {
    expect(OFFICIAL_CONNECTORS.map((connector) => connector.id)).toEqual(expect.arrayContaining([
      "india-dgft-publications",
      "india-customs-publications",
      "india-icegate",
      "china-tariff-tax-publications",
      "china-product-market-publications",
      "china-product-market-portals",
    ]));
    expect(JSON.stringify(OFFICIAL_CONNECTORS)).not.toMatch(/UAE|United Arab Emirates|United States|\bUS\b/i);
  });

  it("covers DGFT, India Customs, GACC, tariff, foreign-trade and product-market domains", () => {
    expect(INDIA_TO_CHINA_COVERAGE_MANIFEST.map((entry) => entry.domainId)).toEqual([
      "india-exporter-and-customs",
      "india-export-policy",
      "india-scomet-export-control",
      "china-customs-import-declaration",
      "china-import-licence",
      "china-tariff-and-origin",
      "china-import-vat",
      "china-product-market-access",
      "china-case-party-and-trade-remedy",
    ]);
    expect(INDIA_TO_CHINA_COVERAGE_MANIFEST.every((entry) => entry.sourceIds.length > 0)).toBe(true);
    expect(INDIA_TO_CHINA_COVERAGE_MANIFEST.find((entry) => entry.domainId === "india-exporter-and-customs")?.connectorIds).toEqual([
      "india-dgft-publications",
      "india-customs-publications",
    ]);
    expect(JSON.stringify(INDIA_TO_CHINA_COVERAGE_MANIFEST)).not.toMatch(/UAE|United States/i);
  });

  it("pins every admitted public source with local bytes to its immutable digest", async () => {
    for (const source of INDIA_TO_CHINA_SOURCES) {
      const bytes = await readFile(join(process.cwd(), source.snapshotPath));
      expect(createHash("sha256").update(bytes).digest("hex"), source.id).toBe(source.sha256);
    }
  });

  it("preserves Chinese Authoritative Text, labels English, and blocks material ambiguity", () => {
    expect(validateIndiaToChinaTranslations(INDIA_TO_CHINA_SOURCES)).toEqual([]);
    const input = completeInput();
    input.chinaTariffResult.translation.materialAmbiguity = "The exact rate row may refer to a different product variant.";
    const result = assessIndiaToChinaTradeCase(input);
    expect(result.state).toBe("Assessment Incomplete");
    expect(result.blockers.join(" ")).toMatch(/translation ambiguity/i);
  });

  it("completes the bounded reference journey only with both-side evidence and current exact authority results", () => {
    const result = assessIndiaToChinaTradeCase(completeInput());

    expect(result).toMatchObject({
      state: "Assessment Complete Within Verified Scope",
      classification: {
        status: "working_classification",
        hsCode: "8517623690",
      },
      calculation: {
        status: "available",
        currency: "CNY",
        assessableValue: "100000.00",
        totalBorderCharges: "24300.00",
      },
      indiaExport: { state: "Assessment Complete Within Verified Scope" },
      chinaImport: { state: "Assessment Complete Within Verified Scope" },
    });
    expect(result.checked).toEqual(expect.arrayContaining([
      "India exporter and Customs declaration",
      "India Schedule II export policy",
      "India SCOMET technical and end-use screen",
      "China Customs import declaration",
      "China tariff classification and border-charge formula",
      "China CCC, network-access and radio type-approval triggers",
    ]));
    expect(result.claims.every((claim) => claim.sourceVersionId && claim.locator && claim.url)).toBe(true);
    expect(result.claims.some((claim) => claim.appliesIn === "India")).toBe(true);
    expect(result.claims.some((claim) => claim.appliesIn === "China")).toBe(true);
  });

  it("fails closed for missing facts, absent evidence, stale sources, connector failures, unresolved screens and ambiguous tariff text", () => {
    const missingFact = completeInput();
    missingFact.route.destinationProvince = "";
    expect(assessIndiaToChinaTradeCase(missingFact).state).toBe("Assessment Incomplete");

    const absentEvidence = completeInput();
    absentEvidence.evidence.india_scomet_screening = "unknown";
    expect(assessIndiaToChinaTradeCase(absentEvidence).state).toBe("Assessment Incomplete");

    const unavailable = completeInput();
    unavailable.connectorStates["china-tariff-tax-publications"] = "temporarily_unavailable";
    expect(assessIndiaToChinaTradeCase(unavailable).state).toBe("Assessment Incomplete");

    const customsUnavailable = completeInput();
    customsUnavailable.connectorStates["india-customs-publications"] = "temporarily_unavailable";
    expect(assessIndiaToChinaTradeCase(customsUnavailable).state).toBe("Assessment Incomplete");

    const unresolved = completeInput();
    unresolved.screening.chinaRadioTypeApproval = "unknown";
    expect(assessIndiaToChinaTradeCase(unresolved).state).toBe("Assessment Incomplete");

    expect(assessIndiaToChinaTradeCase(completeInput(), {
      evidenceStates: { "prc-vat-law-2024": "stale" },
    }).state).toBe("Assessment Incomplete");
  });
});
