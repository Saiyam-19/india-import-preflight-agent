import { performance } from "node:perf_hooks";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { POST as postChat } from "@/app/api/chat/route";
import { buildElectronicsActionDossier } from "@/server/assessment/electronics-dossier";
import { migrateAllStores } from "@/server/data/migrate";
import type { ElectronicsProfile, RegulatoryCharacteristic } from "@/server/knowledge/electronics-domain";
import { loadElectronicsKnowledgeGraphFile } from "@/server/knowledge/electronics-knowledge-loader";
import { RegulatoryStore } from "@/server/knowledge/regulatory-store";

const projectRoot = resolve(import.meta.dirname, "../..");
let regulatoryStore: RegulatoryStore;

function characteristic(id: string, value: RegulatoryCharacteristic["value"], unit?: string): RegulatoryCharacteristic {
  return {
    id,
    namespace: id.split(".")[0] as RegulatoryCharacteristic["namespace"],
    value,
    ...(unit ? { unit } : {}),
    basis: "runtime latency input",
    provenance: "user",
    confirmed: true,
  };
}

function runtimeProfile(productDescription: string, characteristics: RegulatoryCharacteristic[]): ElectronicsProfile {
  return {
    intake: { direction: "china_to_india", productDescription, purchaseEvidenceDocumentIds: [] },
    characteristics,
    classificationCandidates: [],
    unresolvedCharacteristicQuestions: [],
  };
}

beforeAll(async () => {
  const rootDir = await mkdtemp(`${tmpdir()}/bwmi-electronics-latency-`);
  const { paths } = migrateAllStores({ rootDir });
  regulatoryStore = new RegulatoryStore(paths.regulatory);
  await loadElectronicsKnowledgeGraphFile({
    filePath: resolve(projectRoot, "evidence/knowledge/china-india-electronics-v1.json"),
    regulatoryStore,
    snapshotRoot: projectRoot,
  });
});

afterAll(() => regulatoryStore.close());

describe("direct local electronics dossier latency", () => {
  it.runIf(process.env.BWMI_ELECTRONICS_LATENCY_MODE !== "route")(
    "keeps direct-engine p95 below two seconds across runtime-supplied trait combinations",
    () => {
    const supplied = process.env.BWMI_UNSEEN_ELECTRONICS_PRODUCT ?? "runtime-only impedance spectroscopy controller";
    const profiles = [
      runtimeProfile(supplied, [characteristic("radio.transmitter_present", true), characteristic("radio.frequency_hz", 2.4, "ghz")]),
      runtimeProfile("runtime-only battery cycler", [characteristic("battery.present", true), characteristic("radio.transmitter_present", false)]),
      runtimeProfile("runtime-only optical measurement chassis", [characteristic("camera.present", true), characteristic("telecom.interface", "none")]),
      runtimeProfile("runtime-only network test assembly", [characteristic("telecom.interface", "cellular"), characteristic("import.purpose", "commercial")]),
    ];
    const durations: number[] = [];
    const at = new Date("2026-08-26T00:00:00.000Z");
    for (let index = 0; index < 160; index += 1) {
      const started = performance.now();
      const dossier = buildElectronicsActionDossier({
        at,
        knowledgeStore: regulatoryStore.electronicsKnowledge,
        profile: profiles[index % profiles.length]!,
        regulatoryStore,
      });
      expect(dossier.decision.status).toMatch(/pending|required|clear/);
      durations.push(performance.now() - started);
    }
    durations.sort((left, right) => left - right);
    const p95 = durations[Math.ceil(durations.length * 0.95) - 1]!;
    console.info(`BWMI_ELECTRONICS_ENGINE_P95_MS=${p95.toFixed(3)}`);
    expect(p95).toBeLessThan(2_000);
    },
  );
});

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function resultEvent(response: Response) {
  const events = (await response.text())
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  const result = events.find((event) => event.type === "result");
  if (!result) throw new Error(`Route did not return a result event: ${JSON.stringify(events)}`);
  return result as {
    mode: string;
    output: {
      actionDossier?: { decision: { status: string } } | null;
      journeyStage?: string | null;
      nextQuestion?: string;
    };
    tradeCase: { id: string };
  };
}

function percentile95(durations: number[]) {
  const sorted = [...durations].sort((left, right) => left - right);
  return sorted[Math.ceil(sorted.length * 0.95) - 1]!;
}

describe("direct no-provider chat-route latency", () => {
  it.runIf(process.env.BWMI_ELECTRONICS_LATENCY_MODE !== "engine-only")(
    "keeps first useful intake under one second and local workflow advancement under two seconds",
    async () => {
      const dataRoot = await mkdtemp(`${tmpdir()}/bwmi-electronics-route-latency-`);
      vi.stubEnv("BWMI_DATA_DIR", dataRoot);
      vi.stubEnv("OPENAI_API_KEY", "");
      vi.stubEnv("OPENROUTER_API_KEY", "");
      vi.stubEnv("BWMI_OPENAI_BASE_URL", "");
      vi.stubEnv("BWMI_OPENAI_MODEL", "");
      vi.stubGlobal("fetch", vi.fn(() => {
        throw new Error("The local route latency path must not construct a provider or search request.");
      }));
      try {
        const firstResponseDurations: number[] = [];
        const tradeCaseIds: string[] = [];
        for (let index = 0; index < 24; index += 1) {
          const started = performance.now();
          const result = await resultEvent(await postChat(jsonRequest({
            mode: "instant",
            question: `Before ordering, can I import runtime-only electronic measurement controller ${index} from China to India?`,
          })));
          firstResponseDurations.push(performance.now() - started);
          expect(result.mode).toBe("instant_preorder_triage");
          expect(result.output.nextQuestion).toMatch(/quantity.*price.*currency.*origin.*destination/is);
          tradeCaseIds.push(result.tradeCase.id);
        }

        const dossierDurations: number[] = [];
        for (const [index, tradeCaseId] of tradeCaseIds.entries()) {
          const started = performance.now();
          const result = await resultEvent(await postChat(jsonRequest({
            mode: "instant",
            tradeCaseId,
            question: `Confirm: 2 units at USD 49.50 each for commercial use; origin: Shenzhen 518000; destination: Mumbai 400001; model: RUNTIME-${index}; principal function: electrical measurement; product URL: https://example.test/runtime-${index}; specifications: 230 V input; pre-purchase; Incoterm: CIF; freight: USD 12; insurance: USD 2; radio transmitter: no; battery present: no.`,
          })));
          dossierDurations.push(performance.now() - started);
          expect(result.mode).toBe("instant_preorder_triage");
          expect(result.output.journeyStage).toBe("pre_purchase_research");
          expect(result.output.actionDossier).toBeNull();
        }

        const firstResponseP95 = percentile95(firstResponseDurations);
        const dossierP95 = percentile95(dossierDurations);
        console.info(`BWMI_ELECTRONICS_FIRST_RESPONSE_P95_MS=${firstResponseP95.toFixed(3)}`);
        console.info(`BWMI_ELECTRONICS_ROUTE_WORKFLOW_P95_MS=${dossierP95.toFixed(3)}`);
        expect(firstResponseP95).toBeLessThan(1_000);
        expect(dossierP95).toBeLessThan(2_000);
      } finally {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
      }
    },
  );
});
