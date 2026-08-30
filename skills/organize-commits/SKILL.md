---
name: organize-commits
description: Reorganize the current branch's work into a clean, reviewer-friendly sequence of bisectable commits. Use when the user asks to clean up commits, split a messy WIP into logical commits, prepare a branch for review/PR, organize changes into bisectable history, or rewrite history so each commit builds and passes tests on its own. Triggers on phrases like "organize commits", "bisectable commits", "clean up history", "split this commit", "커밋 정리해줘", "커밋 쪼개줘", "리뷰어 친화적으로".
---

# Organize Commits

Restructure a branch's work into a sequence a reviewer can read **one commit at a time**, where **every commit builds and passes tests on its own**.

A well-organized commit log is one of the places understanding lives longest: each commit message carries the "why" its diff cannot express, and the sequence itself teaches the reviewer how the change was reasoned. This skill produces that artifact.

## Principles

Every commit must satisfy all of these:

1. **One logical change.** Never mix refactoring with behavior changes. Mechanical changes (formatting, renames) get their own commits.
2. **Builds and passes tests at that point in history.** No "fixed in the next commit" debt — that is what makes `git bisect` meaningful.
3. **The message explains WHY.** The diff already shows what. Record constraints, rejected alternatives, hidden invariants.
4. **Order carries meaning.** Typically: preparatory cleanup/refactor → infrastructure/additions → new behavior → call-site migration → dead code removal → tests/docs. A later commit must never partially revert an earlier one.
5. **Keep them small.** Readable in one sitting. If it feels too big, it can almost always be split further.

## Procedure

### 1. Assess the current state

Run in parallel:

```
git status
git log --oneline @{upstream}..HEAD   # no upstream → use main/master
git diff --stat <base>...HEAD
git diff <base>...HEAD                # skim the full diff once
```

`<base>` is usually `origin/main` or `main`. If unclear, ask the user.

### 2. Group changes into logical units

Read the full diff and group from the angle of "how would I explain this to a reviewer". For example:

- Preparatory refactor (no behavior change)
- New module/type/helper (nothing calls it yet)
- New behavior
- Call-site migration (old → new)
- Dead code removal
- Tests / docs

Show the grouping briefly and get agreement. (With more than 3 commits, showing it first is almost always right.)

### 3. Build a safety net

Before rewriting anything, create a backup branch:

```
git branch backup/<current>-$(date +%s)
```

If the working tree has untracked/uncommitted changes, stash or commit first — and tell the user.

### 4. Choose a restructuring method

Propose the method that fits:

- **Single commit, or working tree only**: `git reset` then re-commit hunk by hunk
  ```
  git reset <base>            # or reset --soft HEAD~N
  git add -p                  # pick hunks per group
  git commit -m "..."
  ```
- **Reordering/squashing multiple commits**: `git rebase -i <base>` — **but `-i` is interactive and cannot run directly in this environment.** Give the user the command to run themselves, or handle it non-interactively with `git rebase --onto` + cherry-pick.
- **Changes split cleanly by file**: repeat `git add <file>` + commit.
- **Changes split within one file**: `git add -p` (`s` to split hunks, `e` for line-level edits).

### 5. Verify every commit

This is the heart of "bisectable". As each commit is created:

```
<build command>    # project-specific; at minimum type check / lint
<test command>     # at minimum the fast unit tests
```

On failure, fix that commit (`git commit --amend` or fixup + autosquash). **Never move on with "the next commit fixes it."**

When the whole sequence is done, verify once more:

```
git rebase <base> --exec '<build>; <test>'
```

If this passes, every commit passes individually.

### 6. Commit messages

Subject line (~50 chars) + blank line + body (wrap at 72). The body covers:

- **Why** this change is needed
- Alternatives considered and rejected (if any)
- Constraints/invariants a reviewer could miss
- Where this commit sits in the series (e.g. "call sites migrate in a follow-up commit")

Check the repo's existing style first (`git log`) — if it uses conventional commits, follow suit.

### 7. Push

An already-pushed branch needs a force-push. **Get the user's explicit approval first**, and use `--force-with-lease`. Never force-push main/master.

```
git push --force-with-lease -u origin <branch>
```

## Safety rules

- **Never rewrite history without a backup branch.**
- `rebase -i` is interactive — never invoke it directly in this environment; guide the user or use a non-interactive alternative.
- No `--no-verify`, no lease-less `git push -f`, unless the user explicitly asks.
- If the build/test commands are unknown, look in `CLAUDE.md`, `package.json`, `Makefile`, `README`; if still unknown, ask.
- If one commit grows too large, stop and discuss further splitting with the user.

## Anti-patterns

- Leaving meaningless messages like "WIP", "fix", "address review" in the final history
- Touching the same file twice where the second commit partially reverts the first
- Mixing refactoring and behavior changes in one commit
- Placing a tests-only commit *before* the implementation (tests fail at that commit → bisect breaks)
- Running `npm test` once at the end and reporting "it passes" — each commit must pass for bisect to mean anything
