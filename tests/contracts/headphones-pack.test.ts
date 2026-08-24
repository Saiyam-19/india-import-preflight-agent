import { describe, expect, it } from "vitest";

import {
  assessPackAdmission,
  canProducePublicLegalResult,
  evaluatePackFixture,
  getPublicRuntimePacks,
  loadHeadphonesPack,
  loadRouterPack,
  loadSourceAdmittedPacks,
  matchProductScenario,
} from "@/knowledge";

const HEADPHONES_PACK_ID = "india-retail-over-ear-bluetooth-headphones-v1";

describe("Bluetooth-headphones pack admission", () => {
  it("admits the independently sourced pack only to source_admitted", async () => {
    const pack = await loadHeadphonesPack();

    expect(assessPackAdmission(pack)).toEqual({ admitted: true, failures: [] });
    expect(pack).toMatchObject({
      id: HEADPHONES_PACK_ID,
      lifecycleStatus: "source_admitted",
      selectable: false,
      publicRuntimeEnabled: false,
    });
  });

  it("pins a deterministic 85183019 boundary and rejects every adjacent scenario", async () => {
    const pack = await loadHeadphonesPack();
    const readyFacts = pack.fixtures.find(
      (fixture) => fixture.expectedOutcome === "ready",
    )!.facts;

    expect(pack.scenario.includedFacts).toEqual({
      batteryConfiguration: "one_integrated_rechargeable_lithium_ion_battery",
      chargingAccessory: "passive_usb_cable_only",
      condition: "new",
      customsMovement: "foreign_import_not_sez_dta_clearance",
      deviceType: "over_ear_bluetooth_headphones",
      formFactor: "headband_joined_left_and_right_sound_channels",
      hasBluetoothRadio: true,
      hasCellularRadio: false,
      hasChargingCase: false,
      hasExternalChargerOrPowerBank: false,
      hasIntegratedMicrophone: true,
      hasNfcRadio: false,
      hasOtherRadio: false,
      hasSatelliteRadio: false,
      hasWifiRadio: false,
      hasWiredAudioInput: false,
      intendedUse: "retail_resale_in_india",
      isHearingDevice: false,
      isTrueWirelessStereo: false,
      manufacturingUse: "finished_goods_for_retail_not_inputs_for_manufacture",
      packaging: "single_model_retail_packaged_finished_goods",
      radioBandsMhz: ["2400-2483.5"],
      retailSetContents: "one_headphone_set_one_passive_usb_cable",
    });
    expect(pack.hsMapping).toMatchObject({
      hsCode: "85183019",
      confidence: "high",
      provenance: "admitted_mapping",
      applicabilityFacts: pack.scenario.includedFacts,
    });
    expect(matchProductScenario(pack.scenario, readyFacts.scenario)).toEqual({
      matched: true,
      mismatches: [],
    });

    const adjacentVariants: Record<string, unknown>[] = [
      { ...readyFacts.scenario, isTrueWirelessStereo: true },
      { ...readyFacts.scenario, formFactor: "in_ear_earbuds" },
      { ...readyFacts.scenario, hasWiredAudioInput: true },
      { ...readyFacts.scenario, hasWifiRadio: true },
      { ...readyFacts.scenario, hasNfcRadio: true },
      { ...readyFacts.scenario, hasChargingCase: true },
      { ...readyFacts.scenario, hasExternalChargerOrPowerBank: true },
      { ...readyFacts.scenario, batteryConfiguration: "removable_battery" },
      { ...readyFacts.scenario, isHearingDevice: true },
      { ...readyFacts.scenario, condition: "refurbished" },
    ];
    for (const variant of adjacentVariants) {
      expect(matchProductScenario(pack.scenario, variant).matched).toBe(false);
    }

    const ambiguous = { ...readyFacts.scenario };
    delete ambiguous.modelIdentity;
    expect(matchProductScenario(pack.scenario, ambiguous).matched).toBe(false);
    const ambiguousResult = evaluatePackFixture(pack, { ...readyFacts, scenario: ambiguous });
    expect(ambiguousResult).toMatchObject({
      outcome: "needs_verification",
      customsClearanceBlocked: false,
      costLines: [],
    });
  });

  it("pins each rule, rate, clearance effect, review gate, and remediation to official evidence", async () => {
    const pack = await loadHeadphonesPack();

    expect(pack.sources.length).toBeGreaterThanOrEqual(14);
    for (const source of pack.sources) {
      expect(source.official).toBe(true);
      expect(source.sourceType).toBe("primary_official");
      expect(new URL(source.url).protocol).toBe("https:");
      expect(new URL(source.url).hostname).toMatch(/(?:gov|nic)\.in$/);
      expect(source.pinpoint.locator).not.toBe("");
      expect(source.pinpoint.relevance).not.toBe("");
      expect(source.lastChecked).toBe("2026-08-24");
      expect(source.reviewAfter > source.lastChecked).toBe(true);
      expect(source.reviewRationale).not.toBe("");
    }

    expect(
      pack.rules.map(({ id, clearanceEffect, failureEffect }) => ({
        id,
        clearanceEffect,
        failureEffect,
      })),
    ).toEqual([
      {
        id: "headphones_wpc_eta",
        clearanceEffect: "conditions_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "headphones_bis_crs",
        clearanceEffect: "conditions_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "headphones_battery_bis_crs",
        clearanceEffect: "conditions_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "headphones_repa_import_for_sale",
        clearanceEffect: "non_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "headphones_battery_epr",
        clearanceEffect: "non_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "headphones_legal_metrology_labels",
        clearanceEffect: "non_clearance",
        failureEffect: "warning_only",
      },
      {
        id: "headphones_trade_remedy_check",
        clearanceEffect: "non_clearance",
        failureEffect: "blocks_legal_readiness",
      },
    ]);
    for (const rule of pack.rules) {
      expect(rule.applicability.length).toBeGreaterThan(0);
      expect(rule.requiredEvidence.length).toBeGreaterThan(0);
      expect(rule.consequence).not.toBe("");
      expect(rule.remediation.length).toBeGreaterThan(0);
      expect(rule.sourceIds.length).toBeGreaterThan(0);
      if (rule.clearanceEffect !== "non_clearance") {
        expect(rule.clearanceProof?.sourceId).toEqual(expect.any(String));
        expect(rule.clearanceProof?.pinpoint).not.toBe("");
      }
    }

    expect(pack.rates.map(({ id, percent, base }) => ({ id, percent, base }))).toEqual([
      { id: "basic_customs_duty", percent: 20, base: "assessable_value" },
      {
        id: "agriculture_infrastructure_development_cess",
        percent: 0,
        base: "assessable_value",
      },
      { id: "social_welfare_surcharge", percent: 10, base: "basic_customs_duty" },
      { id: "igst", percent: 18, base: "assessable_value_plus_bcd_plus_sws" },
      { id: "gst_compensation_cess", percent: 0, base: "assessable_value" },
    ]);
    expect(
      pack.rates.find((rate) => rate.id === "basic_customs_duty")!.determination,
    ).toContain("hearable devices");
    expect(
      pack.rates.find((rate) => rate.id === "basic_customs_duty")!.determination,
    ).toContain("SEZ-to-DTA");
  });

  it("independently recomputes Ready, Blocked, and Needs verification fixtures", async () => {
    const pack = await loadHeadphonesPack();

    expect(pack.fixtures.map((fixture) => fixture.expectedOutcome).sort()).toEqual([
      "blocked",
      "needs_verification",
      "ready",
    ]);
    for (const fixture of pack.fixtures) {
      const evaluated = evaluatePackFixture(pack, fixture.facts);
      expect(evaluated.outcome).toBe(fixture.expectedOutcome);
      expect(evaluated.customsClearanceBlocked).toBe(
        fixture.expectedCustomsClearanceBlocked,
      );
      expect(evaluated.findings).toEqual(fixture.findings);
      expect(evaluated.costLines).toEqual(fixture.costLines);
      expect(fixture.facts.productPackId).toBe(HEADPHONES_PACK_ID);
      expect(fixture.reviewedAt).toBe("2026-08-24");
    }

    const ready = pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!;
    expect(ready.costLines).toEqual([
      { id: "assessable_value", amountInr: "100000.00" },
      { id: "basic_customs_duty", amountInr: "20000.00" },
      { id: "agriculture_infrastructure_development_cess", amountInr: "0.00" },
      { id: "social_welfare_surcharge", amountInr: "2000.00" },
      { id: "igst", amountInr: "21960.00" },
      { id: "gst_compensation_cess", amountInr: "0.00" },
      { id: "total_import_duties", amountInr: "43960.00" },
    ]);
    const needsVerification = pack.fixtures.find(
      (fixture) => fixture.expectedOutcome === "needs_verification",
    )!;
    expect(needsVerification.costLines).toEqual([]);
    expect(needsVerification.facts.originCountryCode).toBeNull();
    expect(needsVerification.facts.producerIdentity).toBeNull();
    expect(needsVerification.facts.exporterIdentity).toBeNull();
    expect(needsVerification.facts.tradeRemedyCheck).toBe("unknown");
  });

  it("keeps non-clearance duties distinct from Customs blockers", async () => {
    const pack = await loadHeadphonesPack();
    const ready = structuredClone(
      pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!.facts,
    );

    ready.evidence.headphones_legal_metrology_labels = "absent";
    const labelResult = evaluatePackFixture(pack, ready);
    expect(labelResult.outcome).toBe("ready");
    expect(labelResult.customsClearanceBlocked).toBe(false);

    ready.evidence.headphones_repa_import_for_sale = "absent";
    const repaResult = evaluatePackFixture(pack, ready);
    expect(repaResult.outcome).toBe("blocked");
    expect(repaResult.customsClearanceBlocked).toBe(false);

    const missingBatteryBis = structuredClone(
      pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!.facts,
    );
    missingBatteryBis.evidence.headphones_battery_bis_crs = "absent";
    const batteryBisResult = evaluatePackFixture(pack, missingBatteryBis);
    expect(batteryBisResult.outcome).toBe("blocked");
    expect(batteryBisResult.customsClearanceBlocked).toBe(true);
  });

  it("declares shared applicability explicitly without inheriting router evidence or decisions", async () => {
    const [headphones, router] = await Promise.all([
      loadHeadphonesPack(),
      loadRouterPack(),
    ]);

    expect(
      headphones.admissionScope.sharedApplicabilityDeclarations.map(
        (declaration) => declaration.moduleId,
      ),
    ).toEqual([
      "shared.legal_metrology_retail_package",
      "shared.repa_import_for_sale",
      "shared.wpc_eta_import",
    ]);
    expect(
      router.admissionScope.sharedApplicabilityDeclarations.map(
        (declaration) => declaration.moduleId,
      ),
    ).toEqual([
      "shared.legal_metrology_retail_package",
      "shared.repa_import_for_sale",
      "shared.wpc_eta_import",
    ]);

    for (const pack of [headphones, router]) {
      for (const declaration of pack.admissionScope.sharedApplicabilityDeclarations) {
        expect(declaration.applicableProductPackId).toBe(pack.id);
        for (const [fact, value] of Object.entries(declaration.requiredScenarioFacts)) {
          expect(pack.scenario.includedFacts[fact]).toEqual(value);
        }
      }
    }

    const routerFacts = router.fixtures.find(
      (fixture) => fixture.expectedOutcome === "ready",
    )!.facts;
    const headphonesFacts = headphones.fixtures.find(
      (fixture) => fixture.expectedOutcome === "ready",
    )!.facts;
    expect(evaluatePackFixture(headphones, routerFacts)).toMatchObject({
      outcome: "needs_verification",
      customsClearanceBlocked: false,
      costLines: [],
    });
    expect(evaluatePackFixture(router, headphonesFacts)).toMatchObject({
      outcome: "needs_verification",
      customsClearanceBlocked: false,
      costLines: [],
    });

    const routerMapping = structuredClone(headphones);
    routerMapping.hsMapping = structuredClone(router.hsMapping);
    expect(assessPackAdmission(routerMapping).admitted).toBe(false);

    const routerRates = structuredClone(headphones);
    routerRates.rates = structuredClone(router.rates);
    expect(assessPackAdmission(routerRates).admitted).toBe(false);

    const routerRule = structuredClone(headphones);
    routerRule.rules[0] = structuredClone(router.rules[0]!);
    expect(assessPackAdmission(routerRule).admitted).toBe(false);

    const routerEvidence = structuredClone(headphones);
    routerEvidence.sources[0] = structuredClone(router.sources[0]!);
    expect(assessPackAdmission(routerEvidence).admitted).toBe(false);

    const routerDecision = structuredClone(headphones);
    routerDecision.fixtures[0] = structuredClone(router.fixtures[0]!);
    expect(assessPackAdmission(routerDecision).admitted).toBe(false);
  });

  it("keeps all source-admitted packs non-selectable and fails public eligibility closed", async () => {
    const packs = await loadSourceAdmittedPacks();

    expect(packs).toHaveLength(3);
    expect(packs.map((pack) => pack.id).sort()).toEqual([
      "india-retail-indoor-wifi-ip-camera-v1",
      HEADPHONES_PACK_ID,
      "india-retail-wifi-router-mimo-v1",
    ]);
    expect(getPublicRuntimePacks(packs)).toEqual([]);
    for (const pack of packs) {
      expect(pack.lifecycleStatus).toBe("source_admitted");
      expect(pack.selectable).toBe(false);
      expect(pack.publicRuntimeEnabled).toBe(false);
      expect(canProducePublicLegalResult(pack)).toBe(false);
    }

    const candidate = structuredClone(packs[0]!);
    candidate.lifecycleStatus = "candidate";
    candidate.selectable = true;
    candidate.publicRuntimeEnabled = true;
    expect(canProducePublicLegalResult(candidate)).toBe(false);

    const staleFullSupport = structuredClone(packs[0]!);
    staleFullSupport.lifecycleStatus = "full_support";
    staleFullSupport.selectable = true;
    staleFullSupport.publicRuntimeEnabled = true;
    staleFullSupport.sources[0]!.reviewAfter = "2026-08-23";
    expect(canProducePublicLegalResult(staleFullSupport, "2026-08-24")).toBe(false);

    const headphones = packs.find((pack) => pack.id === HEADPHONES_PACK_ID)!;
    const router = packs.find((pack) => pack.id === "india-retail-wifi-router-mimo-v1")!;
    const crossPackRates = structuredClone(headphones);
    crossPackRates.lifecycleStatus = "full_support";
    crossPackRates.selectable = true;
    crossPackRates.publicRuntimeEnabled = true;
    crossPackRates.rates = structuredClone(router.rates);
    expect(canProducePublicLegalResult(crossPackRates, "2026-08-24")).toBe(false);

    const crossPackEvidence = structuredClone(crossPackRates);
    crossPackEvidence.rates = structuredClone(headphones.rates);
    crossPackEvidence.sources[0] = structuredClone(router.sources[0]!);
    expect(canProducePublicLegalResult(crossPackEvidence, "2026-08-24")).toBe(false);

    const crossPackDecision = structuredClone(crossPackRates);
    crossPackDecision.rates = structuredClone(headphones.rates);
    crossPackDecision.fixtures[0] = structuredClone(router.fixtures[0]!);
    expect(canProducePublicLegalResult(crossPackDecision, "2026-08-24")).toBe(false);
  });

  it("fails admission closed when pack ownership or freshness is weakened", async () => {
    const pack = await loadHeadphonesPack();

    const wrongScope = structuredClone(pack);
    wrongScope.admissionScope.productPackId = "india-retail-wifi-router-mimo-v1";
    expect(assessPackAdmission(wrongScope).admitted).toBe(false);

    const wrongRateScope = structuredClone(pack);
    wrongRateScope.admissionScope.rateApplicability.hsCode = "85176290";
    expect(assessPackAdmission(wrongRateScope).admitted).toBe(false);

    const missingSourceOwnership = structuredClone(pack);
    missingSourceOwnership.admissionScope.sourceIds.pop();
    expect(assessPackAdmission(missingSourceOwnership).admitted).toBe(false);

    const stale = structuredClone(pack);
    stale.rates[0]!.reviewAfter = "2026-08-24";
    expect(assessPackAdmission(stale).admitted).toBe(false);

    const publicFlags = structuredClone(pack);
    publicFlags.selectable = true;
    publicFlags.publicRuntimeEnabled = true;
    expect(assessPackAdmission(publicFlags).admitted).toBe(false);
  });
});
