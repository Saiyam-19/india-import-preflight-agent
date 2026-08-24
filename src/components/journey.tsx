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
    shipment: {
      quantity: nullable("quantity"),
      incoterm: nullable("incoterm"),
      destination: nullable("destination"),
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

const PREPARATION_LABELS: Record<PreflightReport["outcome"], string> = {
  ready: "Your documents look complete",
  blocked: "Fix these issues before importing",
  needs_verification: "We need a few more details",
};

interface PlainRuleCopy {
  title: string;
  explanation: string;
  nextStep: string;
}

const PLAIN_RULE_COPY: Record<string, PlainRuleCopy> = {
  mapping_applicability: {
    title: "Confirm the exact product details",
    explanation: "We need the exact model and manufacturer before we can confirm the product code or final document list.",
    nextStep: "Open “Add known product details” and enter the product model, manufacturer, and accessory model shown on the product or invoice.",
  },
  shipment_parties: {
    title: "Add the companies involved in this shipment",
    explanation: "The importer, manufacturer or producer, and exporter are needed to check whether any special import duty applies.",
    nextStep: "Enter the legal names from the invoice, purchase order, or supplier documents.",
  },
  trade_remedy_gate: {
    title: "Check whether any extra import duty applies",
    explanation: "Some products or suppliers can attract anti-dumping or safeguard duty in addition to normal Customs duty.",
    nextStep: "Ask a Customs Broker to check the exact product, country, manufacturer, and exporter against current Indian trade-remedy records.",
  },
  assessment_date: {
    title: "Refresh the plan for today’s rules",
    explanation: "Import rules and duty rates can change, so this check must use the current date.",
    nextStep: "Rebuild the plan using today’s assessment date.",
  },
  product_pack_identity: {
    title: "Choose the correct product type",
    explanation: "The selected product type does not match the product details entered.",
    nextStep: "Return to the product choices and select the closest matching product.",
  },
  wpc_eta: {
    title: "Get wireless approval for this exact router model",
    explanation: "Wi-Fi equipment needs approval for its radio bands and power limits before it can follow the checked import route.",
    nextStep: "Ask the manufacturer or its Indian representative for the exact-model wireless approval certificate, radio test report, and import undertaking.",
  },
  headphones_wpc_eta: {
    title: "Get wireless approval for this exact headphone model",
    explanation: "Bluetooth equipment needs approval for its radio band before it can follow the checked import route.",
    nextStep: "Ask the manufacturer or its Indian representative for the exact-model wireless approval certificate, radio test report, and import undertaking.",
  },
  camera_wpc_eta: {
    title: "Get wireless approval for this exact camera model",
    explanation: "A Wi-Fi camera needs approval for its radio bands before it can follow the checked import route.",
    nextStep: "Ask the manufacturer or its Indian representative for the exact-model wireless approval certificate, radio test report, and import undertaking.",
  },
  bis_power_adapter: {
    title: "Get Bureau of Indian Standards registration for the power adapter",
    explanation: "The power adapter supplied in the box is checked separately from the router.",
    nextStep: "Ask the adapter manufacturer or supplier for a valid Bureau of Indian Standards registration matching the exact adapter model and factory.",
  },
  camera_adapter_bis_crs: {
    title: "Get Bureau of Indian Standards registration for the camera’s power adapter",
    explanation: "The power adapter supplied with the camera needs its own matching Bureau of Indian Standards registration.",
    nextStep: "Ask the adapter manufacturer or supplier for a valid Bureau of Indian Standards registration matching the exact adapter model and factory.",
  },
  headphones_bis_crs: {
    title: "Get Bureau of Indian Standards registration for the headphones",
    explanation: "Wireless headphones sold in India need a matching product-safety registration.",
    nextStep: "Ask the manufacturer for a valid Bureau of Indian Standards registration and test report covering the exact headphone model and factory.",
  },
  headphones_battery_bis_crs: {
    title: "Get Bureau of Indian Standards registration for the built-in battery",
    explanation: "The rechargeable battery is checked separately from the headphones.",
    nextStep: "Ask the manufacturer for the battery model, its Bureau of Indian Standards registration, and proof that the same battery is used in these headphones.",
  },
  camera_bis_crs: {
    title: "Get Bureau of Indian Standards safety and security registration for the camera",
    explanation: "CCTV and IP cameras need product-safety and essential-security registration for the exact model and factory.",
    nextStep: "Ask the camera manufacturer for the matching Bureau of Indian Standards registration, security test evidence, and product label details.",
  },
  mtcte_wifi_cpe: {
    title: "Confirm the router’s telecom certificate",
    explanation: "This router may need Indian telecom testing and certification before it is sold or used.",
    nextStep: "Ask the manufacturer or Indian representative for the certificate covering this exact model, interfaces, and Wi-Fi bands.",
  },
  repa_import_for_sale: {
    title: "Get permission to import radio equipment for sale",
    explanation: "An Indian business importing radio equipment for resale may need a current possession authorisation.",
    nextStep: "Ask your Customs Broker or compliance adviser to confirm and obtain the authorisation in the importer’s legal name.",
  },
  headphones_repa_import_for_sale: {
    title: "Get permission to import radio equipment for sale",
    explanation: "An Indian business importing Bluetooth equipment for resale may need a current possession authorisation.",
    nextStep: "Ask your Customs Broker or compliance adviser to confirm and obtain the authorisation in the importer’s legal name.",
  },
  camera_repa_import_for_sale: {
    title: "Get permission to import radio equipment for sale",
    explanation: "An Indian business importing Wi-Fi equipment for resale may need a current possession authorisation.",
    nextStep: "Ask your Customs Broker or compliance adviser to confirm and obtain the authorisation in the importer’s legal name.",
  },
  legal_metrology_labels: {
    title: "Prepare the retail package label",
    explanation: "Products sold in retail packs must show key importer, price, quantity, date, and customer-care details.",
    nextStep: "Prepare the final package artwork and have the importer or packaging adviser check every required declaration before sale.",
  },
  headphones_legal_metrology_labels: {
    title: "Prepare the retail package label",
    explanation: "Products sold in retail packs must show key importer, price, quantity, date, and customer-care details.",
    nextStep: "Prepare the final package artwork and have the importer or packaging adviser check every required declaration before sale.",
  },
  camera_legal_metrology_labels: {
    title: "Prepare the retail package label",
    explanation: "Products sold in retail packs must show key importer, price, quantity, date, and customer-care details.",
    nextStep: "Prepare the final package artwork and have the importer or packaging adviser check every required declaration before sale.",
  },
  headphones_battery_epr: {
    title: "Register for battery-waste responsibility",
    explanation: "An importer placing battery-powered equipment on the Indian market may have producer responsibilities for battery waste.",
    nextStep: "Ask the importer’s environmental-compliance adviser to confirm and complete the correct battery-waste registration.",
  },
  headphones_trade_remedy_check: {
    title: "Check whether any extra import duty applies",
    explanation: "Some products or suppliers can attract anti-dumping or safeguard duty in addition to normal Customs duty.",
    nextStep: "Ask a Customs Broker to check the exact product, country, manufacturer, and exporter against current Indian trade-remedy records.",
  },
  camera_trade_remedy_check: {
    title: "Check whether any extra import duty applies",
    explanation: "Some products or suppliers can attract anti-dumping or safeguard duty in addition to normal Customs duty.",
    nextStep: "Ask a Customs Broker to check the exact product, country, manufacturer, and exporter against current Indian trade-remedy records.",
  },
};

const FACT_LABELS: Record<string, string> = {
  adapterModelIdentity: "Power-adapter model number",
  manufacturerIdentity: "Manufacturer name",
  modelIdentity: "Product model number",
  originCountryCode: "Country of origin",
  importerIdentity: "Indian importer’s legal name",
  producerIdentity: "Manufacturer or producer’s legal name",
  exporterIdentity: "Exporter’s legal name",
  productPackId: "Correct product type",
};

function plainEvidence(item: string): string {
  let copy = item;
  for (const [technical, plain] of Object.entries(FACT_LABELS)) {
    copy = copy.replace(new RegExp(`(?:Confirmed|Exact)\\s+${technical}`, "gi"), plain);
    copy = copy.replace(new RegExp(technical, "g"), plain);
  }
  return copy
    .replace(/\bETA\b/g, "Wireless Equipment Type Approval (ETA)")
    .replace(/\bRF\b/g, "radio-frequency (RF)")
    .replace(/BIS CRS/g, "Bureau of Indian Standards product-safety registration")
    .replace(/\bMTCTE\b/g, "telecom equipment certification (MTCTE)")
    .replace(/\bREPA\b/g, "radio-equipment import-and-sale permission (REPA)")
    .replace(/\bCPCB\b/g, "Central Pollution Control Board (CPCB)");
}

function plainWhoToAsk(ruleId: string): string {
  if (ruleId === "mapping_applicability") return "Your overseas supplier or the product manufacturer";
  if (ruleId === "shipment_parties") return "Your supplier and the commercial-invoice issuer";
  if (/trade_remedy/.test(ruleId)) return "A licensed Customs Broker";
  if (/wpc_eta/.test(ruleId)) return "The product manufacturer or its authorised representative in India";
  if (/adapter.*bis|bis_power_adapter/.test(ruleId)) return "The power-adapter manufacturer or your supplier";
  if (/bis_crs/.test(ruleId)) return "The product or battery manufacturer";
  if (/mtcte/.test(ruleId)) return "The product manufacturer or its authorised representative in India";
  if (/repa/.test(ruleId)) return "A Customs Broker or Indian telecom-compliance adviser";
  if (/legal_metrology/.test(ruleId)) return "The Indian importer’s packaging or legal-metrology adviser";
  if (/battery_epr/.test(ruleId)) return "The importer’s environmental-compliance adviser";
  if (ruleId === "assessment_date" || ruleId === "product_pack_identity") return "No one else — you can update this in the form";
  return "A licensed Customs Broker or product-compliance adviser";
}

function plainRuleCopy(finding: ReportFinding): PlainRuleCopy {
  return PLAIN_RULE_COPY[finding.ruleId] ?? {
    title: finding.title,
    explanation: "This item needs to be confirmed before the import plan can be completed.",
    nextStep: "Ask your Customs Broker or compliance adviser to confirm this requirement for the exact product and shipment.",
  };
}

function Finding({ finding, defaultOpen, stepNumber }: { finding: ReportFinding; defaultOpen: boolean; stepNumber: number }) {
  const plain = plainRuleCopy(finding);
  const kindLabel = {
    satisfied: "Complete",
    clearance_blocker: "Required before Customs clearance",
    verification_gap: "More information needed",
    warning: "Complete before retail sale",
  }[finding.kind];

  const stateLabel = {
    present: "Done",
    absent: "Needs attention",
    unknown: "Not started",
  }[finding.status];

  return (
    <details className={`finding finding-${finding.kind}`} open={defaultOpen}>
      <summary className="finding-heading">
        <div>
          <p className="finding-kind">Step {stepNumber} · {kindLabel}</p>
          <h4>{plain.title}</h4>
        </div>
        <span className="evidence-state">{stateLabel}</span>
      </summary>
      <div className="finding-body">
        <p className="plain-explanation">{plain.explanation}</p>
        <div className="plain-task-grid">
          <section>
            <h5>What you need</h5>
            <ul>{finding.requiredEvidence.map((item) => <li key={item}>{plainEvidence(item)}</li>)}</ul>
          </section>
          <section>
            <h5>Who to ask</h5>
            <p>{plainWhoToAsk(finding.ruleId)}</p>
          </section>
          <section>
            <h5>Next step</h5>
            <p>{plain.nextStep}</p>
          </section>
        </div>
        <details className="technical-details">
          <summary>Why this is needed and official source</summary>
          <p>{finding.source.relevance}</p>
          <dl className="finding-ledger">
            <div>
              <dt>Official source</dt>
              <dd>
                <a href={finding.source.url} target="_blank" rel="noreferrer">{finding.source.title}</a>
                <span>{finding.source.authority}</span>
              </dd>
            </div>
            <div><dt>Official reference</dt><dd>{finding.source.pinpoint}</dd></div>
            <div><dt>Source check</dt><dd>Checked {finding.source.lastChecked}; check again after {finding.source.reviewAfter}</dd></div>
          </dl>
        </details>
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
  const orderedFindings = [...report.findings].sort(
    (left, right) => left.action.order - right.action.order || left.ruleId.localeCompare(right.ruleId),
  );
  const plainSummary = {
    ready: "Based on the details and documents entered, we did not find a problem in the checks covered by this tool. A Customs Broker should still review the shipment before dispatch.",
    blocked: "At least one required document is missing or does not match. Complete the highlighted steps before the shipment is dispatched.",
    needs_verification: "Complete the steps below so we can confirm the product code, document list, and estimated import taxes.",
  }[report.outcome];
  const total = report.cost.status === "available"
    ? report.cost.lines.find((line) => line.id === "total_import_duties")
    : undefined;
  const costLabels: Record<string, string> = {
    assessable_value: "Assessable value",
    basic_customs_duty: "Basic Customs Duty",
    agriculture_infrastructure_development_cess: "Agriculture Infrastructure and Development Cess",
    social_welfare_surcharge: "Social Welfare Surcharge",
    igst: "Integrated Goods and Services Tax",
    gst_compensation_cess: "Goods and Services Tax Compensation Cess",
    total_import_duties: "Total import duties",
  };

  return (
    <section className={`result result-${report.outcome}`} aria-labelledby="result-title">
      <div className="result-status result-plan-heading">
        <div>
          <h2 id="result-title" tabIndex={-1}>Your step-by-step import plan</h2>
        </div>
      </div>
      <div className="preparation-strip">
        <span className="status-mark"><StatusMark outcome={report.outcome} /></span>
        <div>
          <span>Where you are now</span>
          <strong>{PREPARATION_LABELS[report.outcome]}</strong>
        </div>
      </div>
      <p className="result-summary">{plainSummary}</p>

      <section className="report-section" aria-labelledby="findings-title">
        <div className="section-heading">
          <h3 id="findings-title">Your checklist</h3>
          <p className="checklist-intro">Complete these {orderedFindings.length} steps in order. Open a step to see what to collect, who should provide it, and what to do next.</p>
        </div>
        <div className="findings-list">
          {orderedFindings.map((finding, index) => (
            <Finding
              finding={finding}
              defaultOpen={index === 0}
              stepNumber={index + 1}
              key={finding.ruleId}
            />
          ))}
        </div>
      </section>

      <section className="classification-section" aria-labelledby="classification-title">
        <div className="section-heading classification-heading">
          <h3 id="classification-title">Product code and Customs check</h3>
        </div>
        <div className="mapping-strip">
          <div>
            <span>Indian Customs product code</span>
            <strong>{report.mapping.matched ? report.mapping.hsCode : "Waiting for exact product details"}</strong>
          </div>
          <div>
            <span>Product match</span>
            <strong>{report.mapping.matched ? "Exact product matched" : "Not confirmed yet"}</strong>
          </div>
          <div>
            <span>Customs check</span>
            <strong>{report.customsClearanceBlocked ? "A required item is missing" : "No problem found in completed checks"}</strong>
          </div>
        </div>
        <details className="mapping-rationale">
          <summary>How the product code is determined</summary>
          <p>{report.mapping.rationale}</p>
        </details>
      </section>

      <section className="report-section" aria-labelledby="cost-title">
        <div className="section-heading">
          <h3 id="cost-title">Estimated import taxes</h3>
        </div>
        {report.cost.status === "withheld" ? (
          <div className="withheld">
            <strong>Estimate not available yet</strong>
            <p>Complete the unfinished checklist steps before relying on an import-tax estimate.</p>
          </div>
        ) : (
          <>
            <div className="cost-total">
              <span>Estimated total import taxes</span>
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

      <div className="rerun-panel">
        <p>{report.rerunNotice}</p>
        <button type="button" className="button-secondary" onClick={onEdit}>
          Update details and rebuild plan
        </button>
      </div>
    </section>
  );
}

function OtherProductResultView({ report, onEdit }: { report: OtherProductReport; onEdit: () => void }) {
  return (
    <section className={`result result-${report.outcome}`} aria-labelledby="result-title">
      <div className="result-status result-plan-heading">
        <div>
          <p>Professional handoff</p>
          <h2 id="result-title" tabIndex={-1}>Your broker handoff plan</h2>
        </div>
      </div>
      <div className="preparation-strip">
        <span className="status-mark"><StatusMark outcome={report.outcome} /></span>
        <div>
          <span>Preparation status</span>
          <strong>Professional review required</strong>
          <small>Checked-scope result: {report.outcomeLabel}</small>
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
          <p>No product-specific rules were guessed</p>
          <h3 id="coverage-title">Broker review checklist</h3>
        </div>
        <div className="coverage-ledger">
          <section>
            <h4>Facts already prepared</h4>
            <ul>{report.coverage.supportedChecks.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Questions for your Customs Broker</h4>
            <ul>{report.coverage.unsupportedChecks.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Information still needed</h4>
            <ul>{report.coverage.unresolvedFacts.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <section>
            <h4>Why professional review is needed</h4>
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

      <section className="report-section" aria-labelledby="other-actions-title">
        <div className="section-heading">
          <p>Safe handoff sequence</p>
          <h3 id="other-actions-title">What to do next</h3>
        </div>
        <ol className="action-list">
          <li>
            <span>1</span>
            <div>
              <strong>Importer</strong>
              <p>Complete the missing product, shipment, and commercial facts listed above.</p>
              <small>Continue when the broker summary identifies the exact product and shipment.</small>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <strong>Importer</strong>
              <p>Send the broker summary with the product specification sheet and commercial documents already available.</p>
              <small>These are review inputs, not a claim that every document is legally required.</small>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <strong>Licensed Customs Broker</strong>
              <p>Confirm classification, product-specific approvals, required documents, applicable rates, and landed-cost inputs before commitment or dispatch.</p>
              <small>Rebuild this plan after the broker confirms the unsupported product-specific checks.</small>
            </div>
          </li>
        </ol>
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
          Update details and rebuild plan
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
          <h1 id="page-title">Get the right documents and next steps for your import.</h1>
          <p className="intro-copy">
            Tell us what you plan to import into India. We will turn the details you know into a
            practical checklist, cost estimate, risk review, and an ordered plan for what to do next.
          </p>
          <ul className="trust-row" aria-label="Service promises">
            <li>Required and conditional documents</li>
            <li>Official sources and clear owners</li>
            <li>Scoped duty estimate and next actions</li>
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
                <h2 id="assessment" ref={assessmentHeading} tabIndex={-1}>Tell us what you&apos;re importing</h2>
                <span>Start with what you know. Unknown details become questions in your plan.</span>
              </div>

              <form ref={assessmentForm} onSubmit={submit} key={selectedId} noValidate>
                <fieldset className="product-chooser">
                  <legend>What are you importing?</legend>
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
                          <small>Indian Customs code {product.hsCode} · {product.lifecycleStatus}</small>
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
                        <small>Not listed here · needs expert review</small>
                      </span>
                    </label>
                  </div>
                </fieldset>

                <details
                  className="product-detail-review"
                  open={isOtherProduct || undefined}
                  aria-label={isOtherProduct ? "Describe your product for broker review" : "Add known product details or a pro-forma invoice"}
                >
                  <summary>
                    {isOtherProduct ? "Describe your product for broker review" : "Add known product details or a pro-forma invoice"}
                  </summary>
                  <div className="product-detail-body">
                <div className="scope-band">
                  <div>
                    <p>What this check covers</p>
                    <strong>{isOtherProduct ? "Shipment details only — product rules need expert review" : selected!.scopeName}</strong>
                  </div>
                  {isOtherProduct ? (
                    <p className="scope-note">We will keep the shipment details you enter. A Customs Broker must confirm the product code, rules, documents, and import taxes.</p>
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
                      <small>We can show a product code and tax estimate only when these details match exactly.</small>
                    </label>
                  )}
                  <label className="field">
                    <span>Exact model <small>(optional)</small></span>
                    <input name="modelIdentity" autoComplete="off" />
                  </label>
                  <label className="field">
                    <span>Manufacturer <small>(optional)</small></span>
                    <input name="manufacturerIdentity" autoComplete="organization" />
                  </label>
                  {isOtherProduct ? (
                    <label className="field">
                      <span>Overseas supplier <small>(optional)</small></span>
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
                  </div>
                </details>

                <fieldset className="form-section intake-section">
                  <legend>Shipment basics</legend>
                  <p>Origin, destination, quantity, and value shape your handoff. Leave a detail blank if you do not know it yet.</p>
                  <div className="field-grid">
                    <label className="field"><span>Country of origin</span><input name="originCountryCode" maxLength={2} placeholder="Two-letter code" autoCapitalize="characters" /></label>
                    <label className="field"><span>Destination port or city</span><input name="destination" /></label>
                    <label className="field"><span>Shipment quantity</span><input name="quantity" /></label>
                    <label className="field"><span>Incoterm <small>(optional)</small></span><input name="incoterm" autoCapitalize="characters" /></label>
                    <label className="field field-wide"><span>Indian importer <small>(optional)</small></span><input name="importerIdentity" autoComplete="organization" /></label>
                    <label className="field"><span>Producer <small>(optional)</small></span><input name="producerIdentity" /></label>
                    <label className="field"><span>Exporter <small>(optional)</small></span><input name="exporterIdentity" /></label>
                  </div>
                </fieldset>

                {selected ? (
                  <details className="evidence-review" aria-label="I already have documents to verify">
                    <summary>I already have documents to verify</summary>
                    <fieldset className="form-section evidence-section">
                      <legend>Document and compliance review</legend>
                      <p>Optional: tell us what is already present. Anything left as “Not sure” will appear in your checklist instead of being treated as complete.</p>
                      <label className="field field-wide trade-remedy-field">
                        <span>Dated trade-remedy check</span>
                        <select name="tradeRemedyCheck" defaultValue="unknown">
                          <option value="unknown">Not completed or result unknown</option>
                          <option value="confirmed_no_match">Confirmed no match for exact product and parties</option>
                          <option value="possible_match">Possible match requires specialist review</option>
                        </select>
                      </label>
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
                  </details>
                ) : null}

                <fieldset className="form-section">
                  <legend>Shipment value</legend>
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
                    {submitting ? "Building your plan…" : "Build my import plan"}
                  </button>
                  <p>No login. Nothing is stored. This is scoped decision support, not legal advice.</p>
                </div>
              </form>
            </section>

            <aside className="result-pane">
              <div role="region" aria-label="Import action plan">
                {report ? (
                  "reportKind" in report ? (
                    <OtherProductResultView report={report} onEdit={editFacts} />
                  ) : (
                    <ResultView report={report} onEdit={editFacts} />
                  )
                ) : (
                  <div className="result-empty">
                    <span className="empty-mark" aria-hidden="true">?</span>
                    <p>Your answers become a practical import plan.</p>
                    <h2>Your plan will include</h2>
                    <ul>
                      <li>Required and conditional documentation</li>
                      <li>{isOtherProduct ? "Questions and facts prepared for a Customs Broker" : "Classification, duties, costs, and known risks"}</li>
                      <li>Who does what next, in the right order</li>
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
