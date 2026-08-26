import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import actionDossierFixture from "../fixtures/browser/action-dossier.json" with { type: "json" };

test.beforeEach(async ({ page }) => {
  await page.route("**/api/deep-research-capability", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ available: true, message: "Deep research available", model: "nvidia/nemotron-3.5-lightning:free" }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "New chat" }).click();
  await expect(page.getByRole("status")).toContainText("New conversation started");
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      resolve();
    });
  }));
});

function neutralUploadPdf() {
  const stream = "BT /F1 12 Tf 72 730 Td (TEST DOCUMENT - NOT VALID - NOT A CERTIFICATE) Tj 0 -22 Td (Document number: TEST-UI-1) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let output = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output));
    output += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(output);
  output += "xref\n0 6\n0000000000 65535 f \n";
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  output += `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(output);
}

type ChatMode = "instant" | "deep_research";

async function send(
  page: Page,
  question: string,
  mode: ChatMode = "instant",
  options: { waitForAssistantMessage?: boolean } = {},
) {
  if (mode === "deep_research") {
    await send(page, question, "instant");
  }
  const composer = page.getByLabel("Message India-China Trade Guidance");
  const timeout = process.env.RUN_LIVE_OPENAI_GUIDANCE === "1" ? 240_000 : 10_000;
  await page.evaluate(() => {
    const state = window as typeof window & {
      __bwmiChatBodies?: string[];
      __bwmiFetchPatched?: boolean;
    };
    if (state.__bwmiFetchPatched) return;
    state.__bwmiFetchPatched = true;
    state.__bwmiChatBodies = [];
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const requestUrl = typeof args[0] === "string"
        ? args[0]
        : args[0] instanceof URL
          ? args[0].href
          : args[0].url;
      if (new URL(requestUrl, window.location.href).pathname === "/api/chat") {
        void response.clone().text().then((body) => state.__bwmiChatBodies?.push(body));
      }
      return response;
    };
  });
  const previousBodyCount = await page.evaluate(() => (
    (window as typeof window & { __bwmiChatBodies?: string[] }).__bwmiChatBodies?.length ?? 0
  ));
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/chat") && response.request().method() === "POST",
    { timeout },
  );
  if (mode === "deep_research") {
    await page.getByRole("button", { name: "Research this case deeply" }).click();
  } else {
    await composer.fill(question);
    await page.getByRole("button", { name: "Send message" }).click();
  }
  const response = await responsePromise;
  if (options.waitForAssistantMessage !== false) {
    await expect(page.getByRole("article", { name: "Assistant message" }).last()).toBeVisible({ timeout });
  }
  await page.waitForFunction((count) => (
    ((window as typeof window & { __bwmiChatBodies?: string[] }).__bwmiChatBodies?.length ?? 0) > count
  ), previousBodyCount, { timeout });
  const body = await page.evaluate(() => (
    (window as typeof window & { __bwmiChatBodies?: string[] }).__bwmiChatBodies?.at(-1) ?? ""
  ));
  return {
    body,
    ok: response.ok(),
    requestBody: response.request().postDataJSON() as { mode?: ChatMode; question?: string; tradeCaseId?: string },
  };
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

async function interceptCompletePortalDossier(page: Page) {
  const listed = await page.request.get("/api/trade-cases");
  expect(listed.ok()).toBe(true);
  const { tradeCases } = await listed.json() as { tradeCases: Array<Record<string, unknown>> };
  const tradeCase = tradeCases[0];
  expect(tradeCase).toBeDefined();
  await page.route("**/api/chat", async (route) => {
    await route.fulfill({
      body: `${JSON.stringify({
        type: "result",
        output: {
          actionDossier: actionDossierFixture,
          claims: [],
          missingInformation: [],
          state: "action_required",
          summary: actionDossierFixture.decision.summary,
        },
        tradeCase,
      })}\n`,
      contentType: "application/x-ndjson",
      status: 200,
    });
  });
}

test("opens with an immediately usable composer and no case or form prerequisite", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns the first-screen contract.");

  const composer = page.getByLabel("Message India-China Trade Guidance");
  await expect(composer).toBeVisible();
  await expect(composer).toBeEnabled();
  await expect(page.getByLabel("Attach documents")).toBeAttached();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Can I import an industrial sensor module from China to India?", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "What documents do I need to export this product from India to China?", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Estimate the import duties for this product.", exact: true })).toBeVisible();
  const unavailable = page.getByRole("note", { name: "AI configuration required" });
  if (await unavailable.count() > 0) {
    await expect(unavailable).toContainText("Deep research is temporarily unavailable");
    await expect(unavailable).toContainText(/instant guidance.*saved facts.*uploaded-document/i);
  }
  await expect(page.locator(".assessment-form")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: /case/i })).toHaveCount(0);
  await expect(page.locator(".desktop-history, .mobile-history")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "New chat" })).toBeVisible();

  await send(page, "What rules apply to this router?");
  await expect(page.getByRole("article", { name: "Assistant message" }).last()).toContainText(
    "Is this shipment moving from China to India, or from India to China?",
  );
});

test("clarifies direction and product in chat, scopes the case internally, and restores memory", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns persistent conversation proof.");

  await send(page, "Can I import this Wi-Fi router from China to India?");
  await expect(page.getByRole("article", { name: "Assistant message" }).last()).toContainText(/exact make|model|principal function/i);

  const listed = await page.request.get("/api/trade-cases");
  expect(listed.ok()).toBe(true);
  const body = await listed.json() as {
    tradeCases: Array<{ confirmedFacts: Array<{ name: string; value: string }>; title: string }>;
  };
  const internalCase = body.tradeCases.find((tradeCase) =>
    tradeCase.title === "Can I import this Wi-Fi router from China to India?",
  );
  expect(internalCase?.confirmedFacts).toEqual(expect.arrayContaining([
    { name: "trade_direction", value: "china_to_india" },
    { name: "origin_country", value: "China" },
    { name: "destination_country", value: "India" },
  ]));

  await send(page, "The exact model is TP-Link Archer AX12 (IN), hardware version 1.8, a dual-band Wi-Fi router.");
  await page.reload();
  await expect(page.getByLabel("Conversation").getByText(
    "The exact model is TP-Link Archer AX12 (IN), hardware version 1.8, a dual-band Wi-Fi router.",
    { exact: true },
  )).toBeVisible();
  await expect(page.getByRole("button", { name: "Attach documents" })).toBeVisible();
});

test("saves ordinary purchased-shipment prose and switches to recovery without repeating supplied facts", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns the natural multi-turn recovery proof.");

  await send(page, "Can I bring a handheld thermal camera from China into India?");
  await send(page, "I bought 2 units for my business and paid USD 49.50 each. The supplier is in Shenzhen 518000 and delivery is to Mumbai 400001. It is model TC-2 and its job is measuring surface temperature. The datasheet specifies 230 V input. It has no radio transmitter or battery, has a camera, uses no encryption, comes retail packaged, and is not controlled or dual use. Shipping is CIF with USD 12 freight and USD 2 insurance.");

  const assessment = page.locator(".journey-assessment");
  await expect(assessment.getByRole("heading", { name: "Recovery steps" })).toBeVisible();
  await expect(assessment).toContainText("Saved from your answer");
  await expect(assessment).toContainText("Shenzhen 518000");
  await expect(assessment).toContainText("Mumbai 400001");
  const stillNeeded = page.getByRole("region", { name: "Missing information and next steps" });
  await expect(stillNeeded).toContainText(/invoice.*shipment status/is);
  await expect(stillNeeded).not.toContainText(/quantity|unit price|supplier location|delivery location|purpose/i);
  await expect(page.getByRole("heading", { name: "Decision and blockers" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Research this case deeply" })).toHaveCount(0);
});

test("New chat remains a clean durable case after reload", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns durable fresh-conversation semantics.");

  await send(page, "I already purchased 2 thermal cameras from China to India for commercial use at USD 49.50 each. It is paid but not dispatched and the invoice is unavailable.");
  await expect(page.getByRole("heading", { name: "Recovery steps" })).toBeVisible();

  await page.getByRole("button", { name: "New chat" }).click();
  await expect(page.getByRole("status")).toContainText("New conversation started");
  await page.reload();
  await send(page, "I want to import Wi-Fi routers from China to India.");

  const latest = page.getByRole("article", { name: "Assistant message" }).last();
  await expect(latest).not.toContainText(/thermal camera|paid but not dispatched|recovery steps|invoice is unavailable/i);
  for (const requiredText of [
    "Quantity, unit price and currency",
    "Origin and destination PIN/port",
    "Product URL, photo, model or datasheet",
    "Whether it is already purchased",
    "Invoice, bill or proof of purchase, if available",
    "Commercial or personal purpose",
    "Documents to prepare",
    "Classification and regulatory checks",
    "Exact policy paragraphs and page numbers",
    "Verified online forms",
    "Relevant points of contact",
    "Duties, costs, blockers and responsible owner",
    "Government submission portals",
    "verified link to the exact service/page",
    "documents uploaded there",
    "who must file",
    "login requirements",
    "fees/deadlines",
    "submission sequence",
    "If already purchased, I’ll switch from pre-order guidance to clearance/remediation guidance.",
    "never invent a portal or claim anything was submitted",
  ]) await expect(latest).toContainText(requiredText);
  await expect(page.getByRole("heading", { name: "Information needed" })).toBeVisible();
  const listed = await page.request.get("/api/trade-cases");
  const body = await listed.json() as { tradeCases: Array<{ confirmedFacts: Array<{ name: string; value: string }> }> };
  expect(body.tradeCases[0]?.confirmedFacts).not.toEqual(expect.arrayContaining([
    expect.objectContaining({ name: "purchase_stage", value: "already_purchased" }),
    expect.objectContaining({ name: "shipment_stage", value: "paid_not_dispatched" }),
  ]));
});

test("instant chat exposes one explicit deeply researched follow-up", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns the explicit deep-research action contract.");

  const instant = await send(page, "Before ordering, can I import a USB-C thermal imaging module from China to India?");
  expect(instant.requestBody.mode).toBe("instant");
  await expect(page.getByRole("heading", { name: "Information needed" })).toBeVisible();
  await expect(page.getByText(/make|model|part number|principal function/i).first()).toBeVisible();

  const deepAction = page.getByRole("button", { name: "Research this case deeply" });
  await expect(deepAction).toHaveCount(1);
  await expect(deepAction).toBeVisible();
  await expect(page.getByText("Optional. This checks broader product-specific sources and may take up to 5 minutes.")).toBeVisible();

  await page.route("**/api/chat", async (route) => {
    const body = route.request().postDataJSON() as { mode?: ChatMode };
    if (body.mode === "deep_research") {
      await route.fulfill({
        body: JSON.stringify({ error: "Deep research is intercepted by the deterministic browser regression." }),
        contentType: "application/json",
        status: 503,
      });
      return;
    }
    await route.continue();
  });
  const deepRequest = page.waitForRequest((request) => {
    if (!request.url().endsWith("/api/chat") || request.method() !== "POST") return false;
    return (request.postDataJSON() as { mode?: ChatMode }).mode === "deep_research";
  });
  await deepAction.click();
  expect((await deepRequest).postDataJSON()).toMatchObject({ mode: "deep_research" });
});

test("provider health failure keeps instant guidance usable and hides deep research", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns the provider recovery-state proof.");
  await page.unroute("**/api/deep-research-capability");
  await page.route("**/api/deep-research-capability", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        available: false,
        message: "Deep research is temporarily unavailable. Instant guidance and saved-case work remain available.",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.reload();
  await expect(page.getByRole("note", { name: "AI configuration required" })).toContainText(
    /deep research is temporarily unavailable.*instant guidance/is,
  );
  await send(page, "Before ordering, can I import a USB-C thermal imaging module from China to India?");
  await expect(page.getByRole("heading", { name: "Information needed" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Research this case deeply" })).toHaveCount(0);
});

test("uploads a document from the composer and asks for conversational confirmation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns document intake proof.");

  await page.getByLabel("Attach documents").setInputFiles({
    name: "test-invoice.pdf",
    mimeType: "application/pdf",
    buffer: neutralUploadPdf(),
  });
  await page.getByLabel("Document type").selectOption("commercial_invoice");
  await page.getByLabel(/I am authorised to process these documents/i).check();
  await page.getByRole("button", { name: "Upload and review" }).click();
  await expect(page.getByRole("article", { name: "Assistant message" }).last()).toContainText(/confirm or correct/i);
  await expect(page.getByText(/test-invoice\.pdf:/i)).toBeVisible();
  await expect(page.getByText("Conversation details", { exact: true })).toBeVisible();
});

test("desktop chat meets keyboard, accessibility, and overflow gates", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop owns this viewport gate.");

  const skipLink = page.getByRole("link", { name: "Skip to chat" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expect(page.locator("#chat-main")).toBeFocused();
  await expectNoHorizontalOverflow(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("360px chat keeps the composer and attachments usable without overflow", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-360", "Mobile owns this viewport gate.");

  await expect(page.getByLabel("Message India-China Trade Guidance")).toBeVisible();
  await expect(page.getByLabel("Attach documents")).toBeAttached();
  await expect(page.getByRole("button", { name: "Send message" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Can I import an industrial sensor module from China to India?", exact: true })).toBeVisible();
  await expect(page.locator(".assessment-form")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  const skipLink = page.getByRole("link", { name: "Skip to chat" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();

  await send(page, "Before ordering, can I import a USB-C thermal imaging module from China to India?");
  await expect(page.getByRole("heading", { name: "Information needed" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Decision and blockers" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ordered actions" })).toHaveCount(0);
  const deepAction = page.getByRole("button", { name: "Research this case deeply" });
  await expect(deepAction).toBeVisible();
  await deepAction.focus();
  await expect(deepAction).toBeFocused();
  await expectNoHorizontalOverflow(page);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("renders the router action dossier in importer-first order", async ({ page }, testInfo) => {
  test.skip(!["desktop", "mobile-360"].includes(testInfo.project.name), "Desktop and 360px own the dossier contract.");

  const response = await send(
    page,
    "Before purchase, I want to import a Wi-Fi router from China to India. Quantity: 20; unit price: USD 35; origin: Shenzhen 518000; destination: Mumbai 400001; product model: AX3000; principal function: wireless internet routing; product URL: https://example.com/ax3000; technical specifications: dual-band 2.4 GHz and 5 GHz Wi-Fi; commercial purpose; product form: finished product; product condition: new; retail prepackaged: yes; radio transmitter: yes; radio frequency: 2.4 GHz; transmit power: 0.1 W; public network connection: yes; telecom interface: IP; battery present: no; external power supply: yes; input voltage: 230 V; rated output: 12 W; camera present: no; encryption present: yes; controlled or dual use: no; Incoterm: CIF; freight: USD 12; insurance: USD 2.",
    "instant",
    { waitForAssistantMessage: false },
  );
  expect(response.ok).toBe(true);
  const assessment = page.locator(".readiness-assessment");
  const headings = assessment.getByRole("heading");
  await expect(headings).toHaveText(["Pending", "Decision and blockers", "Ordered actions"]);
  for (const label of ["Documents to prepare", "Exact policy locators", "Government submission portals", "Official contacts", "Costs and unresolved inputs", "Supporting citations"]) {
    await expect(assessment.getByText(label, { exact: true })).toBeVisible();
  }
  await assessment.getByText("Documents to prepare", { exact: true }).click();
  await assessment.getByText("Government submission portals", { exact: true }).click();
  await assessment.getByText("Exact policy locators", { exact: true }).click();
  await assessment.getByText("Official contacts", { exact: true }).click();
  await expect(assessment.getByText("Required", { exact: true }).first()).toBeVisible();
  await expect(assessment.getByText("Clear", { exact: true }).first()).toBeVisible();
  await expect(assessment.getByText("Pending", { exact: true }).first()).toBeVisible();
  await expect(assessment).toContainText("Pages: Pending");
  await expect(assessment).toContainText("Phone: 011-23350020");
  await expect(assessment).toContainText("Purpose: technical support of the portal funcionalities");
  const portalSection = assessment.locator("details").filter({ hasText: "Government submission portals" }).first();
  await expect(portalSection.locator('a[href="https://www.eservices.dot.gov.in/equipment-type-approval-eta"]')).toHaveCount(0);
  await expect(portalSection).not.toContainText(/Sequence\s*1/);
  await expect(portalSection).toContainText(/filing destination.*Pending|no submission link is released/i);
  await expectNoHorizontalOverflow(page);
  const results = await new AxeBuilder({ page }).include(".readiness-assessment").analyze();
  expect(results.violations).toEqual([]);
});

test("renders every verified government submission portal field and the no-submission boundary", async ({ page }, testInfo) => {
  test.skip(!["desktop", "mobile-360"].includes(testInfo.project.name), "Desktop and 360px own the portal presentation contract.");
  await interceptCompletePortalDossier(page);

  const response = await send(page, "Show the verified government submission portal steps.", "instant", {
    waitForAssistantMessage: false,
  });
  expect(response.ok).toBe(true);

  const portalSection = page.locator(".readiness-assessment details").filter({ hasText: "Government submission portals" }).first();
  await portalSection.getByText("Government submission portals", { exact: true }).click();
  const verifiedPortalLink = portalSection.locator('a[href="https://www.icegate.gov.in/services/e-sanchit"]');
  const verifiedPortal = verifiedPortalLink.locator("..");
  for (const text of [
    "eSANCHIT",
    "ICEGATE",
    "Login required",
    "Importer or customs broker",
    "Registered ICEGATE user",
    "No separate upload fee stated",
    "Before filing the Bill of Entry",
    "Documents uploaded here",
    "Commercial Invoice cum Packing List",
    "Transport document",
  ]) await expect(verifiedPortal.getByText(text, { exact: true })).toBeVisible();
  await expect(verifiedPortal.locator("dd")).toContainText(["ICEGATE", "Login required", "Importer or customs broker", "Registered ICEGATE user", "No separate upload fee stated", "Before filing the Bill of Entry", "1"]);
  await expect(verifiedPortalLink).toBeVisible();
  await expect(portalSection).toContainText("The app does not access this service, sign in, submit, upload, or pay on your behalf.");
  const pendingPortal = portalSection.locator('a[href="https://example.test/pending-filing"]').locator("..");
  await expect(pendingPortal.locator("dt")).toHaveText(["Authority", "Access", "Filer", "Login", "Fee", "Deadline", "Sequence"]);
  await expect(pendingPortal.locator("dd")).toHaveText([
    "Test authority pending verification",
    "Pending verification",
    "Pending verification",
    "Pending verification",
    "Pending verification",
    "Pending verification",
    "Pending verification",
  ]);
  await expect(pendingPortal.getByText("Documents uploaded here", { exact: true })).toBeVisible();
  await expect(pendingPortal.locator(".dossier-portal-documents p")).toHaveText("Pending verification");
  await expectNoHorizontalOverflow(page);
  const results = await new AxeBuilder({ page }).include(".readiness-assessment").analyze();
  expect(results.violations).toEqual([]);
});

test("configured Agents SDK handles an unseen electronics product without fixture leakage", async ({ page }, testInfo) => {
  test.setTimeout(process.env.BWMI_SECOND_BLACK_BOX_PRODUCT ? 600_000 : 300_000);
  test.skip(testInfo.project.name !== "desktop", "Desktop owns the live black-box gate.");
  test.skip(process.env.RUN_LIVE_OPENAI_GUIDANCE !== "1", "Requires a configured allowlisted Agents SDK provider path.");
  const product = process.env.BWMI_BLACK_BOX_PRODUCT;
  test.skip(!product, "BWMI_BLACK_BOX_PRODUCT must be supplied at runtime; the harness has no embedded product.");
  if (!product) return;

  const runProbe = async (activeProduct: string, probeNumber: number) => {
    const response = await send(
      page,
      `Before I order, can I import a ${activeProduct} from China to India, what is missing, and what will it cost?`,
      "deep_research",
    );
    expect(response.ok).toBe(true);
    const streamText = response.body;
    const events = streamText.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line) as {
      output?: Record<string, unknown>;
      phase?: string;
      type: string;
    });
    const result = [...events].reverse().find((event) => event.type === "result");
    expect(result?.output).toBeTruthy();
    await testInfo.attach(`live-provider-probe-${probeNumber}.json`, {
      body: JSON.stringify({ events, renderedText: await page.locator(".readiness-assessment").innerText() }, null, 2),
      contentType: "application/json",
    });

    const output = result!.output as {
      agencies?: unknown[];
      calculation?: { blockers?: string[]; status?: string } | null;
      claims?: Array<{ url?: string }>;
      classificationCandidates?: unknown[];
      confirmedFacts?: Array<{ name: string; value: string }>;
      documents?: unknown[];
      missingInformation?: string[];
      nextActions?: string[];
      risks?: string[];
      state?: string;
    };
    expect(output.state).toMatch(/assessment_incomplete|action_required/);
    expect(output.confirmedFacts).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "product_description", value: activeProduct }),
      expect.objectContaining({ name: "trade_direction", value: "china_to_india" }),
    ]));
    expect(output.missingInformation?.length).toBeGreaterThan(0);
    expect(output.classificationCandidates?.length).toBeGreaterThan(0);
    expect(output.agencies?.length).toBeGreaterThan(0);
    expect(output.documents?.length).toBeGreaterThan(0);
    expect(output.claims?.length).toBeGreaterThan(0);
    expect(output.claims?.every((claim) => /^https:\/\//.test(claim.url ?? ""))).toBe(true);
    expect(output.calculation === null || output.calculation?.status === "withheld" || output.calculation?.status === "available").toBe(true);
    if (output.calculation?.status === "withheld") expect(output.calculation.blockers?.length).toBeGreaterThan(0);
    expect(output.risks?.length).toBeGreaterThan(0);
    expect(output.nextActions?.length).toBeGreaterThan(0);
    expect(events.filter((event) => event.type === "activity").map((event) => event.phase))
      .toEqual(expect.arrayContaining(["searching", "checking"]));

    const assessment = page.locator(".readiness-assessment");
    await expect(assessment).toContainText(new RegExp(activeProduct.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    for (const heading of [
      "What is confirmed",
      "What is missing",
      "Classification candidates",
      "Applicable agencies and requirements",
      "Required documents",
      "Deterministic duty and tax estimate",
      "Validated official claims and citations",
      "Risks and unresolved issues",
      "Ordered next actions",
    ]) await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    await expect(assessment).not.toContainText(/Archer AX12|Wi-Fi router|bluetooth headphones|85176290/i);
    await expectNoHorizontalOverflow(page);
    return output;
  };

  const first = await runProbe(product, 1);
  const secondProduct = process.env.BWMI_SECOND_BLACK_BOX_PRODUCT;
  if (secondProduct) {
    await page.getByRole("button", { name: "New chat" }).click();
    const second = await runProbe(secondProduct, 2);
    expect(second).not.toEqual(first);
    expect(JSON.stringify(second)).not.toContain(product);
    expect(JSON.stringify(first)).not.toContain(secondProduct);
  }
});
