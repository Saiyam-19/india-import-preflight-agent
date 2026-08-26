import { chromium } from "@playwright/test";

const baseURL = process.env.BWMI_DEMO_BASE_URL ?? "http://127.0.0.1:3210";
const output = "docs/submission/india-import-preflight-bwmi-15-demo.webm";
const completeRouterQuestion = "Before purchase, I want to import a Wi-Fi router from China to India. Quantity: 20; unit price: USD 35; origin: Shenzhen 518000; destination: Mumbai 400001; product model: AX3000; principal function: wireless internet routing; product URL: https://example.com/ax3000; technical specifications: dual-band 2.4 GHz and 5 GHz Wi-Fi; commercial purpose; product form: finished product; product condition: new; retail prepackaged: yes; radio transmitter: yes; radio frequency: 2.4 GHz; transmit power: 0.1 W; public network connection: yes; telecom interface: IP; battery present: no; external power supply: yes; input voltage: 230 V; rated output: 12 W; camera present: no; encryption present: yes; controlled or dual use: no; Incoterm: CIF; freight: USD 12; insurance: USD 2.";

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

async function startNewChat() {
  await page.getByRole("button", { name: "New chat" }).click();
  await page.getByRole("status").filter({ hasText: "New conversation started" }).waitFor();
}

async function send(question) {
  const messages = page.getByRole("article", { name: "Assistant message" });
  const previousCount = await messages.count();
  await page.getByLabel("Message India-China Trade Guidance").fill(question);
  await page.getByRole("button", { name: "Send message" }).click();
  await messages.nth(previousCount).waitFor({ timeout: 20_000 });
  return messages.nth(previousCount);
}

async function showBuildChoices() {
  await page.evaluate(() => {
    const panel = document.createElement("section");
    panel.setAttribute("aria-label", "How the assistant was built and why");
    panel.innerHTML = `
      <p>BUILD CHOICES</p>
      <h2>How it was built, and why</h2>
      <ul>
        <li><strong>One focused OpenAI Agents SDK agent</strong><span>Optional deep research for unfamiliar products.</span></li>
        <li><strong>Server-owned TypeScript tools</strong><span>Evidence admission, citations, calculations and readiness stay deterministic.</span></li>
        <li><strong>Separate local SQLite stores</strong><span>Conversation facts cannot become regulatory evidence.</span></li>
        <li><strong>Fail-closed product decisions</strong><span>Missing evidence remains Pending; instant guidance still works without a provider.</span></li>
      </ul>
      <small>Advisory only: no credential handling, government filing, payment, release or clearance.</small>
    `;
    Object.assign(panel.style, {
      background: "#f7f9f8",
      border: "2px solid #12394a",
      bottom: "32px",
      boxShadow: "0 18px 44px rgba(18, 57, 74, 0.18)",
      color: "#15252d",
      left: "50%",
      maxWidth: "840px",
      padding: "30px 34px",
      position: "fixed",
      transform: "translateX(-50%)",
      width: "calc(100% - 64px)",
      zIndex: "1000",
    });
    const heading = panel.querySelector("h2");
    if (heading instanceof HTMLElement) Object.assign(heading.style, { fontSize: "34px", margin: "4px 0 22px" });
    const label = panel.querySelector("p");
    if (label instanceof HTMLElement) Object.assign(label.style, { fontSize: "13px", fontWeight: "700", letterSpacing: "0.12em", margin: "0" });
    const list = panel.querySelector("ul");
    if (list instanceof HTMLElement) Object.assign(list.style, { display: "grid", gap: "14px", listStyle: "none", margin: "0 0 22px", padding: "0" });
    for (const item of panel.querySelectorAll("li")) Object.assign(item.style, { borderTop: "1px solid #aab9bf", display: "grid", gap: "4px", paddingTop: "12px" });
    for (const detail of panel.querySelectorAll("span")) Object.assign(detail.style, { color: "#455b65", fontSize: "16px" });
    document.body.append(panel);
  });
}

try {
  await page.goto("/");
  await startNewChat();
  await page.getByRole("heading", { name: "Ask about India-China trade" }).waitFor();
  await pause(3500);

  await send("I want to import Wi-Fi routers from China to India.");
  await page.getByRole("heading", { name: "Information needed" }).scrollIntoViewIfNeeded();
  await pause(11_000);

  await startNewChat();
  await send(completeRouterQuestion);
  const assessment = page.locator(".readiness-assessment");
  await assessment.getByRole("heading", { name: "Pending" }).waitFor();
  await assessment.scrollIntoViewIfNeeded();
  await pause(10_000);

  await assessment.getByText("Documents to prepare", { exact: true }).click();
  await assessment.getByText("Exact policy locators", { exact: true }).click();
  await assessment.getByText("Government submission portals", { exact: true }).click();
  await assessment.getByText("Official contacts", { exact: true }).click();
  await assessment.getByText("Government submission portals", { exact: true }).scrollIntoViewIfNeeded();
  await pause(12_000);

  await assessment.getByText("Exact policy locators", { exact: true }).scrollIntoViewIfNeeded();
  await pause(8500);
  await assessment.getByText("Official contacts", { exact: true }).scrollIntoViewIfNeeded();
  await pause(7500);

  await startNewChat();
  await send("Can I bring a handheld thermal camera from China into India?");
  await send("I bought 2 units for my business at USD 49.50 each. The supplier is in Shenzhen 518000 and delivery is to Mumbai 400001. Model TC-2; principal function: surface temperature measurement; datasheet: 230 V input. It is paid but not dispatched and the invoice is unavailable. It has no radio transmitter or battery, has a camera, uses no encryption, comes retail packaged, and is not controlled or dual use. Shipping is CIF with USD 12 freight and USD 2 insurance.");
  const recovery = page.locator(".journey-assessment");
  await recovery.getByRole("heading", { name: "Recovery steps" }).waitFor();
  await recovery.scrollIntoViewIfNeeded();
  await pause(13_000);

  await page.getByText("Conversation details", { exact: true }).click();
  await page.getByText("Evidence boundary", { exact: true }).click();
  await page.getByText("Evidence boundary", { exact: true }).scrollIntoViewIfNeeded();
  await showBuildChoices();
  await pause(25_000);
  await page.close();
  await video.saveAs(output);
} finally {
  await context.close();
  await browser.close();
}

console.log(`Demo video saved to ${output}`);
