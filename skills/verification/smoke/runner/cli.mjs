#!/usr/bin/env node
// node cli.mjs <scenario-file>... [--only <name>] [--state <dir>]
// A scenario file default-exports a scenario or an array of them. Exits 0 only if every scenario passed and nothing leaked.
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { run } from "./run.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { only: { type: "string", multiple: true }, state: { type: "string" } },
});
if (positionals.length === 0) {
  console.error("usage: node cli.mjs <scenario-file>... [--only <name>] [--state <dir>]");
  process.exit(2);
}
const stateDir =
  values.state ?? join(process.env.XDG_DATA_HOME || join(homedir(), ".local/share"), "identity16-skills/smoke");

const scenarios = [];
for (const file of positionals) {
  const exported = (await import(pathToFileURL(resolve(file)).href)).default;
  scenarios.push(...[exported].flat());
}
const selected = values.only ? scenarios.filter((s) => values.only.includes(s.name)) : scenarios;
if (selected.length === 0) {
  console.error(`no scenario named ${values.only.join(", ")}; have ${scenarios.map((s) => s.name).join(", ")}`);
  process.exit(2);
}

const report = await run(selected, { stateDir });
for (const s of report.swept) console.log(`swept   ${s.kind} ${s.adapter} from ${s.runId}: ${s.result}`);
for (const s of report.scenarios) console.log(`${s.status.padEnd(7)} ${s.name}${s.error ? ` — ${s.error}` : ""}`);
for (const l of report.leaked) console.log(`leaked  ${l.kind} ${l.adapter}: ${l.error}`);
console.log(`report  ${join(stateDir, "runs", report.runId, "report.json")}`);
// Exit explicitly: an abandoned step may still hold sockets open after its device is gone.
process.exit(report.scenarios.every((s) => s.status === "pass") && report.leaked.length === 0 ? 0 : 1);
