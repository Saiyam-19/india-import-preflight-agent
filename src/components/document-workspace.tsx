"use client";

import { useState, type FormEvent } from "react";

import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPES,
  type DocumentType,
} from "@/server/assessment/preparation-workflow";

interface FactProvenance {
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
}

interface DocumentFactVersion {
  createdAt: string;
  id: string;
  provenance: FactProvenance;
  rawValue: string;
  reviewStatus: "confirmed" | "corrected" | "pending";
  value: string;
  version: number;
}

interface DocumentFact {
  current: DocumentFactVersion;
  field: string;
  id: string;
  label: string;
  versions: DocumentFactVersion[];
}

interface CaseDocument {
  bytesRetained: false;
  createdAt: string;
  documentType: DocumentType;
  facts: DocumentFact[];
  fileName: string;
  id: string;
  mediaType: "application/pdf" | "image/jpeg" | "image/png";
  pageCount: number;
  retentionState: "derived_facts_until_case_deletion";
  sizeBytes: number;
}

interface DocumentCase {
  documents: CaseDocument[];
  id: string;
  title: string;
}

interface UploadResult {
  factsFound: number;
  fileName: string;
  message: string;
  status: string;
}

function reviewStatus(version: DocumentFactVersion) {
  if (version.reviewStatus === "pending") return `Pending review · version ${version.version}`;
  if (version.reviewStatus === "corrected") return `Corrected · version ${version.version}`;
  return `Confirmed · version ${version.version}`;
}

function methodLabel(method: FactProvenance["method"]) {
  return method === "embedded_pdf_text" ? "Embedded PDF text" : "Private vision extraction";
}

export function DocumentWorkspace<TCase extends DocumentCase>({
  onDeleteCase,
  onTradeCaseChange,
  showUpload = true,
  tradeCase,
}: {
  onDeleteCase: (tradeCaseId: string) => Promise<void>;
  onTradeCaseChange: (tradeCase: TCase) => void;
  showUpload?: boolean;
  tradeCase: TCase;
}) {
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const [reviewingFactId, setReviewingFactId] = useState<string | null>(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);
  const [deleteCaseArmed, setDeleteCaseArmed] = useState(false);
  const [error, setError] = useState("");

  async function uploadDocuments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const files = data.getAll("documents").filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length === 0) {
      setError("Choose at least one PDF, PNG, or JPEG document.");
      return;
    }
    data.set("tradeCaseId", tradeCase.id);
    setUploading(true);
    setError("");
    setUploadResults([]);
    try {
      const response = await fetch("/api/documents", { method: "POST", body: data });
      const body = (await response.json()) as {
        error?: string;
        results?: UploadResult[];
        tradeCase?: TCase;
      };
      if (!response.ok || !body.results || !body.tradeCase) {
        throw new Error(body.error ?? "The documents could not be inspected safely.");
      }
      setUploadResults(body.results);
      onTradeCaseChange(body.tradeCase);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The documents could not be inspected safely.");
    } finally {
      setUploading(false);
    }
  }

  async function reviewFact(fact: DocumentFact) {
    const value = (edits[fact.id] ?? fact.current.value).trim();
    const changed = value !== fact.current.value;
    setReviewingFactId(fact.id);
    setError("");
    try {
      const response = await fetch("/api/document-facts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tradeCaseId: tradeCase.id,
          factId: fact.id,
          action: changed ? "correct" : "confirm",
          ...(changed ? { value } : {}),
        }),
      });
      const body = (await response.json()) as { error?: string; tradeCase?: TCase };
      if (!response.ok || !body.tradeCase) throw new Error(body.error ?? "The fact review was not saved.");
      onTradeCaseChange(body.tradeCase);
      setEdits((current) => {
        const next = { ...current };
        delete next[fact.id];
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The fact review was not saved.");
    } finally {
      setReviewingFactId(null);
    }
  }

  async function deleteDocument(documentId: string) {
    setError("");
    try {
      const response = await fetch("/api/documents", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tradeCaseId: tradeCase.id, documentId }),
      });
      const body = (await response.json()) as { error?: string; tradeCase?: TCase };
      if (!response.ok || !body.tradeCase) throw new Error(body.error ?? "The document was not deleted.");
      onTradeCaseChange(body.tradeCase);
      setDeletingDocumentId(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The document was not deleted.");
    }
  }

  return (
    <section className="document-workspace" aria-labelledby="document-workspace-heading">
      <header>
        <div>
          <h2 id="document-workspace-heading">Documents and extracted facts</h2>
          <p>Confirm or correct each visible value before the assistant uses it.</p>
        </div>
        <span>Current conversation only</span>
      </header>

      {showUpload ? (
      <form className="document-upload-form" onSubmit={uploadDocuments}>
        <label className="document-type-field" htmlFor={`document-type-${tradeCase.id}`}>
          <span>Checklist document type</span>
          <select id={`document-type-${tradeCase.id}`} name="documentType" required>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type]}</option>
            ))}
          </select>
        </label>
        <label className="file-field" htmlFor={`documents-${tradeCase.id}`}>
          <span>Add case documents</span>
          <input
            accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
            aria-describedby={`document-limits-${tradeCase.id}`}
            id={`documents-${tradeCase.id}`}
            multiple
            name="documents"
            type="file"
          />
        </label>
        <p id={`document-limits-${tradeCase.id}`}>
          Up to 3 files. Each file: 8 MB, 20 PDF pages, or 24 million image pixels. Types are verified from bytes.
        </p>
        <label className="document-consent">
          <input name="documentConsent" required type="checkbox" />
          <span>I am authorised to process these documents and understand the handling notice below.</span>
        </label>
        <div className="document-upload-actions">
          <button className="button-primary" disabled={uploading} type="submit">
            {uploading ? "Inspecting bounded files…" : "Extract visible facts"}
          </button>
          <p>Original bytes are not retained. PDF text is parsed locally; images or scanned PDFs require the configured private model.</p>
        </div>
      </form>
      ) : null}

      {showUpload && uploadResults.length > 0 ? (
        <ul className="document-intake-results" aria-label="Document intake results" aria-live="polite">
          {uploadResults.map((result, index) => (
            <li data-status={result.status} key={`${result.fileName}-${index}`}>
              <strong>{result.fileName}</strong>
              <span>{result.status.replaceAll("_", " ")}</span>
              <p>{result.message}</p>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? <p className="document-error" role="alert">{error}</p> : null}

      <div className="attachment-review" role="region" aria-label="Attachment review">
        <div className="attachment-review-heading">
          <h3>Attachment review</h3>
          <p>{tradeCase.documents.length} saved {tradeCase.documents.length === 1 ? "document" : "documents"}</p>
        </div>
        {tradeCase.documents.length === 0 ? (
          <p className="document-empty">No documents in this conversation. Nothing is borrowed from another conversation.</p>
        ) : (
          tradeCase.documents.map((document) => (
            <article className="document-record" key={document.id}>
              <header>
                <div>
                  <h4>{document.fileName}</h4>
                  <p>{DOCUMENT_TYPE_LABELS[document.documentType]} · {document.mediaType} · {document.pageCount} {document.pageCount === 1 ? "page" : "pages"} · {(document.sizeBytes / 1024).toFixed(1)} KB</p>
                </div>
                {deletingDocumentId === document.id ? (
                  <div className="inline-delete-confirmation">
                    <button className="button-danger" onClick={() => deleteDocument(document.id)} type="button">Confirm document deletion</button>
                    <button className="button-secondary" onClick={() => setDeletingDocumentId(null)} type="button">Keep document</button>
                  </div>
                ) : (
                  <button className="button-text-danger" onClick={() => setDeletingDocumentId(document.id)} type="button">Delete document</button>
                )}
              </header>
              <p className="retention-note">
                Original bytes retained: no. Derived facts remain only until this document or Trade Case is deleted.
              </p>
              <div className="document-fact-list">
                {document.facts.map((fact) => {
                  const currentValue = edits[fact.id] ?? fact.current.value;
                  const changed = currentValue.trim() !== fact.current.value;
                  const reviewed = fact.current.reviewStatus !== "pending";
                  return (
                    <section className="document-fact" key={fact.id}>
                      <div className="document-fact-state">
                        <strong>{fact.label}</strong>
                        <span data-review={fact.current.reviewStatus}>{reviewStatus(fact.current)}</span>
                      </div>
                      <label htmlFor={`fact-${fact.id}`}>Correct {fact.label}</label>
                      <input
                        id={`fact-${fact.id}`}
                        maxLength={500}
                        onChange={(event) => setEdits((current) => ({ ...current, [fact.id]: event.target.value }))}
                        value={currentValue}
                      />
                      <dl className="fact-provenance">
                        <div><dt>Page</dt><dd>{fact.current.provenance.documentPage}</dd></div>
                        <div><dt>Region</dt><dd>{fact.current.provenance.region.x}, {fact.current.provenance.region.y}, {fact.current.provenance.region.width} × {fact.current.provenance.region.height} {fact.current.provenance.region.unit.replaceAll("_", " ")}</dd></div>
                        <div><dt>Method</dt><dd>{methodLabel(fact.current.provenance.method)}</dd></div>
                        <div><dt>Extraction confidence</dt><dd>{Math.round(fact.current.provenance.confidence * 100)}%</dd></div>
                      </dl>
                      <p className="fact-trust-boundary">Confidence describes text extraction only—not truth, authenticity, validity, acceptance, filing, payment, release, or clearance.</p>
                      <div className="fact-review-actions">
                        <button
                          className={changed ? "button-primary" : "button-secondary"}
                          disabled={reviewingFactId === fact.id || (reviewed && !changed)}
                          onClick={() => reviewFact(fact)}
                          type="button"
                        >
                          {reviewingFactId === fact.id
                            ? "Saving review…"
                            : changed
                              ? `Save correction for ${fact.label}`
                              : `Confirm ${fact.label}`}
                        </button>
                        {reviewed && !changed ? <span>Saved to this conversation</span> : null}
                      </div>
                      {fact.versions.length > 1 ? (
                        <details className="fact-version-history">
                          <summary>Version history</summary>
                          <ol>
                            {fact.versions.map((version) => (
                              <li key={version.id}>Version {version.version}: {version.reviewStatus} — {version.value}</li>
                            ))}
                          </ol>
                        </details>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </article>
          ))
        )}
      </div>

      <aside className="document-boundary" aria-label="Document handling boundary">
        <strong>Unavailable verification and review</strong>
        <p>
          Uploads cannot establish authenticity, signatures, seals, QR codes, certificate validity,
          filing, payment, shipment status, release, or clearance. Authority/carrier checks, current
          eSanchit metadata, and final privacy/legal review remain unavailable integrations or gaps.
        </p>
      </aside>

      <div className="case-retention-actions">
        <p>Deleting this conversation removes its messages, documents, derived facts, corrections, and snapshots from local storage.</p>
        {deleteCaseArmed ? (
          <div className="inline-delete-confirmation">
            <button className="button-danger" onClick={() => onDeleteCase(tradeCase.id)} type="button">Confirm deletion of this conversation</button>
            <button className="button-secondary" onClick={() => setDeleteCaseArmed(false)} type="button">Keep Trade Case</button>
          </div>
        ) : (
          <button className="button-text-danger" onClick={() => setDeleteCaseArmed(true)} type="button">Delete this conversation</button>
        )}
      </div>
    </section>
  );
}
