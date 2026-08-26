import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { migrateAllStores } from "@/server/data/migrate";
import {
  admitSourceEvidence,
  type AdmissionRequest,
} from "@/server/evidence/admission";
import { OFFICIAL_CONNECTORS } from "@/server/evidence/registry";
import { retrieveOfficialSource } from "@/server/evidence/remote-retrieval";
import { RegulatoryStore } from "@/server/knowledge/regulatory-store";

const PUBLIC_DNS = async () => [{ address: "8.8.8.8", family: 4 }];
const stores: RegulatoryStore[] = [];

async function harness() {
  const rootDir = await mkdtemp(join(tmpdir(), "bwmi-evidence-repair-"));
  const { paths } = migrateAllStores({ rootDir });
  const store = new RegulatoryStore(paths.regulatory);
  stores.push(store);
  return { paths, store };
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

function baseRequest(overrides: Record<string, unknown> = {}): AdmissionRequest {
  return {
    connectorId: "india-official-web",
    discoveredAt: "2026-08-26T10:30:00.000Z",
    discoveryQuery: "current official Equipment Type Approval service",
    jurisdiction: "India",
    url: "https://www.eservices.dot.gov.in/equipment-type-approval-eta",
    authorityName: "Government of India official publications",
    instrumentId: "Equipment Type Approval (ETA) service page",
    instrumentTitle: "Equipment Type Approval (ETA)",
    identityEvidence: {
      authority: {
        locator: { kind: "paragraph", value: "Official service" },
        exactExcerpt: "Official service of the Government of India.",
      },
      instrumentId: {
        locator: { kind: "paragraph", value: "Service identifier" },
        exactExcerpt: "Service identifier: Equipment Type Approval (ETA) service page.",
      },
      instrumentTitle: {
        locator: { kind: "section", value: "Equipment Type Approval (ETA)" },
        exactExcerpt: "Equipment Type Approval (ETA)",
      },
    },
    effectiveFrom: "2026-08-26",
    originalLanguage: "en",
    translation: {
      status: "authoritative_original",
      method: "Official English publication",
      materialAmbiguity: false,
    },
    amendment: {
      status: "original",
      note: "Immutable retrieval of the current official service page.",
    },
    applicability: {
      appliesIn: "India",
      tradeDirection: "china_to_india",
      productScope: "official service metadata only",
      regulatoryDomain: "service metadata",
    },
    applicabilityEvidence: {
      locator: { kind: "section", value: "Equipment Type Approval (ETA)" },
      exactExcerpt: "Equipment Type Approval (ETA) is publicly accessible.",
    },
    exactLocator: { kind: "section", value: "Equipment Type Approval (ETA)" },
    exactExcerpt: "Equipment Type Approval (ETA) is publicly accessible.",
    freshUntil: "2026-09-25",
    sourceKind: "official_service_page",
    ...overrides,
  } as unknown as AdmissionRequest;
}

const SERVICE_HTML = `<!doctype html><title>Equipment Type Approval (ETA)</title><main>
  <h1>Equipment Type Approval (ETA)</h1>
  <p>Equipment Type Approval (ETA) is publicly accessible.</p>
  <p>Official service of the Government of India.</p>
  <p>Service identifier: Equipment Type Approval (ETA) service page.</p>
</main>`;

function dgftPdfRequest(overrides: Record<string, unknown> = {}): AdmissionRequest {
  const pageThreeClaim =
    "Import policy for electronics and IT Goods: The import of Goods (new as well as second hand, whether or not refurbished, repaired or reconditioned) notified under the Electronics and Information Technology Goods (Requirement of Compulsory Registration) Order, 2012";
  return {
    connectorId: "india-dgft-publications",
    discoveredAt: "2026-08-26T10:30:00.000Z",
    discoveryQuery: "DGFT ITC HS Schedule 1 general notes",
    jurisdiction: "India",
    url: "https://content.dgft.gov.in/Website/General_Notes_to_Import_Policy_2025.pdf",
    authorityName: "Customs Authorities",
    instrumentId: "ITC (HS), 2022 Schedule 1",
    instrumentTitle: "General Notes Regarding Import Policy",
    identityEvidence: {
      authority: {
        locator: { kind: "page", value: "page 3" },
        exactExcerpt: "Customs Authorities shall deform the goods beyond use and dispose of the goods as scrap",
      },
      instrumentId: {
        locator: { kind: "page", value: "page 3" },
        exactExcerpt: "ITC (HS), 2022 SCHEDULE 1 – IMPORT POLICY",
      },
      instrumentTitle: {
        locator: { kind: "page", value: "page 3" },
        exactExcerpt: "GENERAL NOTES REGARDING IMPORT POLICY",
      },
    },
    effectiveFrom: "2025-01-01",
    originalLanguage: "en",
    translation: {
      status: "authoritative_original",
      method: "Official English publication",
      materialAmbiguity: false,
    },
    amendment: {
      status: "original",
      note: "No amendment marker asserted for this test candidate.",
    },
    applicability: {
      appliesIn: "India",
      tradeDirection: "china_to_india",
      productScope: "electronics and IT Goods",
      regulatoryDomain: "Compulsory Registration",
    },
    applicabilityEvidence: {
      locator: { kind: "page", value: "page 3" },
      exactExcerpt: pageThreeClaim,
    },
    exactLocator: { kind: "page", value: "page 3" },
    exactExcerpt: pageThreeClaim,
    freshUntil: "2026-09-25",
    ...overrides,
  } as AdmissionRequest;
}

async function dgftPdfBytes() {
  return readFile(
    join(
      process.cwd(),
      "evidence/official/electronics-v1/e948889295e00171e200c7a1f4d7118db6fa3a5492470639ac84b2b7ee0d0be4/source.pdf",
    ),
  );
}

async function validPdfFixture() {
  const encoded = await readFile(
    join(process.cwd(), "tests/fixtures/evidence-ingestion-repair/two-page-official-instrument.pdf.base64"),
    "utf8",
  );
  return Buffer.from(encoded.trim(), "base64");
}

function validPdfRequest(): AdmissionRequest {
  const claim = "Section 1 requires covered electronics import documentation.";
  return {
    connectorId: "india-dgft-publications",
    discoveredAt: "2026-08-26T10:30:00.000Z",
    discoveryQuery: "official PDF evidence instrument",
    jurisdiction: "India",
    url: "https://content.dgft.gov.in/Website/test-pdf-1.pdf",
    authorityName: "Directorate General of Foreign Trade",
    instrumentId: "TEST-PDF-1",
    instrumentTitle: "Official PDF Evidence Instrument",
    identityEvidence: {
      authority: {
        locator: { kind: "page", value: "page 1" },
        exactExcerpt: "Authority: Directorate General of Foreign Trade.",
      },
      instrumentId: {
        locator: { kind: "page", value: "page 1" },
        exactExcerpt: "Instrument ID: TEST-PDF-1.",
      },
      instrumentTitle: {
        locator: { kind: "page", value: "page 1" },
        exactExcerpt: "Official PDF Evidence Instrument",
      },
    },
    effectiveFrom: "2026-08-26",
    originalLanguage: "en",
    translation: {
      status: "authoritative_original",
      method: "Official English publication",
      materialAmbiguity: false,
    },
    amendment: { status: "original", note: "Original test instrument." },
    applicability: {
      appliesIn: "India",
      tradeDirection: "china_to_india",
      productScope: "covered electronics",
      regulatoryDomain: "import documentation",
    },
    applicabilityEvidence: {
      locator: { kind: "page", value: "page 1" },
      exactExcerpt: claim,
    },
    exactLocator: { kind: "page", value: "page 1" },
    exactExcerpt: claim,
    freshUntil: "2026-09-25",
  };
}

describe("evidence ingestion prerequisite repair", () => {
  it("admits a PDF only when the exact excerpt is on the claimed page", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(validPdfRequest(), {
      store,
      snapshotRoot: paths.sources,
      now: () => new Date("2026-08-26T10:30:00.000Z"),
      resolveHost: PUBLIC_DNS,
      fetchImpl: async () =>
        new Response(await validPdfFixture(), { headers: { "content-type": "application/pdf" } }),
    });

    expect(result).toMatchObject({ status: "admitted", evidence: { exactLocator: { kind: "page", value: "page 1" } } });
  });

  it("extracts the real captured DGFT PDF before applying the exact legal locator gate", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(dgftPdfRequest(), {
      store,
      snapshotRoot: paths.sources,
      now: () => new Date("2026-08-26T10:30:00.000Z"),
      resolveHost: PUBLIC_DNS,
      fetchImpl: async () =>
        new Response(await dgftPdfBytes(), { headers: { "content-type": "application/pdf" } }),
    });

    expect(result).toMatchObject({ status: "gap", code: "locator_unverified" });
  });

  it("rejects a correct PDF excerpt attributed to the wrong page", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(
      dgftPdfRequest({ exactLocator: { kind: "page", value: "page 2" } }),
      {
        store,
        snapshotRoot: paths.sources,
        resolveHost: PUBLIC_DNS,
        fetchImpl: async () =>
          new Response(await dgftPdfBytes(), { headers: { "content-type": "application/pdf" } }),
      },
    );

    expect(result).toMatchObject({ status: "gap", code: "locator_unverified" });
  });

  it("rejects an irrelevant excerpt that is absent from the claimed PDF page", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(
      dgftPdfRequest({ exactExcerpt: "This unrelated sentence does not occur in the official PDF." }),
      {
        store,
        snapshotRoot: paths.sources,
        resolveHost: PUBLIC_DNS,
        fetchImpl: async () =>
          new Response(await dgftPdfBytes(), { headers: { "content-type": "application/pdf" } }),
      },
    );

    expect(result).toMatchObject({ status: "gap", code: "locator_unverified" });
  });

  it("classifies an invalid TLS certificate precisely", async () => {
    const connector = OFFICIAL_CONNECTORS.find((item) => item.id === "india-customs-publications")!;
    const tlsError = Object.assign(new Error("unable to verify the first certificate"), {
      code: "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
    });

    await expect(
      retrieveOfficialSource("https://www.icegate.gov.in/help/faq", connector, {
        resolveHost: PUBLIC_DNS,
        fetchImpl: async () => Promise.reject(tlsError),
      }),
    ).rejects.toMatchObject({ code: "tls_certificate_invalid" });
  });

  it("rejects a cross-domain redirect before the second fetch", async () => {
    const connector = OFFICIAL_CONNECTORS.find((item) => item.id === "india-customs-publications")!;
    const fetchImpl = async () =>
      new Response(null, { status: 302, headers: { location: "https://example.com/not-official" } });

    await expect(
      retrieveOfficialSource("https://www.icegate.gov.in/help/faq", connector, {
        resolveHost: PUBLIC_DNS,
        fetchImpl,
      }),
    ).rejects.toMatchObject({ code: "unsafe_redirect" });
  });

  it("classifies BIS redirect overflow without disabling redirect checks", async () => {
    const connector = OFFICIAL_CONNECTORS.find((item) => item.id === "india-official-web")!;
    const fetchImpl = async (url: URL | RequestInfo) =>
      new Response(null, {
        status: 302,
        headers: { location: `${String(url).split("?")[0]}?next=1` },
      });

    await expect(
      retrieveOfficialSource("https://www.bis.gov.in/scheme-ii", connector, {
        resolveHost: PUBLIC_DNS,
        fetchImpl: fetchImpl as typeof fetch,
        maxRedirects: 2,
      }),
    ).rejects.toMatchObject({ code: "too_many_redirects" });
  });

  it("allows only the exact Government of India TEC and MTCTE domains needed by the task", () => {
    const connector = OFFICIAL_CONNECTORS.find((item) => item.id === "india-official-web")!;
    expect(connector.allowedDomains).toEqual(expect.arrayContaining(["tec.gov.in", "mtcte.tec.gov.in"]));
    expect(connector.allowedDomains).not.toContain("gov.in");
  });

  it("admits WPC service-page identity and freshness without treating it as a legal instrument", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(baseRequest(), {
      store,
      snapshotRoot: paths.sources,
      now: () => new Date("2026-08-26T10:30:00.000Z"),
      resolveHost: PUBLIC_DNS,
      fetchImpl: async () => new Response(SERVICE_HTML, { headers: { "content-type": "text/html" } }),
    });

    expect(result.status).toBe("admitted");
    if (result.status === "admitted") {
      expect(result.evidence.applicability).toEqual({
        appliesIn: "India",
        tradeDirection: "china_to_india",
        productScope: "official service metadata only",
        regulatoryDomain: "service metadata",
      });
    }
  });

  it("admits official contact-page identity only under the contact-metadata scope", async () => {
    const { paths, store } = await harness();
    const contactExcerpt = "MTCTE official contact page is publicly accessible.";
    const result = await admitSourceEvidence(
      baseRequest({
        sourceKind: "official_contact_page",
        url: "https://www.mtcte.tec.gov.in/contact_tec",
        instrumentTitle: "MTCTE official contact page",
        identityEvidence: {
          ...baseRequest().identityEvidence,
          instrumentTitle: {
            locator: { kind: "section", value: "MTCTE official contact page" },
            exactExcerpt: "MTCTE official contact page",
          },
        },
        applicability: {
          appliesIn: "India",
          tradeDirection: "china_to_india",
          productScope: "official contact metadata only",
          regulatoryDomain: "contact metadata",
        },
        exactLocator: { kind: "section", value: "MTCTE official contact page" },
        exactExcerpt: contactExcerpt,
      }),
      {
        store,
        snapshotRoot: paths.sources,
        resolveHost: PUBLIC_DNS,
        fetchImpl: async () => new Response(
          `<h1>MTCTE official contact page</h1><p>${contactExcerpt}</p>`,
          { headers: { "content-type": "text/html" } },
        ),
      },
    );

    expect(result).toMatchObject({
      status: "admitted",
      evidence: {
        applicability: {
          productScope: "official contact metadata only",
          regulatoryDomain: "contact metadata",
        },
      },
    });
  });

  it("rejects a service page that overclaims product applicability or a statutory obligation", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(
      baseRequest({
        applicability: {
          appliesIn: "India",
          tradeDirection: "china_to_india",
          productScope: "all wireless electronics",
          regulatoryDomain: "statutory Equipment Type Approval obligation",
        },
      }),
      {
        store,
        snapshotRoot: paths.sources,
        resolveHost: PUBLIC_DNS,
        fetchImpl: async () => new Response(SERVICE_HTML, { headers: { "content-type": "text/html" } }),
      },
    );

    expect(result).toMatchObject({ status: "gap", code: "scope_mismatch" });
  });

  it.each([
    "The statutory filing obligation is mandatory for all products.",
    "ITC HS classification 8517 has a 5% duty rate.",
    "Customs clearance is guaranteed after approval is granted.",
  ])("rejects consequential service-page overclaim: %s", async (overclaim) => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(
      baseRequest({
        exactLocator: { kind: "paragraph", value: "Overclaim" },
        exactExcerpt: overclaim,
      }),
      {
        store,
        snapshotRoot: paths.sources,
        resolveHost: PUBLIC_DNS,
        fetchImpl: async () => new Response(`${SERVICE_HTML}<p>Overclaim: ${overclaim}</p>`, {
          headers: { "content-type": "text/html" },
        }),
      },
    );

    expect(result).toMatchObject({ status: "gap", code: "scope_mismatch" });
  });

  it("rejects an invented service-page effective date", async () => {
    const { paths, store } = await harness();
    const result = await admitSourceEvidence(baseRequest({ effectiveFrom: "2025-01-01" }), {
      store,
      snapshotRoot: paths.sources,
      resolveHost: PUBLIC_DNS,
      fetchImpl: async () => new Response(SERVICE_HTML, { headers: { "content-type": "text/html" } }),
    });

    expect(result).toMatchObject({ status: "gap", code: "effectivity_unverified" });
  });
});
