import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  ExtractionResultSchema,
  SYNTHETIC_ROUTER_PDF_FILENAME,
  runLiveRouterExtraction,
} from "@/extraction";

const liveEnabled = process.env.RUN_LIVE_OPENAI_EXTRACTION === "1";

describe.skipIf(!liveEnabled)("opt-in live OpenAI router extraction", () => {
  it("extracts the admitted synthetic PDF through the OpenAI Agents SDK", async () => {
    expect(process.env.OPENAI_API_KEY).toBeTruthy();
    const bytes = await readFile(
      fileURLToPath(
        new URL("../fixtures/synthetic-router-pro-forma-invoice.pdf", import.meta.url),
      ),
    );

    const result = await runLiveRouterExtraction(bytes, SYNTHETIC_ROUTER_PDF_FILENAME);

    expect(ExtractionResultSchema.safeParse(result).success).toBe(true);
    expect(result.extractionMode).toBe("live_openai_agents_sdk");
    expect(result.facts).toContainEqual(
      expect.objectContaining({ field: "modelIdentity", value: "BWMI-MIMO-245-R1" }),
    );
  }, 120_000);
});
