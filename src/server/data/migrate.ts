import { DatabaseSync } from "node:sqlite";

import { resolveDataPaths, type DataPaths } from "./paths";

interface Migration {
  requiresForeignKeysOff?: boolean;
  version: number;
  sql: string;
}

const regulatoryMigrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE official_sources (
        id TEXT PRIMARY KEY,
        authority_name TEXT NOT NULL,
        canonical_url TEXT NOT NULL,
        jurisdiction TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE source_versions (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL REFERENCES official_sources(id),
        sha256 TEXT NOT NULL UNIQUE,
        version_label TEXT NOT NULL,
        effective_from TEXT NOT NULL,
        published_at TEXT NOT NULL,
        retrieved_at TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        snapshot_relative_path TEXT NOT NULL,
        admission_state TEXT NOT NULL CHECK (admission_state = 'admitted'),
        locator TEXT NOT NULL,
        excerpt_text TEXT NOT NULL
      ) STRICT;
      CREATE TABLE coverage_manifest (
        source_version_id TEXT PRIMARY KEY REFERENCES source_versions(id),
        jurisdiction TEXT NOT NULL,
        question TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('research_guidance', 'incomplete'))
      ) STRICT;
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE official_connectors (
        id TEXT PRIMARY KEY,
        jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('India', 'China')),
        authority_name TEXT NOT NULL,
        purpose TEXT NOT NULL,
        allowed_domains_json TEXT NOT NULL,
        connector_state TEXT NOT NULL CHECK (
          connector_state IN ('available', 'manual', 'login_required', 'temporarily_unavailable', 'unsupported')
        ),
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE evidence_admissions (
        admission_id TEXT PRIMARY KEY,
        source_version_id TEXT NOT NULL UNIQUE,
        connector_id TEXT NOT NULL REFERENCES official_connectors(id),
        jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('India', 'China')),
        authority_name TEXT NOT NULL,
        instrument_id TEXT NOT NULL,
        instrument_title TEXT NOT NULL,
        effective_from TEXT NOT NULL,
        fresh_until TEXT NOT NULL,
        amendment_json TEXT NOT NULL,
        applicability_json TEXT NOT NULL,
        original_language TEXT NOT NULL,
        translation_json TEXT NOT NULL,
        exact_locator TEXT NOT NULL,
        exact_excerpt TEXT NOT NULL,
        canonical_url TEXT NOT NULL,
        redirect_history_json TEXT NOT NULL,
        content_type TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        snapshot_relative_path TEXT NOT NULL,
        admission_state TEXT NOT NULL CHECK (admission_state = 'admitted'),
        prompt_injection_detected INTEGER NOT NULL CHECK (prompt_injection_detected IN (0, 1)),
        transitions_json TEXT NOT NULL,
        admitted_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX evidence_admissions_scope_idx
        ON evidence_admissions(jurisdiction, instrument_id, admission_state);
    `,
  },
  {
    version: 3,
    sql: `
      ALTER TABLE evidence_admissions ADD COLUMN document_version_id TEXT;
      ALTER TABLE evidence_admissions ADD COLUMN exact_locator_kind TEXT NOT NULL DEFAULT 'record';
      UPDATE evidence_admissions SET document_version_id = connector_id || '-' || substr(sha256, 1, 16);
      CREATE INDEX evidence_admissions_document_idx
        ON evidence_admissions(document_version_id, instrument_id, admission_state);
    `,
  },
  {
    version: 4,
    sql: `
      ALTER TABLE evidence_admissions ADD COLUMN identity_evidence_json TEXT NOT NULL DEFAULT '{}';
      ALTER TABLE evidence_admissions ADD COLUMN applicability_evidence_json TEXT NOT NULL DEFAULT '{}';
      ALTER TABLE source_versions ADD COLUMN fresh_until TEXT NOT NULL DEFAULT '1970-01-01';
      ALTER TABLE source_versions ADD COLUMN conflict_status TEXT NOT NULL DEFAULT 'unverified'
        CHECK (conflict_status IN ('clear', 'conflicting', 'unverified'));
      UPDATE source_versions
      SET fresh_until = '2026-09-25', conflict_status = 'clear'
      WHERE id = 'dgft-ftp-2023-ch2-f16265d88b82';
    `,
  },
  {
    version: 5,
    sql: `
      CREATE TABLE knowledge_nodes (
        id TEXT PRIMARY KEY,
        kind TEXT NOT NULL CHECK (kind IN (
          'characteristic', 'statutory_entry', 'requirement', 'document', 'policy_clause',
          'agency', 'filing_service', 'contact', 'calculation_rule', 'coverage_gap'
        )),
        jurisdiction TEXT NOT NULL CHECK (jurisdiction = 'India'),
        label TEXT NOT NULL,
        aliases_json TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN ('actionable', 'evidence_pending', 'coverage_pending')),
        conditions_json TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        field_evidence_json TEXT NOT NULL,
        pending_reason TEXT,
        verification_owner TEXT,
        contact_node_id TEXT,
        graph_id TEXT NOT NULL,
        schema_version INTEGER NOT NULL CHECK (schema_version = 1)
      ) STRICT;
      CREATE INDEX knowledge_nodes_kind_jurisdiction_idx
        ON knowledge_nodes(kind, jurisdiction, state);

      CREATE TABLE knowledge_node_evidence (
        node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        field_path TEXT NOT NULL,
        source_version_id TEXT NOT NULL REFERENCES evidence_admissions(source_version_id),
        exact_locator TEXT NOT NULL,
        binding_json TEXT NOT NULL,
        effective_from TEXT NOT NULL,
        fresh_until TEXT NOT NULL,
        conflict_status TEXT NOT NULL CHECK (conflict_status IN ('clear', 'conflicting', 'unverified')),
        PRIMARY KEY (node_id, field_path)
      ) STRICT;
      CREATE INDEX knowledge_node_evidence_source_version_idx
        ON knowledge_node_evidence(source_version_id, node_id);
      CREATE INDEX knowledge_node_evidence_freshness_idx
        ON knowledge_node_evidence(fresh_until, effective_from, conflict_status);

      CREATE TABLE knowledge_edges (
        id TEXT PRIMARY KEY,
        from_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        relation TEXT NOT NULL CHECK (relation IN (
          'triggered_by', 'requires', 'supported_by', 'filed_at', 'owned_by', 'precedes', 'supersedes'
        )),
        to_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
        conditions_json TEXT NOT NULL,
        evidence_json TEXT NOT NULL,
        source_version_id TEXT NOT NULL REFERENCES evidence_admissions(source_version_id),
        exact_locator TEXT NOT NULL,
        effective_from TEXT NOT NULL,
        fresh_until TEXT NOT NULL,
        conflict_status TEXT NOT NULL CHECK (conflict_status IN ('clear', 'conflicting', 'unverified'))
      ) STRICT;
      CREATE INDEX knowledge_edges_from_relation_idx
        ON knowledge_edges(from_node_id, relation, to_node_id);
      CREATE INDEX knowledge_edges_to_relation_idx
        ON knowledge_edges(to_node_id, relation, from_node_id);
      CREATE INDEX knowledge_edges_source_version_idx
        ON knowledge_edges(source_version_id, exact_locator);
      CREATE INDEX knowledge_edges_freshness_idx
        ON knowledge_edges(fresh_until, effective_from, conflict_status);

      CREATE VIRTUAL TABLE knowledge_node_search USING fts5(
        node_id UNINDEXED,
        label,
        aliases,
        keywords,
        description,
        tokenize = 'unicode61 remove_diacritics 2'
      );
    `,
  },
];

const conversationMigrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE conversations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE trade_cases (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
      CREATE TABLE confirmed_facts (
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        confirmed_at TEXT NOT NULL,
        PRIMARY KEY (trade_case_id, name)
      ) STRICT;
      CREATE TABLE session_items (
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        ordinal INTEGER NOT NULL,
        item_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (trade_case_id, ordinal)
      ) STRICT;
      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
        content TEXT NOT NULL,
        citations_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX messages_case_created_idx ON messages(trade_case_id, created_at, id);
      CREATE TABLE source_references (
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        source_version_id TEXT NOT NULL,
        locator TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (trade_case_id, source_version_id, locator)
      ) STRICT;
      CREATE TABLE tool_references (
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        tool_name TEXT NOT NULL,
        tool_call_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (trade_case_id, tool_call_id)
      ) STRICT;
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE assessment_snapshots (
        snapshot_id TEXT PRIMARY KEY,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        assessment_state TEXT NOT NULL CHECK (
          assessment_state IN (
            'Research Guidance',
            'Assessment Incomplete',
            'Action Required',
            'Assessment Complete Within Verified Scope'
          )
        ),
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX assessment_snapshots_case_created_idx
        ON assessment_snapshots(trade_case_id, created_at, snapshot_id);
      CREATE TRIGGER assessment_snapshots_no_update
        BEFORE UPDATE ON assessment_snapshots
        BEGIN
          SELECT RAISE(ABORT, 'Assessment Snapshots are immutable');
        END;
      CREATE TRIGGER assessment_snapshots_no_delete
        BEFORE DELETE ON assessment_snapshots
        BEGIN
          SELECT RAISE(ABORT, 'Assessment Snapshots are immutable');
        END;
    `,
  },
  {
    version: 3,
    sql: `
      DROP TRIGGER assessment_snapshots_no_delete;
      CREATE TABLE documents (
        id TEXT PRIMARY KEY,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        media_type TEXT NOT NULL CHECK (media_type IN ('application/pdf', 'image/png', 'image/jpeg')),
        size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
        page_count INTEGER NOT NULL CHECK (page_count > 0),
        bytes_retained INTEGER NOT NULL DEFAULT 0 CHECK (bytes_retained = 0),
        retention_state TEXT NOT NULL DEFAULT 'derived_facts_until_case_deletion'
          CHECK (retention_state = 'derived_facts_until_case_deletion'),
        created_at TEXT NOT NULL
      ) STRICT;
      CREATE INDEX documents_case_created_idx
        ON documents(trade_case_id, created_at, id);
      CREATE TABLE document_facts (
        id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE(document_id, name)
      ) STRICT;
      CREATE INDEX document_facts_case_idx ON document_facts(trade_case_id, id);
      CREATE TABLE document_fact_versions (
        id TEXT PRIMARY KEY,
        fact_id TEXT NOT NULL REFERENCES document_facts(id) ON DELETE CASCADE,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        version INTEGER NOT NULL CHECK (version > 0),
        raw_value TEXT NOT NULL,
        value TEXT NOT NULL,
        review_status TEXT NOT NULL CHECK (review_status IN ('pending', 'confirmed', 'corrected')),
        document_page INTEGER NOT NULL CHECK (document_page > 0),
        region_json TEXT NOT NULL,
        extraction_method TEXT NOT NULL CHECK (extraction_method IN ('embedded_pdf_text', 'image_vision')),
        extraction_confidence REAL NOT NULL CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
        created_at TEXT NOT NULL,
        UNIQUE(fact_id, version)
      ) STRICT;
      CREATE INDEX document_fact_versions_case_idx
        ON document_fact_versions(trade_case_id, fact_id, version);
      CREATE TABLE confirmed_fact_versions (
        id TEXT PRIMARY KEY,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        version INTEGER NOT NULL CHECK (version > 0),
        source_document_fact_id TEXT REFERENCES document_facts(id) ON DELETE CASCADE,
        recorded_at TEXT NOT NULL,
        UNIQUE(trade_case_id, name, version)
      ) STRICT;
      INSERT INTO confirmed_fact_versions
        (id, trade_case_id, name, value, version, source_document_fact_id, recorded_at)
      SELECT lower(hex(randomblob(16))), trade_case_id, name, value, 1, NULL, confirmed_at
      FROM confirmed_facts;
      CREATE INDEX confirmed_fact_versions_case_name_idx
        ON confirmed_fact_versions(trade_case_id, name, version);
    `,
  },
  {
    version: 4,
    sql: `
      CREATE TRIGGER document_fact_versions_no_update
        BEFORE UPDATE ON document_fact_versions
        BEGIN
          SELECT RAISE(ABORT, 'Document fact versions are immutable');
        END;
      CREATE TRIGGER confirmed_fact_versions_no_update
        BEFORE UPDATE ON confirmed_fact_versions
        BEGIN
          SELECT RAISE(ABORT, 'Confirmed fact versions are immutable');
        END;
    `,
  },
  {
    version: 5,
    sql: `
      ALTER TABLE documents ADD COLUMN document_type TEXT NOT NULL DEFAULT 'commercial_invoice'
        CHECK (document_type IN (
          'commercial_invoice',
          'packing_list',
          'transport_document',
          'china_exporter_registration',
          'china_customs_declaration',
          'china_export_control_screening',
          'china_statutory_inspection_screening',
          'end_user_end_use_statement',
          'india_wpc_eta',
          'india_bis_adapter',
          'india_mtcte',
          'india_repa',
          'india_retail_labels',
          'authority_acknowledgement'
        ));
    `,
  },
  {
    version: 6,
    requiresForeignKeysOff: true,
    sql: `
      CREATE TABLE documents_bwmi21 (
        id TEXT PRIMARY KEY,
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        media_type TEXT NOT NULL CHECK (media_type IN ('application/pdf', 'image/png', 'image/jpeg')),
        size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
        page_count INTEGER NOT NULL CHECK (page_count > 0),
        bytes_retained INTEGER NOT NULL DEFAULT 0 CHECK (bytes_retained = 0),
        retention_state TEXT NOT NULL DEFAULT 'derived_facts_until_case_deletion'
          CHECK (retention_state = 'derived_facts_until_case_deletion'),
        created_at TEXT NOT NULL,
        document_type TEXT NOT NULL DEFAULT 'commercial_invoice'
          CHECK (document_type IN (
            'commercial_invoice',
            'packing_list',
            'transport_document',
            'china_exporter_registration',
            'china_customs_declaration',
            'china_export_control_screening',
            'china_statutory_inspection_screening',
            'end_user_end_use_statement',
            'india_wpc_eta',
            'india_bis_adapter',
            'india_mtcte',
            'india_repa',
            'india_retail_labels',
            'india_exporter_iec',
            'india_shipping_bill',
            'india_export_policy_screening',
            'india_scomet_screening',
            'china_import_declaration',
            'china_import_licence_screening',
            'china_tariff_classification',
            'china_product_market_access_screening',
            'china_party_end_use_screening',
            'china_trade_remedy_screening',
            'authority_acknowledgement'
          ))
      ) STRICT;
      INSERT INTO documents_bwmi21
        (id, trade_case_id, file_name, media_type, size_bytes, page_count, bytes_retained,
          retention_state, created_at, document_type)
      SELECT id, trade_case_id, file_name, media_type, size_bytes, page_count, bytes_retained,
        retention_state, created_at, document_type
      FROM documents;
      DROP TABLE documents;
      ALTER TABLE documents_bwmi21 RENAME TO documents;
      CREATE INDEX documents_case_created_idx
        ON documents(trade_case_id, created_at, id);
    `,
  },
  {
    version: 7,
    sql: `
      CREATE TABLE case_memory_items (
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (
          kind IN ('assumption', 'unresolved_question', 'product_research', 'classification_candidates')
        ),
        memory_key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'resolved')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (trade_case_id, kind, memory_key)
      ) STRICT;
      CREATE INDEX case_memory_items_case_status_idx
        ON case_memory_items(trade_case_id, status, kind, updated_at);
    `,
  },
  {
    version: 8,
    requiresForeignKeysOff: true,
    sql: `
      CREATE TABLE case_memory_items_bwmi_agent_recovery (
        trade_case_id TEXT NOT NULL REFERENCES trade_cases(id) ON DELETE CASCADE,
        kind TEXT NOT NULL CHECK (
          kind IN ('admitted_claim', 'assumption', 'classification_candidates', 'domain_finding', 'product_research', 'unresolved_question')
        ),
        memory_key TEXT NOT NULL,
        value_json TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('active', 'resolved')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (trade_case_id, kind, memory_key)
      ) STRICT;
      INSERT INTO case_memory_items_bwmi_agent_recovery
        (trade_case_id, kind, memory_key, value_json, status, created_at, updated_at)
      SELECT trade_case_id, kind, memory_key, value_json, status, created_at, updated_at
      FROM case_memory_items;
      DROP TABLE case_memory_items;
      ALTER TABLE case_memory_items_bwmi_agent_recovery RENAME TO case_memory_items;
      CREATE INDEX case_memory_items_case_status_idx
        ON case_memory_items(trade_case_id, status, kind, updated_at);
    `,
  },
];

const learningMigrations: Migration[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE learning_consent (
        id TEXT PRIMARY KEY,
        trade_case_id TEXT NOT NULL,
        consent_state TEXT NOT NULL CHECK (consent_state IN ('granted', 'withdrawn')),
        recorded_at TEXT NOT NULL
      ) STRICT;
    `,
  },
];

function migrateDatabase(path: string, migrations: Migration[]) {
  const database = new DatabaseSync(path);
  database.exec("PRAGMA foreign_keys = ON");
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    ) STRICT;
  `);
  const current = database.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations");
  const record = database.prepare(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)",
  );

  try {
    for (const migration of migrations) {
      const row = current.get() as { version: number };
      if (row.version >= migration.version) continue;
      if (migration.requiresForeignKeysOff) database.exec("PRAGMA foreign_keys = OFF");
      database.exec("BEGIN IMMEDIATE");
      try {
        database.exec(migration.sql);
        record.run(migration.version, new Date().toISOString());
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      } finally {
        if (migration.requiresForeignKeysOff) {
          database.exec("PRAGMA foreign_keys = ON");
          const violations = database.prepare("PRAGMA foreign_key_check").all();
          if (violations.length > 0) throw new Error(`Foreign-key violations after migration ${migration.version}.`);
        }
      }
    }
  } finally {
    database.close();
  }
}

export function migrateAllStores({ rootDir }: { rootDir?: string } = {}): {
  paths: DataPaths;
} {
  const paths = resolveDataPaths(rootDir);
  migrateDatabase(paths.regulatory, regulatoryMigrations);
  migrateDatabase(paths.conversations, conversationMigrations);
  migrateDatabase(paths.learning, learningMigrations);
  return { paths };
}
