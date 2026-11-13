import { readFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

// Fixed local inputs keep this render independent of the app and external services.
const globeUrl = new URL("../public/illustrations/social-network-globe-v1.png", import.meta.url);
const outputUrl = new URL("../public/social-preview-v4.jpg", import.meta.url);
const globe = (await readFile(globeUrl)).toString("base64");
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  await page.route("**/*", (route) => route.abort());
  await page.setContent(`<!doctype html>
    <html lang="en"><head><meta charset="utf-8"><style>
      * { box-sizing: border-box; }
      html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
      body { background: #090b10; color: #f5f6fa; font-family: Arial, sans-serif; }
      .card { position: relative; width: 1200px; height: 630px; overflow: hidden;
        background: radial-gradient(ellipse at 82% 50%, #ff6b3d08, transparent 48%), #090b10; }
      .globe { position: absolute; width: 500px; height: 500px; right: 18px; top: 65px;
        object-fit: contain; opacity: .9; }
      .copy { position: absolute; top: 145px; left: 72px; width: 590px; z-index: 1; }
      h1 { margin: 0; font-size: 104px; line-height: 1.05; font-weight: 600;
        letter-spacing: -5px; }
      .tagline { margin: 25px 0 0 5px; color: #f5f6fa; font-size: 52px;
        line-height: 1.12; font-weight: 500; letter-spacing: -1.4px; }
      .protocol { margin: 25px 0 0 6px; max-width: 530px; color: #c1c7d2;
        font-family: Georgia, serif; font-style: italic; font-size: 26px; line-height: 1.35; }
    </style></head><body><main class="card">
      <img class="globe" alt="" src="data:image/png;base64,${globe}">
      <div class="copy">
        <h1>Paykit</h1>
        <p class="tagline">Pay people,<br>not addresses</p>
        <p class="protocol">The open payment coordination protocol</p>
      </div>
    </main></body></html>`, { waitUntil: "load" });
  await page.locator("img").evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.evaluate(() => document.fonts.ready);
  const copyBounds = await page.locator(".copy").boundingBox();
  if (!copyBounds || copyBounds.x + copyBounds.width > 1136 || copyBounds.y + copyBounds.height > 566) {
    throw new Error("Social preview copy exceeds its safe bounds.");
  }
  await mkdir(new URL("../public/", import.meta.url), { recursive: true });
  const pixels = await page.screenshot({ type: "png", animations: "disabled" });
  const result = await sharp(pixels)
    .jpeg({
      quality: 85,
      chromaSubsampling: "4:4:4",
      mozjpeg: true,
      progressive: true,
      trellisQuantisation: true,
      overshootDeringing: true,
      optimiseScans: true,
    })
    .toFile(fileURLToPath(outputUrl));
  console.log(`Rendered ${fileURLToPath(outputUrl)} (1200 × 630; ${result.size} bytes).`);
} finally {
  await browser.close();
}
