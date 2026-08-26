import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export interface DataPaths {
  conversations: string;
  learning: string;
  regulatory: string;
  sources: string;
}

export function resolveDataPaths(rootDir = process.env.BWMI_DATA_DIR ?? ".data"): DataPaths {
  const root = resolve(rootDir);
  const sources = resolve(root, "sources");
  mkdirSync(sources, { recursive: true });
  return {
    conversations: resolve(root, "conversations.db"),
    learning: resolve(root, "learning.db"),
    regulatory: resolve(root, "regulatory.db"),
    sources,
  };
}
