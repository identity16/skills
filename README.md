# skills

English | [한국어](./README.ko.md)

Personal agent skills for contributing to many projects without losing your grip on any of them. Installable with the [Skills CLI](https://github.com/vercel-labs/skills); works in both Claude Code and Codex.

## Why

Switching between projects is expensive in two ways: every project runs a different tool stack (where discussion happens, where work is tracked, how things ship), and agents rewrite codebases faster than your mental model keeps up.

## Philosophy

**Ship only decisions you understand.**
The AI era makes projects cheap to start and independent contexts easy to switch between — working across many projects is the new normal. It also fills every one of those projects with AI-assisted contributions, so understanding decays even in codebases you work on yourself. But a decision deserves to land in a codebase only when it was made with sufficient understanding. So these skills exist to raise your understanding of every project you contribute to — up to the level the work at hand demands.

**Understanding lives in the work, or as close to it as possible.**
The best codebase needs no external context: intuitive code and structure — or, where the code must stay complex, a concise comment that explains it well. Second best is context that is easy to find: well-organized PRs, docs, and commit logs. A personal store outside the repo is the last resort, for context that fits neither. So when these skills capture understanding, they push it *up* this ladder whenever possible — promote a hard-won lesson into a code comment, a decision into a PR description — and keep privately only what has no home in the repo. A personal store that shrinks over time means the codebase is getting better.

**Zero traces in target projects.**
Everything these skills know lives in a private directory you own — never in the projects you contribute to. No config files, no `.gitignore` entries, no commits, nothing. Your setup travels with *you*, not with the repo.

This is respect as much as hygiene. Everyone works differently, and even these skills won't fit everyone — so non-users must never hit a "what is this?" artifact. The only trace worth leaving is the work itself; if these skills spread, let it be through someone asking *"how are you this productive?"*.

## Skills

### Routines

The habits that bookend every session: `/lets-work` on the way in, `/checkpoint` on the way out. All state lives under `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/`, never in the target project.

| Skill | What it does |
|---|---|
| `lets-work` | Session entrypoint. Briefs you on how the project drifted relative to *your* recorded mental model since your last visit (or orients a first visit), then sets the session's working frame: surface decisions before they land, put understanding where it lives longest, propose `/checkpoint` on the way out. |
| `checkpoint` | Exit ritual. Routes what the session taught you to its proper home — code comment, PR/commit message, or your personal journal — and records the visit marker the next `lets-work` briefs from. |

### Tools

Reached for when the task calls for them. Each one makes the repo's own record — commits, PRs, docs — carry more of the context, so less ends up needing a personal store at all.

| Skill | What it does |
|---|---|
| `organize-commits` | Restructures a branch into reviewer-friendly, bisectable commits — every commit builds and passes tests on its own, and every message carries the "why" its diff cannot. |

## Install

```bash
# See what's available
npx skills add identity16/skills --list

# Install every skill in this repo
npx skills add identity16/skills

# Install for both Claude Code and Codex, globally, without prompts
npx skills add identity16/skills -g -a claude-code,codex -y
```

## Adding a skill

Create `skills/<name>/SKILL.md`; new skills must uphold the philosophy above. Authoring rules live in `CLAUDE.md`. Verify discoverability before committing with `npx skills add . --list`, and update the Skills section here.
