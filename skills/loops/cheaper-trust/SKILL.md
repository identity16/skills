---
name: cheaper-trust
description: Find where trust in agent output can be bought at a lower running cost, and propose the moves. Uses the cost-trust pyramid (codebase → static analysis → verification → prose → human review) to find trust currently held by an expensive layer (human review, prose rules) that a cheaper layer (code structure, lint, types, tests, hooks, CI) could hold instead. Use when the user invokes /cheaper-trust or asks things like "find rules we could move to a cheaper layer", "can this rule be a lint rule?", "reviewers keep making the same comment", "slim down AGENTS.md / CLAUDE.md", "how do I trust my agents more", "신뢰를 더 싸게", "더 싼 층으로 옮길 거 찾아줘", "이 규칙 린트로 못 바꿔?", "리뷰에서 매번 같은 지적 나오는데". Works on a repository, a notes vault, skills, or agent memory. Proposes only; implements after approval.
---

# cheaper-trust

Sources: Lauren Tan, *All Code Is Slop (Except Mine)* — the "poteto pyramid" — and her pstack skills (`correct` in particular), which turn the pyramid into a procedure.

```
cheap   1. codebase         good API design, architecture, refactoring: wrong code can't be written   ┐ deterministic
  │     2. static analysis  lint, types, compilers, tests, CI, hooks                                   ┘
  │     3. verification     formal and runtime verification, invariant checks, agent self-checks       ┐
  ↓     4. prose            rules, skills, AGENTS.md / CLAUDE.md, memory                               │ non-deterministic
costly  5. human review     a person reads the PR or output and comments                               ┘
```

**Cost here means running cost**: what is paid again on every change — review time and tokens spent applying and re-checking the rule. It is not the cost of defining the rule. The two run in opposite directions: a prose rule is one line to write but costs context and re-checking on every run, and is the easiest to ignore; a lint rule takes work to write but then runs for free and cannot be skipped. That definition cost used to be the reason teams stayed low on the pyramid, and agents now make lint rules, tests, and verification harnesses cheap to write. So definition cost is a payback estimate, not a reason to stay put.

The goal is to keep trust while cutting running cost. The lower a rule lives, the more it costs each time and the weaker the guarantee that it held. Moving it up cuts the running cost and keeps or raises trust. This skill finds **trust held by a lower layer that a higher layer could hold**. It never proposes a move that cuts cost by dropping trust (e.g. just skipping review).

## Scope

Takes a target as an argument (a repo path, a file, a PR range). Without one, scan the current working directory plus the user-level setup of **both Claude Code and Codex**: the global instruction files (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, and files they include), installed skills, each agent's hook config, each agent's memory for the current project, and both agents' recent local sessions for it. The user may switch agents at any time, so every proposal must hold under both.

## 1. Collect mistake classes

Assume every contributor is an agent that sees only the files it opened, copies the nearest example, and takes the shortest path that compiles. Hunt for the mistakes that assumption produces, starting from the most expensive layer. Record each occurrence with its source (`file:line`, a PR link, a commit).

- **human review** — review comments on recently merged PRs (`gh pr list --state merged -L 30`, `gh api repos/{o}/{r}/pulls/{n}/comments`), reverts and fix-up commits, feedback entries in either agent's memory, and correction examples in the user's preference files.
- **local agent sessions** — the corrections the user made out loud. Each is an occurrence a person paid for, and usually never reaches a PR. Read both agents' transcripts for this project from roughly the last two weeks (or the last 30 sessions):
  - Claude Code: `~/.claude/projects/<slug>/*.jsonl`, where the slug is the project path with each non-alphanumeric character turned into `-` (entries also carry a `cwd` field to confirm). User turns are entries with `"type": "user"`; skip tool results and injected reminders.
  - Codex: `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` and `~/.codex/archived_sessions/`. Match the project by `session_meta.payload.cwd`; user turns are `user_message` events or `response_item`s with role `user`; skip injected instruction blocks.
  - Match by repository, not exact path: sessions in other worktrees or clones of the same repo count.
  - Transcript formats change between versions; read a few lines to confirm the shape before parsing.
  - Correction signals: the user says the result is wrong, undoes or redoes the agent's work, repeats an instruction already given, interrupts, or denies a tool call with a reason. A correction for a mistake a prose rule or memory entry already covers is the unenforced-rule signal below.
  - Transcripts are private. Cite the session file and timestamp, quote at most one line, and keep quotes out of anything written to the target project.
- **prose** — imperative sentences in `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, `.cursor/rules/`, skill bodies, either agent's memory, and comments that explain a workaround ("never …", "always …", "after X, run Y", "check that …", `IMPORTANT`, `do not remove`). Note which agent reads each file: `AGENTS.md` reaches Codex, `CLAUDE.md` reaches Claude Code, and memory reaches only the agent that wrote it.
- **verification** — procedures where an agent or a person "runs it and checks", runtime asserts, manual checklists.
- **static analysis** — suppressions (`eslint-disable`, `@ts-ignore`, `# noqa`) and the rule each one silences; custom lint rules that block a forbidden pattern. Include agent hooks — Claude Code's `hooks` in `.claude/settings.json` (project or user) and Codex's hook config (`hooks.json` or `[hooks]` in `config.toml`, under `.codex/` or `~/.codex/`) — and note which agent each one runs under.
- **the code itself** — workarounds, deprecated paths, and anti-patterns an agent would copy because they look like the established pattern.

Group occurrences into **mistake classes**: the same wrong move, whatever the wording or file. Then filter:

- A class with two or more occurrences is a candidate.
- A class with one occurrence stays in, marked `Speculative`. One correction is an anecdote until it repeats, and agents over-generalize small corrections into hard rules.
- A prose rule that exists **and** was violated again is the strongest signal: nothing enforces it. It ranks first regardless of count.
- Drop what will not hold in six months or would not change what a future agent does.
- Suppressions survive only when the silenced rule is faulty, pedantic, or style-only. One that silences a rule catching real bugs is a candidate.

## 2. Place each class

The first layer from the top that answers "yes" is the target layer.

1. **codebase** — Can the wrong state be made impossible to write? Give each piece of state one owner and each task one supported way; hide internals so the wrong import fails; replace hand-synced lists with one source of truth; delete old ways an agent would copy; confine an API that needs nuance to the one module allowed to use it; name directories so the location carries the context, with lint as the backstop. (e.g. "always call B after A" → one function that does A and B)
2. **static analysis** — Can a machine judge a violation from the input alone? Yes if types, a regex, an AST check, a schema, or a test can express it. (e.g. "never write non-ASCII text as `\uXXXX` escapes" → a pre-commit check that greps for them)
3. **verification** — Does it take a run to know, but can a machine still judge the result? (e.g. "after moving files, check none ended up empty" → a script that lists zero-byte files) Includes artifacts that show the agent understood the intent: screenshots, recordings, state traces.
4. **prose** — Only for what no machine can judge: a judgment call, a constraint imposed from outside that the code cannot reshape (vendor, platform, protocol), or a public API contract. Make the rule prominent and add an example of the failure. If only human review catches it today, lift it into prose at least.
5. **human review** — What is left: confirming the change matches the intent, from verification artifacts. A reviewer who catches the same class twice is the signal this skill exists for.

Record **why each higher layer does not work** for the class. "Harder to write" is not a reason (see payback below).

### What counts as a device

A proposal is complete only when the device meets the bar for its layer:

- **Lint and CI checks** — the error names the file, type, or function to use instead, so the agent fixes the cause rather than patching around it. The same command runs locally and in CI. If the pattern is already common, start with a ratchet that fails only when a change adds more, then clean up the existing occurrences — they are what the next agent copies.
- **Tests** — the test fails when the behavior breaks, and still passes when only the internals change.
- **Guards** — a guard is a device only when the state it handles is legitimate. A guard that hides a symptom is not.
- **LLM judges** — rank below every deterministic option and propose one only when none exists. The judge is never the agent that wrote the change, uses a different model (another vendor where possible), and judges against a written rubric; when it disagrees with you, suspect the rubric.
- **Exceptions** — go on the offending line with a reason, an expiry date, and a human's approval.
- **Proof** — the device fails on a **real past mistake** from the evidence, not an invented one. A device that cannot be shown failing on one is not a proposal yet.

If a structural fix exists, the prose rule it replaces is deleted, not kept alongside.

### Where the device runs

A device holds the rule only where it runs, and the user works in both Claude Code and Codex. Pick the first home that fits:

1. **Agent-agnostic** — types, the API, lint, tests, git hooks (pre-commit, pre-push), CI. They hold under any agent and for a person typing by hand. Default here.
2. **Agent hooks, registered for both** — only when the rule must be enforced inside the session, before the commit (e.g. block a tool call, check a file right after it is written). Put the check in one script in the repo (or the user's home for user-level rules) and register it in both agents' hook configs under the same event (`PreToolUse`, `PostToolUse`, `Stop` exist in both). Check each agent's current docs for the exact event name and file path before writing the registration. Never propose a hook for one agent alone.

A rule that stays prose belongs where both agents read it: `AGENTS.md`, with `CLAUDE.md` importing it (`@AGENTS.md`) or symlinked to it. Rules in agent memory are read by one agent only; promote any that should hold under both.

Also look for:
- **Held by one agent only** — a rule written only in `CLAUDE.md`, only in one agent's memory, or enforced by a hook only one agent runs. Switching agents silently drops it.
- **Half moves** — when the device exists but is run by hand ("after moving, run the script"), the move is done only once a hook or CI runs it automatically.

### Retire what no longer earns its cost

Every device and rule costs something on each run — CI time, context tokens, false alarms. One that adds no trust is pure running cost. Look for:

- **Prose that repeats a device** — a higher-layer device already holds the class and prose says it again. Shrink the prose to a one-line pointer to the device, or delete it.
- **A device a higher device already holds** — a lint rule against a pattern that types or structure now make impossible; an agent hook and a git hook or CI job that implement the same check separately. (The *same command* run locally and in CI is not duplication — that is how the check is meant to run.)
- **Dead devices** — a rule, lint, or hook whose mistake can no longer happen; a test that still passes when the behavior it checks breaks; a suppression on a rule that was since removed.
- **Copied prose** — the same rule written separately into `CLAUDE.md` and `AGENTS.md`, or into memory and an instruction file. Keep one copy where both agents read it.

Propose retiring something only when trust survives without it: take the class's real past mistake and show that what remains still catches it. For a dead device, show the mistake can no longer be written. Without that proof, keep it.

## 3. Rank and grade

Sort roughly by `frequency × layer gap`: how often the class is paid for today, times how many layers it moves up. An unenforced prose rule that was violated again goes to the top.

- Frequency: occurrences of the class in review, commits, local sessions, memory, and incident records (a rule that carries dates or counts is a rule that already failed).
- Layer gap: moving from human review to static analysis saves more per occurrence than moving from prose to verification.
- Attach the definition cost as a payback note — small (one regex or hook) / medium (custom lint rule, test) / large (API redesign, ratchet and cleanup, migration) — and how many occurrences it takes to pay back. Don't let it sink a frequent class; drafting the device is exactly the work an agent makes cheap.

Grade each candidate:

- **Strong** — two or more occurrences (or an unenforced prose rule violated again), a real past mistake to prove the device on, and a deterministic device.
- **Worth exploring** — evidenced and repeated, but the device needs an API redesign or a ratchet-and-cleanup before it holds, or only an LLM judge fits.
- **Speculative** — one occurrence, or no real past mistake found to prove the device on.

Rank retirements separately, by running cost removed: how often the redundant device or rule runs or is read, and how much noise it makes (CI minutes, context lines, false alarms, suppressions it forces).

## 4. Report

Top 5–10 candidates only, as a self-contained HTML file — never in the target project. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (`%TEMP%` on Windows), write `<tmpdir>/cheaper-trust-<timestamp>.html`, and open it (`open` on macOS, `xdg-open` on Linux, `start` on Windows). If the user's instructions name a way to share such reports, follow it.

Each candidate is a card with a before/after cross-section of the pyramid showing where the rule is held now and where it would be held, plus strength, the move, where the device runs, evidence, why a higher layer does not work, a device, the real past mistake it fails on, payback, and what prose remains. After the cards: the retirements, each with what remains to hold its class and the proof; the rules that need judgment and stay in prose (deciding not to move something is a result too); then a top recommendation. See [REPORT.md](REPORT.md) for the scaffold, card fields, and style.

In the chat, give only the file's absolute path, the totals, and the top recommendation in one line. Then ask which candidates to build.

## Rules

- Propose only. Build, retire, or delete only the items the user picks, after approval.
- No candidate without evidence. If you can't cite the source, drop it.
- Every proposal proves its device on a real past mistake from the evidence. Without one, it is `Speculative`.
- Never propose a move that cuts cost by dropping trust.
