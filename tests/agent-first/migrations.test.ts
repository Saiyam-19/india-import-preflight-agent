import { existsSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import { migrateAllStores } from "@/server/data/migrate";

describe("agent-first SQLite migrations", () => {
  it("creates three separated stores through versioned migrations", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-16-migrations-"));

    const result = migrateAllStores({ rootDir });

    expect(Object.keys(result.paths).sort()).toEqual([
      "conversations",
      "learning",
      "regulatory",
      "sources",
    ]);
    for (const name of ["regulatory", "conversations", "learning"] as const) {
      const path = result.paths[name];
      expect(existsSync(path)).toBe(true);
      const database = new DatabaseSync(path, { readOnly: true });
      const versions = database
        .prepare("SELECT version FROM schema_migrations ORDER BY version")
        .all() as Array<{ version: number }>;
      database.close();
      expect(versions).toEqual(
        name === "regulatory"
          ? [{ version: 1 }, { version: 2 }, { version: 3 }, { version: 4 }, { version: 5 }]
          : name === "conversations"
            ? [{ version: 1 }, { version: 2 }, { version: 3 }, { version: 4 }, { version: 5 }, { version: 6 }, { version: 7 }, { version: 8 }]
            : [{ version: 1 }],
      );
    }
  });

  it("creates the indexed regulatory knowledge graph and FTS search schema", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-electronics-graph-migrations-"));
    const { paths } = migrateAllStores({ rootDir });
    const database = new DatabaseSync(paths.regulatory, { readOnly: true });
    try {
      const tables = database
        .prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name")
        .all()
        .map((row) => (row as { name: string }).name);
      expect(tables).toEqual(expect.arrayContaining([
        "knowledge_edges",
        "knowledge_node_evidence",
        "knowledge_node_search",
        "knowledge_nodes",
      ]));

      const indexes = database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name")
        .all()
        .map((row) => (row as { name: string }).name);
      expect(indexes).toEqual(expect.arrayContaining([
        "knowledge_edges_from_relation_idx",
        "knowledge_edges_source_version_idx",
        "knowledge_edges_to_relation_idx",
        "knowledge_node_evidence_freshness_idx",
        "knowledge_node_evidence_source_version_idx",
        "knowledge_nodes_kind_jurisdiction_idx",
      ]));
    } finally {
      database.close();
    }
  });
});
