---
name: make-ticket
description: Draft a ticket body that captures intent — the problem, the wanted outcome, who and what it touches, the constraints, and what is still unknown — instead of a solution. Use when the user asks to write a ticket or issue, file something in Linear, turn an idea, problem, or discussion into a trackable item, or rewrite an existing ticket ("write a ticket for this", "make a Linear issue", "티켓 써줘", "이슈로 만들어줘", "리니어에 올려줘", "이거 티켓 형식으로 정리해줘"). Grounds the ticket in the repo, leaves unknowns as open questions rather than guesses, and files it when a tracker is available.
---

# make-ticket

A ticket is the first place a decision can land before anyone understands it. Written as a solution ("add a status endpoint"), it locks in the least-examined choice of the whole task. Written as intent — what is wrong today, what should be true afterwards, within which boundaries — it records exactly how much is understood and leaves the design to whoever picks it up with the code in front of them.

Format inspired by Anthropic's [capture-intent practice](https://academy.claude.com/courses/ai-native-sdlc-playbook/capture-intent) in the AI-native SDLC playbook.

## The format

Five sections, these headers, this order, nothing else:

```markdown
## Problem
Customers phone the contact center to ask where their claim is.
Handlers spend roughly a third of call time on status-only queries.
## Proposed outcome
Customers see claim status, next step and expected date in the portal.
## Affected users and systems
Claims handlers, portal team, claims-core API.
## Constraints
No new PII in the portal session. Existing authentication only.
## Open questions
Do third-party loss adjusters need access too?
```

That is the whole length — a sentence or two per section. Longer is not more thorough; it is usually a solution leaking in.

- **Problem** — the present situation, observable and in present tense, with a measure when one exists. No solution vocabulary: if a sentence names a component to build, it belongs elsewhere or nowhere.
- **Proposed outcome** — the end state as users or operators would see it. What, not how.
- **Affected users and systems** — concrete names from this project: the people who feel the problem, the teams and services the outcome touches.
- **Constraints** — hard boundaries the outcome must respect: security and privacy rules, compatibility, what is explicitly out of scope. Only ones that are real.
- **Open questions** — what nobody in the room could answer, each phrased so a named person could answer it.

## Steps

### 1. Sort what the user gave

Take the input as it comes — a sentence, a pasted thread, a solution, an existing ticket to rewrite — and note which sections it already answers. Most input answers one or two.

### 2. Recover the problem behind the solution

When the input is a solution ("cache the lookup", "add a retry"), do not ticket it. Ask what is happening today that makes it wanted: who is hurting, how often, what it costs. That answer is the Problem; the proposed mechanism becomes at most an open question ("is caching the right lever, or is the upstream call the problem?"). The user may know the problem perfectly well and simply skipped it — one question usually recovers it.

### 3. Ground it in the project

When a repo is at hand, check the ticket against it, proportionally to the ticket's size:

- Affected systems: find the modules, services, and owners the problem actually lives in, rather than the ones the user named from memory.
- Constraints: look for what the outcome would have to respect — the auth model, data-handling rules, contracts other consumers rely on, invariants a comment or test warns about.

Name what you found and where. What you could not verify is not a claim — it is an open question.

### 4. Ask once for what is still missing

One short round of questions, only for gaps that change the ticket. Whatever remains unknown after that goes into Open questions. Never hold the ticket hostage to a complete picture; the format exists so that incomplete understanding gets recorded honestly instead of papered over.

### 5. Write the body and deliver it

Write the five sections. Keep the headers exactly as given; write the prose in the language the team's tickets use. Propose a title that names the outcome or the problem, never the mechanism.

Then place it: if an issue-tracker tool is available in this session (a Linear integration, for instance), offer to create the issue — or update the one being rewritten — and let the user pick team and project. Otherwise hand over the markdown to paste. Never file without the user's go-ahead.

## Guardrails

- Never add sections. No solution sketch, acceptance criteria, estimates, or task breakdown — those belong to design, which starts after this ticket is read by someone with the code open.
- Never fill a header to look complete. A constraint or affected system you invented is worse than "None known."
- Open questions are the honesty valve: every unknown goes there, never into confident prose.
- The ticket is ordinary work product — nothing in it mentions this skill pack.
