// Mounted only into an isolated test container via `node --import`.
// Read on every call so one running server can cross the conference cutoff.
import { readFileSync } from "node:fs";

const clockFile = process.env.PAYKIT_TEST_CLOCK_FILE;
if (!clockFile) throw new Error("PAYKIT_TEST_CLOCK_FILE is required by the test clock");

Date.now = () => {
  const timestamp = Number(readFileSync(clockFile, "utf8").trim());
  if (!Number.isFinite(timestamp)) throw new Error("Invalid test clock timestamp");
  return timestamp;
};
