import type { DatabaseSync } from "node:sqlite";

import {
  evaluateCondition,
  type ElectronicsKnowledgeGraphJson,
  type FieldEvidenceBindingJson,
  type KnowledgeEdgeJson,
  type KnowledgeNodeJson,
  type RegulatoryCharacteristic,
  type ThreeValued,
} from "./electronics-domain";

interface AdmissionMetadata {
  effectiveFrom: string;
  freshUntil: string;
  sourceVersionId: string;
  conflictStatus: "clear" | "conflicting" | "unverified";
}

export interface KnowledgeEvidenceBinding extends FieldEvidenceBindingJson {
  effectiveFrom: string;
  freshUntil: string;
  conflictStatus: "clear" | "conflicting" | "unverified";
  fieldPath: string;
}

export interface StoredKnowledgeNode {
  node: KnowledgeNodeJson;
  evidenceBindings: KnowledgeEvidenceBinding[];
  outgoingEdges: Array<KnowledgeEdgeJson & {
    effectiveFrom: string;
    freshUntil: string;
    conflictStatus: "clear" | "conflicting" | "unverified";
  }>;
}

export interface ElectronicsKnowledgeMatch extends StoredKnowledgeNode {
  applicability: ThreeValued;
  evidenceState: "current" | "pending";
  missingCharacteristics: string[];
}

function dateIsCurrent(metadata: { effectiveFrom: string; freshUntil: string; conflictStatus: string }, at: Date) {
  const instant = at.getTime();
  const effective = new Date(`${metadata.effectiveFrom}T00:00:00.000Z`).getTime();
  const fresh = new Date(`${metadata.freshUntil}T23:59:59.999Z`).getTime();
  return metadata.conflictStatus === "clear" && effective <= instant && fresh >= instant;
}

function parseNode(row: Record<string, unknown>): KnowledgeNodeJson {
  return {
    id: String(row.id),
    kind: row.kind as KnowledgeNodeJson["kind"],
    jurisdiction: "India",
    label: String(row.label),
    aliases: JSON.parse(String(row.aliasesJson)) as string[],
    state: row.state as KnowledgeNodeJson["state"],
    conditions: JSON.parse(String(row.conditionsJson)),
    payload: JSON.parse(String(row.payloadJson)),
    fieldEvidence: JSON.parse(String(row.fieldEvidenceJson)),
    ...(row.pendingReason ? { pendingReason: String(row.pendingReason) } : {}),
    ...(row.verificationOwner ? { verificationOwner: String(row.verificationOwner) } : {}),
    ...(row.contactNodeId ? { contactNodeId: String(row.contactNodeId) } : {}),
  } as KnowledgeNodeJson;
}

export class ElectronicsKnowledgeStore {
  readonly #database: DatabaseSync;
  #closed = false;

  constructor(database: DatabaseSync) {
    this.#database = database;
  }

  close() {
    this.#closed = true;
  }

  #assertOpen() {
    if (this.#closed) throw new Error("Electronics knowledge store is closed.");
  }

  replaceGraph(
    graph: ElectronicsKnowledgeGraphJson,
    admissionMetadata: ReadonlyMap<string, AdmissionMetadata>,
  ) {
    this.#assertOpen();
    const insertNode = this.#database.prepare(`
      INSERT INTO knowledge_nodes (
        id, kind, jurisdiction, label, aliases_json, state, conditions_json, payload_json,
        field_evidence_json, pending_reason, verification_owner, contact_node_id, graph_id, schema_version
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertBinding = this.#database.prepare(`
      INSERT INTO knowledge_node_evidence (
        node_id, field_path, source_version_id, exact_locator, binding_json,
        effective_from, fresh_until, conflict_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEdge = this.#database.prepare(`
      INSERT INTO knowledge_edges (
        id, from_node_id, relation, to_node_id, conditions_json, evidence_json,
        source_version_id, exact_locator, effective_from, fresh_until, conflict_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSearch = this.#database.prepare(`
      INSERT INTO knowledge_node_search (node_id, label, aliases, keywords, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    this.#database.exec("BEGIN IMMEDIATE");
    try {
      this.#database.exec(`
        DELETE FROM knowledge_node_search;
        DELETE FROM knowledge_edges;
        DELETE FROM knowledge_node_evidence;
        DELETE FROM knowledge_nodes;
      `);
      for (const node of graph.nodes) {
        insertNode.run(
          node.id,
          node.kind,
          node.jurisdiction,
          node.label,
          JSON.stringify(node.aliases),
          node.state,
          JSON.stringify(node.conditions),
          JSON.stringify(node.payload),
          JSON.stringify(node.fieldEvidence),
          node.pendingReason ?? null,
          node.verificationOwner ?? null,
          node.contactNodeId ?? null,
          graph.graphId,
          graph.schemaVersion,
        );
        for (const [fieldPath, binding] of Object.entries(node.fieldEvidence)) {
          const metadata = admissionMetadata.get(binding.sourceVersionId);
          if (!metadata) throw new Error(`Admission metadata missing for ${binding.sourceVersionId}.`);
          insertBinding.run(
            node.id,
            fieldPath,
            binding.sourceVersionId,
            binding.exactLocator,
            JSON.stringify(binding),
            metadata.effectiveFrom,
            metadata.freshUntil,
            metadata.conflictStatus,
          );
        }
        const keywords = [node.kind, ...Object.keys(node.payload), ...Object.values(node.payload)]
          .flatMap((value) => typeof value === "string" || typeof value === "number" ? [String(value)] : [])
          .join(" ");
        insertSearch.run(
          node.id,
          node.label,
          node.aliases.join(" "),
          keywords,
          [node.pendingReason, node.verificationOwner].filter(Boolean).join(" "),
        );
      }
      for (const edge of graph.edges) {
        const metadata = admissionMetadata.get(edge.evidence.sourceVersionId);
        if (!metadata) throw new Error(`Admission metadata missing for ${edge.evidence.sourceVersionId}.`);
        insertEdge.run(
          edge.id,
          edge.from,
          edge.relation,
          edge.to,
          JSON.stringify(edge.conditions),
          JSON.stringify(edge.evidence),
          edge.evidence.sourceVersionId,
          edge.evidence.exactLocator,
          metadata.effectiveFrom,
          metadata.freshUntil,
          metadata.conflictStatus,
        );
      }
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  search(query: string, { limit = 20 }: { limit?: number } = {}): KnowledgeNodeJson[] {
    this.#assertOpen();
    const terms = query.toLowerCase().match(/[a-z0-9_]+/g) ?? [];
    if (terms.length === 0) return [];
    const ftsQuery = terms.map((term) => `"${term.replaceAll('"', '""')}"`).join(" OR ");
    const rows = this.#database.prepare(`
      SELECT kn.id, kn.kind, kn.label, kn.aliases_json AS aliasesJson, kn.state,
        kn.conditions_json AS conditionsJson, kn.payload_json AS payloadJson,
        kn.field_evidence_json AS fieldEvidenceJson, kn.pending_reason AS pendingReason,
        kn.verification_owner AS verificationOwner, kn.contact_node_id AS contactNodeId
      FROM knowledge_node_search
      JOIN knowledge_nodes kn ON kn.id = knowledge_node_search.node_id
      WHERE knowledge_node_search MATCH ?
      ORDER BY bm25(knowledge_node_search), kn.id
      LIMIT ?
    `).all(ftsQuery, limit) as Array<Record<string, unknown>>;
    return rows.map(parseNode);
  }

  getNode(id: string): StoredKnowledgeNode | null {
    this.#assertOpen();
    const row = this.#database.prepare(`
      SELECT id, kind, label, aliases_json AS aliasesJson, state, conditions_json AS conditionsJson,
        payload_json AS payloadJson, field_evidence_json AS fieldEvidenceJson,
        pending_reason AS pendingReason, verification_owner AS verificationOwner,
        contact_node_id AS contactNodeId
      FROM knowledge_nodes WHERE id = ?
    `).get(id) as Record<string, unknown> | undefined;
    if (!row) return null;
    const evidenceBindings = this.#database.prepare(`
      SELECT field_path AS fieldPath, binding_json AS bindingJson, effective_from AS effectiveFrom,
        fresh_until AS freshUntil, conflict_status AS conflictStatus
      FROM knowledge_node_evidence WHERE node_id = ? ORDER BY field_path
    `).all(id).map((bindingRow) => {
      const typed = bindingRow as {
        bindingJson: string;
        conflictStatus: "clear" | "conflicting" | "unverified";
        effectiveFrom: string;
        fieldPath: string;
        freshUntil: string;
      };
      return {
        ...(JSON.parse(typed.bindingJson) as FieldEvidenceBindingJson),
        conflictStatus: typed.conflictStatus,
        effectiveFrom: typed.effectiveFrom,
        fieldPath: typed.fieldPath,
        freshUntil: typed.freshUntil,
      };
    });
    const outgoingEdges = this.#database.prepare(`
      SELECT id, from_node_id AS "from", relation, to_node_id AS "to", conditions_json AS conditionsJson,
        evidence_json AS evidenceJson, effective_from AS effectiveFrom, fresh_until AS freshUntil,
        conflict_status AS conflictStatus
      FROM knowledge_edges WHERE from_node_id = ? ORDER BY id
    `).all(id).map((edgeRow) => {
      const typed = edgeRow as Record<string, unknown>;
      return {
        id: String(typed.id),
        from: String(typed.from),
        relation: typed.relation as KnowledgeEdgeJson["relation"],
        to: String(typed.to),
        conditions: JSON.parse(String(typed.conditionsJson)),
        evidence: JSON.parse(String(typed.evidenceJson)),
        effectiveFrom: String(typed.effectiveFrom),
        freshUntil: String(typed.freshUntil),
        conflictStatus: typed.conflictStatus as "clear" | "conflicting" | "unverified",
      };
    });
    return { node: parseNode(row), evidenceBindings, outgoingEdges };
  }

  matchNodes(
    characteristics: RegulatoryCharacteristic[],
    { at = new Date() }: { at?: Date } = {},
  ): ElectronicsKnowledgeMatch[] {
    this.#assertOpen();
    const ids = this.#database.prepare("SELECT id FROM knowledge_nodes ORDER BY id").all() as Array<{ id: string }>;
    return ids.map(({ id }) => {
      const stored = this.getNode(id);
      if (!stored) throw new Error(`Knowledge node ${id} disappeared during traversal.`);
      const evaluation = evaluateCondition(stored.node.conditions, characteristics);
      const bindingsCurrent = stored.evidenceBindings.every((binding) => dateIsCurrent(binding, at));
      const edgesCurrent = stored.outgoingEdges.every((edge) => dateIsCurrent(edge, at));
      const evidenceState = stored.node.kind === "coverage_gap" ||
        stored.node.state !== "actionable" ||
        evaluation.value === "unknown" ||
        !bindingsCurrent ||
        !edgesCurrent
        ? "pending"
        : "current";
      return {
        ...stored,
        applicability: evaluation.value,
        evidenceState,
        missingCharacteristics: evaluation.missingCharacteristics,
      };
    });
  }
}
