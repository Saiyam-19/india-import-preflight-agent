import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST as postDocumentFact } from "@/app/api/document-facts/route";
import {
  DELETE as deleteDocument,
  POST as postDocuments,
} from "@/app/api/documents/route";
import {
  DELETE as deleteTradeCase,
  POST as postTradeCase,
} from "@/app/api/trade-cases/route";
import { MAX_MULTIPART_BYTES } from "@/server/documents/request";

afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.stubEnv("OPENAI_API_KEY", "");
  vi.stubEnv("OPENROUTER_API_KEY", "");
  vi.stubEnv("BWMI_OPENAI_BASE_URL", "");
  vi.stubEnv("BWMI_OPENAI_MODEL", "");
});

function jsonRequest(path: string, body: unknown, method = "POST") {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function neutralPdf() {
  const stream = "BT /F1 12 Tf 72 730 Td (TEST DOCUMENT - NOT VALID - NOT A CERTIFICATE) Tj 0 -22 Td (Document number: TEST-ROUTE-1) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(new TextEncoder().encode(output).byteLength);
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = new TextEncoder().encode(output).byteLength;
  output += "xref\n0 6\n0000000000 65535 f \n";
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  output += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(output);
}

function pngHeader(width = 640, height = 480) {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

async function createCase(title: string) {
  const response = await postTradeCase(jsonRequest("/api/trade-cases", { title }));
  return (await response.json()).tradeCase as { id: string };
}

function uploadRequest(
  tradeCaseId: string,
  files: Array<{ bytes: Uint8Array; name: string; type: string }>,
  documentType = "commercial_invoice",
) {
  const form = new FormData();
  form.set("tradeCaseId", tradeCaseId);
  form.set("documentType", documentType);
  for (const file of files) {
    form.append("documents", new Blob([file.bytes.slice().buffer as ArrayBuffer], { type: file.type }), file.name);
  }
  return new Request("http://localhost/api/documents", { method: "POST", body: form });
}

function expectNoStore(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("pragma")).toBe("no-cache");
}

describe("case-scoped document routes", () => {
  it("persists real PDF candidates as pending, then confirms only inside the selected case", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-19-document-route-")));
    const first = await createCase("First upload case");
    const second = await createCase("Second upload case");
    const upload = await postDocuments(uploadRequest(first.id, [{
      bytes: neutralPdf(),
      name: "neutral-parser-fixture.pdf",
      type: "application/pdf",
    }]));
    const uploaded = await upload.json();

    expect(upload.status).toBe(201);
    expectNoStore(upload);
    expect(uploaded.results).toEqual([
      expect.objectContaining({ status: "ready_for_review", fileName: "neutral-parser-fixture.pdf" }),
    ]);
    const fact = uploaded.tradeCase.documents[0].facts[0];
    expect(uploaded.tradeCase.documents[0].documentType).toBe("commercial_invoice");
    expect(fact.current.reviewStatus).toBe("pending");
    expect(uploaded.tradeCase.confirmedFacts).not.toContainEqual(expect.objectContaining({ name: "documentNumber" }));

    const wrongCase = await postDocumentFact(jsonRequest("/api/document-facts", {
      tradeCaseId: second.id,
      factId: fact.id,
      action: "confirm",
    }));
    expect(wrongCase.status).toBe(409);
    expect((await wrongCase.json()).error).toMatch(/selected trade case/i);

    const reviewed = await postDocumentFact(jsonRequest("/api/document-facts", {
      tradeCaseId: first.id,
      factId: fact.id,
      action: "correct",
      value: "TEST-ROUTE-1-CORRECTED",
    }));
    const reviewBody = await reviewed.json();
    expect(reviewed.status).toBe(200);
    expectNoStore(reviewed);
    expect(reviewBody.tradeCase.confirmedFacts).toContainEqual({
      name: "documentNumber",
      value: "TEST-ROUTE-1-CORRECTED",
    });
  });

  it("requires an admitted case-checklist document type", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-20-document-type-")));
    const tradeCase = await createCase("Typed document case");
    const response = await postDocuments(uploadRequest(tradeCase.id, [{
      bytes: neutralPdf(), name: "unknown.pdf", type: "application/pdf",
    }], "universal_catalogue_guess"));
    expect(response.status).toBe(422);
    expect((await response.json()).error).toMatch(/document type/i);
  });

  it("reports unreadable images and unsupported or encrypted documents without recording facts", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-19-document-states-")));
    vi.stubEnv("OPENAI_API_KEY", "");
    const tradeCase = await createCase("Document state case");

    const imageResponse = await postDocuments(uploadRequest(tradeCase.id, [{
      bytes: pngHeader(), name: "scan.png", type: "image/png",
    }]));
    const imageBody = await imageResponse.json();
    expect(imageBody.results[0]).toEqual(expect.objectContaining({
      status: "unreadable",
      message: expect.stringMatching(/vision extractor/i),
    }));
    expect(imageBody.tradeCase.documents).toEqual([]);

    const encryptedResponse = await postDocuments(uploadRequest(tradeCase.id, [{
      bytes: new TextEncoder().encode("%PDF-1.4\n1 0 obj << /Encrypt 2 0 R >> endobj\n%%EOF"),
      name: "encrypted.pdf",
      type: "application/pdf",
    }]));
    expect((await encryptedResponse.json()).results[0]).toEqual(expect.objectContaining({ status: "encrypted" }));

    const unsupportedResponse = await postDocuments(uploadRequest(tradeCase.id, [{
      bytes: new TextEncoder().encode("MZ executable"), name: "not-a-document.pdf", type: "application/pdf",
    }]));
    expect((await unsupportedResponse.json()).results[0]).toEqual(expect.objectContaining({ status: "unsupported" }));
  });

  it("enforces bounded multipart bytes and file count before parsing or persistence", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-19-request-limits-")));
    const tradeCase = await createCase("Limit case");
    const tooMany = await postDocuments(uploadRequest(
      tradeCase.id,
      Array.from({ length: 4 }, (_, index) => ({
        bytes: pngHeader(), name: `scan-${index}.png`, type: "image/png",
      })),
    ));
    expect(tooMany.status).toBe(422);
    expectNoStore(tooMany);
    expect((await tooMany.json()).error).toMatch(/at most 3 documents/i);

    const oversized = await postDocuments(new Request("http://localhost/api/documents", {
      method: "POST",
      headers: {
        "content-length": String(MAX_MULTIPART_BYTES + 1),
        "content-type": "multipart/form-data; boundary=test",
      },
      body: "--test--",
    }));
    expect(oversized.status).toBe(413);
    expectNoStore(oversized);
    expect((await oversized.json()).error).toMatch(/request is too large/i);
  });

  it("deletes a document or entire case without affecting another case", async () => {
    vi.stubEnv("BWMI_DATA_DIR", await mkdtemp(join(tmpdir(), "bwmi-19-delete-route-")));
    const first = await createCase("Delete me");
    const second = await createCase("Keep me");
    const upload = await postDocuments(uploadRequest(first.id, [{
      bytes: neutralPdf(), name: "neutral-parser-fixture.pdf", type: "application/pdf",
    }]));
    const uploaded = await upload.json();
    const documentId = uploaded.tradeCase.documents[0].id;

    const documentDelete = await deleteDocument(jsonRequest("/api/documents", {
      tradeCaseId: first.id,
      documentId,
    }, "DELETE"));
    expect((await documentDelete.json()).tradeCase.documents).toEqual([]);

    const caseDelete = await deleteTradeCase(jsonRequest("/api/trade-cases", {
      tradeCaseId: first.id,
    }, "DELETE"));
    const deletion = await caseDelete.json();
    expect(caseDelete.status).toBe(200);
    expect(deletion.deletedTradeCaseId).toBe(first.id);
    expect(deletion.tradeCases).toEqual([expect.objectContaining({ id: second.id })]);
  });
});
