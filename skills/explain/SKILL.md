---
name: explain
description: Explain a change until the user could defend it — a PR they are about to review, a diff an agent just wrote, a branch they returned to. Use when the user invokes /explain, asks "explain this PR", "walk me through this change", "explain #1094", "이 PR 설명해줘", "이 변경 설명해줘", "이거 뭐 하는 건지 이해 좀 시켜줘", or is about to review or ship a diff they do not yet understand. Builds a working model from the repo's own evidence — the decisions and their consequences, never a file-by-file summary — and turns whatever the code failed to say for itself into a fix to the code.
---

# explain

The user is about to review, approve, or ship a change they don't yet understand. A summary would tell them what changed; this skill leaves them able to say **why it is like this and what breaks if it's wrong** — the model they need in review, and the standard for letting a decision land.

Scale everything to the gap between what the user already knows and what the change decides. A small diff gets a paragraph; nobody needs a production about a rename.

## Steps

### 1. Scope the target

| Argument | Target |
|:--|:--|
| none | current branch vs. base (`main...HEAD`), or this session's own work if that is what the user means |
| `#1094`, `1094`, PR URL | that PR (`gh pr view`, `gh pr diff`) |
| branch name | `<base>...<branch>` |
| `A...B` | that range |
| `--working`, or no commits yet | working tree (`git diff HEAD`) |

Ask only when the target is genuinely ambiguous, or when the scope is too large to explain as one thing (roughly >30 commits or >80 files) — then propose narrowing it. An explanation of everything explains nothing.

Note the audience. The user themself is the default; if they say it's to hand to reviewers, that changes the medium in step 4 — never the honesty.

### 2. Read the record before explaining anything

The diff shows *what*; the record shows *why*. Never explain from the diff alone.

```bash
git log --oneline --no-merges <range>     # the author's own statement of intent
git diff --stat <range>                   # scale
git diff <range> -- <core files>          # read properly
gh pr view <n> --json title,body,url,comments,reviews,files
gh pr checks <n>                          # what is actually verified
```

Collect: commit messages (highest-trust source of intent), the PR body and review threads and linked issues (where alternatives were argued), the **vocabulary the diff introduces** (new types, functions, columns, config keys — the user must learn these to read anything else), and the rules docs of the touched directories (`AGENTS.md`, `CLAUDE.md`, architecture notes — often the reason the change has this shape).

Where the record is silent about pre-existing code, use `why` (if installed) rather than filling the gap. **An invented rationale is worse than an admitted one** — the user will carry it into review and defend it.

### 3. Sort the files: understand vs. skim vs. skip

- **Core** — logic, contracts, schema. Where the change actually lives.
- **Adjacent** — call sites and consumers. Check the signatures line up; nothing more.
- **Skip** — generated code, lockfiles, snapshots, mechanical renames, formatting. Give a one-line reason each group is safe to skip.

Telling the user where *not* to look is most of what an explanation is worth. This triage is the spine of whatever you produce next.

### 4. Explain in whatever medium actually helps

There is no fixed format and no required section list. Pick the cheapest thing that produces understanding, say what you picked, and switch if it isn't landing:

- **A conversation** — the default. A few paragraphs plus a reading order beats any document for a change the user is about to open anyway.
- **A diagram** — when the change moves structure: call path, data flow, or state before → after. Prose describing a topology is a poor substitute.
- **An annotated reading path** — file by file with "what to check here" — for changes that are wide but shallow.
- **A published artifact** — only when it outlives this conversation: a walkthrough handed to reviewers, or something the user asked to keep. Load `artifact-design` first.

Whatever the medium, the understanding has to include:

1. **The problem** — what was broken or missing before, and how it showed up. Never "improves maintainability".
2. **The vocabulary** — at most three new concepts, each one line plus where it's defined (`file:line`). Concepts that already existed in the codebase don't belong here.
3. **The shape** — what the change did structurally, before → after.
4. **The decisions** — three to five: the call made, the alternative it beat, and the evidence for that (commit, PR, issue, rules doc). Anything inferred without a trace in the record is labeled a guess or demoted to item 6. Never manufacture a decision that nobody made.
5. **The consequences** — what the change now relies on, and what breaks when those assumptions shift. This is the part a summary never has and the part review actually needs.
6. **What you couldn't answer** — where the evidence ran out, and what to ask the author. Omitting this makes the explanation feel complete when it isn't.

Link `file:line` to a commit SHA rather than a branch when the remote supports it (branches move and the links rot); plain `file:line` is fine otherwise — never guess a URL.

### 5. Push the missing explanation back into the code

Then ask why this explanation was needed at all. When the answer is that the code hides its own reasoning — a decision with no comment, a name that lies, a rationale surviving only in an old PR — that's a defect this session can fix, in this order:

1. **Fix the code** — restructure, or add the one "why" comment that would have made the explanation unnecessary. This is the default, not the fallback.
2. **Put it in the PR or commit message** — rationale a reviewer needs that the code can't carry.
3. **Leave it as a question for the author** — on someone else's PR, where editing isn't yours to do.
4. **Journal it** — only for users running this pack's session loop, and only for genuinely open questions worth carrying forward.

The measure of this skill: the same change should never need explaining twice.

## Guardrails

- **Explaining is not approving.** Never end with a verdict ("looks fine", "safe to merge"). The user makes that call; hand them the model, including the parts you'd push back on.
- **The user asked to understand, not to be tested.** Don't turn the close into a quiz. Inviting them to push on anything unclear, and going deeper where they do, is the comprehension check.
- Every claim traces to evidence actually read. No praise for the author, no filler sections, no snippets over ~15 lines — link or diagram instead.
- Zero traces: anything promoted into the repo is normal work product — never mention this skill pack or the personal store in it.
