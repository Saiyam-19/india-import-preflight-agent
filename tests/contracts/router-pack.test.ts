import { describe, expect, it } from "vitest";

import {
  assessPackAdmission,
  canProducePublicLegalResult,
  evaluateRouterFixture,
  getPublicRuntimePacks,
  loadRouterPack,
  matchRouterScenario,
} from "@/knowledge";

describe("router pack admission", () => {
  it("admits only a pack with all required admission evidence", async () => {
    const pack = await loadRouterPack();
    const result = assessPackAdmission(pack);

    expect(result.failures).toEqual([]);
    expect(result.admitted).toBe(true);
  });

  it("requires three reviewed fixture outcomes", async () => {
    const pack = await loadRouterPack();

    expect(pack.fixtures.map((fixture) => fixture.expectedOutcome).sort()).toEqual([
      "blocked",
      "needs_verification",
      "ready",
    ]);
  });

  it("admits an exact, high-confidence HS mapping and rejects adjacent products", async () => {
    const pack = await loadRouterPack();

    expect(pack.scenario.includedFacts).toMatchObject({
      condition: "new",
      deviceType: "wifi_cpe_router",
      hasCellularRadio: false,
      hasIntegratedModem: false,
      hasIntegratedWifiAccessPoint: true,
      hasOtherRadio: false,
      hasSixGhzRadio: false,
      intendedUse: "indoor_retail_resale",
      isCloudImplementedOrManaged: false,
      maxAntennaGainDbi: 6,
      radioBandsGhz: ["2.4", "5"],
      wirelessTopology: "indoor_non_point_to_point",
      wifiSpatialMode: "mimo",
    });
    expect(pack.hsMapping).toMatchObject({
      confidence: "high",
      hsCode: "85176290",
      provenance: "admitted_mapping",
    });

    expect(matchRouterScenario(pack.scenario, pack.fixtures[0]!.facts.scenario)).toEqual({
      matched: true,
      mismatches: [],
    });

    const sixGhzVariant = {
      ...pack.fixtures[0]!.facts.scenario,
      hasSixGhzRadio: true,
      radioBandsGhz: ["2.4", "5", "6"],
    };
    expect(matchRouterScenario(pack.scenario, sixGhzVariant).matched).toBe(false);

    const cellularVariant = {
      ...pack.fixtures[0]!.facts.scenario,
      hasCellularRadio: true,
    };
    expect(matchRouterScenario(pack.scenario, cellularVariant).matched).toBe(false);

    const sisoVariant = {
      ...pack.fixtures[0]!.facts.scenario,
      wifiSpatialMode: "siso",
    };
    expect(matchRouterScenario(pack.scenario, sisoVariant).matched).toBe(false);

    const ambiguousVariant = { ...pack.fixtures[0]!.facts.scenario };
    delete ambiguousVariant.modelIdentity;
    expect(matchRouterScenario(pack.scenario, ambiguousVariant).matched).toBe(false);
  });

  it("pins every current source, rule, rate, and clearance effect to primary official evidence", async () => {
    const pack = await loadRouterPack();

    expect(pack.sources.length).toBeGreaterThanOrEqual(8);
    for (const source of pack.sources) {
      expect(source.authority).not.toBe("");
      expect(source.official).toBe(true);
      expect(new URL(source.url).protocol).toBe("https:");
      expect(new URL(source.url).hostname).toMatch(/(?:gov|nic)\.in$/);
      expect(source.pinpoint.locator).not.toBe("");
      expect(source.effectiveFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(source.lastChecked).toBe("2026-08-24");
      expect(source.reviewAfter > source.lastChecked).toBe(true);
    }

    for (const rule of pack.rules) {
      expect(rule.applicability.length).toBeGreaterThan(0);
      expect(rule.requiredEvidence.length).toBeGreaterThan(0);
      expect(rule.consequence).not.toBe("");
      expect(rule.remediation.length).toBeGreaterThan(0);
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      if (rule.clearanceEffect !== "non_clearance") {
        expect(rule.clearanceProof).toMatchObject({ sourceId: expect.any(String) });
        expect(rule.clearanceProof?.pinpoint).not.toBe("");
      }
    }

    expect(
      pack.rules.map(({ id, clearanceEffect }) => ({ id, clearanceEffect })),
    ).toEqual([
      { clearanceEffect: "conditions_clearance", id: "wpc_eta" },
      { clearanceEffect: "conditions_clearance", id: "bis_power_adapter" },
      { clearanceEffect: "non_clearance", id: "mtcte_wifi_cpe" },
      { clearanceEffect: "non_clearance", id: "repa_import_for_sale" },
      { clearanceEffect: "non_clearance", id: "legal_metrology_labels" },
    ]);
    expect(pack.rules.find((rule) => rule.id === "wpc_eta")!.requiredEvidence).toContain(
      "Signed or system-generated WPC import undertaking",
    );

    expect(pack.rates.map(({ id, percent, base }) => ({ id, percent, base }))).toEqual([
      { base: "assessable_value", id: "basic_customs_duty", percent: 20 },
      {
        base: "assessable_value",
        id: "agriculture_infrastructure_development_cess",
        percent: 0,
      },
      { base: "basic_customs_duty", id: "social_welfare_surcharge", percent: 10 },
      { base: "assessable_value_plus_bcd_plus_sws", id: "igst", percent: 18 },
      { base: "assessable_value", id: "gst_compensation_cess", percent: 0 },
    ]);
    expect(
      pack.rates.find((rate) => rate.id === "basic_customs_duty")!.determination,
    ).toContain("Conservative inference");
  });

  it("recomputes Ready, Blocked, and Needs verification fixtures independently", async () => {
    const pack = await loadRouterPack();

    for (const fixture of pack.fixtures) {
      const evaluated = evaluateRouterFixture(pack, fixture.facts);
      expect(evaluated.outcome).toBe(fixture.expectedOutcome);
      expect(evaluated.customsClearanceBlocked).toBe(
        fixture.expectedCustomsClearanceBlocked,
      );
      expect(evaluated.findings).toEqual(fixture.findings);
      expect(evaluated.costLines).toEqual(fixture.costLines);
      expect(fixture.sourceIds.length).toBeGreaterThan(0);
      expect(fixture.actions.length).toBeGreaterThan(0);
      expect(fixture.reviewedAt).toBe("2026-08-24");
    }

    const readyFacts = pack.fixtures.find(
      (fixture) => fixture.expectedOutcome === "ready",
    )!.facts;
    const needsVerificationFacts = pack.fixtures.find(
      (fixture) => fixture.expectedOutcome === "needs_verification",
    )!.facts;
    expect(readyFacts.originCountryCode).toBe("VN");
    expect(readyFacts.producerIdentity).not.toBeNull();
    expect(readyFacts.exporterIdentity).not.toBeNull();
    expect(readyFacts.tradeRemedyCheck).toBe("confirmed_no_match");
    expect(needsVerificationFacts.originCountryCode).toBeNull();
    expect(needsVerificationFacts.producerIdentity).toBeNull();
    expect(needsVerificationFacts.exporterIdentity).toBeNull();
    expect(needsVerificationFacts.tradeRemedyCheck).toBe("unknown");

    const ready = pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!;
    expect(ready.costLines).toEqual([
      { amountInr: "100000.00", id: "assessable_value" },
      { amountInr: "20000.00", id: "basic_customs_duty" },
      { amountInr: "0.00", id: "agriculture_infrastructure_development_cess" },
      { amountInr: "2000.00", id: "social_welfare_surcharge" },
      { amountInr: "21960.00", id: "igst" },
      { amountInr: "0.00", id: "gst_compensation_cess" },
      { amountInr: "43960.00", id: "total_import_duties" },
    ]);
  });

  it("does not turn non-clearance obligations into customs blockers", async () => {
    const pack = await loadRouterPack();
    const ready = structuredClone(
      pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!.facts,
    );
    ready.evidence.legal_metrology_labels = "absent";

    const result = evaluateRouterFixture(pack, ready);

    expect(result.outcome).toBe("ready");
    expect(result.customsClearanceBlocked).toBe(false);
    expect(result.findings).toContain("legal_metrology_labels:non_clearance:absent");

    const missingRepa = structuredClone(
      pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!.facts,
    );
    missingRepa.evidence.repa_import_for_sale = "absent";
    const repaResult = evaluateRouterFixture(pack, missingRepa);
    expect(repaResult.outcome).toBe("blocked");
    expect(repaResult.customsClearanceBlocked).toBe(false);
    expect(repaResult.findings).toContain("repa_import_for_sale:non_clearance:absent");
  });

  it("fails trade-remedy assessment closed when origin is missing", async () => {
    const pack = await loadRouterPack();
    const ready = structuredClone(
      pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!.facts,
    );
    ready.originCountryCode = null;

    const result = evaluateRouterFixture(pack, ready);

    expect(result.outcome).toBe("needs_verification");
    expect(result.customsClearanceBlocked).toBe(false);
  });

  it("keeps source-admitted knowledge out of the public runtime", async () => {
    const pack = await loadRouterPack();

    expect(pack.lifecycleStatus).toBe("source_admitted");
    expect(pack.selectable).toBe(false);
    expect(pack.publicRuntimeEnabled).toBe(false);
    expect(canProducePublicLegalResult(pack)).toBe(false);
    expect(getPublicRuntimePacks([pack])).toEqual([]);
  });

  it("fails closed when admission evidence or runtime guards are weakened", async () => {
    const pack = await loadRouterPack();

    const missingPinpoint = structuredClone(pack);
    missingPinpoint.sources[0]!.pinpoint.locator = "";
    expect(assessPackAdmission(missingPinpoint).failures).toContain(
      `sources.${missingPinpoint.sources[0]!.id}.pinpoint`,
    );

    const expiredReview = structuredClone(pack);
    expiredReview.sources[0]!.reviewAfter = "2026-08-23";
    expect(assessPackAdmission(expiredReview).failures).toContain(
      `sources.${expiredReview.sources[0]!.id}.review`,
    );

    const publicPack = structuredClone(pack);
    publicPack.selectable = true;
    publicPack.publicRuntimeEnabled = true;
    expect(assessPackAdmission(publicPack).admitted).toBe(false);

    const missingOutcome = structuredClone(pack);
    missingOutcome.fixtures = missingOutcome.fixtures.filter(
      (fixture) => fixture.expectedOutcome !== "blocked",
    );
    expect(assessPackAdmission(missingOutcome).failures).toContain("fixtures.outcomes");

    const duplicateRate = structuredClone(pack);
    duplicateRate.rates[3] = structuredClone(duplicateRate.rates[0]!);
    expect(assessPackAdmission(duplicateRate).failures).toContain("rates.identities");
  });
});
