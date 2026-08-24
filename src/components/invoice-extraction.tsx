import type { ChangeEvent } from "react";

import type { ExtractionFact, ExtractionResult } from "@/extraction";

interface InvoiceExtractionProps {
  supported: boolean;
  extracting: boolean;
  extraction: ExtractionResult | null;
  facts: ExtractionFact[];
  confirmedFactIds: ReadonlySet<string>;
  error: string | null;
  applied: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onFactChange: (factId: string, value: string) => void;
  onConfirmationChange: (factId: string, confirmed: boolean) => void;
  onApply: () => void;
  onDiscard: () => void;
}

export function InvoiceExtraction({
  supported,
  extracting,
  extraction,
  facts,
  confirmedFactIds,
  error,
  applied,
  onUpload,
  onFactChange,
  onConfirmationChange,
  onApply,
  onDiscard,
}: InvoiceExtractionProps) {
  if (!supported) {
    return (
      <section className="extraction-panel extraction-panel-unavailable" aria-labelledby="invoice-extraction-title">
        <div>
          <p>Optional document assist</p>
          <h3 id="invoice-extraction-title">Invoice extraction</h3>
        </div>
        <p>
          PDF extraction is verified only for the synthetic router invoice. Enter this product’s
          facts manually; no extraction coverage is claimed here.
        </p>
      </section>
    );
  }

  const allConfirmed =
    facts.length > 0 && facts.every((fact) => confirmedFactIds.has(fact.id));

  return (
    <section className="extraction-panel" aria-labelledby="invoice-extraction-title">
      <div className="extraction-heading">
        <div>
          <p>Optional document assist</p>
          <h3 id="invoice-extraction-title">Synthetic router invoice</h3>
        </div>
        <span>One PDF · No saved data</span>
      </div>
      <p className="extraction-boundary">
        Accepts only the verified one-page synthetic router pro-forma invoice. Images,
        certificates, additional PDFs, and other products are outside this extraction scope.
      </p>
      <label className="file-field">
        <span>Synthetic router pro-forma invoice PDF</span>
        <input
          type="file"
          accept=".pdf,application/pdf"
          disabled={extracting}
          onChange={onUpload}
        />
        <small>PDF bytes are processed in memory and are not logged or retained.</small>
      </label>

      {extracting ? <p className="extraction-status" role="status">Extracting visible facts…</p> : null}
      {error ? <div className="form-error" role="alert">{error}</div> : null}

      {extraction ? (
        <div className="extraction-review" role="region" aria-label="Extracted invoice facts">
          <div className="extraction-review-heading">
            <div>
              <p>Confirmation gate</p>
              <h3 tabIndex={-1} id="extraction-review-title">
                Review {facts.length} extracted facts
              </h3>
            </div>
            <span>
              {extraction.extractionMode === "recorded_fixture"
                ? "Recorded fixture"
                : "Live Agents SDK"}
            </span>
          </div>
          <p className="extraction-explainer">
            The agent extracted and normalized visible text only. It did not choose scope,
            evidence status, legal applicability, an outcome, or any arithmetic. Edit each value,
            then confirm every fact before any mapped value can enter the assessment.
          </p>

          <div className="extracted-facts">
            {facts.map((fact, index) => (
              <div className="extracted-fact" key={fact.id}>
                <span className="evidence-number">{String(index + 1).padStart(2, "0")}</span>
                <div className="fact-content">
                  <div className="fact-meta">
                    <strong>{fact.label}</strong>
                    <span>{Math.round(fact.confidence * 100)}% confidence</span>
                  </div>
                  <label htmlFor={`extracted-${fact.id}`}>Edit {fact.label}</label>
                  <input
                    id={`extracted-${fact.id}`}
                    aria-label={`Edit ${fact.label}`}
                    value={fact.value}
                    onChange={(event) => onFactChange(fact.id, event.currentTarget.value)}
                  />
                  {fact.rawValue !== fact.value ? <small>Printed value: {fact.rawValue}</small> : null}
                  <small>Page {fact.provenance.page} · {fact.provenance.locator}</small>
                  <label className="fact-confirmation">
                    <input
                      type="checkbox"
                      aria-label={`Confirm ${fact.label}`}
                      checked={confirmedFactIds.has(fact.id)}
                      onChange={(event) => onConfirmationChange(fact.id, event.currentTarget.checked)}
                    />
                    <span>I checked this value against the PDF.</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          {extraction.materialQuestions.length > 0 ? (
            <div className="material-questions">
              <strong>Questions the invoice cannot answer</strong>
              <ul>
                {extraction.materialQuestions.map((question) => (
                  <li key={question.id}>{question.question}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="extraction-actions">
            <button
              type="button"
              className="button-primary"
              disabled={!allConfirmed || applied}
              onClick={onApply}
            >
              {applied ? "Confirmed facts in assessment" : `Use ${facts.length} confirmed facts`}
            </button>
            <button type="button" className="button-secondary" onClick={onDiscard}>
              Discard extracted facts
            </button>
          </div>
          {applied ? (
            <p className="extraction-applied" role="status">
              Confirmed mapped values are now in the form. Scope, evidence, and dated checks still
              require your decisions.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
