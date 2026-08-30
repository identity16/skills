# identity16/skills

A **personal** agent skill pack for moving between projects without losing understanding of each codebase and service.

The premise: in the AI era, projects are cheap to start and every codebase drifts under AI-assisted change — yet only decisions made with sufficient understanding deserve to land in a codebase. Every skill here must serve that end: raising the user's understanding of the project at hand to the level the work demands. A skill that merely produces output faster, without building understanding, does not belong in this pack.

The pack itself must demand no study: the user is here to understand their projects, not this pack. Every skill must respond to plain language, explain itself in the moment, and never assume the user knows its rules, state layout, or name — the entrypoint dispatches the rest. SKILL.md guides instruct the *agent*, never the user; a skill that only pays off for users who read its guide is broken.

Understanding has a home, in priority order: (1) the code itself — intuitive structure, or a concise explanatory comment where the code must stay complex; (2) well-organized repo artifacts — PRs, docs, commit logs; (3) the user's personal store, only for context that fits neither. Skills that capture understanding must promote it up this ladder before falling back to the personal store. Note the zero-traces invariant below forbids *skill* artifacts, not the work itself — comments, commits, and PRs are the preferred trace.

## Invariants

1. **Zero traces in target projects.** No skill may leave any sign of this pack — its settings or its existence — in a target project's files (including `.gitignore`), commits, PRs, or issues. All state goes to a personal directory the user owns. The why: working styles differ and these skills won't fit everyone, so non-users must never hit a "what is this?" artifact — the only trace worth leaving is the work itself.
2. **Agent-neutral.** Everything must work in both Claude Code and Codex. Do not depend on agent-specific mechanisms (hooks, settings.json, etc.) — use only the global instruction files (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`) and SKILL.md.

## Skill authoring rules

- `skills/<name>/SKILL.md`; directory name = frontmatter `name`.
- All skills and docs in this repo are written in English. Exception: `README.ko.md` is the Korean translation of the README — keep the two in sync when the README changes.
- Skills that must only be invoked explicitly by the user get `disable-model-invocation: true`.
- The personal-state contract (state root, repo-id scheme, file layout) is duplicated in `lets-work` and `checkpoint` SKILL.md because installed skills cannot reliably reference each other's files — when changing it, update both.

## Verify

After changes, confirm skills are discoverable with `npx skills add . --list`, and update the Skills section in the README.
