import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const SOURCE_FILES = [
  "src/knowledge/router-pack.ts",
  "src/knowledge/headphones-pack.ts",
  "src/knowledge/camera-pack.ts",
  "src/server/assessment/china-export-evidence.ts",
  "src/server/assessment/india-to-china-evidence.ts",
  "src/server/assessment/preparation-workflow.ts",
];
const ADMITTED_OFFICIAL_NON_GOV_HOSTS = new Set([
  "static.tp-link.com",
  "www.crsbis.in",
  "www.singlewindow.cn",
]);
const BWMI17_OFFICIAL_URLS = [
  "https://content.dgft.gov.in/Website/dgftprod/9158887c-cdfb-4312-92f1-15eeb8e8aa70/%5BUPDATED%5D%20CHAPTER%202%20OF%20FTP.pdf",
  "https://policy.mofcom.gov.cn/claw/clawContent.shtml?id=90362",
];
const ELECTRONICS_KNOWLEDGE_FILE = "evidence/knowledge/china-india-electronics-v1.json";
const TIMEOUT_MS = Number(process.env.BWMI_LINK_TIMEOUT_MS ?? "20000");
const CONCURRENCY = Number(process.env.BWMI_LINK_CONCURRENCY ?? "6");
const execFileAsync = promisify(execFile);

async function sourceUrls() {
  const urls = new Set(BWMI17_OFFICIAL_URLS);
  for (const file of SOURCE_FILES) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/url:\s*"(https:\/\/[^"\n]+)"/g)) urls.add(match[1]);
  }
  if (existsSync(ELECTRONICS_KNOWLEDGE_FILE)) {
    const graph = JSON.parse(await readFile(ELECTRONICS_KNOWLEDGE_FILE, "utf8"));
    const visit = (value) => {
      if (typeof value === "string") {
        if (value.startsWith("https://")) urls.add(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value && typeof value === "object") Object.values(value).forEach(visit);
    };
    visit(graph);
  }
  return [...urls].sort();
}

const ACCESS_PRIORITY = {
  unspecified: 0,
  public: 1,
  login_required: 2,
  broker_only: 3,
  offline: 4,
};

function exactHttpsUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.href === value ? value : null;
  } catch {
    return null;
  }
}

function productionKnowledgeLinks(graph) {
  const links = new Map();
  const add = (url, expectedAccess, reference, blocking = false) => {
    const exactUrl = exactHttpsUrl(url);
    if (!exactUrl) return;
    const existing = links.get(exactUrl) ?? {
      url: exactUrl,
      expectedAccess: "unspecified",
      references: [],
      blocking: false,
    };
    if (ACCESS_PRIORITY[expectedAccess] > ACCESS_PRIORITY[existing.expectedAccess]) {
      existing.expectedAccess = expectedAccess;
    }
    if (!existing.references.some((candidate) =>
      candidate.nodeId === reference.nodeId &&
      candidate.sourceVersionId === reference.sourceVersionId &&
      candidate.field === reference.field
    )) existing.references.push(reference);
    existing.blocking ||= blocking;
    links.set(exactUrl, existing);
  };

  for (const admission of graph.admissions ?? []) {
    add(admission?.evidence?.finalUrl, "public", {
      sourceVersionId: admission?.evidence?.sourceVersionId,
      state: "admitted",
      field: "evidence.finalUrl",
    }, true);
  }
  for (const node of graph.nodes ?? []) {
    if (node.kind === "filing_service") {
      add(node.payload?.canonicalUrl, node.payload?.access ?? "unspecified", {
        nodeId: node.id,
        state: node.state,
        field: "payload.canonicalUrl",
      }, node.state === "actionable");
    } else if (node.kind === "contact" && node.payload?.channel === "official_web") {
      add(node.payload?.value, "public", {
        nodeId: node.id,
        state: node.state,
        field: "payload.value",
      }, node.state === "actionable");
    } else if (node.kind === "policy_clause") {
      add(node.payload?.canonicalUrl, "public", {
        nodeId: node.id,
        state: node.state,
        field: "payload.canonicalUrl",
      }, node.state === "actionable");
    }
  }

  const visit = (value, path = "graph") => {
    if (typeof value === "string") {
      add(value, "unspecified", { field: path });
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) visit(item, `${path}.${key}`);
    }
  };
  visit(graph);
  return [...links.values()]
    .map((link) => ({ ...link, references: link.references.sort((left, right) =>
      JSON.stringify(left).localeCompare(JSON.stringify(right))) }))
    .sort((left, right) => left.url.localeCompare(right.url));
}

async function readProductionKnowledgeLinks() {
  if (!existsSync(ELECTRONICS_KNOWLEDGE_FILE)) {
    throw new Error(`Production electronics knowledge graph is missing: ${ELECTRONICS_KNOWLEDGE_FILE}`);
  }
  const graph = JSON.parse(await readFile(ELECTRONICS_KNOWLEDGE_FILE, "utf8"));
  return productionKnowledgeLinks(graph);
}

async function request(url, method) {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "text/html,application/pdf,*/*;q=0.8",
      Range: "bytes=0-1023",
      "User-Agent": "BWMI-17 official-source verifier (+https://buildwhatmovesindia.com/)",
    },
  });
  await response.body?.cancel();
  return { status: response.status, resolvedUrl: response.url };
}

async function requestWithCurl(url) {
  const { stdout } = await execFileAsync("curl", [
    "--location",
    "--max-time", String(Math.ceil(TIMEOUT_MS / 1000)),
    "--output", "/dev/null",
    "--range", "0-1023",
    "--silent",
    "--show-error",
    "--user-agent", "Mozilla/5.0 BWMI-17-official-source-verifier",
    "--write-out", "%{http_code}\n%{url_effective}",
    url,
  ]);
  const [status, resolvedUrl] = stdout.trim().split("\n");
  return { status: Number(status), resolvedUrl };
}

function statusMatchesAccess(status, expectedAccess) {
  const reachable = status >= 200 && status < 400;
  const accessControlled = status === 401 || status === 403;
  if (expectedAccess === "public") return reachable;
  if (expectedAccess === "login_required" || expectedAccess === "broker_only") {
    return reachable || accessControlled;
  }
  if (expectedAccess === "offline") return !reachable;
  return reachable || accessControlled;
}

async function verify({ url, expectedAccess = "unspecified", references = [], blocking = true }) {
  const host = new URL(url).hostname;
  if (
    !/(?:^|\.)(?:(?:gov|nic)\.in|gov\.cn)$/i.test(host) &&
    !ADMITTED_OFFICIAL_NON_GOV_HOSTS.has(host)
  ) {
    return { url, expectedAccess, references, blocking, ok: false, status: 0, detail: `non-official host ${host}` };
  }
  try {
    let result;
    try {
      result = await request(url, "HEAD");
      if (result.status === 405 || result.status >= 400) result = await request(url, "GET");
    } catch {
      result = await requestWithCurl(url);
    }
    const accessControlled = result.status === 401 || result.status === 403;
    return {
      url,
      expectedAccess,
      references,
      blocking,
      ok: statusMatchesAccess(result.status, expectedAccess),
      status: result.status,
      detail: accessControlled
        ? `official endpoint access-controlled as ${expectedAccess}; ${result.resolvedUrl}`
        : `${expectedAccess}; ${result.resolvedUrl}`,
      accessControlled,
    };
  } catch (error) {
    return {
      url,
      expectedAccess,
      references,
      blocking,
      ok: expectedAccess === "offline",
      status: 0,
      detail: `${expectedAccess}; ${error instanceof Error ? error.name : "request failed"}`,
    };
  }
}

const command = process.argv[2];
if (command === "--list-production-links") {
  console.log(JSON.stringify(await readProductionKnowledgeLinks()));
  process.exit(0);
}
if (command === "--list-ordinary-links") {
  console.log(JSON.stringify(await sourceUrls()));
  process.exit(0);
}

const productionMode = process.env.BWMI_VALIDATE_PRODUCTION_KNOWLEDGE === "1";
const links = productionMode
  ? await readProductionKnowledgeLinks()
  : (await sourceUrls()).map((url) => ({ url, expectedAccess: "unspecified", references: [], blocking: true }));
const results = [];
for (let index = 0; index < links.length; index += CONCURRENCY) {
  results.push(...await Promise.all(links.slice(index, index + CONCURRENCY).map(verify)));
}

const failures = results.filter((result) => !result.ok && result.blocking);
const pendingFailures = results.filter((result) => !result.ok && !result.blocking);
const accessControlled = results.filter((result) => result.accessControlled);
for (const failure of failures) {
  console.error(`FAIL ${failure.status || "ERR"} ${failure.url} (${failure.detail})`);
}
for (const result of pendingFailures) {
  console.log(`PENDING ${result.expectedAccess} ${result.status || "ERR"} ${result.url} (${result.detail})`);
}
for (const result of accessControlled) {
  console.log(`ACCESS ${result.expectedAccess} ${result.status} ${result.url}`);
}
console.log(
  `${productionMode ? "Production electronics knowledge" : "Official"}-link gate: ` +
  `${results.filter((result) => result.ok).length}/${results.length} resolved, ` +
  `${pendingFailures.length} evidence-pending non-blocking ` +
  `(${accessControlled.length} access-controlled official responses).`,
);
if (failures.length > 0) process.exitCode = 1;
