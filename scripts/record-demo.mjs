import { chromium } from "@playwright/test";

const baseURL = process.env.BWMI_DEMO_BASE_URL ?? "http://127.0.0.1:3210";
const output = "docs/submission/india-import-preflight-bwmi-15-demo.webm";

const browser = await chromium.launch({ headless: true, slowMo: 70 });
const context = await browser.newContext({
  baseURL,
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: ".demo-recording", size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const video = page.video();

async function pause(milliseconds = 1400) {
  await page.waitForTimeout(milliseconds);
}

async function fillSupportedProduct({
  product,
  model,
  manufacturer,
  extraFields,
  blocked = false,
}) {
  await page.getByRole("radio", { name: product }).check();
  await page.getByLabel("Product scope").selectOption("matches_exact_scope");
  await page.getByLabel("Exact model", { exact: true }).fill(model);
  await page.getByLabel("Manufacturer", { exact: true }).fill(manufacturer);
  for (const [label, value] of extraFields) await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByLabel("Country of origin").fill("VN");
  await page.getByLabel("Indian importer").fill("Synthetic importer India Pvt Ltd");
  await page.getByLabel("Producer", { exact: true }).fill("Synthetic producer");
  await page.getByLabel("Exporter").fill("Synthetic exporter");
  await page.getByLabel("Dated trade-remedy check").selectOption("confirmed_no_match");
  const evidence = page.locator("[data-evidence-rule]");
  for (let index = 0; index < (await evidence.count()); index += 1) {
    await evidence.nth(index).selectOption("present");
  }
  if (blocked) await page.locator('[data-rule-id*="wpc_eta"]').selectOption("absent");
  await page.getByLabel("Item value (INR)").fill("99999.98");
  await page.getByLabel("Freight (INR)").fill("0.01");
  await page.getByLabel("Insurance (INR)").fill("0.01");
}

try {
  await page.goto("/");
  await page.getByRole("heading", { name: "Know what is ready, blocked, or still unproven." }).waitFor();
  await pause(5000);

  const chooser = page.getByRole("group", { name: "Product coverage" });
  await chooser.scrollIntoViewIfNeeded();
  await page.getByRole("radio", { name: "Bluetooth headphones" }).check();
  await pause(1700);
  await page.getByRole("radio", { name: "Indoor IP camera" }).check();
  await pause(1700);
  await page.getByRole("radio", { name: "Wi-Fi router" }).check();
  await pause(2300);

  await fillSupportedProduct({
    product: "Wi-Fi router",
    model: "BWMI-MIMO-245-R1",
    manufacturer: "Synthetic router manufacturer",
    extraFields: [["Adapter model", "BWMI-ADAPTER-12V-R1"]],
  });
  await page.getByRole("button", { name: "Run preflight" }).scrollIntoViewIfNeeded();
  await pause(2200);
  await page.getByRole("button", { name: "Run preflight" }).click();
  const ready = page.getByRole("heading", { name: "Ready within checked scope" });
  await ready.waitFor();
  await ready.scrollIntoViewIfNeeded();
  await pause(5000);
  await page.getByRole("heading", { name: "Customs value and duties" }).scrollIntoViewIfNeeded();
  await pause(4500);
  await page.getByText(/Source checked 2026-08-24; review again by/).first().scrollIntoViewIfNeeded();
  await pause(4500);

  await page.goto("/");
  await fillSupportedProduct({
    product: "Bluetooth headphones",
    model: "BWMI-OEBT-H1",
    manufacturer: "Synthetic headphone manufacturer",
    extraFields: [
      ["Battery manufacturer", "Synthetic battery manufacturer"],
      ["Battery model", "BWMI-LIION-B1"],
      ["Battery capacity (mAh)", "600"],
    ],
    blocked: true,
  });
  await page.getByRole("button", { name: "Run preflight" }).scrollIntoViewIfNeeded();
  await pause(1800);
  await page.getByRole("button", { name: "Run preflight" }).click();
  const blocked = page.getByRole("heading", { name: "Blocked", exact: true });
  await blocked.waitFor();
  await blocked.scrollIntoViewIfNeeded();
  await pause(5000);
  await page.getByText("Customs-clearance blocker", { exact: true }).scrollIntoViewIfNeeded();
  await pause(5000);

  await page.goto("/");
  await page.getByRole("radio", { name: "Other product" }).check();
  await page.getByLabel("Product description").fill("Outdoor solar-powered inventory tracker");
  await page.getByLabel("Exact model", { exact: true }).fill("SYNTHETIC-TRACKER-01");
  await page.getByLabel("Country of origin").fill("VN");
  await page.getByLabel("Item value (INR)").fill("99999.98");
  await page.getByRole("button", { name: "Run preflight" }).scrollIntoViewIfNeeded();
  await pause(2200);
  await page.getByRole("button", { name: "Run preflight" }).click();
  const needs = page.getByRole("heading", { name: "Needs verification", exact: true });
  await needs.waitFor();
  await needs.scrollIntoViewIfNeeded();
  await pause(5000);
  await page.getByRole("heading", { name: "Customs Broker summary" }).scrollIntoViewIfNeeded();
  await pause(6500);
  await page.close();
  await video.saveAs(output);
} finally {
  await context.close();
  await browser.close();
}

console.log(`Demo video saved to ${output}`);
