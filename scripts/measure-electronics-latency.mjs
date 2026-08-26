import { spawnSync } from "node:child_process";

const engineOnly = process.argv.includes("--engine-only");
const unknown = process.argv.slice(2).filter((argument) => argument !== "--engine-only");
if (unknown.length > 0) {
  console.error("Usage: node scripts/measure-electronics-latency.mjs [--engine-only]");
  process.exit(2);
}

const result = spawnSync(
  "pnpm",
  ["exec", "vitest", "run", "tests/agent-first/electronics-latency.test.ts", "--reporter=verbose"],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      BWMI_ELECTRONICS_LATENCY_MODE: engineOnly ? "engine-only" : "route",
      OPENAI_API_KEY: "",
      OPENROUTER_API_KEY: "",
      BWMI_OPENAI_BASE_URL: "",
      BWMI_OPENAI_MODEL: "",
    },
    encoding: "utf8",
  },
);

if (result.status !== 0) {
  process.stdout.write(result.stdout ?? "");
  process.stderr.write(result.stderr ?? "");
  process.exit(result.status ?? 1);
}

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if (engineOnly) {
  const match = output.match(/BWMI_ELECTRONICS_ENGINE_P95_MS=([0-9.]+)/);
  if (!match) {
    process.stderr.write("The direct-engine latency test did not emit a p95 measurement.\n");
    process.exit(1);
  }
  const p95Ms = Number(match[1]);
  process.stdout.write(`${JSON.stringify({ mode: "engine-only", p95Ms, targetMs: 2000, passed: p95Ms < 2000 })}\n`);
  process.exit(p95Ms < 2000 ? 0 : 1);
}

const firstResponse = output.match(/BWMI_ELECTRONICS_FIRST_RESPONSE_P95_MS=([0-9.]+)/);
const dossier = output.match(/BWMI_ELECTRONICS_ROUTE_DOSSIER_P95_MS=([0-9.]+)/);
if (!firstResponse || !dossier) {
  process.stderr.write("The direct route latency test did not emit both frozen p95 measurements.\n");
  process.exit(1);
}
const firstResponseP95Ms = Number(firstResponse[1]);
const dossierP95Ms = Number(dossier[1]);
const passed = firstResponseP95Ms < 1000 && dossierP95Ms < 2000;
process.stdout.write(`${JSON.stringify({
  mode: "route",
  noProvider: true,
  firstUsefulIntake: { p95Ms: firstResponseP95Ms, targetMs: 1000, passed: firstResponseP95Ms < 1000 },
  dossier: { p95Ms: dossierP95Ms, targetMs: 2000, passed: dossierP95Ms < 2000 },
  passed,
})}\n`);
process.exit(passed ? 0 : 1);
