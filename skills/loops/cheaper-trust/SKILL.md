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

Takes a target as an argument (a repo path, a file, a PR range). Without one, scan the current working directory plus the user-level prose: the global instruction files (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`, and files they include), installed skills, and the current project's agent memory.

## 1. Collect the rules held by lower layers

Start from the most expensive layer. Record each rule with its source (`file:line` or a PR link).

- **human review** — review comments on recently merged PRs (`gh pr list --state merged -L 30`, `gh api repos/{o}/{r}/pulls/{n}/comments`). A comment made twice or more is a candidate. Feedback entries in agent memory and correction examples in the user's preference files are also things a person caught.
- **prose** — imperative sentences in `CLAUDE.md`, `AGENTS.md`, `.claude/rules/`, `.cursor/rules/`, and skill bodies ("never …", "always …", "after X, run Y", "check that …").
- **verification** — procedures where an agent or a person "runs it and checks", runtime asserts, manual checklists.
- **static analysis** — how often `eslint-disable`, `@ts-ignore`, `# noqa` appear; custom lint rules that block a forbidden pattern. Check whether API design could make the pattern impossible instead.

## 2. Run the tests on each rule

The first layer from the top that answers "yes" is the target layer.

1. **codebase** — Can the wrong state be made unrepresentable through types, the API, or directory structure? (e.g. "always call B after A" → one function that does A and B)
2. **static analysis** — Can a machine judge a violation from the input alone? Yes if a regex, AST check, schema, test, or hook can express it. (e.g. "never write non-ASCII text as `\uXXXX` escapes" → a post-write hook that greps for them)
3. **verification** — Does it take a run to know, but can a machine still judge the result? (e.g. "after moving files, check none ended up empty" → a script that lists zero-byte files)
4. If none apply, the rule needs **judgment** and belongs in prose. But if only human review is catching it today, lift it into prose at least.

Also look for:
- **Duplication** — when a higher-layer device already exists and prose repeats it, shrink the prose to a one-line pointer to the device, or delete it.
- **Half moves** — when the device exists but is run by hand ("after moving, run the script"), the move is done only once a hook or CI runs it automatically.

## 3. Rank by running cost saved

Sort roughly by `frequency × layer gap`: how often the rule is paid for today, times how many layers it moves up.

- Frequency: how many times it came up in review, how often the rule is invoked, whether there is an incident record (a rule that carries dates or counts is a rule that already failed).
- Layer gap: moving from human review to static analysis saves more per occurrence than moving from prose to verification.
- Attach the definition cost as a payback note — small (one regex or hook) / medium (custom lint rule, test) / large (API redesign, migration) — and how many occurrences it takes to pay back. Don't let it sink a frequent rule; drafting the device is exactly the work an agent makes cheap.
- Propose an LLM-judged device only when no deterministic alternative exists. An LLM judge sits closer to prose than to verification.

## 4. Report

Top 5–10 only, in this shape:

```
### <the rule, in one line>
`prose` → `static analysis`  ·  frequency: <n per period / incidents>  ·  definition cost: small, pays back after ~<n> occurrences
- Evidence: <file:line / PR link / incident record>
- Device: <what exactly to build, and where it runs>
- Remaining prose: <delete / one-line pointer / keep only the judgment part>
```

Then list, one short line each, the rules that need judgment and should stay in prose. Deciding not to move something is a result too.

## Rules

- Propose only. Build devices or delete prose only for the items the user picks, after approval.
- No candidate without evidence. If you can't cite the source, drop it.
- Include in each proposal a way to check the device really holds the rule: one violating example that the device catches.
