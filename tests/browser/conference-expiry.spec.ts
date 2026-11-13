import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { chmodSync, mkdtempSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { conferenceVisibleUntil } from "../../lib/conference.mjs";

test("a running production server expires the conference at the cutoff", async ({ page, request }) => {
  test.skip(!process.env.PAYKIT_TEST_IMAGE, "Run npm run test:docker for server-clock coverage");
  test.setTimeout(90_000);
  const image = process.env.PAYKIT_TEST_IMAGE!;
  const directory = mkdtempSync(join(tmpdir(), "paykit-clock-"));
  const clockPath = join(directory, "now");
  const cutoff = Date.parse(conferenceVisibleUntil);
  function setTime(timestamp: number) {
    writeFileSync(join(directory, "next"), String(timestamp), { mode: 0o644 });
    renameSync(join(directory, "next"), clockPath);
  }
  let container: string | undefined;
  const docker = (...args: string[]) => execFileSync("docker", args, { encoding: "utf8", timeout: 30_000 }).trim();
  try {
    // Docker's non-root node user must be able to read this test-only directory.
    // The mount is read-only; only this test process can advance the clock.
    chmodSync(directory, 0o755);
    setTime(cutoff - 24 * 60 * 60 * 1000);
    container = docker("run", "--rm", "-d", "-p", "127.0.0.1::3000",
      "--label", `to.paykit.browser-test-run=${process.env.PAYKIT_TEST_RUN_ID || randomUUID()}`,
      "--mount", `type=bind,src=${directory},dst=/test-clock,readonly`,
      "--mount", `type=bind,src=${resolve("tests/helpers/server-clock.mjs")},dst=/server-clock.mjs,readonly`,
      "-e", "PAYKIT_TEST_CLOCK_FILE=/test-clock/now",
      image, "node", "--import", "/server-clock.mjs", "server.js");
    const port = docker("port", container, "3000/tcp").split(":").at(-1);
    const origin = `http://127.0.0.1:${port}`;
    await expect.poll(async () => {
      try { return (await request.get(origin, { timeout: 1000 })).status(); }
      catch { return 0; }
    }, { timeout: 30_000 }).toBe(200);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(origin);
    const conference = page.getByRole("region", { name: "Meet us in El Salvador" });
    await expect(conference).toContainText("29–30 January 2027");
    await expect(conference).toContainText("San Salvador");
    await expect(conference).toContainText("Details about our talks and where to find us will follow.");
    await expect(conference.getByRole("link", { name: "Explore Plan ₿ Forum" })).toHaveAttribute("href", "https://planb.sv/");
    await expect(page.getByRole("option", { name: "Meeting in El Salvador" })).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Save the dates" })).toHaveAttribute("href", "/api/calendar");
    const googleCalendar = new URL((await page.getByRole("link", { name: "Google Calendar" }).getAttribute("href"))!);
    expect(googleCalendar.searchParams.get("dates")).toBe("20270129/20270131");
    expect(googleCalendar.searchParams.get("details")).toContain("Meet the Paykit/Pubky team (Synonym).");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Save the dates" }).click(),
    ]);
    expect(download.suggestedFilename()).toBe("paykit-planb-el-salvador-2027.ics");

    for (const [timestamp, maxAge] of [[cutoff - 3_600_000, 3600], [cutoff - 30_000, 30], [cutoff - 1, 0]]) {
      setTime(timestamp);
      const calendar = await request.get(`${origin}/api/calendar`);
      expect(calendar.status()).toBe(200);
      expect(calendar.headers()["cache-control"]).toBe(`public, max-age=${maxAge}, must-revalidate`);
      expect(calendar.headers()["content-type"]).toContain("text/calendar");
      expect(calendar.headers()["content-disposition"]).toContain("paykit-planb-el-salvador-2027.ics");
      expect(await calendar.text()).toContain("DTSTART;VALUE=DATE:20270129");
    }
    await page.reload();
    await expect(conference).toBeVisible();
    await expect(page.getByRole("option", { name: "Meeting in El Salvador" })).toHaveCount(1);

    for (const timestamp of [cutoff, cutoff + 1]) {
      setTime(timestamp);
      await page.reload();
      await expect(conference).toHaveCount(0);
      await expect(page.getByRole("option", { name: "Meeting in El Salvador" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Save the dates" })).toHaveCount(0);
      const requestHeaders: Record<string, string>[] = [{}, { RSC: "1" }];
      for (const headers of requestHeaders) {
        const response = await request.get(origin, { headers });
        expect(response.status()).toBe(200);
        expect(response.headers()["content-type"]).toContain(headers.RSC ? "text/x-component" : "text/html");
        const body = await response.text();
        expect(body).not.toContain("Meet us in El Salvador");
        expect(body).not.toContain("Meeting in El Salvador");
        expect(body).not.toContain("/api/calendar");
      }
      const calendar = await request.get(`${origin}/api/calendar`);
      expect(calendar.status()).toBe(410);
      expect(calendar.headers()["cache-control"]).toBe("no-store");
      expect(await calendar.text()).toBe("This conference has ended.");
    }
  } finally {
    try { if (container) docker("rm", "-f", container); }
    finally { rmSync(directory, { recursive: true, force: true }); }
  }
});
