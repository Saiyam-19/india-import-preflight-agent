import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import { migrateAllStores } from "@/server/data/migrate";
import {
  evaluateCondition,
  normalizeCharacteristicValue,
  type Condition,
  type RegulatoryCharacteristic,
} from "@/server/knowledge/electronics-domain";
import {
  loadElectronicsKnowledgeGraph,
  loadElectronicsKnowledgeGraphFile,
} from "@/server/knowledge/electronics-knowledge-loader";
import { RegulatoryStore } from "@/server/knowledge/regulatory-store";

const fixtureDirectory = join(
  dirname(fileURLToPath(import.meta.url)),
  "../fixtures/electronics-knowledge",
);
const projectRoot = resolve(fixtureDirectory, "../../..");
const execFileAsync = promisify(execFile);
const stores: RegulatoryStore[] = [];
type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected a JSON object.");
  return value as JsonRecord;
}

function records(value: unknown): JsonRecord[] {
  if (!Array.isArray(value)) throw new Error("Expected a JSON array.");
  return value.map(record);
}

function node(graph: JsonRecord, predicate: (candidate: JsonRecord) => boolean) {
  const found = records(graph.nodes).find(predicate);
  if (!found) throw new Error("Fixture node was not found.");
  return found;
}

function edge(graph: JsonRecord) {
  const found = records(graph.edges)[0];
  if (!found) throw new Error("Fixture edge was not found.");
  return found;
}

async function input() {
  return JSON.parse(await readFile(join(fixtureDirectory, "valid.json"), "utf8")) as Record<string, unknown>;
}

async function harness() {
  const rootDir = await mkdtemp(join(tmpdir(), "bwmi-electronics-loader-"));
  const { paths } = migrateAllStores({ rootDir });
  const regulatoryStore = new RegulatoryStore(paths.regulatory);
  stores.push(regulatoryStore);
  return regulatoryStore;
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

describe("electronics domain contract", () => {
  it("uses closed three-valued condition semantics", () => {
    const condition: Condition = {
      all: [
        { characteristic: "radio.transmitter_present", op: "present" },
        { not: { characteristic: "battery.present", op: "present" } },
      ],
    };
    const radio: RegulatoryCharacteristic = {
      id: "radio.transmitter_present",
      namespace: "radio",
      value: true,
      basis: "confirmed by user",
      provenance: "user",
      confirmed: true,
    };
    expect(evaluateCondition(condition, [radio])).toEqual({
      value: "unknown",
      missingCharacteristics: ["battery.present"],
    });
    expect(evaluateCondition(condition, [radio, { ...radio, id: "battery.present", namespace: "battery", value: false }]))
      .toEqual({ value: true, missingCharacteristics: [] });
    expect(evaluateCondition({ any: [{ ...condition }, { characteristic: "camera.present", op: "present" }] }, [radio]))
      .toEqual({ value: "unknown", missingCharacteristics: ["battery.present", "camera.present"] });
  });

  it("normalizes only the frozen unit table and rejects unknown dimensions", () => {
    expect(normalizeCharacteristicValue(2.4, "ghz")).toEqual({ value: 2_400_000_000, unit: "hz" });
    expect(normalizeCharacteristicValue(500, "mah")).toEqual({ value: 0.5, unit: "ah" });
    expect(() => normalizeCharacteristicValue(3, "dbm")).toThrow(/unknown unit/i);
  });

  it("compares numeric equality only after canonical unit normalization", () => {
    const frequency: RegulatoryCharacteristic = {
      id: "radio.frequency_hz",
      namespace: "radio",
      value: 2_400,
      unit: "mhz",
      basis: "confirmed by user",
      provenance: "user",
      confirmed: true,
    };
    expect(evaluateCondition({
      characteristic: "radio.frequency_hz",
      op: "eq",
      value: 2_400_000_000,
      unit: "hz",
    }, [frequency])).toEqual({ value: true, missingCharacteristics: [] });
  });
});

describe("strict electronics knowledge loader", () => {
  it("selects only production-graph URLs with access semantics while preserving ordinary link selection", async () => {
    const environment = {
      ...process.env,
      BWMI_LINK_CONCURRENCY: "100",
      BWMI_LINK_TIMEOUT_MS: "1",
      BWMI_VALIDATE_PRODUCTION_KNOWLEDGE: "1",
    };
    const production = await execFileAsync(
      process.execPath,
      ["scripts/verify-official-links.mjs", "--list-production-links"],
      { cwd: projectRoot, env: environment },
    );
    const productionLinks = JSON.parse(production.stdout) as Array<{
      blocking: boolean;
      expectedAccess: string;
      references: Array<{
        field: string;
        nodeId?: string;
        sourceVersionId?: string;
        state?: "actionable" | "admitted" | "coverage_pending" | "evidence_pending";
      }>;
      url: string;
    }>;
    expect(new Set(productionLinks.map((link) => link.url)).size).toBe(productionLinks.length);
    for (const link of productionLinks) {
      const parsed = new URL(link.url);
      expect(parsed.protocol).toBe("https:");
      expect(
        /(?:^|\.)(?:(?:gov|nic)\.in|gov\.cn)$/i.test(parsed.hostname) ||
        ["static.tp-link.com", "www.crsbis.in", "www.singlewindow.cn"].includes(parsed.hostname),
      ).toBe(true);
      const semanticReferences = link.references.filter((reference) => reference.state);
      expect(semanticReferences.length).toBeGreaterThan(0);
      if (link.blocking) {
        expect(semanticReferences.some((reference) =>
          reference.state === "admitted" || reference.state === "actionable"
        )).toBe(true);
      } else {
        expect(semanticReferences.every((reference) =>
          reference.state === "evidence_pending" || reference.state === "coverage_pending"
        )).toBe(true);
      }
    }
    expect(productionLinks).toEqual(expect.arrayContaining([
      expect.objectContaining({
        url: "https://eservices.dot.gov.in/saral/contact-us",
        expectedAccess: "public",
        references: expect.arrayContaining([
          expect.objectContaining({ state: "admitted", sourceVersionId: expect.any(String) }),
        ]),
        blocking: true,
      }),
      expect.objectContaining({
        url: "https://www.eservices.dot.gov.in/equipment-type-approval-eta",
        expectedAccess: "login_required",
        references: expect.arrayContaining([
          expect.objectContaining({ state: "admitted", sourceVersionId: expect.any(String) }),
          expect.objectContaining({ nodeId: "filing-service-wpc-eta", state: "evidence_pending" }),
          expect.objectContaining({ nodeId: "filing-service-wpc-eta-process", state: "evidence_pending" }),
        ]),
        blocking: true,
      }),
      expect.objectContaining({
        url: "https://www.icegate.gov.in/guidelines/esanchit-advisory",
        expectedAccess: "login_required",
        references: expect.arrayContaining([
          expect.objectContaining({ nodeId: "filing-service-esanchit", state: "evidence_pending" }),
        ]),
        blocking: false,
      }),
    ]));
    expect(productionLinks.some((link) => link.url.includes("mofcom.gov.cn"))).toBe(false);
    expect(productionLinks.some((link) => link.url.includes("static.tp-link.com"))).toBe(false);

    const ordinary = await execFileAsync(
      process.execPath,
      ["scripts/verify-official-links.mjs", "--list-ordinary-links"],
      { cwd: projectRoot, env: { ...process.env, BWMI_VALIDATE_PRODUCTION_KNOWLEDGE: "" } },
    );
    const ordinaryUrls = JSON.parse(ordinary.stdout) as string[];
    expect(ordinaryUrls).toContain("https://policy.mofcom.gov.cn/claw/clawContent.shtml?id=90362");
  });

  it("loads the frozen graph only after snapshot, admission, field, edge, and satisfaction validation", async () => {
    const regulatoryStore = await harness();
    const graph = await loadElectronicsKnowledgeGraphFile({
      filePath: join(fixtureDirectory, "valid.json"),
      regulatoryStore,
      snapshotRoot: fixtureDirectory,
    });
    expect(graph).toMatchObject({ schemaVersion: 1, graphId: "china-india-electronics-v1" });
    expect(regulatoryStore.electronicsKnowledge.getNode("requirement:radio-authorization")?.node.kind)
      .toBe("requirement");
  });

  it.each([
    ["unknown node fields", (graph: JsonRecord) => { node(graph, () => true).productName = "named product"; }],
    ["uncatalogued or named-product conditions", (graph: JsonRecord) => { node(graph, () => true).conditions = { characteristic: "product.name", op: "eq", value: "router" }; }],
    ["named-product values hidden behind catalog keys", (graph: JsonRecord) => { node(graph, () => true).conditions = { characteristic: "product.form", op: "eq", value: "router" }; }],
    ["unknown relations", (graph: JsonRecord) => { edge(graph).relation = "maybe_requires"; }],
    ["missing field evidence", (graph: JsonRecord) => { delete record(node(graph, (candidate) => candidate.kind === "requirement").fieldEvidence).ownerRole; }],
    ["duplicate IDs", (graph: JsonRecord) => { const values = records(graph.nodes); if (values[0] && values[1]) values[1].id = values[0].id; }],
    ["invalid portal URLs", (graph: JsonRecord) => { record(node(graph, (candidate) => candidate.kind === "filing_service").payload).canonicalUrl = "http://example.com/service"; }],
    ["empty satisfaction groups", (graph: JsonRecord) => { record(node(graph, (candidate) => candidate.kind === "requirement").payload).satisfaction = { all: [] }; }],
    ["unbound threshold facts", (graph: JsonRecord) => { record(node(graph, (candidate) => candidate.id === "requirement:high-band-radio-authorization").conditions).unit = undefined; }],
  ])("rejects %s", async (_label, mutate) => {
    const graph = await input();
    mutate(graph);
    await expect(loadElectronicsKnowledgeGraph({
      input: graph,
      regulatoryStore: await harness(),
      snapshotRoot: fixtureDirectory,
    })).rejects.toThrow();
  });

  it("rejects support replay with a wrong source, locator, claim ID, direction, or hash", async () => {
    const mutations = [
      (graph: JsonRecord) => { record(edge(graph).evidence).sourceVersionId = "foreign-source"; },
      (graph: JsonRecord) => { record(edge(graph).evidence).exactLocator = "Other paragraph"; },
      (graph: JsonRecord) => { record(edge(graph).evidence).claimId = "free-text"; },
      (graph: JsonRecord) => { record(edge(graph).evidence).supportText = "Technical Certificate requires Radio Authorization."; },
      (graph: JsonRecord) => { record(edge(graph).evidence).supportSha256 = "0".repeat(64); },
    ];
    for (const mutate of mutations) {
      const graph = await input();
      mutate(graph);
      await expect(loadElectronicsKnowledgeGraph({
        input: graph,
        regulatoryStore: await harness(),
        snapshotRoot: fixtureDirectory,
      })).rejects.toThrow();
    }
  });

  it.runIf(process.env.BWMI_VALIDATE_PRODUCTION_KNOWLEDGE === "1")(
    "validates and traverses the production graph",
    async () => {
      const regulatoryStore = await harness();
      await loadElectronicsKnowledgeGraphFile({
        filePath: join(projectRoot, "evidence/knowledge/china-india-electronics-v1.json"),
        regulatoryStore,
        snapshotRoot: projectRoot,
      });
      const matches = regulatoryStore.electronicsKnowledge.matchNodes([]);
      expect(matches.some((match) => match.evidenceState === "current")).toBe(true);
      expect(matches.some((match) => match.node.kind === "coverage_gap" && match.evidenceState === "pending"))
        .toBe(true);
    },
  );
});
