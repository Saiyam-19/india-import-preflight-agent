import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

const routerPdfFixture = fileURLToPath(
  new URL("../fixtures/synthetic-router-pro-forma-invoice.pdf", import.meta.url),
);

type JourneyOutcome = "Ready within checked scope" | "Blocked" | "Needs verification";

const products = [
  {
    name: "Wi-Fi router",
    model: "BWMI-MIMO-245-R1",
    manufacturer: "Reviewed router manufacturer",
    extraFields: [
      ["Adapter model", "BWMI-ADAPTER-12V-R1"],
    ],
  },
  {
    name: "Bluetooth headphones",
    model: "BWMI-OEBT-H1",
    manufacturer: "Reviewed headphone manufacturer",
    extraFields: [
      ["Battery manufacturer", "Reviewed battery manufacturer"],
      ["Battery model", "BWMI-LIION-B1"],
      ["Battery capacity (mAh)", "600"],
    ],
  },
  {
    name: "Indoor IP camera",
    model: "BWMI-IPCAM-245-C1",
    manufacturer: "Reviewed camera manufacturer",
    extraFields: [
      ["Adapter model", "BWMI-CAMERA-ADAPTER-12V-C1"],
    ],
  },
] as const;

async function completeJourney(page: Page, product: (typeof products)[number], outcome: JourneyOutcome) {
  await page.goto("/");
  await expect(page.getByText("Restricted promotion harness")).toHaveCount(0);
  await page.getByRole("radio", { name: product.name }).check();
  await page.getByLabel("Product scope").selectOption("matches_exact_scope");
  await page.getByLabel("Exact model", { exact: true }).fill(product.model);
  await page.getByLabel("Manufacturer", { exact: true }).fill(product.manufacturer);
  for (const [label, value] of product.extraFields) {
    await page.getByLabel(label, { exact: true }).fill(value);
  }

  await page.getByLabel("Country of origin").fill(outcome === "Needs verification" ? "" : "VN");
  await page.getByLabel("Indian importer").fill("BWMI importer India Pvt Ltd");
  await page.getByLabel("Producer", { exact: true }).fill("BWMI producer");
  await page.getByLabel("Exporter").fill("BWMI exporter");
  await page
    .getByLabel("Dated trade-remedy check")
    .selectOption(outcome === "Needs verification" ? "unknown" : "confirmed_no_match");

  await page.getByLabel("Item value (INR)").fill("99999.98");
  await page.getByLabel("Freight (INR)").fill("0.01");
  await page.getByLabel("Insurance (INR)").fill("0.01");

  const evidenceControls = page.locator("[data-evidence-rule]");
  for (let index = 0; index < (await evidenceControls.count()); index += 1) {
    await evidenceControls.nth(index).selectOption("present");
  }
  if (outcome === "Blocked") {
    await page.locator('[data-rule-id*="wpc_eta"]').selectOption("absent");
  }

  await page.getByRole("button", { name: "Run preflight" }).click();
  const result = page.getByRole("region", { name: "Preflight result" });
  await expect(result.getByRole("heading", { name: outcome })).toBeVisible();
  await expect(result.getByText("HS code", { exact: false })).toBeVisible();
  await expect(result.getByText("Source checked", { exact: false }).first()).toBeVisible();
  await expect(
    result.getByText(/Source checked 2026-08-24; review again by 2026-\d{2}-\d{2}/).first(),
  ).toBeVisible();

  if (outcome === "Needs verification") {
    await expect(result.getByText("Numeric cost withheld", { exact: false })).toBeVisible();
    await expect(result.getByRole("button", { name: "Update facts and rerun" })).toBeVisible();
  } else {
    await expect(result.getByText("₹43,960.00", { exact: true }).first()).toBeVisible();
    await expect(result.getByText("item value + freight + insurance", { exact: false })).toBeVisible();
  }
  if (outcome === "Blocked") {
    await expect(result.getByText("Customs-clearance blocker", { exact: true })).toBeVisible();
    await expect(result.getByRole("link", { name: /WPC|Equipment Type Approval/i }).first()).toHaveAttribute(
      "href",
      /^https:\/\//,
    );
  }
}

async function tabTo(page: Page, target: Locator, maximumTabs = 80) {
  for (let index = 0; index < maximumTabs; index += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Keyboard focus did not reach ${await target.getAttribute("name") ?? "target control"}.`);
}

async function typeWithKeyboard(page: Page, target: Locator, value: string) {
  await tabTo(page, target);
  await page.keyboard.type(value);
}

async function chooseOptionWithKeyboard(
  page: Page,
  target: Locator,
  optionLabel: string,
  expectedValue: string,
) {
  await tabTo(page, target);
  await page.keyboard.type(optionLabel);
  await expect(target).toHaveValue(expectedValue);
}

for (const product of products) {
  for (const outcome of [
    "Ready within checked scope",
    "Blocked",
    "Needs verification",
  ] as const) {
    test(`${product.name}: ${outcome}`, async ({ page }, testInfo) => {
      await completeJourney(page, product, outcome);

      if (
        process.env.BWMI_VISUAL_CAPTURE === "1" &&
        product.name === "Indoor IP camera" &&
        outcome === "Ready within checked scope"
      ) {
        await page.screenshot({
          path: `/private/tmp/bwmi-12-camera-${testInfo.project.name}.png`,
          fullPage: true,
        });
      }

      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
    });
  }
}

test("public journey is keyboard-usable, exposes three admitted choices plus Other product, and has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(page.getByRole("radio", { name: "Wi-Fi router" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Bluetooth headphones" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Indoor IP camera" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Other product" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to assessment" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Describe the exact shipment" })).toBeFocused();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("the Ready journey completes using only the keyboard and keeps release security headers", async ({ page }) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response!.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("DENY");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-powered-by"]).toBeUndefined();

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to assessment" });
  await expect(skipLink).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Describe the exact shipment" })).toBeFocused();

  const router = page.getByRole("radio", { name: "Wi-Fi router" });
  await tabTo(page, router);
  await page.keyboard.press("Space");
  await chooseOptionWithKeyboard(
    page,
    page.getByLabel("Product scope"),
    "This exact scope matches",
    "matches_exact_scope",
  );
  await typeWithKeyboard(page, page.getByLabel("Exact model", { exact: true }), "BWMI-MIMO-245-R1");
  await typeWithKeyboard(page, page.getByLabel("Manufacturer", { exact: true }), "Synthetic router manufacturer");
  await typeWithKeyboard(page, page.getByLabel("Adapter model", { exact: true }), "BWMI-ADAPTER-12V-R1");
  await typeWithKeyboard(page, page.getByLabel("Country of origin"), "VN");
  await typeWithKeyboard(page, page.getByLabel("Indian importer"), "Synthetic importer India Pvt Ltd");
  await typeWithKeyboard(page, page.getByLabel("Producer", { exact: true }), "Synthetic producer");
  await typeWithKeyboard(page, page.getByLabel("Exporter"), "Synthetic exporter");
  await chooseOptionWithKeyboard(
    page,
    page.getByLabel("Dated trade-remedy check"),
    "Confirmed no match for exact product and parties",
    "confirmed_no_match",
  );

  const evidenceControls = page.locator("[data-evidence-rule]");
  for (let index = 0; index < (await evidenceControls.count()); index += 1) {
    await chooseOptionWithKeyboard(
      page,
      evidenceControls.nth(index),
      "Present and exact",
      "present",
    );
  }

  await typeWithKeyboard(page, page.getByLabel("Item value (INR)"), "99999.98");
  await typeWithKeyboard(page, page.getByLabel("Freight (INR)"), "0.01");
  await typeWithKeyboard(page, page.getByLabel("Insurance (INR)"), "0.01");
  const runPreflight = page.getByRole("button", { name: "Run preflight" });
  await tabTo(page, runPreflight);
  await page.keyboard.press("Enter");

  const outcome = page.getByRole("heading", { name: "Ready within checked scope" });
  await expect(outcome).toBeVisible();
  await expect(outcome).toBeFocused();
  await expect(page.getByText("₹43,960.00", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/Source checked 2026-08-24; review again by/).first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const blockingViolations = accessibility.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(blockingViolations).toEqual([]);
});

test("restricted harness uses the shared journey without changing public eligibility", async ({ page }) => {
  await page.goto("/promotion-harness");
  await expect(page.getByText("Restricted promotion harness")).toBeVisible();
  await expect(page.getByRole("radio")).toHaveCount(4);
  await expect(page.getByText("source_admitted", { exact: false }).first()).toBeVisible();
});

test("Other product preserves universal facts and renders a fail-closed Customs Broker handoff", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Other product" }).check();

  await expect(page.getByText("Outside the supported catalog", { exact: false }).first()).toBeVisible();
  await expect(page.getByLabel("Product scope")).toHaveCount(0);
  await expect(page.getByLabel("Dated trade-remedy check")).toHaveCount(0);
  await expect(page.locator("[data-evidence-rule]")).toHaveCount(0);
  await expect(page.getByLabel("Synthetic router pro-forma invoice PDF")).toHaveCount(0);

  await page.getByLabel("Product description").fill("Outdoor solar-powered inventory tracker");
  await page.getByLabel("Exact model", { exact: true }).fill("TRACK-OUTDOOR-01");
  await page.getByLabel("Manufacturer", { exact: true }).fill("Example device manufacturer");
  await page.getByLabel("Overseas supplier").fill("Example overseas supplier");
  await page.getByLabel("Country of origin").fill("VN");
  await page.getByLabel("Indian importer").fill("Example importer India Pvt Ltd");
  await page.getByLabel("Producer", { exact: true }).fill("Example device producer");
  await page.getByLabel("Exporter").fill("Example exporter");
  await page.getByLabel("Shipment quantity").fill("250 units");
  await page.getByLabel("Incoterm").fill("CIF Mumbai");
  await page.getByLabel("Destination").fill("Nhava Sheva, Maharashtra");
  await page.getByLabel("Item value (INR)").fill("99999.98");
  await page.getByLabel("Freight (INR)").fill("0.01");
  await page.getByLabel("Insurance (INR)").fill("0.01");

  await page.getByRole("button", { name: "Run preflight" }).click();

  const result = page.getByRole("region", { name: "Preflight result" });
  await expect(result.getByRole("heading", { name: "Needs verification" })).toBeVisible();
  await expect(result.getByText("Classification withheld", { exact: true })).toBeVisible();
  await expect(result.getByText("Numeric cost withheld", { exact: true })).toBeVisible();
  await expect(result.getByRole("heading", { name: "Supported checks", exact: true })).toBeVisible();
  await expect(result.getByRole("heading", { name: "Unsupported checks", exact: true })).toBeVisible();
  await expect(result.getByRole("heading", { name: "Unresolved facts", exact: true })).toBeVisible();
  await expect(result.getByRole("heading", { name: "Professional review needed", exact: true })).toBeVisible();
  await expect(result.getByRole("heading", { name: "Customs Broker summary", exact: true })).toBeVisible();
  await expect(result.getByText("Outdoor solar-powered inventory tracker", { exact: true })).toBeVisible();
  await expect(result.getByText("CIF Mumbai", { exact: true })).toBeVisible();
  await expect(result.getByText("Nhava Sheva, Maharashtra", { exact: true })).toBeVisible();
  await expect(result.getByText(/licensed Customs Broker/i).first()).toBeVisible();
  await expect(result).not.toContainText(/Ready within checked scope|HS \d{8}|Basic Customs Duty|IGST/);
  await expect(result.getByRole("link")).toHaveCount(0);

  if (process.env.BWMI_14_VISUAL_CAPTURE === "1") {
    await page.screenshot({
      path: `/private/tmp/bwmi-14-other-product-${testInfo.project.name}.png`,
      fullPage: true,
    });
  }

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
});

test("one confirmed synthetic router invoice feeds the shared deterministic engine", async ({ page }, testInfo) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "Bluetooth headphones" }).check();
  await expect(page.getByText(/PDF extraction is verified only for the synthetic router invoice/i)).toBeVisible();
  await expect(page.getByLabel("Synthetic router pro-forma invoice PDF")).toHaveCount(0);

  await page.getByRole("radio", { name: "Wi-Fi router" }).check();
  const upload = page.getByLabel("Synthetic router pro-forma invoice PDF");
  await upload.setInputFiles({
    name: "router.png",
    mimeType: "image/png",
    buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
  });
  await expect(page.getByText(/images are not supported/i)).toBeVisible();

  await upload.setInputFiles(routerPdfFixture);
  const review = page.getByRole("region", { name: "Extracted invoice facts" });
  await expect(review.getByRole("heading", { name: /Review 13 extracted facts/i })).toBeVisible();
  await expect(review.getByText(/Page 1 · Router model row/i)).toBeVisible();
  await expect(review.getByText(/confidence/i).first()).toBeVisible();
  await expect(review).not.toContainText(/HS code|Ready within checked scope|total import duties/i);
  if (process.env.BWMI_13_VISUAL_CAPTURE === "1") {
    await review.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `/private/tmp/bwmi-13-extraction-review-${testInfo.project.name}.png`,
    });
  }

  await page.getByRole("button", { name: "Run preflight" }).click();
  await expect(page.getByText(/confirm and use every extracted fact/i)).toBeVisible();

  const manufacturerConfirmation = review.getByRole("checkbox", { name: "Confirm Manufacturer" });
  await manufacturerConfirmation.check();
  await review.getByLabel("Edit Manufacturer").fill("User-corrected manufacturer");
  await expect(manufacturerConfirmation).not.toBeChecked();
  await review.getByLabel("Edit Manufacturer").fill("Reviewed fixture manufacturer");

  const confirmations = review.getByRole("checkbox");
  for (let index = 0; index < (await confirmations.count()); index += 1) {
    await confirmations.nth(index).check();
  }
  await review.getByRole("button", { name: "Use 13 confirmed facts" }).click();

  await expect(page.getByLabel("Exact model", { exact: true })).toHaveValue("BWMI-MIMO-245-R1");
  await expect(page.getByLabel("Manufacturer", { exact: true })).toHaveValue("Reviewed fixture manufacturer");
  await expect(page.getByLabel("Adapter model", { exact: true })).toHaveValue("BWMI-ADAPTER-12V-R1");
  await expect(page.getByLabel("Country of origin", { exact: true })).toHaveValue("VN");
  await expect(page.getByLabel("Item value (INR)")).toHaveValue("99999.98");

  await page.getByLabel("Product scope").selectOption("matches_exact_scope");
  await page.getByLabel("Dated trade-remedy check").selectOption("confirmed_no_match");
  const evidenceControls = page.locator("[data-evidence-rule]");
  for (let index = 0; index < (await evidenceControls.count()); index += 1) {
    await evidenceControls.nth(index).selectOption("present");
  }

  await page.getByRole("button", { name: "Run preflight" }).click();
  const result = page.getByRole("region", { name: "Preflight result" });
  await expect(result.getByRole("heading", { name: "Ready within checked scope" })).toBeVisible();
  await expect(result.getByText("₹43,960.00", { exact: true }).first()).toBeVisible();

  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
});
