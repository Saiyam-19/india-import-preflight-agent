import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { z } from "zod";

import type { RegulatoryStore } from "../knowledge/regulatory-store";
import { getOfficialConnector, type ConnectorState } from "./registry";
import {
  RetrievalBoundaryError,
  retrieveOfficialSource,
  type RemoteRetrievalOptions,
} from "./remote-retrieval";

export const AdmissionStateSchema = z.enum([
  "discovered",
  "snapshotted",
  "extracted",
  "validated",
  "admitted",
]);
export type AdmissionState = z.infer<typeof AdmissionStateSchema>;

const LocatorSchema = z
  .object({ kind: z.enum(["section", "paragraph", "page", "table", "record"]), value: z.string().min(2).max(500) })
  .strict();

const ExactEvidenceSpanSchema = z
  .object({ locator: LocatorSchema, exactExcerpt: z.string().min(2).max(4_000) })
  .strict();

const ApplicabilitySchema = z
  .object({
    appliesIn: z.enum(["India", "China"]),
    tradeDirection: z.enum(["china_to_india", "india_to_china"]),
    productScope: z.string().min(2).max(500),
    regulatoryDomain: z.string().min(2).max(200),
  })
  .strict();

export const AdmissionRequestSchema = z
  .object({
    sourceKind: z.enum(["legal_instrument", "official_service_page", "official_contact_page"]).optional(),
    connectorId: z.string().min(2),
    discoveredAt: z.string().datetime(),
    discoveryQuery: z.string().min(2).max(1_000),
    jurisdiction: z.enum(["India", "China"]),
    url: z.string().url(),
    authorityName: z.string().min(2).max(300),
    instrumentId: z.string().min(2).max(300),
    instrumentTitle: z.string().min(2).max(500),
    identityEvidence: z
      .object({
        authority: ExactEvidenceSpanSchema,
        instrumentId: ExactEvidenceSpanSchema,
        instrumentTitle: ExactEvidenceSpanSchema,
      })
      .strict(),
    effectiveFrom: z.string().date(),
    originalLanguage: z.enum(["en", "zh-CN"]),
    translation: z
      .object({
        status: z.enum([
          "authoritative_original",
          "official_translation",
          "derived_translation",
          "untranslated",
        ]),
        method: z.string().min(2).max(300),
        englishExcerpt: z.string().min(8).max(4_000).optional(),
        materialAmbiguity: z.boolean(),
      })
      .strict(),
    amendment: z
      .object({
        status: z.enum(["original", "amended", "superseding", "unknown"]),
        note: z.string().min(2).max(500),
        supersedesDocumentVersionId: z.string().min(2).optional(),
      })
      .strict(),
    applicability: ApplicabilitySchema,
    applicabilityEvidence: ExactEvidenceSpanSchema,
    exactLocator: LocatorSchema,
    exactExcerpt: z.string().min(8).max(4_000),
    freshUntil: z.string().date(),
  })
  .strict();
export type AdmissionRequest = z.infer<typeof AdmissionRequestSchema>;

export interface AdmissionActivity {
  at: string;
  state: AdmissionState;
}

export interface AdmittedEvidence {
  admissionId: string;
  applicability: z.infer<typeof ApplicabilitySchema>;
  applicabilityEvidence: z.infer<typeof ExactEvidenceSpanSchema>;
  authorityName: string;
  connectorId: string;
  contentType: string;
  documentVersionId: string;
  effectiveFrom: string;
  exactLocator: z.infer<typeof LocatorSchema>;
  finalUrl: string;
  freshUntil: string;
  instrumentId: string;
  instrumentTitle: string;
  identityEvidence: AdmissionRequest["identityEvidence"];
  jurisdiction: "India" | "China";
  originalLanguage: "en" | "zh-CN";
  promptInjectionDetected: boolean;
  redirectHistory: string[];
  sha256: string;
  snapshotRelativePath: string;
  sourceVersionId: string;
  state: "admitted";
  translation: AdmissionRequest["translation"];
  transitions: AdmissionActivity[];
}

export type AdmissionGapCode =
  | `connector_${Exclude<ConnectorState, "available">}`
  | "invalid_metadata"
  | "extraction_unavailable"
  | "instrument_identity_unverified"
  | "effectivity_unverified"
  | "amendment_unverified"
  | "locator_unverified"
  | "stale_evidence"
  | "scope_mismatch"
  | "translation_ambiguity"
  | "untranslated"
  | "prompt_injection_in_claim"
  | "prompt_injection_detected"
  | "source_conflict"
  | "search_empty_not_proof"
  | RetrievalBoundaryError["code"];

export type AdmissionResult =
  | { status: "admitted"; evidence: AdmittedEvidence }
  | { status: "gap"; code: AdmissionGapCode; message: string; transitions: AdmissionActivity[] };

export interface AdmissionDependencies extends RemoteRetrievalOptions {
  allowDerivedTranslation?: boolean;
  now?: () => Date;
  onActivity?: (activity: AdmissionActivity) => void;
  snapshotRoot: string;
  store: RegulatoryStore;
}

function normalizedText(value: string) {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

function compactEvidenceText(value: string) {
  return value.replace(/\s+/g, "").toLocaleLowerCase();
}

interface ExtractedSourceText {
  pages?: Map<number, string>;
  text: string;
}

async function extractUntrustedText(bytes: Uint8Array, contentType: string): Promise<ExtractedSourceText | null> {
  if (contentType === "application/pdf") {
    try {
      const loadingTask = getDocument({
        data: bytes,
        useWorkerFetch: false,
      });
      const document = await loadingTask.promise;
      const pages = new Map<number, string>();
      try {
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          const text = content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          pages.set(pageNumber, text);
          page.cleanup();
        }
      } finally {
        await loadingTask.destroy();
      }
      const text = [...pages.values()].join("\n").trim();
      return text ? { pages, text } : null;
    } catch {
      return null;
    }
  }
  const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const text = decoded
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text ? { text } : null;
}

function containsPromptInjection(text: string) {
  return /(ignore|disregard|forget|override|bypass).{0,48}(instruction|direction|prompt|message)|(?:follow|obey).{0,32}(?:these|the).{0,16}(?:instruction|direction)|system prompt|developer message|you are (?:chatgpt|an? assistant)|claim.{0,32}(?:approved|compliant|cleared)|approve every|忽略.{0,24}(?:指令|提示)|系统提示|开发者消息|遵循.{0,24}指令/i.test(text);
}

function containsConsequentialServiceClaim(text: string) {
  return /\b(?:appl(?:y|ies|icable|icability)\s+to|all\s+products?|product\s+scope|shall|must|mandatory|required|prohibited|obligation|statutory|effective\s+(?:date|from)|rate|tariff|duty|tax|fee|amount|percent|classification|classif(?:y|ied)|itc\s*\(?hs\)?|hs\s*code|clearance|cleared|compliant|approval\s+(?:granted|issued)|before|prior\s+to|after|deadline|validity)\b|[%₹]/i.test(text);
}

function locatorKindMatchesContent(
  kind: AdmissionRequest["exactLocator"]["kind"],
  contentType: string,
  bytes: Uint8Array,
) {
  if (contentType === "application/pdf") return kind === "page";
  if (kind === "page") return false;
  if (kind !== "table") return true;
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  return /<table\b|<table-row\b/i.test(raw);
}

function stripMarkup(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&");
}

function locatorAndExcerptShareVerifiedSpan(
  kind: AdmissionRequest["exactLocator"]["kind"],
  contentType: string,
  bytes: Uint8Array,
  locator: string,
  excerpt: string,
  extracted?: ExtractedSourceText,
) {
  const normalizedExcerpt = compactEvidenceText(excerpt);
  if (contentType === "application/pdf") {
    const pageMatch = locator.match(/^(?:page\s*)?(\d+)$/i);
    const pageNumber = pageMatch?.[1] ? Number.parseInt(pageMatch[1], 10) : Number.NaN;
    const pageText = Number.isInteger(pageNumber) ? extracted?.pages?.get(pageNumber) : undefined;
    return Boolean(pageText && compactEvidenceText(pageText).includes(normalizedExcerpt));
  }
  const normalizedLocator = compactEvidenceText(locator);
  const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (!contentType.includes("html") && !contentType.includes("xml")) {
    const text = compactEvidenceText(raw);
    return text.includes(normalizedExcerpt) && normalizedExcerpt.includes(normalizedLocator);
  }
  const tags =
    kind === "table"
      ? ["td", "th", "tr"]
      : kind === "paragraph"
        ? ["p", "li", "dd", "dt"]
        : ["h[1-6]", "p", "li", "dd", "dt", "td", "tr", "section", "article"];
  const blocks = tags.flatMap((tag) => raw.match(new RegExp(`<(${tag})\\b[^>]*>[\\s\\S]*?<\\/\\1>`, "gi")) ?? []);
  return blocks.some((block) => {
    const text = compactEvidenceText(stripMarkup(block));
    return text.includes(normalizedLocator) && text.includes(normalizedExcerpt);
  });
}

function evidenceSpanIsExact(
  span: z.infer<typeof ExactEvidenceSpanSchema>,
  contentType: string,
  bytes: Uint8Array,
  extracted?: ExtractedSourceText,
) {
  return (
    locatorKindMatchesContent(span.locator.kind, contentType, bytes) &&
    locatorAndExcerptShareVerifiedSpan(
      span.locator.kind,
      contentType,
      bytes,
      span.locator.value,
      span.exactExcerpt,
      extracted,
    )
  );
}

function containsEffectiveDate(text: string, effectiveFrom: string) {
  const [year, month, day] = effectiveFrom.split("-");
  if (!year || !month || !day) return false;
  const variants = [
    effectiveFrom,
    `${year}/${month}/${day}`,
    `${year}年${Number(month)}月${Number(day)}日`,
  ];
  const normalized = normalizedText(text);
  return variants.some((variant) => normalized.includes(normalizedText(variant)));
}

function containsAmendmentMarker(text: string) {
  return /\b(amended|amendment|revised|revision|supersed(?:e|es|ing))\b|修正|修订|修改/.test(text);
}

function snapshotExtension(contentType: string, rawUrl: string) {
  if (contentType === "application/pdf") return ".pdf";
  if (contentType.includes("html")) return ".html";
  if (contentType.includes("xml")) return ".xml";
  return extname(new URL(rawUrl).pathname) || ".txt";
}

async function preserveImmutableSnapshot(root: string, hash: string, bytes: Uint8Array, extension: string) {
  const directory = join(root, hash);
  const destination = join(directory, `source${extension}`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(destination, bytes, { flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const existingHash = createHash("sha256").update(await readFile(destination)).digest("hex");
    if (existingHash !== hash) throw new Error("Immutable source snapshot collision.");
  }
  return relative(root, destination);
}

export function evaluateDiscoveryResults(count: number): AdmissionResult | null {
  if (count > 0) return null;
  return {
    status: "gap",
    code: "search_empty_not_proof",
    message: "Official-source search returned no candidates. An empty search is not evidence that no rule applies.",
    transitions: [],
  };
}

export async function admitSourceEvidence(
  rawInput: AdmissionRequest,
  dependencies: AdmissionDependencies,
): Promise<AdmissionResult> {
  const now = dependencies.now ?? (() => new Date());
  const transitions: AdmissionActivity[] = [];
  const transition = (state: AdmissionState) => {
    const activity = { state, at: now().toISOString() };
    transitions.push(activity);
    dependencies.onActivity?.(activity);
  };

  let input: AdmissionRequest;
  try {
    input = AdmissionRequestSchema.parse(rawInput);
  } catch {
    return { status: "gap", code: "invalid_metadata", message: "Evidence metadata is incomplete or invalid.", transitions };
  }
  const sourceKind = input.sourceKind ?? "legal_instrument";
  transition("discovered");
  const connector = getOfficialConnector(input.connectorId);
  if (!connector || connector.jurisdiction !== input.jurisdiction) {
    return { status: "gap", code: "invalid_metadata", message: "The evidence connector does not match the jurisdiction.", transitions };
  }
  if (connector.state !== "available") {
    return {
      status: "gap",
      code: `connector_${connector.state}`,
      message: `The ${connector.authority} connector is ${connector.state.replaceAll("_", " ")}; this remains an evidence gap.`,
      transitions,
    };
  }
  if (input.applicability.appliesIn !== input.jurisdiction) {
    return {
      status: "gap",
      code: "scope_mismatch",
      message: "The evidence jurisdiction does not match its declared applicability scope.",
      transitions,
    };
  }
  if (sourceKind !== "legal_instrument") {
    const expectedScope = sourceKind === "official_service_page"
      ? { productScope: "official service metadata only", regulatoryDomain: "service metadata" }
      : { productScope: "official contact metadata only", regulatoryDomain: "contact metadata" };
    if (
      input.applicability.productScope !== expectedScope.productScope ||
      input.applicability.regulatoryDomain !== expectedScope.regulatoryDomain
    ) {
      return {
        status: "gap",
        code: "scope_mismatch",
        message: "Official service and contact pages may support metadata only, not product applicability or legal obligations.",
        transitions,
      };
    }
    if (input.effectiveFrom !== input.discoveredAt.slice(0, 10)) {
      return {
        status: "gap",
        code: "effectivity_unverified",
        message: "A service or contact page cannot establish an invented legal effective date; its metadata date must be the retrieval date.",
        transitions,
      };
    }
    if (
      containsConsequentialServiceClaim(input.exactExcerpt) ||
      (input.translation.englishExcerpt && containsConsequentialServiceClaim(input.translation.englishExcerpt))
    ) {
      return {
        status: "gap",
        code: "scope_mismatch",
        message: "Official service and contact pages cannot establish applicability, obligations, rates, classification, sequence, or clearance.",
        transitions,
      };
    }
  }
  if (input.translation.materialAmbiguity) {
    return {
      status: "gap",
      code: "translation_ambiguity",
      message: "A material translation ambiguity prevents evidence admission.",
      transitions,
    };
  }
  if (input.amendment.status === "unknown") {
    return {
      status: "gap",
      code: "amendment_unverified",
      message: "The source amendment lineage is unknown and cannot support admission.",
      transitions,
    };
  }
  if (
    input.originalLanguage !== "en" &&
    (!(["official_translation", "derived_translation"] as const).includes(
      input.translation.status as "official_translation" | "derived_translation",
    ) ||
      !input.translation.englishExcerpt ||
      (input.translation.status === "derived_translation" && !dependencies.allowDerivedTranslation))
  ) {
    return {
      status: "gap",
      code: "untranslated",
      message: "The authoritative text has no validated English translation linked for this use.",
      transitions,
    };
  }

  let remote;
  try {
    remote = await retrieveOfficialSource(input.url, connector, dependencies);
  } catch (error) {
    if (error instanceof RetrievalBoundaryError) {
      return { status: "gap", code: error.code, message: error.message, transitions };
    }
    throw error;
  }
  const sha256 = createHash("sha256").update(remote.bytes).digest("hex");
  const snapshotRelativePath = await preserveImmutableSnapshot(
    dependencies.snapshotRoot,
    sha256,
    remote.bytes,
    snapshotExtension(remote.contentType, remote.finalUrl),
  );
  transition("snapshotted");

  const extracted = await extractUntrustedText(remote.bytes, remote.contentType);
  if (!extracted) {
    return {
      status: "gap",
      code: "extraction_unavailable",
      message: "The official bytes were snapshotted, but this content type needs a verified extractor before admission.",
      transitions,
    };
  }
  transition("extracted");
  if (
    containsPromptInjection(input.exactExcerpt) ||
    (input.translation.englishExcerpt && containsPromptInjection(input.translation.englishExcerpt))
  ) {
    return {
      status: "gap",
      code: "prompt_injection_in_claim",
      message: "The proposed claim text contains instruction-like content and cannot be admitted.",
      transitions,
    };
  }
  if (containsPromptInjection(extracted.text)) {
    return {
      status: "gap",
      code: "prompt_injection_detected",
      message: "Instruction-like content was detected in the retrieved source; it was quarantined and not admitted.",
      transitions,
    };
  }
  if (!locatorKindMatchesContent(input.exactLocator.kind, remote.contentType, remote.bytes)) {
    return {
      status: "gap",
      code: "locator_unverified",
      message: "The declared locator kind does not match the retrieved official content.",
      transitions,
    };
  }
  const normalized = normalizedText(extracted.text);
  const normalizedExcerpt = normalizedText(input.exactExcerpt);
  const excerptIndex = normalized.indexOf(normalizedExcerpt);
  if (excerptIndex < 0) {
    return {
      status: "gap",
      code: "locator_unverified",
      message: "The exact cited excerpt could not be found in the retrieved official bytes.",
      transitions,
    };
  }
  if (
    !locatorAndExcerptShareVerifiedSpan(
      input.exactLocator.kind,
      remote.contentType,
      remote.bytes,
      input.exactLocator.value,
      input.exactExcerpt,
      extracted,
    )
  ) {
    return {
      status: "gap",
      code: "locator_unverified",
      message: "The declared exact locator could not be verified in the retrieved official bytes.",
      transitions,
    };
  }
  const authorityEvidence = compactEvidenceText(input.identityEvidence.authority.exactExcerpt);
  const instrumentIdEvidence = compactEvidenceText(input.identityEvidence.instrumentId.exactExcerpt);
  const instrumentTitleEvidence = compactEvidenceText(input.identityEvidence.instrumentTitle.exactExcerpt);
  const legalIdentityVerified =
    evidenceSpanIsExact(input.identityEvidence.authority, remote.contentType, remote.bytes, extracted) &&
    evidenceSpanIsExact(input.identityEvidence.instrumentId, remote.contentType, remote.bytes, extracted) &&
    evidenceSpanIsExact(input.identityEvidence.instrumentTitle, remote.contentType, remote.bytes, extracted) &&
    authorityEvidence.includes(compactEvidenceText(input.authorityName)) &&
    /(?:authority|issuing authority|发布部门|制定机关|颁布机关)/i.test(authorityEvidence) &&
    instrumentIdEvidence.includes(compactEvidenceText(input.instrumentId)) &&
    /(?:instrumentid|document(?:id|number)|reference|发布文号|文号)/i.test(instrumentIdEvidence) &&
    instrumentTitleEvidence.includes(compactEvidenceText(input.instrumentTitle));
  const metadataIdentityVerified =
    evidenceSpanIsExact(input.identityEvidence.instrumentTitle, remote.contentType, remote.bytes, extracted) &&
    instrumentTitleEvidence.includes(compactEvidenceText(input.instrumentTitle));
  if (sourceKind === "legal_instrument" ? !legalIdentityVerified : !metadataIdentityVerified) {
    return {
      status: "gap",
      code: "instrument_identity_unverified",
      message: "The retrieved content did not verify the declared instrument identity.",
      transitions,
    };
  }
  if (sourceKind === "legal_instrument") {
    const applicabilityEvidence = compactEvidenceText(input.applicabilityEvidence.exactExcerpt);
    if (
      !evidenceSpanIsExact(input.applicabilityEvidence, remote.contentType, remote.bytes, extracted) ||
      !applicabilityEvidence.includes(compactEvidenceText(input.applicability.productScope)) ||
      !applicabilityEvidence.includes(compactEvidenceText(input.applicability.regulatoryDomain))
    ) {
      return {
        status: "gap",
        code: "scope_mismatch",
        message: "The declared product or regulatory-domain applicability was not verified in the official bytes.",
        transitions,
      };
    }
  }
  if (sourceKind === "legal_instrument" && !containsEffectiveDate(extracted.text, input.effectiveFrom)) {
    return {
      status: "gap",
      code: "effectivity_unverified",
      message: "The declared effective date could not be verified in the retrieved official bytes.",
      transitions,
    };
  }
  if (
    ["amended", "superseding"].includes(input.amendment.status) &&
    !containsAmendmentMarker(extracted.text)
  ) {
    return {
      status: "gap",
      code: "amendment_unverified",
      message: "The declared amendment state could not be verified in the retrieved official bytes.",
      transitions,
    };
  }
  if (sourceKind === "legal_instrument" && input.amendment.status === "original" && containsAmendmentMarker(extracted.text)) {
    return {
      status: "gap",
      code: "amendment_unverified",
      message: "The source contains an amendment marker but was declared as an original instrument.",
      transitions,
    };
  }
  if (input.amendment.status !== "superseding" && input.amendment.supersedesDocumentVersionId) {
    return {
      status: "gap",
      code: "amendment_unverified",
      message: "Only a superseding instrument may identify a predecessor document version.",
      transitions,
    };
  }
  if (input.amendment.status === "superseding" && !input.amendment.supersedesDocumentVersionId) {
    return {
      status: "gap",
      code: "amendment_unverified",
      message: "A superseding source must identify an admitted predecessor for the same instrument.",
      transitions,
    };
  }
  if (
    input.amendment.supersedesDocumentVersionId &&
    !dependencies.store.isValidSupersessionPredecessor({
      authorityName: input.authorityName,
      documentVersionId: input.amendment.supersedesDocumentVersionId,
      effectiveFrom: input.effectiveFrom,
      exactLocator: input.exactLocator,
      instrumentId: input.instrumentId,
      jurisdiction: input.jurisdiction,
    })
  ) {
    return {
      status: "gap",
      code: "amendment_unverified",
      message: "The predecessor document does not match the instrument, authority, jurisdiction, locator, or chronology.",
      transitions,
    };
  }
  if (
    input.translation.status === "official_translation" &&
    input.translation.englishExcerpt &&
    !normalized.includes(normalizedText(input.translation.englishExcerpt))
  ) {
    return {
      status: "gap",
      code: "untranslated",
      message: "The declared official translation was not present in the retrieved official bytes.",
      transitions,
    };
  }
  if (new Date(`${input.freshUntil}T23:59:59.999Z`).getTime() < now().getTime()) {
    return { status: "gap", code: "stale_evidence", message: "The evidence freshness period has expired.", transitions };
  }
  transition("validated");

  const claimFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        applicability: input.applicability,
        applicabilityEvidence: input.applicabilityEvidence,
        amendment: input.amendment,
        authorityName: input.authorityName,
        effectiveFrom: input.effectiveFrom,
        exactExcerpt: input.exactExcerpt,
        exactLocator: input.exactLocator,
        instrumentId: input.instrumentId,
        instrumentTitle: input.instrumentTitle,
        identityEvidence: input.identityEvidence,
        translation: input.translation,
      }),
    )
    .digest("hex")
    .slice(0, 10);
  const documentVersionId = `${input.connectorId}-${sha256.slice(0, 16)}`;
  const sourceVersionId = `${documentVersionId}-${claimFingerprint}`;
  const conflict = dependencies.store.findAdmissionConflict({
    applicability: input.applicability,
    exactExcerpt: input.exactExcerpt,
    exactLocator: input.exactLocator,
    instrumentId: input.instrumentId,
    originalLanguage: input.originalLanguage,
    sourceVersionId,
    translation: input.translation,
    ...(input.amendment.supersedesDocumentVersionId
      ? { supersedesDocumentVersionId: input.amendment.supersedesDocumentVersionId }
      : {}),
  });
  if (conflict) {
    return {
      status: "gap",
      code: "source_conflict",
      message: `The source conflicts with admitted evidence ${conflict}; authority or amendment lineage must be resolved.`,
      transitions,
    };
  }

  const evidence: AdmittedEvidence = {
    admissionId: randomUUID(),
    applicability: input.applicability,
    applicabilityEvidence: input.applicabilityEvidence,
    authorityName: input.authorityName,
    connectorId: input.connectorId,
    contentType: remote.contentType,
    documentVersionId,
    effectiveFrom: input.effectiveFrom,
    exactLocator: input.exactLocator,
    finalUrl: remote.finalUrl,
    freshUntil: input.freshUntil,
    instrumentId: input.instrumentId,
    instrumentTitle: input.instrumentTitle,
    identityEvidence: input.identityEvidence,
    jurisdiction: input.jurisdiction,
    originalLanguage: input.originalLanguage,
    promptInjectionDetected: false,
    redirectHistory: remote.redirectHistory,
    sha256,
    snapshotRelativePath,
    sourceVersionId,
    state: "admitted",
    translation: input.translation,
    transitions: [...transitions, { state: "admitted", at: now().toISOString() }],
  };
  dependencies.store.recordAdmittedEvidence({
    ...evidence,
    exactExcerpt: input.exactExcerpt,
    amendment: {
      note: input.amendment.note,
      status: input.amendment.status,
      ...(input.amendment.supersedesDocumentVersionId
        ? { supersedesDocumentVersionId: input.amendment.supersedesDocumentVersionId }
        : {}),
    },
    originalLanguage: input.originalLanguage,
    translation: input.translation,
  });
  dependencies.onActivity?.(evidence.transitions.at(-1)!);
  return { status: "admitted", evidence };
}
