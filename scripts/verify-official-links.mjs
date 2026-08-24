import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const SOURCE_FILES = [
  "src/knowledge/router-pack.ts",
  "src/knowledge/headphones-pack.ts",
  "src/knowledge/camera-pack.ts",
];
const TIMEOUT_MS = Number(process.env.BWMI_LINK_TIMEOUT_MS ?? "20000");
const CONCURRENCY = Number(process.env.BWMI_LINK_CONCURRENCY ?? "6");
const execFileAsync = promisify(execFile);

async function sourceUrls() {
  const urls = new Set();
  for (const file of SOURCE_FILES) {
    const source = await readFile(file, "utf8");
    for (const match of source.matchAll(/url:\s*"(https:\/\/[^"\n]+)"/g)) urls.add(match[1]);
  }
  return [...urls].sort();
}

async function request(url, method) {
  const response = await fetch(url, {
    method,
    redirect: "follow",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Accept: "text/html,application/pdf,*/*;q=0.8",
      Range: "bytes=0-1023",
      "User-Agent": "BWMI-15 release link verifier (+https://buildwhatmovesindia.com/)",
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
    "--user-agent", "Mozilla/5.0 BWMI-15-release-verifier",
    "--write-out", "%{http_code}\n%{url_effective}",
    url,
  ]);
  const [status, resolvedUrl] = stdout.trim().split("\n");
  return { status: Number(status), resolvedUrl };
}

async function verify(url) {
  const host = new URL(url).hostname;
  if (!/(?:^|\.)(?:gov|nic)\.in$/i.test(host)) {
    return { url, ok: false, status: 0, detail: `non-official host ${host}` };
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
      ok: (result.status >= 200 && result.status < 400) || accessControlled,
      status: result.status,
      detail: accessControlled ? `official endpoint access-controlled; ${result.resolvedUrl}` : result.resolvedUrl,
      accessControlled,
    };
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.name : "request failed",
    };
  }
}

const urls = await sourceUrls();
const results = [];
for (let index = 0; index < urls.length; index += CONCURRENCY) {
  results.push(...await Promise.all(urls.slice(index, index + CONCURRENCY).map(verify)));
}

const failures = results.filter((result) => !result.ok);
const accessControlled = results.filter((result) => result.accessControlled);
for (const failure of failures) {
  console.error(`FAIL ${failure.status || "ERR"} ${failure.url} (${failure.detail})`);
}
for (const result of accessControlled) {
  console.log(`ACCESS ${result.status} ${result.url}`);
}
console.log(
  `Official-link gate: ${results.length - failures.length}/${results.length} resolved (${accessControlled.length} access-controlled official responses).`,
);
if (failures.length > 0) process.exitCode = 1;
