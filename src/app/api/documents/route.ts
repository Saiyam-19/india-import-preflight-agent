import { z } from "zod";

import { bootstrapApplication } from "@/server/bootstrap";
import { DOCUMENT_TYPES, type DocumentType } from "@/server/assessment/preparation-workflow";
import {
  DocumentIntakeError,
  extractVisibleDocumentFacts,
} from "@/server/documents/intake";
import {
  DocumentRequestError,
  MAX_DOCUMENT_COUNT,
  readBoundedMultipartForm,
} from "@/server/documents/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Expires: "0",
  Pragma: "no-cache",
};

const DeleteSchema = z.strictObject({
  documentId: z.string().uuid(),
  tradeCaseId: z.string().uuid(),
});

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function isUpload(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && typeof value.arrayBuffer === "function";
}

function safeFileName(value: string) {
  return value.replaceAll(/[/\\\0]/g, "_").trim().slice(0, 180) || "unnamed-document";
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await readBoundedMultipartForm(request);
  } catch (error) {
    if (error instanceof DocumentRequestError) return json({ error: error.message }, error.status);
    return json({ error: "The document request could not be read safely." }, 400);
  }

  const tradeCaseId = form.get("tradeCaseId");
  if (typeof tradeCaseId !== "string" || !z.string().uuid().safeParse(tradeCaseId).success) {
    return json({ error: "An explicit valid Trade Case ID is required." }, 400);
  }
  const documentType = form.get("documentType");
  if (typeof documentType !== "string" || !DOCUMENT_TYPES.includes(documentType as DocumentType)) {
    return json({ error: "Choose one admitted case-checklist document type for this upload." }, 422);
  }
  const uploads = form.getAll("documents").filter(isUpload);
  const allUploads = [...form.entries()].filter(([, value]) => isUpload(value));
  if (uploads.length === 0 || uploads.length > MAX_DOCUMENT_COUNT || allUploads.length !== uploads.length) {
    return json({ error: `Upload between 1 and at most ${MAX_DOCUMENT_COUNT} documents.` }, 422);
  }

  const application = await bootstrapApplication();
  try {
    application.conversationStore.assertTradeCase(tradeCaseId);
    const results: Array<Record<string, unknown>> = [];
    let recorded = false;
    for (const upload of uploads) {
      const fileName = safeFileName(upload.name);
      try {
        const bytes = new Uint8Array(await upload.arrayBuffer());
        const extraction = await extractVisibleDocumentFacts({
          bytes,
          declaredMediaType: upload.type,
          fileName,
        });
        if (extraction.status === "ready_for_review") {
          const document = application.conversationStore.recordDocumentExtraction(tradeCaseId, {
            facts: extraction.facts,
            documentType: documentType as DocumentType,
            fileName,
            mediaType: extraction.mediaType,
            pageCount: extraction.pageCount,
            sizeBytes: bytes.byteLength,
          });
          recorded = true;
          results.push({
            documentId: document.id,
            factsFound: document.facts.length,
            fileName,
            message: extraction.message,
            status: extraction.status,
          });
        } else {
          results.push({
            factsFound: 0,
            fileName,
            message: extraction.message,
            status: extraction.status,
          });
        }
      } catch (error) {
        if (error instanceof DocumentIntakeError) {
          results.push({ fileName, factsFound: 0, message: error.message, status: error.code });
          continue;
        }
        results.push({
          fileName,
          factsFound: 0,
          message: "The parser failed safely. No bytes or derived facts were retained.",
          status: "unreadable",
        });
      }
    }
    if (recorded) {
      const reviewedFiles = results.filter((result) => result.status === "ready_for_review");
      const visibleFactCount = reviewedFiles.reduce(
        (total, result) => total + (typeof result.factsFound === "number" ? result.factsFound : 0),
        0,
      );
      application.conversationStore.appendMessage(
        tradeCaseId,
        "assistant",
        `I extracted ${visibleFactCount} visible ${visibleFactCount === 1 ? "field" : "fields"} from ${reviewedFiles.length} ${reviewedFiles.length === 1 ? "document" : "documents"}. Please confirm or correct them in Conversation details before I use them. Extraction does not establish authenticity, filing, payment, release or clearance.`,
      );
    }
    return json(
      { results, tradeCase: application.conversationStore.getTradeCase(tradeCaseId) },
      recorded ? 201 : 200,
    );
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "The Trade Case was unavailable." },
      409,
    );
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}

export async function DELETE(request: Request) {
  const parsed = DeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: "A valid Trade Case ID and document ID are required." }, 400);
  const application = await bootstrapApplication();
  try {
    application.conversationStore.deleteDocument(parsed.data.tradeCaseId, parsed.data.documentId);
    return json({ tradeCase: application.conversationStore.getTradeCase(parsed.data.tradeCaseId) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "The document was unavailable." }, 409);
  } finally {
    application.conversationStore.close();
    application.regulatoryStore.close();
  }
}
