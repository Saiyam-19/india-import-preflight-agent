import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { beforeAll, describe, expect, it } from "vitest";

import { getAiAvailability, runReferenceGuidance } from "@/server/agent/guidance";
import { bootstrapApplication } from "@/server/bootstrap";
import { TradeCaseSession } from "@/server/conversations/sqlite-session";

const liveRequested = process.env.RUN_LIVE_OPENAI_GUIDANCE === "1";

describe.skipIf(!liveRequested)("opt-in live Agents SDK guidance", () => {
  beforeAll(() => {
    expect(getAiAvailability(), "Configure one allowlisted provider before running the live gate.")
      .toMatchObject({ available: true });
  });
  it("answers the reference IEC question with admitted DGFT citations", async () => {
    expect(getAiAvailability().available).toBe(true);
    process.env.BWMI_DATA_DIR = await mkdtemp(join(tmpdir(), "bwmi-16-live-guidance-"));
    const application = await bootstrapApplication();

    try {
      const conversation = application.conversationStore.createConversation("Live guidance");
      const tradeCase = application.conversationStore.createTradeCase(
        conversation.id,
        "Live IEC reference",
      );
      application.conversationStore.confirmFact(tradeCase.id, "destination_country", "India");
      const result = await runReferenceGuidance({
        conversationStore: application.conversationStore,
        question:
          "Do I need an IEC, and what baseline documents does DGFT list for importing goods into India?",
        regulatoryStore: application.regulatoryStore,
        sourcesRoot: application.paths.sources,
        tradeCaseId: tradeCase.id,
      });

      expect(result.output.state).toBe("research_guidance");
      expect(result.output.claims.length).toBeGreaterThan(0);
      expect(result.citations).toEqual([
        expect.objectContaining({
          sourceVersionId: application.evidence.sourceVersionId,
          url: application.evidence.url,
        }),
      ]);
      expect(
        (await new TradeCaseSession(application.conversationStore, tradeCase.id).getItems()).length,
      ).toBeGreaterThanOrEqual(2);
    } finally {
      application.conversationStore.close();
      application.regulatoryStore.close();
    }
  }, 120_000);

  it("uses hosted official-domain discovery for an uncovered product and fails closed without admission", async () => {
    expect(getAiAvailability().available).toBe(true);
    process.env.BWMI_DATA_DIR = await mkdtemp(join(tmpdir(), "bwmi-17-live-official-research-"));
    const application = await bootstrapApplication();
    const activities: Array<{ phase: string; status: string }> = [];
    try {
      const conversation = application.conversationStore.createConversation("Live official research");
      const tradeCase = application.conversationStore.createTradeCase(
        conversation.id,
        "China to India machine",
      );
      application.conversationStore.confirmFact(tradeCase.id, "origin_country", "China");
      application.conversationStore.confirmFact(tradeCase.id, "destination_country", "India");
      application.conversationStore.confirmFact(tradeCase.id, "trade_direction", "china_to_india");
      const result = await runReferenceGuidance({
        conversationStore: application.conversationStore,
        question: "What official import-side controls apply in India to a China-origin industrial packing machine?",
        regulatoryStore: application.regulatoryStore,
        sourcesRoot: application.paths.sources,
        tradeCaseId: tradeCase.id,
        onActivity: (event) => activities.push(event),
      });
      expect(activities).toEqual(expect.arrayContaining([expect.objectContaining({ phase: "searching" })]));
      if (result.output.state === "assessment_incomplete") {
        expect(result.output.claims.every((claim) => claim.regulatoryDomain === "baseline import documents")).toBe(true);
        expect(result.output.missingInformation.join(" ")).toMatch(/coverage manifest|working classification|product-specific/i);
      } else {
        expect(result.citations).toHaveLength(1);
        expect(result.output.claims[0]?.sourceVersionId).toBe(result.citations[0]?.sourceVersionId);
      }
    } finally {
      application.conversationStore.close();
      application.regulatoryStore.close();
    }
  }, 120_000);
});
