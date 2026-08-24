import { describe, expect, it } from "vitest";

import {
  loadCameraPack,
  loadHeadphonesPack,
  loadRouterPack,
  type ProductPack,
} from "@/knowledge";
import {
  PreflightReportSchema,
  evaluatePreflight,
  requestFromFixture,
  type AssessmentRequest,
} from "@/preflight";

const AS_OF = "2026-08-24";

async function loadPacks(): Promise<ProductPack[]> {
  return Promise.all([loadRouterPack(), loadHeadphonesPack(), loadCameraPack()]);
}

function fixtureByOutcome(pack: ProductPack, outcome: "ready" | "blocked" | "needs_verification") {
  return pack.fixtures.find((fixture) => fixture.expectedOutcome === outcome)!;
}

describe("deterministic three-product preflight", () => {
  it("recomputes Ready, Blocked, and Needs verification through the restricted harness for each pack", async () => {
    for (const pack of await loadPacks()) {
      for (const fixture of pack.fixtures) {
        const report = evaluatePreflight(pack, requestFromFixture(pack, fixture), {
          access: "promotion_harness",
          asOf: AS_OF,
        });

        expect(PreflightReportSchema.safeParse(report).success).toBe(true);
        expect(report.outcome).toBe(fixture.expectedOutcome);
        expect(report.productPackId).toBe(pack.id);
        expect(report.mapping.hsCode).toBe(pack.hsMapping.hsCode);
        expect(report.mapping.matched).toBe(fixture.expectedOutcome !== "needs_verification" || report.mapping.mismatches.length === 0);
        expect(report.cost.status).toBe(
          fixture.expectedOutcome === "needs_verification" ? "withheld" : "available",
        );
      }
    }
  });

  it("calculates auditable decimal-safe customs values from item, freight, and insurance", async () => {
    for (const pack of await loadPacks()) {
      const request = requestFromFixture(pack, fixtureByOutcome(pack, "ready"));
      request.costInputs = {
        itemValueInr: "99999.98",
        freightInr: "0.01",
        insuranceInr: "0.01",
      };

      const report = evaluatePreflight(pack, request, {
        access: "promotion_harness",
        asOf: AS_OF,
      });

      expect(report.outcome).toBe("ready");
      expect(report.cost).toMatchObject({
        status: "available",
        assessableValueInr: "100000.00",
        formula: "item value + freight + insurance",
      });
      if (report.cost.status !== "available") throw new Error("cost unexpectedly withheld");
      expect(report.cost.lines).toEqual([
        { amountInr: "100000.00", id: "assessable_value" },
        { amountInr: "20000.00", id: "basic_customs_duty" },
        { amountInr: "0.00", id: "agriculture_infrastructure_development_cess" },
        { amountInr: "2000.00", id: "social_welfare_surcharge" },
        { amountInr: "21960.00", id: "igst" },
        { amountInr: "0.00", id: "gst_compensation_cess" },
        { amountInr: "43960.00", id: "total_import_duties" },
      ]);
      expect(report.cost.assumptions).toContain("No preferential tariff claim is admitted.");
      expect(report.cost.exclusions.length).toBeGreaterThan(0);
    }
  });

  it("cites the exact admitted clearance rule and returns ordered, usable remediation for Blocked", async () => {
    for (const pack of await loadPacks()) {
      const report = evaluatePreflight(
        pack,
        requestFromFixture(pack, fixtureByOutcome(pack, "blocked")),
        { access: "promotion_harness", asOf: AS_OF },
      );

      expect(report.outcome).toBe("blocked");
      expect(report.customsClearanceBlocked).toBe(true);
      const blocker = report.findings.find((finding) => finding.kind === "clearance_blocker")!;
      expect(blocker.ruleId).toMatch(/wpc_eta/);
      expect(blocker.source).toMatchObject({
        authority: expect.any(String),
        title: expect.any(String),
        url: expect.stringMatching(/^https:\/\//),
        lastChecked: AS_OF,
        pinpoint: expect.any(String),
      });
      expect(blocker.requiredEvidence.length).toBeGreaterThan(0);
      expect(blocker.missingEvidence.length).toBeGreaterThan(0);
      expect(blocker.action).toMatchObject({
        order: 1,
        owner: expect.any(String),
        instruction: expect.any(String),
        destination: { label: expect.any(String), url: expect.stringMatching(/^https:\/\//) },
        rerunCondition: expect.any(String),
      });
      expect(report.actions.map((action) => action.order)).toEqual(
        [...report.actions.map((action) => action.order)].sort((a, b) => a - b),
      );
    }
  });

  it("fails closed without numeric cost for ambiguous, mismatched, incomplete, stale, or cross-pack inputs", async () => {
    const [router, headphones] = await loadPacks();
    const readyRouter = requestFromFixture(router!, fixtureByOutcome(router!, "ready"));

    const cases: AssessmentRequest[] = [];

    const ambiguous = structuredClone(readyRouter);
    delete ambiguous.scenario.modelIdentity;
    cases.push(ambiguous);

    const mismatched = structuredClone(readyRouter);
    mismatched.scenario.hasSixGhzRadio = true;
    cases.push(mismatched);

    const incomplete = structuredClone(readyRouter);
    incomplete.parties.originCountryCode = null;
    cases.push(incomplete);

    const badMoney = structuredClone(readyRouter);
    badMoney.costInputs.itemValueInr = "100.001";
    cases.push(badMoney);

    for (const request of cases) {
      const report = evaluatePreflight(router!, request, {
        access: "promotion_harness",
        asOf: AS_OF,
      });
      expect(report.outcome).toBe("needs_verification");
      expect(report.cost.status).toBe("withheld");
      expect(report.actions.length).toBeGreaterThan(0);
    }

    const crossPackReport = evaluatePreflight(
      headphones!,
      { ...readyRouter, productPackId: headphones!.id },
      { access: "promotion_harness", asOf: AS_OF },
    );
    expect(crossPackReport.outcome).toBe("needs_verification");
    expect(crossPackReport.mapping.matched).toBe(false);
    expect(crossPackReport.cost.status).toBe("withheld");

    const stale = structuredClone(router!);
    stale.sources[0]!.reviewAfter = AS_OF;
    const staleReport = evaluatePreflight(stale, readyRouter, {
      access: "promotion_harness",
      asOf: AS_OF,
    });
    expect(staleReport.outcome).toBe("needs_verification");
    expect(staleReport.cost.status).toBe("withheld");
    expect(staleReport.summary).toContain("source review");
  });

  it("treats unresolved or missing non-clearance evidence as verification, never as a Customs blocker", async () => {
    for (const pack of await loadPacks()) {
      const request = requestFromFixture(pack, fixtureByOutcome(pack, "ready"));
      const nonClearanceRule = pack.rules.find(
        (rule) => rule.clearanceEffect === "non_clearance" && rule.failureEffect === "blocks_legal_readiness",
      )!;
      request.evidence[nonClearanceRule.id] = "absent";

      const report = evaluatePreflight(pack, request, {
        access: "promotion_harness",
        asOf: AS_OF,
      });

      expect(report.outcome).toBe("needs_verification");
      expect(report.customsClearanceBlocked).toBe(false);
      expect(report.cost.status).toBe("withheld");
      expect(report.findings).toContainEqual(
        expect.objectContaining({ ruleId: nonClearanceRule.id, kind: "verification_gap" }),
      );
    }
  });

  it("never evaluates a source-admitted pack in public mode", async () => {
    for (const pack of await loadPacks()) {
      const report = evaluatePreflight(pack, requestFromFixture(pack, fixtureByOutcome(pack, "ready")), {
        access: "public",
        asOf: AS_OF,
      });
      expect(report.outcome).toBe("needs_verification");
      expect(report.cost.status).toBe("withheld");
      expect(report.summary).toContain("not available for public assessment");
    }
  });
});
