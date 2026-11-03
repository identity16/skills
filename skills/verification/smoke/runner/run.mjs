// The Smoke Run: run(scenarios) → Report. Callers write devices, cases, and scenarios; everything about
// acquiring, releasing, interrupting, and recovering from a crashed run stays in here.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Every device handle must offer these, so a case or scenario written once runs on any device.
export const PAGE = ["goto", "click", "eval", "screenshot", "logs"];

export class SmokeFailure extends Error {
  name = "SmokeFailure";
}
const expect = (condition, message) => {
  if (!condition) throw new SmokeFailure(message);
};

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === "EPERM";
  }
};

// The journal records what is held right now, so a run that died without releasing can be cleaned up by the next one.
function openJournal(stateDir) {
  const path = join(stateDir, "journal.json");
  const entries = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];
  const save = () => writeFileSync(path, JSON.stringify(entries, null, 2) + "\n");
  return {
    entries,
    add(entry) {
      entries.push(entry);
      save();
    },
    remove(entry) {
      entries.splice(entries.indexOf(entry), 1);
      save();
    },
  };
}

export async function run(scenarios, { stateDir, signals = ["SIGINT", "SIGTERM"] }) {
  const runId = `${new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "")}-${randomBytes(3).toString("hex")}`;
  const runDir = join(stateDir, "runs", runId);
  mkdirSync(runDir, { recursive: true });
  const journal = openJournal(stateDir);
  const report = { runId, swept: [], scenarios: [], leaked: [] };

  // First signal: stop the current step and release everything. Second: exit now; the journal keeps what is left.
  const controller = new AbortController();
  const aborted = new Promise((_, reject) =>
    controller.signal.addEventListener("abort", () => reject(controller.signal.reason)),
  );
  aborted.catch(() => {});
  const onSignal = (name) => {
    if (controller.signal.aborted) process.exit(130);
    controller.abort(new Error(`interrupted by ${name}`));
  };
  for (const name of signals) process.on(name, onSignal);
  const guard = (promise) => Promise.race([promise, aborted]);

  const adapters = new Map();
  for (const scenario of scenarios) {
    adapters.set(scenario.device.name, { kind: "device", adapter: scenario.device });
    for (const c of scenario.cases ?? []) adapters.set(c.name, { kind: "case", adapter: c });
  }

  const release = async (entry, args) => {
    const { adapter } = adapters.get(entry.adapter);
    await (entry.kind === "device" ? adapter.teardown(args) : adapter.cleanup(args));
    journal.remove(entry);
  };
  const sweep = async (entry, args) => {
    try {
      await release(entry, { ref: entry.ref, stale: true, ...args });
      report.swept.push({ ...entry, result: "released" });
    } catch (error) {
      report.swept.push({ ...entry, result: `failed: ${error.message}` });
    }
  };

  // Leftovers of dead runs, newest first. A case that lived on a device is released only once that device is
  // provisioned again, because state inside a device (storage, app data) needs a live device to clear.
  const deferred = [];
  for (const entry of [...journal.entries].reverse()) {
    if (entry.runId === runId || (entry.pid !== process.pid && alive(entry.pid))) continue;
    if (!adapters.has(entry.adapter)) {
      report.swept.push({ ...entry, result: "kept: no adapter with this name in this run" });
    } else if (entry.kind === "case") {
      deferred.push(entry);
    } else {
      await sweep(entry);
    }
  }

  // Adapters must return { handle, ref } or throw having undone their own partial work. An acquisition is never
  // abandoned mid-flight (what it creates could not be released); adapters get the signal to give up early instead.
  const held = (kind, adapter, extra = {}) => ({ runId, pid: process.pid, kind, adapter: adapter.name, ...extra });
  const acquire = async (stack, entry, acquireFn, releaseArgs = {}) => {
    const { handle, ref } = await acquireFn();
    entry.ref = ref;
    journal.add(entry);
    stack.push({ entry, handle, releaseArgs });
    controller.signal.throwIfAborted();
    return handle;
  };
  const unwind = async (stack) => {
    while (stack.length > 0) {
      const { entry, handle, releaseArgs } = stack.pop();
      try {
        await release(entry, { handle, ref: entry.ref, ...releaseArgs });
      } catch (error) {
        report.leaked.push({ ...entry, error: error.message });
      }
    }
  };

  const deviceStack = [];
  const devices = new Map();
  const provision = async (device, artifact) => {
    if (!devices.has(device.name)) {
      devices.set(
        device.name,
        acquire(deviceStack, held("device", device), () =>
          device.provision({ runId, artifact, signal: controller.signal }),
        ).then((handle) => {
          const missing = PAGE.filter((op) => typeof handle?.[op] !== "function");
          if (missing.length > 0) throw new Error(`device ${device.name} handle lacks ${missing.join(", ")}`);
          return handle;
        }),
      );
      const handle = await devices.get(device.name);
      for (const entry of deferred.filter((d) => d.device === device.name)) await sweep(entry, { device: handle });
    }
    return devices.get(device.name);
  };

  try {
    for (const scenario of scenarios) {
      const result = { name: scenario.name, status: "pass", artifacts: [] };
      report.scenarios.push(result);
      if (controller.signal.aborted) {
        result.status = "skipped";
        continue;
      }
      const dir = join(runDir, scenario.name);
      const artifact = (file) => {
        mkdirSync(dir, { recursive: true });
        const path = join(dir, file);
        result.artifacts.push(path);
        return path;
      };
      const caseStack = [];
      let device;
      try {
        device = await provision(scenario.device, artifact);
        const cases = {};
        for (const c of scenario.cases ?? []) {
          cases[c.name] = await acquire(
            caseStack,
            held("case", c, { device: scenario.device.name }),
            () => c.setup({ runId, device, signal: controller.signal }),
            { device },
          );
        }
        await guard(scenario.steps({ runId, device, cases, artifact, expect, signal: controller.signal }));
      } catch (error) {
        result.status = controller.signal.aborted ? "aborted" : error instanceof SmokeFailure ? "fail" : "error";
        result.error = error.message;
      } finally {
        await unwind(caseStack);
      }
    }
  } finally {
    await unwind(deviceStack);
    for (const name of signals) process.off(name, onSignal);
  }

  writeFileSync(join(runDir, "report.json"), JSON.stringify(report, null, 2) + "\n");
  return report;
}
