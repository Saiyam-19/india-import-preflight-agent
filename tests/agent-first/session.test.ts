import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { AgentInputItem } from "@openai/agents";
import { describe, expect, it } from "vitest";

import { ConversationStore } from "@/server/conversations/conversation-store";
import { TradeCaseSession } from "@/server/conversations/sqlite-session";
import { migrateAllStores } from "@/server/data/migrate";
import type { ActionDossier, EvidenceRefreshOverlay } from "@/server/knowledge/electronics-domain";

describe("persistent Trade Case session", () => {
  it("persists SDK items, facts, and references inside one explicit case", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-16-session-"));
    const { paths } = migrateAllStores({ rootDir });
    const store = new ConversationStore(paths.conversations);
    const conversation = store.createConversation("Reference guidance");
    const firstCase = store.createTradeCase(conversation.id, "IEC reference case");
    const secondCase = store.createTradeCase(conversation.id, "Separate case");
    const firstSession = new TradeCaseSession(store, firstCase.id);
    const secondSession = new TradeCaseSession(store, secondCase.id);
    const item = { role: "user", content: "Do I need an IEC?" } as AgentInputItem;

    await firstSession.addItems([item]);
    store.confirmFact(firstCase.id, "destination_country", "India");
    store.addSourceReference(firstCase.id, "dgft-ftp-2023-ch2", "paragraph 2.05(a)");
    store.addToolReference(firstCase.id, "regulatory_lookup", "lookup-1");

    expect(await firstSession.getItems()).toEqual([item]);
    expect(await secondSession.getItems()).toEqual([]);
    expect(store.getTradeCase(firstCase.id)).toMatchObject({
      id: firstCase.id,
      confirmedFacts: [{ name: "destination_country", value: "India" }],
      sourceReferences: [
        { sourceVersionId: "dgft-ftp-2023-ch2", locator: "paragraph 2.05(a)" },
      ],
      toolReferences: [{ toolName: "regulatory_lookup", toolCallId: "lookup-1" }],
    });
    expect(() => new TradeCaseSession(store, "missing-case")).toThrow(/explicit trade case/i);
    store.close();
  });

  it("round-trips the frozen action dossier and case evidence overlay without cross-case leakage", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-electronics-snapshot-"));
    const { paths } = migrateAllStores({ rootDir });
    let store = new ConversationStore(paths.conversations);
    const conversation = store.createConversation("Electronics dossier persistence");
    const first = store.createTradeCase(conversation.id, "First electronics case");
    const second = store.createTradeCase(conversation.id, "Second electronics case");
    const emptyItem = (id: string) => ({
      id,
      status: "pending" as const,
      label: "Confirm classification",
      action: "Confirm the statutory entry with the responsible authority.",
      owner: "importer",
      why: "The admitted schedule binding is incomplete.",
      policyLocators: [],
      filingPortals: [],
    });
    const actionDossier: ActionDossier = {
      decision: { status: "pending", summary: "Evidence is incomplete.", blockers: ["ITC-HS entry pending"] },
      documents: [emptyItem("document-1")],
      policyReview: [emptyItem("policy-1")],
      onlineForms: [emptyItem("form-1")],
      contacts: [emptyItem("contact-1")],
      classificationAndRegulation: [emptyItem("classification-1")],
      costs: [emptyItem("cost-1")],
      orderedNextActions: [emptyItem("action-1")],
    };
    const evidenceRefreshOverlays: EvidenceRefreshOverlay[] = [{
      knowledgeNodeId: "itc-entry-pending",
      replacements: {
        officialLabel: {
          claimId: "kg:itc-entry-pending:officialLabel",
          sourceVersionId: "dgft-itc-source",
          exactLocator: "Schedule I, row 8517",
          supportMode: "exact_text",
          supportText: "Electronic apparatus under heading 8517",
          supportSha256: "a".repeat(64),
        },
      },
    }];
    const snapshot = {
      agencies: [], calculation: null, checked: [], classificationCandidates: [], claims: [], confirmedFacts: [],
      controls: [], createdAt: "2026-08-26T00:00:00.000Z", documentReviews: [], documents: [],
      executionProvenance: { mode: "agents_sdk_with_deterministic_tools" as const, modelVersion: "gpt-test" },
      missingInformation: [], nextActions: [], notChecked: [], productResearch: [], risks: [],
      snapshotId: "electronics-round-trip", state: "Assessment Incomplete" as const,
      summary: "Pending evidence.", actionDossier, evidenceRefreshOverlays,
    };

    store.saveAssessmentSnapshot(first.id, snapshot);
    store.close();
    store = new ConversationStore(paths.conversations);

    expect(store.getAssessmentSnapshots(first.id)).toEqual([snapshot]);
    expect(store.getAssessmentSnapshots(second.id)).toEqual([]);
    store.close();
  });
});
