import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import { resolveAiProviderConfiguration } from "../agent/provider-config";
import { runVisionDocumentExtraction } from "./vision-extractor";

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
export const MAX_DOCUMENT_PAGES = 20;
export const MAX_IMAGE_DIMENSION = 12_000;
export const MAX_IMAGE_PIXELS = 24_000_000;
export const MAX_PARSER_MILLISECONDS = 10_000;

export const DOCUMENT_FACT_FIELDS = [
  "documentNumber",
  "exporterIdentity",
  "producerIdentity",
  "manufacturerIdentity",
  "importerIdentity",
  "endUserIdentity",
  "productDescription",
  "modelIdentity",
  "adapterModelIdentity",
  "indiaTariffCode",
  "chinaTariffCode",
  "originCountryCode",
  "manufacturingSite",
  "originBasis",
  "endUse",
  "exportPort",
  "importPort",
  "documentDate",
  "expiryDate",
  "incoterm",
  "quantity",
  "itemValueInr",
  "freightInr",
  "insuranceInr",
] as const;

export type DocumentFactField = (typeof DOCUMENT_FACT_FIELDS)[number];
export type DocumentMediaType = "application/pdf" | "image/jpeg" | "image/png";
export type DocumentIntakeCode =
  | "corrupt"
  | "encrypted"
  | "mime_mismatch"
  | "over_limit"
  | "unreadable"
  | "unsupported";

export class DocumentIntakeError extends Error {
  constructor(
    readonly code: DocumentIntakeCode,
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export interface InspectedDocument {
  height?: number;
  kind: "image" | "pdf";
  mediaType: DocumentMediaType;
  pageCount: number;
  width?: number;
}

export interface VisibleDocumentFact {
  field: DocumentFactField;
  label: string;
  provenance: {
    confidence: number;
    documentPage: number;
    method: "embedded_pdf_text" | "image_vision";
    region: {
      height: number;
      unit: "image_pixels" | "normalized_0_1000" | "pdf_points";
      width: number;
      x: number;
      y: number;
    };
  };
  rawValue: string;
  value: string;
}

export interface DocumentExtractionResult extends InspectedDocument {
  facts: VisibleDocumentFact[];
  message: string;
  status: "quarantined" | "ready_for_review" | "unreadable";
}

interface UploadInput {
  bytes: Uint8Array;
  declaredMediaType: string;
  fileName: string;
}

interface PdfTextRegion {
  height: number;
  page: number;
  text: string;
  width: number;
  x: number;
  y: number;
}

const PDF_HEADER = [0x25, 0x50, 0x44, 0x46, 0x2d];
const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function startsWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

function sniffMediaType(bytes: Uint8Array): DocumentMediaType | undefined {
  if (startsWith(bytes, PDF_HEADER)) return "application/pdf";
  if (startsWith(bytes, PNG_HEADER)) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  return undefined;
}

function expectedExtensions(mediaType: DocumentMediaType) {
  if (mediaType === "application/pdf") return [".pdf"];
  if (mediaType === "image/png") return [".png"];
  return [".jpg", ".jpeg"];
}

function ensureDeclaredTypeAndExtension(input: UploadInput, mediaType: DocumentMediaType) {
  const declared = input.declaredMediaType.trim().toLowerCase();
  const extension = extname(input.fileName).toLowerCase();
  if (
    (declared !== "" && declared !== mediaType) ||
    !expectedExtensions(mediaType).includes(extension)
  ) {
    throw new DocumentIntakeError(
      "mime_mismatch",
      "The file name, declared type, and detected content do not match.",
      415,
    );
  }
}

function ensureImageLimits(width: number, height: number) {
  if (
    width <= 0 ||
    height <= 0 ||
    width > MAX_IMAGE_DIMENSION ||
    height > MAX_IMAGE_DIMENSION ||
    width * height > MAX_IMAGE_PIXELS
  ) {
    throw new DocumentIntakeError(
      "over_limit",
      `Images must be at most ${MAX_IMAGE_DIMENSION} pixels on either edge and ${MAX_IMAGE_PIXELS.toLocaleString("en-IN")} pixels total.`,
      413,
    );
  }
}

function pngDimensions(bytes: Uint8Array) {
  if (bytes.byteLength < 24 || Buffer.from(bytes.subarray(12, 16)).toString("ascii") !== "IHDR") {
    throw new DocumentIntakeError("corrupt", "The PNG is corrupt or unreadable.", 422);
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegDimensions(bytes: Uint8Array) {
  let offset = 2;
  while (offset + 9 < bytes.byteLength) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1]!;
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const length = (bytes[offset + 2]! << 8) + bytes[offset + 3]!;
    if (length < 2 || offset + 2 + length > bytes.byteLength) break;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      return {
        height: (bytes[offset + 5]! << 8) + bytes[offset + 6]!,
        width: (bytes[offset + 7]! << 8) + bytes[offset + 8]!,
      };
    }
    offset += length + 2;
  }
  throw new DocumentIntakeError("corrupt", "The JPEG is corrupt or uses an unsupported encoding.", 422);
}

function pdfLooksEncrypted(bytes: Uint8Array) {
  return Buffer.from(bytes).includes(Buffer.from("/Encrypt"));
}

function parserLimitError() {
  return new DocumentIntakeError(
    "over_limit",
    `Document parsing must finish within ${MAX_PARSER_MILLISECONDS / 1000} seconds.`,
    413,
  );
}

export async function withParserDeadline<T>(
  promise: Promise<T>,
  deadline: number,
  onTimeout?: () => void | Promise<void>,
) {
  const remaining = deadline - Date.now();
  if (remaining <= 0) throw parserLimitError();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          void onTimeout?.();
          reject(parserLimitError());
        }, remaining);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function openPdf(bytes: Uint8Array, deadline: number) {
  const loadingTask = getDocument({
    data: bytes.slice(),
    disableAutoFetch: true,
    disableStream: true,
    useWorkerFetch: false,
    verbosity: 0,
  });
  try {
    return {
      pdf: await withParserDeadline(loadingTask.promise, deadline, () => loadingTask.destroy()),
      destroy: () => loadingTask.destroy(),
    };
  } catch (error) {
    await loadingTask.destroy();
    if (error instanceof DocumentIntakeError) throw error;
    const name = error instanceof Error ? error.name : "";
    const message = error instanceof Error ? error.message : "";
    if (/password/i.test(`${name} ${message}`)) {
      throw new DocumentIntakeError("encrypted", "Encrypted PDFs are not accepted.", 422);
    }
    throw new DocumentIntakeError("corrupt", "The PDF is corrupt or unreadable.", 422);
  }
}

export async function inspectDocument(input: UploadInput): Promise<InspectedDocument> {
  if (input.bytes.byteLength === 0) {
    throw new DocumentIntakeError("unreadable", "The uploaded document is empty.", 422);
  }
  if (input.bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new DocumentIntakeError(
      "over_limit",
      `Each document must be no larger than ${MAX_DOCUMENT_BYTES / 1024 / 1024} MB.`,
      413,
    );
  }
  const mediaType = sniffMediaType(input.bytes);
  if (!mediaType) {
    throw new DocumentIntakeError(
      "unsupported",
      "Only content-sniffed PDF, PNG, and JPEG documents are supported.",
      415,
    );
  }
  ensureDeclaredTypeAndExtension(input, mediaType);

  if (mediaType === "application/pdf") {
    if (pdfLooksEncrypted(input.bytes)) {
      throw new DocumentIntakeError("encrypted", "Encrypted PDFs are not accepted.", 422);
    }
    const deadline = Date.now() + MAX_PARSER_MILLISECONDS;
    const { pdf, destroy } = await openPdf(input.bytes, deadline);
    try {
      if (pdf.numPages > MAX_DOCUMENT_PAGES) {
        throw new DocumentIntakeError(
          "over_limit",
          `PDFs must contain at most ${MAX_DOCUMENT_PAGES} pages.`,
          413,
        );
      }
      return { kind: "pdf", mediaType, pageCount: pdf.numPages };
    } finally {
      await destroy();
    }
  }

  const { width, height } = mediaType === "image/png"
    ? pngDimensions(input.bytes)
    : jpegDimensions(input.bytes);
  ensureImageLimits(width, height);
  return { kind: "image", mediaType, pageCount: 1, width, height };
}

async function pdfTextRegions(bytes: Uint8Array) {
  const deadline = Date.now() + MAX_PARSER_MILLISECONDS;
  const { pdf, destroy } = await openPdf(bytes, deadline);
  const regions: PdfTextRegion[] = [];
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await withParserDeadline(pdf.getPage(pageNumber), deadline);
      const content = await withParserDeadline(
        page.getTextContent({ disableNormalization: false }),
        deadline,
      );
      for (const item of content.items) {
        if (!("str" in item) || item.str.trim() === "") continue;
        regions.push({
          text: item.str.trim(),
          page: pageNumber,
          x: Number(item.transform[4].toFixed(2)),
          y: Number(item.transform[5].toFixed(2)),
          width: Number(item.width.toFixed(2)),
          height: Number(item.height.toFixed(2)),
        });
      }
    }
  } finally {
    await destroy();
  }
  return regions;
}

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+|any\s+|the\s+)?(?:previous|prior|above)\s+instructions?/i,
  /(?:reveal|repeat|print|show)\s+(?:the\s+)?(?:system|developer)\s+(?:prompt|message|instructions?)/i,
  /(?:mark|declare|report)\b.{0,50}\b(?:cleared|approved|compliant|valid|released)/i,
  /\byou\s+are\s+(?:chatgpt|an?\s+assistant|the\s+system)\b/i,
];

function containsInstructionLikeText(regions: PdfTextRegion[]) {
  return regions.some((region) => INJECTION_PATTERNS.some((pattern) => pattern.test(region.text)));
}

function factsContainInstructionLikeText(facts: VisibleDocumentFact[]) {
  return facts.some((fact) =>
    INJECTION_PATTERNS.some((pattern) => pattern.test(`${fact.rawValue} ${fact.value}`)),
  );
}

const FIELD_PATTERNS: Array<{
  field: DocumentFactField;
  label: string;
  pattern: RegExp;
}> = [
  { field: "documentNumber", label: "Document number", pattern: /^(?:document|invoice|reference)\s*(?:number|no\.?|#)\s*[:\-]\s*(.+)$/i },
  { field: "exporterIdentity", label: "Exporter", pattern: /^(?:exporter|shipper|sender)\s*[:\-]\s*(.+)$/i },
  { field: "producerIdentity", label: "Producer", pattern: /^producer\s*[:\-]\s*(.+)$/i },
  { field: "manufacturerIdentity", label: "Manufacturer", pattern: /^manufacturer\s*[:\-]\s*(.+)$/i },
  { field: "importerIdentity", label: "Importer", pattern: /^(?:importer|consignee|buyer)\s*[:\-]\s*(.+)$/i },
  { field: "endUserIdentity", label: "End user", pattern: /^end\s*user\s*[:\-]\s*(.+)$/i },
  { field: "productDescription", label: "Product description", pattern: /^(?:product|goods|item)\s+description\s*[:\-]\s*(.+)$/i },
  { field: "adapterModelIdentity", label: "Adapter model", pattern: /^(?:adapter|power\s+supply)\s+model\s*[:\-]\s*(.+)$/i },
  { field: "modelIdentity", label: "Model", pattern: /^(?:product\s+)?model\s*[:\-]\s*(.+)$/i },
  { field: "chinaTariffCode", label: "China commodity code", pattern: /^(?:china\s+)?(?:commodity|tariff|hs)\s*(?:code|number|no\.?)\s*[:\-]\s*(\d{10})$/i },
  { field: "originCountryCode", label: "Country of origin", pattern: /^(?:country\s+of\s+origin|origin)\s*[:\-]\s*(.+)$/i },
  { field: "manufacturingSite", label: "Manufacturing site", pattern: /^manufacturing\s+site\s*[:\-]\s*(.+)$/i },
  { field: "originBasis", label: "Origin basis", pattern: /^origin\s+basis\s*[:\-]\s*(.+)$/i },
  { field: "endUse", label: "End use", pattern: /^end\s*use\s*[:\-]\s*(.+)$/i },
  { field: "exportPort", label: "Export port", pattern: /^export\s+port\s*[:\-]\s*(.+)$/i },
  { field: "importPort", label: "Import port", pattern: /^import\s+port\s*[:\-]\s*(.+)$/i },
  { field: "documentDate", label: "Document date", pattern: /^(?:document|invoice|issue)\s+date\s*[:\-]\s*(.+)$/i },
  { field: "expiryDate", label: "Expiry date", pattern: /^(?:expiry|expiration|valid\s+until)\s*(?:date)?\s*[:\-]\s*(.+)$/i },
  { field: "incoterm", label: "Incoterm", pattern: /^incoterm\s*[:\-]\s*(.+)$/i },
  { field: "quantity", label: "Quantity", pattern: /^(?:quantity|qty\.?)\s*[:\-]\s*(.+)$/i },
  { field: "itemValueInr", label: "Item value", pattern: /^(?:item|goods|invoice)\s+value\s*[:\-]\s*(.+)$/i },
  { field: "freightInr", label: "Freight", pattern: /^freight\s*[:\-]\s*(.+)$/i },
  { field: "insuranceInr", label: "Insurance", pattern: /^insurance\s*[:\-]\s*(.+)$/i },
];

function factsFromRegions(regions: PdfTextRegion[]): VisibleDocumentFact[] {
  const facts: VisibleDocumentFact[] = [];
  const seen = new Set<DocumentFactField>();
  for (const region of regions) {
    for (const definition of FIELD_PATTERNS) {
      if (seen.has(definition.field)) continue;
      const match = definition.pattern.exec(region.text);
      const rawValue = match?.[1]?.trim();
      if (!rawValue) continue;
      seen.add(definition.field);
      facts.push({
        field: definition.field,
        label: definition.label,
        rawValue,
        value: rawValue,
        provenance: {
          documentPage: region.page,
          region: {
            x: region.x,
            y: region.y,
            width: region.width,
            height: region.height,
            unit: "pdf_points",
          },
          method: "embedded_pdf_text",
          confidence: 0.99,
        },
      });
      break;
    }
  }
  return facts;
}

export async function extractVisibleDocumentFacts(
  input: UploadInput,
): Promise<DocumentExtractionResult> {
  return withTemporaryParserWorkspace(async () => {
    const inspected = await inspectDocument(input);
    if (inspected.kind === "image") {
      if (resolveAiProviderConfiguration().available) {
        const vision = await runVisionDocumentExtraction({
          bytes: input.bytes,
          fileName: input.fileName,
          mediaType: inspected.mediaType,
        });
        if (vision.promptInjectionDetected || factsContainInstructionLikeText(vision.facts)) {
          return {
            ...inspected,
            status: "quarantined" as const,
            facts: [],
            message: "Untrusted instruction-like text was quarantined; no document fact entered the Trade Case.",
          };
        }
        if (vision.facts.length > 0) {
          return {
            ...inspected,
            status: "ready_for_review" as const,
            facts: vision.facts,
            message: "Visible facts are ready for confirmation or correction. Extraction confidence is not authenticity or validity.",
          };
        }
      }
      return {
        ...inspected,
        status: "unreadable" as const,
        facts: [],
        message: "The image passed file-safety checks, but visible text extraction requires the configured private vision extractor.",
      };
    }
    const regions = await pdfTextRegions(input.bytes);
    if (containsInstructionLikeText(regions)) {
      return {
        ...inspected,
        status: "quarantined" as const,
        facts: [],
        message: "Untrusted instruction-like text was quarantined; no document fact entered the Trade Case.",
      };
    }
    const facts = factsFromRegions(regions);
    if (facts.length === 0 && resolveAiProviderConfiguration().available) {
      const vision = await runVisionDocumentExtraction({
        bytes: input.bytes,
        fileName: input.fileName,
        mediaType: inspected.mediaType,
      });
      if (vision.promptInjectionDetected || factsContainInstructionLikeText(vision.facts)) {
        return {
          ...inspected,
          status: "quarantined" as const,
          facts: [],
          message: "Untrusted instruction-like text was quarantined; no document fact entered the Trade Case.",
        };
      }
      if (vision.facts.length > 0) {
        return {
          ...inspected,
          status: "ready_for_review" as const,
          facts: vision.facts,
          message: "Visible facts are ready for confirmation or correction. Extraction confidence is not authenticity or validity.",
        };
      }
    }
    if (facts.length === 0) {
      return {
        ...inspected,
        status: "unreadable" as const,
        facts,
        message: "No supported visible fact could be extracted. Try a text-based PDF or a clearer image.",
      };
    }
    return {
      ...inspected,
      status: "ready_for_review" as const,
      facts,
      message: "Visible facts are ready for confirmation or correction. Extraction confidence is not authenticity or validity.",
    };
  });
}

export async function withTemporaryParserWorkspace<T>(work: (path: string) => Promise<T>) {
  const path = await mkdtemp(join(tmpdir(), "bwmi-19-parser-"));
  try {
    return await work(path);
  } finally {
    await rm(path, { recursive: true, force: true, maxRetries: 2 });
  }
}
