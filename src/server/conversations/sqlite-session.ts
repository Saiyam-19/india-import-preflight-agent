import type { AgentInputItem, Session } from "@openai/agents";

import { ConversationStore } from "./conversation-store";

export class TradeCaseSession implements Session {
  constructor(
    private readonly store: ConversationStore,
    private readonly tradeCaseId: string,
  ) {
    store.assertTradeCase(tradeCaseId);
  }

  async getSessionId() {
    return this.tradeCaseId;
  }

  async getItems(limit?: number) {
    return this.store.getSessionItems(this.tradeCaseId, limit);
  }

  async addItems(items: AgentInputItem[]) {
    this.store.addSessionItems(this.tradeCaseId, items);
  }

  async popItem() {
    return this.store.popSessionItem(this.tradeCaseId);
  }

  async clearSession() {
    this.store.clearSession(this.tradeCaseId);
  }
}
