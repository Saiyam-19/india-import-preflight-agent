import { z } from "zod";

export const EXTRACTION_FACT_FIELDS = [
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
] as const;

export const ExtractionFactFieldSchema = z.enum(EXTRACTION_FACT_FIELDS);

export const ExtractionFactSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  field: ExtractionFactFieldSchema,
  label: z.string().min(1),
  rawValue: z.string().min(1),
  value: z.string().min(1),
  confidence: z.number().min(0).max(1),
  provenance: z.strictObject({
    source: z.literal("visible_document_text"),
    page: z.number().int().positive(),
    locator: z.string().min(1),
  }),
});

export const MaterialQuestionSchema = z.strictObject({
  id: z.string().regex(/^[a-z][a-zA-Z0-9]*$/),
  question: z.string().min(1),
  impact: z.enum(["applicability", "evidence", "cost"]),
  relatedFields: z.array(ExtractionFactFieldSchema),
});

export const AgentExtractionSchema = z
  .strictObject({
    facts: z.array(ExtractionFactSchema).min(1),
    materialQuestions: z.array(MaterialQuestionSchema),
  })
  .superRefine((result, context) => {
    const ids = new Set<string>();
    const fields = new Set<string>();
    for (const [index, fact] of result.facts.entries()) {
      if (ids.has(fact.id)) {
        context.addIssue({
          code: "custom",
          message: "Fact identifiers must be unique.",
          path: ["facts", index, "id"],
        });
      }
      if (fields.has(fact.field)) {
        context.addIssue({
          code: "custom",
          message: "Each field may appear only once.",
          path: ["facts", index, "field"],
        });
      }
      ids.add(fact.id);
      fields.add(fact.field);
    }
  });

export const ExtractionResultSchema = z.strictObject({
  schemaVersion: z.literal("1.0"),
  extractionMode: z.enum(["recorded_fixture", "live_openai_agents_sdk"]),
  document: z.strictObject({
    kind: z.literal("pro_forma_invoice"),
    fileName: z.string().min(1),
    pageCount: z.literal(1),
    syntheticScopeId: z.literal("bwmi-router-pro-forma-v1"),
  }),
  facts: AgentExtractionSchema.shape.facts,
  materialQuestions: AgentExtractionSchema.shape.materialQuestions,
  limitations: z.array(z.string().min(1)).min(1),
});

export type ExtractionFact = z.infer<typeof ExtractionFactSchema>;
export type ExtractionFactField = z.infer<typeof ExtractionFactFieldSchema>;
export type AgentExtraction = z.infer<typeof AgentExtractionSchema>;
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;
