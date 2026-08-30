# skills

English | [한국어](./README.ko.md)

Personal agent skills for contributing to many projects without losing your grip on any of them. Installable with the [Skills CLI](https://github.com/vercel-labs/skills); works in both Claude Code and Codex.

## Why

Switching between projects is expensive in two ways: every project runs a different tool stack (where discussion happens, where work is tracked, how things ship), and agents rewrite codebases faster than your mental model keeps up.

## Philosophy

**Ship only decisions you understand.**
The AI era makes projects cheap to start and independent contexts easy to switch between — working across many projects is the new normal. It also fills every one of those projects with AI-assisted contributions, so understanding decays even in codebases you work on yourself. But a decision deserves to land in a codebase only when it was made with sufficient understanding. So these skills exist to raise your understanding of every project you contribute to — up to the level the work at hand demands.

**Zero traces in target projects.**
Everything these skills know lives in a private directory you own — never in the projects you contribute to. No config files, no `.gitignore` entries, no commits, nothing. Your setup travels with *you*, not with the repo.

This is respect as much as hygiene. Everyone works differently, and even these skills won't fit everyone — so non-users must never hit a "what is this?" artifact. The only trace worth leaving is the work itself; if these skills spread, let it be through someone asking *"how are you this productive?"*.

## Skills

None yet — being planned from the philosophy above.

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
