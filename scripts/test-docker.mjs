import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const cwd = fileURLToPath(new URL("..", import.meta.url));
const suffix = `${process.pid}-${Date.now()}`;
const image = `paykit-browser-tests:${suffix}`;
const container = `paykit-browser-tests-${suffix}`;
const runId = randomUUID();
const containerLabel = `to.paykit.browser-test-run=${runId}`;
let activeChild;
let interrupted;

function terminateChild(signal) {
  if (!activeChild?.pid) return;
  try {
    // npm starts Playwright as a child; terminate the whole owned process group.
    process.kill(process.platform === "win32" ? activeChild.pid : -activeChild.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") console.error(error.message);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    interrupted = signal;
    terminateChild(signal);
  });
}

function run(command, args, { capture = false, env = process.env, cleanup = false } = {}) {
  if (interrupted && !cleanup) return Promise.reject(new Error(`Interrupted by ${interrupted}`));
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      shell: false,
      detached: process.platform !== "win32",
      stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    });
    activeChild = child;
    let stdout = "";
    let stderr = "";
    if (capture) {
      child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
      child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
    }
    child.once("error", reject);
    child.once("close", (code, signal) => {
      if (activeChild === child) activeChild = undefined;
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`${command} ${args.join(" ")} failed (${signal || code})${stderr ? `\n${stderr.trim()}` : ""}`));
    });
  });
}

async function ready(baseURL) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (interrupted) throw new Error(`Interrupted by ${interrupted}`);
    try {
      const response = await fetch(baseURL, { signal: AbortSignal.timeout(2_000) });
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The container may not yet be accepting requests.
    }
    await delay(250);
  }
  throw new Error(`Container did not become ready within 30 seconds: ${baseURL}`);
}

try {
  await run("docker", ["build", "--tag", image, "."]);
  await run("docker", ["run", "--detach", "--rm", "--name", container,
    "--label", containerLabel,
    "--publish", "127.0.0.1::3000", image], { capture: true });
  const port = await run("docker", ["inspect", "--format",
    '{{(index (index .NetworkSettings.Ports "3000/tcp") 0).HostPort}}', container], { capture: true });
  if (!/^\d+$/.test(port)) throw new Error(`Unexpected Docker port: ${port}`);
  const baseURL = `http://127.0.0.1:${port}`;
  await ready(baseURL);

  const env = { ...process.env, CI: "1", PLAYWRIGHT_BASE_URL: baseURL, PAYKIT_TEST_IMAGE: image, PAYKIT_TEST_RUN_ID: runId };
  // This is an isolated local image, not the deployment optionally configured by a caller.
  delete env.PLAYWRIGHT_EXPECTED_SITE_URL;
  console.log(`Running browser checks against ${image} at ${baseURL}`);
  await run("npm", ["run", "test:browser", "--", ...process.argv.slice(2)], { env });
} catch (error) {
  process.exitCode = interrupted === "SIGINT" ? 130 : interrupted === "SIGTERM" ? 143 : 1;
  console.error(error.message);
  await run("docker", ["logs", container], { cleanup: true }).catch(() => {});
} finally {
  // Remove only this run's labeled containers, including interrupted expiry tests.
  // Image ancestry cannot identify ownership: cached builds can share image IDs.
  const related = await run("docker", ["ps", "--all", "--quiet", "--filter", `label=${containerLabel}`],
    { capture: true, cleanup: true }).catch(() => "");
  const containerIds = related.split(/\s+/).filter((id) => /^[a-f0-9]{12,64}$/.test(id));
  if (containerIds.length) {
    await run("docker", ["rm", "--force", ...containerIds], { capture: true, cleanup: true }).catch(() => {});
  }
  await run("docker", ["rm", "--force", container], { capture: true, cleanup: true }).catch(() => {});
  await run("docker", ["image", "rm", image], { capture: true, cleanup: true }).catch(() => {});
}
