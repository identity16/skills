---
name: why
description: Excavate why a piece of code is the way it is, from the repo's own record. Use when the user questions existing code — "why is this like this?", "why is this hardcoded?", "what's the story behind this?", "왜 이렇게 돼 있어?", "이거 왜 이래?", "이 코드 배경이 뭐야" — or whenever you are about to explain the rationale of code you did not write. Never guess the why; dig it out of blame → commits → PRs → issues and answer with evidence.
---

# why

Reconstruct the reasoning behind existing code by mining the record the repo already carries: the line's history, the commit messages, the PR discussion, the linked issues. The output is a story with evidence, not a link dump — and never a guess.

**The one hard rule: never invent a rationale.** A plausible-sounding explanation for code you didn't research is worse than "the record doesn't say" — it plants false understanding. Every claim about intent must cite a source (a comment, a commit, a PR, an issue) or be clearly labeled as inference.

## The dig — layer by layer, stopping when answered

Go only as deep as the question demands. One `git log -L` answers most questions; the full dig is for load-bearing mysteries.

### Layer 0 — the code itself

Check whether a nearby comment, docstring, or the project's docs already answer it. If yes, quote it and stop — that's the codebase working as it should.

### Layer 1 — commit history

Find the commits that shaped the code in question:

```
git log -L <start>,<end>:<file>          # full evolution of a line range
git log -L :<funcname>:<file>            # or of a function
git blame -w -C -M <file> -L <start>,<end>   # last-touch view, ignoring whitespace/moves
```

- Blame shows the *last* touch, not the origin — walk `git log -L` output back to the commit that introduced the decision.
- Skip superficial commits (formatting, mass renames); honor `.git-blame-ignore-revs` if the repo has one (`--ignore-revs-file`).
- If the file was renamed, add `--follow` to plain `git log` on the file.

Read the relevant commit messages in full (`git show -s <sha>`). A good message may end the dig here.

### Layer 2 — pull requests

Find the PR that merged each relevant commit and read the human discussion around it:

```
gh api repos/{owner}/{repo}/commits/<sha>/pulls   # commit → PRs
gh pr view <number> --comments                    # body + discussion
```

The PR body explains intent; review threads often record the exact alternative that was rejected and why. Search the threads for the file/lines in question. If the remote isn't GitHub or `gh` is unavailable, say the PR layer is out of reach and continue with what git alone provides.

### Layer 3 — issues

Follow references from the PR body and commit messages (`fixes #N`, `closes #N`, ticket IDs) to the original problem report. This is where "what was actually broken" lives — often the real answer to "why is this defensive code here".

### Layer 4 — people

When the record runs out, identify who would know: the author of the introducing commit, the PR reviewers. Check whether they're still active (`git log --author` recency). Hand the user a precisely formulated question to ask them — the dig's findings make the question specific ("PR #123 added the retry but the 3x cap came in later without explanation — was that measured or arbitrary?").

## Reporting

- Tell it as a story in decision order: the problem → the choice → what it replaced or rejected → how it evolved since. Cite the source next to each claim (sha, PR/issue number).
- Keep record and inference visibly separate: "the PR says X" vs "reading the diff, it looks like Y — the record doesn't say."
- A cold trail is a finding, not a failure: report exactly where the record went silent ("introduced in <sha> with the message 'fix', no PR discussion").

## After the dig — put the answer where it lives longest

- **Cold trail, but the why got figured out anyway** (through reasoning, or by asking someone): propose restoring it as a concise comment at the load-bearing spot — that context was lost once already; a comment stops it being lost twice. Propose, don't silently apply.
- **Found, but buried** (three layers deep in a review thread): if it matters enough, propose the same comment promotion. Otherwise, if the user runs this pack's session loop, a one-line pointer in their dossier ("context for X: PR #123") may be worth keeping. Skip this entirely for users without the loop.

## Guardrails

- Read-only by default: the only writes are promotion proposals the user accepts, and those are normal work product — never mention this skill pack or the personal store in anything that lands in the repo.
- Scale the dig to the question: don't run four layers when layer 1 answered it.
- Never present a guess as the record. "I don't know and the repo doesn't say" is a valid, honest answer.
