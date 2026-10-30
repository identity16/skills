---
name: make-loop
description: Define a feedback loop for a recurring judgment the user keeps making by hand — the agent proposes, the user approves or corrects with a reason, and corrections become rules until routine items need no review. Use when the user invokes /make-loop, wants to turn a repeated task into a loop ("make a loop for X", "I do this every week, let's systematize it", "루프 만들어줘", "이 반복 작업 루프로 만들자", "이거 매번 내가 판단하는데 자동화하고 싶어"), or wants to redefine an existing loop's source, output, or review setup. Writes only the loop's definition; running cycles belongs to maintain-loop.
---

# make-loop

A loop delegates a recurring judgment no faster than the reasons behind it become explicit. Each cycle the agent proposes an outcome for every item, the user approves or corrects it with a reason, and corrections are generalized into rules. A rule earns the right to skip review by track record, and the user approves every promotion. The loop improves when fewer items need the user's review while corrections stay rare.

This skill only writes the definition. Running cycles, learning from corrections, and promoting rules belong to `maintain-loop`.

## Personal state (zero-trace contract)

Same contract as `maintain-loop` — keep the two in sync:

- Root: `${XDG_DATA_HOME:-$HOME/.local/share}/identity16-skills/loops/<topic>/` (`<topic>`: short kebab-case slug, e.g. `ledger`, `mufi-code-review`).
- `loop.md` — the definition, owned by `make-loop` (sections listed there).
- `rules.json` — `{version, rules:[{id, group, kind, text, basis, state, since, origin, record:{cited, approved, corrected, streak}}]}`
  - `kind`: `lookup` (deterministic: a mapping or table) | `guideline` (needs judgment).
  - `state`: `tentative` → `confirmed` → `automated` (items citing only automated rules may skip review).
  - `basis`: the items or statements the rule generalizes. `origin`: the cycle/item id or `stated`.
- `reference.json` — closed vocabularies proposals must draw from (categories, accounts, labels). Optional; refreshed each cycle.
- `cycles/<YYYY-MM-DD>.json` — one per cycle (written by `maintain-loop`):
  `{cursor:{from,to}, source, caveats, status, items:[{id, key, src, proposal, cites, conf, why, review:{status, final, changed, note}}], applied:{at, counts, deviations}, metrics:{items, review_needed, corrected, repeat_corrections}}`
  - `conf`: `certain` | `inferred` | `ask`. `review.status`: `approved` | `corrected` | `skipped`.
  - `status`: `drafted` → `reviewing` → `reviewed` → `applied` → `closed`.

Never write any of this, or any mention of this skill pack, into a target project's files, commits, PRs, or issues.

## `loop.md` sections

Fill every section; write "none" rather than leaving one out.

- **Purpose** — the judgment being delegated, in one sentence.
- **Item** — one unit of judgment, and its **key**: what makes two items "the same case" across cycles (a merchant name, a file path, a PR author + area). The key is how a repeated correction gets detected.
- **Source** — where items come from, how to collect them, and the **cursor rule**: where the next cycle starts (e.g. the day after the last cycle's `to`).
- **Enrich** — what the agent must look up itself before proposing (order history, the linked ticket, the diff). The review is for what only the user knows.
- **Proposal** — the shape of one proposal (fields, allowed values, which `reference.json` lists they draw from).
- **Gate** — deterministic checks that already exist in the domain (a project's CI, a validator). The loop reads the gate's result and never reimplements it. "none" if the domain has none.
- **Review** — how the user reviews: in the conversation by default; a file or another surface only when a cycle routinely has more items than a conversation can hold.
- **Sink** — what happens to approved outcomes and how they are applied.
- **Verify** — how to confirm the sink received exactly what was approved (counts, totals, a re-read).
- **Never** — actions the loop must not take (moving money, posting publicly, entering passwords).
- **Promotion** — the streak of consecutive approvals after which `maintain-loop` proposes `automated` (default 10).

## Steps

1. List existing loops under the root. If the topic already has one, this is a redefinition: read its `loop.md`, change only what the user wants, and keep `rules.json` and `cycles/` intact.
2. Before asking anything, find out what can be found: open the source, look at a few real items, read the domain's existing rules and checks (a project's AGENTS.md, CI config). Then interview the user only for the gaps, one round at a time, each question with a recommended answer.
3. Draft `loop.md` and show it. When the loop targets a code repository, the Gate is the repo's own CI, and deterministic rules discovered later belong there (lint config or the repo's check script, via a normal PR), not in `rules.json`.
4. Seed `rules.json` only with rules the user states outright (`state: tentative`, `origin: stated`) and lookup tables that already exist in the domain. Do not mine checklists out of documents: a rule list built from docs drifts toward what is easy to check, not toward what the user actually corrects. Rules grow from corrections.
5. Write `reference.json` if the proposal draws from closed lists.
6. Write the files, confirm the path in one line, and offer to run the first cycle with `maintain-loop` (if installed).

## Guardrails

- A loop with no review step is not a loop. Even a fully automated loop keeps a sampled audit.
- The user approves the definition; never start a cycle from an unapproved `loop.md`.
- Keep `loop.md` free of rules. Rules live in `rules.json`, where their track record is kept.
