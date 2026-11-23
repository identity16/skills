# skills

English | [한국어](./README.ko.md)

Personal agent skills, grouped by theme: keeping your grip on many projects at once, turning recurring judgments into feedback loops, and backing "it works" with runs anyone can repeat. Installable with the [Skills CLI](https://github.com/vercel-labs/skills); works in both Claude Code and Codex.

## Why

Switching between projects is expensive in two ways: every project runs a different tool stack (where discussion happens, where work is tracked, how things ship), and agents rewrite codebases faster than your mental model keeps up.

## Philosophy

**Ship only decisions you understand.**
The AI era makes projects cheap to start and independent contexts easy to switch between — working across many projects is the new normal. It also fills every one of those projects with AI-assisted contributions, so understanding decays even in codebases you work on yourself. But a decision deserves to land in a codebase only when it was made with sufficient understanding. So these skills exist to raise your understanding of every project you contribute to — up to the level the work at hand demands.

**Understanding lives in the work, or as close to it as possible.**
The best codebase needs no external context: intuitive code and structure — or, where the code must stay complex, a concise comment that explains it well. Second best is context that is easy to find: well-organized PRs, docs, and commit logs. A personal store outside the repo is the last resort, for context that fits neither. So when these skills capture understanding, they push it *up* this ladder whenever possible — promote a hard-won lesson into a code comment, a decision into a PR description — and keep privately only what has no home in the repo. A personal store that shrinks over time means the codebase is getting better.

**No manual required.**
These skills are not something to study — the understanding they exist to build is of your *projects*, never of the pack itself. There is nothing to remember: every skill answers to plain language ("why is this like this?", "walk me through this change"), explains what it's doing as it goes, and never assumes you know its rules, its state files, or even its name. If a skill only pays off after you've read its guide, the skill is broken.

**Zero traces in target projects.**
Everything these skills know lives in a private directory you own — never in the projects you contribute to. No config files, no `.gitignore` entries, no commits, nothing. Your setup travels with *you*, not with the repo.

This is respect as much as hygiene. Everyone works differently, and even these skills won't fit everyone — so non-users must never hit a "what is this?" artifact. The only trace worth leaving is the work itself; if these skills spread, let it be through someone asking *"how are you this productive?"*.

## Skills

### `understanding/` — keep your grip on every project

Skills that raise your understanding of the project at hand, reached for when the task calls for them. Each one makes the project's own record — commits, PRs, tickets, docs — carry more of the context, so less ends up needing a personal store at all. See [`skills/understanding/`](./skills/understanding/README.md).

| Skill | What it does |
|---|---|
| `organize-commits` | Restructures a branch into reviewer-friendly, bisectable commits — every commit builds and passes tests on its own, and every message carries the "why" its diff cannot. |
| `why` | Excavates why a piece of code is the way it is — blame → commits → PRs → issues — and answers with evidence, never a guess. A cold trail becomes a proposal to restore the lost context as a comment. |
| `explain` | Explains a change until you could defend it — the problem behind it, the decisions and what they beat, and what breaks if their assumptions shift — grounded in the repo's record rather than a guessed rationale. Whatever the code failed to say for itself becomes a fix to the code. |
| `depth-check` | Before a nontrivial task, computes how much understanding the work demands — working model, contract, or mere awareness per area — subtracts what you already know, and emits the short list of questions to answer before coding. |
| `make-ticket` | Drafts a ticket body that records intent, not a solution — problem, wanted outcome, affected users and systems, constraints, open questions. Grounds it in the repo, leaves unknowns as questions rather than guesses, and files it to Linear when a tracker is connected. (Format inspired by Anthropic's AI-native SDLC playbook.) |

### `loops/` — delegate a recurring judgment by writing down why

For judgments you make again and again by hand (sorting a ledger, reviewing PRs). The agent proposes, you approve or correct with a reason, and each correction becomes a rule; a rule skips your review only after a track record and your approval. The loop is working when fewer items need you while corrections stay rare. State lives under `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/loops/`. See [`skills/loops/`](./skills/loops/README.md).

| Skill | What it does |
|---|---|
| `make-loop` | Defines a loop: what an item is, where items come from, what the agent looks up itself, what a proposal looks like, how you review, where approved outcomes go, and how to verify they landed. Rules start nearly empty and grow from your corrections. |
| `maintain-loop` | Runs a cycle: collect → propose with cited rules and a confidence → review only what needs you → turn corrections into rules and flag repeated ones → apply and verify → report the review-needed trend. Proposes rule promotions; you approve them. |
| `cheaper-trust` | Groups the mistakes agents keep repeating into classes and finds those that a costly layer — human review or prose like AGENTS.md — keeps paying for on every change, and proposes moving them to a cheaper one: code structure, lint, types, tests, CI — placed so it holds under both Claude Code and Codex, never one alone. Ranks by running cost saved, not by how hard the device is to write, and proves each device on a real past mistake. Also proposes retiring devices and rules that no longer add trust — duplicated, dead, or copied — once what remains is shown to still catch the mistake. Reports as a visual HTML page — a before/after of the pyramid per rule — and proposes only; you pick what gets built. |

### `verification/` — back "it works" with a run anyone can repeat

For checks you would otherwise do by hand on a phone or a browser. Devices, test data, and cleanup are all handled by code, so a run can be repeated unattended and never leaves state behind for you to clean. State lives under `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/smoke/`. See [`skills/verification/`](./skills/verification/README.md).

| Skill | What it does |
|---|---|
| `smoke` | Sets up and runs smoke tests on one deep module, the Smoke Run: you write a device, the cases (test data) a scenario needs, and its steps; the run provisions, sets up, executes, and releases in reverse order — even on failure, Ctrl-C, or a crash, whose leftovers the next run cleans up. |

## Install

```bash
# See what's available
npx skills add identity16/skills --list

# Install every skill in this repo
npx skills add identity16/skills

# Install for both Claude Code and Codex, globally, without prompts
npx skills add identity16/skills -g -a claude-code codex -y
```

## Adding a skill

Create `skills/<bucket>/<name>/SKILL.md`; new skills must uphold the philosophy above. Authoring rules live in `CLAUDE.md`. Verify discoverability before committing with `npx skills add . --list`, and update the Skills section here.
