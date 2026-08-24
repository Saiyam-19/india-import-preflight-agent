import { describe, expect, it } from "vitest";

import {
  EXTRACTION_FACT_FIELDS,
  ExtractionResultSchema,
  RECORDED_ROUTER_EXTRACTION,
  confirmedExtractionFormValues,
} from "@/extraction";

describe("product-neutral document extraction contract", () => {
  it("accepts the recorded one-page router fixture with provenance and confidence on every fact", () => {
    const result = ExtractionResultSchema.parse(RECORDED_ROUTER_EXTRACTION);

    expect(result.document).toMatchObject({
      kind: "pro_forma_invoice",
      pageCount: 1,
      syntheticScopeId: "bwmi-router-pro-forma-v1",
    });
    expect(result.facts.length).toBeGreaterThanOrEqual(10);
    expect(new Set(result.facts.map((fact) => fact.id)).size).toBe(result.facts.length);
    for (const fact of result.facts) {
      expect(fact.provenance).toMatchObject({
        source: "visible_document_text",
        page: 1,
        locator: expect.any(String),
      });
      expect(fact.confidence).toBeGreaterThanOrEqual(0);
      expect(fact.confidence).toBeLessThanOrEqual(1);
      expect(fact.value).not.toBe("");
    }
  });

  it("keeps the schema product-neutral and excludes legal, outcome, and arithmetic fields", () => {
    expect(EXTRACTION_FACT_FIELDS).toEqual([
      "documentNumber",
      "exporterIdentity",
      "producerIdentity",
      "manufacturerIdentity",
      "importerIdentity",
      "productDescription",
      "modelIdentity",
      "adapterModelIdentity",
      "originCountryCode",
      "quantity",
      "itemValueInr",
      "freightInr",
      "insuranceInr",
    ]);
    expect(EXTRACTION_FACT_FIELDS.join(" ")).not.toMatch(
      /router|headphone|camera|certificate|hsCode|duty|outcome|applicability/i,
    );

    expect(
      ExtractionResultSchema.safeParse({
        ...RECORDED_ROUTER_EXTRACTION,
        outcome: "ready",
      }).success,
    ).toBe(false);
    expect(
      ExtractionResultSchema.safeParse({
        ...RECORDED_ROUTER_EXTRACTION,
        facts: [
          {
            ...RECORDED_ROUTER_EXTRACTION.facts[0],
            hsCode: "85176290",
          },
        ],
      }).success,
    ).toBe(false);
  });

  it("withholds all form values until every fact is explicitly confirmed, then uses edited values only", () => {
    const facts = structuredClone(RECORDED_ROUTER_EXTRACTION.facts);
    facts.find((fact) => fact.field === "manufacturerIdentity")!.value =
      "User-corrected manufacturer";

    expect(confirmedExtractionFormValues(facts, new Set())).toEqual({
      complete: false,
      formValues: {},
    });

    const oneMissing = new Set(facts.slice(1).map((fact) => fact.id));
    expect(confirmedExtractionFormValues(facts, oneMissing)).toEqual({
      complete: false,
      formValues: {},
    });

    const allConfirmed = new Set(facts.map((fact) => fact.id));
    const applied = confirmedExtractionFormValues(facts, allConfirmed);
    expect(applied.complete).toBe(true);
    expect(applied.formValues).toMatchObject({
      manufacturerIdentity: "User-corrected manufacturer",
      modelIdentity: "BWMI-MIMO-245-R1",
      adapterModelIdentity: "BWMI-ADAPTER-12V-R1",
      originCountryCode: "VN",
      itemValueInr: "99999.98",
      freightInr: "0.01",
      insuranceInr: "0.01",
    });
    expect(applied.formValues).not.toHaveProperty("productPackId");
    expect(applied.formValues).not.toHaveProperty("scopeConfirmation");
    expect(applied.formValues).not.toHaveProperty("tradeRemedyCheck");
    expect(applied.formValues).not.toHaveProperty("evidence");
  });
});
