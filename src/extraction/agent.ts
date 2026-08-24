import { Agent, Runner, user } from "@openai/agents";

import {
  AgentExtractionSchema,
  ExtractionResultSchema,
  type ExtractionResult,
} from "./schema";

export const EXTRACTION_AGENT_INSTRUCTIONS = `
Extract only facts visibly printed in the supplied single-page synthetic pro-forma invoice.
Return the product-neutral structured schema exactly. Include page and row provenance and a 0–1 confidence for every fact.
You may normalize obvious formatting such as a printed country name plus code or INR thousands separators, while preserving the raw visible value.
Ask only questions whose answers could change applicability, required evidence, or cost inputs.
Never choose a product pack, decide scope or legal applicability, classify a product, supply an HS code, decide evidence status, determine a compliance or Customs outcome, calculate arithmetic, rates, duties, or totals, or infer facts that are not visible.
Do not include certificates, images, other documents, or any document content outside the supplied PDF.
`.trim();

const privateRunner = new Runner({
  modelSettings: { store: false },
  tracingDisabled: true,
  traceIncludeSensitiveData: false,
});

function extractionAgent() {
  return new Agent({
    name: "Synthetic pro-forma invoice fact extractor",
    instructions: EXTRACTION_AGENT_INSTRUCTIONS,
    model: process.env.BWMI_OPENAI_EXTRACTION_MODEL ?? "gpt-5-mini",
    outputType: AgentExtractionSchema,
  });
}

export async function runLiveRouterExtraction(
  bytes: Uint8Array,
  fileName: string,
): Promise<ExtractionResult> {
  const dataUrl = `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`;
  const result = await privateRunner.run(
    extractionAgent(),
    [
      user([
        {
          type: "input_text",
          text: "Extract the visible facts from this one admitted synthetic pro-forma invoice.",
        },
        { type: "input_file", file: dataUrl, filename: fileName },
      ]),
    ],
    {
      maxTurns: 1,
    },
  );
  const payload = AgentExtractionSchema.parse(result.finalOutput);

  return ExtractionResultSchema.parse({
    schemaVersion: "1.0",
    extractionMode: "live_openai_agents_sdk",
    document: {
      kind: "pro_forma_invoice",
      fileName,
      pageCount: 1,
      syntheticScopeId: "bwmi-router-pro-forma-v1",
    },
    facts: payload.facts,
    materialQuestions: payload.materialQuestions,
    limitations: [
      "Verified only for this one synthetic router pro-forma invoice PDF.",
      "Visible commercial facts are extracted; legal applicability, outcomes, evidence status, and arithmetic remain outside the agent.",
    ],
  });
}
