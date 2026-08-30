---
name: grill
description: Test whether the user actually understands the decisions inside a diff before it ships. Use when the user invokes /grill, asks "grill me on this", "quiz me", "check that I understand this change", "내가 이해했는지 확인해줘", "그릴해줘", or wants a comprehension check before committing/merging a large AI-authored change or approving someone else's PR. Extracts the decisions embedded in the diff and interviews the user on them; gaps become fixes to the code or things to learn — never a rubber stamp.
---

# grill

Enforcement mechanism for "ship only decisions you understand." An agent can produce a correct diff the user couldn't defend in review; this skill finds out before the codebase does. It deliberately adds friction — that is the point — but only in proportion to what the diff actually decides.

## Steps

### 1. Scope the diff

Working tree, branch vs base, or a PR — whatever the user is about to ship or approve. Read all of it.

### 2. Extract the decisions, not the mechanics

List the judgment calls embedded in the change. A decision is anything a competent reviewer could push back on:

- The approach chosen where another was viable
- Invariants the change relies on or newly creates
- Edge cases handled a specific way — or left unhandled
- Tradeoffs taken (performance vs clarity, consistency vs locality)
- Anything that would break if an assumption shifts

Skip pure mechanics: renames, formatting, boilerplate, changes with only one reasonable shape. A diff with no real decisions gets a one-line pass ("nothing here to grill — it's mechanical"), not an interview.

### 3. Interview

Ask about the 3–7 highest-stakes decisions, most load-bearing first, a few at a time — a conversation, not an exam sheet. Good questions probe consequences, not recall:

- "Why this approach — what did it beat?"
- "What breaks if X happens / if this assumption stops holding?"
- "This relies on Y being true — what guarantees it?"
- "If a reviewer asks why this edge case is safe to ignore, what's the answer?"

Recall questions ("what does this function do?") are worthless — the user can parrot an explanation they just read. Consequence questions can't be answered without a working model.

### 4. Judge the answers honestly

- A correct answer gets confirmed and the interview moves on. No re-asking what's already been demonstrated.
- A wrong answer gets corrected with evidence from the code — plainly, not performatively softened.
- "I don't know" is a respectable answer and becomes a gap. Bluffing that survives one follow-up doesn't.

### 5. Route the gaps

Deliver a short verdict: decisions the user owns, and gaps. For each gap, prescribe in this order:

1. **Fix the code** — if the user couldn't answer because the code hides its reasoning, the code is the bug: restructure for clarity or add the "why" comment. This is the default prescription, not the fallback.
2. **Put it in the PR/commit** — rationale a reviewer will need but code can't carry.
3. **Learn it** — walk through the relevant mechanism together until the user can answer, then re-ask once.
4. **Journal it** — only for users running this pack's session loop, and only for genuinely open questions worth carrying forward. Skip entirely otherwise.

End with a shipping call: which gaps block (a load-bearing decision nobody understands) and which don't. The user overrules freely — the skill informs the call, it doesn't own it.

## Guardrails

- Proportionality: friction must match the stakes. A 10-line fix gets one question or none; the full interview is for changes that make real decisions.
- Never rubber-stamp: if every answer was wrong but the user ships anyway, that's their call to make with open eyes — don't pretend the gaps closed.
- The interview tests the user's model, not their memory of the agent's own explanation. If the agent wrote the diff this session, prefer questions whose answers were never stated in the conversation.
- Zero traces: anything promoted into the repo is normal work product — never mention this skill pack or the personal store in it.
