import { describe, expect, it } from "vitest";

import {
  CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS,
  REFERENCE_PRODUCT_PROFILE,
  discoverReferenceProductProfile,
  evaluatePreparationWorkflow,
  resolveReferenceProductProfileConfirmation,
} from "@/server/assessment/preparation-workflow";

function confirmedProfile() {
  return {
    profileId: REFERENCE_PRODUCT_PROFILE.profileId,
    confirmedAt: "2026-08-25T08:00:00.000Z",
    confirmedByUser: true as const,
    modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
  };
}

function requiredCaseFacts() {
  return ([
    ["product_model", "TP-Link Archer AX12 (IN) 1.8"],
    ["manufacturer", "TP-Link Technologies Co., Ltd."],
    ["adapter_model", "T120100-2C4"],
    ["china_tariff_code", "8517623690"],
    ["exporter", "User-confirmed China exporter"],
    ["producer", "User-confirmed China producer"],
    ["importer", "User-confirmed India importer"],
    ["end_user", "User-confirmed India end user"],
    ["manufacturing_site", "User-confirmed China manufacturing site"],
    ["origin_basis", "User-confirmed manufacturing records"],
    ["end_use", "Residential Wi-Fi routing"],
    ["export_port", "Yantian, Shenzhen"],
    ["import_port", "Nhava Sheva"],
    ["item_value_inr", "99999.98"],
    ["assessment_date", "2026-08-25"],
  ] as const).map(([name, value]) => ({ name, value }));
}

function completeReviewedDocuments() {
  const factsByType: Record<string, Record<string, string>> = {
    commercial_invoice: {
      documentNumber: "INV-AX12-1",
      documentDate: "2026-08-20",
      exporterIdentity: "User-confirmed China exporter",
      importerIdentity: "User-confirmed India importer",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      itemValueInr: "99999.98",
    },
    packing_list: {
      documentNumber: "PKG-AX12-1",
      documentDate: "2026-08-20",
      exporterIdentity: "User-confirmed China exporter",
      importerIdentity: "User-confirmed India importer",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      quantity: "1",
    },
    transport_document: {
      documentNumber: "BL-AX12-1",
      documentDate: "2026-08-21",
      exporterIdentity: "User-confirmed China exporter",
      importerIdentity: "User-confirmed India importer",
      exportPort: "Yantian, Shenzhen",
      importPort: "Nhava Sheva",
    },
    china_exporter_registration: {
      documentNumber: "CN-EXPORTER-1",
      exporterIdentity: "User-confirmed China exporter",
    },
    china_customs_declaration: {
      documentNumber: "CN-CUSTOMS-1",
      documentDate: "2026-08-21",
      exporterIdentity: "User-confirmed China exporter",
      importerIdentity: "User-confirmed India importer",
      productDescription: "TP-Link Archer AX12 (IN) 1.8 dual-band Wi-Fi router",
      chinaTariffCode: "8517623690",
      originCountryCode: "CN",
      exportPort: "Yantian, Shenzhen",
    },
    china_export_control_screening: {
      documentNumber: "CN-SCREEN-1",
      documentDate: "2026-08-22",
      exporterIdentity: "User-confirmed China exporter",
      endUserIdentity: "User-confirmed India end user",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      chinaTariffCode: "8517623690",
      endUse: "Residential Wi-Fi routing",
    },
    china_statutory_inspection_screening: {
      documentDate: "2026-08-22",
      chinaTariffCode: "8517623690",
      productDescription: "TP-Link Archer AX12 (IN) 1.8 dual-band Wi-Fi router",
    },
    end_user_end_use_statement: {
      documentDate: "2026-08-22",
      endUserIdentity: "User-confirmed India end user",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      endUse: "Residential Wi-Fi routing",
    },
    india_wpc_eta: {
      documentNumber: "WPC-ETA-1",
      documentDate: "2026-07-01",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      manufacturerIdentity: "TP-Link Technologies Co., Ltd.",
    },
    india_bis_adapter: {
      documentNumber: "BIS-ADAPTER-1",
      documentDate: "2026-07-01",
      expiryDate: "2027-07-01",
      adapterModelIdentity: "T120100-2C4",
      manufacturerIdentity: "TP-Link Technologies Co., Ltd.",
    },
    india_mtcte: {
      documentNumber: "MTCTE-AX12-1",
      documentDate: "2026-07-01",
      expiryDate: "2027-07-01",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      manufacturerIdentity: "TP-Link Technologies Co., Ltd.",
    },
    india_repa: {
      documentNumber: "REPA-1",
      documentDate: "2026-07-01",
      expiryDate: "2027-07-01",
      importerIdentity: "User-confirmed India importer",
    },
    india_retail_labels: {
      productDescription: "TP-Link Archer AX12 (IN) 1.8 dual-band Wi-Fi router",
      modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
      importerIdentity: "User-confirmed India importer",
      originCountryCode: "CN",
    },
  };
  return CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS.map((requirement) =>
    reviewedDocument(requirement.documentType, factsByType[requirement.documentType] ?? {}),
  );
}

function reviewedDocument(documentType: string, facts: Record<string, string> = {}) {
  return {
    documentType,
    fileName: `${documentType}.pdf`,
    facts: Object.entries(facts).map(([field, value]) => ({
      field,
      reviewStatus: "confirmed" as const,
      value,
    })),
  };
}

describe("approved China-to-India preparation workflow", () => {
  it("discovers only the bounded official-source Archer AX12 IN 1.8 candidate and requires confirmation", () => {
    const exact = discoverReferenceProductProfile("TP-Link Archer AX12 IN 1.8");
    expect(exact).toMatchObject({ status: "candidate_found", candidate: { userConfirmationRequired: true } });
    expect(exact.candidate?.source).toMatchObject({
      authority: "TP-Link India",
      retrievedAt: "2026-08-25",
      url: "https://static.tp-link.com/upload/product-overview/2025/202511/20251125/Archer%20AX12%28IN%291.8_Datasheet.pdf",
    });
    expect(exact.candidate?.facts).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "wifi_speed", value: "1201 Mbps (5 GHz) + 300 Mbps (2.4 GHz)" }),
      expect.objectContaining({ name: "power", value: "12 V / 1 A" }),
    ]));

    expect(discoverReferenceProductProfile("Archer AX12")).toMatchObject({
      status: "needs_variant_confirmation",
      focusedQuestions: [expect.stringMatching(/hardware version/i)],
    });
    expect(discoverReferenceProductProfile("Archer AX55")).toMatchObject({ status: "outside_bounded_scope" });
    expect(resolveReferenceProductProfileConfirmation("TP-Link Archer AX12 (IN) 1.8", "2026-08-25T08:00:00.000Z")).toMatchObject({
      status: "confirmed",
      confirmation: { modelIdentity: "TP-Link Archer AX12 (IN) 1.8" },
    });
    expect(resolveReferenceProductProfileConfirmation("Generic dual-band router", "2026-08-25T08:00:00.000Z")).toMatchObject({
      status: "needs_variant_confirmation",
    });
  });

  it("produces a case-specific checklist with issuer, filing destination and no UAE or US scope", () => {
    expect(CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS.length).toBeGreaterThan(8);
    expect(CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS.every((requirement) => (
      requirement.issuer.length > 0 &&
      requirement.filingDestination.label.length > 0 &&
      requirement.filingDestination.url.startsWith("https://") &&
      requirement.requiredVisibleFacts.length > 0 &&
      requirement.whyRequired.length > 0
    ))).toBe(true);
    expect(JSON.stringify(CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS)).not.toMatch(/UAE|United Arab Emirates|United States|\bUS\b/i);
    expect(CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS).toEqual(expect.arrayContaining([
      expect.objectContaining({ documentType: "commercial_invoice" }),
      expect.objectContaining({ documentType: "china_customs_declaration" }),
      expect.objectContaining({ documentType: "india_wpc_eta" }),
    ]));
  });

  it("moves through useful preparation states and reaches package ready only for a complete, reviewed, consistent package", () => {
    expect(evaluatePreparationWorkflow({
      confirmedFacts: [],
      documents: [],
      productProfileConfirmation: null,
    }).status).toBe("Needs information");

    expect(evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: [],
      productProfileConfirmation: confirmedProfile(),
    }).status).toBe("Documents required");

    const documents = completeReviewedDocuments();
    const result = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents,
      productProfileConfirmation: confirmedProfile(),
    });
    expect(result).toMatchObject({
      status: "Document Package Ready for Submission Within Verified Scope",
      authenticityStatus: "unverified",
      filingStatus: "not_filed",
      acceptanceStatus: "unverified",
      clearanceStatus: "unverified",
    });
    expect(result.missingDocuments).toEqual([]);
    expect(result.consistencyFindings).toEqual([]);
  });

  it("keeps empty or partial document shells at Uploads checked and names each missing reviewed visible fact", () => {
    const empty = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: CHINA_TO_INDIA_DOCUMENT_REQUIREMENTS.map((requirement) => reviewedDocument(requirement.documentType)),
      productProfileConfirmation: confirmedProfile(),
    });
    expect(empty.status).toBe("Uploads checked");
    expect(empty.missingDocuments).toEqual([]);
    expect(empty.visibleContentFindings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        kind: "missing_required_visible_fact",
        fileName: "commercial_invoice.pdf",
        field: "modelIdentity",
      }),
      expect.objectContaining({
        kind: "missing_required_visible_fact",
        fileName: "india_bis_adapter.pdf",
        field: "expiryDate",
      }),
      expect.objectContaining({
        kind: "missing_required_visible_fact",
        fileName: "china_statutory_inspection_screening.pdf",
        field: "productDescription",
      }),
    ]));

    const partialDocuments = completeReviewedDocuments();
    const invoice = partialDocuments.find((document) => document.documentType === "commercial_invoice")!;
    invoice.facts = invoice.facts.filter((fact) => fact.field === "documentNumber");
    const partial = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: partialDocuments,
      productProfileConfirmation: confirmedProfile(),
    });
    expect(partial.status).toBe("Uploads checked");
    expect(partial.visibleContentFindings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "missing_required_visible_fact", field: "documentDate" }),
      expect.objectContaining({ kind: "missing_required_visible_fact", field: "exporterIdentity" }),
      expect.objectContaining({ kind: "missing_required_visible_fact", field: "modelIdentity" }),
      expect.objectContaining({ kind: "missing_required_visible_fact", field: "itemValueInr" }),
    ]));
  });

  it("rejects a forged product-profile confirmation that repeats an unsupported client model", () => {
    const forgedFacts = requiredCaseFacts().map((fact) =>
      fact.name === "product_model" ? { ...fact, value: "Generic dual-band router" } : fact,
    );
    const result = evaluatePreparationWorkflow({
      confirmedFacts: forgedFacts,
      documents: [],
      productProfileConfirmation: {
        ...confirmedProfile(),
        modelIdentity: "Generic dual-band router",
      },
    });
    expect(result.status).toBe("Needs information");
    expect(result.missingInformation).toEqual(expect.arrayContaining([
      expect.stringMatching(/exact Archer AX12.*IN.*1\.8/i),
    ]));
  });

  it("fails closed on pending review, missing documents, variant mismatch or cross-document conflict", () => {
    const missing = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: [reviewedDocument("commercial_invoice")],
      productProfileConfirmation: confirmedProfile(),
    });
    expect(missing.status).toBe("Uploads checked");
    expect(missing.missingDocuments.length).toBeGreaterThan(0);

    const conflicting = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: [
        reviewedDocument("commercial_invoice", { modelIdentity: "Archer AX12 IN 1.8" }),
        reviewedDocument("packing_list", { modelIdentity: "Archer AX55" }),
      ],
      productProfileConfirmation: confirmedProfile(),
    });
    expect(conflicting.status).toBe("Uploads checked");
    expect(conflicting.consistencyFindings).toEqual([
      expect.objectContaining({ field: "modelIdentity", kind: "cross_document_conflict" }),
    ]);

    const pending = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: [{
        documentType: "commercial_invoice",
        fileName: "invoice.pdf",
        facts: [{ field: "modelIdentity", reviewStatus: "pending", value: "Archer AX12" }],
      }],
      productProfileConfirmation: confirmedProfile(),
    });
    expect(pending.status).toBe("Uploads checked");
    expect(pending.visibleContentFindings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "pending_user_review" }),
    ]));

    const expired = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: [reviewedDocument("india_wpc_eta", {
        documentDate: "2026-01-01",
        expiryDate: "2026-08-24",
      })],
      productProfileConfirmation: confirmedProfile(),
    });
    expect(expired.visibleContentFindings).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: "expired_visible_date", field: "expiryDate" }),
    ]));
  });

  it("never upgrades an uploaded acknowledgement into Filed, Accepted or Cleared", () => {
    const result = evaluatePreparationWorkflow({
      confirmedFacts: requiredCaseFacts(),
      documents: [reviewedDocument("authority_acknowledgement", { documentNumber: "VISIBLE-ACK-1" })],
      productProfileConfirmation: confirmedProfile(),
    });
    expect(result.authorityEvidenceObservations).toEqual([
      expect.objectContaining({
        fileName: "authority_acknowledgement.pdf",
        statement: expect.stringMatching(/VISIBLE-ACK-1/),
      }),
    ]);
    expect(result.filingStatus).toBe("not_verified_from_upload");
    expect(result.acceptanceStatus).toBe("unverified");
    expect(result.clearanceStatus).toBe("unverified");
  });
});
