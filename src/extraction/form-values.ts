import type { ExtractionFact, ExtractionFactField } from "./schema";

const FORM_FIELDS = new Set<ExtractionFactField>([
  "exporterIdentity",
  "producerIdentity",
  "manufacturerIdentity",
  "importerIdentity",
  "modelIdentity",
  "adapterModelIdentity",
  "originCountryCode",
  "itemValueInr",
  "freightInr",
  "insuranceInr",
]);

export function confirmedExtractionFormValues(
  facts: ExtractionFact[],
  confirmedFactIds: ReadonlySet<string>,
): { complete: boolean; formValues: Record<string, string> } {
  const complete =
    facts.length > 0 && facts.every((fact) => confirmedFactIds.has(fact.id));
  if (!complete) return { complete: false, formValues: {} };

  const formValues: Record<string, string> = {};
  for (const fact of facts) {
    if (FORM_FIELDS.has(fact.field)) formValues[fact.field] = fact.value;
  }
  return { complete: true, formValues };
}
