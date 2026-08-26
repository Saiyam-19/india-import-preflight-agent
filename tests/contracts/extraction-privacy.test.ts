import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const implementationFiles = [
  "src/app/api/documents/route.ts",
  "src/server/documents/intake.ts",
  "src/server/documents/request.ts",
  "src/server/documents/vision-extractor.ts",
];

describe("BWMI-19 document privacy boundary", () => {
  it("does not log, cache, or retain original upload bytes", async () => {
    const sources = await Promise.all(
      implementationFiles.map((path) => readFile(path, "utf8")),
    );
    const implementation = sources.join("\n");

    expect(implementation).not.toMatch(/console\.(?:log|info|warn|error|debug)/);
    expect(implementation).not.toMatch(/writeFile|appendFile|createWriteStream/);
    expect(implementation).not.toMatch(/localStorage|sessionStorage|indexedDB|cookies?\s*\(/);
    expect(implementation).toContain("tracingDisabled: true");
    expect(implementation).toContain("store: false");
    expect(implementation).toContain('"Cache-Control": "no-store"');
    expect(implementation).toContain("await rm(path, { recursive: true, force: true");
  });
});
