import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { migrateAllStores } from "@/server/data/migrate";
import type { RegulatoryCharacteristic } from "@/server/knowledge/electronics-domain";
import { loadElectronicsKnowledgeGraph } from "@/server/knowledge/electronics-knowledge-loader";
import { RegulatoryStore } from "@/server/knowledge/regulatory-store";

const fixtureDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/electronics-knowledge",
);
const stores: RegulatoryStore[] = [];

async function harness() {
  const rootDir = await mkdtemp(join(tmpdir(), "bwmi-electronics-store-"));
  const { paths } = migrateAllStores({ rootDir });
  const regulatoryStore = new RegulatoryStore(paths.regulatory);
  stores.push(regulatoryStore);
  const input = JSON.parse(await readFile(join(fixtureDirectory, "valid.json"), "utf8"));
  await loadElectronicsKnowledgeGraph({ input, regulatoryStore, snapshotRoot: fixtureDirectory });
  return regulatoryStore.electronicsKnowledge;
}

function characteristic(
  id: string,
  value: RegulatoryCharacteristic["value"],
  unit?: string,
): RegulatoryCharacteristic {
  return {
    id,
    namespace: id.split(".")[0] as RegulatoryCharacteristic["namespace"],
    value,
    ...(unit ? { unit } : {}),
    basis: "fixture confirmation",
    provenance: "user",
    confirmed: true,
  };
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

describe("ElectronicsKnowledgeStore", () => {
  it("finds graph nodes through FTS labels and aliases", async () => {
    const store = await harness();
    expect(store.search("wireless authorization").map((node) => node.id)).toContain(
      "requirement:radio-authorization",
    );
  });

  it("traverses confirmed characteristics and canonical numeric thresholds", async () => {
    const store = await harness();
    const lowBand = store.matchNodes([
      characteristic("radio.transmitter_present", true),
      characteristic("radio.frequency_hz", 915_000_000, "hz"),
    ]);
    expect(lowBand.filter((match) => match.applicability === true).map((match) => match.node.id))
      .toContain("requirement:radio-authorization");
    expect(lowBand.find((match) => match.node.id === "requirement:high-band-radio-authorization")?.applicability)
      .toBe(false);

    const highBand = store.matchNodes([
      characteristic("radio.transmitter_present", true),
      characteristic("radio.frequency_hz", 2.4, "ghz"),
    ]);
    expect(highBand.find((match) => match.node.id === "requirement:high-band-radio-authorization"))
      .toMatchObject({ applicability: true, evidenceState: "current" });
  });

  it("returns statutory-entry facts with exact source-version binding", async () => {
    const store = await harness();
    const result = store.getNode("statutory:wpc-eta");
    expect(result).toMatchObject({
      node: {
        payload: { system: "WPC_ETA", entryId: "ETA", officialLabel: "WPC Equipment Type Approval" },
      },
      evidenceBindings: expect.arrayContaining([
        expect.objectContaining({ sourceVersionId: "india-official-web-d46dd195a281b8ed-edbd3c20dc", exactLocator: "Fixture paragraph 1" }),
      ]),
    });
  });

  it("fails closed when admitted evidence is stale", async () => {
    const store = await harness();
    const matches = store.matchNodes(
      [characteristic("radio.transmitter_present", true)],
      { at: new Date("2028-01-01T00:00:00.000Z") },
    );
    expect(matches.find((match) => match.node.id === "requirement:radio-authorization"))
      .toMatchObject({ applicability: true, evidenceState: "pending" });
  });
});
