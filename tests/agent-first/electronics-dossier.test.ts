import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it } from "vitest";

import { ComplianceOutputSchema } from "@/server/agent/guidance";
import {
  buildElectronicsActionDossier,
  resolveCaseSatisfactionEvidence,
  validateEvidenceRefreshOverlay,
} from "@/server/assessment/electronics-dossier";
import { ConversationStore } from "@/server/conversations/conversation-store";
import { migrateAllStores } from "@/server/data/migrate";
import { CHARACTERISTIC_CATALOG } from "@/server/knowledge/electronics-domain";
import type {
  CaseSatisfactionEvidence,
  ElectronicsProfile,
  FieldEvidenceBindingJson,
  RegulatoryCharacteristic,
} from "@/server/knowledge/electronics-domain";
import { loadElectronicsKnowledgeGraph, loadElectronicsKnowledgeGraphFile } from "@/server/knowledge/electronics-knowledge-loader";
import { RegulatoryStore } from "@/server/knowledge/regulatory-store";

const fixtureDirectory = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/electronics-knowledge");
const projectRoot = resolve(fixtureDirectory, "../../..");
const stores: Array<RegulatoryStore | ConversationStore> = [];

const emptyDossier = {
  decision: { status: "pending" as const, summary: "Evidence remains pending.", blockers: ["Exact scope is unresolved."] },
  documents: [],
  policyReview: [],
  onlineForms: [],
  contacts: [],
  classificationAndRegulation: [],
  costs: [],
  orderedNextActions: [],
};

function characteristic(
  id: string,
  value: RegulatoryCharacteristic["value"],
  unit?: string,
): RegulatoryCharacteristic {
  return {
    id,
    namespace: id.split(".")[0] as RegulatoryCharacteristic["namespace"],
    value,
    ...(unit ? { unit } : {}),
    basis: "confirmed test fact",
    provenance: "user",
    confirmed: true,
  };
}

function profile(
  productDescription: string,
  characteristics: RegulatoryCharacteristic[],
): ElectronicsProfile {
  return {
    intake: {
      direction: "china_to_india",
      productDescription,
      purchaseEvidenceDocumentIds: [],
    },
    characteristics,
    classificationCandidates: [],
    unresolvedCharacteristicQuestions: [],
  };
}

async function regulatoryHarness(kind: "fixture" | "production" = "fixture") {
  const rootDir = await mkdtemp(join(tmpdir(), "bwmi-electronics-dossier-"));
  const { paths } = migrateAllStores({ rootDir });
  const regulatoryStore = new RegulatoryStore(paths.regulatory);
  stores.push(regulatoryStore);
  await loadElectronicsKnowledgeGraphFile({
    filePath: kind === "fixture"
      ? join(fixtureDirectory, "valid.json")
      : join(projectRoot, "evidence/knowledge/china-india-electronics-v1.json"),
    regulatoryStore,
    snapshotRoot: kind === "fixture" ? fixtureDirectory : projectRoot,
  });
  return { paths, regulatoryStore };
}

afterEach(() => {
  while (stores.length > 0) stores.pop()?.close();
});

describe("electronics dossier output contract", () => {
  it("preserves legacy compliance fields while accepting the deterministic action dossier", () => {
    const output = ComplianceOutputSchema.parse({
      state: "assessment_incomplete",
      summary: "The deterministic electronics dossier is complete within the verified evidence scope.",
      claims: [],
      missingInformation: [],
      confirmedFacts: [],
      productResearch: [],
      classificationCandidates: [],
      agencies: [],
      controls: [],
      documents: [],
      documentReviews: [],
      calculation: null,
      risks: [],
      nextActions: [],
      nextQuestion: null,
      checked: [],
      notChecked: [],
      actionDossier: emptyDossier,
    });

    expect(output.actionDossier).toEqual(emptyDossier);
    expect(output.claims).toEqual([]);
  });

  it("rejects structurally incomplete or unbound dossier values at the compliance boundary", () => {
    expect(() => ComplianceOutputSchema.parse({
      state: "assessment_incomplete",
      summary: "This deliberately malformed dossier must not cross the strict compliance boundary.",
      claims: [], missingInformation: [], confirmedFacts: [], productResearch: [],
      classificationCandidates: [], agencies: [], controls: [], documents: [], documentReviews: [],
      calculation: null, risks: [], nextActions: [], nextQuestion: null, checked: [], notChecked: [],
      actionDossier: { ...emptyDossier, onlineForms: [{ id: "unsafe-unbound-portal", status: "required" }] },
    })).toThrow();
  });
});

describe("deterministic graph dossier", () => {
  it("uses characteristics rather than product names and changes obligations only when traits change", async () => {
    const { regulatoryStore } = await regulatoryHarness();
    const radio = [
      characteristic("radio.transmitter_present", true),
      characteristic("radio.frequency_hz", 2.4, "ghz"),
    ];
    const first = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("runtime optical bench controller", radio),
      regulatoryStore,
    });
    const renamed = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("unrelated plasma diagnostics assembly", radio),
      regulatoryStore,
    });
    const noRadio = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("runtime optical bench controller", [characteristic("radio.transmitter_present", false)]),
      regulatoryStore,
    });

    expect(renamed).toEqual(first);
    expect(first.orderedNextActions.map((item) => item.id)).toEqual(expect.arrayContaining([
      "requirement:radio-authorization",
      "requirement:high-band-radio-authorization",
    ]));
    expect(first.orderedNextActions.find((item) => item.id === "requirement:radio-authorization")?.policyLocators)
      .toEqual(expect.arrayContaining([expect.objectContaining({
        sourceVersionId: "india-official-web-d46dd195a281b8ed-edbd3c20dc",
        exactLocator: "Fixture paragraph 1",
      })]));
    expect(noRadio.orderedNextActions.map((item) => item.id)).not.toContain("requirement:radio-authorization");

    const missingThreshold = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("runtime optical bench controller", [characteristic("radio.transmitter_present", true)]),
      regulatoryStore,
    });
    expect(missingThreshold.orderedNextActions.find((item) => item.id === "requirement:high-band-radio-authorization"))
      .toMatchObject({ status: "pending", why: expect.stringMatching(/radio frequency/i) });
  });

  it("returns only graph-backed dossier items and fails unknown, stale, and production-pending branches closed", async () => {
    const { regulatoryStore } = await regulatoryHarness("production");
    const dossier = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("runtime-supplied RF instrumentation module", [
        characteristic("radio.transmitter_present", true),
      ]),
      regulatoryStore,
    });

    for (const section of [
      dossier.documents,
      dossier.policyReview,
      dossier.onlineForms,
      dossier.contacts,
      dossier.classificationAndRegulation,
      dossier.costs,
      dossier.orderedNextActions,
    ]) expect(section.every((item) => !item.id.startsWith("pending:"))).toBe(true);
    expect(Object.values(dossier).flatMap((value) => Array.isArray(value) ? value : [])
      .every((item) => !/appropriate authority|structurally complete/i.test(`${item.owner} ${item.action} ${item.why}`))).toBe(true);
    expect(dossier.decision.summary).not.toMatch(/structurally complete/i);
    expect(dossier.decision.status).toBe("pending");
    expect(dossier.contacts).toContainEqual(expect.objectContaining({
      id: "contact-wpc",
      status: "clear",
      contact: expect.objectContaining({
        channel: "phone",
        value: expect.objectContaining({ value: "011-23350020" }),
        purpose: expect.objectContaining({ value: "technical support of the portal funcionalities" }),
      }),
    }));
    expect(dossier.onlineForms).toContainEqual(expect.objectContaining({
      id: "filing-service-wpc-eta-process",
      status: "pending",
      filingPortals: [],
      why: expect.stringMatching(/Saral Sanchar.*URL.*Pending|filing destination.*Pending/i),
    }));
    expect(dossier.onlineForms.flatMap((item) => item.filingPortals)
      .map((portal) => portal.canonicalUrl.value))
      .not.toContain("https://www.eservices.dot.gov.in/equipment-type-approval-eta");
    expect(dossier.classificationAndRegulation).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "statutory-itc-hs-schedule-1", status: "pending" }),
      expect.objectContaining({ id: "statutory-bis-crs-scheme-ii", status: "pending" }),
      expect.objectContaining({ id: "statutory-tec-mtcte-notified-equipment", status: "pending" }),
    ]));

    const stale = buildElectronicsActionDossier({
      at: new Date("2028-01-01T00:00:00.000Z"),
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("runtime-supplied RF instrumentation module", [characteristic("radio.transmitter_present", true)]),
      regulatoryStore,
    });
    expect(stale.contacts.find((item) => item.id === "contact-wpc")?.status).toBe("pending");
  });

  it("rejects admitted prose masquerading as a policy page number", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-policy-pages-"));
    const { paths } = migrateAllStores({ rootDir });
    const regulatoryStore = new RegulatoryStore(paths.regulatory);
    stores.push(regulatoryStore);
    const input = JSON.parse(await readFile(join(fixtureDirectory, "valid.json"), "utf8"));
    const sourceVersionId = input.admissions[0].evidence.sourceVersionId;
    const binding = (field: string, supportText: string, supportMode = "exact_text") => ({
      claimId: `kg:policy:page-proof:${field}`,
      sourceVersionId,
      exactLocator: "Fixture paragraph 1",
      supportMode,
      supportText,
      supportSha256: createHash("sha256").update(supportText.toLowerCase()).digest("hex"),
    });
    input.nodes.push({
      id: "policy:page-proof",
      kind: "policy_clause",
      jurisdiction: "India",
      label: "Radio Authorization policy locator",
      aliases: [],
      state: "actionable",
      conditions: { all: [] },
      payload: {
        authority: "India Telecommunications Authority",
        instrumentTitle: "Radio Authorization",
        exactLocator: "Radio Authorization",
        pageNumbers: "before shipment",
        canonicalUrl: "https://dot.gov.in/service",
      },
      fieldEvidence: {
        authority: binding("authority", "India Telecommunications Authority"),
        instrumentTitle: binding("instrumentTitle", "Radio Authorization"),
        exactLocator: binding("exactLocator", "Radio Authorization"),
        pageNumbers: binding("pageNumbers", "before shipment"),
        canonicalUrl: binding("canonicalUrl", "https://dot.gov.in/service", "exact_url"),
      },
    });
    await loadElectronicsKnowledgeGraph({ input, regulatoryStore, snapshotRoot: fixtureDirectory });

    const dossier = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("unseen electronics assembly", []),
      regulatoryStore,
    });
    expect(dossier.policyReview.find((item) => item.id === "policy:page-proof")?.policyLocators)
      .toContainEqual(expect.objectContaining({ exactLocator: "Fixture paragraph 1" }));
    expect(dossier.policyReview.find((item) => item.id === "policy:page-proof")?.policyLocators)
      .not.toContainEqual(expect.objectContaining({ pageNumbers: "before shipment" }));
  });

  it("releases a filed_at target only when the separate target service URL is admitted", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-filed-at-target-"));
    const { paths } = migrateAllStores({ rootDir });
    const regulatoryStore = new RegulatoryStore(paths.regulatory);
    stores.push(regulatoryStore);
    const input = JSON.parse(await readFile(join(fixtureDirectory, "valid.json"), "utf8"));
    const originalSourceVersionId = input.admissions[0].evidence.sourceVersionId;
    const relationshipSentence = "India Filing Service submit through Admitted Destination Portal.";
    const uploadSentence = "India Filing Service requires Technical Certificate.";
    const targetSentence = "Admitted Destination Portal is publicly accessible at https://dot.gov.in/admitted-destination for the importer to file; no login required.";
    const snapshot = `${await readFile(join(fixtureDirectory, "snapshot.html"), "utf8")}\n<p>${relationshipSentence} ${uploadSentence} ${targetSentence}</p>`;
    await writeFile(join(rootDir, "snapshot.html"), snapshot);
    const admission = input.admissions[0];
    admission.exactExcerpt = `${admission.exactExcerpt} ${relationshipSentence} ${uploadSentence} ${targetSentence}`;
    admission.evidence.sha256 = createHash("sha256").update(snapshot).digest("hex");
    admission.evidence.documentVersionId = `${admission.evidence.connectorId}-${admission.evidence.sha256.slice(0, 16)}`;
    const fingerprint = createHash("sha256").update(JSON.stringify({
      applicability: admission.evidence.applicability,
      applicabilityEvidence: admission.evidence.applicabilityEvidence,
      amendment: admission.amendment,
      authorityName: admission.evidence.authorityName,
      effectiveFrom: admission.evidence.effectiveFrom,
      exactExcerpt: admission.exactExcerpt,
      exactLocator: admission.evidence.exactLocator,
      instrumentId: admission.evidence.instrumentId,
      instrumentTitle: admission.evidence.instrumentTitle,
      identityEvidence: admission.evidence.identityEvidence,
      translation: admission.evidence.translation,
    })).digest("hex").slice(0, 10);
    admission.evidence.sourceVersionId = `${admission.evidence.documentVersionId}-${fingerprint}`;
    for (const node of input.nodes) {
      for (const binding of Object.values(node.fieldEvidence) as Array<{ sourceVersionId: string }>) {
        if (binding.sourceVersionId === originalSourceVersionId) binding.sourceVersionId = admission.evidence.sourceVersionId;
      }
    }
    for (const edge of input.edges) {
      if (edge.evidence.sourceVersionId === originalSourceVersionId) edge.evidence.sourceVersionId = admission.evidence.sourceVersionId;
    }
    const source = input.nodes.find((node: { id: string }) => node.id === "filing:india-service");
    const target = structuredClone(source);
    target.id = "filing:admitted-destination";
    target.label = "Admitted Destination Portal";
    target.payload.officialServiceName = "Admitted Destination Portal";
    target.payload.canonicalUrl = "https://dot.gov.in/admitted-destination";
    for (const [field, binding] of Object.entries(target.fieldEvidence) as Array<[string, { claimId: string; supportMode: string; supportSha256: string; supportText: string }]>) {
      binding.claimId = `kg:${target.id}:${field}`;
      if (field === "officialServiceName") binding.supportText = "Admitted Destination Portal";
      if (field === "canonicalUrl") binding.supportText = "https://dot.gov.in/admitted-destination";
      if (field === "officialServiceName" || field === "canonicalUrl") {
        binding.supportSha256 = createHash("sha256").update(binding.supportText.toLowerCase()).digest("hex");
      }
    }
    input.nodes.push(target);
    const pendingDocument = input.nodes.find((node: { id: string }) => node.id === "document:technical-certificate");
    delete pendingDocument.fieldEvidence.officialName;
    pendingDocument.state = "evidence_pending";
    pendingDocument.pendingReason = "The official upload name needs fresh field evidence.";
    pendingDocument.verificationOwner = "authority";
    pendingDocument.contactNodeId = "contact:telecommunications";
    const edgeId = "edge:service-filed-at-admitted-destination";
    const supportText = relationshipSentence;
    input.edges.push({
      id: edgeId,
      from: source.id,
      relation: "filed_at",
      to: target.id,
      conditions: { all: [] },
      evidence: {
        claimId: `kg-edge:${edgeId}`,
        sourceVersionId: admission.evidence.sourceVersionId,
        exactLocator: "Fixture paragraph 1",
        supportMode: "exact_text",
        supportText,
        supportSha256: createHash("sha256").update(supportText.toLowerCase()).digest("hex"),
      },
    });
    const uploadEdgeId = "edge:service-requires-pending-document";
    input.edges.push({
      id: uploadEdgeId,
      from: source.id,
      relation: "requires",
      to: pendingDocument.id,
      conditions: { all: [] },
      evidence: {
        claimId: `kg-edge:${uploadEdgeId}`,
        sourceVersionId: admission.evidence.sourceVersionId,
        exactLocator: "Fixture paragraph 1",
        supportMode: "exact_text",
        supportText: uploadSentence,
        supportSha256: createHash("sha256").update(uploadSentence.toLowerCase()).digest("hex"),
      },
    });
    await loadElectronicsKnowledgeGraph({ input, regulatoryStore, snapshotRoot: rootDir });

    const dossier = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("unseen electronics assembly", []),
      regulatoryStore,
    });
    expect(dossier.onlineForms.find((item) => item.id === source.id)?.filingPortals)
      .toContainEqual(expect.objectContaining({
        serviceName: expect.objectContaining({ value: "Admitted Destination Portal" }),
        canonicalUrl: expect.objectContaining({ value: "https://dot.gov.in/admitted-destination" }),
        requiredDocuments: [],
        unresolvedFields: expect.arrayContaining(["documents uploaded there", "submission sequence"]),
      }));
    expect(dossier.onlineForms.find((item) => item.id === source.id)?.filingPortals[0]?.sequence).toBeUndefined();
  });

  it("keeps purpose and purchase-stage changes inert unless graph conditions explicitly use them", async () => {
    const { regulatoryStore } = await regulatoryHarness();
    const base = [characteristic("radio.transmitter_present", true)];
    const personal = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("same product", [
        ...base,
        characteristic("import.purpose", "personal"),
        characteristic("purchase.stage", "pre_purchase"),
      ]),
      regulatoryStore,
    });
    const commercial = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: profile("same product", [
        ...base,
        characteristic("import.purpose", "commercial"),
        characteristic("purchase.stage", "already_purchased"),
      ]),
      regulatoryStore,
    });
    expect(commercial).toEqual(personal);
  });
});

describe("closed evidence refresh overlays", () => {
  it("fills only frozen field bindings with exact admitted support and never mutates the global graph", async () => {
    const rootDir = await mkdtemp(join(tmpdir(), "bwmi-electronics-overlay-"));
    const { paths } = migrateAllStores({ rootDir });
    const regulatoryStore = new RegulatoryStore(paths.regulatory);
    stores.push(regulatoryStore);
    const input = JSON.parse(await readFile(join(fixtureDirectory, "valid.json"), "utf8"));
    const filing = input.nodes.find((node: { id: string }) => node.id === "filing:india-service");
    const access = structuredClone(filing.fieldEvidence.access) as FieldEvidenceBindingJson;
    delete filing.fieldEvidence.access;
    filing.state = "evidence_pending";
    filing.pendingReason = "Access evidence needs a case overlay.";
    filing.verificationOwner = "authority";
    filing.contactNodeId = "contact:telecommunications";
    await loadElectronicsKnowledgeGraph({ input, regulatoryStore, snapshotRoot: fixtureDirectory });
    const currentProfile = profile("unseen electronics assembly", []);
    const overlay = {
      knowledgeNodeId: "filing:india-service",
      replacements: { access },
    };

    expect(validateEvidenceRefreshOverlay({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      overlay,
      profile: currentProfile,
      regulatoryStore,
    })).toEqual(overlay);
    const dossier = buildElectronicsActionDossier({
      evidenceRefreshOverlays: [overlay],
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: currentProfile,
      regulatoryStore,
    });
    expect(dossier.onlineForms.find((item) => item.id === "filing:india-service")).toMatchObject({
      status: "pending",
      why: expect.stringMatching(/sequence/i),
    });
    expect(regulatoryStore.electronicsKnowledge.getNode("filing:india-service")?.node.state).toBe("evidence_pending");

    for (const invalid of [
      { ...overlay, newCondition: { characteristic: "radio.transmitter_present" } },
      { ...overlay, replacements: { inventedFee: access } },
      { ...overlay, replacements: { access: { ...access, supportText: "Semantically equivalent public access" } } },
      { ...overlay, replacements: { access: { ...access, supportSha256: "0".repeat(64) } } },
      { ...overlay, replacements: { access: { ...access, exactLocator: "wrong scope" } } },
      { ...overlay, replacements: { access: { ...access, claimId: "new-value" } } },
    ]) {
      expect(() => validateEvidenceRefreshOverlay({
        knowledgeStore: regulatoryStore.electronicsKnowledge,
        overlay: invalid,
        profile: currentProfile,
        regulatoryStore,
      })).toThrow();
    }
  });
});

describe("case satisfaction evidence", () => {
  it("allows only active-case, resolved deterministic records produced by the resolver to clear an exact target", async () => {
    const { paths, regulatoryStore } = await regulatoryHarness();
    const conversationStore = new ConversationStore(paths.conversations);
    stores.push(conversationStore);
    const conversation = conversationStore.createConversation("Satisfaction evidence");
    const activeCase = conversationStore.createTradeCase(conversation.id, "Active");
    const foreignCase = conversationStore.createTradeCase(conversation.id, "Foreign");
    const extraction = {
      documentType: "authority_acknowledgement" as const,
      fileName: "opaque-upload.pdf",
      mediaType: "application/pdf" as const,
      sizeBytes: 256,
      pageCount: 1,
      facts: [{
        field: "documentNumber" as const,
        label: "Authority record number",
        rawValue: "AUTH-17",
        value: "AUTH-17",
        provenance: {
          documentPage: 1,
          region: { x: 1, y: 1, width: 10, height: 10, unit: "pdf_points" as const },
          method: "embedded_pdf_text" as const,
          confidence: 1,
        },
      }],
    };
    const document = conversationStore.recordDocumentExtraction(activeCase.id, extraction);
    const pendingDocument = conversationStore.recordDocumentExtraction(activeCase.id, { ...extraction, fileName: "second-opaque.pdf" });
    conversationStore.reviewDocumentFact(activeCase.id, document.facts[0]!.id, { action: "confirm" });
    const evidence = resolveCaseSatisfactionEvidence({
      conversationStore,
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      kind: "verified_document",
      recordId: document.id,
      targetNodeId: "document:technical-certificate",
      tradeCaseId: activeCase.id,
    });
    expect(() => resolveCaseSatisfactionEvidence({
      conversationStore,
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      kind: "verified_official_record",
      recordId: document.id,
      targetNodeId: "document:technical-certificate",
      tradeCaseId: activeCase.id,
    })).toThrow(/official-record.*remains Pending/i);
    const currentProfile = profile("unseen electronics assembly", [characteristic("radio.transmitter_present", true)]);
    const clear = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: currentProfile,
      regulatoryStore,
      satisfactionEvidence: [evidence],
    });
    expect(clear.orderedNextActions.find((item) => item.id === "requirement:radio-authorization")?.status).toBe("clear");

    expect(() => resolveCaseSatisfactionEvidence({
      conversationStore,
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      kind: "verified_document",
      recordId: document.id,
      targetNodeId: "document:technical-certificate",
      tradeCaseId: foreignCase.id,
    })).toThrow(/active case/i);
    expect(() => resolveCaseSatisfactionEvidence({
      conversationStore,
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      kind: "verified_document",
      recordId: pendingDocument.id,
      targetNodeId: "document:technical-certificate",
      tradeCaseId: activeCase.id,
    })).toThrow(/pending/i);

    const cast = {
      ...evidence,
      recordId: "user assertion",
      validUntil: "2020-01-01T00:00:00.000Z",
    } as CaseSatisfactionEvidence;
    const required = buildElectronicsActionDossier({
      knowledgeStore: regulatoryStore.electronicsKnowledge,
      profile: currentProfile,
      regulatoryStore,
      satisfactionEvidence: [cast],
    });
    expect(required.orderedNextActions.find((item) => item.id === "requirement:radio-authorization")?.status).toBe("required");
  });
});

describe("source boundary", () => {
  it.runIf(process.env.BWMI_REQUIRE_HARNESS_PRODUCT === "1")(
    "runs a runtime-supplied unseen electronics payload",
    async () => {
      const product = process.env.BWMI_HARNESS_PRODUCT?.trim();
      const specifications = process.env.BWMI_HARNESS_SPECIFICATIONS?.trim();
      const raw = JSON.parse(process.env.BWMI_HARNESS_CHARACTERISTICS ?? "null") as Array<{
        id: string;
        value: RegulatoryCharacteristic["value"];
        unit?: string;
      }>;
      expect(product).toBeTruthy();
      expect(specifications).toBeTruthy();
      expect(raw.length).toBeGreaterThan(0);
      expect(raw.every((entry) => entry.id in CHARACTERISTIC_CATALOG)).toBe(true);
      const characteristics = raw.map((entry) => characteristic(entry.id, entry.value, entry.unit));
      const { regulatoryStore } = await regulatoryHarness("production");
      const runtime = buildElectronicsActionDossier({
        knowledgeStore: regulatoryStore.electronicsKnowledge,
        profile: profile(product!, characteristics),
        regulatoryStore,
      });
      const renamed = buildElectronicsActionDossier({
        knowledgeStore: regulatoryStore.electronicsKnowledge,
        profile: profile("different runtime-only label", characteristics),
        regulatoryStore,
      });
      expect(runtime).toEqual(renamed);
      expect(runtime.decision.status).toBe("pending");
    },
  );

  it("contains no legacy product-pack imports, named-product predicates, provider, or search construction", async () => {
    const source = await readFile(join(projectRoot, "src/server/assessment/electronics-dossier.ts"), "utf8");
    const seed = await readFile(join(projectRoot, "evidence/knowledge/china-india-electronics-v1.json"), "utf8");
    expect(source).not.toMatch(/router-pack|headphones-pack|camera-pack/i);
    expect(source).not.toMatch(/product(?:Description|Name).*===|includes\([^)]*(?:router|headphones|camera)/i);
    expect(source).not.toMatch(/@openai|provider|search/i);
    expect(seed).not.toMatch(/router-pack|headphones-pack|camera-pack|"product\.name"/i);
    expect(createHash("sha256").update(source).digest("hex")).toMatch(/^[a-f0-9]{64}$/);
  });
});
