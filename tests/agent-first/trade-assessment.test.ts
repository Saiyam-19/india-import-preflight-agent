import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadRouterPack } from "@/knowledge";
import {
  assessTradeCase,
  calculateBorderCharges,
  classifyProduct,
  determineApplicableAuthorities,
  validateClaimBlocks,
  type IndiaImportAssessmentInput,
} from "@/server/assessment/india-import-assessment";
import { ConversationStore } from "@/server/conversations/conversation-store";
import { migrateAllStores } from "@/server/data/migrate";

const AS_OF = "2026-08-25";

async function completeInput(): Promise<IndiaImportAssessmentInput> {
  const pack = await loadRouterPack();
  return {
    assessmentDate: AS_OF,
    tradeDirection: "china_to_india",
    originCountryCode: "CN",
    destinationCountryCode: "IN",
    productFacts: {
      ...pack.scenario.includedFacts,
      modelIdentity: "Confirmed dual-band MIMO router model",
      manufacturerIdentity: "Confirmed manufacturer in China",
      adapterModelIdentity: "Confirmed external adapter model",
    },
    parties: {
      importerIdentity: "Confirmed Indian importer",
      producerIdentity: "Confirmed producer in China",
      exporterIdentity: "Confirmed exporter in China",
    },
    evidence: {
      wpc_eta: "present",
      bis_power_adapter: "present",
      mtcte_wifi_cpe: "present",
      repa_import_for_sale: "present",
      legal_metrology_labels: "present",
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
    },
  };
}

describe("BWMI-18 evidence-gated India import tools", () => {
  it("derives a case-specific India Applicable-Agency Checklist and fails closed to the manifest", async () => {
    const pack = await loadRouterPack();
    const input = await completeInput();
    const checklist = determineApplicableAuthorities(pack, input);

    expect(checklist.map((entry) => entry.agencyId)).toEqual([
      "india-customs-and-tariff",
      "india-foreign-trade",
      "india-wpc",
      "india-bis-adapter",
      "india-mtcte",
      "india-repa",
      "india-legal-metrology",
    ]);
    expect(checklist.every((entry) => entry.coverage === "complete")).toBe(true);
    expect(checklist.every((entry) => entry.sourceIds.length > 0)).toBe(true);

    const unavailable = determineApplicableAuthorities(pack, input, {
      connectorStates: { "india-wpc": "temporarily_unavailable" },
    });
    expect(unavailable.find((entry) => entry.agencyId === "india-wpc")).toMatchObject({
      coverage: "incomplete",
      blocker: expect.stringMatching(/temporarily unavailable/i),
    });
  });

  it("returns a Working Classification only for confirmed facts and candidates for ambiguity", async () => {
    const pack = await loadRouterPack();
    const input = await completeInput();
    const classification = classifyProduct(pack, input.productFacts);

    expect(classification).toMatchObject({
      status: "working_classification",
      hsCode: "85176290",
      nomenclature: expect.stringMatching(/reception.*transmission/i),
      reasoning: expect.arrayContaining([expect.stringMatching(/GRI 1/i), expect.stringMatching(/GRI 3\(b\)/i)]),
      excludedAlternatives: expect.arrayContaining([
        expect.objectContaining({ hsCode: "85176230", reason: expect.stringMatching(/modem/i) }),
      ]),
    });
    expect(classification.claims.every((claim) => claim.sourceVersionId && claim.locator)).toBe(true);

    const ambiguousFacts = { ...input.productFacts };
    delete ambiguousFacts.hasIntegratedModem;
    expect(classifyProduct(pack, ambiguousFacts)).toMatchObject({
      status: "classification_candidates",
      candidates: expect.arrayContaining([
        expect.objectContaining({ hsCode: "85176230" }),
        expect.objectContaining({ hsCode: "85176290" }),
      ]),
    });
  });

  it("calculates decimal-safe current border charges with ordered components and provenance", async () => {
    const pack = await loadRouterPack();
    const input = await completeInput();
    const classification = classifyProduct(pack, input.productFacts);
    const estimate = calculateBorderCharges(pack, classification, input.customsValue, {
      originCountryCode: input.originCountryCode,
      preferentialTariffClaim: input.preferentialTariffClaim,
      tradeRemedyCheck: input.tradeRemedyCheck,
      asOf: input.assessmentDate,
    });

    expect(estimate).toMatchObject({
      status: "available",
      currency: "INR",
      valuationDate: AS_OF,
      assessableValue: "100000.00",
      totalBorderCharges: "43960.00",
      formulaOrder: ["assessable_value", "basic_customs_duty", "aidc", "social_welfare_surcharge", "igst", "compensation_cess", "total_border_charges"],
      rounding: "Each displayed component is rounded to two decimal places using decimal half-up rounding.",
    });
    if (estimate.status !== "available") throw new Error("Border charges were unexpectedly withheld.");
    expect(JSON.stringify(estimate)).not.toMatch(/landed cost/i);
    expect(estimate.components.map((component) => component.amount)).toEqual([
      "100000.00",
      "20000.00",
      "0.00",
      "2000.00",
      "21960.00",
      "0.00",
      "43960.00",
    ]);
    expect(estimate.rateProvenance.every((rate) => rate.sourceIds.length > 0 && rate.effectiveFrom)).toBe(true);
  });

  it("withholds rates that were not yet effective on the assessment date", async () => {
    const pack = await loadRouterPack();
    const input = await completeInput();
    input.assessmentDate = "2025-08-25";
    input.customsValue.valuationDate = input.assessmentDate;

    const result = assessTradeCase(pack, input);

    expect(result).toMatchObject({
      state: "Assessment Incomplete",
      calculation: {
        status: "withheld",
        blockers: expect.arrayContaining([expect.stringMatching(/not effective/i)]),
      },
    });
  });

  it("renders the exact admitted rates used by the calculator instead of duplicated literals", async () => {
    const pack = structuredClone(await loadRouterPack());
    const bcd = pack.rates.find((rate) => rate.id === "basic_customs_duty");
    if (!bcd) throw new Error("The router pack is missing the BCD rate.");
    bcd.percent = 19;
    const input = await completeInput();
    const estimate = calculateBorderCharges(
      pack,
      classifyProduct(pack, input.productFacts),
      input.customsValue,
      {
        originCountryCode: input.originCountryCode,
        preferentialTariffClaim: input.preferentialTariffClaim,
        tradeRemedyCheck: input.tradeRemedyCheck,
        asOf: input.assessmentDate,
      },
    );

    expect(estimate).toMatchObject({
      status: "available",
      components: expect.arrayContaining([
        expect.objectContaining({
          id: "basic_customs_duty",
          amount: "19000.00",
          ratePercent: "19.00",
          formula: expect.stringContaining("19.00%"),
        }),
      ]),
    });
  });

  it("rejects absent, unknown, stale, provisional, conflicting, untranslated and scope-mismatched claim citations", async () => {
    const pack = await loadRouterPack();
    const valid = [{
      claimId: "classification",
      text: "The confirmed router facts map to tariff item 85176290.",
      sourceVersionId: "cbic-current-tariff-85176290",
      locator: "Printed page 1018 / PDF page 15, rows 851762, 85176230 and 85176290",
      appliesIn: "India" as const,
      tradeDirection: "china_to_india" as const,
    }];
    expect(validateClaimBlocks(valid, pack, { asOf: AS_OF })).toEqual(valid);

    for (const state of ["stale", "provisional", "conflicting", "untranslated", "scope_mismatched"] as const) {
      expect(() => validateClaimBlocks(valid, pack, {
        asOf: AS_OF,
        evidenceStates: { "cbic-current-tariff-85176290": state },
      })).toThrow(new RegExp(state.replace("_", " "), "i"));
    }
    expect(() => validateClaimBlocks([{ ...valid[0]!, locator: "invented locator" }], pack, { asOf: AS_OF })).toThrow(/locator/i);
    expect(() => validateClaimBlocks([{ ...valid[0]!, sourceVersionId: "unknown-source" }], pack, { asOf: AS_OF })).toThrow(/unknown/i);
    expect(() => validateClaimBlocks([{ ...valid[0]!, sourceVersionId: "" }], pack, { asOf: AS_OF })).toThrow(/absent/i);
  });

  it("returns only the four assessment states and keeps every incomplete journey fail closed", async () => {
    const pack = await loadRouterPack();
    const complete = await completeInput();
    const result = assessTradeCase(pack, complete);

    expect(result).toMatchObject({
      state: "Assessment Complete Within Verified Scope",
      checked: expect.arrayContaining(["India import classification", "India border charges"]),
      notChecked: expect.arrayContaining([expect.stringMatching(/China export-side controls/i)]),
      calculation: { status: "available" },
    });
    expect(result.snapshotId).toMatch(/^assessment-/);
    expect(result.claims.length).toBeGreaterThan(0);
    expect(result.checklist.every((entry) => result.claims.some((claim) => (
      claim.claimId === `agency-${entry.agencyId}` &&
      entry.sourceIds.some((sourceId) => sourceId === claim.sourceVersionId) &&
      Boolean(claim.url)
    )))).toBe(true);

    const guidanceOnly = structuredClone(complete);
    guidanceOnly.confirmations.productAndTransactionFactsConfirmed = false;
    expect(assessTradeCase(pack, guidanceOnly)).toMatchObject({
      state: "Research Guidance",
      classification: { status: "classification_candidates" },
      calculation: { status: "withheld" },
      claims: [],
    });

    const missing = structuredClone(complete);
    missing.parties.exporterIdentity = "";
    expect(assessTradeCase(pack, missing).state).toBe("Assessment Incomplete");

    const ambiguous = structuredClone(complete);
    delete ambiguous.productFacts.hasIntegratedModem;
    expect(assessTradeCase(pack, ambiguous).state).toBe("Assessment Incomplete");

    expect(assessTradeCase(pack, complete, {
      evidenceStates: { "cbic-current-tariff-85176290": "stale" },
    }).state).toBe("Assessment Incomplete");

    expect(assessTradeCase(pack, complete, {
      connectorStates: { "india-wpc": "temporarily_unavailable" },
    }).state).toBe("Assessment Incomplete");

    const action = structuredClone(complete);
    action.evidence.wpc_eta = "absent";
    expect(assessTradeCase(pack, action).state).toBe("Action Required");

    const possibleTradeRemedy = structuredClone(complete);
    possibleTradeRemedy.tradeRemedyCheck = "possible_match";
    expect(assessTradeCase(pack, possibleTradeRemedy)).toMatchObject({
      state: "Action Required",
      calculation: { status: "withheld" },
    });
  });

  it("records prompt, model and tool-version provenance inside every snapshot", async () => {
    const pack = await loadRouterPack();
    const result = assessTradeCase(pack, await completeInput());

    expect(result.executionProvenance).toEqual({
      mode: "deterministic_domain_tools",
      modelVersion: "not_used",
      promptVersion: "not_used",
      toolVersions: {
        assess_trade_case: "bwmi-18-v1",
        calculate_border_charges: "bwmi-18-v1",
        classify_product: "bwmi-18-v1",
        determine_applicable_authorities: "bwmi-18-v1",
      },
    });
  });

  it("persists immutable Assessment Snapshots without replacing prior results", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-18-snapshots-"));
    const { paths } = migrateAllStores({ rootDir });
    const store = new ConversationStore(paths.conversations);
    const conversation = store.createConversation("China-origin reference assessment");
    const tradeCase = store.createTradeCase(conversation.id, conversation.title);
    const pack = await loadRouterPack();
    const snapshot = assessTradeCase(pack, await completeInput());

    store.saveAssessmentSnapshot(tradeCase.id, snapshot);
    expect(store.getAssessmentSnapshots(tradeCase.id)).toEqual([snapshot]);
    expect(() => store.saveAssessmentSnapshot(tradeCase.id, snapshot)).toThrow(/immutable/i);
    store.close();
  });
});
