import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/extract/route";
import { ExtractionResultSchema, SYNTHETIC_ROUTER_PDF_FILENAME } from "@/extraction";

const fixturePath = fileURLToPath(
  new URL("../fixtures/synthetic-router-pro-forma-invoice.pdf", import.meta.url),
);

async function uploadRequest(
  documents: Array<{ bytes: Uint8Array; name: string; type: string }>,
) {
  const form = new FormData();
  for (const document of documents) {
    form.append(
      "document",
      new Blob([document.bytes.slice().buffer as ArrayBuffer], { type: document.type }),
      document.name,
    );
  }
  return new Request("http://localhost/api/extract", { method: "POST", body: form });
}

async function fixtureUpload() {
  return {
    bytes: await readFile(fixturePath),
    name: SYNTHETIC_ROUTER_PDF_FILENAME,
    type: "application/pdf",
  };
}

function expectNoStore(response: Response) {
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.get("pragma")).toBe("no-cache");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/extract", () => {
  it("returns the deterministic recorded extraction for the one admitted synthetic PDF", async () => {
    const response = await POST(await uploadRequest([await fixtureUpload()]));
    const body = await response.json();

    expect(response.status).toBe(200);
    expectNoStore(response);
    expect(ExtractionResultSchema.safeParse(body).success).toBe(true);
    expect(body.extractionMode).toBe("recorded_fixture");
    expect(body.document.fileName).toBe(SYNTHETIC_ROUTER_PDF_FILENAME);
    expect(body.facts).toContainEqual(
      expect.objectContaining({ field: "modelIdentity", value: "BWMI-MIMO-245-R1" }),
    );
  });

  it("rejects images clearly and never returns a cacheable error", async () => {
    const response = await POST(
      await uploadRequest([
        { bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]), name: "router.png", type: "image/png" },
      ]),
    );
    const body = await response.json();

    expect(response.status).toBe(415);
    expectNoStore(response);
    expect(body.error).toMatch(/images are not supported/i);
  });

  it("rejects certificate PDFs and any PDF outside the one synthetic fixture", async () => {
    const fixture = await fixtureUpload();
    const certificate = await POST(
      await uploadRequest([{ ...fixture, name: "router-certificate.pdf" }]),
    );
    const otherPdf = await POST(
      await uploadRequest([
        {
          bytes: new TextEncoder().encode("%PDF-1.3\nunknown synthetic bytes\n%%EOF"),
          name: SYNTHETIC_ROUTER_PDF_FILENAME,
          type: "application/pdf",
        },
      ]),
    );

    expect(certificate.status).toBe(422);
    expectNoStore(certificate);
    expect((await certificate.json()).error).toMatch(/certificates are not supported/i);
    expect(otherPdf.status).toBe(422);
    expectNoStore(otherPdf);
    expect((await otherPdf.json()).error).toMatch(/only the verified synthetic router/i);
  });

  it("rejects multiple documents before reading an extraction result", async () => {
    const fixture = await fixtureUpload();
    const response = await POST(await uploadRequest([fixture, fixture]));

    expect(response.status).toBe(422);
    expectNoStore(response);
    expect((await response.json()).error).toMatch(/exactly one document/i);
  });

  it("uses the live Agents SDK path only behind the server-side opt-in", async () => {
    vi.stubEnv("BWMI_LIVE_OPENAI_EXTRACTION", "1");
    vi.stubEnv("OPENAI_API_KEY", "");
    const response = await POST(await uploadRequest([await fixtureUpload()]));

    expect(response.status).toBe(503);
    expectNoStore(response);
    expect((await response.json()).error).toMatch(/live extraction is unavailable/i);
  });
});
