import { spawnSync } from "node:child_process";

const args = process.argv.slice(2).filter((value) => value !== "--");
const option = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};
const optionIndexes = new Set(args.flatMap((value, index) => value.startsWith("--") ? [index, index + 1] : []));
const product = (option("--product") ?? process.env.BWMI_UNSEEN_ELECTRONICS_PRODUCT ?? args
  .filter((_value, index) => !optionIndexes.has(index))
  .join(" ")).trim();
const specifications = (option("--spec") ?? "runtime-only technical specifications").trim();
const characteristicsText = option("--characteristics") ?? JSON.stringify([
  { id: "radio.transmitter_present", value: true },
  { id: "radio.frequency_hz", value: 2.4, unit: "ghz" },
]);
if (!product) {
  console.error('Usage: pnpm test:unseen-harness -- --product "runtime electronics" [--spec "..."] [--characteristics JSON]');
  process.exit(2);
}
let characteristics;
try {
  characteristics = JSON.parse(characteristicsText);
} catch {
  console.error("--characteristics must be valid JSON.");
  process.exit(2);
}
if (!Array.isArray(characteristics) || characteristics.length === 0) {
  console.error("--characteristics must be a non-empty JSON array.");
  process.exit(2);
}
if (characteristics.some((entry) => !entry || typeof entry !== "object" || typeof entry.id !== "string" || /product[._-]?name/i.test(entry.id))) {
  console.error("Characteristics must be frozen trait records; product-name selection is forbidden.");
  process.exit(2);
}

const result = spawnSync(
  "pnpm",
  [
    "exec",
    "vitest",
    "run",
    "tests/agent-first/electronics-dossier.test.ts",
    "-t",
    "runs a runtime-supplied unseen electronics payload",
  ],
  {
    env: {
      ...process.env,
      BWMI_HARNESS_PRODUCT: product,
      BWMI_HARNESS_SPECIFICATIONS: specifications,
      BWMI_HARNESS_CHARACTERISTICS: JSON.stringify(characteristics),
      BWMI_REQUIRE_HARNESS_PRODUCT: "1",
    },
    stdio: "inherit",
  },
);

process.exit(result.status ?? 1);
