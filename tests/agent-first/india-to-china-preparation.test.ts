import { describe, expect, it } from "vitest";

import {
  INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS,
  documentMeetsRequiredVisibleFacts,
  evaluateIndiaToChinaPreparationWorkflow,
} from "@/server/assessment/preparation-workflow";

const CASE_VALUE_BY_FIELD: Record<string, string> = {
  adapterModelIdentity: "Adapter model",
  chinaTariffCode: "8517623690",
  endUse: "Indoor civilian broadband routing",
  endUserIdentity: "Confirmed China commercial end user",
  exporterIdentity: "Confirmed Indian exporter legal entity",
  importPort: "Shanghai, China",
  importerIdentity: "Confirmed China importer legal entity",
  indiaTariffCode: "85176290",
  manufacturerIdentity: "Confirmed Indian manufacturer legal entity",
  manufacturingSite: "Confirmed manufacturing site in India",
  modelIdentity: "Confirmed India-manufactured dual-band Wi-Fi router model",
  originBasis: "Confirmed India manufacturing records",
  originCountryCode: "IN",
  producerIdentity: "Confirmed Indian producer legal entity",
  productDescription: "New finished 2.4/5 GHz indoor MIMO Wi-Fi router",
  quantity: "100",
  exportPort: "Nhava Sheva, India",
};

const confirmedFacts = [
  ["product_model", CASE_VALUE_BY_FIELD.modelIdentity],
  ["manufacturer", CASE_VALUE_BY_FIELD.manufacturerIdentity],
  ["product_description", CASE_VALUE_BY_FIELD.productDescription],
  ["technical_specifications", "2.4/5 GHz Wi-Fi; no cellular, modem, battery or 6 GHz radio"],
  ["india_tariff_code", CASE_VALUE_BY_FIELD.indiaTariffCode],
  ["china_tariff_code", CASE_VALUE_BY_FIELD.chinaTariffCode],
  ["exporter", CASE_VALUE_BY_FIELD.exporterIdentity],
  ["producer", CASE_VALUE_BY_FIELD.producerIdentity],
  ["importer", CASE_VALUE_BY_FIELD.importerIdentity],
  ["end_user", CASE_VALUE_BY_FIELD.endUserIdentity],
  ["manufacturing_site", CASE_VALUE_BY_FIELD.manufacturingSite],
  ["origin_basis", "Confirmed India manufacturing records"],
  ["intended_use", "Commercial distribution in China"],
  ["end_use", CASE_VALUE_BY_FIELD.endUse],
  ["export_port", CASE_VALUE_BY_FIELD.exportPort],
  ["import_port", CASE_VALUE_BY_FIELD.importPort],
  ["destination_province", "Shanghai"],
  ["item_value_cny", "99999.98"],
  ["assessment_date", "2026-08-25"],
].map(([name, value]) => ({ name: name!, value: value! }));

function completeDocuments() {
  return INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS.map((requirement, index) => ({
    documentType: requirement.documentType,
    fileName: `${requirement.documentType}-${index}.pdf`,
    facts: requirement.requiredVisibleFacts.map((fact) => ({
      field: fact.field,
      reviewStatus: "confirmed" as const,
      value: fact.field === "documentNumber"
        ? `REF-${index}`
        : fact.field === "documentDate"
          ? "2026-08-25"
          : fact.field === "expiryDate"
            ? "2027-08-25"
            : CASE_VALUE_BY_FIELD[fact.field] ?? `Confirmed ${fact.field}`,
    })),
  }));
}

describe("BWMI-21 India-to-China preparation workflow", () => {
  it("defines an evidence-owned minimum reviewed-visible-field contract for every required document", () => {
    expect(INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS.length).toBeGreaterThanOrEqual(10);
    expect(INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS.every((requirement) => requirement.requiredVisibleFacts.length > 0)).toBe(true);
    for (const requirement of INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS) {
      const completeFacts = completeDocuments().find((document) => document.documentType === requirement.documentType)!.facts;
      expect(documentMeetsRequiredVisibleFacts(requirement.documentType, completeFacts, "india_to_china")).toBe(true);
      expect(documentMeetsRequiredVisibleFacts(requirement.documentType, completeFacts.slice(0, -1), "india_to_china")).toBe(false);
    }
  });

  it("allows Package Ready only when every requirement has complete reviewed visible content", () => {
    const result = evaluateIndiaToChinaPreparationWorkflow({
      confirmedFacts,
      documents: completeDocuments(),
    });
    expect(result).toMatchObject({
      status: "Document Package Ready for Submission Within Verified Scope",
      missingInformation: [],
      missingDocuments: [],
      visibleContentFindings: [],
      consistencyFindings: [],
      authenticityStatus: "unverified",
      acceptanceStatus: "unverified",
      clearanceStatus: "unverified",
    });
  });

  it("keeps empty and partial uploads fail closed", () => {
    const empty = evaluateIndiaToChinaPreparationWorkflow({ confirmedFacts, documents: [] });
    expect(empty.status).toBe("Documents required");
    expect(empty.missingDocuments.length).toBe(INDIA_TO_CHINA_DOCUMENT_REQUIREMENTS.length);
    const partial = completeDocuments();
    partial[0]!.facts = partial[0]!.facts.slice(0, 1);
    const result = evaluateIndiaToChinaPreparationWorkflow({ confirmedFacts, documents: partial });
    expect(result.status).toBe("Uploads checked");
    expect(result.visibleContentFindings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "missing_required_visible_fact" }),
    ]));
  });
});
