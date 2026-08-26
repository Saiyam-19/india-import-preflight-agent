import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  didDeepResearchTimeOut,
  POST as postChat,
  reconstructInterruptedResearchOutput,
  resolveChatExecutionMode,
} from "@/app/api/chat/route";
import { POST as postAssessment } from "@/app/api/assessments/route";
import { POST as postTradeCase } from "@/app/api/trade-cases/route";
import { bootstrapApplication } from "@/server/bootstrap";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("OPENROUTER_API_KEY", "");
  vi.stubEnv("BWMI_OPENAI_BASE_URL", "");
  vi.stubEnv("BWMI_OPENAI_MODEL", "");
});

function jsonRequest(path: string, body: unknown) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function ndjson(response: Response) {
  return (await response.text())
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

function expectCompleteInitialDossierContract(value: string | null) {
  expect(value).not.toBeNull();
  const text = value ?? "";
  for (const requiredText of [
    "Quantity, unit price and currency",
    "Origin and destination PIN/port",
    "Product URL, photo, model or datasheet",
    "Whether it is already purchased",
    "Invoice, bill or proof of purchase, if available",
    "Commercial or personal purpose",
    "Documents to prepare",
    "Classification and regulatory checks",
    "Exact policy paragraphs and page numbers",
    "Verified online forms",
    "Relevant points of contact",
    "Duties, costs, blockers and responsible owner",
    "Government submission portals",
    "verified link to the exact service/page",
    "documents uploaded there",
    "who must file",
    "login requirements",
    "fees/deadlines",
    "submission sequence",
    "If already purchased, I’ll switch from pre-order guidance to clearance/remediation guidance.",
    "never invent a portal or claim anything was submitted",
  ]) expect(text).toContain(requiredText);
}

function completeAssessmentPayload(tradeCaseId: string) {
  return {
    tradeCaseId,
    assessmentDate: "2026-08-25",
    modelIdentity: "TP-Link Archer AX12 (IN) 1.8",
    manufacturerIdentity: "TP-Link Technologies Co., Ltd.",
    adapterModelIdentity: "12 V DC / 1 A external adapter",
    importerIdentity: "TP-Link India Private Limited",
    producerIdentity: "TP-Link Technologies Co., Ltd.",
    exporterIdentity: "TP-Link Technologies Co., Ltd.",
    endUserIdentity: "Confirmed Indian retail distribution recipient",
    manufacturingSite: "Confirmed manufacturing site in China",
    originBasis: "Confirmed China manufacturing and assembly records",
    endUse: "Indoor residential Wi-Fi routing for retail customers in India",
    exportPort: "Yantian, Shenzhen, China",
    importPort: "Nhava Sheva, India",
    chinaTariffCode: "8517623690",
    wifiThroughputMbps: 1501,
    encryptedVpnThroughputGbps: 1,
    isCryptanalysisEquipment: false,
    isSpeciallyDesignedForControlledItem: false,
    itemValue: "99999.98",
    freight: "0.01",
    insurance: "0.01",
    hasIntegratedModem: false,
    tradeRemedyCheck: "confirmed_no_match",
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
    confirmations: {
      productProfileConfirmed: true,
      productAndTransactionFactsConfirmed: true,
      evidencePossessionConfirmed: true,
      datedTradeRemedyCheckConfirmed: true,
      chinaScreeningConfirmed: true,
      translationReviewConfirmed: true,
    },
  };
}

function indiaToChinaAssessmentPayload(tradeCaseId: string) {
  return {
    tradeCaseId,
    tradeDirection: "india_to_china",
    assessmentDate: "2026-08-25",
    modelIdentity: "Confirmed India-manufactured dual-band Wi-Fi router model",
    manufacturerIdentity: "Confirmed Indian manufacturer legal entity",
    productDescription: "New finished 2.4/5 GHz indoor MIMO Wi-Fi router",
    technicalSpecifications: "2.4/5 GHz Wi-Fi; routing principal function; no cellular, modem, battery or 6 GHz radio",
    indiaTariffCode: "85176290",
    chinaTariffCode: "8517623690",
    exporterIdentity: "Confirmed Indian exporter legal entity",
    producerIdentity: "Confirmed Indian producer legal entity",
    importerIdentity: "Confirmed China importer legal entity",
    endUserIdentity: "Confirmed China commercial end user",
    manufacturingSite: "Confirmed manufacturing site in India",
    originBasis: "Confirmed India manufacturing records and non-preferential origin basis",
    intendedUse: "Indoor civilian broadband routing for commercial distribution in China",
    endUse: "Indoor civilian broadband routing",
    exportPort: "Nhava Sheva, India",
    importPort: "Shanghai, China",
    destinationProvince: "Shanghai",
    itemValue: "99999.98",
    freight: "0.01",
    insurance: "0.01",
    basicDutyRatePercent: "10",
    importVatRatePercent: "13",
    consumptionTaxRatePercent: "0",
    tariffEffectiveFrom: "2026-01-01",
    tariffExactLocator: "2026 tariff row 8517623690, confirmed authority result",
    tariffAuthoritativeText: "税则号列8517623690及该案适用税率经海关税则查询结果确认。",
    tariffTranslationText: "The Customs tariff result confirms heading 8517623690 and the case-applicable rate.",
    tariffTranslationKind: "Derived Translation",
    tariffMaterialAmbiguity: null,
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

describe("agent-first routes", () => {
  it("uses bundled admitted guidance for a general reference even when AI is configured", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-instant-reference-")));
    vi.stubEnv("OPENAI_API_KEY", "test-only-not-a-provider-credential");
    vi.stubEnv("BWMI_OPENAI_MODEL", "gpt-5.6-sol");
    vi.stubGlobal("fetch", vi.fn(() => {
      throw new Error("The instant route must not call the provider.");
    }));

    const response = await postChat(jsonRequest("/api/chat", {
      question: "Do I need an IEC, and what baseline documents are listed for imports into India?",
    }));
    const events = await ndjson(response);
    const result = events.find((event) => event.type === "result") as {
      mode: string;
      output: { claims: unknown[]; summary: string };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    };

    expect(result.mode).toBe("instant_reference");
    expect(result.output.claims).toHaveLength(1);
    expect(result.output.summary).not.toMatch(/AI is unavailable/i);
    expect(result.tradeCase.confirmedFacts).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "trade_direction" }),
    ]));
  });

  it("persists shipment facts and returns the next instant pre-order question", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-instant-triage-")));
    vi.stubEnv("OPENAI_API_KEY", "test-only-not-a-provider-credential");
    vi.stubEnv("BWMI_OPENAI_MODEL", "gpt-5.6-sol");
    vi.stubGlobal("fetch", vi.fn(() => {
      throw new Error("The instant route must not call the provider.");
    }));

    const response = await postChat(jsonRequest("/api/chat", {
      question: "Before ordering, can I import a Wi-Fi router from China to India?",
    }));
    const result = (await ndjson(response)).find((event) => event.type === "result") as {
      mode: string;
      output: {
        confirmedFacts: Array<{ name: string; value: string }>;
        missingInformation: string[];
        nextQuestion: string | null;
        notChecked: string[];
        state: string;
        summary: string;
      };
      tradeCase: { messages: Array<{ content: string; role: string }> };
    };

    expect(result.mode).toBe("instant_preorder_triage");
    expect(result.output.state).toBe("assessment_incomplete");
    expect(result.output.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "trade_direction", value: "china_to_india" },
      expect.objectContaining({ name: "product_description" }),
    ]));
    expectCompleteInitialDossierContract(result.output.nextQuestion);
    expect(result.output.missingInformation.length).toBeGreaterThan(4);
    expect(result.tradeCase.messages.at(-1)).toMatchObject({
      role: "assistant",
      content: expect.stringMatching(/quantity.*price.*currency.*origin.*destination.*photo/is),
    });
    expect(result.output.notChecked.join(" ")).toMatch(/classification.*product-specific.*Customs/i);
    expect(result.output.summary).not.toMatch(/approved|compliant|will clear|AI is unavailable/i);
  });

  it("captures a grouped electronics intake and isolates a later contradiction", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-electronics-grouped-intake-")));
    const first = await postChat(jsonRequest("/api/chat", {
      question: "I am importing an electronic measurement controller from China to India; Already purchased 2 units at USD 49.50 each for commercial use; origin: Shenzhen 518000; destination: Mumbai 400001; model: MODEL-9; principal function: electrical measurement; product URL: https://example.test/model-9; specifications: 230 V input; Incoterm: CIF; freight: USD 12; insurance: USD 2; radio transmitter: no; battery present: no.",
    }));
    const firstEvents = await ndjson(first);
    const firstResult = firstEvents.find((event) => event.type === "result") as {
      output: {
        acceptedFacts: Array<{ name: string; value: string }>;
        electronicsProfile: {
          intake: Record<string, unknown>;
          characteristics: Array<{ confirmed: boolean; id: string; value: unknown }>;
          classificationCandidates: Array<{ evidenceState: string }>;
        };
      };
      tradeCase: { id: string };
    } | undefined;
    if (!firstResult) throw new Error(JSON.stringify(firstEvents));

    expect(firstResult.output.electronicsProfile.intake).toMatchObject({
      productDescription: "electronic measurement controller",
      quantity: "2",
      unitPrice: "49.50",
      currency: "USD",
      originLocation: "Shenzhen 518000",
      destinationLocation: "Mumbai 400001",
      productModel: "MODEL-9",
      principalFunction: "electrical measurement",
      purchaseStage: "already_purchased",
      purpose: "commercial",
      freight: "12",
      insurance: "2",
      incoterm: "CIF",
    });
    expect(firstResult.output.electronicsProfile.characteristics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "radio.transmitter_present", value: false, confirmed: true }),
      expect.objectContaining({ id: "battery.present", value: false, confirmed: true }),
    ]));
    expect(firstResult.output.electronicsProfile.classificationCandidates.every(
      (candidate) => candidate.evidenceState === "pending",
    )).toBe(true);

    const second = await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "quantity: 3",
    }));
    const secondResult = (await ndjson(second)).find((event) => event.type === "result") as {
      output: { actionDossier: unknown; electronicsProfile: { intake: { quantity: string } }; missingInformation: string[]; summary: string };
      tradeCase: { memoryItems: Array<{ key: string; status: string }> };
    };
    expect(secondResult.output.electronicsProfile.intake.quantity).toBe("2");
    expect(secondResult.output.actionDossier).toBeNull();
    expect(secondResult.output.summary).toMatch(/quantity.*saved.*2.*proposed.*3/is);
    expect(secondResult.output.missingInformation.join(" ")).toMatch(/keep.*saved.*replace.*proposed/i);
    expect(secondResult.tradeCase.memoryItems).toContainEqual(expect.objectContaining({
      key: "conflict:quantity",
      status: "active",
    }));

    const third = await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "quantity: 3; confirm this correction",
    }));
    const thirdResult = (await ndjson(third)).find((event) => event.type === "result") as {
      output: { electronicsProfile: { intake: { quantity: string } } };
      tradeCase: { memoryItems: Array<{ key: string; status: string }> };
    };
    expect(thirdResult.output.electronicsProfile.intake.quantity).toBe("3");
    expect(thirdResult.tradeCase.memoryItems).toContainEqual(expect.objectContaining({
      key: "conflict:quantity",
      status: "resolved",
    }));
  });

  it.each([
    { initial: "unit price: USD 49.50", correction: "Actually change the unit price to USD 55", key: "unit_price", saved: "49.50", proposed: "55" },
    { initial: "commercial purpose", correction: "Actually this is for personal use", key: "import_purpose", saved: "commercial", proposed: "personal" },
  ])("surfaces and blocks every material $key conflict until explicit resolution", async ({ initial, correction, key, saved, proposed }) => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), `bwmi-material-conflict-${key}-`)));
    const first = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: `I am importing an electronic controller from China to India; quantity: 2; ${initial}; origin: Shenzhen 518000; destination: Mumbai 400001; model: EC-1; principal function: electrical control; pre-purchase.`,
    })))).find((event) => event.type === "result") as { tradeCase: { id: string } };

    const conflict = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: first.tradeCase.id,
      question: correction,
    })))).find((event) => event.type === "result") as {
      output: { actionDossier: unknown; missingInformation: string[]; summary: string };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }>; memoryItems: Array<{ key: string; status: string }> };
    };
    expect(conflict.tradeCase.confirmedFacts).toContainEqual({ name: key, value: saved });
    expect(conflict.tradeCase.memoryItems).toContainEqual(expect.objectContaining({ key: `conflict:${key}`, status: "active" }));
    expect(conflict.output.actionDossier).toBeNull();
    expect(conflict.output.summary).toMatch(new RegExp(`${saved}.*${proposed}|${proposed}.*${saved}`, "is"));
    expect(conflict.output.missingInformation.join(" ")).toMatch(/keep.*saved.*replace.*proposed/i);

    const resolved = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: first.tradeCase.id,
      question: "Replace it with the proposed value.",
    })))).find((event) => event.type === "result") as {
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }>; memoryItems: Array<{ key: string; status: string }> };
    };
    expect(resolved.tradeCase.confirmedFacts).toContainEqual({ name: key, value: proposed });
    expect(resolved.tradeCase.memoryItems).toContainEqual(expect.objectContaining({ key: `conflict:${key}`, status: "resolved" }));
  });

  it("resolves a material conflict by explicitly keeping the saved value", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-keep-saved-conflict-")));
    const first = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "I am importing an electronic controller from China to India; quantity: 2; unit price: USD 49.50; commercial purpose.",
    })))).find((event) => event.type === "result") as { tradeCase: { id: string } };
    await ndjson(await postChat(jsonRequest("/api/chat", { tradeCaseId: first.tradeCase.id, question: "quantity: 3" })));
    const kept = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: first.tradeCase.id,
      question: "Keep the saved quantity of 2",
    })))).find((event) => event.type === "result") as {
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }>; memoryItems: Array<{ key: string; status: string }> };
    };
    expect(kept.tradeCase.confirmedFacts).toContainEqual({ name: "quantity", value: "2" });
    expect(kept.tradeCase.memoryItems).toContainEqual(expect.objectContaining({ key: "conflict:quantity", status: "resolved" }));
  });

  it("advances a saved case after a natural-language purchased-shipment answer", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-natural-purchased-")));
    const firstResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "Can I bring a handheld thermal camera from China into India?",
    })))).find((event) => event.type === "result") as {
      tradeCase: { id: string };
    };

    const secondEvents = await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "I bought 2 units for my business and paid USD 49.50 each. The supplier is in Shenzhen 518000 and delivery is to Mumbai 400001. It is model TC-2 and its job is measuring surface temperature. The datasheet specifies 230 V input. It has no radio transmitter or battery, has a camera, uses no encryption, comes retail packaged, and is not controlled or dual use. Shipping is CIF with USD 12 freight and USD 2 insurance.",
    })));
    const secondResult = secondEvents.find((event) => event.type === "result") as {
      output: {
        electronicsProfile: {
          intake: Record<string, unknown>;
          characteristics: Array<{ confirmed: boolean; id: string; value: unknown }>;
        };
        missingInformation: string[];
        journeyStage: string;
        acceptedFacts: Array<{ name: string; value: string }>;
        nextQuestion: string;
      };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    } | undefined;
    if (!secondResult) throw new Error(JSON.stringify(secondEvents));

    expect(secondResult.output.electronicsProfile.intake).toMatchObject({
      quantity: "2",
      unitPrice: "49.50",
      currency: "USD",
      originLocation: "Shenzhen 518000",
      destinationLocation: "Mumbai 400001",
      productModel: "TC-2",
      principalFunction: "measuring surface temperature",
      purchaseStage: "already_purchased",
      purpose: "commercial",
      incoterm: "CIF",
    });
    expect(secondResult.output.journeyStage).toBe("post_purchase_remediation");
    expect(secondResult.output.acceptedFacts).toEqual(expect.arrayContaining([
      { name: "purchase_stage", value: "already_purchased" },
      { name: "quantity", value: "2" },
      { name: "origin_location", value: "Shenzhen 518000" },
    ]));
    expect(secondResult.output.electronicsProfile.characteristics).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "radio.transmitter_present", value: false, confirmed: true }),
      expect.objectContaining({ id: "battery.present", value: false, confirmed: true }),
      expect.objectContaining({ id: "camera.present", value: true, confirmed: true }),
      expect.objectContaining({ id: "encryption.present", value: false, confirmed: true }),
      expect.objectContaining({ id: "packaging.retail_prepackaged", value: true, confirmed: true }),
      expect.objectContaining({ id: "end_use.controlled_or_dual_use", value: false, confirmed: true }),
    ]));
    expect(secondResult.output.missingInformation.join(" ")).not.toMatch(
      /quantity|unit price|origin postal|destination PIN|personal or commercial|freight|insurance|Incoterm/i,
    );
    expect(secondResult.output.nextQuestion).toMatch(/invoice|proof.of.purchase|shipment status|dispatch|transit|arriv/i);
  });

  it("continues a purchased case when proof is unavailable and makes acquisition an action instead of repeated intake", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-proof-unavailable-route-")));
    const result = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "I already purchased 20 Wi-Fi routers from China to India for commercial resale at USD 35 each. The supplier is in Shenzhen 518000 and delivery is to Mumbai 400001. Model AX3000, principal function: wireless internet routing; specifications: dual-band Wi-Fi. It is paid but not dispatched. The seller has not issued the invoice yet.",
    })))).find((event) => event.type === "result") as {
      output: {
        electronicsProfile: { intake: { purchaseEvidenceAvailability?: string } };
        missingInformation: string[];
        nextActions: string[];
        nextQuestion: string;
      };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    };

    expect(result.tradeCase.confirmedFacts).toContainEqual({ name: "purchase_evidence_availability", value: "unavailable" });
    expect(result.output.electronicsProfile.intake.purchaseEvidenceAvailability).toBe("unavailable");
    expect(result.output.missingInformation.join(" ")).not.toMatch(/invoice|bill|proof.of.purchase/i);
    expect(result.output.nextQuestion).not.toMatch(/provide.*invoice|provide.*proof.of.purchase/i);
    expect(result.output.nextActions.join(" ")).toMatch(/obtain.*invoice.*supplier.*customs filing/i);
  });

  it("reconstructs completed saved research truthfully after provider interruption", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-partial-research-fallback-")));
    const application = await bootstrapApplication();
    try {
      const conversation = application.conversationStore.createConversation("Interrupted research");
      const tradeCase = application.conversationStore.createTradeCase(conversation.id, "Interrupted research");
      application.conversationStore.confirmFact(tradeCase.id, "trade_direction", "china_to_india");
      application.conversationStore.confirmFact(tradeCase.id, "product_description", "industrial sensor gateway");
      const admitted = application.regulatoryStore.getReferenceEvidence(application.paths.sources);
      application.conversationStore.upsertMemoryItem(tradeCase.id, {
        key: "product-research:saved",
        kind: "product_research",
        status: "active",
        value: {
          recordId: "product-research:saved",
          productName: "industrial sensor gateway",
          sourceLabel: "Manufacturer specification page",
          sourceUrl: "https://manufacturer.example/gateway",
          specifications: [{ name: "interface", value: "Ethernet", whyMaterial: "Network function affects classification." }],
        },
      });
      application.conversationStore.upsertMemoryItem(tradeCase.id, {
        key: "admitted-claim:saved",
        kind: "admitted_claim",
        status: "active",
        value: {
          claimId: "claim:saved", sourceVersionId: admitted.sourceVersionId, text: admitted.excerpt,
          authority: admitted.authority, locator: admitted.locator, url: admitted.url,
          appliesIn: "India", productScope: "all goods — baseline import documents and IEC", regulatoryDomain: "baseline import documents", tradeDirection: "china_to_india",
        },
      });
      application.conversationStore.upsertMemoryItem(tradeCase.id, {
        key: "domain-finding:saved",
        kind: "domain_finding",
        status: "active",
        value: {
          findingId: "finding:saved", kind: "control", label: "Saved control", reason: "Backed by saved admitted claim.",
          productName: "industrial sensor gateway", tradeDirection: "china_to_india",
          status: "required_by_admitted_evidence", authority: "Official authority", claimIds: ["claim:saved"],
        },
      });
      application.conversationStore.upsertMemoryItem(tradeCase.id, {
        key: "admitted-claim:misleading-baseline",
        kind: "admitted_claim",
        status: "active",
        value: {
          claimId: "claim:misleading-baseline", sourceVersionId: admitted.sourceVersionId, text: admitted.excerpt,
          authority: admitted.authority, locator: admitted.locator, url: admitted.url,
          appliesIn: "India", productScope: "Wi-Fi router baseline requirements", regulatoryDomain: "baseline import documents", tradeDirection: "china_to_india",
        },
      });
      application.conversationStore.upsertMemoryItem(tradeCase.id, {
        key: "active-classification-candidates",
        kind: "classification_candidates",
        status: "active",
        value: {
          recordId: "classification:saved",
          productName: "industrial sensor gateway",
          candidates: [{ system: "HS", code: "8517", label: "Candidate communication apparatus", rationale: "Network interface", uncertainty: "Principal function unresolved" }],
          missingMaterialFacts: ["Principal function"],
          basis: "confirmed_facts_and_product_research",
          claimIds: [],
          factualBasis: [{ name: "product_description", value: "industrial sensor gateway" }],
          status: "candidate_to_verify",
        },
      });

      const output = reconstructInterruptedResearchOutput({
        conversationStore: application.conversationStore,
        regulatoryStore: application.regulatoryStore,
        tradeCaseId: tradeCase.id,
        summary: "Deep research was interrupted after some tools completed.",
        missingInformation: ["Retry the interrupted official-source checks later."],
      });

      expect(output.productResearch).toEqual([expect.objectContaining({ recordId: "product-research:saved" })]);
      expect(output.claims).toEqual([expect.objectContaining({ claimId: "claim:saved" })]);
      expect(output.claims).not.toContainEqual(expect.objectContaining({ claimId: "claim:misleading-baseline" }));
      expect(output.controls).toEqual([expect.objectContaining({ findingId: "finding:saved" })]);
      expect(output.classificationCandidates).toEqual([expect.objectContaining({ recordId: "classification:saved", status: "candidate_to_verify" })]);
      expect(output.checked.join(" ")).toMatch(/completed.*product specification research/i);
      expect(output.checked.join(" ")).toMatch(/admitted claim.*domain finding/i);
      expect(output.risks.join(" ")).toMatch(/interrupted.*partial/i);
      expect(output.notChecked.join(" ")).toMatch(/remaining.*agency.*document.*rate/i);

      application.conversationStore.confirmFact(tradeCase.id, "product_description", "industrial sensor gateway antenna");
      const corrected = reconstructInterruptedResearchOutput({
        conversationStore: application.conversationStore,
        regulatoryStore: application.regulatoryStore,
        tradeCaseId: tradeCase.id,
        summary: "Deep research was interrupted after the product correction.",
        missingInformation: ["Restart product-specific research for the corrected product."],
      });
      expect(corrected.productResearch).toEqual([]);
      expect(corrected.classificationCandidates).toEqual([]);
      expect(corrected.claims).toEqual([expect.objectContaining({ claimId: "claim:saved" })]);
      expect(corrected.controls).toEqual([]);
    } finally {
      application.conversationStore.close();
      application.regulatoryStore.close();
    }
  });

  it("keeps the full dossier hidden until technical research intake is complete", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-electronics-seam-")));

    const intakeResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "Before ordering, I want to import an electronic measurement controller from China to India.",
    })))).find((event) => event.type === "result") as {
      output: { missingInformation: string[]; nextQuestion: string };
      tradeCase: { id: string };
    };
    expectCompleteInitialDossierContract(intakeResult.output.nextQuestion);

    const dossierResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: intakeResult.tradeCase.id,
      question: "Confirm: 2 units at USD 49.50 each for commercial use; origin: Shenzhen 518000; destination: Mumbai 400001; model: MODEL-9; principal function: electrical measurement; product URL: https://example.test/model-9; specifications: 230 V input; pre-purchase; Incoterm: CIF; freight: USD 12; insurance: USD 2; radio transmitter: no; battery present: no.",
    })))).find((event) => event.type === "result") as {
      output: {
        actionDossier: null;
        journeyStage: string;
        electronicsProfile: { intake: { quantity: string; purpose: string } };
      };
      tradeCase: {
        assessmentSnapshots: Array<{ actionDossier?: unknown }>;
      };
    };

    expect(dossierResult.output.electronicsProfile.intake).toMatchObject({ quantity: "2", purpose: "commercial" });
    expect(dossierResult.output.journeyStage).toBe("pre_purchase_research");
    expect(dossierResult.output.actionDossier).toBeNull();
    expect(dossierResult.tradeCase.assessmentSnapshots.at(-1)?.actionDossier).toBeUndefined();
  });

  it("returns baseline documents and field-level government portal guidance for a complete router intake", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-complete-router-dossier-")));
    const question = "Before purchase, I want to import a Wi-Fi router from China to India. Quantity: 20; unit price: USD 35; origin: Shenzhen 518000; destination: Mumbai 400001; product model: AX3000; principal function: wireless internet routing; product URL: https://example.com/ax3000; technical specifications: dual-band 2.4 GHz and 5 GHz Wi-Fi; commercial purpose; product form: finished product; product condition: new; retail prepackaged: yes; radio transmitter: yes; radio frequency: 2.4 GHz; transmit power: 0.1 W; public network connection: yes; telecom interface: IP; battery present: no; external power supply: yes; input voltage: 230 V; rated output: 12 W; camera present: no; encryption present: yes; controlled or dual use: no; Incoterm: CIF; freight: USD 12; insurance: USD 2.";
    const result = (await ndjson(await postChat(jsonRequest("/api/chat", { question })))).find(
      (event) => event.type === "result",
    ) as {
      output: {
        actionDossier: {
          documents: Array<{ label: string; status: string }>;
          onlineForms: Array<{
            id: string;
            status: string;
            why: string;
            filingPortals: Array<{
              canonicalUrl: { value: string };
              unresolvedFields: string[];
            }>;
          }>;
        };
      };
    };

    expect(result.output.actionDossier.documents).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Transport document", status: "required" }),
      expect.objectContaining({ label: "Commercial Invoice cum Packing List", status: "required" }),
      expect.objectContaining({ label: "Bill of Entry", status: "required" }),
    ]));
    const wpcProcess = result.output.actionDossier.onlineForms.find(
      (item) => item.id === "filing-service-wpc-eta-process",
    );
    expect(wpcProcess).toMatchObject({
      status: "pending",
      filingPortals: [],
      why: expect.stringMatching(/Saral Sanchar.*URL.*Pending|filing destination.*Pending/i),
    });
    expect(result.output.actionDossier.onlineForms.flatMap((item) => item.filingPortals)
      .map((portal) => portal.canonicalUrl.value))
      .not.toContain("https://www.eservices.dot.gov.in/equipment-type-approval-eta");
  });

  it("selects deep research only when explicitly requested and available", () => {
    expect(resolveChatExecutionMode({
      aiAvailable: true,
      generalReferenceQuestion: false,
      requestedMode: "deep_research",
    })).toBe("agents_sdk_deep_research");
    expect(resolveChatExecutionMode({
      aiAvailable: false,
      generalReferenceQuestion: false,
      requestedMode: "deep_research",
    })).toBe("deep_research_unavailable");
    expect(resolveChatExecutionMode({
      aiAvailable: true,
      generalReferenceQuestion: true,
      requestedMode: "deep_research",
    })).toBe("instant_reference");
    expect(resolveChatExecutionMode({
      aiAvailable: true,
      generalReferenceQuestion: false,
      requestedMode: "instant",
    })).toBe("instant_preorder_triage");
  });

  it("recognises the route-owned timeout even when the provider wraps its abort error", async () => {
    const signal = AbortSignal.timeout(1);
    await new Promise((resolve) => setTimeout(resolve, 5));

    expect(didDeepResearchTimeOut(signal)).toBe(true);
    expect(didDeepResearchTimeOut(undefined)).toBe(false);
  });

  it("returns a bounded unavailable result for explicit deep research without a provider", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-deep-unavailable-")));

    const response = await postChat(jsonRequest("/api/chat", {
      mode: "deep_research",
      question: "Research product-specific controls for this industrial packing machine from China to India.",
    }));
    const result = (await ndjson(response)).find((event) => event.type === "result") as {
      mode: string;
      output: { claims: unknown[]; state: string; summary: string };
    };

    expect(result.mode).toBe("deep_research_unavailable");
    expect(result.output.state).toBe("assessment_incomplete");
    expect(result.output.claims).toEqual([]);
    expect(result.output.summary).toMatch(/deep research.*unavailable/i);
  });

  it("starts a persistent conversation from an arbitrary question without an explicit Trade Case", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-21-chat-first-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const response = await postChat(
      jsonRequest("/api/chat", { question: "What rules apply to this router?" }),
    );
    const events = await ndjson(response);
    const result = events.find((event) => event.type === "result") as {
      mode: string;
      output: { missingInformation: string[]; state: string };
      tradeCase: {
        confirmedFacts: Array<{ name: string; value: string }>;
        id: string;
        messages: Array<{ content: string; role: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(result.mode).toBe("instant_preorder_triage");
    expect(result.output.state).toBe("assessment_incomplete");
    expect(result.tradeCase.id).toMatch(/^[0-9a-f-]{36}$/i);
    expect(result.tradeCase.confirmedFacts).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "trade_direction" }),
    ]));
    expect(result.tradeCase.messages).toEqual([
      expect.objectContaining({ role: "user", content: "What rules apply to this router?" }),
      expect.objectContaining({
        role: "assistant",
        content: expect.stringMatching(/China to India.*India to China/i),
      }),
    ]);
  });

  it("automatically scopes a new conversation when the direction is clear", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-21-auto-scope-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const response = await postChat(jsonRequest("/api/chat", {
      question: "Can I import this Wi-Fi router from China to India?",
    }));
    const events = await ndjson(response);
    const result = events.find((event) => event.type === "result") as {
      tradeCase: {
        confirmedFacts: Array<{ name: string; value: string }>;
        messages: Array<{ content: string; role: string }>;
      };
    };

    expect(response.status).toBe(200);
    expect(result.tradeCase.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "origin_country", value: "China" },
      { name: "destination_country", value: "India" },
      { name: "trade_direction", value: "china_to_india" },
    ]));
    expect(result.tradeCase.messages.at(0)).toMatchObject({ role: "user" });
    expect(result.tradeCase.messages.at(-1)).toMatchObject({ role: "assistant" });
  });

  it("persists natural China-to-India wording across turns without repeating an answered direction question", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-22-natural-direction-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const first = await postChat(jsonRequest("/api/chat", {
      question: "What documents or procedure i have to do to import bluetooth headphones from china",
    }));
    const firstResult = (await ndjson(first)).find((event) => event.type === "result") as {
      tradeCase: { id: string };
    };
    const second = await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "yes, i am importing goods from china",
    }));
    const secondResult = (await ndjson(second)).find((event) => event.type === "result") as {
      output: { summary: string };
      tradeCase: {
        confirmedFacts: Array<{ name: string; value: string }>;
        messages: Array<{ content: string; role: string }>;
      };
    };

    expect(secondResult.tradeCase.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "origin_country", value: "China" },
      { name: "destination_country", value: "India" },
      { name: "trade_direction", value: "china_to_india" },
    ]));
    expect(secondResult.output.summary).not.toMatch(/Are you importing from China into India/i);
    expect(secondResult.tradeCase.messages.filter((message) =>
      /Are you importing from China into India/i.test(message.content),
    )).toHaveLength(0);
  });

  it("keeps the confirmed lane when a later message contradicts it and asks about the actual conflict", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-22-direction-conflict-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const firstResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "I am importing headphones from China",
    })))).find((event) => event.type === "result") as { tradeCase: { id: string } };
    const conflictResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "Actually this shipment is exported from India to China",
    })))).find((event) => event.type === "result") as {
      output: { missingInformation: string[]; summary: string };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    };

    expect(conflictResult.tradeCase.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "origin_country", value: "China" },
      { name: "destination_country", value: "India" },
      { name: "trade_direction", value: "china_to_india" },
    ]));
    expect(conflictResult.output.summary).toMatch(/China to India saved.*latest message.*India to China/i);
    expect(conflictResult.output.missingInformation.join(" ")).toMatch(/conflicting shipment direction/i);
  });

  it("keeps an unresolved direction conflict blocking later turns and the reload snapshot", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-persistent-direction-conflict-")));
    const first = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "Can I import a Wi-Fi router from China to India?",
    })))).find((event) => event.type === "result") as { tradeCase: { id: string } };
    await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: first.tradeCase.id,
      question: "Actually export this Wi-Fi router from India to China.",
    })));
    const later = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: first.tradeCase.id,
      question: "It is model AX3000 and costs USD 35.",
    })))).find((event) => event.type === "result") as {
      mode: string;
      output: { actionDossier: unknown; summary: string };
      tradeCase: { assessmentSnapshots: Array<{ actionDossier?: unknown; summary?: string }> };
    };

    expect(later.mode).toBe("conflict_resolution");
    expect(later.output.summary).toMatch(/China to India.*India to China.*not overwritten/i);
    expect(later.output.actionDossier).toBeNull();
    expect(later.tradeCase.assessmentSnapshots.at(-1)).toMatchObject({
      summary: expect.stringMatching(/China to India.*India to China/i),
    });
    expect(later.tradeCase.assessmentSnapshots.at(-1)?.actionDossier).toBeUndefined();
  });

  it("surfaces an explicit product change instead of researching the saved product", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-product-conflict-")));
    const first = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "Can I import a Wi-Fi router from China to India?",
    })))).find((event) => event.type === "result") as { tradeCase: { id: string } };
    const changed = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: first.tradeCase.id,
      question: "Actually the product is a thermal camera from China to India.",
    })))).find((event) => event.type === "result") as {
      mode: string;
      output: { actionDossier: unknown; summary: string };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    };

    expect(changed.mode).toBe("conflict_resolution");
    expect(changed.output.summary).toMatch(/product description.*Wi-Fi router.*thermal camera/i);
    expect(changed.output.actionDossier).toBeNull();
    expect(changed.tradeCase.confirmedFacts).toContainEqual({ name: "product_description", value: "Wi-Fi router" });
  });

  it("versions an explicit direction correction after presenting the conflict", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-direction-correction-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const firstResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "I am importing a USB-C oscilloscope from China to India",
    })))).find((event) => event.type === "result") as { tradeCase: { id: string } };
    await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "Actually this shipment is exported from India to China",
    })));
    const correctedResult = (await ndjson(await postChat(jsonRequest("/api/chat", {
      tradeCaseId: firstResult.tradeCase.id,
      question: "Use India to China",
    })))).find((event) => event.type === "result") as {
      tradeCase: {
        confirmedFacts: Array<{ name: string; value: string }>;
        memoryItems: Array<{ key: string; status: string }>;
      };
    };

    expect(correctedResult.tradeCase.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "origin_country", value: "India" },
      { name: "destination_country", value: "China" },
      { name: "trade_direction", value: "india_to_china" },
    ]));
    expect(correctedResult.tradeCase.memoryItems).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "conflict:trade_direction", status: "resolved" }),
    ]));
  });

  it.each([
    "USB-C thermal imaging module",
    "gallium nitride bench power supply",
    "LoRa soil moisture telemetry node",
    "electronic paper shelf label controller",
  ])("persists an arbitrary unseen electronics product without fixture leakage: %s", async (product) => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-unseen-product-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const result = (await ndjson(await postChat(jsonRequest("/api/chat", {
      question: `Before ordering, can I import ${product} from China to India?`,
    })))).find((event) => event.type === "result") as {
      output: { summary: string };
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    };

    expect(result.tradeCase.confirmedFacts).toContainEqual({ name: "product_description", value: product });
    expect(JSON.stringify(result)).not.toMatch(/Archer AX12|85176290|Wi-Fi router|bluetooth headphones/i);
    expect(result.output.summary).toContain(product);
  });

  it("runs and stores the evidence-gated China-origin India import reference assessment", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-18-route-assessment-")));
    const caseResponse = await postTradeCase(
      jsonRequest("/api/trade-cases", { title: "China-origin router assessment" }),
    );
    const created = await caseResponse.json();
    const response = await postAssessment(jsonRequest("/api/assessments", completeAssessmentPayload(created.tradeCase.id)));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.assessment).toMatchObject({
      state: "Assessment Incomplete",
      preparation: {
        status: "Documents required",
        authenticityStatus: "unverified",
        filingStatus: "not_filed",
      },
      calculation: { status: "available", totalBorderCharges: "43960.00" },
      notChecked: expect.arrayContaining([
        expect.stringMatching(/China Single Window.*login/i),
        expect.stringMatching(/statutory-inspection catalogue row/i),
        expect.stringMatching(/restricted-party result/i),
      ]),
      blockers: expect.arrayContaining([
        expect.stringMatching(/Evidence status is unresolved: wpc_eta/i),
      ]),
    });
    expect(body.tradeCase.assessmentSnapshots).toHaveLength(1);
    expect(body.tradeCase.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "product_profile_id", value: "tp-link-archer-ax12-in-1-8" },
      { name: "product_profile_confirmed_at", value: "2026-08-25T00:00:00.000Z" },
    ]));
    expect(body.tradeCase.sourceReferences).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceVersionId: "tp-link-archer-ax12-in-1-8" }),
    ]));
    expect(body.tradeCase.toolReferences.map((entry: { toolName: string }) => entry.toolName)).toEqual(
      expect.arrayContaining([
        "determine_applicable_authorities",
        "determine_china_export_authorities",
        "classify_product",
        "screen_china_export_controls",
        "validate_china_translation",
        "calculate_border_charges",
        "assess_trade_case",
      ]),
    );
  });

  it("does not persist or cite the Archer profile when the client confirms an unsupported model", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-20-route-profile-mismatch-")));
    const caseResponse = await postTradeCase(
      jsonRequest("/api/trade-cases", { title: "Unsupported router profile confirmation" }),
    );
    const created = await caseResponse.json();
    const response = await postAssessment(jsonRequest("/api/assessments", {
      ...completeAssessmentPayload(created.tradeCase.id),
      modelIdentity: "Generic dual-band router",
      confirmations: {
        ...completeAssessmentPayload(created.tradeCase.id).confirmations,
        productProfileConfirmed: true,
      },
    }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/exact admitted Archer AX12.*reference profile.*\/api\/chat/i);
  });

  it("does not apply the legacy India-to-China router pack to an arbitrary product", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-legacy-cross-product-")));
    const created = await (await postTradeCase(
      jsonRequest("/api/trade-cases", { title: "Arbitrary legacy endpoint request" }),
    )).json();
    const response = await postAssessment(jsonRequest("/api/assessments", {
      ...indiaToChinaAssessmentPayload(created.tradeCase.id),
      modelIdentity: "Optical spectroscopy controller",
      productDescription: "Modular optical spectroscopy controller board",
      technicalSpecifications: "Board-level optical detector controller with USB-C interface",
    }));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toMatch(/limited.*Wi-Fi-router reference profile.*\/api\/chat/i);
    expect(JSON.stringify(body)).not.toMatch(/CCC|radio type approval|8517623690/);
  });

  it("keeps ambiguous, stale and unavailable-connector assessment requests visibly incomplete", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-18-route-gaps-")));
    const caseResponse = await postTradeCase(
      jsonRequest("/api/trade-cases", { title: "Fail-closed assessment" }),
    );
    const created = await caseResponse.json();
    const base = { ...completeAssessmentPayload(created.tradeCase.id), hasIntegratedModem: null };

    const ambiguous = await (await postAssessment(jsonRequest("/api/assessments", base))).json();
    expect(ambiguous.assessment).toMatchObject({
      state: "Assessment Incomplete",
      classification: { status: "classification_candidates" },
      calculation: { status: "withheld" },
    });

    const stale = await (await postAssessment(jsonRequest("/api/assessments", {
      ...base,
      hasIntegratedModem: false,
      assessmentDate: "2026-10-01",
    }))).json();
    expect(stale.assessment.state).toBe("Assessment Incomplete");
    expect(stale.assessment.blockers.join(" ")).toMatch(/stale|review/i);

    vi.stubEnv("BWMI_WPC_CONNECTOR_STATE", "temporarily_unavailable");
    const unavailable = await (await postAssessment(jsonRequest("/api/assessments", {
      ...base,
      hasIntegratedModem: false,
    }))).json();
    expect(unavailable.assessment.state).toBe("Assessment Incomplete");
    expect(unavailable.assessment.blockers.join(" ")).toMatch(/temporarily unavailable/i);
  });

  it("uses instant admitted reference guidance when no AI provider is configured", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-16-routes-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const caseResponse = await postTradeCase(
      jsonRequest("/api/trade-cases", { title: "First India import" }),
    );
    const created = await caseResponse.json();
    const chatResponse = await postChat(
      jsonRequest("/api/chat", {
        tradeCaseId: created.tradeCase.id,
        question: "Do I need an IEC, and what baseline documents are listed for an import into India?",
      }),
    );
    const events = await ndjson(chatResponse);
    const activities = events.filter((event) => event.type === "activity");
    const body = events.find((event) => event.type === "result") as {
      ai: unknown;
      mode: string;
      tradeCase: { messages: Array<{ role: string; citations: Array<{ url: string }> }> };
    };

    expect(caseResponse.status).toBe(201);
    expect(created.tradeCase.confirmedFacts).toEqual([
      { name: "destination_country", value: "India" },
      { name: "origin_country", value: "China" },
      { name: "trade_direction", value: "china_to_india" },
    ]);
    expect(chatResponse.status).toBe(200);
    expect(chatResponse.headers.get("content-type")).toContain("application/x-ndjson");
    expect(chatResponse.headers.get("cache-control")).toBe("no-store");
    expect(activities).toEqual([
      expect.objectContaining({ phase: "checking", status: "started" }),
      expect.objectContaining({ phase: "checking", status: "completed" }),
    ]);
    expect(JSON.stringify(activities)).not.toMatch(/IEC is|Bill of Entry|compliant|permitted/i);
    expect(body.mode).toBe("instant_reference");
    expect(body.ai).toEqual({
      available: false,
      message: "AI integration unavailable",
    });
    expect(body.tradeCase.messages.at(-1)).toMatchObject({
      role: "assistant",
      content: expect.stringMatching(/bundled admitted DGFT reference/i),
      citations: [expect.objectContaining({ url: expect.stringMatching(/^https:\/\//) })],
    });
    expect(events.at(-1)?.type).toBe("result");
  });

  it("answers a general import-document question without inventing shipment direction or product facts", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-general-no-case-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("BWMI_OPENAI_MODEL", "");

    const events = await ndjson(await postChat(jsonRequest("/api/chat", {
      question: "What documents are generally needed for imports into India?",
    })));
    const result = events.find((event) => event.type === "result") as {
      mode: string;
      tradeCase: { confirmedFacts: Array<{ name: string; value: string }> };
    };

    expect(result.mode).toBe("instant_reference");
    expect(result.tradeCase.confirmedFacts).toEqual([]);
  });

  it("creates and stores the fail-closed India-to-China route assessment without cross-case leakage", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-21-india-to-china-route-")));
    const caseResponse = await postTradeCase(
      jsonRequest("/api/trade-cases", {
        title: "India to China export",
        tradeDirection: "india_to_china",
      }),
    );
    const created = await caseResponse.json();
    const otherCaseResponse = await postTradeCase(jsonRequest("/api/trade-cases", { title: "Separate China to India case" }));
    const otherCase = await otherCaseResponse.json();
    const response = await postAssessment(jsonRequest("/api/assessments", indiaToChinaAssessmentPayload(created.tradeCase.id)));
    const body = await response.json();

    expect(caseResponse.status).toBe(201);
    expect(created.tradeCase.confirmedFacts).toEqual([
      { name: "destination_country", value: "China" },
      { name: "origin_country", value: "India" },
      { name: "trade_direction", value: "india_to_china" },
    ]);
    expect(response.status).toBe(200);
    expect(body.assessment).toMatchObject({
      tradeDirection: "india_to_china",
      state: "Assessment Incomplete",
      preparation: { status: "Documents required" },
      calculation: { status: "withheld" },
      blockers: expect.arrayContaining([
        expect.stringMatching(/india_exporter_iec/i),
        expect.stringMatching(/china_product_market_access_screening/i),
      ]),
      notChecked: expect.arrayContaining([
        expect.stringMatching(/ICEGATE.*login/i),
        expect.stringMatching(/China Single Window.*login/i),
      ]),
    });
    expect(body.tradeCase.assessmentSnapshots).toHaveLength(1);
    expect(body.tradeCase.confirmedFacts).toEqual(expect.arrayContaining([
      { name: "india_tariff_code", value: "85176290" },
      { name: "china_tariff_code", value: "8517623690" },
      { name: "destination_province", value: "Shanghai" },
    ]));
    expect(body.tradeCase.toolReferences.map((entry: { toolName: string }) => entry.toolName)).toEqual(expect.arrayContaining([
      "determine_india_export_authorities",
      "determine_china_import_authorities",
      "calculate_china_border_charges",
      "assess_india_to_china_trade_case",
    ]));
    expect(body.tradeCase.sourceReferences.some((entry: { sourceVersionId: string }) => entry.sourceVersionId.startsWith("dgft-"))).toBe(true);
    expect(body.tradeCase.sourceReferences.some((entry: { sourceVersionId: string }) => entry.sourceVersionId.startsWith("prc-") || entry.sourceVersionId.startsWith("miit-"))).toBe(true);
    expect(otherCase.tradeCase.assessmentSnapshots).toEqual([]);
    expect(otherCase.tradeCase.confirmedFacts).not.toEqual(expect.arrayContaining([
      { name: "india_tariff_code", value: "85176290" },
    ]));
  });

  it("returns an explicit instant incomplete result for an uncovered product question", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-17-incomplete-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    const caseResponse = await postTradeCase(
      jsonRequest("/api/trade-cases", { title: "India-China product research" }),
    );
    const created = await caseResponse.json();
    const response = await postChat(
      jsonRequest("/api/chat", {
        tradeCaseId: created.tradeCase.id,
        question: "What product controls apply to this new machine?",
      }),
    );
    const events = await ndjson(response);
    const result = events.find((event) => event.type === "result") as {
      output: { state: string; claims: unknown[]; missingInformation: string[] };
    };
    expect(result.output.state).toBe("assessment_incomplete");
    expect(result.output.claims).toHaveLength(1);
    expect(result.output.missingInformation.join(" ")).toMatch(/exact make|principal function|actual product/i);
  });

  it("rejects a supplied unknown case instead of falling back to another conversation", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-16-no-fallback-")));
    vi.stubEnv("OPENAI_API_KEY", "");

    const response = await postChat(
      jsonRequest("/api/chat", {
        tradeCaseId: "00000000-0000-4000-8000-000000000001",
        question: "Do I need an IEC?",
      }),
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatch(/does not exist|cross-case/i);
  });
});
