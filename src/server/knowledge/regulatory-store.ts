import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { AdmittedEvidence } from "../evidence/admission";
import { OFFICIAL_CONNECTORS } from "../evidence/registry";
import { ElectronicsKnowledgeStore } from "./electronics-knowledge-store";

const LOCATOR =
  "Foreign Trade Policy 2023, Chapter 2, paragraphs 2.05(a)-(c) and 2.06(b)-(d)";

export const DGFT_REFERENCE_SOURCE = {
  id: "dgft-ftp-2023-ch2",
  sourceVersionId: "dgft-ftp-2023-ch2-f16265d88b82",
  authority: "Directorate General of Foreign Trade (DGFT)",
  jurisdiction: "India",
  canonicalUrl:
    "https://content.dgft.gov.in/Website/dgftprod/9158887c-cdfb-4312-92f1-15eeb8e8aa70/%5BUPDATED%5D%20CHAPTER%202%20OF%20FTP.pdf",
  sha256: "f16265d88b82a6ce9f4a8436216e0b237953b587f723236a367960388d41edac",
  versionLabel: "Foreign Trade Policy 2023, updated Chapter 2 snapshot",
  effectiveFrom: "2023-04-01",
  freshUntil: "2026-09-25",
  publishedAt: "2025-09-02",
  retrievedAt: "2026-08-25",
  mimeType: "application/pdf",
  locator: LOCATOR,
  bundledFileName: "dgft-ftp-2023-chapter-2.pdf",
  excerpt: [
    "An IEC is a 10-character alpha-numeric number allotted to an entity (firm/company/LLP etc.) and is mandatory for undertaking any export/import activities.",
    "No export or import of goods shall be made by any person without obtaining an IEC unless specifically exempted.",
    "Exempt categories and corresponding permanent IECs are given in Para 2.07 of Handbook of Procedures.",
    "Mandatory documents required for import of goods into India: Bill of Lading/Airway Bill/Lorry Receipt/Railway Receipt/Postal Receipt in form CN-22 or CN 23 as the case may be; Commercial Invoice cum Packing List; Bill of Entry.",
    "For export or import of specific goods or category of goods, which are subject to any restrictions/policy conditions or require NOC or product specific compliances under any statute, the regulatory authority concerned may notify additional documents.",
    "In specific cases of export or import, the regulatory authority concerned may electronically or in writing seek additional documents or information, as deemed necessary to ensure legal compliance.",
  ].join(" "),
  coverage: {
    jurisdiction: "India",
    question: "IEC and baseline import documents",
    status: "research_guidance" as const,
  },
} as const;

export interface ResolvedCitation {
  authority: string;
  claimText?: string;
  label: string;
  locator: string;
  sourceVersionId: string;
  url: string;
}

export interface ScopedAdmittedClaim extends ResolvedCitation {
  applicability: {
    appliesIn: "China" | "India";
    productScope: string;
    regulatoryDomain: string;
    tradeDirection: "china_to_india" | "india_to_china";
  };
  claimText: string;
}

export interface ReferenceEvidence extends ResolvedCitation {
  admissionState: "admitted";
  coverage: typeof DGFT_REFERENCE_SOURCE.coverage;
  effectiveFrom: string;
  freshUntil: string;
  excerpt: string;
  publishedAt: string;
  retrievedAt: string;
  sha256: string;
  snapshotPath: string;
  versionLabel: string;
}

const GLOBAL_PRODUCT_SCOPE = "all goods baseline import documents and iec";

export function isGlobalProductScope(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim() === GLOBAL_PRODUCT_SCOPE;
}

interface AdmissionRecord {
  snapshotRelativePath: string;
}

export class RegulatoryStore {
  readonly #database: DatabaseSync;
  readonly electronicsKnowledge: ElectronicsKnowledgeStore;

  constructor(path: string) {
    this.#database = new DatabaseSync(path);
    this.#database.exec("PRAGMA foreign_keys = ON");
    this.electronicsKnowledge = new ElectronicsKnowledgeStore(this.#database);
    this.syncConnectorRegistry();
  }

  private syncConnectorRegistry() {
    const statement = this.#database.prepare(`
      INSERT INTO official_connectors (
        id, jurisdiction, authority_name, purpose, allowed_domains_json, connector_state, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        jurisdiction = excluded.jurisdiction,
        authority_name = excluded.authority_name,
        purpose = excluded.purpose,
        allowed_domains_json = excluded.allowed_domains_json,
        connector_state = excluded.connector_state,
        updated_at = excluded.updated_at
    `);
    const updatedAt = new Date().toISOString();
    for (const connector of OFFICIAL_CONNECTORS) {
      statement.run(
        connector.id,
        connector.jurisdiction,
        connector.authority,
        connector.purpose,
        JSON.stringify(connector.allowedDomains),
        connector.state,
        updatedAt,
      );
    }
  }

  connectorStates() {
    return this.#database
      .prepare(`
        SELECT id, jurisdiction, authority_name AS authority, connector_state AS state,
               allowed_domains_json AS allowedDomainsJson, purpose
        FROM official_connectors ORDER BY jurisdiction, id
      `)
      .all()
      .map((row) => {
        const typed = row as {
          allowedDomainsJson: string;
          authority: string;
          id: string;
          jurisdiction: "India" | "China";
          purpose: string;
          state: string;
        };
        return { ...typed, allowedDomains: JSON.parse(typed.allowedDomainsJson) as string[] };
      });
  }

  recordAdmittedEvidence(
    evidence: AdmittedEvidence & {
      amendment: { note: string; status: string; supersedesDocumentVersionId?: string };
      exactExcerpt: string;
      originalLanguage: string;
      translation: Record<string, unknown>;
    },
  ) {
    this.#database
      .prepare(`
        INSERT INTO evidence_admissions (
          admission_id, source_version_id, document_version_id, connector_id, jurisdiction, authority_name,
          instrument_id, instrument_title, effective_from, fresh_until, amendment_json,
          applicability_json, original_language, translation_json, exact_locator_kind, exact_locator, exact_excerpt,
          canonical_url, redirect_history_json, content_type, sha256, snapshot_relative_path,
          admission_state, prompt_injection_detected, transitions_json, admitted_at,
          identity_evidence_json, applicability_evidence_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admitted', ?, ?, ?, ?, ?)
        ON CONFLICT(source_version_id) DO NOTHING
      `)
      .run(
        evidence.admissionId,
        evidence.sourceVersionId,
        evidence.documentVersionId,
        evidence.connectorId,
        evidence.jurisdiction,
        evidence.authorityName,
        evidence.instrumentId,
        evidence.instrumentTitle,
        evidence.effectiveFrom,
        evidence.freshUntil,
        JSON.stringify(evidence.amendment),
        JSON.stringify(evidence.applicability),
        evidence.originalLanguage,
        JSON.stringify(evidence.translation),
        evidence.exactLocator.kind,
        evidence.exactLocator.value,
        evidence.exactExcerpt,
        evidence.finalUrl,
        JSON.stringify(evidence.redirectHistory),
        evidence.contentType,
        evidence.sha256,
        evidence.snapshotRelativePath,
        evidence.promptInjectionDetected ? 1 : 0,
        JSON.stringify(evidence.transitions),
        evidence.transitions.at(-1)?.at ?? new Date().toISOString(),
        JSON.stringify(evidence.identityEvidence),
        JSON.stringify(evidence.applicabilityEvidence),
      );
  }

  findAdmissionConflict(input: {
    applicability: { productScope: string; regulatoryDomain: string; tradeDirection: string; appliesIn: string };
    exactExcerpt: string;
    exactLocator: { kind: string; value: string };
    instrumentId: string;
    originalLanguage: string;
    sourceVersionId: string;
    supersedesDocumentVersionId?: string;
    translation: { englishExcerpt?: string | undefined };
  }): string | null {
    const rows = this.#database
      .prepare(`
        SELECT source_version_id AS sourceVersionId, document_version_id AS documentVersionId,
               exact_excerpt AS exactExcerpt, exact_locator_kind AS exactLocatorKind,
               exact_locator AS exactLocator,
               applicability_json AS applicabilityJson
        FROM evidence_admissions
        WHERE instrument_id = ? AND admission_state = 'admitted' AND source_version_id <> ?
      `)
      .all(input.instrumentId, input.sourceVersionId) as Array<{
        applicabilityJson: string;
        documentVersionId: string;
        exactExcerpt: string;
        exactLocator: string;
        exactLocatorKind: string;
        sourceVersionId: string;
      }>;
    for (const row of rows) {
      const superseded = input.supersedesDocumentVersionId
        ? this.supersededDocumentChain(input.supersedesDocumentVersionId)
        : new Set<string>();
      if (superseded.has(row.documentVersionId)) continue;
      if (
        row.applicabilityJson === JSON.stringify(input.applicability) &&
        row.exactLocatorKind === input.exactLocator.kind &&
        row.exactLocator === input.exactLocator.value
      ) {
        const rowTranslation = this.#database
          .prepare("SELECT original_language AS originalLanguage, translation_json AS translationJson FROM evidence_admissions WHERE source_version_id = ?")
          .get(row.sourceVersionId) as { originalLanguage: string; translationJson: string };
        const rowClaim = rowTranslation.originalLanguage === "en"
          ? row.exactExcerpt
          : (JSON.parse(rowTranslation.translationJson) as { englishExcerpt?: string }).englishExcerpt;
        const inputClaim = input.originalLanguage === "en"
          ? input.exactExcerpt
          : input.translation.englishExcerpt;
        if (rowClaim !== inputClaim) return row.sourceVersionId;
      }
    }
    return null;
  }

  private supersededDocumentChain(documentVersionId: string) {
    const chain = new Set<string>();
    let current: string | undefined = documentVersionId;
    while (current && !chain.has(current)) {
      chain.add(current);
      const row = this.#database
        .prepare(`
          SELECT amendment_json AS amendmentJson FROM evidence_admissions
          WHERE document_version_id = ? AND admission_state = 'admitted' LIMIT 1
        `)
        .get(current) as { amendmentJson: string } | undefined;
      current = row
        ? (JSON.parse(row.amendmentJson) as { supersedesDocumentVersionId?: string }).supersedesDocumentVersionId
        : undefined;
    }
    return chain;
  }

  isValidSupersessionPredecessor(input: {
    authorityName: string;
    documentVersionId: string;
    effectiveFrom: string;
    exactLocator: { kind: string; value: string };
    instrumentId: string;
    jurisdiction: string;
  }) {
    return Boolean(this.#database.prepare(`
      SELECT 1 FROM evidence_admissions
      WHERE document_version_id = ? AND instrument_id = ? AND authority_name = ?
        AND jurisdiction = ? AND exact_locator_kind = ? AND exact_locator = ?
        AND effective_from < ? AND admission_state = 'admitted'
      LIMIT 1
    `).get(
      input.documentVersionId,
      input.instrumentId,
      input.authorityName,
      input.jurisdiction,
      input.exactLocator.kind,
      input.exactLocator.value,
      input.effectiveFrom,
    ));
  }

  getAdmittedEvidenceForGuidance(
    sourceVersionId: string,
    expectedScope?: { appliesIn: "India" | "China"; tradeDirection: "china_to_india" | "india_to_china" },
  ) {
    const row = this.#database
      .prepare(`
        SELECT source_version_id AS sourceVersionId, authority_name AS authority,
               instrument_title AS instrumentTitle, effective_from AS effectiveFrom,
               fresh_until AS freshUntil, applicability_json AS applicabilityJson,
               original_language AS originalLanguage, translation_json AS translationJson,
               document_version_id AS documentVersionId, instrument_id AS instrumentId,
               jurisdiction, exact_locator_kind AS exactLocatorKind,
               amendment_json AS amendmentJson, exact_locator AS locator,
               exact_excerpt AS exactExcerpt, canonical_url AS url
        FROM evidence_admissions
        WHERE source_version_id = ? AND admission_state = 'admitted'
      `)
      .get(sourceVersionId) as
      | {
          applicabilityJson: string;
          amendmentJson: string;
          authority: string;
          documentVersionId: string;
          effectiveFrom: string;
          exactExcerpt: string;
          freshUntil: string;
          instrumentTitle: string;
          instrumentId: string;
          jurisdiction: "India" | "China";
          locator: string;
          exactLocatorKind: string;
          originalLanguage: string;
          sourceVersionId: string;
          translationJson: string;
          url: string;
        }
      | undefined;
    if (!row) throw new Error("Admitted evidence was not found.");
    const translation = JSON.parse(row.translationJson) as {
      englishExcerpt?: string;
      materialAmbiguity: boolean;
      status: string;
    };
    if (
      new Date(`${row.freshUntil}T23:59:59.999Z`).getTime() < Date.now() ||
      translation.materialAmbiguity ||
      (row.originalLanguage !== "en" &&
        !["official_translation", "derived_translation"].includes(translation.status))
    ) {
      throw new Error("Admitted evidence is stale or has an unresolved translation gap.");
    }
    const applicability = JSON.parse(row.applicabilityJson) as {
      appliesIn: "India" | "China";
      productScope: string;
      regulatoryDomain: string;
      tradeDirection: "china_to_india" | "india_to_china";
    };
    if (
      expectedScope &&
      (applicability.appliesIn !== expectedScope.appliesIn ||
        applicability.tradeDirection !== expectedScope.tradeDirection)
    ) {
      throw new Error("Admitted evidence does not match the active Trade Case scope.");
    }
    const amendment = JSON.parse(row.amendmentJson) as { supersedesDocumentVersionId?: string };
    const otherAdmissions = this.#database.prepare(`
      SELECT document_version_id AS documentVersionId, amendment_json AS amendmentJson
      FROM evidence_admissions
      WHERE instrument_id = ? AND source_version_id <> ? AND admission_state = 'admitted'
    `).all(row.instrumentId, row.sourceVersionId) as Array<{ amendmentJson: string; documentVersionId: string }>;
    const supersededByAnotherAdmission = otherAdmissions.some((candidate) => {
      const candidateAmendment = JSON.parse(candidate.amendmentJson) as { supersedesDocumentVersionId?: string };
      return candidateAmendment.supersedesDocumentVersionId
        ? this.supersededDocumentChain(candidateAmendment.supersedesDocumentVersionId).has(row.documentVersionId)
        : false;
    });
    const conflict = this.findAdmissionConflict({
      applicability,
      exactExcerpt: row.exactExcerpt,
      exactLocator: { kind: row.exactLocatorKind, value: row.locator },
      instrumentId: row.instrumentId,
      originalLanguage: row.originalLanguage,
      sourceVersionId: row.sourceVersionId,
      ...(amendment.supersedesDocumentVersionId
        ? { supersedesDocumentVersionId: amendment.supersedesDocumentVersionId }
        : {}),
      translation,
    });
    if (supersededByAnotherAdmission || conflict) {
      throw new Error("Admitted evidence has been superseded or now conflicts with another admission.");
    }
    return {
      ...row,
      applicability,
      translation,
      claimText:
        row.originalLanguage === "en"
          ? row.exactExcerpt
          : (translation as { englishExcerpt?: string }).englishExcerpt,
    };
  }

  listAdmittedEvidenceForScope(input: {
    appliesIn: "China" | "India";
    productQuery?: string;
    regulatoryDomain?: string;
    tradeDirection: "china_to_india" | "india_to_china";
  }): ScopedAdmittedClaim[] {
    const meaningfulTokens = (value: string) => new Set(
      value
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, " ")
        .split(/\s+/)
        .filter((token) => token.length > 2 && ![
          "and", "for", "from", "goods", "import", "imports", "into", "product", "products", "the", "with",
        ].includes(token)),
    );
    const productTokens = meaningfulTokens(input.productQuery ?? "");
    const domainTokens = meaningfulTokens(input.regulatoryDomain ?? "");
    const exactTokenScope = (left: Set<string>, right: Set<string>) =>
      left.size > 0 && left.size === right.size && [...left].every((token) => right.has(token));
    const overlaps = (left: Set<string>, right: Set<string>) =>
      left.size === 0 || [...left].some((token) => right.has(token));

    const rows = this.#database.prepare(`
      SELECT source_version_id AS sourceVersionId, authority_name AS authority,
        instrument_title AS instrumentTitle, fresh_until AS freshUntil,
        applicability_json AS applicabilityJson, original_language AS originalLanguage,
        translation_json AS translationJson, exact_locator AS locator,
        exact_excerpt AS exactExcerpt, canonical_url AS url
      FROM evidence_admissions
      WHERE jurisdiction = ? AND admission_state = 'admitted'
      ORDER BY admitted_at, source_version_id
    `).all(input.appliesIn) as Array<{
      applicabilityJson: string;
      authority: string;
      exactExcerpt: string;
      freshUntil: string;
      instrumentTitle: string;
      locator: string;
      originalLanguage: string;
      sourceVersionId: string;
      translationJson: string;
      url: string;
    }>;

    const admitted = rows.flatMap((row) => {
      let current;
      try {
        current = this.getAdmittedEvidenceForGuidance(row.sourceVersionId, {
          appliesIn: input.appliesIn,
          tradeDirection: input.tradeDirection,
        });
      } catch {
        return [];
      }
      const applicability = current.applicability;
      const productScopeTokens = meaningfulTokens(applicability.productScope);
      const regulatoryDomainTokens = meaningfulTokens(applicability.regulatoryDomain);
      if (!isGlobalProductScope(applicability.productScope) && !exactTokenScope(productTokens, productScopeTokens)) return [];
      if (!overlaps(domainTokens, regulatoryDomainTokens)) return [];
      const claimText = current.claimText;
      if (!claimText) return [];
      return [{
        applicability,
        authority: current.authority,
        claimText,
        label: `${current.authority} — ${current.instrumentTitle}`,
        locator: current.locator,
        sourceVersionId: current.sourceVersionId,
        url: current.url,
      } satisfies ScopedAdmittedClaim];
    });

    if (
      input.appliesIn === "India" &&
      input.tradeDirection === "china_to_india" &&
      (!input.regulatoryDomain || /\b(?:baseline|document|iec|foreign trade)\b/i.test(input.regulatoryDomain))
    ) {
      const reference = this.getReferenceEvidence();
      admitted.unshift({
        applicability: {
          appliesIn: "India",
          productScope: "all goods — baseline import documents and IEC",
          regulatoryDomain: "foreign trade and baseline import documents",
          tradeDirection: "china_to_india",
        },
        authority: reference.authority,
        claimText: reference.excerpt,
        label: reference.label,
        locator: reference.locator,
        sourceVersionId: reference.sourceVersionId,
        url: reference.url,
      });
    }
    return admitted;
  }

  admitReferenceSource(record: AdmissionRecord) {
    const source = this.#database.prepare(`
      INSERT INTO official_sources (id, authority_name, canonical_url, jurisdiction, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        authority_name = excluded.authority_name,
        canonical_url = excluded.canonical_url,
        jurisdiction = excluded.jurisdiction
    `);
    const version = this.#database.prepare(`
      INSERT INTO source_versions (
        id, source_id, sha256, version_label, effective_from, published_at,
        retrieved_at, mime_type, snapshot_relative_path, admission_state, locator, excerpt_text,
        fresh_until, conflict_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'admitted', ?, ?, ?, 'clear')
      ON CONFLICT(id) DO UPDATE SET
        snapshot_relative_path = excluded.snapshot_relative_path
    `);
    const coverage = this.#database.prepare(`
      INSERT INTO coverage_manifest (source_version_id, jurisdiction, question, status)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(source_version_id) DO UPDATE SET
        jurisdiction = excluded.jurisdiction,
        question = excluded.question,
        status = excluded.status
    `);

    this.#database.exec("BEGIN IMMEDIATE");
    try {
      source.run(
        DGFT_REFERENCE_SOURCE.id,
        DGFT_REFERENCE_SOURCE.authority,
        DGFT_REFERENCE_SOURCE.canonicalUrl,
        DGFT_REFERENCE_SOURCE.jurisdiction,
        new Date().toISOString(),
      );
      version.run(
        DGFT_REFERENCE_SOURCE.sourceVersionId,
        DGFT_REFERENCE_SOURCE.id,
        DGFT_REFERENCE_SOURCE.sha256,
        DGFT_REFERENCE_SOURCE.versionLabel,
        DGFT_REFERENCE_SOURCE.effectiveFrom,
        DGFT_REFERENCE_SOURCE.publishedAt,
        DGFT_REFERENCE_SOURCE.retrievedAt,
        DGFT_REFERENCE_SOURCE.mimeType,
        record.snapshotRelativePath,
        DGFT_REFERENCE_SOURCE.locator,
        DGFT_REFERENCE_SOURCE.excerpt,
        DGFT_REFERENCE_SOURCE.freshUntil,
      );
      coverage.run(
        DGFT_REFERENCE_SOURCE.sourceVersionId,
        DGFT_REFERENCE_SOURCE.coverage.jurisdiction,
        DGFT_REFERENCE_SOURCE.coverage.question,
        DGFT_REFERENCE_SOURCE.coverage.status,
      );
      this.#database.exec("COMMIT");
    } catch (error) {
      this.#database.exec("ROLLBACK");
      throw error;
    }
  }

  getReferenceEvidence(sourcesRoot?: string): ReferenceEvidence {
    const row = this.#database
      .prepare(`
        SELECT
          sv.id AS sourceVersionId,
          os.authority_name AS authority,
          os.canonical_url AS url,
          sv.sha256 AS sha256,
          sv.version_label AS versionLabel,
          sv.effective_from AS effectiveFrom,
          sv.fresh_until AS freshUntil,
          sv.conflict_status AS conflictStatus,
          sv.published_at AS publishedAt,
          sv.retrieved_at AS retrievedAt,
          sv.snapshot_relative_path AS snapshotRelativePath,
          sv.admission_state AS admissionState,
          sv.locator AS locator,
          sv.excerpt_text AS excerpt,
          cm.jurisdiction AS jurisdiction,
          cm.question AS question,
          cm.status AS status
        FROM source_versions sv
        JOIN official_sources os ON os.id = sv.source_id
        JOIN coverage_manifest cm ON cm.source_version_id = sv.id
        WHERE sv.id = ? AND sv.admission_state = 'admitted'
      `)
      .get(DGFT_REFERENCE_SOURCE.sourceVersionId) as
      | {
          admissionState: "admitted";
          authority: string;
          conflictStatus: "clear" | "conflicting" | "unverified";
          effectiveFrom: string;
          excerpt: string;
          freshUntil: string;
          jurisdiction: "India";
          locator: string;
          publishedAt: string;
          question: "IEC and baseline import documents";
          retrievedAt: string;
          sha256: string;
          snapshotRelativePath: string;
          sourceVersionId: string;
          status: "research_guidance";
          url: string;
          versionLabel: string;
        }
      | undefined;
    if (!row) throw new Error("Reference evidence is not admitted.");
    if (new Date(`${row.freshUntil}T23:59:59.999Z`).getTime() < Date.now()) {
      throw new Error("Reference evidence is stale.");
    }
    if (row.conflictStatus !== "clear") {
      throw new Error("Reference evidence has an unresolved conflict.");
    }
    return {
      admissionState: row.admissionState,
      authority: row.authority,
      coverage: {
        jurisdiction: row.jurisdiction,
        question: row.question,
        status: row.status,
      },
      effectiveFrom: row.effectiveFrom,
      freshUntil: row.freshUntil,
      excerpt: row.excerpt,
      label: `${row.authority} — ${row.versionLabel}`,
      locator: row.locator,
      publishedAt: row.publishedAt,
      retrievedAt: row.retrievedAt,
      sha256: row.sha256,
      snapshotPath: sourcesRoot
        ? resolve(sourcesRoot, row.snapshotRelativePath)
        : row.snapshotRelativePath,
      sourceVersionId: row.sourceVersionId,
      url: row.url,
      versionLabel: row.versionLabel,
    };
  }

  resolveCitation(input: { sourceVersionId: string; locator: string }): ResolvedCitation {
    const legacy = this.#database
      .prepare(`
        SELECT sv.id AS sourceVersionId, os.authority_name AS authority,
               os.canonical_url AS url, sv.version_label AS versionLabel, sv.locator AS locator,
               sv.fresh_until AS freshUntil, sv.conflict_status AS conflictStatus
        FROM source_versions sv
        JOIN official_sources os ON os.id = sv.source_id
        WHERE sv.id = ? AND sv.locator = ? AND sv.admission_state = 'admitted'
      `)
      .get(input.sourceVersionId, input.locator) as
      | {
          authority: string;
          conflictStatus: "clear" | "conflicting" | "unverified";
          freshUntil: string;
          locator: string;
          sourceVersionId: string;
          url: string;
          versionLabel: string;
        }
      | undefined;
    if (legacy) {
      if (new Date(`${legacy.freshUntil}T23:59:59.999Z`).getTime() < Date.now()) {
        throw new Error("Reference evidence is stale.");
      }
      if (legacy.conflictStatus !== "clear") {
        throw new Error("Reference evidence has an unresolved conflict.");
      }
      return {
        authority: legacy.authority,
        label: `${legacy.authority} — ${legacy.versionLabel}`,
        locator: legacy.locator,
        sourceVersionId: legacy.sourceVersionId,
        url: legacy.url,
      };
    }
    const row = this.#database
      .prepare(`
        SELECT source_version_id AS sourceVersionId, authority_name AS authority,
               canonical_url AS url, instrument_title AS versionLabel, exact_locator AS locator,
               exact_excerpt AS exactExcerpt, original_language AS originalLanguage,
               translation_json AS translationJson
        FROM evidence_admissions
        WHERE source_version_id = ? AND exact_locator = ? AND admission_state = 'admitted'
      `)
      .get(input.sourceVersionId, input.locator) as
      | {
          authority: string;
          exactExcerpt: string;
          locator: string;
          originalLanguage: string;
          sourceVersionId: string;
          translationJson: string;
          url: string;
          versionLabel: string;
        }
      | undefined;
    if (!row) throw new Error("Citation source or locator is not admitted.");
    const current = this.getAdmittedEvidenceForGuidance(input.sourceVersionId);
    if (current.locator !== input.locator) throw new Error("Citation source or locator is not admitted.");
    const claimText = current.claimText;
    return {
      authority: current.authority,
      ...(claimText ? { claimText } : {}),
      label: `${current.authority} — ${current.instrumentTitle}`,
      locator: current.locator,
      sourceVersionId: current.sourceVersionId,
      url: current.url,
    };
  }

  close() {
    this.electronicsKnowledge.close();
    this.#database.close();
  }
}

export async function admitBundledReferenceSource(
  store: RegulatoryStore,
  sourcesRoot: string,
): Promise<ReferenceEvidence> {
  const bundledPath = join(
    process.cwd(),
    "evidence",
    "official",
    DGFT_REFERENCE_SOURCE.bundledFileName,
  );
  const bytes = await readFile(bundledPath);
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (actualHash !== DGFT_REFERENCE_SOURCE.sha256) {
    throw new Error("Official source snapshot hash does not match the admitted manifest.");
  }

  const versionDirectory = join(sourcesRoot, actualHash);
  const destination = join(
    /* turbopackIgnore: true */ versionDirectory,
    DGFT_REFERENCE_SOURCE.bundledFileName,
  );
  await mkdir(versionDirectory, { recursive: true });
  if (!existsSync(/* turbopackIgnore: true */ destination)) {
    await copyFile(bundledPath, /* turbopackIgnore: true */ destination);
  }
  const storedHash = createHash("sha256")
    .update(await readFile(/* turbopackIgnore: true */ destination))
    .digest("hex");
  if (storedHash !== actualHash) throw new Error("Stored official source snapshot failed verification.");

  store.admitReferenceSource({ snapshotRelativePath: relative(sourcesRoot, destination) });
  return store.getReferenceEvidence(sourcesRoot);
}
