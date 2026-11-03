// Scenario file for the process-level tests: logs to SMOKE_LOG and, with SMOKE_HANG=1, never finishes its step.
import { appendFileSync } from "node:fs";
import { fakeCase, fakeDevice } from "./fake.mjs";

const log = { push: (line) => appendFileSync(process.env.SMOKE_LOG, line + "\n") };

export default {
  name: "hang",
  device: fakeDevice("dev", log),
  cases: [fakeCase("data", log)],
  async steps() {
    log.push("steps");
    if (process.env.SMOKE_HANG === "1") await new Promise(() => setInterval(() => {}, 1000));
  },
};
