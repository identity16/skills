# identity16/skills

A **personal** agent skill pack, organized into bucket folders under `skills/`. Each bucket serves one premise; a skill belongs in a bucket only if it serves that bucket's premise.

The whole pack must demand no study: the user is here for their own work, not to learn this pack. Every skill must respond to plain language, explain itself in the moment, and never assume the user knows its rules, state layout, or name — an entrypoint dispatches the rest. SKILL.md guides instruct the *agent*, never the user; a skill that only pays off for users who read its guide is broken.

## Buckets

### `understanding/` — moving between projects without losing understanding

The premise: in the AI era, projects are cheap to start and every codebase drifts under AI-assisted change — yet only decisions made with sufficient understanding deserve to land in a codebase. Every skill here must serve that end: raising the user's understanding of the project at hand to the level the work demands. A skill that merely produces output faster, without building understanding, does not belong in this bucket.

Understanding has a home, in priority order: (1) the code itself — intuitive structure, or a concise explanatory comment where the code must stay complex; (2) well-organized repo artifacts — PRs, docs, commit logs; (3) the user's personal store, only for context that fits neither. Skills that capture understanding must promote it up this ladder before falling back to the personal store. Note the zero-traces invariant below forbids *skill* artifacts, not the work itself — comments, commits, and PRs are the preferred trace.

### `loops/` — delegating recurring judgments through feedback loops

The premise: a recurring judgment should be delegated no faster than the reasons behind it become explicit. A loop proposes, the user approves or corrects with a reason, and corrections become rules; a rule skips review only after a track record and the user's approval. Success is fewer items needing review without more corrections — and the rulebook, the user's judgment written down, is worth having in its own right. A skill that automates without capturing the reasons does not belong in this bucket.

## Invariants

1. **Zero traces in target projects.** No skill may leave any sign of this pack — its settings or its existence — in a target project's files (including `.gitignore`), commits, PRs, or issues. All state goes to a personal directory the user owns. The why: working styles differ and these skills won't fit everyone, so non-users must never hit a "what is this?" artifact — the only trace worth leaving is the work itself.
2. **Agent-neutral.** Everything must work in both Claude Code and Codex. Do not depend on agent-specific mechanisms (hooks, settings.json, etc.) — use only the global instruction files (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`) and SKILL.md.

## Skill authoring rules

- `skills/<bucket>/<name>/SKILL.md`; directory name = frontmatter `name`.
- Each bucket has a `README.md` listing its skills, one line each, linked to their `SKILL.md`.
- All skills and docs in this repo are written in English. Exception: `README.ko.md` is the Korean translation of the README — keep the two in sync when the README changes.
- Skills that must only be invoked explicitly by the user get `disable-model-invocation: true`.
- Personal-state contracts are duplicated because installed skills cannot reliably reference each other's files — when changing one, update every copy: `projects/` (state root, repo-id scheme, file layout) in `lets-work` and `checkpoint`; `loops/` (file layout and schemas) in `make-loop` and `maintain-loop`.

## Verify

After changes, run `node tools/check-skills.mjs` (CI runs it too) and fix what it reports. It checks names, READMEs, and duplicated state contracts; prose sync between `README.md` and `README.ko.md` stays on you.
