"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";

import {
  ExtractionResultSchema,
  confirmedExtractionFormValues,
  type ExtractionFact,
  type ExtractionResult,
} from "@/extraction";
import type {
  AssessmentRequest,
  JourneyProduct,
  OtherProductAssessmentRequest,
  OtherProductReport,
  PreflightReport,
  PreflightResult,
  ReportFinding,
} from "@/preflight";
import { OTHER_PRODUCT_ID } from "@/preflight";

import { InvoiceExtraction } from "./invoice-extraction";

interface JourneyProps {
  products: JourneyProduct[];
  assessmentDate: string;
  access: "public" | "promotion_harness";
}

function value(form: FormData, name: string): string {
  return String(form.get(name) ?? "").trim();
}

function buildScenario(product: JourneyProduct, form: FormData) {
  const confirmation = value(form, "scopeConfirmation");
  const scenario: Record<string, unknown> = structuredClone(product.includedFacts);

  if (confirmation === "unknown") return scenario;
  scenario.modelIdentity = value(form, "modelIdentity");
  scenario.manufacturerIdentity = value(form, "manufacturerIdentity");

  if (
    product.displayName === "Wi-Fi router" ||
    product.displayName === "Indoor IP camera"
  ) {
    scenario.adapterModelIdentity = value(form, "adapterModelIdentity");
    if (confirmation === "outside_scope") {
      if (product.displayName === "Wi-Fi router") scenario.hasSixGhzRadio = true;
      else scenario.hasBattery = true;
    }
  } else {
    scenario.batteryManufacturerIdentity = value(form, "batteryManufacturerIdentity");
    scenario.batteryModelIdentity = value(form, "batteryModelIdentity");
    const capacity = value(form, "batteryCapacityMah");
    scenario.batteryCapacityMah = capacity === "" ? "" : Number(capacity);
    if (confirmation === "outside_scope") scenario.isTrueWirelessStereo = true;
  }

  return scenario;
}

function makeRequest(
  product: JourneyProduct,
  assessmentDate: string,
  form: FormData,
): AssessmentRequest {
  const tradeRemedyCheck = value(form, "tradeRemedyCheck") as AssessmentRequest["tradeRemedyCheck"];
  const evidence: AssessmentRequest["evidence"] = {};
  for (const rule of product.rules) {
    evidence[rule.id] = rule.derivedFromTradeRemedy
      ? tradeRemedyCheck === "confirmed_no_match"
        ? "present"
        : "unknown"
      : (value(form, `evidence.${rule.id}`) as AssessmentRequest["evidence"][string]);
  }

  const origin = value(form, "originCountryCode").toUpperCase();
  const nullable = (name: string) => value(form, name) || null;
  return {
    productPackId: product.id,
    assessmentDate,
    scenario: buildScenario(product, form),
    parties: {
      originCountryCode: origin || null,
      importerIdentity: nullable("importerIdentity"),
      producerIdentity: nullable("producerIdentity"),
      exporterIdentity: nullable("exporterIdentity"),
    },
    tradeRemedyCheck,
    evidence,
    costInputs: {
      itemValueInr: value(form, "itemValueInr"),
      freightInr: value(form, "freightInr"),
      insuranceInr: value(form, "insuranceInr"),
    },
  };
}

function makeOtherProductRequest(
  assessmentDate: string,
  form: FormData,
): OtherProductAssessmentRequest {
  const nullable = (name: string) => value(form, name) || null;
  const origin = value(form, "originCountryCode").toUpperCase();
  return {
    productPackId: OTHER_PRODUCT_ID,
    assessmentDate,
    product: {
      description: nullable("productDescription"),
      modelIdentity: nullable("modelIdentity"),
      manufacturerIdentity: nullable("manufacturerIdentity"),
      supplierIdentity: nullable("supplierIdentity"),
    },
    shipment: {
      originCountryCode: origin || null,
      importerIdentity: nullable("importerIdentity"),
      producerIdentity: nullable("producerIdentity"),
      exporterIdentity: nullable("exporterIdentity"),
      quantity: nullable("quantity"),
      incoterm: nullable("incoterm"),
      destination: nullable("destination"),
    },
    commercialFacts: {
      itemValueInr: nullable("itemValueInr"),
      freightInr: nullable("freightInr"),
      insuranceInr: nullable("insuranceInr"),
    },
  };
}

function StatusMark({ outcome }: { outcome: PreflightReport["outcome"] }) {
  if (outcome === "ready") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }
  if (outcome === "blocked") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 6l12 12M18 6 6 18" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8v5m0 4v.01M4.9 19h14.2L12 5 4.9 19Z" />
    </svg>
  );
}

function Finding({ finding, defaultOpen }: { finding: ReportFinding; defaultOpen: boolean }) {
  const kindLabel = {
    satisfied: "Evidence confirmed",
    clearance_blocker: "Customs-clearance blocker",
    verification_gap: "Verification gap",
    warning: "Warning outside the Customs-release conclusion",
  }[finding.kind];

  return (
    <details className={`finding finding-${finding.kind}`} open={defaultOpen}>
      <summary className="finding-heading">
        <div>
          <p className="finding-kind">{kindLabel}</p>
          <h4>{finding.title}</h4>
        </div>
        <span className="evidence-state">{finding.status}</span>
      </summary>
      <div className="finding-body">
        <p>{finding.explanation}</p>
        <dl className="finding-ledger">
          <div>
            <dt>Source checked</dt>
            <dd>
              <a href={finding.source.url} target="_blank" rel="noreferrer">
                {finding.source.title}
              </a>
              <span>{finding.source.authority}</span>
            </dd>
          </div>
          <div>
            <dt>Pinpoint</dt>
            <dd>{finding.source.pinpoint}</dd>
          </div>
          <div>
            <dt>Review window</dt>
            <dd>
              Source checked {finding.source.lastChecked}; review again by {finding.source.reviewAfter}
            </dd>
          </div>
          <div>
            <dt>Required evidence</dt>
            <dd>{finding.requiredEvidence.join("; ")}</dd>
          </div>
          <div>
            <dt>Missing evidence</dt>
            <dd>{finding.missingEvidence.length > 0 ? finding.missingEvidence.join("; ") : "None"}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{finding.action.owner}</dd>
          </div>
        </dl>
        {finding.kind !== "satisfied" ? (
          <div className="finding-action">
            <p>
              <span>Action {finding.action.order}</span>
              {finding.action.instruction}
            </p>
            <a href={finding.action.destination.url} target="_blank" rel="noreferrer">
              {finding.action.destination.label}
            </a>
            <small>{finding.action.rerunCondition}</small>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function formatInr(amount: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

function ResultView({ report, onEdit }: { report: PreflightReport; onEdit: () => void }) {
  const total = report.cost.status === "available"
    ? report.cost.lines.find((line) => line.id === "total_import_duties")
    : undefined;
  const costLabels: Record<string, string> = {
    assessable_value: "Assessable value",
    basic_customs_duty: "Basic Customs Duty",
    agriculture_infrastructure_development_cess: "AIDC",
    social_welfare_surcharge: "Social Welfare Surcharge",
    igst: "IGST",
    gst_compensation_cess: "GST Compensation Cess",
    total_import_duties: "Total import duties",
  };

  return (
    <section className={`result result-${report.outcome}`} aria-labelledby="result-title">
      <div className="result-status">
        <span className="status-mark"><StatusMark outcome={report.outcome} /></span>
        <div>
          <p>Preflight outcome</p>
          <h2 id="result-title" tabIndex={-1}>{report.outcomeLabel}</h2>
        </div>
      </div>
      <p className="result-summary">{report.summary}</p>

      <div className="mapping-strip">
        <div>
          <span>HS code</span>
          <strong>{report.mapping.hsCode}</strong>
        </div>
        <div>
          <span>Applicability</span>
          <strong>{report.mapping.matched ? "Exact scope matched" : "Not established"}</strong>
        </div>
        <div>
          <span>Customs release</span>
          <strong>{report.customsClearanceBlocked ? "Blocked by checked rule" : "No checked blocker"}</strong>
        </div>
      </div>
      <p className="mapping-rationale">{report.mapping.rationale}</p>

      <section className="report-section" aria-labelledby="cost-title">
        <div className="section-heading">
          <p>Auditable estimate</p>
          <h3 id="cost-title">Customs value and duties</h3>
        </div>
        {report.cost.status === "withheld" ? (
          <div className="withheld">
            <strong>Numeric cost withheld</strong>
            <p>{report.cost.blocker}</p>
          </div>
        ) : (
          <>
            <div className="cost-total">
              <span>Estimated total import duties</span>
              <strong>{formatInr(total!.amountInr)}</strong>
            </div>
            <p className="formula">Assessable value formula: {report.cost.formula}</p>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th scope="col">Line</th><th scope="col">Amount</th></tr>
                </thead>
                <tbody>
                  {report.cost.lines.map((line) => (
                    <tr key={line.id}>
                      <th scope="row">{costLabels[line.id]}</th>
                      <td>{formatInr(line.amountInr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <details>
              <summary>Assumptions and exclusions</summary>
              <ul>
                {[...report.cost.assumptions, ...report.cost.exclusions].map((item) => <li key={item}>{item}</li>)}
              </ul>
            </details>
          </>
        )}
      </section>

      <section className="report-section" aria-labelledby="findings-title">
        <div className="section-heading">
          <p>Evidence ledger</p>
          <h3 id="findings-title">Why this result</h3>
        </div>
        <div className="findings-list">
          {report.findings.map((finding, index) => (
            <Finding
              finding={finding}
              defaultOpen={index === 0 || finding.kind !== "satisfied"}
              key={finding.ruleId}
            />
          ))}
        </div>
      </section>

      {report.actions.length > 0 ? (
        <section className="report-section" aria-labelledby="actions-title">
          <div className="section-heading">
            <p>Ordered remediation</p>
            <h3 id="actions-title">What to do next</h3>
          </div>
          <ol className="action-list">
            {report.actions.map((action) => (
              <li key={action.id}>
                <span>{action.order}</span>
                <div>
                  <strong>{action.owner}</strong>
                  <p>{action.instruction}</p>
                  <a href={action.destination.url} target="_blank" rel="noreferrer">
                    {action.destination.label}
                  </a>
                  <small>{action.rerunCondition}</small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="rerun-panel">
        <p>{report.rerunNotice}</p>
        <button type="button" className="button-secondary" onClick={onEdit}>
          Update facts and rerun
        </button>
      </div>
    </section>
  );
}

function OtherProductResultView({ report, onEdit }: { report: OtherProductReport; onEdit: () => void }) {
  return (
    <section className={`result result-${report.outcome}`} aria-labelledby="result-title">
      <div className="result-status">
        <span className="status-mark"><StatusMark outcome={report.outcome} /></span>
        <div>
          <p>Preflight outcome</p>
          <h2 id="result-title" tabIndex={-1}>{report.outcomeLabel}</h2>
        </div>
      </div>
      <p className="result-summary">{report.summary}</p>

      <div className="mapping-strip">
        <div>
          <span>Product coverage</span>
          <strong>Outside supported catalog</strong>
        </div>
        <div>
          <span>Classification</span>
          <strong>Withheld</strong>
        </div>
        <div>
          <span>Customs release</span>
          <strong>{report.customsClearanceBlocked ? "Blocked by admitted universal rule" : "No admitted universal blocker"}</strong>
        </div>
      </div>
      <p className="mapping-rationale">
        <strong>Classification withheld</strong> — {report.classification.reason}
      </p>

      <section className="report-section" aria-labelledby="coverage-title">
        <div className="section-heading">
          <p>Honest coverage boundary</p>
          <h3 id="coverage-title">What was and was not checked</h3>
        </div>
        <div className="coverage-ledger">
          <section>
            <h4>Supported checks</h4>
            <ul>{report.coverage.supportedChecks.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Unsupported checks</h4>
            <ul>{report.coverage.unsupportedChecks.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Unresolved facts</h4>
            <ul>{report.coverage.unresolvedFacts.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Professional review needed</h4>
            <p>{report.coverage.professionalReviewNeeded}</p>
          </section>
        </div>
      </section>

      <section className="report-section" aria-labelledby="cost-title">
        <div className="section-heading">
          <p>Product-specific estimate</p>
          <h3 id="cost-title">Customs value and duties</h3>
        </div>
        <div className="withheld">
          <strong>Numeric cost withheld</strong>
          <p>{report.cost.blocker}</p>
        </div>
      </section>

      <section className="report-section broker-summary" aria-labelledby="broker-summary-title">
        <div className="section-heading">
          <p>On-screen professional handoff</p>
          <h3 id="broker-summary-title">Customs Broker summary</h3>
        </div>
        <p>{report.brokerSummary.overview}</p>
        <dl className="finding-ledger broker-facts">
          {report.brokerSummary.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
        <div className="broker-review">
          <strong>Review request</strong>
          <p>{report.brokerSummary.reviewRequest}</p>
        </div>
      </section>

      <div className="rerun-panel">
        <p>{report.rerunNotice}</p>
        <button type="button" className="button-secondary" onClick={onEdit}>
          Update facts and rerun
        </button>
      </div>
    </section>
  );
}

export function Journey({ products, assessmentDate, access }: JourneyProps) {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? OTHER_PRODUCT_ID);
  const [report, setReport] = useState<PreflightResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [extractedFacts, setExtractedFacts] = useState<ExtractionFact[]>([]);
  const [confirmedFactIds, setConfirmedFactIds] = useState<Set<string>>(new Set());
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionApplied, setExtractionApplied] = useState(false);
  const assessmentHeading = useRef<HTMLHeadingElement>(null);
  const assessmentForm = useRef<HTMLFormElement>(null);
  const selected = useMemo(
    () => products.find((product) => product.id === selectedId),
    [products, selectedId],
  );
  const isOtherProduct = selectedId === OTHER_PRODUCT_ID;

  useEffect(() => {
    if (report) document.getElementById("result-title")?.focus();
  }, [report]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOtherProduct && !selected) return;
    if (!isOtherProduct && extraction && !extractionApplied) {
      setError("Confirm and use every extracted fact, or discard the extraction, before running the preflight.");
      requestAnimationFrame(() => document.getElementById("extraction-review-title")?.focus());
      return;
    }
    setSubmitting(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const request = isOtherProduct
      ? makeOtherProductRequest(assessmentDate, form)
      : makeRequest(selected!, assessmentDate, form);
    try {
      const response = await fetch("/api/preflight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(access === "promotion_harness"
            ? { "x-bwmi-promotion-harness": "restricted" }
            : {}),
        },
        body: JSON.stringify(request),
      });
      const body = (await response.json()) as PreflightResult | { error: string };
      if (!response.ok || !("outcome" in body)) {
        throw new Error("error" in body ? body.error : "The preflight could not be completed.");
      }
      setReport(body);
    } catch (reason) {
      setReport(null);
      setError(reason instanceof Error ? reason.message : "The preflight could not be completed.");
    } finally {
      setSubmitting(false);
    }
  }

  function clearExtraction() {
    setExtraction(null);
    setExtractedFacts([]);
    setConfirmedFactIds(new Set());
    setExtractionError(null);
    setExtractionApplied(false);
  }

  async function uploadInvoice(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = input.files ? [...input.files] : [];
    setExtractionError(null);
    setError(null);
    setExtractionApplied(false);
    if (files.length !== 1) {
      setExtractionError("Choose exactly one synthetic router pro-forma-invoice PDF.");
      return;
    }

    setExtracting(true);
    const body = new FormData();
    body.append("document", files[0]!);
    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        body,
        cache: "no-store",
      });
      const candidate = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof candidate === "object" && candidate !== null && "error" in candidate
            ? String(candidate.error)
            : "The invoice could not be extracted.",
        );
      }
      const result = ExtractionResultSchema.parse(candidate);
      setExtraction(result);
      setExtractedFacts(structuredClone(result.facts));
      setConfirmedFactIds(new Set());
      requestAnimationFrame(() => document.getElementById("extraction-review-title")?.focus());
    } catch (reason) {
      setExtraction(null);
      setExtractedFacts([]);
      setConfirmedFactIds(new Set());
      setExtractionError(
        reason instanceof Error ? reason.message : "The invoice could not be extracted.",
      );
    } finally {
      input.value = "";
      setExtracting(false);
    }
  }

  function changeExtractedFact(factId: string, nextValue: string) {
    setExtractedFacts((facts) =>
      facts.map((fact) => (fact.id === factId ? { ...fact, value: nextValue } : fact)),
    );
    setConfirmedFactIds((current) => {
      const next = new Set(current);
      next.delete(factId);
      return next;
    });
    setExtractionApplied(false);
    setError(null);
  }

  function changeFactConfirmation(factId: string, confirmed: boolean) {
    setConfirmedFactIds((current) => {
      const next = new Set(current);
      if (confirmed) next.add(factId);
      else next.delete(factId);
      return next;
    });
    setExtractionApplied(false);
    setError(null);
  }

  function applyExtractedFacts() {
    const { complete, formValues } = confirmedExtractionFormValues(
      extractedFacts,
      confirmedFactIds,
    );
    if (!complete || !assessmentForm.current) return;

    for (const [name, nextValue] of Object.entries(formValues)) {
      const control = assessmentForm.current.elements.namedItem(name);
      if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) {
        control.value = nextValue;
      }
    }
    setExtractionApplied(true);
    setError(null);
  }

  function editFacts() {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    assessmentHeading.current?.focus();
    assessmentHeading.current?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <>
      <a className="skip-link" href="#assessment">Skip to assessment</a>
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="India Import Preflight home">
          <span aria-hidden="true">IP</span>
          India Import Preflight
        </Link>
        <span className="public-label">Public tool · No login · No saved data</span>
      </header>

      <main>
        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Connected electronics · India · Evidence checked {assessmentDate}</p>
          <h1 id="page-title">Know what is ready, blocked, or still unproven.</h1>
          <p className="intro-copy">
            Check one exact shipment against admitted product scope, official primary sources,
            readiness gates, and an auditable customs-value estimate. Uncertainty stops the result.
          </p>
          <ul className="trust-row" aria-label="Service promises">
            <li><span aria-hidden="true">01</span> Exact product boundary</li>
            <li><span aria-hidden="true">02</span> Official-source pinpoints</li>
            <li><span aria-hidden="true">03</span> Decimal-safe cost</li>
          </ul>
        </section>

        {access === "promotion_harness" ? (
          <aside className="harness-banner">
            <strong>Restricted promotion harness</strong>
            <p>Source-admitted packs are visible only in this test-only route. They remain unavailable to the public selector.</p>
          </aside>
        ) : null}

        <div className="workbench">
            <section className="assessment-pane" aria-labelledby="assessment">
              <div className="section-heading major-heading">
                <p>One shared journey</p>
                <h2 id="assessment" ref={assessmentHeading} tabIndex={-1}>Describe the exact shipment</h2>
                <span>Fields may be left blank when unknown. The result will fail closed.</span>
              </div>

              <form ref={assessmentForm} onSubmit={submit} key={selectedId} noValidate>
                <fieldset className="product-chooser">
                  <legend>Product coverage</legend>
                  <div className="product-options">
                    {products.map((product) => (
                      <label key={product.id} className={selectedId === product.id ? "product-option selected" : "product-option"}>
                        <input
                          type="radio"
                          name="productPackId"
                          value={product.id}
                          checked={selectedId === product.id}
                          onChange={() => {
                            setSelectedId(product.id);
                            setReport(null);
                            setError(null);
                            clearExtraction();
                          }}
                        />
                        <span>
                          <strong>{product.displayName}</strong>
                          <small>HS {product.hsCode} · {product.lifecycleStatus}</small>
                        </span>
                      </label>
                    ))}
                    <label className={isOtherProduct ? "product-option selected" : "product-option"}>
                      <input
                        type="radio"
                        name="productPackId"
                        value={OTHER_PRODUCT_ID}
                        checked={isOtherProduct}
                        onChange={() => {
                          setSelectedId(OTHER_PRODUCT_ID);
                          setReport(null);
                          setError(null);
                          clearExtraction();
                        }}
                      />
                      <span>
                        <strong>Other product</strong>
                        <small>Outside the supported catalog · fail closed</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <div className="scope-band">
                  <div>
                    <p>Checked product scope</p>
                    <strong>{isOtherProduct ? "Universal facts only — no admitted product pack" : selected!.scopeName}</strong>
                  </div>
                  {isOtherProduct ? (
                    <p className="scope-note">Universal shipment and commercial facts will be retained for professional review. Classification, product rules, documents, rates, and cost remain unsupported.</p>
                  ) : (
                    <details>
                      <summary>Read the exact boundary and exclusions</summary>
                      <p><strong>Included profile:</strong> {selected!.title}</p>
                      <ul>{selected!.excludedVariants.map((variant) => <li key={variant}>{variant}</li>)}</ul>
                    </details>
                  )}
                </div>

                {selected ? (
                  <InvoiceExtraction
                    supported={selected.displayName === "Wi-Fi router"}
                    extracting={extracting}
                    extraction={extraction}
                    facts={extractedFacts}
                    confirmedFactIds={confirmedFactIds}
                    error={extractionError}
                    applied={extractionApplied}
                    onUpload={uploadInvoice}
                    onFactChange={changeExtractedFact}
                    onConfirmationChange={changeFactConfirmation}
                    onApply={applyExtractedFacts}
                    onDiscard={clearExtraction}
                  />
                ) : null}

                <div className="field-grid">
                  {isOtherProduct ? (
                    <label className="field field-wide">
                      <span>Product description</span>
                      <input name="productDescription" autoComplete="off" />
                      <small>Describe the product in the importer’s own words; this does not create a classification.</small>
                    </label>
                  ) : (
                    <label className="field field-wide">
                      <span>Product scope</span>
                      <select name="scopeConfirmation" defaultValue="unknown">
                        <option value="unknown">Not sure or facts incomplete</option>
                        <option value="matches_exact_scope">This exact scope matches</option>
                        <option value="outside_scope">A listed fact or variant differs</option>
                      </select>
                      <small>Only an exact match can use this pack’s HS mapping and rates.</small>
                    </label>
                  )}
                  <label className="field">
                    <span>Exact model</span>
                    <input name="modelIdentity" autoComplete="off" />
                  </label>
                  <label className="field">
                    <span>Manufacturer</span>
                    <input name="manufacturerIdentity" autoComplete="organization" />
                  </label>
                  {isOtherProduct ? (
                    <label className="field">
                      <span>Overseas supplier</span>
                      <input name="supplierIdentity" autoComplete="organization" />
                    </label>
                  ) : selected!.displayName === "Wi-Fi router" || selected!.displayName === "Indoor IP camera" ? (
                    <label className="field">
                      <span>Adapter model</span>
                      <input name="adapterModelIdentity" autoComplete="off" />
                    </label>
                  ) : (
                    <>
                      <label className="field"><span>Battery manufacturer</span><input name="batteryManufacturerIdentity" /></label>
                      <label className="field"><span>Battery model</span><input name="batteryModelIdentity" /></label>
                      <label className="field"><span>Battery capacity (mAh)</span><input name="batteryCapacityMah" inputMode="numeric" /></label>
                    </>
                  )}
                </div>

                <fieldset className="form-section">
                  <legend>{isOtherProduct ? "Universal shipment facts" : "Shipment and dated parties"}</legend>
                  <p>{isOtherProduct ? "These facts are preserved for a Customs Broker without inferring product-specific obligations." : "Exact parties are required for the dated trade-remedy gate."}</p>
                  <div className="field-grid">
                    <label className="field"><span>Country of origin</span><input name="originCountryCode" maxLength={2} placeholder="Two-letter code" autoCapitalize="characters" /></label>
                    <label className="field"><span>Indian importer</span><input name="importerIdentity" autoComplete="organization" /></label>
                    <label className="field"><span>Producer</span><input name="producerIdentity" /></label>
                    <label className="field"><span>Exporter</span><input name="exporterIdentity" /></label>
                    {isOtherProduct ? (
                      <>
                        <label className="field"><span>Shipment quantity</span><input name="quantity" /></label>
                        <label className="field"><span>Incoterm</span><input name="incoterm" autoCapitalize="characters" /></label>
                        <label className="field field-wide"><span>Destination</span><input name="destination" /></label>
                      </>
                    ) : (
                      <label className="field field-wide">
                        <span>Dated trade-remedy check</span>
                        <select name="tradeRemedyCheck" defaultValue="unknown">
                          <option value="unknown">Not completed or result unknown</option>
                          <option value="confirmed_no_match">Confirmed no match for exact product and parties</option>
                          <option value="possible_match">Possible match requires specialist review</option>
                        </select>
                      </label>
                    )}
                  </div>
                </fieldset>

                {selected ? (
                  <fieldset className="form-section evidence-section">
                    <legend>Evidence gates</legend>
                    <p>“Missing” creates Blocked only where an admitted official pinpoint conditions Customs clearance. Other gaps require verification.</p>
                    <div className="evidence-list">
                      {selected.rules.filter((rule) => !rule.derivedFromTradeRemedy).map((rule, index) => (
                        <div className="evidence-row" key={rule.id}>
                          <span className="evidence-number">{String(index + 1).padStart(2, "0")}</span>
                          <label htmlFor={`evidence-${rule.id}`}>
                            <span>{rule.title}</span>
                            <small id={`evidence-help-${rule.id}`}>{rule.requiredEvidence[0]}</small>
                          </label>
                          <select
                            id={`evidence-${rule.id}`}
                            name={`evidence.${rule.id}`}
                            defaultValue="unknown"
                            aria-describedby={`evidence-help-${rule.id}`}
                            data-evidence-rule
                            data-rule-id={rule.id}
                          >
                            <option value="unknown">Not sure</option>
                            <option value="present">Present and exact</option>
                            <option value="absent">Missing or mismatched</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                <fieldset className="form-section">
                  <legend>Customs value inputs</legend>
                  <p>{isOtherProduct ? "Values are retained exactly as entered for professional review. No numeric estimate is calculated for an unsupported product." : "Enter INR amounts with no more than two decimal places. The estimate excludes domestic and professional costs."}</p>
                  <div className="field-grid money-grid">
                    <label className="field"><span>Item value (INR)</span><input name="itemValueInr" inputMode="decimal" /></label>
                    <label className="field"><span>Freight (INR)</span><input name="freightInr" inputMode="decimal" /></label>
                    <label className="field"><span>Insurance (INR)</span><input name="insuranceInr" inputMode="decimal" /></label>
                  </div>
                </fieldset>

                {error ? <div className="form-error" role="alert">{error}</div> : null}
                <div className="submit-row">
                  <button type="submit" className="button-primary" disabled={submitting}>
                    {submitting ? "Checking evidence…" : "Run preflight"}
                  </button>
                  <p>No login. Nothing is stored. This is scoped decision support, not legal advice.</p>
                </div>
              </form>
            </section>

            <aside className="result-pane">
              <div role="region" aria-label="Preflight result">
                {report ? (
                  "reportKind" in report ? (
                    <OtherProductResultView report={report} onEdit={editFacts} />
                  ) : (
                    <ResultView report={report} onEdit={editFacts} />
                  )
                ) : (
                  <div className="result-empty">
                    <span className="empty-mark" aria-hidden="true">?</span>
                    <p>Result withheld until you run the complete preflight.</p>
                    <h2>What the report will show</h2>
                    <ul>
                      <li>One exact outcome with its decision boundary</li>
                      <li>{isOtherProduct ? "Supported and unsupported checks with every unresolved fact" : "HS mapping and decimal-safe cost or a named blocker"}</li>
                      <li>Evidence, official source pinpoints, owners, and ordered actions</li>
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
      </main>

      <footer>
        <p>Checked scope: three exact new retail connected-electronics scenarios. Other product retains universal facts for professional review but does not add catalog coverage. Document extraction is verified only for one synthetic router pro-forma-invoice PDF; images, certificates, multiple documents, and accounts are not included.</p>
      </footer>
    </>
  );
}
