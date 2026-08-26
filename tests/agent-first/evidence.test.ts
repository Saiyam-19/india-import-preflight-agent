import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, it } from "vitest";

import { migrateAllStores } from "@/server/data/migrate";
import {
  DGFT_REFERENCE_SOURCE,
  RegulatoryStore,
  admitBundledReferenceSource,
} from "@/server/knowledge/regulatory-store";

describe("admitted official evidence", () => {
  it("admits the hash-pinned DGFT snapshot with an exact locator and coverage manifest", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-16-evidence-"));
    const { paths } = migrateAllStores({ rootDir });
    const store = new RegulatoryStore(paths.regulatory);

    const admitted = await admitBundledReferenceSource(store, paths.sources);
    const citation = store.resolveCitation({
      sourceVersionId: admitted.sourceVersionId,
      locator: "Foreign Trade Policy 2023, Chapter 2, paragraphs 2.05(a)-(c) and 2.06(b)-(d)",
    });

    expect(admitted.sha256).toBe(DGFT_REFERENCE_SOURCE.sha256);
    expect(admitted.authority).toBe("Directorate General of Foreign Trade (DGFT)");
    expect(admitted.admissionState).toBe("admitted");
    expect(admitted.snapshotPath).toContain(admitted.sha256);
    expect(admitted.coverage).toEqual({
      jurisdiction: "India",
      question: "IEC and baseline import documents",
      status: "research_guidance",
    });
    expect(citation.url).toMatch(/^https:\/\/content\.dgft\.gov\.in\//);
    expect(citation.locator).toContain("2.05");
    expect(() =>
      store.resolveCitation({ sourceVersionId: "unknown", locator: "paragraph 2.05" }),
    ).toThrow(/not admitted/i);
    store.close();
  });

  it("refuses stale or conflicting pinned reference evidence everywhere factual claims can be released", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-17-reference-currentness-"));
    const { paths } = migrateAllStores({ rootDir });
    const store = new RegulatoryStore(paths.regulatory);
    await admitBundledReferenceSource(store, paths.sources);
    const database = new DatabaseSync(paths.regulatory);

    database.prepare("UPDATE source_versions SET fresh_until = '2000-01-01' WHERE id = ?")
      .run(DGFT_REFERENCE_SOURCE.sourceVersionId);
    await expect(admitBundledReferenceSource(store, paths.sources)).rejects.toThrow(/stale/i);
    expect(() => store.getReferenceEvidence(paths.sources)).toThrow(/stale/i);
    expect(() => store.resolveCitation({
      sourceVersionId: DGFT_REFERENCE_SOURCE.sourceVersionId,
      locator: DGFT_REFERENCE_SOURCE.locator,
    })).toThrow(/stale/i);

    database.prepare("UPDATE source_versions SET fresh_until = ?, conflict_status = 'conflicting' WHERE id = ?")
      .run(DGFT_REFERENCE_SOURCE.freshUntil, DGFT_REFERENCE_SOURCE.sourceVersionId);
    await expect(admitBundledReferenceSource(store, paths.sources)).rejects.toThrow(/conflict/i);
    expect(() => store.getReferenceEvidence(paths.sources)).toThrow(/conflict/i);
    expect(() => store.resolveCitation({
      sourceVersionId: DGFT_REFERENCE_SOURCE.sourceVersionId,
      locator: DGFT_REFERENCE_SOURCE.locator,
    })).toThrow(/conflict/i);
    database.close();
    store.close();
  });
});
