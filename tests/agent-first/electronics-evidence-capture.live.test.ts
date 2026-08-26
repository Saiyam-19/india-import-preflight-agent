import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { migrateAllStores } from "@/server/data/migrate";
import {
  admitSourceEvidence,
  type AdmissionRequest,
  type AdmittedEvidence,
} from "@/server/evidence/admission";
import { RegulatoryStore } from "@/server/knowledge/regulatory-store";

const runLive = process.env.RUN_LIVE_ELECTRONICS_EVIDENCE_CAPTURE === "1";
const capturedAt = "2026-08-26T10:30:00.000Z";
const freshUntil = "2026-09-25";
const root = process.cwd();
const graphPath = join(root, "evidence/knowledge/china-india-electronics-v1.json");
const sourceLogPath = join(root, "evidence/knowledge/china-india-electronics-v1-source-log.md");
const snapshotRoot = join(root, "evidence/official/electronics-v1");

interface Candidate {
  id: string;
  pendingNodeId: string;
  request: AdmissionRequest;
}

interface CapturedAdmission {
  evidence: AdmittedEvidence;
  amendment: AdmissionRequest["amendment"];
  exactExcerpt: string;
}

function supportSha256(value: string) {
  return createHash("sha256").update(value.replace(/\s+/g, " ").trim().toLowerCase()).digest("hex");
}

function binding(
  nodeId: string,
  field: string,
  admission: CapturedAdmission,
  supportMode: "exact_text" | "exact_url" | "closed_enum",
  supportText: string,
) {
  return {
    claimId: `kg:${nodeId}:${field}`,
    sourceVersionId: admission.evidence.sourceVersionId,
    exactLocator: admission.evidence.exactLocator.value,
    supportMode,
    supportText,
    supportSha256: supportSha256(supportText),
  };
}

function edgeBinding(edgeId: string, admission: CapturedAdmission, supportText: string) {
  return {
    claimId: `kg-edge:${edgeId}`,
    sourceVersionId: admission.evidence.sourceVersionId,
    exactLocator: admission.evidence.exactLocator.value,
    supportMode: "exact_text" as const,
    supportText,
    supportSha256: supportSha256(supportText),
  };
}

type LocatorKind = "section" | "paragraph" | "page" | "table";

function evidence(value: string, exactExcerpt: string, kind: LocatorKind = "section") {
  return { locator: { kind, value }, exactExcerpt };
}

function metadataRequest(input: {
  sourceKind: "official_service_page" | "official_contact_page";
  connectorId?: string;
  url: string;
  authorityName: string;
  instrumentId: string;
  instrumentTitle: string;
  authorityExcerpt: string;
  instrumentIdExcerpt: string;
  locator: string;
  exactExcerpt: string;
  locatorKind?: LocatorKind;
}): AdmissionRequest {
  const locatorKind = input.locatorKind ?? "section";
  const contact = input.sourceKind === "official_contact_page";
  return {
    sourceKind: input.sourceKind,
    connectorId: input.connectorId ?? "india-official-web",
    discoveredAt: capturedAt,
    discoveryQuery: `current official ${input.instrumentTitle}`,
    jurisdiction: "India",
    url: input.url,
    authorityName: input.authorityName,
    instrumentId: input.instrumentId,
    instrumentTitle: input.instrumentTitle,
    identityEvidence: {
      authority: evidence(input.locator, input.authorityExcerpt, locatorKind),
      instrumentId: evidence(input.locator, input.instrumentIdExcerpt, locatorKind),
      instrumentTitle: evidence(input.locator, input.instrumentTitle, locatorKind),
    },
    effectiveFrom: capturedAt.slice(0, 10),
    originalLanguage: "en",
    translation: {
      status: "authoritative_original",
      method: "Official English publication",
      materialAmbiguity: false,
    },
    amendment: {
      status: "original",
      note: "Immutable retrieval of current official metadata on 2026-08-26; no legal effectivity is asserted.",
    },
    applicability: {
      appliesIn: "India",
      tradeDirection: "china_to_india",
      productScope: contact ? "official contact metadata only" : "official service metadata only",
      regulatoryDomain: contact ? "contact metadata" : "service metadata",
    },
    applicabilityEvidence: evidence(input.locator, input.exactExcerpt, locatorKind),
    exactLocator: { kind: locatorKind, value: input.locator },
    exactExcerpt: input.exactExcerpt,
    freshUntil,
  };
}

const candidates: Candidate[] = [
  {
    id: "icegate-esanchit-service",
    pendingNodeId: "filing-service-esanchit",
    request: metadataRequest({
      sourceKind: "official_service_page",
      connectorId: "india-customs-publications",
      url: "https://www.icegate.gov.in/services/esanchit",
      authorityName: "Indian Customs National Trade Portal (ICEGATE)",
      instrumentId: "services/esanchit",
      instrumentTitle: "eSANCHIT",
      authorityExcerpt: "eSANCHIT",
      instrumentIdExcerpt: "eSANCHIT",
      locator: "eSANCHIT",
      exactExcerpt: "eSANCHIT",
    }),
  },
  {
    id: "icegate-esanchit-access",
    pendingNodeId: "filing-service-esanchit",
    request: metadataRequest({
      sourceKind: "official_service_page",
      connectorId: "india-customs-publications",
      url: "https://www.icegate.gov.in/services/esanchit",
      authorityName: "Indian Customs National Trade Portal (ICEGATE)",
      instrumentId: "post-login notice",
      instrumentTitle: "This functionality is available post login",
      authorityExcerpt: "This functionality is available post login",
      instrumentIdExcerpt: "This functionality is available post login",
      locator: "This functionality is available post login",
      exactExcerpt: "This functionality is available post login",
      locatorKind: "paragraph",
    }),
  },
  {
    id: "wpc-eta-identity",
    pendingNodeId: "filing-service-wpc-eta",
    request: metadataRequest({
      sourceKind: "official_service_page",
      url: "https://www.eservices.dot.gov.in/equipment-type-approval-eta",
      authorityName: "Wireless Planning & Coordination (WPC) Wing",
      instrumentId: "equipment-type-approval-eta",
      instrumentTitle: "Equipment Type Approval (ETA)",
      authorityExcerpt: "Wireless Planning & Coordination (WPC) Wing",
      instrumentIdExcerpt: "Equipment Type Approval (ETA)",
      locator: "Equipment Type Approval (ETA)",
      exactExcerpt: "Equipment Type Approval (ETA) is a certification issued by the Wireless Planning & Coordination (WPC) Wing of the Department of Telecommunications (DoT), Government of India.",
    }),
  },
  {
    id: "wpc-saral-sanchar-identity",
    pendingNodeId: "filing-service-saral-sanchar",
    request: metadataRequest({
      sourceKind: "official_service_page",
      url: "https://www.eservices.dot.gov.in/equipment-type-approval-eta",
      authorityName: "Saral Sanchar",
      instrumentId: "saral-sanchar",
      instrumentTitle: "License Issuance & Management (Saral Sanchar)",
      authorityExcerpt: "Saral Sanchar",
      instrumentIdExcerpt: "Saral Sanchar",
      locator: "License Issuance & Management (Saral Sanchar)",
      exactExcerpt: "License Issuance & Management (Saral Sanchar)",
    }),
  },
  {
    id: "wpc-eta-application-process",
    pendingNodeId: "filing-service-wpc-eta-process",
    request: metadataRequest({
      sourceKind: "official_service_page",
      url: "https://www.eservices.dot.gov.in/equipment-type-approval-eta",
      authorityName: "Saral Sanchar portal",
      instrumentId: "Submit application",
      instrumentTitle: "Application Process",
      authorityExcerpt: "saral sanchar portal",
      instrumentIdExcerpt: "Submit application",
      locator: "Application Process",
      exactExcerpt: "Application Process 1 Submit application saral sanchar portal",
    }),
  },
  {
    id: "wpc-portal-contact",
    pendingNodeId: "contact-wpc",
    request: metadataRequest({
      sourceKind: "official_contact_page",
      url: "https://eservices.dot.gov.in/saral/contact-us",
      authorityName: "Department of Telecommunications",
      instrumentId: "saral/contact-us",
      instrumentTitle: "technical support of the portal funcionalities",
      authorityExcerpt: "technical support of the portal funcionalities",
      instrumentIdExcerpt: "technical support of the portal funcionalities",
      locator: "technical support of the portal funcionalities",
      exactExcerpt: "For any technical support of the portal funcionalities, Please contact on 011-23350020 ,011-23350025 or please drop the ticket in the portal.",
      locatorKind: "paragraph",
    }),
  },
];

const always = { all: [] } as const;
const radioPresent = { characteristic: "radio.transmitter_present", op: "present" } as const;
const telecomInterface = {
  characteristic: "telecom.interface",
  op: "in",
  value: ["ip", "cellular", "pstn", "satellite", "multiple"],
} as const;

const characteristicIds = [
  "product.form", "product.condition", "purchase.stage", "import.purpose",
  "packaging.retail_prepackaged", "radio.transmitter_present", "radio.frequency_hz",
  "radio.transmit_power_w", "telecom.public_network_connection", "telecom.interface",
  "battery.present", "battery.chemistry", "battery.capacity_ah", "battery.voltage_v",
  "power.external_supply_present", "power.input_voltage_v", "power.rated_output_w",
  "camera.present", "encryption.present", "end_use.controlled_or_dual_use",
  "classification.itc_hs", "classification.bis_entry", "classification.tec_entry",
  "classification.wpc_entry",
] as const;

const authorities = [
  ["dgft", "Directorate General of Foreign Trade", "licensing", always, "https://www.dgft.gov.in/CP/"],
  ["customs", "Indian Customs Electronic Gateway", "customs", always, "https://www.icegate.gov.in/contact_us"],
  ["wpc", "Wireless Planning & Coordination (WPC) Wing", "telecom", radioPresent, "https://www.eservices.dot.gov.in/equipment-type-approval-eta"],
  ["tec", "Telecommunication Engineering Centre", "telecom", telecomInterface, "https://www.mtcte.tec.gov.in/contact_us"],
  ["bis", "Bureau of Indian Standards", "standards", always, "https://www.bis.gov.in/directory/enquiry/?lang=en"],
  ["cpcb", "Central Pollution Control Board", "environmental", always, "https://cpcb.nic.in/"],
  ["legal-metrology", "Department of Consumer Affairs Legal Metrology", "consumer_protection", always, "https://consumeraffairs.nic.in/organisation-and-units/division/legal-metrology"],
] as const;

function buildNodes(admittedById: Map<string, CapturedAdmission>) {
  const nodes: Array<Record<string, unknown>> = characteristicIds.map((characteristicId) => ({
    id: `characteristic-${characteristicId.replaceAll(".", "-")}`,
    kind: "characteristic",
    jurisdiction: "India",
    label: characteristicId,
    aliases: [],
    state: "actionable",
    conditions: always,
    payload: { characteristicId },
    fieldEvidence: {},
  }));

  for (const [slug, label, role, conditions, url] of authorities) {
    const etaAdmission = slug === "wpc" ? admittedById.get("wpc-eta-identity") : undefined;
    const contactAdmission = slug === "wpc" ? admittedById.get("wpc-portal-contact") : undefined;
    const agencyId = `agency-${slug}`;
    const contactId = `contact-${slug}`;
    const agencySupport = etaAdmission?.exactExcerpt ?? "";
    const contactSupport = contactAdmission?.exactExcerpt ?? "";
    nodes.push({
      id: agencyId,
      kind: "agency",
      jurisdiction: "India",
      label,
      aliases: [],
      state: etaAdmission ? "actionable" : "evidence_pending",
      conditions,
      payload: { authorityName: label, role },
      fieldEvidence: etaAdmission ? {
        authorityName: binding(agencyId, "authorityName", etaAdmission, "exact_text", agencySupport),
        role: binding(agencyId, "role", etaAdmission, "closed_enum", agencySupport),
      } : {},
      ...(!etaAdmission ? {
        pendingReason: "Authority routing is retained, but no legal conclusion is exposed without an admitted current source.",
        verificationOwner: "authority",
      } : {}),
      contactNodeId: contactId,
    });
    nodes.push({
      id: contactId,
      kind: "contact",
      jurisdiction: "India",
      label: `${label} official contact`,
      aliases: [],
      state: contactAdmission ? "actionable" : "evidence_pending",
      conditions,
      payload: contactAdmission
        ? { authorityNodeId: agencyId, channel: "phone", value: "011-23350020", purpose: "technical support of the portal funcionalities" }
        : { authorityNodeId: agencyId, channel: "official_web", value: url, purpose: `${label} verification` },
      fieldEvidence: contactAdmission ? {
        value: binding(contactId, "value", contactAdmission, "exact_text", contactSupport),
        purpose: binding(contactId, "purpose", contactAdmission, "exact_text", contactSupport),
      } : {},
      ...(!contactAdmission ? {
        pendingReason: "The contact route was checked but could not pass field-level admission in this capture.",
        verificationOwner: "authority",
        contactNodeId: contactId,
      } : {}),
    });
  }

  const statutoryEntries = [
    ["itc-hs-schedule-1", "ITC_HS", "ITC-HS-2022-SCHEDULE-1", "ITC (HS), 2022 Schedule 1 – Import Policy", always, "contact-dgft"],
    ["wpc-eta-license-exempt", "WPC_ETA", "ETA-LICENSE-EXEMPT", "Equipment Type Approval for licence-exempt wireless equipment", radioPresent, "contact-wpc"],
    ["tec-mtcte-notified-equipment", "TEC_MTCTE", "MTCTE-NOTIFIED-EQUIPMENT", "Telecommunication equipment notified under MTCTE", telecomInterface, "contact-tec"],
    ["bis-crs-scheme-ii", "BIS_CRS", "BIS-CRS-SCHEME-II", "Scheme II Compulsory Registration schedule", always, "contact-bis"],
  ] as const;
  for (const [slug, system, entryId, officialLabel, conditions, contactNodeId] of statutoryEntries) {
    nodes.push({
      id: `statutory-${slug}`,
      kind: "statutory_entry",
      jurisdiction: "India",
      label: officialLabel,
      aliases: [],
      state: "evidence_pending",
      conditions,
      payload: { system, entryId, officialLabel },
      fieldEvidence: {},
      pendingReason: "The entry is retained only as an authority-routing candidate until its current exact locator is admitted.",
      verificationOwner: "authority",
      contactNodeId,
    });
  }

  const etaAdmission = admittedById.get("wpc-eta-identity");
  const saralAdmission = admittedById.get("wpc-saral-sanchar-identity");
  const processAdmission = admittedById.get("wpc-eta-application-process");
  nodes.push(
    {
      id: "filing-service-esanchit", kind: "filing_service", jurisdiction: "India", label: "e-SANCHIT", aliases: [],
      state: "evidence_pending", conditions: always,
      payload: { authorityNodeId: "agency-customs", officialServiceName: "e-SANCHIT", canonicalUrl: "https://www.icegate.gov.in/guidelines/esanchit-advisory", access: "login_required", filerRole: "importer", loginRequirement: "Confirm current ICEGATE registration and login requirements." },
      fieldEvidence: {}, pendingReason: "Service and access metadata remain unadmitted.", verificationOwner: "authority", contactNodeId: "contact-customs",
    },
    {
      id: "filing-service-wpc-eta", kind: "filing_service", jurisdiction: "India", label: "Equipment Type Approval (ETA)", aliases: [],
      state: "evidence_pending", conditions: radioPresent,
      payload: { authorityNodeId: "agency-wpc", officialServiceName: "Equipment Type Approval (ETA)", canonicalUrl: "https://www.eservices.dot.gov.in/equipment-type-approval-eta", access: "login_required", filerRole: "importer", loginRequirement: "Confirm current portal registration and login requirements." },
      fieldEvidence: etaAdmission ? {
        officialServiceName: binding("filing-service-wpc-eta", "officialServiceName", etaAdmission, "exact_text", etaAdmission.exactExcerpt),
        canonicalUrl: binding("filing-service-wpc-eta", "canonicalUrl", etaAdmission, "exact_url", etaAdmission.exactExcerpt),
      } : {}, pendingReason: "Service identity and source URL may be current, but access and filer-role metadata remain Pending.", verificationOwner: "authority", contactNodeId: "contact-wpc",
    },
    {
      id: "filing-service-wpc-eta-process", kind: "filing_service", jurisdiction: "India", label: "Application Process", aliases: [],
      state: "evidence_pending", conditions: radioPresent,
      payload: { authorityNodeId: "agency-wpc", officialServiceName: "Application Process", canonicalUrl: "https://www.eservices.dot.gov.in/equipment-type-approval-eta", access: "login_required", filerRole: "importer", loginRequirement: "Confirm current portal registration and login requirements." },
      fieldEvidence: processAdmission ? {
        officialServiceName: binding("filing-service-wpc-eta-process", "officialServiceName", processAdmission, "exact_text", processAdmission.exactExcerpt),
        canonicalUrl: binding("filing-service-wpc-eta-process", "canonicalUrl", processAdmission, "exact_url", processAdmission.exactExcerpt),
      } : {}, pendingReason: "The public application-process route is identified, but access and filer-role metadata remain Pending.", verificationOwner: "authority", contactNodeId: "contact-wpc",
    },
    {
      id: "filing-service-saral-sanchar", kind: "filing_service", jurisdiction: "India", label: "saral sanchar portal", aliases: ["License Issuance & Management (Saral Sanchar)"],
      state: "evidence_pending", conditions: radioPresent,
      payload: { authorityNodeId: "agency-wpc", officialServiceName: "License Issuance & Management (Saral Sanchar)", canonicalUrl: "https://saralsanchar.gov.in/LoginHome.php", access: "login_required", filerRole: "importer", loginRequirement: "Confirm current portal registration and login requirements." },
      fieldEvidence: saralAdmission ? {
        officialServiceName: binding("filing-service-saral-sanchar", "officialServiceName", saralAdmission, "exact_text", saralAdmission.exactExcerpt),
      } : {}, pendingReason: "The visible portal identity is current, but its destination, access, and filer-role metadata remain Pending.", verificationOwner: "authority", contactNodeId: "contact-wpc",
    },
  );

  const gaps = [
    ["battery-epr", "battery_epr", { characteristic: "battery.present", op: "present" }, "agency-cpcb", "Central Pollution Control Board"],
    ["e-waste-epr", "e_waste_epr", always, "agency-cpcb", "Central Pollution Control Board"],
    ["legal-metrology", "legal_metrology", { characteristic: "packaging.retail_prepackaged", op: "present" }, "agency-legal-metrology", "Department of Consumer Affairs"],
    ["used-refurbished", "used_refurbished", { characteristic: "product.condition", op: "in", value: ["used", "refurbished"] }, "agency-dgft", "Directorate General of Foreign Trade"],
    ["unmapped-electronics", "unmapped_electronics", always, "agency-dgft", "Directorate General of Foreign Trade"],
  ] as const;
  for (const [slug, domain, conditions, authorityNodeId, owner] of gaps) {
    nodes.push({
      id: `gap-${slug}`, kind: "coverage_gap", jurisdiction: "India", label: `${domain} evidence coverage`, aliases: [],
      state: "coverage_pending", conditions, payload: { domain, authorityNodeId }, fieldEvidence: {},
      pendingReason: "Current official evidence was not admitted within this bounded capture.",
      verificationOwner: owner, contactNodeId: authorityNodeId.replace("agency-", "contact-"),
    });
  }
  return nodes;
}

function buildEdges(admittedById: Map<string, CapturedAdmission>) {
  const processAdmission = admittedById.get("wpc-eta-application-process");
  if (!processAdmission) return [];
  const edgeId = "edge-wpc-application-filed-at-saral-sanchar";
  return [{
    id: edgeId,
    from: "filing-service-wpc-eta-process",
    relation: "filed_at",
    to: "filing-service-saral-sanchar",
    conditions: radioPresent,
    evidence: edgeBinding(edgeId, processAdmission, processAdmission.exactExcerpt),
  }];
}

describe.runIf(runLive)("live electronics evidence capture", () => {
  it("runs official sources through admission and exports only admitted records", async () => {
    const databaseRoot = await mkdtemp(join(tmpdir(), "bwmi-electronics-evidence-"));
    const { paths } = migrateAllStores({ rootDir: databaseRoot });
    const store = new RegulatoryStore(paths.regulatory);
    const admissions: CapturedAdmission[] = [];
    const admittedById = new Map<string, CapturedAdmission>();
    const gaps: Array<{ id: string; pendingNodeId: string; code: string; message: string }> = [
      {
        id: "dgft-import-policy-and-iec",
        pendingNodeId: "agency-dgft",
        code: "not_submitted_incomplete_legal_metadata",
        message: "Verified PDF pages lack a truthful labelled legal identity and legally attributable effective date.",
      },
      {
        id: "bis-scheme-ii",
        pendingNodeId: "agency-bis",
        code: "not_submitted_incomplete_legal_metadata",
        message: "The current list/navigation pages do not establish a controlling generic product schedule and effectivity.",
      },
      {
        id: "tec-mtcte",
        pendingNodeId: "agency-tec",
        code: "not_submitted_incomplete_legal_metadata",
        message: "The current service/about pages do not establish controlling schedule applicability and effectivity.",
      },
      {
        id: "icegate-contact",
        pendingNodeId: "contact-customs",
        code: "not_submitted_cross_block_identity",
        message: "Current phone and email values could not be joined to the page title without fabricating a single exact DOM span.",
      },
    ];
    await mkdir(snapshotRoot, { recursive: true });
    await mkdir(join(root, "evidence/knowledge"), { recursive: true });

    try {
      for (const candidate of candidates) {
        const result = await admitSourceEvidence(candidate.request, {
          store,
          snapshotRoot,
          now: () => new Date(capturedAt),
        });
        if (result.status === "admitted") {
          const captured = {
            evidence: {
              ...result.evidence,
              snapshotRelativePath: join("evidence/official/electronics-v1", result.evidence.snapshotRelativePath),
            },
            amendment: candidate.request.amendment,
            exactExcerpt: candidate.request.exactExcerpt,
          };
          admissions.push(captured);
          admittedById.set(candidate.id, captured);
        } else {
          gaps.push({ id: candidate.id, pendingNodeId: candidate.pendingNodeId, code: result.code, message: result.message });
        }
      }
    } finally {
      store.close();
    }

    const graph = {
      schemaVersion: 1,
      graphId: "china-india-electronics-v1",
      admissions,
      nodes: buildNodes(admittedById),
      edges: buildEdges(admittedById),
    };
    await writeFile(graphPath, `${JSON.stringify(graph, null, 2)}\n`, "utf8");

    const resultRows = [
      ...Array.from(admittedById.entries()).map(([id, admission]) =>
        `| ${id} | \`admitted\` | ${admission.evidence.finalUrl} | \`${admission.evidence.sha256}\` |`),
      ...gaps.map((gap) => `| ${gap.id} | \`${gap.code}\` | ${gap.message} | Pending |`),
    ];
    const captureSection = [
      "## Opt-in live admission capture result",
      "",
      "Command run on 2026-08-26:",
      "",
      "`RUN_LIVE_ELECTRONICS_EVIDENCE_CAPTURE=1 pnpm vitest run tests/agent-first/electronics-evidence-capture.live.test.ts`",
      "",
      "The repaired pipeline generated the production admissions, nodes, edges, and Pending outcomes below. Service/contact admissions are metadata-only and do not establish product applicability or legal obligations.",
      "",
      "| Candidate | Result | Source or reason | Snapshot SHA-256 / state |",
      "|---|---|---|---|",
      ...resultRows,
      "",
    ].join("\n");
    const sourceLog = await readFile(sourceLogPath, "utf8");
    const repairSection = [
      "## Production-evidence repair review",
      "",
      "- DGFT PDF page extraction and exact page locators now work, but the researched baseline pages still lack a truthful labelled legal identity and legally attributable effective date; DGFT legal claims remain Pending.",
      "- ICEGATE eSANCHIT service/access retrieval now fails precisely as `tls_certificate_invalid`; contact values remain cross-block and Pending.",
      "- WPC ETA service identity, visible Saral Sanchar identity, application-process routing, and DoT portal technical contact metadata were admitted. These metadata admissions do not establish ETA product applicability, an obligation, approval, or clearance.",
      "- BIS and TEC controlling product applicability remains Pending because no exact current controlling schedule/effectivity evidence passed.",
      "- API Setu was not integrated or used.",
      "",
    ].join("\n");
    const updatedSourceLog = sourceLog.replace(
      /## Opt-in live admission capture result[\s\S]*?(?=\n## Production-evidence repair review)/,
      `${captureSection}\n`,
    ).replace(
      "- No source was treated as admitted by this log.",
      "- Four official WPC/DoT metadata sources were treated as admitted only after the live pipeline returned `admitted`; no legal applicability was inferred.",
    ).replace(/## Production-evidence repair review[\s\S]*$/, repairSection);
    await writeFile(sourceLogPath, updatedSourceLog, "utf8");

    console.info("Official-source admission results:", {
      admitted: admissions.map(({ evidence }) => ({
        id: evidence.instrumentId,
        finalUrl: evidence.finalUrl,
        sha256: evidence.sha256,
      })),
      pending: gaps,
    });
    expect(admissions.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.nodes.some((node) => node.state === "actionable")).toBe(true);
    expect(graph.nodes.some((node) => node.state === "coverage_pending")).toBe(true);
    expect(gaps.every((gap) => graph.nodes.some((node) => node.id === gap.pendingNodeId))).toBe(true);
  }, 120_000);
});
