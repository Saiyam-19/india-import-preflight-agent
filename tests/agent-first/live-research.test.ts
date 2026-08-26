import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { createComplianceToolState } from "@/server/agent/compliance-tools";
import { createComplianceAgent } from "@/server/agent/guidance";
import { bootstrapApplication } from "@/server/bootstrap";
import { officialSearchDomains } from "@/server/evidence/registry";

async function withAgent(
  run: (agent: ReturnType<typeof createComplianceAgent>) => void | Promise<void>,
  model = "gpt-5.6-sol",
) {
  process.env.BWMI_DATA_DIR = await mkdtemp(join(tmpdir(), "bwmi-single-agent-"));
  const application = await bootstrapApplication();
  try {
    const conversation = application.conversationStore.createConversation("Arbitrary product");
    const tradeCase = application.conversationStore.createTradeCase(conversation.id, "Arbitrary product");
    application.conversationStore.confirmFact(tradeCase.id, "origin_country", "China");
    application.conversationStore.confirmFact(tradeCase.id, "destination_country", "India");
    application.conversationStore.confirmFact(tradeCase.id, "trade_direction", "china_to_india");
    application.conversationStore.confirmFact(tradeCase.id, "product_description", "USB-C thermal imaging module");
    const agent = createComplianceAgent({
      conversationStore: application.conversationStore,
      model,
      question: "Can this USB-C thermal imaging module be imported from China to India?",
      regulatoryStore: application.regulatoryStore,
      snapshotRoot: application.paths.sources,
      state: createComplianceToolState(),
      tradeCaseId: tradeCase.id,
    });
    await run(agent);
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}

describe("single India-China compliance agent boundary", () => {
  it("constrains official discovery to the bilateral official-domain registry", async () => {
    await withAgent(async (agent) => {
      const hostedTool = agent.tools.find((candidate) => candidate.name === "search_official_india_china_sources");
      expect(hostedTool && "providerData" in hostedTool).toBe(true);
      if (!hostedTool || !("providerData" in hostedTool)) throw new Error("Expected a hosted official-search tool.");
      expect(hostedTool.providerData).toMatchObject({
        type: "web_search",
        filters: { allowed_domains: officialSearchDomains() },
      });
      expect(JSON.stringify(hostedTool.providerData)).not.toMatch(/usa\.gov|cbp\.gov|commerce\.gov|\.ae|United States|UAE/i);
    });
  });

  it("exposes one focused agent with the required reusable product-to-readiness tool pipeline", async () => {
    await withAgent((agent) => {
      expect(agent.name).toBe("India-China Shipment Readiness");
      expect(agent.handoffs).toEqual([]);
      expect(agent.model).toBe("gpt-5.6-sol");
      expect(agent.modelSettings).toMatchObject({ reasoning: { effort: "high" } });
      expect(agent.tools.map((candidate) => candidate.name)).toEqual(expect.arrayContaining([
        "research_product_specifications",
        "read_confirmed_shipment_context",
        "record_product_specification_research",
        "persist_confirmed_fact",
        "propose_classification_candidates",
        "search_official_india_china_sources",
        "admit_source_evidence",
        "retrieve_admitted_compliance_claims",
        "identify_applicable_agencies",
        "screen_import_export_controls",
        "build_required_document_checklist",
        "review_uploaded_documents",
        "calculate_deterministic_border_charges",
        "assess_shipment_readiness",
      ]));
    });
  });

  it("keeps forced tool choice until Nemotron reaches a deterministic terminal tool", async () => {
    await withAgent((agent) => {
      expect(agent.modelSettings).toMatchObject({
        reasoning: { effort: "medium" },
        toolChoice: "required",
      });
      expect(agent.resetToolChoice).toBe(false);
    }, "nvidia/nemotron-3.5-lightning:free");
  });

  it("omits unsupported text verbosity from the Groq GPT-OSS request settings", async () => {
    await withAgent(async (agent) => {
      expect(agent.modelSettings).toMatchObject({
        reasoning: { effort: "low" },
        temperature: 0.2,
        toolChoice: "research_shipment_readiness",
      });
      expect(agent.modelSettings.text).toBeUndefined();
      expect(agent.outputType).toBe("text");
      expect(agent.resetToolChoice).toBe(false);
      expect(agent.modelSettings.toolChoice).toBe("research_shipment_readiness");
      expect(agent.tools.map((candidate) => candidate.name)).toEqual(["research_shipment_readiness"]);
    }, "openai/gpt-oss-120b");
  });

  it("binds evidence admission to server-owned case scope", async () => {
    await withAgent((agent) => {
      const admissionTool = agent.tools.find((candidate) => candidate.name === "admit_source_evidence");
      expect(admissionTool).toBeDefined();
      expect(JSON.stringify(admissionTool)).not.toMatch(/\"appliesIn\"|\"tradeDirection\"/);
    });
  });

  it("keeps untrusted case data out of trusted system instructions", async () => {
    await withAgent((agent) => {
      expect(agent.instructions).not.toContain("USB-C thermal imaging module");
      expect(agent.instructions).toMatch(/untrusted data/i);
    });
  });
});
