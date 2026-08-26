import { describe, expect, it } from "vitest";

import {
  calculateDeterministicBorderCharges,
  createComplianceToolState,
  validateToolStateIsolation,
  type ToolClaim,
} from "@/server/agent/compliance-tools";

function rateClaim(claimId: string, text: string): ToolClaim {
  const regulatoryDomain = claimId === "bcd" ? "basic customs duty"
    : claimId === "sws" ? "social welfare surcharge"
      : claimId === "igst" ? "integrated goods and services tax" : "tariff rate";
  return {
    appliesIn: "India",
    authority: "Test admitted authority",
    claimId,
    locator: "Test locator",
    productScope: "test product",
    regulatoryDomain,
    sourceVersionId: `source-${claimId}`,
    text,
    tradeDirection: "china_to_india",
    url: "https://example.gov.in/test",
  };
}

describe("reusable arbitrary-product compliance pipeline", () => {
  it("keeps fixed product profiles, classifications, agencies and rates out of the primary agent path", async () => {
    const primaryFiles = await Promise.all([
      "src/server/agent/guidance.ts",
      "src/server/agent/compliance-tools.ts",
      "src/app/api/chat/route.ts",
    ].map((file) => readFile(join(process.cwd(), file), "utf8")));

    expect(primaryFiles.join("\n")).not.toMatch(/Archer|Bluetooth headphones|Wi-Fi router|85176290|8517623690|\bWPC\b|\bBIS\b|\bCCC\b/);
  });
  it("calculates India border charges deterministically from admitted rate claims", () => {
    const claims = new Map([
      ["bcd", rateClaim("bcd", "The applicable basic Customs duty rate is 10%.")],
      ["sws", rateClaim("sws", "The social welfare surcharge rate is 10% of basic Customs duty.")],
      ["igst", rateClaim("igst", "The applicable integrated tax rate is 18%.")],
    ]);

    const result = calculateDeterministicBorderCharges({
      currency: "INR",
      itemValue: "1000",
      freight: "100",
      insurance: "10",
      rates: [
        { id: "basic_customs_duty", percent: "10", claimId: "bcd" },
        { id: "social_welfare_surcharge", percent: "10", claimId: "sws" },
        { id: "igst", percent: "18", claimId: "igst" },
      ],
    }, claims);

    expect(result).toMatchObject({
      status: "available",
      currency: "INR",
      totalBorderCharges: "343.88",
      components: expect.arrayContaining([
        expect.objectContaining({ id: "assessable_value", amount: "1110.00" }),
        expect.objectContaining({ id: "basic_customs_duty", amount: "111.00" }),
        expect.objectContaining({ id: "social_welfare_surcharge", amount: "11.10" }),
        expect.objectContaining({ id: "igst", amount: "221.78" }),
      ]),
    });
  });

  it("withholds calculation when a supplied rate does not match its admitted claim", () => {
    const claims = new Map([
      ["bcd", rateClaim("bcd", "The applicable basic Customs duty rate is 7.5%.")],
      ["sws", rateClaim("sws", "The surcharge rate is 10%.")],
      ["igst", rateClaim("igst", "The integrated tax rate is 18%.")],
    ]);
    const result = calculateDeterministicBorderCharges({
      currency: "INR",
      itemValue: "1000",
      freight: "0",
      insurance: "0",
      rates: [
        { id: "basic_customs_duty", percent: "10", claimId: "bcd" },
        { id: "social_welfare_surcharge", percent: "10", claimId: "sws" },
        { id: "igst", percent: "18", claimId: "igst" },
      ],
    }, claims);

    expect(result).toMatchObject({
      status: "withheld",
      blockers: expect.arrayContaining([expect.stringMatching(/does not match.*admitted claim/i)]),
    });
  });

  it("withholds a rate claim assigned to the wrong charge component", () => {
    const claims = new Map([
      ["bcd", rateClaim("bcd", "The applicable basic Customs duty rate is 10%.")],
      ["sws", rateClaim("sws", "The social welfare surcharge rate is 10%.")],
      ["igst", rateClaim("igst", "The applicable integrated tax rate is 18%.")],
    ]);
    const result = calculateDeterministicBorderCharges({
      currency: "INR", itemValue: "1000", freight: "0", insurance: "0",
      rates: [
        { id: "basic_customs_duty", percent: "18", claimId: "igst" },
        { id: "social_welfare_surcharge", percent: "10", claimId: "sws" },
        { id: "igst", percent: "18", claimId: "igst" },
      ],
    }, claims);
    expect(result).toMatchObject({ status: "withheld", blockers: expect.arrayContaining([expect.stringMatching(/component and percentage/i)]) });
  });

  it.each([
    ["USB-C thermal imaging module", "LoRa soil moisture telemetry node"],
    ["electronic paper shelf label controller", "gallium nitride bench power supply"],
    ["handheld Raman spectrometer", "Qi2 automotive charging cradle"],
  ])("rejects product-profile leakage from %s into %s", (recordedProduct, activeProduct) => {
    const state = createComplianceToolState();
    state.productResearch.set("record", {
      productName: recordedProduct,
      recordId: "record",
      sourceLabel: "Manufacturer specification",
      sourceUrl: "https://manufacturer.example/spec",
      specifications: [{ name: "principal function", value: recordedProduct, whyMaterial: "Changes classification." }],
    });

    expect(() => validateToolStateIsolation(state, activeProduct)).toThrow(/leaked from another product/i);
    expect(validateToolStateIsolation(state, recordedProduct)).toBe(true);
  });
});
import { readFile } from "node:fs/promises";
import { join } from "node:path";
