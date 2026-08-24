import { createHash } from "node:crypto";

import { runLiveRouterExtraction } from "./agent";
import {
  RECORDED_ROUTER_EXTRACTION,
  SYNTHETIC_ROUTER_PDF_FILENAME,
  SYNTHETIC_ROUTER_PDF_SHA256,
} from "./recorded-router";
import { ExtractionResultSchema, type ExtractionResult } from "./schema";

export const MAX_EXTRACTION_BYTES = 2 * 1024 * 1024;

export class ExtractionUploadError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export class LiveExtractionUnavailableError extends Error {}

export async function extractSyntheticRouterInvoice(input: {
  bytes: Uint8Array;
  fileName: string;
  mediaType: string;
  live: boolean;
}): Promise<ExtractionResult> {
  if (input.mediaType.startsWith("image/")) {
    throw new ExtractionUploadError(
      "Images are not supported. Upload the one synthetic router pro-forma-invoice PDF.",
      415,
    );
  }
  if (input.mediaType !== "application/pdf") {
    throw new ExtractionUploadError(
      "Only the synthetic router pro-forma-invoice PDF is supported.",
      415,
    );
  }
  if (/cert(?:ificate|ification)|\b(?:bis|wpc|eta)\b/i.test(input.fileName)) {
    throw new ExtractionUploadError(
      "Certificates are not supported. Upload the one synthetic router pro-forma-invoice PDF.",
      422,
    );
  }
  if (input.bytes.byteLength === 0 || input.bytes.byteLength > MAX_EXTRACTION_BYTES) {
    throw new ExtractionUploadError(
      "The synthetic PDF must be non-empty and no larger than 2 MB.",
      413,
    );
  }
  const header = Buffer.from(input.bytes.subarray(0, 5)).toString("ascii");
  if (header !== "%PDF-") {
    throw new ExtractionUploadError("The uploaded file is not a valid PDF.", 415);
  }
  const digest = createHash("sha256").update(input.bytes).digest("hex");
  if (
    input.fileName !== SYNTHETIC_ROUTER_PDF_FILENAME ||
    digest !== SYNTHETIC_ROUTER_PDF_SHA256
  ) {
    throw new ExtractionUploadError(
      "Only the verified synthetic router pro-forma-invoice PDF is accepted in BWMI-13.",
      422,
    );
  }

  if (!input.live) {
    return ExtractionResultSchema.parse(structuredClone(RECORDED_ROUTER_EXTRACTION));
  }
  if (!process.env.OPENAI_API_KEY) throw new LiveExtractionUnavailableError();
  return runLiveRouterExtraction(input.bytes, input.fileName);
}
