import { describe, expect, it } from "vitest";

import {
  buildElectronicsProfile,
  extractConfirmedElectronicsFacts,
  groupedElectronicsIntake,
} from "@/server/assessment/electronics-profile";

describe("electronics intake and normalized profile", () => {
  it("states the complete router intake and action-dossier contract in the first reply", () => {
    const profile = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "Wi-Fi routers" },
        { name: "trade_direction", value: "china_to_india" },
      ],
      documents: [],
    });

    const intake = groupedElectronicsIntake(profile);

    expect(intake.question).toContain("I understand you want to import Wi-Fi routers from China to India.");
    expect(intake.question).toContain("Quantity, unit price and currency");
    expect(intake.question).toContain("Origin and destination PIN/port");
    expect(intake.question).toContain("Product URL, photo, model or datasheet");
    expect(intake.question).toContain("Whether it is already purchased");
    expect(intake.question).toContain("Invoice, bill or proof of purchase, if available");
    expect(intake.question).toContain("Commercial or personal purpose");
    expect(intake.question).toContain("Documents to prepare");
    expect(intake.question).toContain("Classification and regulatory checks");
    expect(intake.question).toContain("Exact policy paragraphs and page numbers");
    expect(intake.question).toContain("Verified online forms");
    expect(intake.question).toContain("Relevant points of contact");
    expect(intake.question).toContain("Duties, costs, blockers and responsible owner");
    expect(intake.question).toContain("Government submission portals");
    expect(intake.question).toContain("verified link to the exact service/page");
    expect(intake.question).toContain("documents uploaded there");
    expect(intake.question).toContain("who must file");
    expect(intake.question).toContain("login requirements");
    expect(intake.question).toContain("fees/deadlines");
    expect(intake.question).toContain("submission sequence");
    expect(intake.question).toContain("If already purchased, I’ll switch from pre-order guidance to clearance/remediation guidance.");
    expect(intake.question).toContain("never invent a portal or claim anything was submitted");
  });

  it("preserves every fact from the adversarial purchased-router answer without swallowing adjacent clauses", () => {
    const extracted = extractConfirmedElectronicsFacts(
      "I already purchased 20 routers for commercial resale at USD 35 each. The supplier is in Shenzhen 518000 and delivery is to Mumbai 400001. Model AX3000, principal function: wireless internet routing; specifications: dual-band 2.4 GHz and 5 GHz Wi-Fi. It is paid but not dispatched. I do not have the invoice yet.",
    );

    expect(extracted).toEqual(expect.arrayContaining([
      { name: "purchase_stage", value: "already_purchased" },
      { name: "shipment_stage", value: "paid_not_dispatched" },
      { name: "import_purpose", value: "commercial" },
      { name: "quantity", value: "20" },
      { name: "currency", value: "USD" },
      { name: "unit_price", value: "35" },
      { name: "origin_location", value: "Shenzhen 518000" },
      { name: "destination_location", value: "Mumbai 400001" },
      { name: "product_model", value: "AX3000" },
      { name: "principal_function", value: "wireless internet routing" },
      { name: "technical_specifications", value: "dual-band 2.4 GHz and 5 GHz Wi-Fi" },
      { name: "purchase_evidence_availability", value: "unavailable" },
    ]));
    expect(extracted).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ value: expect.stringMatching(/principal function:|paid but not dispatched|invoice/i) }),
    ]));
  });

  it("extracts explicit shipment facts from ordinary prose instead of requiring field labels", () => {
    const extracted = extractConfirmedElectronicsFacts(
      "I bought 2 units for my business and paid USD 49.50 each. It is paid but not dispatched. The supplier is in Shenzhen 518000 and delivery is to Mumbai 400001. It is model TC-2 and its job is measuring surface temperature. The datasheet specifies 230 V input. It has no radio transmitter or battery, has a camera, uses no encryption, comes retail packaged, and is not controlled or dual use. Shipping is CIF with USD 12 freight and USD 2 insurance.",
    );

    expect(extracted).toEqual(expect.arrayContaining([
      { name: "purchase_stage", value: "already_purchased" },
      { name: "shipment_stage", value: "paid_not_dispatched" },
      { name: "import_purpose", value: "commercial" },
      { name: "quantity", value: "2" },
      { name: "currency", value: "USD" },
      { name: "unit_price", value: "49.50" },
      { name: "origin_location", value: "Shenzhen 518000" },
      { name: "destination_location", value: "Mumbai 400001" },
      { name: "product_model", value: "TC-2" },
      { name: "principal_function", value: "measuring surface temperature" },
      { name: "technical_specifications", value: "230 V input" },
      { name: "radio.transmitter_present", value: "no" },
      { name: "battery.present", value: "no" },
      { name: "camera.present", value: "yes" },
      { name: "encryption.present", value: "no" },
      { name: "packaging.retail_prepackaged", value: "yes" },
      { name: "end_use.controlled_or_dual_use", value: "no" },
      { name: "incoterm", value: "CIF" },
      { name: "freight", value: "12" },
      { name: "insurance", value: "2" },
    ]));
  });

  it("switches an already-purchased case to remediation and asks for purchase evidence and shipment status first", () => {
    const profile = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "thermal camera" },
        { name: "principal_function", value: "surface temperature measurement" },
        { name: "quantity", value: "2" },
        { name: "unit_price", value: "49.50" },
        { name: "currency", value: "USD" },
        { name: "origin_location", value: "Shenzhen 518000" },
        { name: "destination_location", value: "Mumbai 400001" },
        { name: "product_model", value: "TC-2" },
        { name: "purchase_stage", value: "already_purchased" },
        { name: "import_purpose", value: "commercial" },
      ],
      documents: [],
    });

    expect(groupedElectronicsIntake(profile)).toMatchObject({
      journeyStage: "post_purchase_remediation",
      missing: expect.arrayContaining([
        "Invoice, bill, or proof-of-purchase document, or confirm that it is not currently available.",
        "Current shipment status: paid but not dispatched, dispatched, in transit, arrived, or held by Customs.",
      ]),
      question: expect.stringMatching(/invoice.*shipment status/i),
    });
  });

  it("does not ask again for a purchased shipment status that is already confirmed", () => {
    const profile = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "Wi-Fi routers" },
        { name: "principal_function", value: "wireless internet routing" },
        { name: "quantity", value: "20" },
        { name: "unit_price", value: "35" },
        { name: "currency", value: "USD" },
        { name: "origin_location", value: "Shenzhen 518000" },
        { name: "destination_location", value: "Mumbai 400001" },
        { name: "product_model", value: "AX3000" },
        { name: "purchase_stage", value: "already_purchased" },
        { name: "shipment_stage", value: "paid_not_dispatched" },
        { name: "import_purpose", value: "commercial" },
      ],
      documents: [],
    });

    const intake = groupedElectronicsIntake(profile);
    expect(intake.missing).toEqual(["Invoice, bill, or proof-of-purchase document, or confirm that it is not currently available."]);
    expect(intake.question).toMatch(/invoice|proof.of.purchase/i);
    expect(intake.question).not.toMatch(/confirm.*shipment status/i);
  });

  it.each([
    "The invoice is unavailable.",
    "The seller has not issued the bill yet.",
    "The seller has not issued it.",
    "I do not have proof of purchase yet.",
  ])("continues purchased-case remediation when proof is unavailable: %s", (statement) => {
    const extracted = extractConfirmedElectronicsFacts(statement);
    expect(extracted).toContainEqual({ name: "purchase_evidence_availability", value: "unavailable" });

    const profile = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "Wi-Fi router" },
        { name: "principal_function", value: "wireless internet routing" },
        { name: "quantity", value: "20" },
        { name: "unit_price", value: "35" },
        { name: "currency", value: "USD" },
        { name: "origin_location", value: "Shenzhen 518000" },
        { name: "destination_location", value: "Mumbai 400001" },
        { name: "product_model", value: "AX3000" },
        { name: "purchase_stage", value: "already_purchased" },
        { name: "shipment_stage", value: "paid_not_dispatched" },
        { name: "import_purpose", value: "commercial" },
        ...extracted,
      ],
      documents: [],
    });

    expect(profile.intake).toMatchObject({ purchaseEvidenceAvailability: "unavailable" });
    const intake = groupedElectronicsIntake(profile);
    expect(intake.missing.join(" ")).not.toMatch(/invoice|bill|proof.of.purchase/i);
    expect(intake.question).not.toMatch(/provide.*invoice|provide.*proof.of.purchase/i);
    expect(intake.nextActions.join(" ")).toMatch(/obtain.*invoice.*supplier.*customs filing/i);
  });

  it("normalizes only explicit confirmed traits and never derives them from a product name", () => {
    const extracted = extractConfirmedElectronicsFacts(
      "Already purchased 2 units at USD 49.50 each for personal use; origin Shenzhen 518000; destination Mumbai 400001; model AX-9; principal function: USB measurement; product URL: https://example.test/ax-9; specifications: input 230 V. Radio transmitter: no. Battery present: yes. Battery capacity: 5000 mAh. Incoterm: CIF; freight: USD 12; insurance: USD 2.",
    );
    const profile = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "Bluetooth Wi-Fi satellite phone" },
        ...extracted,
      ],
      documents: [],
    });

    expect(profile.intake).toMatchObject({
      direction: "china_to_india",
      productDescription: "Bluetooth Wi-Fi satellite phone",
      quantity: "2",
      unitPrice: "49.50",
      currency: "USD",
      originLocation: "Shenzhen 518000",
      destinationLocation: "Mumbai 400001",
      productModel: "AX-9",
      principalFunction: "USB measurement",
      productUrl: "https://example.test/ax-9",
      purchaseStage: "already_purchased",
      purpose: "personal",
      freight: "12",
      insurance: "2",
      incoterm: "CIF",
    });
    expect(profile.characteristics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "radio.transmitter_present", value: false, confirmed: true }),
      expect.objectContaining({ id: "battery.present", value: true, confirmed: true }),
      expect.objectContaining({ id: "battery.capacity_ah", value: 5, unit: "ah", confirmed: true }),
    ]));
    expect(profile.characteristics).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "telecom.public_network_connection", confirmed: true }),
      expect.objectContaining({ id: "classification.wpc_entry", confirmed: true }),
    ]));
  });

  it("rejects unknown unit dimensions and asks for missing threshold facts", () => {
    expect(() => buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "laboratory transmitter" },
        { name: "trade_direction", value: "china_to_india" },
        { name: "radio.transmitter_present", value: "true" },
        { name: "radio.frequency_hz", value: "2 furlongs" },
      ],
      documents: [],
    })).toThrow(/unknown unit/i);

    const pending = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "laboratory transmitter" },
        { name: "trade_direction", value: "china_to_india" },
        { name: "radio.transmitter_present", value: "true" },
      ],
      documents: [],
    });
    expect(pending.unresolvedCharacteristicQuestions.join(" ")).toMatch(/frequency.*transmit power/i);
  });

  it("keeps classifications Pending unless claim, source and locator resolve together", () => {
    const facts = [
      { name: "product_description", value: "electronic controller" },
      { name: "trade_direction", value: "china_to_india" },
    ];
    const candidates = [{
      system: "ITC_HS" as const,
      codeOrEntry: "85176290",
      evidenceState: "admitted" as const,
      claimId: "claim-itc-1",
      sourceVersionId: "source-itc-1",
      exactLocator: "Schedule I, row 85176290",
      missingThresholdFacts: [],
    }];

    expect(buildElectronicsProfile({ confirmedFacts: facts, documents: [], classificationCandidates: candidates })
      .classificationCandidates[0]).toMatchObject({ evidenceState: "pending" });
    expect(buildElectronicsProfile({
      confirmedFacts: facts,
      documents: [],
      classificationCandidates: candidates,
      resolveClassificationProvenance: (candidate) => candidate.claimId === "claim-itc-1"
        && candidate.sourceVersionId === "source-itc-1"
        && candidate.exactLocator === "Schedule I, row 85176290",
    }).classificationCandidates[0]).toMatchObject({
      evidenceState: "admitted",
      claimId: "claim-itc-1",
      sourceVersionId: "source-itc-1",
      exactLocator: "Schedule I, row 85176290",
    });
  });

  it("does not leak confirmed traits or uploaded evidence across profiles", () => {
    const first = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "first controller" },
        { name: "trade_direction", value: "china_to_india" },
        { name: "battery.present", value: "true" },
      ],
      documents: [{ id: "invoice-first", documentType: "commercial_invoice", facts: [] }],
    });
    const second = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "second controller" },
        { name: "trade_direction", value: "china_to_india" },
      ],
      documents: [],
    });

    expect(first.characteristics).toContainEqual(expect.objectContaining({ id: "battery.present", value: true }));
    expect(second.characteristics).not.toContainEqual(expect.objectContaining({ id: "battery.present", confirmed: true }));
    expect(second.intake.purchaseEvidenceDocumentIds).toEqual([]);
  });

  it("uses only confirmed visible document facts and keeps their classification Pending", () => {
    const profile = buildElectronicsProfile({
      confirmedFacts: [
        { name: "product_description", value: "electronic measurement controller" },
        { name: "trade_direction", value: "china_to_india" },
        { name: "purchase_stage", value: "already_purchased" },
      ],
      documents: [{
        id: "invoice-reviewed",
        documentType: "commercial_invoice",
        facts: [
          { field: "modelIdentity", current: { reviewStatus: "confirmed", value: "MODEL-DOC-1" } },
          { field: "indiaTariffCode", current: { reviewStatus: "corrected", value: "90318000" } },
          { field: "endUse", current: { reviewStatus: "pending", value: "Do not use yet" } },
        ],
      }],
    });

    expect(profile.intake).toMatchObject({
      productModel: "MODEL-DOC-1",
      purchaseEvidenceDocumentIds: ["invoice-reviewed"],
    });
    expect(profile.intake.principalFunction).toBeUndefined();
    expect(profile.classificationCandidates).toContainEqual(expect.objectContaining({
      system: "ITC_HS",
      codeOrEntry: "90318000",
      evidenceState: "pending",
    }));
  });
});
