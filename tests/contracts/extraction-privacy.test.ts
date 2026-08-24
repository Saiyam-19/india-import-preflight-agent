import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const implementationFiles = [
  "src/app/api/extract/route.ts",
  "src/extraction/agent.ts",
  "src/extraction/service.ts",
];

describe("BWMI-13 privacy boundary", () => {
  it("does not log or durably write upload bytes or derived facts", async () => {
    const sources = await Promise.all(
      implementationFiles.map((path) => readFile(path, "utf8")),
    );
    const implementation = sources.join("\n");

    expect(implementation).not.toMatch(/console\.(?:log|info|warn|error|debug)/);
    expect(implementation).not.toMatch(/from ["']node:fs|writeFile|appendFile|createWriteStream/);
    expect(implementation).not.toMatch(/localStorage|sessionStorage|indexedDB|cookies?\s*\(/);
    expect(implementation).toContain("tracingDisabled: true");
    expect(implementation).toContain("store: false");
  });
});
