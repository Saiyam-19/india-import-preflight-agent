import { describe, expect, it } from "vitest";

import { POST } from "@/app/api/preflight/route";
import {
  OTHER_PRODUCT_ID,
  OtherProductAssessmentRequestSchema,
  OtherProductReportSchema,
  currentAssessmentDate,
  evaluateOtherProduct,
  type OtherProductAssessmentRequest,
} from "@/preflight";

const AS_OF = "2026-08-24";

function completeRequest(): OtherProductAssessmentRequest {
  return {
    productPackId: OTHER_PRODUCT_ID,
    assessmentDate: AS_OF,
    product: {
      description: "Outdoor solar-powered inventory tracker",
      modelIdentity: "TRACK-OUTDOOR-01",
      manufacturerIdentity: "Example device manufacturer",
      supplierIdentity: "Example overseas supplier",
    },
    shipment: {
      originCountryCode: "VN",
      importerIdentity: "Example importer India Pvt Ltd",
      producerIdentity: "Example device producer",
      exporterIdentity: "Example exporter",
      quantity: "250 units",
      incoterm: "CIF Mumbai",
      destination: "Nhava Sheva, Maharashtra",
    },
    commercialFacts: {
      itemValueInr: "99999.98",
      freightInr: "0.01",
      insuranceInr: "0.01",
    },
  };
}

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) collectKeys(item, keys);
    return keys;
  }
  if (typeof value !== "object" || value === null) return keys;
  for (const [key, child] of Object.entries(value)) {
    keys.add(key);
    collectKeys(child, keys);
  }
  return keys;
}

describe("fail-closed Other product", () => {
  it("preserves universal facts while withholding every product-specific conclusion", () => {
    const request = completeRequest();
    expect(OtherProductAssessmentRequestSchema.safeParse(request).success).toBe(true);

    const report = evaluateOtherProduct(request, { asOf: AS_OF });

    expect(OtherProductReportSchema.safeParse(report).success).toBe(true);
    expect(report).toMatchObject({
      reportKind: "unsupported_product",
      productPackId: OTHER_PRODUCT_ID,
      productTitle: "Other product",
      outcome: "needs_verification",
      outcomeLabel: "Needs verification",
      customsClearanceBlocked: false,
      classification: { status: "withheld" },
      cost: { status: "withheld" },
      universalFacts: {
        product: request.product,
        shipment: request.shipment,
        commercialFacts: request.commercialFacts,
      },
    });
    expect(report.coverage.supportedChecks).toEqual(expect.arrayContaining([
      expect.stringMatching(/universal shipment and commercial facts/i),
      expect.stringMatching(/supported catalog boundary/i),
    ]));
    expect(report.coverage.unsupportedChecks).toEqual(expect.arrayContaining([
      expect.stringMatching(/HS classification/i),
      expect.stringMatching(/product-specific import rules/i),
      expect.stringMatching(/required documents/i),
      expect.stringMatching(/rates and import cost/i),
    ]));
    expect(report.coverage.professionalReviewNeeded).toMatch(/licensed Customs Broker/i);
    expect(report.brokerSummary.facts).toContainEqual({
      label: "Product description",
      value: request.product.description,
    });

    const keys = collectKeys(report);
    for (const forbiddenKey of ["hsCode", "rates", "rules", "findings", "actions", "documents"]) {
      expect(keys.has(forbiddenKey), `${forbiddenKey} must not be emitted`).toBe(false);
    }
  });

  it("names missing universal facts as unresolved and can never produce Ready", () => {
    const request = completeRequest();
    request.product.modelIdentity = null;
    request.shipment.originCountryCode = null;
    request.shipment.quantity = null;
    request.commercialFacts.freightInr = null;

    const report = evaluateOtherProduct(request, { asOf: AS_OF });

    expect(report.outcome).not.toBe("ready");
    expect(report.outcome).toBe("needs_verification");
    expect(report.coverage.unresolvedFacts).toEqual(expect.arrayContaining([
      "Exact product model",
      "Country of origin",
      "Shipment quantity",
      "Freight amount",
      "Product-specific HS classification",
      "Product-specific import-control and regulator applicability",
      "Applicable rates and import-cost calculation",
    ]));
    expect(report.cost.status).toBe("withheld");
    expect(report.classification.status).toBe("withheld");
  });

  it("serves Other product outside the catalog with a strict no-store response", async () => {
    const request = completeRequest();
    request.assessmentDate = currentAssessmentDate();
    const response = await POST(new Request("http://localhost/api/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Expires")).toBe("0");
    expect(OtherProductReportSchema.safeParse(body).success).toBe(true);
    expect(body).toMatchObject({
      productPackId: OTHER_PRODUCT_ID,
      outcome: "needs_verification",
      classification: { status: "withheld" },
      cost: { status: "withheld" },
    });
  });

  it("keeps malformed request bodies out of caches", async () => {
    const response = await POST(new Request("http://localhost/api/preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    }));

    expect(response.status).toBe(400);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Pragma")).toBe("no-cache");
    expect(response.headers.get("Expires")).toBe("0");
  });
});
