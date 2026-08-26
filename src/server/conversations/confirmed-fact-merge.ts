import type { ConversationStore } from "./conversation-store";

export type ExplicitCaseFact = { name: string; value: string };

export type ConfirmedFactMergeResult = {
  accepted: ExplicitCaseFact[];
  conflicts: Array<{ name: string; existing: string; proposed: string }>;
  unchanged: ExplicitCaseFact[];
};

export function mergeConfirmedCaseFacts(input: {
  confirmsCorrection: boolean;
  facts: ExplicitCaseFact[];
  store: ConversationStore;
  tradeCaseId: string;
}): ConfirmedFactMergeResult {
  const tradeCase = input.store.getTradeCase(input.tradeCaseId);
  const existingFacts = new Map(tradeCase.confirmedFacts.map((fact) => [fact.name, fact.value]));
  const activeConflicts = new Map(tradeCase.memoryItems
    .filter((item) => item.kind === "unresolved_question" && item.status === "active" && item.key.startsWith("conflict:"))
    .map((item) => [item.key.slice("conflict:".length), item.value as { existing?: string; proposed?: string }]));
  const result: ConfirmedFactMergeResult = { accepted: [], conflicts: [], unchanged: [] };

  for (const fact of input.facts) {
    const existing = existingFacts.get(fact.name);
    const pendingConflict = activeConflicts.get(fact.name);
    if (!existing) {
      input.store.confirmFact(input.tradeCaseId, fact.name, fact.value);
      existingFacts.set(fact.name, fact.value);
      result.accepted.push(fact);
      continue;
    }
    if (existing === fact.value) {
      result.unchanged.push(fact);
      continue;
    }
    if (pendingConflict?.proposed === fact.value && input.confirmsCorrection) {
      input.store.confirmFact(input.tradeCaseId, fact.name, fact.value);
      input.store.upsertMemoryItem(input.tradeCaseId, {
        key: `conflict:${fact.name}`,
        kind: "unresolved_question",
        status: "resolved",
        value: { previous: existing, resolution: fact.value },
      });
      existingFacts.set(fact.name, fact.value);
      result.accepted.push(fact);
      continue;
    }
    input.store.upsertMemoryItem(input.tradeCaseId, {
      key: `conflict:${fact.name}`,
      kind: "unresolved_question",
      status: "active",
      value: { existing, proposed: fact.value },
    });
    result.conflicts.push({ name: fact.name, existing, proposed: fact.value });
  }

  return result;
}
