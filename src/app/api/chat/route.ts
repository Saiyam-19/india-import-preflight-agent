import { z } from "zod";

import {
  getAiAvailability,
  runInstantGuidance,
  runReferenceGuidance,
  type ComplianceOutput,
} from "@/server/agent/guidance";
import { bootstrapApplication } from "@/server/bootstrap";
import {
  buildElectronicsActionDossier,
} from "@/server/assessment/electronics-dossier";
import {
  buildElectronicsProfile,
  extractConfirmedElectronicsFacts,
  groupedElectronicsIntake,
} from "@/server/assessment/electronics-profile";
import { mergeConfirmedCaseFacts } from "@/server/conversations/confirmed-fact-merge";
import { checkAiProviderCapability, recordAiProviderRuntimeFailure } from "@/server/agent/provider-config";
import type { ClassificationRecord, DomainFindingRecord, ProductResearchRecord, ToolClaim } from "@/server/agent/compliance-tools";
import type { ConversationStore } from "@/server/conversations/conversation-store";
import { isGlobalProductScope, type RegulatoryStore } from "@/server/knowledge/regulatory-store";

export const runtime = "nodejs";

const RequestSchema = z.object({
  tradeCaseId: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(2_000),
  mode: z.enum(["instant", "deep_research"]).default("instant"),
}).strict();

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
};

type TradeDirection = "china_to_india" | "india_to_china";
export type GuidanceMode = "instant" | "deep_research";
export type ChatExecutionMode =
  | "instant_reference"
  | "instant_preorder_triage"
  | "agents_sdk_deep_research"
  | "deep_research_unavailable";
type Application = Awaited<ReturnType<typeof bootstrapApplication>>;

export function resolveChatExecutionMode(input: {
  aiAvailable: boolean;
  generalReferenceQuestion: boolean;
  requestedMode: GuidanceMode;
}): ChatExecutionMode {
  if (input.generalReferenceQuestion) return "instant_reference";
  if (input.requestedMode === "deep_research") {
    return input.aiAvailable ? "agents_sdk_deep_research" : "deep_research_unavailable";
  }
  return "instant_preorder_triage";
}

export function didDeepResearchTimeOut(signal: AbortSignal | undefined) {
  const reason = signal?.reason;
  return signal?.aborted === true
    && reason instanceof DOMException
    && reason.name === "TimeoutError";
}

export function inferTradeDirection(text: string): TradeDirection | null {
  const normalized = text.toLowerCase().replaceAll(/[–—]/g, "-");
  const chinaToIndia = (
    /(?:import|importing|bring|bringing|ship|shipping).{0,100}(?:from\s+china)(?:\b|.{0,100}(?:to|into)\s+india)/.test(normalized)
    || /(?:from\s+china).{0,100}(?:import|importing|bring|ship)/.test(normalized)
    || /china\s*(?:-|to)\s*india/.test(normalized)
    || /import(?:ing)?\s+(?:goods|items|products)?.{0,60}(?:from\s+china)/.test(normalized)
    || /import(?:ing)?\s+(?:into\s+)?india/.test(normalized)
  );
  const indiaToChina = (
    /(?:export|exporting|send|sending|ship|shipping).{0,100}(?:from\s+india).{0,100}(?:to|into)\s+china/.test(normalized)
    || /(?:export|exporting|send|sending|ship|shipping).{0,100}(?:to|into)\s+china/.test(normalized)
    || /(?:to|into)\s+china.{0,100}(?:export|exporting|send|ship)/.test(normalized)
    || /india\s*(?:-|to)\s*china/.test(normalized)
    || /export(?:ing)?\s+(?:from\s+)?india/.test(normalized)
  );
  if (chinaToIndia === indiaToChina) return null;
  return chinaToIndia ? "china_to_india" : "india_to_china";
}

function titleFromQuestion(question: string) {
  const compact = question.replaceAll(/\s+/g, " ").trim();
  return compact.length <= 64 ? compact : `${compact.slice(0, 61).trimEnd()}...`;
}

function latestUserContext(
  messages: Array<{ content: string; role: "assistant" | "user" }>,
  question: string,
) {
  const previous = messages
    .filter((message) => message.role === "user")
    .slice(-5)
    .map((message) => message.content);
  return [...previous, question].join("\n");
}

const GENERIC_PRODUCT_WORDS = new Set([
  "article", "device", "equipment", "goods", "item", "items", "machine", "merchandise",
  "product", "products", "shipment", "stuff", "this",
]);

function cleanProductCandidate(value: string) {
  const cleaned = value
    .replace(/^(?:a|an|the|this|these|my|our|some)\s+/i, "")
    .replace(/\b(?:from|to|into)\s+(?:china|india)\b.*$/i, "")
    .replace(/[?.!,;:]+$/g, "")
    .replaceAll(/\s+/g, " ")
    .trim();
  if (cleaned.length < 3 || cleaned.length > 240) return null;
  const words = cleaned.toLowerCase().split(/\s+/);
  if (words.every((word) => GENERIC_PRODUCT_WORDS.has(word))) return null;
  return cleaned;
}

export function inferProductDescription(text: string) {
  const patterns = [
    /\b(?:import|importing|export|exporting|ship|shipping|send|sending|bring|bringing)\s+(.{2,240}?)\s+(?:from|to|into)\s+(?:china|india)\b/i,
    /\b(?:rules?|requirements?|documents?|procedure|controls?|dut(?:y|ies)|tax(?:es)?)\s+(?:apply\s+)?(?:to|for|about)\s+(.{2,240}?)(?:[?.!]|$)/i,
    /\b(?:product|item|goods?)\s*(?:is|are|:)\s*(.{2,240}?)(?:[?.!]|$)/i,
  ];
  for (const pattern of patterns) {
    const candidate = text.match(pattern)?.[1];
    if (!candidate) continue;
    const cleaned = cleanProductCandidate(candidate);
    if (cleaned) return cleaned;
  }
  return null;
}

function inferExactProductIdentity(text: string) {
  const match = text.match(
    /\b(?:exact\s+)?(?:make\s*(?:and|\/)?\s*)?(?:model|sku|part(?:\s+number)?|hardware\s+version)\s*(?:is|are|:|#)?\s*(.{2,240}?)(?=\s+and\s+(?:its|the|it)\b|[;?.!]|$)/i,
  );
  return match?.[1] ? cleanProductCandidate(match[1]) : null;
}

function persistDirection(
  store: Application["conversationStore"],
  tradeCaseId: string,
  direction: TradeDirection,
) {
  const countries = direction === "china_to_india"
    ? { destination: "India", origin: "China" }
    : { destination: "China", origin: "India" };
  store.confirmFact(tradeCaseId, "origin_country", countries.origin);
  store.confirmFact(tradeCaseId, "destination_country", countries.destination);
  store.confirmFact(tradeCaseId, "trade_direction", direction);
}

function directionLabel(direction: TradeDirection) {
  return direction === "china_to_india" ? "China to India" : "India to China";
}

function appendLimitedAnswer(
  application: Application,
  tradeCaseId: string,
  question: string,
  summary: string,
) {
  application.conversationStore.addToolReference(tradeCaseId, "server_fact_intake", crypto.randomUUID());
  application.conversationStore.appendMessage(tradeCaseId, "user", question);
  application.conversationStore.appendMessage(tradeCaseId, "assistant", summary);
}

function limitedOutput(
  application: Application,
  tradeCaseId: string,
  summary: string,
  missingInformation: string[],
): ComplianceOutput {
  const tradeCase = application.conversationStore.getTradeCase(tradeCaseId);
  return {
    state: "assessment_incomplete",
    summary,
    claims: [],
    missingInformation,
    confirmedFacts: tradeCase.confirmedFacts,
    productResearch: [],
    classificationCandidates: [],
    agencies: [],
    controls: [],
    documents: [],
    documentReviews: [],
    calculation: null,
    risks: [
      "No product-specific official research was performed because AI is unavailable.",
      "This is not a Customs-clearance decision.",
    ],
    nextActions: missingInformation,
    nextQuestion: missingInformation[0] ?? null,
    checked: ["Clearly stated conversation facts were saved locally."],
    notChecked: [
      "Product specifications, classification, product-specific agencies and controls were not researched.",
      "Authenticated filing, payment, inspection, release and Customs-clearance status were not checked.",
    ],
    actionDossier: null,
    journeyStage: null,
    acceptedFacts: [],
  };
}

function saveLimitedSnapshot(application: Application, tradeCaseId: string, output: ComplianceOutput) {
  application.conversationStore.saveAssessmentSnapshot(tradeCaseId, {
    agencies: output.agencies,
    calculation: output.calculation,
    checked: output.checked,
    classificationCandidates: output.classificationCandidates,
    claims: output.claims,
    confirmedFacts: output.confirmedFacts,
    controls: output.controls,
    createdAt: new Date().toISOString(),
    documentReviews: output.documentReviews,
    documents: output.documents,
    executionProvenance: {
      mode: "agents_sdk_with_deterministic_tools",
      modelVersion: "local-conflict-gate-v1",
    },
    missingInformation: output.missingInformation,
    nextActions: output.nextActions,
    notChecked: output.notChecked,
    productResearch: output.productResearch,
    risks: output.risks,
    snapshotId: `conversation-assessment-${crypto.randomUUID()}`,
    state: "Assessment Incomplete",
    summary: output.summary,
  });
}

function isProductResearchRecord(value: unknown): value is ProductResearchRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ProductResearchRecord>;
  return typeof record.recordId === "string"
    && typeof record.productName === "string"
    && typeof record.sourceLabel === "string"
    && typeof record.sourceUrl === "string"
    && Array.isArray(record.specifications);
}

function isClassificationRecord(value: unknown): value is ClassificationRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ClassificationRecord>;
  return typeof record.recordId === "string"
    && typeof record.productName === "string"
    && record.status === "candidate_to_verify"
    && Array.isArray(record.candidates)
    && Array.isArray(record.missingMaterialFacts);
}

function isToolClaim(value: unknown): value is ToolClaim {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<ToolClaim>;
  return typeof record.claimId === "string" && typeof record.sourceVersionId === "string"
    && typeof record.text === "string" && typeof record.url === "string";
}

function isDomainFinding(value: unknown): value is DomainFindingRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<DomainFindingRecord>;
  return typeof record.findingId === "string" && ["agency", "control", "document"].includes(record.kind ?? "")
    && typeof record.productName === "string"
    && ["china_to_india", "india_to_china"].includes(record.tradeDirection ?? "")
    && Array.isArray(record.claimIds);
}

function normalizedScope(value: string) {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
}

function matchesActiveProduct(recordProduct: string, activeProduct: string) {
  const record = normalizedScope(recordProduct);
  const active = normalizedScope(activeProduct);
  return Boolean(record && active && record === active);
}

function claimMatchesActiveProduct(productScope: string, activeProduct: string) {
  return isGlobalProductScope(productScope)
    || matchesActiveProduct(productScope, activeProduct);
}

export function reconstructInterruptedResearchOutput(input: {
  conversationStore: ConversationStore;
  regulatoryStore: RegulatoryStore;
  tradeCaseId: string;
  summary: string;
  missingInformation: string[];
}): ComplianceOutput {
  const tradeCase = input.conversationStore.getTradeCase(input.tradeCaseId);
  const facts = new Map(tradeCase.confirmedFacts.map((fact) => [fact.name, fact.value]));
  const activeProduct = facts.get("exact_product_identity") ?? facts.get("product_description") ?? "";
  const activeDirection = facts.get("trade_direction");
  const productResearch = tradeCase.memoryItems
    .filter((item) => item.kind === "product_research" && item.status === "active" && isProductResearchRecord(item.value))
    .map((item) => item.value as ProductResearchRecord);
  const scopedProductResearch = productResearch.filter((record) => matchesActiveProduct(record.productName, activeProduct));
  const classificationCandidates = tradeCase.memoryItems
    .filter((item) => item.kind === "classification_candidates" && item.status === "active" && isClassificationRecord(item.value))
    .map((item) => item.value as ClassificationRecord);
  const scopedClassifications = classificationCandidates.filter((record) => matchesActiveProduct(record.productName, activeProduct));
  const claims = tradeCase.memoryItems
    .filter((item) => item.kind === "admitted_claim" && item.status === "active" && isToolClaim(item.value))
    .map((item) => item.value as ToolClaim)
    .filter((claim) => {
      if (claim.tradeDirection !== activeDirection || !claimMatchesActiveProduct(claim.productScope, activeProduct)) return false;
      try {
        const admitted = input.regulatoryStore.getAdmittedEvidenceForGuidance(claim.sourceVersionId, {
          appliesIn: claim.appliesIn,
          tradeDirection: claim.tradeDirection,
        });
        return admitted.locator === claim.locator
          && admitted.claimText === claim.text
          && admitted.authority === claim.authority
          && admitted.url === claim.url
          && normalizedScope(admitted.applicability.productScope) === normalizedScope(claim.productScope)
          && normalizedScope(admitted.applicability.regulatoryDomain) === normalizedScope(claim.regulatoryDomain);
      } catch (error) {
        if (!(error instanceof Error) || error.message !== "Admitted evidence was not found.") return false;
        try {
          const resolved = input.regulatoryStore.resolveCitation(claim);
          return (!resolved.claimText || resolved.claimText === claim.text)
            && resolved.authority === claim.authority
            && resolved.url === claim.url;
        } catch {
          return false;
        }
      }
    });
  const claimIds = new Set(claims.map((claim) => claim.claimId));
  const findings = tradeCase.memoryItems
    .filter((item) => item.kind === "domain_finding" && item.status === "active" && isDomainFinding(item.value))
    .map((item) => item.value as DomainFindingRecord)
    .filter((finding) => finding.tradeDirection === activeDirection
      && matchesActiveProduct(finding.productName, activeProduct)
      && (finding.status === "candidate_to_verify"
        ? finding.claimIds.length === 0
        : finding.claimIds.length > 0 && finding.claimIds.every((claimId) => claimIds.has(claimId))));
  const completed = [
    ...(scopedProductResearch.length > 0 ? [`Completed product specification research for ${scopedProductResearch.map((record) => record.productName).join(", ")} (saved as non-compliance research).`] : []),
    ...(scopedClassifications.length > 0 ? ["Completed and saved candidate classification work; every candidate remains to verify."] : []),
    ...(claims.length > 0 ? [`Recovered ${claims.length} admitted claim(s) completed before interruption.`] : []),
    ...(findings.length > 0 ? [`Recovered ${findings.length} completed domain finding(s) without treating unfinished checks as complete.`] : []),
  ];
  return {
    state: "assessment_incomplete",
    summary: input.summary,
    claims,
    missingInformation: input.missingInformation,
    confirmedFacts: tradeCase.confirmedFacts,
    productResearch: scopedProductResearch,
    classificationCandidates: scopedClassifications,
    agencies: findings.filter((finding) => finding.kind === "agency"),
    controls: findings.filter((finding) => finding.kind === "control"),
    documents: findings.filter((finding) => finding.kind === "document"),
    documentReviews: [],
    calculation: null,
    risks: [
      "Deep research was interrupted. Recovered records are partial workflow results; only records already bound to admitted claims remain evidence-backed.",
      "This is not a Customs-clearance decision.",
    ],
    nextActions: input.missingInformation,
    nextQuestion: input.missingInformation[0] ?? null,
    checked: ["Clearly stated conversation facts were saved locally.", ...completed],
    notChecked: [
      "Interrupted or unchecked: remaining official-source admission plus remaining product-specific agency, control, document, rate, and deterministic-readiness verification.",
      "Authenticated filing, payment, inspection, release and Customs-clearance status were not checked.",
    ],
    actionDossier: null,
    journeyStage: null,
    acceptedFacts: [],
  };
}

type SavedConflict = { name: string; existing: string; proposed: string };

function activeSavedConflicts(store: ConversationStore, tradeCaseId: string): SavedConflict[] {
  return store.getTradeCase(tradeCaseId).memoryItems.flatMap((item) => {
    if (item.kind !== "unresolved_question" || item.status !== "active" || !item.key.startsWith("conflict:")) return [];
    const value = item.value as { existing?: unknown; proposed?: unknown };
    return typeof value.existing === "string" && typeof value.proposed === "string"
      ? [{ name: item.key.slice("conflict:".length), existing: value.existing, proposed: value.proposed }]
      : [];
  });
}

function humanFactName(name: string) {
  return name.replaceAll("_", " ");
}

function resolveKeepSavedConflicts(store: ConversationStore, tradeCaseId: string, question: string) {
  if (!/\bkeep\b.*\b(?:saved|existing|current)\b/i.test(question)) return;
  const active = activeSavedConflicts(store, tradeCaseId).filter((item) => item.name !== "trade_direction");
  const referenced = active.filter((item) => question.toLowerCase().includes(humanFactName(item.name)));
  const selected = referenced.length > 0 ? referenced : active.length === 1 ? active : [];
  for (const conflict of selected) {
    store.upsertMemoryItem(tradeCaseId, {
      key: `conflict:${conflict.name}`,
      kind: "unresolved_question",
      status: "resolved",
      value: { previous: conflict.existing, resolution: conflict.existing },
    });
  }
}

function proposedConflictFacts(store: ConversationStore, tradeCaseId: string, question: string) {
  if (!/\b(?:actually|confirm|correct|change|replace|update|use)\b/i.test(question)) return [];
  const active = activeSavedConflicts(store, tradeCaseId).filter((item) => item.name !== "trade_direction");
  const genericSingleResolution = active.length === 1
    && /\breplace\b.*\b(?:it\b.*)?\bproposed value\b/i.test(question);
  return active.flatMap((conflict) => {
    const namesField = question.toLowerCase().includes(humanFactName(conflict.name));
    const namesValue = question.toLowerCase().includes(conflict.proposed.toLowerCase());
    return (namesField && namesValue) || genericSingleResolution
      ? [{ name: conflict.name, value: conflict.proposed }]
      : [];
  });
}

function isGeneralReferenceQuestion(question: string) {
  return /\bIEC\b|importer[ -]?exporter code|baseline documents|documents.*import/i.test(question)
    && !inferProductDescription(question);
}

export async function POST(request: Request) {
  let parsed: z.infer<typeof RequestSchema>;
  try {
    parsed = RequestSchema.parse(await request.json());
  } catch {
    return Response.json(
      { error: "Enter a question between 3 and 2,000 characters." },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  const application = await bootstrapApplication();
  let tradeCaseId = parsed.tradeCaseId;
  try {
    if (tradeCaseId) {
      application.conversationStore.assertTradeCase(tradeCaseId);
    } else {
      const title = titleFromQuestion(parsed.question);
      const conversation = application.conversationStore.createConversation(title);
      tradeCaseId = application.conversationStore.createTradeCase(conversation.id, title).id;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "The request could not be completed.";
    application.conversationStore.close();
    application.regulatoryStore.close();
    return Response.json({ error: message }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const activeId = tradeCaseId;
  const before = application.conversationStore.getTradeCase(activeId);
  const generalReferenceQuestion = isGeneralReferenceQuestion(parsed.question);
  const existingDirection = before.confirmedFacts.find((fact) => fact.name === "trade_direction")?.value;
  const proposedDirection = generalReferenceQuestion ? null : inferTradeDirection(parsed.question);
  const pendingDirection = before.memoryItems.find(
    (item) => item.kind === "unresolved_question" && item.key === "conflict:trade_direction" && item.status === "active",
  )?.value as { existing?: TradeDirection; proposed?: TradeDirection } | undefined;
  const explicitResolution = /\b(?:confirm|keep|switch|change|use|yes)\b/i.test(parsed.question);

  let conflict: { existing: TradeDirection; proposed: TradeDirection } | null = null;
  if (
    pendingDirection?.existing
    && pendingDirection.proposed
    && explicitResolution
    && proposedDirection === pendingDirection.proposed
  ) {
    persistDirection(application.conversationStore, activeId, pendingDirection.proposed);
    application.conversationStore.upsertMemoryItem(activeId, {
      key: "conflict:trade_direction",
      kind: "unresolved_question",
      status: "resolved",
      value: { resolution: pendingDirection.proposed },
    });
  } else if (
    pendingDirection?.existing
    && pendingDirection.proposed
    && explicitResolution
    && proposedDirection === pendingDirection.existing
  ) {
    application.conversationStore.upsertMemoryItem(activeId, {
      key: "conflict:trade_direction",
      kind: "unresolved_question",
      status: "resolved",
      value: { previous: pendingDirection.proposed, resolution: pendingDirection.existing },
    });
  } else if (pendingDirection?.existing && pendingDirection.proposed) {
    conflict = { existing: pendingDirection.existing, proposed: pendingDirection.proposed };
  } else if (
    (existingDirection === "china_to_india" || existingDirection === "india_to_china")
    && proposedDirection
    && proposedDirection !== existingDirection
  ) {
    conflict = { existing: existingDirection, proposed: proposedDirection };
    application.conversationStore.upsertMemoryItem(activeId, {
      key: "conflict:trade_direction",
      kind: "unresolved_question",
      status: "active",
      value: conflict,
    });
  } else if (!existingDirection && proposedDirection) {
    persistDirection(application.conversationStore, activeId, proposedDirection);
  }

  const current = application.conversationStore.getTradeCase(activeId);
  const context = latestUserContext(current.messages, parsed.question);
  const explicitProduct = generalReferenceQuestion ? null : inferProductDescription(parsed.question);
  const product = explicitProduct ?? (generalReferenceQuestion ? null : inferProductDescription(context));
  const existingProduct = current.confirmedFacts.find((fact) => fact.name === "product_description")?.value;
  if (explicitProduct && existingProduct && explicitProduct.toLowerCase() !== existingProduct.toLowerCase()) {
    application.conversationStore.upsertMemoryItem(activeId, {
      key: "conflict:product_description",
      kind: "unresolved_question",
      status: "active",
      value: { existing: existingProduct, proposed: explicitProduct },
    });
  } else if (product && !existingProduct) {
    application.conversationStore.confirmFact(activeId, "product_description", product);
  }
  const exactIdentity = generalReferenceQuestion ? null : inferExactProductIdentity(parsed.question);
  if (exactIdentity) {
    const existing = current.confirmedFacts.find((fact) => fact.name === "exact_product_identity")?.value;
    if (!existing || existing === exactIdentity) {
      application.conversationStore.confirmFact(activeId, "exact_product_identity", exactIdentity);
    } else {
      application.conversationStore.upsertMemoryItem(activeId, {
        key: "conflict:exact_product_identity",
        kind: "unresolved_question",
        status: "active",
        value: { existing, proposed: exactIdentity },
      });
    }
  }

  resolveKeepSavedConflicts(application.conversationStore, activeId, parsed.question);
  let factMerge: ReturnType<typeof mergeConfirmedCaseFacts> = { accepted: [], conflicts: [], unchanged: [] };
  if (!generalReferenceQuestion) {
    const extractedFacts = extractConfirmedElectronicsFacts(parsed.question);
    const explicitConflictFacts = proposedConflictFacts(application.conversationStore, activeId, parsed.question);
    const facts = [...new Map([...extractedFacts, ...explicitConflictFacts].map((fact) => [fact.name, fact])).values()];
    factMerge = mergeConfirmedCaseFacts({
      confirmsCorrection: /\b(?:actually|confirm|correct|change|replace|update|use)\b/i.test(parsed.question),
      facts,
      store: application.conversationStore,
      tradeCaseId: activeId,
    });
  }
  const materialConflicts = activeSavedConflicts(application.conversationStore, activeId)
    .filter((item) => item.name !== "trade_direction");

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: unknown) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      const ai = getAiAvailability();
      const withElectronicsProfile = (output: ComplianceOutput, grouped = false, dossierBlocked = false) => {
        const tradeCase = application.conversationStore.getTradeCase(activeId);
        const direction = tradeCase.confirmedFacts.find((fact) => fact.name === "trade_direction")?.value;
        if (direction !== "china_to_india") return output;
        const classificationCandidates = tradeCase.memoryItems
          .filter((item) => item.kind === "classification_candidates" && item.status === "active")
          .map((item) => item.value)
          .filter((candidate): candidate is Parameters<typeof buildElectronicsProfile>[0]["classificationCandidates"] extends Array<infer T> ? T : never => (
            typeof candidate === "object" && candidate !== null
            && "system" in candidate && "codeOrEntry" in candidate && "missingThresholdFacts" in candidate
          ));
        const electronicsProfile = buildElectronicsProfile({
          confirmedFacts: tradeCase.confirmedFacts,
          documents: tradeCase.documents,
          classificationCandidates,
        });
        const actionDossier = buildElectronicsActionDossier({
          baselineEvidence: application.regulatoryStore.getReferenceEvidence(application.paths.sources),
          knowledgeStore: application.regulatoryStore.electronicsKnowledge,
          profile: electronicsProfile,
          regulatoryStore: application.regulatoryStore,
        });
        const intake = groupedElectronicsIntake(electronicsProfile);
        const exposedDossier = !dossierBlocked && ["pre_purchase_research", "post_purchase_remediation"].includes(intake.journeyStage)
          && intake.missing.length === 0
          ? actionDossier
          : null;
        const dossierOutput = {
          ...output,
          electronicsProfile,
          actionDossier: exposedDossier,
          journeyStage: intake.journeyStage,
          acceptedFacts: factMerge.accepted,
        };
        if (!grouped) return dossierOutput;
        const profiledOutput = {
          ...dossierOutput,
          missingInformation: intake.missing,
          nextActions: intake.nextActions,
          nextQuestion: intake.question,
          summary: `${output.summary.replace(/\s+Next:\s+.*$/s, "")} Next: ${intake.question}`,
        };
        application.conversationStore.replaceLatestAssistantMessageContent(activeId, profiledOutput.summary);
        application.conversationStore.saveAssessmentSnapshot(activeId, {
          ...(exposedDossier ? { actionDossier: exposedDossier } : {}),
          agencies: profiledOutput.agencies,
          calculation: profiledOutput.calculation,
          checked: profiledOutput.checked,
          classificationCandidates: profiledOutput.classificationCandidates,
          claims: profiledOutput.claims,
          confirmedFacts: profiledOutput.confirmedFacts,
          controls: profiledOutput.controls,
          createdAt: new Date().toISOString(),
          documentReviews: profiledOutput.documentReviews,
          documents: profiledOutput.documents,
          executionProvenance: {
            mode: "agents_sdk_with_deterministic_tools",
            modelVersion: "local-electronics-dossier-v1",
          },
          missingInformation: profiledOutput.missingInformation,
          nextActions: profiledOutput.nextActions,
          notChecked: profiledOutput.notChecked,
          productResearch: profiledOutput.productResearch,
          risks: profiledOutput.risks,
          snapshotId: `conversation-assessment-${crypto.randomUUID()}`,
          state: "Assessment Incomplete",
          summary: profiledOutput.summary,
        });
        return profiledOutput;
      };
      let deepResearchSignal: AbortSignal | undefined;
      try {
        if (conflict) {
          const summary = `I have ${directionLabel(conflict.existing)} saved, but your latest message describes ${directionLabel(conflict.proposed)}. I have not overwritten the saved lane. Reply “Use ${directionLabel(conflict.proposed)}” to confirm the correction, or keep ${directionLabel(conflict.existing)}.`;
          appendLimitedAnswer(application, activeId, parsed.question, summary);
          const output = limitedOutput(application, activeId, summary, ["Resolve the conflicting shipment direction."]);
          saveLimitedSnapshot(application, activeId, output);
          emit({ type: "result", ai, mode: "conflict_resolution", output, tradeCase: application.conversationStore.getTradeCase(activeId) });
          return;
        }

        if (materialConflicts.length > 0) {
          const details = materialConflicts.map((item) =>
            `${humanFactName(item.name)} has saved value “${item.existing}” and proposed value “${item.proposed}”.`,
          ).join(" ");
          const summary = `${details} I have not overwritten any saved value or recalculated the dossier. For each conflict, reply to keep the saved value or replace it with the proposed value.`;
          const missing = ["For each material conflict, explicitly keep the saved value or replace it with the proposed value."];
          appendLimitedAnswer(application, activeId, parsed.question, summary);
          const output = limitedOutput(application, activeId, summary, missing);
          saveLimitedSnapshot(application, activeId, output);
          emit({
            type: "result",
            ai,
            mode: "conflict_resolution",
            output: withElectronicsProfile(output, false, true),
            tradeCase: application.conversationStore.getTradeCase(activeId),
          });
          return;
        }

        const common = {
          conversationStore: application.conversationStore,
          question: parsed.question,
          regulatoryStore: application.regulatoryStore,
          sourcesRoot: application.paths.sources,
          tradeCaseId: activeId,
          onActivity: emit,
        };
        const deepResearchCapability = parsed.mode === "deep_research"
          ? await checkAiProviderCapability()
          : null;
        const executionMode = resolveChatExecutionMode({
          aiAvailable: deepResearchCapability?.available ?? ai.available,
          generalReferenceQuestion,
          requestedMode: parsed.mode,
        });
        if (executionMode === "instant_reference") {
          const result = await runInstantGuidance({ ...common, kind: "general_reference" });
          emit({
            type: "result",
            ai,
            mode: executionMode,
            output: withElectronicsProfile(result.output),
            tradeCase: application.conversationStore.getTradeCase(activeId),
          });
          return;
        }

        if (executionMode === "agents_sdk_deep_research") {
          // Three minutes is the measurement ceiling, not a target latency. It keeps
          // slow free-tier model cold starts bounded while allowing us to observe
          // their real completion time and tune the production budget from data.
          deepResearchSignal = AbortSignal.timeout(180_000);
          const result = await runReferenceGuidance({
            ...common,
            signal: deepResearchSignal,
          });
          emit({
            type: "result",
            ai,
            mode: executionMode,
            output: withElectronicsProfile(result.output),
            tradeCase: application.conversationStore.getTradeCase(activeId),
          });
          return;
        }

        if (executionMode === "deep_research_unavailable") {
          const summary = "Deep research is temporarily unavailable. Saved case facts were preserved; instant guidance and document work remain available.";
          appendLimitedAnswer(application, activeId, parsed.question, summary);
          const output = reconstructInterruptedResearchOutput({
            conversationStore: application.conversationStore,
            regulatoryStore: application.regulatoryStore,
            tradeCaseId: activeId,
            summary,
            missingInformation: [
            "Continue with instant guidance now, then retry deep research when provider health is restored.",
            ],
          });
          emit({
            type: "result",
            ai,
            mode: executionMode,
            output: withElectronicsProfile(output, true),
            tradeCase: application.conversationStore.getTradeCase(activeId),
          });
          return;
        }

        const result = await runInstantGuidance({ ...common, kind: "shipment_triage" });
        emit({
          type: "result",
          ai,
          mode: executionMode,
          output: withElectronicsProfile(result.output, true),
          tradeCase: application.conversationStore.getTradeCase(activeId),
        });
      } catch (error) {
        if (parsed.mode === "deep_research") {
          recordAiProviderRuntimeFailure();
          const timedOut = didDeepResearchTimeOut(deepResearchSignal);
          const summary = timedOut
            ? "Deep research reached its 3-minute limit and was stopped. Saved case facts were preserved; instant guidance and document work remain available."
            : "Deep research could not complete because the provider became unavailable. Saved case facts were preserved; instant guidance and document work remain available.";
          appendLimitedAnswer(application, activeId, parsed.question, summary);
          const output = reconstructInterruptedResearchOutput({
            conversationStore: application.conversationStore,
            regulatoryStore: application.regulatoryStore,
            tradeCaseId: activeId,
            summary,
            missingInformation: ["Continue with instant guidance now, then retry deep research later."],
          });
          emit({
            type: "result",
            ai: { available: false, message: "Deep research temporarily unavailable" },
            mode: "deep_research_unavailable",
            output: withElectronicsProfile(output, true),
            tradeCase: application.conversationStore.getTradeCase(activeId),
          });
          return;
        }
        emit({
          type: "error",
          message: error instanceof Error
            ? `The evidence-backed answer could not be completed: ${error.message}`
            : "The evidence-backed answer could not be completed.",
        });
      } finally {
        application.conversationStore.close();
        application.regulatoryStore.close();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...NO_STORE_HEADERS,
      "Content-Type": "application/x-ndjson; charset=utf-8",
    },
  });
}
