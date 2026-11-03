import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { run } from "../run.mjs";
import { fakeCase, fakeDevice } from "./fake.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const tempState = () => mkdtempSync(join(tmpdir(), "smoke-test-"));
const journal = (stateDir) => {
  const path = join(stateDir, "journal.json");
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : [];
};
const deadPid = () => spawnSync(process.execPath, ["-e", ""]).pid;
const scenario = (name, device, cases, steps = async () => {}) => ({ name, device, cases, steps });

test("releases in reverse order and shares a device across scenarios", async () => {
  const log = [];
  const stateDir = tempState();
  const dev = fakeDevice("dev", log);
  const cases = [fakeCase("a", log), fakeCase("b", log)];
  const report = await run([scenario("one", dev, cases), scenario("two", dev, cases)], { stateDir });
  assert.deepEqual(log, [
    "provision dev",
    "setup a",
    "setup b",
    "cleanup b on-device",
    "cleanup a on-device",
    "setup a",
    "setup b",
    "cleanup b on-device",
    "cleanup a on-device",
    "teardown dev",
  ]);
  assert.deepEqual(report.scenarios.map((s) => s.status), ["pass", "pass"]);
  assert.deepEqual(journal(stateDir), []);
  assert.ok(existsSync(join(stateDir, "runs", report.runId, "report.json")));
});

test("tells a failed check from a broken run, and still cleans up", async () => {
  const log = [];
  const dev = fakeDevice("dev", log);
  const report = await run(
    [
      scenario("fails", dev, [fakeCase("a", log)], ({ expect }) => expect(false, "title is wrong")),
      scenario("breaks", dev, [fakeCase("a", log)], () => {
        throw new Error("selector not found");
      }),
    ],
    { stateDir: tempState() },
  );
  assert.deepEqual(
    report.scenarios.map(({ status, error }) => [status, error]),
    [
      ["fail", "title is wrong"],
      ["error", "selector not found"],
    ],
  );
  assert.equal(log.filter((line) => line.startsWith("cleanup a")).length, 2);
  assert.equal(log.at(-1), "teardown dev");
});

test("reports a failed release as leaked without masking the result, and retries it next run", async () => {
  const log = [];
  const stateDir = tempState();
  const first = await run([scenario("s", fakeDevice("dev", log), [fakeCase("a", log, { failCleanup: true })])], {
    stateDir,
  });
  assert.equal(first.scenarios[0].status, "pass");
  assert.deepEqual(
    first.leaked.map(({ adapter, error }) => [adapter, error]),
    [["a", "cleanup failed"]],
  );
  assert.deepEqual(
    journal(stateDir).map((e) => e.adapter),
    ["a"],
  );

  log.length = 0;
  const second = await run([scenario("s", fakeDevice("dev", log), [fakeCase("a", log)])], { stateDir });
  assert.deepEqual(log.slice(0, 2), ["provision dev", "cleanup a stale on-device"]);
  assert.equal(second.swept[0].result, "released");
  assert.deepEqual(journal(stateDir), []);
});

test("a device that fails to provision is tried once and never torn down", async () => {
  const log = [];
  const stateDir = tempState();
  const dev = fakeDevice("dev", log, { failProvision: true });
  const report = await run([scenario("one", dev, [fakeCase("a", log)]), scenario("two", dev, [])], { stateDir });
  assert.deepEqual(log, ["provision dev"]);
  assert.deepEqual(report.scenarios.map((s) => s.status), ["error", "error"]);
  assert.deepEqual(journal(stateDir), []);
});

test("rejects a device whose handle lacks the page operations, and still tears it down", async () => {
  const log = [];
  const report = await run([scenario("s", fakeDevice("dev", log, { handle: { goto() {} } }), [])], {
    stateDir: tempState(),
  });
  assert.equal(report.scenarios[0].status, "error");
  assert.match(report.scenarios[0].error, /lacks click, eval, screenshot, logs/);
  assert.deepEqual(log, ["provision dev", "teardown dev"]);
});

test("sweeps a dead run's leftovers: devices at once, cases once their device is back", async () => {
  const log = [];
  const stateDir = tempState();
  const dead = { runId: "old", pid: deadPid() };
  const live = { runId: "other", pid: process.ppid };
  writeFileSync(
    join(stateDir, "journal.json"),
    JSON.stringify([
      { ...dead, kind: "device", adapter: "dev", ref: {} },
      { ...dead, kind: "case", adapter: "a", device: "dev", ref: {} },
      { ...dead, kind: "device", adapter: "gone", ref: {} },
      { ...live, kind: "device", adapter: "dev", ref: {} },
    ]),
  );
  const report = await run([scenario("s", fakeDevice("dev", log), [fakeCase("a", log)])], { stateDir });
  assert.deepEqual(log, [
    "teardown dev stale",
    "provision dev",
    "cleanup a stale on-device",
    "setup a",
    "cleanup a on-device",
    "teardown dev",
  ]);
  assert.deepEqual(
    report.swept.map(({ adapter, result }) => [adapter, result]),
    [
      ["gone", "kept: no adapter with this name in this run"],
      ["dev", "released"],
      ["a", "released"],
    ],
  );
  assert.deepEqual(
    journal(stateDir).map((e) => [e.runId, e.adapter]),
    [
      ["old", "gone"],
      ["other", "dev"],
    ],
  );
});

// Process-level: the CLI under a real signal.
const startHanging = (stateDir, logPath) =>
  spawn(process.execPath, [join(here, "../cli.mjs"), join(here, "hang.scenario.mjs"), "--state", stateDir], {
    env: { ...process.env, SMOKE_LOG: logPath, SMOKE_HANG: "1" },
    stdio: "pipe",
  });
const readLog = (path) => (existsSync(path) ? readFileSync(path, "utf8").trim().split("\n") : []);
const until = async (predicate) => {
  for (let i = 0; i < 100 && !predicate(); i++) await sleep(50);
  assert.ok(predicate(), "timed out");
};
const exited = (child) => new Promise((resolve) => child.on("exit", (code, signal) => resolve(code ?? signal)));

test("SIGINT abandons the hanging step, releases everything, and exits", async () => {
  const stateDir = tempState();
  const logPath = join(stateDir, "calls.log");
  const child = startHanging(stateDir, logPath);
  await until(() => readLog(logPath).includes("steps"));
  child.kill("SIGINT");
  assert.equal(await exited(child), 1);
  assert.deepEqual(readLog(logPath), ["provision dev", "setup data", "steps", "cleanup data on-device", "teardown dev"]);
  assert.deepEqual(journal(stateDir), []);
});

test("after a crash, the next run releases what the dead run held", async () => {
  const stateDir = tempState();
  const logPath = join(stateDir, "calls.log");
  const child = startHanging(stateDir, logPath);
  await until(() => readLog(logPath).includes("steps"));
  child.kill("SIGKILL");
  await exited(child);
  assert.deepEqual(
    journal(stateDir).map((e) => e.adapter),
    ["dev", "data"],
  );

  writeFileSync(logPath, "");
  const next = spawnSync(
    process.execPath,
    [join(here, "../cli.mjs"), join(here, "hang.scenario.mjs"), "--state", stateDir],
    { env: { ...process.env, SMOKE_LOG: logPath }, encoding: "utf8" },
  );
  assert.equal(next.status, 0, next.stdout + next.stderr);
  assert.deepEqual(readLog(logPath).slice(0, 3), ["teardown dev stale", "provision dev", "cleanup data stale on-device"]);
  assert.deepEqual(journal(stateDir), []);
});
