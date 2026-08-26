import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";

import type { AgentInputItem } from "@openai/agents";

import type { IndiaImportAssessment } from "../assessment/india-import-assessment";
import type { ChinaToIndiaAssessment } from "../assessment/china-to-india-assessment";
import type { IndiaToChinaAssessment } from "../assessment/india-to-china-assessment";
import type { DocumentType } from "../assessment/preparation-workflow";
import type { ActionDossier, EvidenceRefreshOverlay } from "../knowledge/electronics-domain";
import type {
  DocumentFactField,
  DocumentMediaType,
  VisibleDocumentFact,
} from "../documents/intake";

export interface CitationRecord {
  label: string;
  locator: string;
  sourceVersionId: string;
  url: string;
}

export interface ConversationMessage {
  citations: CitationRecord[];
  content: string;
  createdAt: string;
  id: string;
  role: "assistant" | "user";
}

export interface ConversationReadinessSnapshot {
  actionDossier?: ActionDossier;
  agencies: unknown[];
  calculation: unknown;
  checked: string[];
  classificationCandidates: unknown[];
  claims: unknown[];
  confirmedFacts: Array<{ name: string; value: string }>;
  controls: unknown[];
  createdAt: string;
  documentReviews: unknown[];
  documents: unknown[];
  executionProvenance: { mode: "agents_sdk_with_deterministic_tools"; modelVersion: string };
  missingInformation: string[];
  nextActions: string[];
  notChecked: string[];
  productResearch: unknown[];
  risks: string[];
  snapshotId: string;
  state: "Action Required" | "Assessment Complete Within Verified Scope" | "Assessment Incomplete";
  summary: string;
  evidenceRefreshOverlays?: EvidenceRefreshOverlay[];
}

export interface TradeCaseRecord {
  assessmentSnapshots: Array<IndiaImportAssessment | ChinaToIndiaAssessment | IndiaToChinaAssessment | ConversationReadinessSnapshot>;
  confirmedFacts: Array<{ name: string; value: string }>;
  conversationId: string;
  createdAt: string;
  documents: DocumentRecord[];
  id: string;
  memoryItems: CaseMemoryItem[];
  messages: ConversationMessage[];
  sourceReferences: Array<{ locator: string; sourceVersionId: string }>;
  title: string;
  toolReferences: Array<{ toolCallId: string; toolName: string }>;
}

export interface CaseMemoryItem {
  createdAt: string;
  key: string;
  kind: "admitted_claim" | "assumption" | "classification_candidates" | "domain_finding" | "product_research" | "unresolved_question";
  status: "active" | "resolved";
  updatedAt: string;
  value: unknown;
}

export interface DocumentFactVersionRecord {
  createdAt: string;
  id: string;
  provenance: VisibleDocumentFact["provenance"];
  rawValue: string;
  reviewStatus: "confirmed" | "corrected" | "pending";
  value: string;
  version: number;
}

export interface DocumentFactRecord {
  current: DocumentFactVersionRecord;
  field: DocumentFactField;
  id: string;
  label: string;
  versions: DocumentFactVersionRecord[];
}

export interface DocumentRecord {
  bytesRetained: false;
  createdAt: string;
  documentType: DocumentType;
  facts: DocumentFactRecord[];
  fileName: string;
  id: string;
  mediaType: DocumentMediaType;
  pageCount: number;
  retentionState: "derived_facts_until_case_deletion";
  sizeBytes: number;
}

export class ConversationStore {
  readonly #database: DatabaseSync;

  constructor(path: string) {
    this.#database = new DatabaseSync(path);
    this.#database.exec("PRAGMA foreign_keys = ON");
  }

  createConversation(title: string) {
    const id = randomUUID();
    const now = new Date().toISOString();
    this.#database
      .prepare(
        "INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
      )
      .run(id, title.trim(), now, now);
    return { id, title: title.trim(), createdAt: now };
  }

  createTradeCase(conversationId: string, title: string) {
    const conversation = this.#database
      .prepare("SELECT id FROM conversations WHERE id = ?")
      .get(conversationId);
    if (!conversation) throw new Error("Trade Case requires an explicit conversation.");
    const id = randomUUID();
    const now = new Date().toISOString();
    this.#database
      .prepare(
        "INSERT INTO trade_cases (id, conversation_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(id, conversationId, title.trim(), now, now);
    return { id, conversationId, title: title.trim(), createdAt: now };
  }

  assertTradeCase(tradeCaseId: string) {
    const row = this.#database
      .prepare("SELECT id FROM trade_cases WHERE id = ?")
      .get(tradeCaseId);
    if (!row) throw new Error("An explicit Trade Case is required; no cross-case fallback is allowed.");
  }

  #recordConfirmedFact(
    tradeCaseId: string,
    name: string,
    value: string,
    sourceDocumentFactId: string | null,
  ) {
    const next = this.#database
      .prepare(`
        SELECT COALESCE(MAX(version), 0) + 1 AS version
        FROM confirmed_fact_versions WHERE trade_case_id = ? AND name = ?
      `)
      .get(tradeCaseId, name) as { version: number };
    const recordedAt = new Date().toISOString();
    this.#database
      .prepare(`
        INSERT INTO confirmed_fact_versions
          (id, trade_case_id, name, value, version, source_document_fact_id, recorded_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        randomUUID(),
        tradeCaseId,
        name,
        value,
        next.version,
        sourceDocumentFactId,
        recordedAt,
      );
    this.#database
      .prepare(`
        INSERT INTO confirmed_facts (trade_case_id, name, value, confirmed_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(trade_case_id, name) DO UPDATE SET
          value = excluded.value,
          confirmed_at = excluded.confirmed_at
      `)
      .run(tradeCaseId, name, value, recordedAt);
  }

  confirmFact(tradeCaseId: string, name: string, value: string) {
    this.assertTradeCase(tradeCaseId);
    const normalizedName = name.trim();
    const normalizedValue = value.trim();
    if (!normalizedName || !normalizedValue) throw new Error("Confirmed facts require a name and value.");
    this.#recordConfirmedFact(tradeCaseId, normalizedName, normalizedValue, null);
  }

  upsertMemoryItem(
    tradeCaseId: string,
    input: Pick<CaseMemoryItem, "key" | "kind" | "status" | "value">,
  ) {
    this.assertTradeCase(tradeCaseId);
    const key = input.key.trim();
    if (!key) throw new Error("Case memory requires a key.");
    const now = new Date().toISOString();
    this.#database.prepare(`
      INSERT INTO case_memory_items
        (trade_case_id, kind, memory_key, value_json, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(trade_case_id, kind, memory_key) DO UPDATE SET
        value_json = excluded.value_json,
        status = excluded.status,
        updated_at = excluded.updated_at
    `).run(
      tradeCaseId,
      input.kind,
      key,
      JSON.stringify(input.value),
      input.status,
      now,
      now,
    );
  }

  listMemoryItems(tradeCaseId: string): CaseMemoryItem[] {
    this.assertTradeCase(tradeCaseId);
    const rows = this.#database.prepare(`
      SELECT kind, memory_key AS key, value_json AS valueJson, status,
        created_at AS createdAt, updated_at AS updatedAt
      FROM case_memory_items
      WHERE trade_case_id = ?
      ORDER BY status, kind, updated_at, memory_key
    `).all(tradeCaseId) as Array<Omit<CaseMemoryItem, "value"> & { valueJson: string }>;
    return rows.map(({ valueJson, ...row }) => ({
      ...row,
      value: JSON.parse(valueJson) as unknown,
    }));
  }

  getConfirmedFactVersions(tradeCaseId: string, name: string) {
    this.assertTradeCase(tradeCaseId);
    return this.#database
      .prepare(`
        SELECT id, name, value, version, source_document_fact_id AS sourceDocumentFactId,
          recorded_at AS recordedAt
        FROM confirmed_fact_versions
        WHERE trade_case_id = ? AND name = ?
        ORDER BY version
      `)
      .all(tradeCaseId, name) as Array<{
      id: string;
      name: string;
      recordedAt: string;
      sourceDocumentFactId: string | null;
      value: string;
      version: number;
    }>;
  }

  recordDocumentExtraction(
    tradeCaseId: string,
    input: {
      facts: VisibleDocumentFact[];
      documentType: DocumentType;
      fileName: string;
      mediaType: DocumentMediaType;
      pageCount: number;
      sizeBytes: number;
    },
  ) {
    this.assertTradeCase(tradeCaseId);
    if (input.facts.length === 0) throw new Error("Only visible facts ready for review may be recorded.");
    const documentId = randomUUID();
    const createdAt = new Date().toISOString();
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database
        .prepare(`
          INSERT INTO documents
            (id, trade_case_id, file_name, document_type, media_type, size_bytes, page_count, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          documentId,
          tradeCaseId,
          input.fileName.trim(),
          input.documentType,
          input.mediaType,
          input.sizeBytes,
          input.pageCount,
          createdAt,
        );
      const insertFact = this.#database.prepare(`
        INSERT INTO document_facts (id, document_id, trade_case_id, name, label, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const insertVersion = this.#database.prepare(`
        INSERT INTO document_fact_versions
          (id, fact_id, trade_case_id, version, raw_value, value, review_status,
            document_page, region_json, extraction_method, extraction_confidence, created_at)
        VALUES (?, ?, ?, 1, ?, ?, 'pending', ?, ?, ?, ?, ?)
      `);
      for (const fact of input.facts) {
        const factId = randomUUID();
        insertFact.run(factId, documentId, tradeCaseId, fact.field, fact.label, createdAt);
        insertVersion.run(
          randomUUID(),
          factId,
          tradeCaseId,
          fact.rawValue,
          fact.value,
          fact.provenance.documentPage,
          JSON.stringify(fact.provenance.region),
          fact.provenance.method,
          fact.provenance.confidence,
          createdAt,
        );
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
    return this.getDocuments(tradeCaseId).find((document) => document.id === documentId)!;
  }

  reviewDocumentFact(
    tradeCaseId: string,
    factId: string,
    review: { action: "confirm" } | { action: "correct"; value: string },
  ) {
    this.assertTradeCase(tradeCaseId);
    const fact = this.#database
      .prepare(`
        SELECT id, trade_case_id AS tradeCaseId, name FROM document_facts WHERE id = ?
      `)
      .get(factId) as { id: string; name: string; tradeCaseId: string } | undefined;
    if (!fact || fact.tradeCaseId !== tradeCaseId) {
      throw new Error("The document fact does not belong to the selected Trade Case.");
    }
    const current = this.#database
      .prepare(`
        SELECT raw_value AS rawValue, value, version, document_page AS documentPage,
          region_json AS regionJson, extraction_method AS extractionMethod,
          extraction_confidence AS extractionConfidence
        FROM document_fact_versions
        WHERE fact_id = ? ORDER BY version DESC LIMIT 1
      `)
      .get(factId) as {
      documentPage: number;
      extractionConfidence: number;
      extractionMethod: string;
      rawValue: string;
      regionJson: string;
      value: string;
      version: number;
    };
    const nextValue = review.action === "correct" ? review.value.trim() : current.value;
    if (!nextValue) throw new Error("A corrected visible fact cannot be empty.");
    const reviewStatus = review.action === "correct" ? "corrected" : "confirmed";
    const createdAt = new Date().toISOString();
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database
        .prepare(`
          INSERT INTO document_fact_versions
            (id, fact_id, trade_case_id, version, raw_value, value, review_status,
              document_page, region_json, extraction_method, extraction_confidence, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          randomUUID(),
          factId,
          tradeCaseId,
          current.version + 1,
          current.rawValue,
          nextValue,
          reviewStatus,
          current.documentPage,
          current.regionJson,
          current.extractionMethod,
          current.extractionConfidence,
          createdAt,
        );
      this.#recordConfirmedFact(tradeCaseId, fact.name, nextValue, factId);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
    return this.getTradeCase(tradeCaseId);
  }

  addSourceReference(tradeCaseId: string, sourceVersionId: string, locator: string) {
    this.assertTradeCase(tradeCaseId);
    this.#database
      .prepare(`
        INSERT OR IGNORE INTO source_references
          (trade_case_id, source_version_id, locator, created_at)
        VALUES (?, ?, ?, ?)
      `)
      .run(tradeCaseId, sourceVersionId, locator, new Date().toISOString());
  }

  addToolReference(tradeCaseId: string, toolName: string, toolCallId: string) {
    this.assertTradeCase(tradeCaseId);
    this.#database
      .prepare(`
        INSERT OR IGNORE INTO tool_references
          (trade_case_id, tool_name, tool_call_id, created_at)
        VALUES (?, ?, ?, ?)
      `)
      .run(tradeCaseId, toolName, toolCallId, new Date().toISOString());
  }

  appendMessage(
    tradeCaseId: string,
    role: ConversationMessage["role"],
    content: string,
    citations: CitationRecord[] = [],
  ) {
    this.assertTradeCase(tradeCaseId);
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    this.#database
      .prepare(`
        INSERT INTO messages (id, trade_case_id, role, content, citations_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(id, tradeCaseId, role, content, JSON.stringify(citations), createdAt);
    return { id, role, content, citations, createdAt };
  }

  replaceLatestAssistantMessageContent(tradeCaseId: string, content: string) {
    this.assertTradeCase(tradeCaseId);
    const normalized = content.trim();
    if (!normalized) throw new Error("An assistant message cannot be empty.");
    const row = this.#database.prepare(`
      SELECT id FROM messages
      WHERE trade_case_id = ? AND role = 'assistant'
      ORDER BY rowid DESC LIMIT 1
    `).get(tradeCaseId) as { id: string } | undefined;
    if (!row) throw new Error("No assistant message exists for the selected Trade Case.");
    this.#database.prepare("UPDATE messages SET content = ? WHERE id = ? AND trade_case_id = ?")
      .run(normalized, row.id, tradeCaseId);
  }

  getDocuments(tradeCaseId: string): DocumentRecord[] {
    this.assertTradeCase(tradeCaseId);
    const documents = this.#database
      .prepare(`
        SELECT id, file_name AS fileName, document_type AS documentType,
          media_type AS mediaType, size_bytes AS sizeBytes,
          page_count AS pageCount, bytes_retained AS bytesRetained,
          retention_state AS retentionState, created_at AS createdAt
        FROM documents WHERE trade_case_id = ? ORDER BY created_at, id
      `)
      .all(tradeCaseId) as Array<{
      bytesRetained: number;
      createdAt: string;
      documentType: DocumentType;
      fileName: string;
      id: string;
      mediaType: DocumentMediaType;
      pageCount: number;
      retentionState: "derived_facts_until_case_deletion";
      sizeBytes: number;
    }>;
    const factStatement = this.#database.prepare(`
      SELECT id, name, label FROM document_facts
      WHERE document_id = ? AND trade_case_id = ? ORDER BY created_at, id
    `);
    const versionStatement = this.#database.prepare(`
      SELECT id, version, raw_value AS rawValue, value, review_status AS reviewStatus,
        document_page AS documentPage, region_json AS regionJson,
        extraction_method AS extractionMethod, extraction_confidence AS extractionConfidence,
        created_at AS createdAt
      FROM document_fact_versions
      WHERE fact_id = ? AND trade_case_id = ? ORDER BY version
    `);
    return documents.map((document) => {
      const facts = (factStatement.all(document.id, tradeCaseId) as Array<{
        id: string;
        label: string;
        name: DocumentFactField;
      }>).map((fact) => {
        const versions = (versionStatement.all(fact.id, tradeCaseId) as Array<{
          createdAt: string;
          documentPage: number;
          extractionConfidence: number;
          extractionMethod: "embedded_pdf_text" | "image_vision";
          id: string;
          rawValue: string;
          regionJson: string;
          reviewStatus: "confirmed" | "corrected" | "pending";
          value: string;
          version: number;
        }>).map(({ documentPage, extractionConfidence, extractionMethod, regionJson, ...version }) => ({
          ...version,
          provenance: {
            documentPage,
            region: JSON.parse(regionJson) as VisibleDocumentFact["provenance"]["region"],
            method: extractionMethod,
            confidence: extractionConfidence,
          },
        }));
        return {
          id: fact.id,
          field: fact.name,
          label: fact.label,
          versions,
          current: versions.at(-1)!,
        };
      });
      return {
        ...document,
        bytesRetained: false as const,
        facts,
      };
    });
  }

  deleteDocument(tradeCaseId: string, documentId: string) {
    this.assertTradeCase(tradeCaseId);
    const document = this.#database
      .prepare("SELECT id FROM documents WHERE id = ? AND trade_case_id = ?")
      .get(documentId, tradeCaseId);
    if (!document) throw new Error("The document does not belong to the selected Trade Case.");
    const affectedNames = this.#database
      .prepare("SELECT DISTINCT name FROM document_facts WHERE document_id = ? AND trade_case_id = ?")
      .all(documentId, tradeCaseId) as Array<{ name: string }>;
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database
        .prepare("DELETE FROM documents WHERE id = ? AND trade_case_id = ?")
        .run(documentId, tradeCaseId);
      const latest = this.#database.prepare(`
        SELECT value, recorded_at AS recordedAt FROM confirmed_fact_versions
        WHERE trade_case_id = ? AND name = ? ORDER BY version DESC LIMIT 1
      `);
      const update = this.#database.prepare(`
        UPDATE confirmed_facts SET value = ?, confirmed_at = ?
        WHERE trade_case_id = ? AND name = ?
      `);
      const remove = this.#database.prepare(
        "DELETE FROM confirmed_facts WHERE trade_case_id = ? AND name = ?",
      );
      for (const { name } of affectedNames) {
        const row = latest.get(tradeCaseId, name) as
          | { recordedAt: string; value: string }
          | undefined;
        if (row) update.run(row.value, row.recordedAt, tradeCaseId, name);
        else remove.run(tradeCaseId, name);
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  deleteTradeCase(tradeCaseId: string) {
    const row = this.#database
      .prepare("SELECT conversation_id AS conversationId FROM trade_cases WHERE id = ?")
      .get(tradeCaseId) as { conversationId: string } | undefined;
    if (!row) throw new Error("An explicit Trade Case is required; no cross-case fallback is allowed.");
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.prepare("DELETE FROM trade_cases WHERE id = ?").run(tradeCaseId);
      this.#database.prepare(`
        DELETE FROM conversations
        WHERE id = ? AND NOT EXISTS (
          SELECT 1 FROM trade_cases WHERE conversation_id = ?
        )
      `).run(row.conversationId, row.conversationId);
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  getTradeCase(tradeCaseId: string): TradeCaseRecord {
    const row = this.#database
      .prepare(`
        SELECT id, conversation_id AS conversationId, title, created_at AS createdAt
        FROM trade_cases WHERE id = ?
      `)
      .get(tradeCaseId) as
      | { conversationId: string; createdAt: string; id: string; title: string }
      | undefined;
    if (!row) throw new Error("An explicit Trade Case is required; no cross-case fallback is allowed.");

    const confirmedFactRows = this.#database
      .prepare("SELECT name, value FROM confirmed_facts WHERE trade_case_id = ? ORDER BY name")
      .all(tradeCaseId) as Array<{ name: string; value: string }>;
    const confirmedFacts = confirmedFactRows.map((fact) => ({
      name: fact.name,
      value: fact.value,
    }));
    const sourceReferenceRows = this.#database
      .prepare(`
        SELECT source_version_id AS sourceVersionId, locator
        FROM source_references WHERE trade_case_id = ? ORDER BY created_at, source_version_id
      `)
      .all(tradeCaseId) as Array<{ locator: string; sourceVersionId: string }>;
    const sourceReferences = sourceReferenceRows.map((reference) => ({
      locator: reference.locator,
      sourceVersionId: reference.sourceVersionId,
    }));
    const toolReferenceRows = this.#database
      .prepare(`
        SELECT tool_name AS toolName, tool_call_id AS toolCallId
        FROM tool_references WHERE trade_case_id = ? ORDER BY rowid
      `)
      .all(tradeCaseId) as Array<{ toolCallId: string; toolName: string }>;
    const toolReferences = toolReferenceRows.map((reference) => ({
      toolCallId: reference.toolCallId,
      toolName: reference.toolName,
    }));
    const messageRows = this.#database
      .prepare(`
        SELECT id, role, content, citations_json AS citationsJson, created_at AS createdAt
        FROM messages WHERE trade_case_id = ? ORDER BY rowid
      `)
      .all(tradeCaseId) as Array<{
      citationsJson: string;
      content: string;
      createdAt: string;
      id: string;
      role: ConversationMessage["role"];
    }>;
    const messages = messageRows.map(({ citationsJson, ...message }) => ({
      ...message,
      citations: JSON.parse(citationsJson) as CitationRecord[],
    }));
    const assessmentSnapshots = this.getAssessmentSnapshots(row.id);
    const documents = this.getDocuments(row.id);
    const memoryItems = this.listMemoryItems(row.id);
    return {
      ...row,
      assessmentSnapshots,
      confirmedFacts,
      documents,
      memoryItems,
      sourceReferences,
      toolReferences,
      messages,
    };
  }

  listTradeCases(): TradeCaseRecord[] {
    const rows = this.#database
      .prepare("SELECT id FROM trade_cases ORDER BY created_at DESC, id DESC")
      .all() as Array<{ id: string }>;
    return rows.map((row) => this.getTradeCase(row.id));
  }

  getSessionItems(tradeCaseId: string, limit?: number): AgentInputItem[] {
    this.assertTradeCase(tradeCaseId);
    const rows = limit === undefined
      ? this.#database
          .prepare("SELECT item_json AS itemJson FROM session_items WHERE trade_case_id = ? ORDER BY ordinal")
          .all(tradeCaseId)
      : this.#database
          .prepare(`
            SELECT itemJson FROM (
              SELECT item_json AS itemJson, ordinal FROM session_items
              WHERE trade_case_id = ? ORDER BY ordinal DESC LIMIT ?
            ) ORDER BY ordinal
          `)
          .all(tradeCaseId, Math.max(0, limit));
    return (rows as Array<{ itemJson: string }>).map(
      (row) => JSON.parse(row.itemJson) as AgentInputItem,
    );
  }

  addSessionItems(tradeCaseId: string, items: AgentInputItem[]) {
    this.assertTradeCase(tradeCaseId);
    if (items.length === 0) return;
    const nextOrdinal = this.#database.prepare(
      "SELECT COALESCE(MAX(ordinal), 0) + 1 AS ordinal FROM session_items WHERE trade_case_id = ?",
    );
    const insert = this.#database.prepare(`
      INSERT INTO session_items (trade_case_id, ordinal, item_json, created_at)
      VALUES (?, ?, ?, ?)
    `);
    this.#database.exec("BEGIN IMMEDIATE");
    try {
      let ordinal = (nextOrdinal.get(tradeCaseId) as { ordinal: number }).ordinal;
      for (const item of items) {
        insert.run(tradeCaseId, ordinal, JSON.stringify(item), new Date().toISOString());
        ordinal += 1;
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  popSessionItem(tradeCaseId: string): AgentInputItem | undefined {
    this.assertTradeCase(tradeCaseId);
    const row = this.#database
      .prepare(`
        SELECT ordinal, item_json AS itemJson FROM session_items
        WHERE trade_case_id = ? ORDER BY ordinal DESC LIMIT 1
      `)
      .get(tradeCaseId) as { itemJson: string; ordinal: number } | undefined;
    if (!row) return undefined;
    this.#database
      .prepare("DELETE FROM session_items WHERE trade_case_id = ? AND ordinal = ?")
      .run(tradeCaseId, row.ordinal);
    return JSON.parse(row.itemJson) as AgentInputItem;
  }

  clearSession(tradeCaseId: string) {
    this.assertTradeCase(tradeCaseId);
    this.#database
      .prepare("DELETE FROM session_items WHERE trade_case_id = ?")
      .run(tradeCaseId);
  }

  saveAssessmentSnapshot(
    tradeCaseId: string,
    snapshot: IndiaImportAssessment | ChinaToIndiaAssessment | IndiaToChinaAssessment | ConversationReadinessSnapshot,
  ) {
    this.assertTradeCase(tradeCaseId);
    try {
      this.#database
        .prepare(`
          INSERT INTO assessment_snapshots
            (snapshot_id, trade_case_id, assessment_state, payload_json, created_at)
          VALUES (?, ?, ?, ?, ?)
        `)
        .run(
          snapshot.snapshotId,
          tradeCaseId,
          snapshot.state,
          JSON.stringify(snapshot),
          snapshot.createdAt,
        );
    } catch (error) {
      if (error instanceof Error && /unique|primary key|constraint/i.test(error.message)) {
        throw new Error("Assessment Snapshots are immutable and cannot be replaced.");
      }
      throw error;
    }
  }

  getAssessmentSnapshots(
    tradeCaseId: string,
  ): Array<IndiaImportAssessment | ChinaToIndiaAssessment | IndiaToChinaAssessment | ConversationReadinessSnapshot> {
    this.assertTradeCase(tradeCaseId);
    const rows = this.#database
      .prepare(`
        SELECT payload_json AS payloadJson FROM assessment_snapshots
        WHERE trade_case_id = ? ORDER BY created_at, snapshot_id
      `)
      .all(tradeCaseId) as Array<{ payloadJson: string }>;
    return rows.map((row) => JSON.parse(row.payloadJson) as IndiaImportAssessment | ChinaToIndiaAssessment | IndiaToChinaAssessment | ConversationReadinessSnapshot);
  }

  close() {
    this.#database.close();
  }
}
