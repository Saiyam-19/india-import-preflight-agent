import { ConversationStore } from "./conversations/conversation-store";
import { migrateAllStores } from "./data/migrate";
import {
  RegulatoryStore,
  admitBundledReferenceSource,
} from "./knowledge/regulatory-store";
import { loadProductionElectronicsKnowledgeGraph } from "./knowledge/electronics-knowledge-loader";

export async function bootstrapApplication() {
  const { paths } = migrateAllStores();
  const regulatoryStore = new RegulatoryStore(paths.regulatory);
  const conversationStore = new ConversationStore(paths.conversations);
  try {
    const evidence = await admitBundledReferenceSource(regulatoryStore, paths.sources);
    const electronicsKnowledgeGraph = await loadProductionElectronicsKnowledgeGraph(regulatoryStore);
    return { conversationStore, electronicsKnowledgeGraph, evidence, paths, regulatoryStore };
  } catch (error) {
    conversationStore.close();
    regulatoryStore.close();
    throw error;
  }
}
