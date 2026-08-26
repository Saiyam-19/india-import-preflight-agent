import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";

import { loadRouterPack } from "@/knowledge";
import {
  assessChinaToIndiaTradeCase,
  type ChinaToIndiaAssessmentInput,
} from "@/server/assessment/china-to-india-assessment";
import {
  CHINA_EXPORT_COVERAGE_MANIFEST,
  CHINA_EXPORT_SOURCES,
  validateChinaSourceTranslations,
} from "@/server/assessment/china-export-evidence";
import { OFFICIAL_CONNECTORS } from "@/server/evidence/registry";

const AS_OF = "2026-08-25";

async function referenceInput(): Promise<ChinaToIndiaAssessmentInput> {
  const pack = await loadRouterPack();
  return {
    assessmentDate: AS_OF,
    tradeDirection: "china_to_india",
    originCountryCode: "CN",
    destinationCountryCode: "IN",
    productFacts: {
      ...pack.scenario.includedFacts,
      modelIdentity: "TP-Link Archer AX12 (IN hardware version 1.8)",
      manufacturerIdentity: "TP-Link Technologies Co., Ltd.",
      adapterModelIdentity: "12 V DC / 1 A external adapter",
      chinaTariffCode: "8517623690",
      wifiThroughputMbps: 1501,
      encryptedVpnThroughputGbps: 1,
      isCryptanalysisEquipment: false,
      isSpeciallyDesignedForControlledItem: false,
    },
    parties: {
      importerIdentity: "TP-Link India Private Limited",
      producerIdentity: "TP-Link Technologies Co., Ltd.",
      exporterIdentity: "TP-Link Technologies Co., Ltd.",
      endUserIdentity: "Confirmed Indian retail distribution recipient",
    },
    manufacturing: {
      countryCode: "CN",
      site: "Confirmed manufacturing site in China",
      originBasis: "Wholly manufactured and assembled in China from confirmed production records",
    },
    endUse: "Indoor residential Wi-Fi routing for retail customers in India",
    route: {
      exportPort: "Yantian, Shenzhen, China",
      importPort: "Nhava Sheva, India",
      transitCountries: [],
    },
    evidence: {
      wpc_eta: "present",
      bis_power_adapter: "present",
      mtcte_wifi_cpe: "present",
      repa_import_for_sale: "present",
      legal_metrology_labels: "present",
      china_exporter_registration: "present",
      china_customs_declaration_pack: "present",
      china_ordinary_export_licence_screening: "present",
      china_dual_use_list_screening: "present",
      china_catch_all_end_use_screening: "present",
      china_statutory_inspection_screening: "present",
    },
    chinaScreening: {
      ordinaryExportLicence: "confirmed_no_match",
      dualUseList: "confirmed_no_match_with_parameters",
      catchAll: "confirmed_no_concern",
      statutoryInspection: "confirmed_not_listed",
      restrictedParty: "confirmed_no_match",
    },
    connectorStates: {
      "china-mofcom-publications": "available",
      "china-gacc-publications": "available",
      "china-export-control-publications": "available",
      "china-single-window": "login_required",
      "china-dual-use-licensing": "login_required",
    },
    tradeRemedyCheck: "confirmed_no_match",
    customsValue: {
      currency: "INR",
      valuationDate: AS_OF,
      itemValue: "99999.98",
      freight: "0.01",
      insurance: "0.01",
    },
    preferentialTariffClaim: "none",
    confirmations: {
      productAndTransactionFactsConfirmed: true,
      evidencePossessionConfirmed: true,
      datedTradeRemedyCheckConfirmed: true,
      chinaScreeningConfirmed: true,
      translationReviewConfirmed: true,
    },
  };
}

describe("BWMI-20 China-to-India evidence and assessment", () => {
  it("registers only admitted India-China connectors and keeps login portals visible", () => {
    const china = OFFICIAL_CONNECTORS.filter((connector) => connector.jurisdiction === "China");

    expect(china.map((connector) => connector.id)).toEqual([
      "china-official-web",
      "china-mofcom-publications",
      "china-gacc-publications",
      "china-export-control-publications",
      "china-tariff-tax-publications",
      "china-product-market-publications",
      "china-product-market-portals",
      "china-single-window",
      "china-dual-use-licensing",
      "china-structured-records",
    ]);
    expect(china.find((connector) => connector.id === "china-single-window")?.state).toBe("login_required");
    expect(china.find((connector) => connector.id === "china-dual-use-licensing")?.state).toBe("login_required");
    expect(OFFICIAL_CONNECTORS.every((connector) => ["India", "China"].includes(connector.jurisdiction))).toBe(true);
    expect(JSON.stringify(OFFICIAL_CONNECTORS)).not.toMatch(/UAE|United Arab Emirates|United States|\bUS\b/i);
  });

  it("covers the exact MOFCOM, GACC, export-control, foreign-trade and inspection domains", () => {
    expect(CHINA_EXPORT_COVERAGE_MANIFEST.map((entry) => entry.domainId)).toEqual([
      "china-foreign-trade",
      "china-customs-declaration",
      "china-ordinary-export-licence",
      "china-dual-use-export-control",
      "china-export-commodity-inspection",
      "china-case-party-screening",
    ]);
    expect(CHINA_EXPORT_COVERAGE_MANIFEST.every((entry) => entry.sourceIds.length > 0)).toBe(true);
    expect(CHINA_EXPORT_SOURCES.every((source) => source.admissionState === "admitted")).toBe(true);
    expect(CHINA_EXPORT_SOURCES.every((source) => source.authoritativeText.language === "zh-CN")).toBe(true);
    expect(JSON.stringify([CHINA_EXPORT_COVERAGE_MANIFEST, CHINA_EXPORT_SOURCES])).not.toMatch(/UAE|United States/i);
  });

  it("pins every admitted China source to immutable official bytes", async () => {
    for (const source of CHINA_EXPORT_SOURCES) {
      const bytes = await readFile(join(process.cwd(), source.snapshotPath));
      expect(createHash("sha256").update(bytes).digest("hex"), source.id).toBe(source.sha256);
    }
  });

  it("proves the exact reference code has no row in the complete official 2026 ordinary export-licence catalogue", async () => {
    const source = CHINA_EXPORT_SOURCES.find((candidate) => candidate.id === "mofcom-export-licence-catalogue-2026")!;
    const bytes = await readFile(join(process.cwd(), source.snapshotPath));
    const document = await getDocument({ data: new Uint8Array(bytes) }).promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const content = await (await document.getPage(pageNumber)).getTextContent();
      pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
    }
    const completeText = pages.join("\n");
    expect(document.numPages).toBe(59);
    expect(completeText).toContain("出口许可证管理货物目录");
    expect(completeText).not.toMatch(/8517623690|\b8517\b|无线路由器|路由器/);
  });

  it("preserves Chinese Authoritative Text and blocks material translation ambiguity", () => {
    expect(validateChinaSourceTranslations(CHINA_EXPORT_SOURCES)).toEqual([]);

    const ambiguous = structuredClone(CHINA_EXPORT_SOURCES);
    ambiguous[0]!.translation = {
      kind: "Derived Translation",
      language: "en",
      text: "A disputed working translation.",
      reviewedAt: AS_OF,
      materialAmbiguity: "Whether the clause creates a licence requirement is unresolved.",
    };
    expect(validateChinaSourceTranslations(ambiguous)).toEqual([
      expect.stringMatching(/material translation ambiguity/i),
    ]);
  });

  it("keeps the real-case candidate incomplete while exact China inspection and party evidence remain manual", async () => {
    const pack = await loadRouterPack();
    const complete = await referenceInput();
    const result = assessChinaToIndiaTradeCase(pack, complete);

    expect(result).toMatchObject({
      state: "Assessment Incomplete",
      calculation: { status: "available", totalBorderCharges: "43960.00" },
      chinaExport: {
        state: "Assessment Incomplete",
        exportControlFinding: "No listed match within the verified technical scope; catch-all review remains case-specific.",
        sourceLanguageEvidence: expect.arrayContaining([
          expect.objectContaining({
            authoritativeLanguage: "zh-CN",
            authoritativeTextKind: "Authoritative Text",
            translationKind: "Derived Translation",
            materialAmbiguity: null,
          }),
        ]),
      },
    });
    expect(result.checked).toEqual(expect.arrayContaining([
      "China foreign-trade authority",
      "China Customs export declaration",
      "China ordinary export-licence catalogue screening",
      "China dual-use list, technical thresholds and catch-all screening",
      "India import classification",
      "India border charges",
    ]));
    expect(result.blockers).toEqual(expect.arrayContaining([
      expect.stringMatching(/current statutory-inspection catalogue row/i),
      expect.stringMatching(/case-specific restricted-party result/i),
    ]));
    expect(result.notChecked).toEqual(expect.arrayContaining([
      expect.stringMatching(/China Single Window.*login/i),
      expect.stringMatching(/MOFCOM dual-use licensing.*login/i),
      expect.stringMatching(/statutory-inspection catalogue row/i),
      expect.stringMatching(/restricted-party result/i),
    ]));
    expect(result.claims.every((claim) => claim.sourceVersionId && claim.locator && claim.url)).toBe(true);
    expect(result.claims.some((claim) => claim.appliesIn === "China")).toBe(true);
    expect(result.claims.some((claim) => claim.appliesIn === "India")).toBe(true);
  });

  it("fails closed for missing facts, unresolved screening, stale evidence, unavailable public connectors or translation ambiguity", async () => {
    const pack = await loadRouterPack();
    const complete = await referenceInput();

    const missingEndUse = structuredClone(complete);
    missingEndUse.endUse = "";
    expect(assessChinaToIndiaTradeCase(pack, missingEndUse).state).toBe("Assessment Incomplete");

    const unresolved = structuredClone(complete);
    unresolved.chinaScreening.dualUseList = "unknown";
    expect(assessChinaToIndiaTradeCase(pack, unresolved).state).toBe("Assessment Incomplete");

    expect(assessChinaToIndiaTradeCase(pack, complete, {
      chinaEvidenceStates: { "prc-foreign-trade-law-2025": "stale" },
    }).state).toBe("Assessment Incomplete");

    const unavailable = structuredClone(complete);
    unavailable.connectorStates["china-gacc-publications"] = "temporarily_unavailable";
    expect(assessChinaToIndiaTradeCase(pack, unavailable).state).toBe("Assessment Incomplete");

    expect(assessChinaToIndiaTradeCase(pack, complete, {
      chinaSources: CHINA_EXPORT_SOURCES.map((source, index) => index === 0 ? {
        ...source,
        translation: { ...source.translation, materialAmbiguity: "Material legal meaning unresolved." },
      } : source),
    }).state).toBe("Assessment Incomplete");
  });
});
