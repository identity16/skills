---
name: lets-work
description: Session entrypoint for working on any project. Use when the user invokes /lets-work, says they are starting work on a project, or returns to one after time away ("catch me up", "what changed here since I left?"). Briefs the user on how the project drifted relative to their own recorded mental model, orients first-time visits, and arms the session's exit ritual (/checkpoint).
---

# lets-work

Entry ritual for a work session. Reads the user's personal state for this project, briefs them on what drifted since their last visit, and sets up how the session ends.

## Personal state (zero-trace contract)

All state lives OUTSIDE the target project, in a directory the user owns. Never write any of it — or any reference to this skill pack — into the target project's files, commits, PRs, or issues.

- Root: `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/projects/<repo-id>/`
- `repo-id`: the normalized `origin` remote URL as a slug — strip protocol, credentials, and `.git`; replace `/` and `:` with `__` (e.g. `github.com__rust-lang__rust`). If the repo has no remote, slug the absolute repo path the same way.
- Files (create on first use):
  - `state.json` — `{ "last_visit": { "commit": "<sha>", "date": "<ISO date>", "branch": "<name>" } }`
  - `dossier.md` — the user's mental model of this project: architecture notes, load-bearing invariants, gotchas, the project's tool stack (where discussion happens, where work is tracked, how things ship), and pointers to where context lives in the repo. Holds only what has no home in the repo itself — it is a fallback, never a mirror of the repo's own docs.
  - `journal.md` — append-only session log: date, what was learned, open questions, WIP state.

## Steps

1. Derive `repo-id` from the current repo and look for its state directory.
2. **Returning visit** (state exists):
   - Read `state.json`, `dossier.md`, and recent `journal.md` entries.
   - Diff reality against the stored model: `git log --oneline <last_visit.commit>..HEAD` and `git diff --stat <last_visit.commit>..HEAD`. If the recorded commit no longer exists (rebase, gc), fall back to `git log --since=<last_visit.date>`.
   - Brief the user **in terms of their notes, not as a generic changelog**: which dossier entries are now stale or contradicted, which journal open questions the new commits answered, which areas are new territory. Keep it short and cite commits/PRs as evidence.
   - Surface still-open questions and WIP notes from the journal.
3. **First visit** (no state):
   - Say so, then build a lean initial dossier: entry points, module map, invariants you can verify, tool stack (ask the user for what is not discoverable from the repo). Record only what the repo's own docs do NOT already make obvious.
   - Write `state.json` with the current commit.
4. Ask what today's work is. If the user names a task, check it against the dossier: which parts of the affected area the user already understands, and what they should learn first.
5. **Arm the exit ritual** for the rest of this session: when the user signals wrapping up ("that's it for today", "PR is up", "done here", a clearly final push), propose running `/checkpoint` to capture what was learned. Propose once — do not nag.

## Guardrails

- The brief must raise understanding, not merely save reading time: always tie changes back to the user's recorded model.
- Understanding gained during the session belongs, in priority order: in the code (a concise comment), in the PR/commit, and only lastly in the personal store. `/checkpoint` does that routing — this skill only arms it.
