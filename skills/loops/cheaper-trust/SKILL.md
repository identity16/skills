---
name: cheaper-trust
description: Find where trust in agent output can be bought at a lower running cost, and propose the moves. Uses the cost-trust pyramid (codebase → static analysis → verification → prose → human review) to find trust currently held by an expensive layer (human review, prose rules) that a cheaper layer (code structure, lint, types, tests, hooks, CI) could hold instead. Use when the user invokes /cheaper-trust or asks things like "find rules we could move to a cheaper layer", "can this rule be a lint rule?", "reviewers keep making the same comment", "slim down AGENTS.md / CLAUDE.md", "how do I trust my agents more", "신뢰를 더 싸게", "더 싼 층으로 옮길 거 찾아줘", "이 규칙 린트로 못 바꿔?", "리뷰에서 매번 같은 지적 나오는데". Works on a repository, a notes vault, skills, or agent memory. Proposes only; implements after approval.
---

# cheaper-trust

Source: Lauren Tan, *All Code Is Slop (Except Mine)* — the "poteto pyramid".

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

Takes a target as an argument (a repo path, a file, a PR range). Without one, scan the current working directory plus the user-level setup of **both Claude Code and Codex**: the global instruction files (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, and files they include), installed skills, each agent's hook config, and each agent's memory for the current project. The user may switch agents at any time, so every proposal must hold under both.

## 1. Collect the rules held by lower layers

Start from the most expensive layer. Record each rule with its source (`file:line` or a PR link).

- **human review** — review comments on recently merged PRs (`gh pr list --state merged -L 30`, `gh api repos/{o}/{r}/pulls/{n}/comments`). A comment made twice or more is a candidate. Feedback entries in agent memory and correction examples in the user's preference files are also things a person caught.
- **prose** — imperative sentences in `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, `.cursor/rules/`, skill bodies, and either agent's memory ("never …", "always …", "after X, run Y", "check that …"). Note which agent reads each file: `AGENTS.md` reaches Codex, `CLAUDE.md` reaches Claude Code, and memory reaches only the agent that wrote it.
- **verification** — procedures where an agent or a person "runs it and checks", runtime asserts, manual checklists.
- **static analysis** — how often `eslint-disable`, `@ts-ignore`, `# noqa` appear; custom lint rules that block a forbidden pattern. Check whether API design could make the pattern impossible instead. Include agent hooks — Claude Code's `hooks` in `.claude/settings.json` (project or user) and Codex's hook config (`hooks.json` or `[hooks]` in `config.toml`, under `.codex/` or `~/.codex/`) — and note which agent each one runs under.

## 2. Run the tests on each rule

The first layer from the top that answers "yes" is the target layer.

1. **codebase** — Can the wrong state be made unrepresentable through types, the API, or directory structure? (e.g. "always call B after A" → one function that does A and B)
2. **static analysis** — Can a machine judge a violation from the input alone? Yes if a regex, AST check, schema, test, or hook can express it. (e.g. "never write non-ASCII text as `\uXXXX` escapes" → a pre-commit check that greps for them)
3. **verification** — Does it take a run to know, but can a machine still judge the result? (e.g. "after moving files, check none ended up empty" → a script that lists zero-byte files)
4. If none apply, the rule needs **judgment** and belongs in prose. But if only human review is catching it today, lift it into prose at least.

### Where the device runs

A device holds the rule only where it runs, and the user works in both Claude Code and Codex. Pick the first home that fits:

1. **Agent-agnostic** — types, the API, lint, tests, git hooks (pre-commit, pre-push), CI. They hold under any agent and for a person typing by hand. Default here.
2. **Agent hooks, registered for both** — only when the rule must be enforced inside the session, before the commit (e.g. block a tool call, check a file right after it is written). Put the check in one script in the repo (or the user's home for user-level rules) and register it in both agents' hook configs under the same event (`PreToolUse`, `PostToolUse`, `Stop` exist in both). Check each agent's current docs for the exact event name and file path before writing the registration. Never propose a hook for one agent alone.

A rule that stays prose belongs where both agents read it: `AGENTS.md`, with `CLAUDE.md` importing it (`@AGENTS.md`) or symlinked to it. Rules in agent memory are read by one agent only; promote any that should hold under both.

Also look for:
- **Held by one agent only** — a rule written only in `CLAUDE.md`, only in one agent's memory, or enforced by a hook only one agent runs. Switching agents silently drops it.
- **Duplication** — when a higher-layer device already exists and prose repeats it, shrink the prose to a one-line pointer to the device, or delete it.
- **Half moves** — when the device exists but is run by hand ("after moving, run the script"), the move is done only once a hook or CI runs it automatically.

## 3. Rank by running cost saved

Sort roughly by `frequency × layer gap`: how often the rule is paid for today, times how many layers it moves up.

- Frequency: how many times it came up in review, how often the rule is invoked, whether there is an incident record (a rule that carries dates or counts is a rule that already failed).
- Layer gap: moving from human review to static analysis saves more per occurrence than moving from prose to verification.
- Attach the definition cost as a payback note — small (one regex or hook) / medium (custom lint rule, test) / large (API redesign, migration) — and how many occurrences it takes to pay back. Don't let it sink a frequent rule; drafting the device is exactly the work an agent makes cheap.
- Propose an LLM-judged device only when no deterministic alternative exists. An LLM judge sits closer to prose than to verification.

## 4. Report

Top 5–10 candidates only, as a self-contained HTML file — never in the target project. Resolve the temp dir from `$TMPDIR`, falling back to `/tmp` (`%TEMP%` on Windows), write `<tmpdir>/cheaper-trust-<timestamp>.html`, and open it (`open` on macOS, `xdg-open` on Linux, `start` on Windows). If the user's instructions name a way to share such reports, follow it.

Each candidate is a card with a before/after cross-section of the pyramid showing where the rule is held now and where it would be held, plus strength, the move, where the device runs, evidence, a device, a violating example it catches, payback, and what prose remains. After the cards: the rules that need judgment and stay in prose (deciding not to move something is a result too), then a top recommendation. See [REPORT.md](REPORT.md) for the scaffold, card fields, and style.

In the chat, give only the file's absolute path, the totals, and the top recommendation in one line. Then ask which candidates to build.

## Rules

- Propose only. Build devices or delete prose only for the items the user picks, after approval.
- No candidate without evidence. If you can't cite the source, drop it.
- Include in each proposal a way to check the device really holds the rule: one violating example that the device catches.
