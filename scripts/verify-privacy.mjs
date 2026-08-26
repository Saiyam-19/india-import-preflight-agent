import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const TEXT_EXTENSIONS = new Set([
  ".css", ".html", ".js", ".json", ".jsx", ".md", ".mjs", ".ts", ".tsx", ".txt", ".yaml", ".yml",
]);
const SCAN_ROOTS = ["src", "tests", "test-results"];
const ROOT_FILES = [
  ".vercelignore",
  "eslint.config.mjs",
  "next.config.ts",
  "package.json",
  "playwright.config.ts",
  "tsconfig.json",
  "vitest.config.ts",
];
const REQUIRED_DEPLOYMENT_EXCLUSIONS = [
  ".docx_work/", ".env*", "*.docx", "docs/", "research/", "test-results/", "tests/",
];
const OFFICIAL_TEST_FIXTURE_PREFIX = "tests/fixtures/evidence/";
const SERVER_SNAPSHOT_WRITE_ALLOWLIST = new Set(["src/server/evidence/admission.ts"]);
const PUBLIC_NUMERIC_IDENTIFIERS = [
  "8517623690", // Chinese tariff commodity code for the bounded router reference candidate.
  "54801767665477797", // MOFCOM's public document identifier in the official catalogue URL.
];

const detectors = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ["OpenAI-style secret", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/g],
  ["bearer token", /\bBearer\s+[A-Za-z0-9._~-]{24,}\b/gi],
  ["literal credential assignment", /\b(?:api[_-]?key|password|secret|token)\s*[:=]\s*["'][^"'\n]{8,}["']/gi],
  ["email address", /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],
  ["Indian mobile number", /(?:\+91[ -]?)?[6-9][0-9]{9}\b/g],
  ["Aadhaar-like number", /\b[2-9][0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{4}\b/g],
  ["PAN-like identifier", /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g],
  ["GSTIN-like identifier", /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]\b/g],
];

async function collectFiles(path) {
  const entries = await readdir(path, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(child));
    else if (entry.isFile() && TEXT_EXTENSIONS.has(extname(entry.name))) files.push(child);
  }
  return files;
}

const files = [...ROOT_FILES];
for (const root of SCAN_ROOTS) {
  try {
    files.push(...await collectFiles(root));
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
  }
}

const failures = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  const repositoryPath = relative(".", file);
  for (const [label, pattern] of detectors) {
    if (repositoryPath.startsWith(OFFICIAL_TEST_FIXTURE_PREFIX) && label === "email address") continue;
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      if (
        label === "Indian mobile number" &&
        PUBLIC_NUMERIC_IDENTIFIERS.some((identifier) => {
          const contextStart = Math.max(0, (match.index ?? 0) - identifier.length);
          const contextEnd = (match.index ?? 0) + match[0].length + identifier.length;
          return content.slice(contextStart, contextEnd).includes(identifier);
        })
      ) continue;
      const line = content.slice(0, match.index).split("\n").length;
      failures.push(`${relative(".", file)}:${line} contains ${label}`);
    }
  }
  if (file.startsWith("src/") && /\bconsole\.(?:debug|error|info|log|warn)\s*\(/.test(content)) {
    failures.push(`${relative(".", file)} contains runtime console logging`);
  }
  if (
    file.startsWith("src/") &&
    !SERVER_SNAPSHOT_WRITE_ALLOWLIST.has(repositoryPath) &&
    /\b(?:indexedDB|localStorage|sessionStorage|writeFile|createWriteStream)\b/.test(content)
  ) {
    failures.push(`${relative(".", file)} contains a durable client or filesystem write API`);
  }
}

const deploymentIgnore = await readFile(".vercelignore", "utf8");
for (const exclusion of REQUIRED_DEPLOYMENT_EXCLUSIONS) {
  if (!deploymentIgnore.split("\n").includes(exclusion)) failures.push(`.vercelignore is missing ${exclusion}`);
}

const rootEntries = await readdir(".");
for (const entry of rootEntries.filter((name) => name.startsWith(".env") && name !== ".env.example")) {
  failures.push(`${entry} must not be present in the release workspace`);
}

for (const failure of failures) console.error(`FAIL ${failure}`);
console.log(`Privacy gate: scanned ${files.length} text files; no production upload fixture or recorded extraction is allowed.`);
console.log("Deployment gate: research, verification records, tests, logs, environment files, and documents are excluded.");
if (failures.length > 0) process.exitCode = 1;
