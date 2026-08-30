---
name: lets-work
description: Session entrypoint for working on any project. Use when the user invokes /lets-work, says they are starting work on a project, or returns to one after time away ("catch me up", "what changed here since I left?"). Briefs the user on how the project drifted relative to their own recorded mental model, orients first-time visits, and sets the session's working frame — the user's work-style philosophy, including arming the exit ritual (/checkpoint).
---

# lets-work

Entry ritual for a work session. Reads the user's personal state for this project, briefs them on what drifted since their last visit, and sets up how the session ends.

**The ritual's weight must be proportional to the drift.** This skill earns its place on re-entry after absence; it must never become a gate the user waits behind every session. When little or nothing changed since the last visit, the whole entry is one line ("nothing drifted since yesterday — what are we on?") and work starts immediately. The full briefing below is for real absence.

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
   - **Gauge the drift first.** Little to none (a recent visit, few or no commits by others, nothing touching areas the dossier covers) → one line: confirm nothing drifted, mention any open WIP note, and go straight to step 5. Otherwise:
   - Brief the user **in terms of their notes, not as a generic changelog**: which dossier entries are now stale or contradicted, which journal open questions the new commits answered, which areas are new territory. Keep it short and cite commits/PRs as evidence.
   - Surface still-open questions and WIP notes from the journal.
3. **First visit** (no state):
   - Say so, then build a lean initial dossier: entry points, module map, invariants you can verify, tool stack (ask the user for what is not discoverable from the repo). Record only what the repo's own docs do NOT already make obvious.
   - Write `state.json` with the current commit.
4. If the user hasn't already said what they're here to do, ask. When a task is named **and** it touches territory the dossier marks as shaky or unknown, run `depth-check` (if installed — otherwise note briefly what to learn first). If the territory is known, don't editorialize; just start.
5. **Set the session frame.** For the rest of this session, work under the user's philosophy:
   - **Ship only decisions the user understands.** Before a nontrivial decision lands in the codebase, surface it — the choice made, the alternative rejected, what breaks if it's wrong — so the user endorses it rather than merely accepts it. Never bury a judgment call inside a large diff.
   - **Put understanding where it lives longest**, in priority order: intuitive code and structure first; a concise "why" comment where the code must stay complex; well-organized commit messages and PR descriptions; the personal store only for what has no home in the repo. Apply this continuously while working, not just at the end.
   - **Reach for the pack's tools at their moments** (those that are installed): the user questions why existing code is the way it is → use `why` (excavate the record; never guess a rationale); a branch's history needs cleaning up before review → suggest `organize-commits`; a sizable AI-authored diff is about to ship → offer `grill` to check the user owns its decisions. Offer at the natural moment, once — the user declines freely.
   - **Arm the exit ritual**: when the user signals wrapping up ("that's it for today", "PR is up", "done here", a clearly final push), propose running `/checkpoint` to capture what was learned. Propose once — do not nag.

## Guardrails

- The brief must raise understanding, not merely save reading time: always tie changes back to the user's recorded model.
- The session frame is behavior, not a lecture: apply it silently while working; don't recite it to the user.
- Never make the user wait behind ceremony: no drift means no briefing, and a named task means no questions.
