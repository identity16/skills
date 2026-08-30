---
name: depth-check
description: Before starting a nontrivial task, compute how much understanding the work demands and split it into "already understood" vs "learn first". Use when the user invokes /depth-check, asks "what do I need to understand before touching this?", "이거 시작하기 전에 뭘 알아야 해?", "어디까지 파악하고 들어가야 해?", or is about to start work in territory they may not know well. Maps the task's blast radius, grades the depth each area requires, and emits the short list of questions to answer before coding.
---

# depth-check

Operationalizes "up to the level the work at hand demands": given a task, figure out what that level actually is — then subtract what the user already knows. The output is a short, honest prep list, not a lecture on the whole codebase.

Not every part of a task deserves deep understanding. Modifying logic demands a working model; calling an interface demands its contract; adjacent code demands awareness that it exists. Grading this is the skill's core move — over-demanding depth is as much a failure as under-demanding it.

## Steps

### 1. Pin down the task

What is actually being changed? If the user's description is vague, sharpen it against the code first ("fix the sync bug" → which sync path, roughly which modules).

### 2. Map the blast radius

Proportionally to the task's size, find:

- Files/modules the change will touch directly
- Their consumers — who calls this, who depends on its behavior
- Invariants in play: assumptions the surrounding code makes, protocol/ordering constraints, things a comment or assertion warns about
- Tests covering the area (their existence and shape tell you what behavior is load-bearing)

### 3. Grade the depth each area demands

For each part of the radius, assign the level the work requires:

- **Working model** — you will change its logic: must be able to predict behavior under edge cases
- **Contract** — you will call or depend on it: must know its interface, guarantees, and failure modes
- **Awareness** — it's nearby: must know it exists and when it becomes relevant

### 4. Subtract what the user already knows

Signals, in order of reliability:

- The user's dossier and journal, if they run this pack's session loop — trust it, but flag entries that recent commits may have staled.
- The user's own commit history in the area: `git log --author=<user email from git config> --oneline -- <path>`. Code the user wrote or recently modified is likely understood; code they've never touched likely isn't.
- When neither is conclusive, ask directly — one short calibration question ("have you worked in the retry layer before?") beats a wrong assumption.

### 5. Emit the prep list

Two lists, short:

- **You already have this** — areas where the user's known level meets the demanded level. No homework for these.
- **Learn first** — each entry as a concrete question to answer before coding, not a topic to study: "what guarantees writes are ordered here?" beats "understand the write path". Point at the fastest way to answer each — a specific file to read, a test to run, a `why` dig into the decision's history.

If the whole list is empty, say so in one line and get out of the way — a task inside known territory needs no ceremony.

For session-loop users: questions that stay open after prep are worth a journal line so they resurface next visit. Skip for everyone else.

## Guardrails

- The prep list must be answerable in minutes-to-an-hour, not a reading program. If it grows past ~5 items, the task is probably too big — say that instead.
- Grade honestly in both directions: don't demand a working model of code the task merely calls, and don't wave through logic changes on contract-level knowledge.
- Read-only: this skill investigates and reports; it changes nothing in the target project.
