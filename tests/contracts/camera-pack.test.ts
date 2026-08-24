import { describe, expect, it } from "vitest";

import {
  assessPackAdmission,
  evaluatePackFixture,
  loadCameraPack,
  loadHeadphonesPack,
  loadRouterPack,
  matchProductScenario,
} from "@/knowledge";

const CAMERA_PACK_ID = "india-retail-indoor-wifi-ip-camera-v1";

function ids(values: Array<{ id: string }>) {
  return new Set(values.map((value) => value.id));
}

function expectDisjoint(left: Set<string>, right: Set<string>) {
  expect([...left].filter((id) => right.has(id))).toEqual([]);
}

describe("indoor Wi-Fi/IP-camera pack admission", () => {
  it("source-admits one exact camera pack with its own high-confidence mapping", async () => {
    const pack = await loadCameraPack();

    expect(assessPackAdmission(pack)).toEqual({ admitted: true, failures: [] });
    expect(pack).toMatchObject({
      id: CAMERA_PACK_ID,
      lifecycleStatus: "source_admitted",
      selectable: false,
      publicRuntimeEnabled: false,
      hsMapping: {
        hsCode: "85258900",
        confidence: "high",
        provenance: "admitted_mapping",
      },
    });
    expect(pack.scenario.includedFacts).toEqual({
      condition: "new",
      customsMovement: "foreign_import_not_sez_dta_clearance",
      deviceType: "indoor_ip_security_camera",
      hasBattery: false,
      hasCellularRadio: false,
      hasEthernetOrPoe: false,
      hasIntegratedDvrOrNvr: false,
      hasOtherRadio: false,
      hasSixGhzRadio: false,
      intendedUse: "retail_resale_in_india",
      isCameraModuleOrComponent: false,
      isOutdoorOrIndustrial: false,
      manufacturingUse: "finished_goods_for_retail_not_inputs_for_manufacture",
      packaging: "single_model_retail_packaged_finished_goods",
      powerConfiguration: "one_external_dc_power_adapter_no_battery",
      radioBandsGhz: ["2.4", "5"],
      recordingArchitecture: "ip_camera_without_bundled_recorder",
      retailSetContents: "one_indoor_ip_camera_one_dedicated_power_adapter",
    });
  });

  it("rejects adjacent cameras and withholds every result when exact facts are missing", async () => {
    const pack = await loadCameraPack();
    const ready = pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!;

    expect(matchProductScenario(pack.scenario, ready.facts.scenario)).toEqual({
      matched: true,
      mismatches: [],
    });
    for (const scenario of [
      { ...ready.facts.scenario, hasBattery: true },
      { ...ready.facts.scenario, hasCellularRadio: true },
      { ...ready.facts.scenario, hasEthernetOrPoe: true },
      { ...ready.facts.scenario, hasIntegratedDvrOrNvr: true },
      { ...ready.facts.scenario, hasOtherRadio: true },
      { ...ready.facts.scenario, hasSixGhzRadio: true },
      { ...ready.facts.scenario, isCameraModuleOrComponent: true },
      { ...ready.facts.scenario, isOutdoorOrIndustrial: true },
      { ...ready.facts.scenario, condition: "refurbished" },
    ]) {
      expect(matchProductScenario(pack.scenario, scenario).matched).toBe(false);
    }

    const ambiguous = { ...ready.facts.scenario };
    delete ambiguous.modelIdentity;
    expect(evaluatePackFixture(pack, { ...ready.facts, scenario: ambiguous })).toMatchObject({
      outcome: "needs_verification",
      customsClearanceBlocked: false,
      costLines: [],
    });
  });

  it("owns primary sources, exact clearance effects, actions, rates, and all three fixtures", async () => {
    const pack = await loadCameraPack();

    expect(pack.sources.length).toBeGreaterThanOrEqual(12);
    for (const source of pack.sources) {
      expect(source.id).toMatch(/^camera-/);
      expect(source.official).toBe(true);
      expect(source.sourceType).toBe("primary_official");
      expect(new URL(source.url).hostname).toMatch(/(?:gov|nic)\.in$/);
      expect(source.pinpoint.locator).not.toBe("");
      expect(source.lastChecked).toBe("2026-08-24");
      expect(source.reviewAfter > source.lastChecked).toBe(true);
    }

    expect(
      pack.rules.map(({ id, clearanceEffect, failureEffect }) => ({
        id,
        clearanceEffect,
        failureEffect,
      })),
    ).toEqual([
      {
        id: "camera_wpc_eta",
        clearanceEffect: "conditions_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "camera_bis_crs",
        clearanceEffect: "conditions_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "camera_adapter_bis_crs",
        clearanceEffect: "conditions_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "camera_repa_import_for_sale",
        clearanceEffect: "non_clearance",
        failureEffect: "blocks_legal_readiness",
      },
      {
        id: "camera_legal_metrology_labels",
        clearanceEffect: "non_clearance",
        failureEffect: "warning_only",
      },
      {
        id: "camera_trade_remedy_check",
        clearanceEffect: "non_clearance",
        failureEffect: "blocks_legal_readiness",
      },
    ]);
    for (const rule of pack.rules) {
      expect(rule.id).toMatch(/^camera_/);
      expect(rule.sourceIds.every((sourceId) => sourceId.startsWith("camera-"))).toBe(true);
      expect(rule.remediation.every((action) => action.id.startsWith("camera_"))).toBe(true);
      if (rule.clearanceEffect !== "non_clearance") {
        expect(rule.clearanceProof?.sourceId).toMatch(/^camera-/);
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
    expect(pack.rates.flatMap((rate) => rate.sourceIds).every((id) => id.startsWith("camera-"))).toBe(true);

    expect(pack.fixtures.map((fixture) => fixture.expectedOutcome).sort()).toEqual([
      "blocked",
      "needs_verification",
      "ready",
    ]);
    for (const fixture of pack.fixtures) {
      expect(fixture.id).toMatch(/^camera-/);
      expect(fixture.facts.productPackId).toBe(CAMERA_PACK_ID);
      expect(evaluatePackFixture(pack, fixture.facts)).toEqual({
        outcome: fixture.expectedOutcome,
        customsClearanceBlocked: fixture.expectedCustomsClearanceBlocked,
        findings: fixture.findings,
        costLines: fixture.costLines,
      });
    }
    expect(pack.fixtures.find((fixture) => fixture.expectedOutcome === "ready")!.costLines.at(-1)).toEqual({
      id: "total_import_duties",
      amountInr: "43960.00",
    });
  });

  it("inherits no mapping, source, rule, action, evidence, fixture, or decision from another pack", async () => {
    const [camera, router, headphones] = await Promise.all([
      loadCameraPack(),
      loadRouterPack(),
      loadHeadphonesPack(),
    ]);

    for (const other of [router, headphones]) {
      expect(camera.hsMapping.hsCode).not.toBe(other.hsMapping.hsCode);
      expectDisjoint(ids(camera.sources), ids(other.sources));
      expectDisjoint(ids(camera.rules), ids(other.rules));
      expectDisjoint(
        new Set(camera.rules.flatMap((rule) => rule.remediation.map((action) => action.id))),
        new Set(other.rules.flatMap((rule) => rule.remediation.map((action) => action.id))),
      );
      expectDisjoint(ids(camera.fixtures), ids(other.fixtures));
      expectDisjoint(new Set(Object.keys(camera.fixtures[0]!.facts.evidence)), new Set(Object.keys(other.fixtures[0]!.facts.evidence)));

      expect(evaluatePackFixture(camera, other.fixtures[0]!.facts)).toMatchObject({
        outcome: "needs_verification",
        customsClearanceBlocked: false,
        costLines: [],
      });
      expect(evaluatePackFixture(other, camera.fixtures[0]!.facts)).toMatchObject({
        outcome: "needs_verification",
        customsClearanceBlocked: false,
        costLines: [],
      });

      const crossed = structuredClone(camera);
      crossed.fixtures[0] = structuredClone(other.fixtures[0]!);
      expect(assessPackAdmission(crossed).admitted).toBe(false);
    }
  });
});
