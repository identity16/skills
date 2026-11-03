---
name: smoke
description: Set up and run smoke tests whose devices, test data, and cleanup are all handled by code — provision a device (a real iPhone's Safari, a headless browser), set up the data a scenario needs, run the steps, and release everything even on failure, interruption, or a crash. Use when the user invokes /smoke, wants a quick end-to-end check that something works ("smoke test this", "does the login flow still work on the phone?", "스모크 테스트 세팅해줘", "스모크 돌려줘", "실기기로 한번 돌려봐", "이 플로우 자동으로 확인하게 만들어줘"), or when a loop rule asks for a smoke run as evidence.
---

# smoke

Turns "check that it works" into a run anyone can repeat unattended. Everything rests on one module, the Smoke Run; the rest of this skill is about writing the three small pieces it needs and reading what it reports.

## Core concept: the Smoke Run

A deep module: one call, with acquiring, releasing, interrupting, and crash recovery all behind it.

```
run(scenarios) → Report
Report = { runId, swept[], scenarios[{ name, status, error?, artifacts[] }], leaked[] }
status = pass | fail | error | aborted | skipped
```

Callers supply only three kinds of adapter:

```
Device   { name, provision({ runId, artifact, signal }) → { handle, ref },  teardown({ handle?, ref, stale? }) }
Case     { name, setup({ runId, device, signal }) → { handle, ref },        cleanup({ handle?, ref, device?, stale? }) }
Scenario { name, device, cases[], steps({ runId, device, cases, artifact, expect, signal }) }
```

- A **device handle** is normalized: it must offer `goto(url)`, `click(text)`, `eval(fn, arg)`, `screenshot(path)`, and `logs()` (console entries `{ level, text }` since the last call), so a case or scenario written once runs on every device. Driver-specific needs go through `handle.raw`.
- `expect(condition, message)` marks a **fail** (the product is wrong). Any other throw is an **error** (the run itself broke).

What the Smoke Run guarantees, so adapters and scenarios never handle it themselves:

- A device is provisioned once per run and shared by the scenarios that name it; cases are set up per scenario.
- Release happens in reverse order of acquisition, whatever the outcome.
- The first SIGINT/SIGTERM abandons the current step and releases everything; an acquisition in flight is allowed to finish so it can be released. A second signal exits at once.
- Everything held is journaled. The next run releases what a dead run left behind — devices immediately, cases right after their device is provisioned again (state inside a device needs a live device to clear). Entries of a run that is still alive are never touched.
- A release that fails is reported as `leaked`, never folded into the scenario's status, and retried by the next run.

What every adapter must uphold, or the guarantees break:

- `ref` is plain JSON and enough to release the resource after the process that made it is gone (a pid, a session id, created record ids).
- Acquisition is atomic: if `provision`/`setup` throws, it has already undone its own partial work.
- Release is idempotent and tolerates the resource already being gone; with `stale: true` there is no `handle`, only `ref`.
- Adapters never install signal handlers (turn off a driver's own, e.g. Playwright's `handleSIGINT`); the runner owns signals.

The runner lives next to this file: `runner/run.mjs` (the module) and `runner/cli.mjs` (`node runner/cli.mjs <scenario-file>... [--only <name>]`; a scenario file default-exports a scenario or an array). Resolve `runner/` relative to the directory containing this SKILL.md.

## Personal state (zero-trace contract)

- Root: `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/smoke/`
- `package.json`, `node_modules/` — the drivers adapters import (Playwright, WebdriverIO, …).
- `journal.json` — what is held right now. Owned by the runner; never edit it by hand except to drop an entry the user confirmed is gone.
- `devices/<name>.mjs` — device adapters. They belong to this machine, not to a project, and are shared across projects.
- `projects/<repo-id>/` — `*.scenario.mjs` and `cases/*.mjs` for one project. `repo-id`: the normalized `origin` remote URL as a slug — strip protocol, credentials, and `.git`; replace `/` and `:` with `__`. No remote → slug the absolute repo path the same way.
- `runs/<runId>/` — `report.json` and each scenario's artifacts.

Never write any of this, or any mention of this skill pack, into a target project's files, commits, PRs, or issues. If the user wants a smoke test to live in the repo, that is ordinary repo work in the repo's own test stack.

## Steps

1. **Find what exists.** Look under the root: which devices are set up, which scenarios exist for this project, and whether `journal.json` holds leftovers. Read the project for how it is reached (URLs, environments) and how test data can be made by code (seed scripts, admin APIs, test-login endpoints). Ask the user only what cannot be found.
2. **Device.** Reuse one under `devices/` when it fits. Otherwise write one that satisfies the contract above, and check it alone with a scenario that only opens a page and takes a screenshot before building on it.
3. **Cases.** One case per piece of data a scenario needs (a logged-in session, a seeded record). Decide its cleanup before writing it: delete, or deactivate when the system cannot delete — say which in a one-line comment in the case. Data that cannot be released at all, or creation in a shared or production environment, needs the user's go-ahead first.
4. **Scenario.** Steps through the normalized handle; checks through `expect`, each message naming what was expected and what was seen. Save a screenshot where a human would want to look.
5. **Run** with the CLI and read the report. Tell the user, in plain words: each scenario's result with its error, where the artifacts are, and anything swept or leaked — what was left, where, and whether it is safe. A leak is fixed in the adapter, not ignored.
6. When the user asks to change a check, change the scenario and run it again; a smoke test that was never seen passing is not done.

## Guardrails

- A scenario that leaves state for a human to clean up is not finished.
- Never point a run at production unless the user says so for this run.
- Secrets (passwords, tokens) are read at run time from where the user keeps them and never written to state, artifacts, or reports.
