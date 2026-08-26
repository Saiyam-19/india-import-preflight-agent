import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import { ConversationStore } from "@/server/conversations/conversation-store";
import { migrateAllStores } from "@/server/data/migrate";

const neutralExtraction = {
  documentType: "commercial_invoice" as const,
  fileName: "neutral-parser-fixture.pdf",
  mediaType: "application/pdf" as const,
  sizeBytes: 840,
  pageCount: 1,
  facts: [
    {
      field: "documentNumber" as const,
      label: "Document number",
      rawValue: "TEST-DOC-17",
      value: "TEST-DOC-17",
      provenance: {
        documentPage: 1,
        region: { x: 72, y: 690, width: 160, height: 12, unit: "pdf_points" as const },
        method: "embedded_pdf_text" as const,
        confidence: 0.99,
      },
    },
  ],
};

describe("persistent isolated document memory", () => {
  it("keeps pending facts outside the case until explicit confirmation or correction", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-19-memory-"));
    const { paths } = migrateAllStores({ rootDir });
    const store = new ConversationStore(paths.conversations);
    const conversation = store.createConversation("Document review");
    const first = store.createTradeCase(conversation.id, "Case one");
    const second = store.createTradeCase(conversation.id, "Case two");
    const document = store.recordDocumentExtraction(first.id, neutralExtraction);
    const fact = document.facts[0]!;

    expect(store.getTradeCase(first.id).confirmedFacts).toEqual([]);
    expect(store.getTradeCase(first.id).documents[0]?.facts[0]).toMatchObject({
      id: fact.id,
      current: { reviewStatus: "pending", value: "TEST-DOC-17", version: 1 },
    });
    expect(() => store.reviewDocumentFact(second.id, fact.id, { action: "confirm" }))
      .toThrow(/does not belong to the selected trade case/i);

    store.reviewDocumentFact(first.id, fact.id, { action: "correct", value: "TEST-DOC-17-CORRECTED" });
    const reviewed = store.getTradeCase(first.id);
    expect(reviewed.confirmedFacts).toContainEqual({ name: "documentNumber", value: "TEST-DOC-17-CORRECTED" });
    expect(reviewed.documents[0]?.facts[0]?.versions).toEqual([
      expect.objectContaining({ version: 1, reviewStatus: "pending", value: "TEST-DOC-17" }),
      expect.objectContaining({ version: 2, reviewStatus: "corrected", value: "TEST-DOC-17-CORRECTED" }),
    ]);
    expect(store.getTradeCase(second.id).confirmedFacts).toEqual([]);
    store.close();

    const database = new DatabaseSync(paths.conversations);
    expect(() => database.prepare(
      "UPDATE document_fact_versions SET extraction_confidence = 0.5 WHERE fact_id = ?",
    ).run(fact.id)).toThrow(/document fact versions are immutable/i);
    expect(() => database.prepare(
      "UPDATE confirmed_fact_versions SET value = 'mutated' WHERE trade_case_id = ?",
    ).run(first.id)).toThrow(/confirmed fact versions are immutable/i);
    database.close();
  });

  it("persists cases and fact versions across store reopen while deletion cascades only inside the target case", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-19-persistence-"));
    const { paths } = migrateAllStores({ rootDir });
    let store = new ConversationStore(paths.conversations);
    const conversation = store.createConversation("Persistent cases");
    const first = store.createTradeCase(conversation.id, "Persistent one");
    const second = store.createTradeCase(conversation.id, "Persistent two");
    const firstDocument = store.recordDocumentExtraction(first.id, neutralExtraction);
    const secondDocument = store.recordDocumentExtraction(second.id, {
      ...neutralExtraction,
      fileName: "second-neutral-fixture.pdf",
    });
    store.reviewDocumentFact(first.id, firstDocument.facts[0]!.id, { action: "confirm" });
    store.reviewDocumentFact(second.id, secondDocument.facts[0]!.id, { action: "correct", value: "SECOND-CASE" });
    store.close();

    store = new ConversationStore(paths.conversations);
    expect(store.listTradeCases()).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: first.id, documents: [expect.objectContaining({ bytesRetained: false })] }),
      expect.objectContaining({ id: second.id, confirmedFacts: [{ name: "documentNumber", value: "SECOND-CASE" }] }),
    ]));

    store.deleteDocument(first.id, firstDocument.id);
    expect(store.getTradeCase(first.id)).toMatchObject({ documents: [], confirmedFacts: [] });
    expect(store.getTradeCase(second.id).confirmedFacts).toEqual([{ name: "documentNumber", value: "SECOND-CASE" }]);

    store.deleteTradeCase(first.id);
    expect(() => store.getTradeCase(first.id)).toThrow(/explicit trade case/i);
    expect(store.getTradeCase(second.id).id).toBe(second.id);
    store.close();
  });

  it("versions ordinary confirmed facts instead of silently overwriting history", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-19-fact-history-"));
    const { paths } = migrateAllStores({ rootDir });
    const store = new ConversationStore(paths.conversations);
    const conversation = store.createConversation("Fact history");
    const tradeCase = store.createTradeCase(conversation.id, "Versioned facts");
    store.confirmFact(tradeCase.id, "importerIdentity", "First visible value");
    store.confirmFact(tradeCase.id, "importerIdentity", "Corrected visible value");

    expect(store.getConfirmedFactVersions(tradeCase.id, "importerIdentity")).toEqual([
      expect.objectContaining({ version: 1, value: "First visible value" }),
      expect.objectContaining({ version: 2, value: "Corrected visible value" }),
    ]);
    expect(store.getTradeCase(tradeCase.id).confirmedFacts).toEqual([
      { name: "importerIdentity", value: "Corrected visible value" },
    ]);
    store.close();
  });
});
