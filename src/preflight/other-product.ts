import {
  OtherProductAssessmentRequestSchema,
  OtherProductReportSchema,
  type OtherProductAssessmentRequest,
  type OtherProductReport,
} from "./schema";

interface OtherProductEvaluationOptions {
  asOf?: string;
}

const FACT_LABELS = [
  ["Product description", "product", "description"],
  ["Exact product model", "product", "modelIdentity"],
  ["Manufacturer", "product", "manufacturerIdentity"],
  ["Overseas supplier", "product", "supplierIdentity"],
  ["Country of origin", "shipment", "originCountryCode"],
  ["Indian importer", "shipment", "importerIdentity"],
  ["Producer", "shipment", "producerIdentity"],
  ["Exporter", "shipment", "exporterIdentity"],
  ["Shipment quantity", "shipment", "quantity"],
  ["Incoterm", "shipment", "incoterm"],
  ["Destination", "shipment", "destination"],
  ["Declared item value", "commercialFacts", "itemValueInr"],
  ["Freight amount", "commercialFacts", "freightInr"],
  ["Insurance amount", "commercialFacts", "insuranceInr"],
] as const;

const PRODUCT_SPECIFIC_GAPS = [
  "Product-specific HS classification",
  "Product-specific import-control and regulator applicability",
  "Product-specific evidence and required documents",
  "Applicable rates and import-cost calculation",
] as const;

function factValue(
  request: OtherProductAssessmentRequest,
  section: (typeof FACT_LABELS)[number][1],
  key: (typeof FACT_LABELS)[number][2],
): string | null {
  const group = request[section] as Record<string, string | null>;
  return group[key] ?? null;
}

export function evaluateOtherProduct(
  candidateRequest: OtherProductAssessmentRequest,
  options: OtherProductEvaluationOptions = {},
): OtherProductReport {
  const request = OtherProductAssessmentRequestSchema.parse(candidateRequest);
  const asOf = options.asOf ?? new Date().toISOString().slice(0, 10);
  const missingUniversalFacts: string[] = FACT_LABELS.flatMap(([label, section, key]) =>
    factValue(request, section, key) === null ? [label] : [],
  );
  if (request.assessmentDate !== asOf) missingUniversalFacts.push("Current assessment date");

  const unresolvedFacts = [...missingUniversalFacts, ...PRODUCT_SPECIFIC_GAPS];
  const description = request.product.description ?? "Description not provided";
  const brokerFacts = FACT_LABELS.map(([label, section, key]) => ({
    label,
    value: factValue(request, section, key) ?? "Not provided",
  }));

  return OtherProductReportSchema.parse({
    reportKind: "unsupported_product",
    productPackId: request.productPackId,
    productTitle: "Other product",
    assessmentDate: asOf,
    outcome: "needs_verification",
    outcomeLabel: "Needs verification",
    summary:
      "This product is outside the independently admitted catalog. Universal shipment facts are retained, but product-specific conclusions are withheld for professional verification.",
    customsClearanceBlocked: false,
    classification: {
      status: "withheld",
      reason:
        "No admitted product pack covers this exact product, so the tool cannot infer or borrow an HS classification.",
    },
    cost: {
      status: "withheld",
      blocker:
        "Product-specific classification and applicable rates are not admitted, so no duty or landed-cost estimate is calculated.",
    },
    coverage: {
      supportedChecks: [
        "Universal shipment and commercial facts captured exactly as entered",
        "Supported catalog boundary checked against independently promoted product packs",
        "Independently admitted universal Customs blockers checked; none are available in this release",
      ],
      unsupportedChecks: [
        "Product-specific HS classification",
        "Product-specific import rules and regulator applicability",
        "Product-specific evidence and required documents",
        "Product-specific rates and import cost",
      ],
      unresolvedFacts,
      professionalReviewNeeded:
        "A licensed Customs Broker must establish the classification, applicable import controls, required evidence and documents, and current rates for this exact product and shipment.",
    },
    universalFacts: {
      product: { ...request.product },
      shipment: { ...request.shipment },
      commercialFacts: { ...request.commercialFacts },
    },
    brokerSummary: {
      overview: `${description} is outside this tool's supported product catalog. The facts below are user-provided and carry no inferred classification, product rule, document requirement, rate, or cost.`,
      facts: brokerFacts,
      reviewRequest:
        "Please verify the exact HS classification, Customs and regulator applicability, required documents, current rates, and any independently evidenced clearance blocker before the importer proceeds.",
    },
    rerunNotice:
      "Use a supported product only when every exact boundary fact matches its admitted scenario. Otherwise keep this Other product result and obtain professional review.",
  });
}
