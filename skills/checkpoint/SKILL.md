---
name: checkpoint
description: Exit ritual for a work session. Use when the user invokes /checkpoint, says they are done for the day or leaving a project for a while, or accepts the wrap-up proposal armed by /lets-work. Routes each piece of understanding gained this session to its proper home — a code comment, the PR/commit message, or the personal journal — then records the visit marker the next /lets-work will brief from.
---

# checkpoint

Write-side twin of `lets-work`. Captures what this session taught the user, promoting each item as far up the ladder as it can go: code first, repo artifacts second, the personal store last.

## Personal state (zero-trace contract)

Same contract as `lets-work` — keep the two in sync:

- Root: `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/projects/<repo-id>/`
- `repo-id`: normalized `origin` URL slug (strip protocol/credentials/`.git`; `/` and `:` → `__`); no remote → absolute path slugged the same way.
- Files: `state.json` (last-visit marker), `dossier.md` (mental model; fallback, never a mirror), `journal.md` (append-only session log).

Never write any of this — or any reference to this skill pack — into the target project's files, commits, PRs, or issues.

## Steps

1. Collect candidates: walk back through the session and list what was learned — decisions made, gotchas hit, invariants discovered, assumptions refuted, questions still open, WIP state.
2. Route each item up the ladder, **proposing promotions rather than silently applying them**:
   - **Code**: a non-obvious constraint or "why" the code cannot express → propose a concise comment at the load-bearing spot, following the target project's comment norms.
   - **Repo artifacts**: the rationale for the approach taken, alternatives rejected → propose adding it to the PR description or the commit message being shipped.
   - **Personal journal**: project process facts (where discussion happens, how to run things locally), the user's open questions, WIP notes — anything with no home in the repo → append to `journal.md` under today's date.
3. Update `dossier.md` with deltas to the mental model: new or changed invariants, corrected beliefs. Delete entries the codebase now makes obvious — a shrinking dossier means the codebase is improving.
4. Write `state.json` with the current commit, date, and branch.
5. Confirm to the user what went where.

## Guardrails

- Promotions into the repo are normal work product (comments, PR text, commit messages) — but they must never mention this skill pack, the personal store, or its paths.
- Do not journal what the repo already records (code structure, git history, existing docs).
