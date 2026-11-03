import { test, expect } from "@playwright/test";

test("the public launch serves HTML, RSC, and calendars without a session", async ({
  request,
}) => {
  const attempts: Record<string, string>[] = [
    {},
    { Cookie: "paykit_access=v1.9999999999.forged" },
  ];
  for (const headers of attempts) {
    const response = await request.get("/", { headers, maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(response.headers().location).toBeUndefined();
    expect(await response.text()).toContain("BitBox");
    expect(await response.text()).toContain('data-testid="payment-story"');
    expect(response.headers()["x-robots-tag"]).toBeUndefined();
    expect(response.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["set-cookie"]).toBeUndefined();
  }
  const rsc = await request.get("/?_rsc=security-check", {
    headers: { RSC: "1" },
  });
  expect(rsc.status()).toBe(200);
  expect(rsc.headers()["content-type"]).toContain("text/x-component");
  expect(await rsc.text()).toContain("payment-scene");
  expect(await rsc.text()).toContain("BitBox");
  const calendar = await request.get("/api/calendar", { maxRedirects: 0 });
  expect(calendar.status()).toBe(200);
  expect(calendar.headers()["content-type"]).toContain("text/calendar");
  expect(calendar.headers()["cache-control"]).toBe("public, max-age=3600, must-revalidate");
  expect(await calendar.text()).toContain("BEGIN:VCALENDAR");
  for (const path of ["/access", "/api/access", "/api/logout"]) {
    expect((await request.get(path, { maxRedirects: 0 })).status(), path).toBe(
      404,
    );
  }
  for (const path of ["/api/access", "/api/logout"]) {
    const legacyPost = await request.post(path, { maxRedirects: 0 });
    expect(legacyPost.status(), path).toBe(404);
    expect(legacyPost.headers()["set-cookie"]).toBeUndefined();
  }
});

test("anonymous social previews describe the public landing page", async ({
  request,
}) => {
  const canonical = "https://paykit.to/";
  const imageUrl = new URL("/social-preview-v3.png", canonical).href;
  const title = "Paykit — Pay. Get paid.";
  const description =
    "Paykit is the open payment coordination protocol. Pay a person and let your wallet handle the payment logistics.";
  for (const userAgent of [
    "Mozilla/5.0",
    "Twitterbot/1.0",
    "facebookexternalhit/1.1",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  ]) {
    const headers = { "User-Agent": userAgent };
    const response = await request.get("/", { headers, maxRedirects: 0 });
    expect(response.status(), userAgent).toBe(200);
    expect(new URL(response.url()).pathname).toBe("/");
    expect(response.headers()["x-robots-tag"]).toBeUndefined();
    const html = await response.text();
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
    expect(
      head,
      `social metadata must be in the head for ${userAgent}`,
    ).toBeTruthy();
    const metadata = new Map<string, string>();
    for (const tag of head!.matchAll(/<meta\b[^>]*>/gi)) {
      const attributes = new Map(
        [...tag[0].matchAll(/([\w:-]+)\s*=\s*"([^"]*)"/g)].map(
          ([, name, value]) => [name.toLowerCase(), value] as const,
        ),
      );
      const name = attributes.get("property") || attributes.get("name");
      if (name && attributes.has("content"))
        metadata.set(name, attributes.get("content")!);
    }
    for (const [name, value] of Object.entries({
      "og:title": title,
      "og:description": description,
      "og:url": canonical,
      "og:image": imageUrl,
      "og:image:width": "1200",
      "og:image:height": "630",
      "og:image:type": "image/png",
      "og:image:alt": "Paykit — The open payment coordination protocol.",
      "twitter:card": "summary_large_image",
      "twitter:title": title,
      "twitter:description": description,
      "twitter:image": imageUrl,
      "twitter:image:alt": "Paykit — The open payment coordination protocol.",
    })) {
      const actual = metadata.get(name);
      expect(
        name === "og:url" && actual ? new URL(actual).href : actual,
        `${name} for ${userAgent}`,
      ).toBe(value);
    }
    expect(metadata.get("robots")).toMatch(/\bindex\b/);
    expect(metadata.get("robots")).toMatch(/\bfollow\b/);
    expect(metadata.get("robots")).not.toContain("noindex");
    expect(html).toContain('data-testid="payment-story"');
    expect(html).toContain("BitBox");
  }

  const image = await request.get("/social-preview-v3.png", {
    maxRedirects: 0,
  });
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const png = await image.body();
  expect(
    png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  ).toBe(true);
  expect(png.readUInt32BE(16)).toBe(1200);
  expect(png.readUInt32BE(20)).toBe(630);
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toMatch(/^Allow:\s*\/$/m);
  expect(await robots.text()).not.toMatch(/^Disallow:\s*\/$/m);
});

test("visitors can browse the public page at desktop and phone widths", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Pay. Get paid.",
  );
  await expect(page.locator("iframe")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: /Bitkit/i }).first(),
  ).toHaveAttribute("href", /https:\/\/bitkit\.to\/?$/);
  await expect(
    page.getByRole("link", { name: /Pubky Market/i }).first(),
  ).toHaveAttribute("href", "https://staging.pubky.app/shop");
  const conference = page.getByRole("region", { name: "Meet us in El Salvador" });
  await expect(conference).toContainText("29–30 January 2027");
  await expect(conference).toContainText("San Salvador");
  await expect(conference).toContainText(
    "Details about our talks and where to find us will follow.",
  );
  await expect(
    conference.getByRole("link", { name: "Explore Plan ₿ Forum" }),
  ).toHaveAttribute("href", "https://planb.sv/");
  await expect(page.getByText(/Lugano|UTXO Room|16:15–17:00/)).toHaveCount(0);
  const calendar = await page.request.get("/api/calendar");
  expect(calendar.headers()["content-type"]).toContain("text/calendar");
  expect(calendar.headers()["content-disposition"]).toContain(
    "paykit-planb-el-salvador-2027.ics",
  );
  expect(calendar.headers()["cache-control"]).toBe("public, max-age=3600, must-revalidate");
  expect(await calendar.text()).toContain("DTSTART;VALUE=DATE:20270129");
  await expect(
    page.getByRole("link", { name: "Save the dates" }),
  ).toHaveAttribute("href", "/api/calendar");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Save the dates" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("paykit-planb-el-salvador-2027.ics");
  const googleCalendar = new URL(
    (await page
      .getByRole("link", { name: "Google Calendar" })
      .getAttribute("href")) as string,
  );
  expect(googleCalendar.searchParams.get("dates")).toBe(
    "20270129/20270131",
  );
  expect(googleCalendar.searchParams.get("details")).toContain(
    "Meet the Paykit/Pubky team (Synonym).",
  );
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: "test-results/desktop-hero.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-hero.png" });
  expect(errors).toEqual([]);
});

test("video loads on demand and the inquiry composer prepares a structured email", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("iframe")).toHaveCount(0);
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<p>Video test frame</p>",
    }),
  );
  await page.getByRole("button", { name: /Play the Paykit teaser/ }).click();
  await expect(page.locator("iframe")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/cQi8QkG_y4Y/,
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Page.enable");
  const draft = new Promise<string>((resolve) => {
    cdp.on("Page.frameRequestedNavigation", (event) => {
      if (event.url.startsWith("mailto:")) resolve(event.url);
    });
  });
  await page.getByLabel("Your name").fill("Integration Test");
  await page.getByLabel("Email address").fill("test@example.com");
  await page.getByLabel("Organization").fill("Example Wallet");
  await page.getByLabel("I’m interested in").selectOption("Wallet integration");
  await page
    .getByLabel("Tell us a little more")
    .fill("I would like to integrate Paykit.");
  await page.getByRole("button", { name: /Open email draft/ }).click();
  const uri = new URL(await draft);
  expect(uri.pathname).toBe("info@synonym.to");
  expect(uri.searchParams.get("subject")).toContain("Wallet integration");
  expect(uri.searchParams.get("body")).toContain("Example Wallet");
  expect(uri.searchParams.get("body")).toContain("test@example.com");
  await expect(page.getByRole("status")).toContainText("email app");
});

test("the payment story separates discovery from payment and supports reduced motion", async ({
  page,
}) => {
  const publicScriptBodies: Promise<string>[] = [];
  page.on("response", (response) => {
    if (
      new URL(response.url()).pathname.startsWith("/_next/static/") &&
      response.request().resourceType() === "script" &&
      response.ok()
    ) {
      publicScriptBodies.push(response.text());
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const story = page.getByTestId("payment-story");
  await story.scrollIntoViewIfNeeded();
  await expect(story.getByText(/XMR|Monero/)).toHaveCount(0);
  await expect(story).toHaveAttribute("data-active-step", "4");
  expect(publicScriptBodies.length).toBeGreaterThan(0);
  const loadedScripts = await Promise.all(publicScriptBodies);
  expect(
    loadedScripts.some((code) => code.includes("payment-story-toggle")),
  ).toBe(true);
  for (const code of loadedScripts) {
    expect(code).not.toContain("BitBox");
    expect(code).not.toContain("Alice wants to pay");
  }
  const route = story.getByTestId("payment-route");
  const discovery = story.getByTestId("payment-discovery");
  const discoveryLinks = story.getByTestId("payment-discovery-links");
  const query = story.getByTestId("payment-query");
  async function expectDirectPaymentWithoutPaykit() {
    await expect(discovery).toHaveCSS("opacity", "0");
    await expect(route).toHaveCSS("opacity", "1");
  }
  const title = story.getByTestId("payment-story-heading").getByRole("heading");
  const walletLogos = story.locator("[data-wallet] > img");
  await expect(walletLogos).toHaveCount(6);
  await expect
    .poll(() =>
      walletLogos.evaluateAll((images) =>
        images.every((image) => {
          const logo = image as HTMLImageElement;
          return logo.complete && logo.naturalWidth > 0 && logo.alt.length > 0;
        }),
      ),
    )
    .toBe(true);
  await expect(story.getByText("Speaks Paykit", { exact: true })).toHaveCount(
    0,
  );
  await expect(
    story.getByText("Wallets use Paykit to discover payment options.", {
      exact: true,
    }),
  ).toHaveCount(0);
  let neutralCards: string[][] = [];
  const cardStyles = () =>
    story.locator("[data-wallet]").evaluateAll((cards) =>
      cards.map((card) => {
        const css = getComputedStyle(card);
        return [
          css.borderColor,
          css.backgroundImage,
          css.boxShadow,
          css.opacity,
        ];
      }),
    );
  for (const step of [0, 1, 2, 3, 4]) {
    const button = story.locator(`button[data-step="${step}"]`);
    await button.click();
    await expect(story).toHaveAttribute("data-active-step", String(step));
    await expect(button).toHaveAttribute("aria-current", "step");
    await expect(route).toHaveCSS("opacity", step === 4 ? "1" : "0");
    await expect(discovery).toHaveCSS(
      "opacity",
      [1, 2, 3].includes(step) ? "1" : "0",
    );
    await expect(story.getByTestId("payment-discovery-node")).toHaveCSS(
      "opacity",
      step === 2 ? "0.2" : "1",
    );
    await expect(story.locator('[data-person="Alice"]')).toHaveCSS(
      "opacity",
      "1",
    );
    await expect(story.locator('[data-person="Bob"]')).toHaveCSS(
      "opacity",
      [2, 3].includes(step) ? "0.2" : "1",
    );
    await expect(discoveryLinks).toHaveCSS("opacity", step === 1 ? "1" : "0");
    await expect(query).toHaveCSS("opacity", step === 3 ? "1" : "0");
    if (step === 1) {
      const node = story.getByTestId("payment-discovery-node");
      await expect(node.getByText("Paykit", { exact: true })).toHaveCount(1);
      await expect(node.getByText("Alice", { exact: true })).toHaveCount(1);
      await expect(node.getByText("Bob", { exact: true })).toHaveCount(1);
      await expect(
        node.locator("img, [data-summary-wallet], [data-summary-currency]"),
      ).toHaveCount(0);
      for (const [person, rails] of [
        [
          "Alice",
          [
            "Bitcoin on-chain",
            "Lightning",
            "USDT · Arbitrum",
            "PayPal · USD",
            "USD / GBP transfer",
          ],
        ],
        [
          "Bob",
          [
            "L1 Ethereum",
            "EUR/CHF transfer",
            "Bitcoin on-chain",
          ],
        ],
      ] as const) {
        const summary = node.locator(`[data-summary-person="${person}"]`);
        await expect(summary.locator("[data-summary-rail]")).toHaveText([
          ...rails,
        ]);
      }
      const connectedWallets = await discovery
        .locator("[data-discovery-wallet]")
        .evaluateAll((paths) =>
          [
            ...new Set(
              paths
                .filter((path) => {
                  const rect = path.getBoundingClientRect();
                  return rect.width > 0 && rect.height > 0;
                })
                .map((path) => path.getAttribute("data-discovery-wallet")),
            ),
          ].sort(),
        );
      expect(connectedWallets).toEqual([
        "BitBox",
        "Bitkit",
        "PayPal",
        "Revolut",
        "WDK",
        "Wise",
      ]);
    }
    if (step === 0) neutralCards = await cardStyles();
    if (step === 1) await expect(title).toContainText("Paykit");
    if (step === 2) {
      await expect(title).toContainText("$10");
      const instructionCards = await cardStyles();
      expect(instructionCards[0]).not.toEqual(neutralCards[0]);
      expect(instructionCards.slice(1)).toEqual(neutralCards.slice(1));
      await expect(story.getByTestId("payment-intent-recipient")).toHaveCSS(
        "opacity",
        "1",
      );
      await expect(story.getByTestId("payment-intent-amount")).toHaveCSS(
        "opacity",
        "1",
      );
      const btcLabels = story.locator('[data-wallet] [data-currency="BTC"]');
      for (const btc of await btcLabels.all()) {
        await expect(btc).toHaveCSS("color", "rgb(196, 208, 223)");
      }
    }
    if (step === 3) {
      await expect(title).toContainText(/rail/i);
      await expect(
        query.getByText("How can I pay Bob?", { exact: true }),
      ).toHaveCount(1);
      await expect(
        query.getByText("BTC: bc1q5ayp...", { exact: true }),
      ).toHaveCSS("opacity", "1");
      await expect(story).toHaveAttribute("data-step-one-third", "true");
      await expect(story).toHaveAttribute("data-step-two-thirds", "true");
      for (const responseId of [
        "payment-query-response",
        "payment-query-response-mobile",
      ]) {
        await expect(story.getByTestId(responseId)).toHaveCSS(
          "visibility",
          "visible",
        );
      }
      const discoveryCards = await cardStyles();
      expect(discoveryCards[0]).not.toEqual(neutralCards[0]);
      expect(discoveryCards.slice(1)).toEqual(neutralCards.slice(1));
      const btcLabels = discovery.locator(
        '[data-summary-rail="bitcoin-onchain"]',
      );
      await expect(btcLabels).toHaveCount(2);
      for (const btc of await btcLabels.all()) {
        await expect(btc).toHaveCSS("color", "rgb(255, 172, 127)");
      }
      const otherCurrencies = story.locator(
        '[data-wallet] [data-currency], [data-summary-rail]:not([data-summary-rail="bitcoin-onchain"])',
      );
      for (const currency of await otherCurrencies.all()) {
        await expect(currency).toHaveCSS("color", "rgb(196, 208, 223)");
      }
    }
    if (step === 4) {
      await expect(title).toContainText(/direct/i);
      await expectDirectPaymentWithoutPaykit();
      const btcLabels = story.locator('[data-wallet] [data-currency="BTC"]');
      for (const btc of await btcLabels.all()) {
        await expect(btc).toHaveCSS("color", "rgb(255, 172, 127)");
      }
    }
  }
  await story.locator('button[data-step="1"]').focus();
  await page.keyboard.press("Enter");
  await expect(story).toHaveAttribute("data-active-step", "1");

  await page.setViewportSize({ width: 360, height: 1000 });
  await story.scrollIntoViewIfNeeded();
  const bitkit = story.locator('[data-wallet="Bitkit"]');
  const paypal = story.locator('[data-wallet="PayPal"]');
  expect((await bitkit.boundingBox())!.y).toBeLessThan(
    (await paypal.boundingBox())!.y,
  );
  const bitbox = story.locator('[data-wallet="BitBox"]');
  const wdk = story.locator('[data-wallet="WDK"]');
  expect((await wdk.boundingBox())!.y).toBeGreaterThan(
    (await bitbox.boundingBox())!.y,
  );
  for (const [wallet, currencies] of [
    ["Bitkit", ["BTC", "Lightning", "USDT"]],
    ["Wise", ["USD", "GBP"]],
    ["BitBox", ["ETH"]],
    ["WDK", ["BTC", "ETH"]],
    ["Revolut", ["EUR", "CHF"]],
  ] as const) {
    const row = story.locator(`[data-wallet="${wallet}"]`);
    await expect(row.locator("[data-currency]")).toHaveText([...currencies]);
    let previousY = -Infinity;
    for (const currency of currencies) {
      const label = row.getByText(currency, { exact: true });
      const bounds = (await label.boundingBox())!;
      expect(bounds.y).toBeGreaterThan(previousY);
      previousY = bounds.y;
      expect(
        await label.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(14);
    }
    expect(
      await row.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const labels = element.querySelectorAll(
          ":scope > img, [data-currency]",
        );
        return Array.from(labels).every((label) => {
          const rect = label.getBoundingClientRect();
          return (
            rect.left >= bounds.left &&
            rect.right <= bounds.right &&
            rect.top >= bounds.top &&
            rect.bottom <= bounds.bottom
          );
        });
      }),
      `${wallet} labels must fit inside their wallet card`,
    ).toBe(true);
  }
  await story.locator('button[data-step="4"]').click();
  await expectDirectPaymentWithoutPaykit();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("the mobile payment diagram preserves and uniformly scales its desktop arrangement", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const story = page.getByTestId("payment-story");
  const viewport = story.getByTestId("payment-scene-viewport");
  const canvas = story.getByTestId("payment-scene-canvas");
  const alice = story.locator('[data-person="Alice"]');
  const bob = story.locator('[data-person="Bob"]');
  const node = story.getByTestId("payment-discovery-node");
  const caption = story
    .getByTestId("payment-story-caption")
    .locator('p[aria-hidden="false"]');

  for (const width of [1440, 820, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        canvas.evaluate((element) => {
          const canvasElement = element as HTMLElement;
          const bounds = canvasElement.getBoundingClientRect();
          const parent = canvasElement.parentElement!.getBoundingClientRect();
          return Math.abs(
            bounds.width - Math.min(canvasElement.offsetWidth, parent.width),
          );
        }),
      )
      .toBeLessThan(1);
    const geometry = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLElement;
      const bounds = canvasElement.getBoundingClientRect();
      return {
        width: canvasElement.offsetWidth,
        scaleX: bounds.width / canvasElement.offsetWidth,
        scaleY: bounds.height / canvasElement.offsetHeight,
      };
    });
    expect(geometry.width).toBe(width <= 700 ? 696 : 1120);
    expect(geometry.scaleX).toBeCloseTo(geometry.scaleY, 5);
    expect(geometry.scaleX).toBeLessThanOrEqual(1);
    const scale = geometry.scaleX;
    const viewBounds = (await viewport.boundingBox())!;

    for (const step of [1, 3, 4]) {
      await story.locator(`button[data-step="${step}"]`).click();
      const left = (await alice.boundingBox())!;
      const right = (await bob.boundingBox())!;
      const center = (await node.boundingBox())!;
      expect(left.x + left.width).toBeLessThan(center.x);
      expect(center.x + center.width).toBeLessThan(right.x);
      if (width <= 700) {
        const bitkit = (await story
          .locator('[data-wallet="Bitkit"]')
          .boundingBox())!;
        const logo = (await story
          .locator('[data-wallet="Bitkit"] > img')
          .boundingBox())!;
        // Compact excess card padding while preserving room for the labels.
        expect(bitkit.width / scale).toBeCloseTo(156, 1);
        expect(center.width / scale).toBeCloseTo(184, 1);
        expect(logo.width / viewBounds.width).toBeGreaterThanOrEqual(0.068);
        expect(
          (center.x - left.x - left.width) / bitkit.width,
        ).toBeLessThanOrEqual(0.55);
        for (const profile of [alice, bob]) {
          const profileBounds = (await profile.boundingBox())!;
          const nameBounds = (await profile
            .locator(":scope > div > strong")
            .boundingBox())!;
          expect(
            Math.abs(
              nameBounds.x +
                nameBounds.width / 2 -
                profileBounds.x -
                profileBounds.width / 2,
            ),
          ).toBeLessThan(0.5);
        }
        const lightning = (await story
          .locator('[data-wallet="Bitkit"] [data-currency="Lightning"]')
          .boundingBox())!;
        expect(
          (bitkit.x + bitkit.width - lightning.x - lightning.width) / scale,
        ).toBeLessThanOrEqual(18);
      }
      expect(Math.abs(left.y - right.y)).toBeLessThan(1);
      // Paykit must stay between the people at the same vertical level,
      // rather than moving above their cards on narrow screens.
      expect(Math.abs(center.y - left.y) / scale).toBeLessThan(32);
      expect(
        Math.abs(
          center.x + center.width / 2 - (left.x + right.x + right.width) / 2,
        ),
      ).toBeLessThan(1);
      expect(left.x).toBeGreaterThanOrEqual(viewBounds.x);
      expect(right.x + right.width).toBeLessThanOrEqual(
        viewBounds.x + viewBounds.width + 1,
      );
      await expect(story.getByTestId("payment-discovery")).toHaveCSS(
        "opacity",
        step === 4 ? "0" : "1",
      );
      if (step === 3) {
        await expect(story.getByTestId("payment-query")).toHaveCSS(
          "opacity",
          "1",
        );
        for (const label of width <= 700
          ? ["How can I pay Bob?", "BTC: bc1q5ayp..."]
          : []) {
          const bounds = (await story
            .getByTestId("payment-query")
            .getByText(label, { exact: true })
            .boundingBox())!;
          expect(bounds.x).toBeGreaterThanOrEqual(left.x + left.width - 0.5);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(center.x + 0.5);
        }
      }
      expect(
        await caption.evaluate((element) =>
          parseFloat(getComputedStyle(element).fontSize),
        ),
      ).toBeGreaterThanOrEqual(16);
      expect(
        await caption.evaluate(
          (element) => getComputedStyle(element).transform,
        ),
      ).toBe("none");
    }

    await story.locator('button[data-step="1"]').click();
    await expect(node.locator('[data-summary-person="Charlie"]')).toHaveCount(0);
    const connectionEndpoints = await story.evaluate((element) => {
      const node = element.querySelector<HTMLElement>(
        '[data-testid="payment-discovery-node"]',
      )!;
      const bounds = node.getBoundingClientRect();
      const radius =
        parseFloat(getComputedStyle(node).borderTopLeftRadius) *
        (bounds.width / node.offsetWidth);
      return Array.from(
        element.querySelectorAll<SVGPathElement>("[data-discovery-wallet]"),
      )
        .filter((path) => {
          const rect = path.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .map((path) => {
          const walletName = path.getAttribute("data-discovery-wallet")!;
          const wallet = element
            .querySelector(`[data-wallet="${walletName}"]`)!
            .getBoundingClientRect();
          const left = ["Bitkit", "PayPal", "Wise"].includes(walletName);
          const matrix = path.getScreenCTM()!;
          const toScreen = (point: DOMPoint) =>
            new DOMPoint(point.x, point.y).matrixTransform(matrix);
          const start = toScreen(path.getPointAtLength(0));
          const end = toScreen(path.getPointAtLength(path.getTotalLength()));
          return {
            wallet: walletName,
            nodeBorderGap: Math.abs(end.x - (left ? bounds.left : bounds.right)),
            nodeEndY: end.y,
            nodeStraightTop: bounds.top + radius + 2,
            nodeStraightBottom: bounds.bottom - radius - 2,
            walletBorderGap: Math.abs(
              start.x - (left ? wallet.right : wallet.left),
            ),
            walletStartY: start.y,
            walletTop: wallet.top,
            walletBottom: wallet.bottom,
          };
        });
    });
    expect(connectionEndpoints).toHaveLength(6);
    for (const endpoint of connectionEndpoints) {
      const context = `${endpoint.wallet} connection at ${width}px`;
      expect(endpoint.nodeBorderGap, context).toBeLessThanOrEqual(0.5);
      expect(endpoint.nodeEndY, context).toBeGreaterThanOrEqual(
        endpoint.nodeStraightTop,
      );
      expect(endpoint.nodeEndY, context).toBeLessThanOrEqual(
        endpoint.nodeStraightBottom,
      );
      expect(endpoint.walletBorderGap, context).toBeLessThanOrEqual(0.5);
      expect(endpoint.walletStartY, context).toBeGreaterThanOrEqual(
        endpoint.walletTop,
      );
      expect(endpoint.walletStartY, context).toBeLessThanOrEqual(
        endpoint.walletBottom,
      );
    }
    const portrait = alice.locator('img[alt=""]');
    if (width <= 700) await expect(portrait).toBeHidden();
    else await expect(portrait).toBeVisible();
    expect(
      await node.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        return Array.from(
          element.querySelectorAll("strong, [data-summary-rail]"),
        ).every((label) => {
          const rect = label.getBoundingClientRect();
          if (!rect.width || !rect.height) return true;
          return (
            rect.left >= bounds.left - 0.5 &&
            rect.right <= bounds.right + 0.5 &&
            rect.top >= bounds.top - 0.5 &&
            rect.bottom <= bounds.bottom + 0.5
          );
        });
      }),
      `Paykit names and payment options fit at ${width}px`,
    ).toBe(true);
    expect(
      await story.locator("[data-wallet]").evaluateAll((cards) =>
        cards.every((card) => {
          const bounds = card.getBoundingClientRect();
          return Array.from(
            card.querySelectorAll(":scope > img, [data-currency]"),
          ).every((label) => {
            const rect = label.getBoundingClientRect();
            return (
              rect.left >= bounds.left - 0.5 &&
              rect.right <= bounds.right + 0.5 &&
              rect.top >= bounds.top - 0.5 &&
              rect.bottom <= bounds.bottom + 0.5
            );
          });
        }),
      ),
      `wallet labels stay inside the scaled cards at ${width}px`,
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("step descriptions stay readable during manual playback and reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const story = page.getByTestId("payment-story");
  const caption = story.getByTestId("payment-story-caption");
  await story.locator('button[data-step="1"]').click();
  await expect(story).toHaveAttribute("data-playing", "false");
  const active = caption.locator('p[aria-hidden="false"]');
  await expect(active).toHaveCount(1);
  expect(
    await active.evaluate((element) =>
      element
        .getAnimations()
        .some((animation) => animation.playState === "running"),
    ),
  ).toBe(true);
  await expect(active).toHaveCSS("opacity", "1");
  await expect(active).toHaveCSS("transform", "none");
  await expect(active).toHaveCSS("color", "rgb(179, 191, 208)");
  const height = (await caption.boundingBox())!.height;
  for (const step of [2, 3, 4, 0, 1]) {
    await story.locator(`button[data-step="${step}"]`).click();
    await expect(active).toHaveCount(1);
    expect((await caption.boundingBox())!.height).toBeCloseTo(height, 1);
    for (const inactive of await caption
      .locator('p[aria-hidden="true"]')
      .all()) {
      await expect(inactive).toHaveCSS("visibility", "hidden");
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(story).toHaveAttribute("data-reduced-motion", "true");
  await story.locator('button[data-step="1"]').click();
  await expect(active).toHaveCSS("opacity", "1");
  await expect(active).toHaveCSS("transform", "none");
  await expect(active).toHaveCSS("animation-name", "none");
});

test("the payment story autoplays, loops, and pauses", async ({ page }) => {
  test.setTimeout(150_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/");
  const story = page.getByTestId("payment-story");
  await story.scrollIntoViewIfNeeded();
  await expect(story).toHaveAttribute("data-playing", "true");
  await expect(story.getByText("Auto-playing", { exact: true })).toBeVisible();
  await expect(story).toHaveAttribute("data-active-step", "0");
  await page.waitForTimeout(8_500);
  await expect(story).toHaveAttribute("data-active-step", "0");
  await expect(story).toHaveAttribute("data-active-step", "1", {
    timeout: 6_000,
  });
  await story.getByTestId("payment-story-toggle").click();
  await expect(story).toHaveAttribute("data-playing", "false");
  const pausedStep = await story.getAttribute("data-active-step");
  const pausedProgress = await story.evaluate((element) =>
    (element as HTMLElement).style.getPropertyValue("--story-progress"),
  );
  await page.waitForTimeout(11_000);
  await expect(story).toHaveAttribute("data-active-step", pausedStep!);
  expect(
    await story.evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--story-progress"),
    ),
  ).toBe(pausedProgress);
  expect(
    await story.evaluate((element) =>
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation instanceof CSSAnimation)
        .every((animation) => animation.playState === "paused"),
    ),
  ).toBe(true);
  await story.getByTestId("payment-story-toggle").click();
  await expect(story).toHaveAttribute("data-active-step", "2", {
    timeout: 18_000,
  });
  const recipientCue = story.getByTestId("payment-intent-recipient");
  const amountCue = story.getByTestId("payment-intent-amount");
  await expect(recipientCue).toHaveCSS("opacity", "0");
  await expect(amountCue).toHaveCSS("opacity", "0");
  await expect(recipientCue).toHaveText("Bob");
  await expect(recipientCue).toHaveCSS("opacity", "1", { timeout: 6_000 });
  await expect(amountCue).toHaveCSS("opacity", "0");
  await expect(amountCue).toHaveCSS("opacity", "1", { timeout: 5_000 });
  await expect(story).toHaveAttribute("data-active-step", "3", {
    timeout: 18_000,
  });
  await expect(story).toHaveAttribute("data-step-one-third", "false");
  await expect(story).toHaveAttribute("data-step-two-thirds", "false");
  const reply = story.getByTestId("payment-query").getByText("BTC: bc1q5ayp...", {
    exact: true,
  });
  const responseArrow = story.getByTestId("payment-query-response");
  await expect(reply).toHaveCSS("opacity", "0");
  await expect(responseArrow).toHaveCSS("visibility", "hidden");
  const btcLabels = story.locator('[data-summary-rail="bitcoin-onchain"]');
  await expect(btcLabels).toHaveCount(2);
  const outerBtcLabels = story.locator('[data-wallet] [data-currency="BTC"]');
  for (const btc of await btcLabels.all()) {
    await expect(btc).toHaveCSS("color", "rgb(196, 208, 223)");
  }
  await page.waitForTimeout(1_500);
  await story.getByTestId("payment-story-toggle").click();
  const pausedDiscoveryProgress = await story.evaluate((element) =>
    (element as HTMLElement).style.getPropertyValue("--story-progress"),
  );
  await page.waitForTimeout(2_000);
  await expect(story).toHaveAttribute("data-step-one-third", "false");
  await expect(story).toHaveAttribute("data-step-two-thirds", "false");
  expect(
    await story.evaluate((element) =>
      (element as HTMLElement).style.getPropertyValue("--story-progress"),
    ),
  ).toBe(pausedDiscoveryProgress);
  await expect(reply).toHaveCSS("opacity", "0");
  await expect(responseArrow).toHaveCSS("visibility", "hidden");
  for (const btc of await btcLabels.all()) {
    await expect(btc).toHaveCSS("color", "rgb(196, 208, 223)");
  }
  await story.getByTestId("payment-story-toggle").click();
  await expect(story).toHaveAttribute("data-step-one-third", "true", {
    timeout: 6_000,
  });
  await expect(story).toHaveAttribute("data-step-two-thirds", "false");
  for (const btc of await btcLabels.all()) {
    await expect(btc).toHaveCSS("color", "rgb(255, 172, 127)");
  }
  for (const btc of await outerBtcLabels.all()) {
    await expect(btc).toHaveCSS("color", "rgb(196, 208, 223)");
  }
  await expect(reply).toHaveCSS("opacity", "0");
  await expect(responseArrow).toHaveCSS("visibility", "hidden");
  await expect(story).toHaveAttribute("data-step-two-thirds", "true", {
    timeout: 6_000,
  });
  await expect(reply).toHaveCSS("opacity", "1");
  await expect(responseArrow).toHaveCSS("visibility", "visible");
  await expect(story).toHaveAttribute("data-active-step", "4", {
    timeout: 18_000,
  });
  await expect(story.getByTestId("payment-route")).toHaveCSS("opacity", "1");
  for (const btc of await outerBtcLabels.all()) {
    await expect(btc).toHaveCSS("color", "rgb(255, 172, 127)");
  }
  await story.getByTestId("payment-story-toggle").click();
  await expect(story).toHaveAttribute("data-playing", "false");
  await story.getByTestId("payment-story-toggle").click();
  await expect(story).toHaveAttribute("data-playing", "true");
  await expect(story).toHaveAttribute("data-active-step", "4");
  await expect(story).toHaveAttribute("data-active-step", "0", {
    timeout: 16_000,
  });
  await expect(story).toHaveAttribute("data-playing", "true");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(11_000);
  await expect(story).toHaveAttribute("data-active-step", "0");
  await expect(story).toHaveAttribute("data-playing", "false");
  await story.scrollIntoViewIfNeeded();
  await story.locator('button[data-step="0"]').click();
  await expect(story).toHaveAttribute("data-playing", "false");
  for (const wallet of ["Bitkit", "WDK"]) {
    await expect
      .poll(() =>
        story.locator(`[data-wallet="${wallet}"]`).evaluate((row) => {
          let opacity = 1;
          let element: Element | null = row;
          while (element) {
            opacity *= Number(getComputedStyle(element).opacity);
            element = element.parentElement;
          }
          return opacity;
        }),
      )
      .toBeGreaterThan(0.95);
  }
});
