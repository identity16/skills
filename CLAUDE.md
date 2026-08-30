# identity16/skills

A **personal** agent skill pack for moving between projects without losing understanding of each codebase and service.

The premise: in the AI era, projects are cheap to start and every codebase drifts under AI-assisted change — yet only decisions made with sufficient understanding deserve to land in a codebase. Every skill here must serve that end: raising the user's understanding of the project at hand to the level the work demands. A skill that merely produces output faster, without building understanding, does not belong in this pack.

## Invariants

1. **Zero traces in target projects.** No skill may leave any sign of this pack — its settings or its existence — in a target project's files (including `.gitignore`), commits, PRs, or issues. All state goes to a personal directory the user owns. The why: working styles differ and these skills won't fit everyone, so non-users must never hit a "what is this?" artifact — the only trace worth leaving is the work itself.
2. **Agent-neutral.** Everything must work in both Claude Code and Codex. Do not depend on agent-specific mechanisms (hooks, settings.json, etc.) — use only the global instruction files (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`) and SKILL.md.

## Skill authoring rules

- `skills/<name>/SKILL.md`; directory name = frontmatter `name`.
- All skills and docs in this repo are written in English. Exception: `README.ko.md` is the Korean translation of the README — keep the two in sync when the README changes.
- Skills that must only be invoked explicitly by the user get `disable-model-invocation: true`.

## Verify

After changes, confirm skills are discoverable with `npx skills add . --list`, and update the Skills section in the README.
