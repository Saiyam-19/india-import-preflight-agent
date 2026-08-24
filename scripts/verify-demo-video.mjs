import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";

const videoPath = resolve("docs/submission/india-import-preflight-bwmi-15-demo.webm");
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

try {
  await page.goto(pathToFileURL(videoPath).href);
  const video = page.locator("video");
  await video.waitFor();
  const metadata = await video.evaluate(async (element) => {
    if (element.readyState < HTMLMediaElement.HAVE_METADATA) {
      await new Promise((resolveMetadata, rejectMetadata) => {
        element.addEventListener("loadedmetadata", resolveMetadata, { once: true });
        element.addEventListener("error", rejectMetadata, { once: true });
      });
    }
    return {
      duration: element.duration,
      height: element.videoHeight,
      width: element.videoWidth,
    };
  });

  if (!Number.isFinite(metadata.duration) || metadata.duration < 30 || metadata.duration >= 120) {
    throw new Error(`Demo duration ${metadata.duration} is outside the 30–119 second release window.`);
  }
  if (metadata.width !== 1280 || metadata.height !== 720) {
    throw new Error(`Demo dimensions ${metadata.width}x${metadata.height} are not 1280x720.`);
  }

  for (const [name, time] of [
    ["opening", 3],
    ["middle", metadata.duration / 2],
    ["closing", metadata.duration - 2],
  ]) {
    await video.evaluate(async (element, seekTime) => {
      element.currentTime = seekTime;
      await new Promise((resolveSeek) => element.addEventListener("seeked", resolveSeek, { once: true }));
    }, time);
    await page.screenshot({ path: `/private/tmp/bwmi-15-video-${name}.png` });
  }

  console.log(`Demo video gate: ${metadata.duration.toFixed(1)} seconds, ${metadata.width}x${metadata.height}, three frames sampled.`);
} finally {
  await browser.close();
}
