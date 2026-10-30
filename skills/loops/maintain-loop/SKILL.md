---
name: maintain-loop
description: Run one cycle of a feedback loop defined with make-loop — collect items, propose an outcome for each, get the user's approvals and corrections, turn corrections into rules, apply what was approved, and report whether the loop needed less review than last time. Use when the user invokes /maintain-loop, asks to run or continue a loop ("run the ledger loop", "do this week's cycle", "루프 돌려줘", "가계부 정리하자" when a loop exists for it), wants to review or change a loop's rules ("why did it propose that?", "이 규칙 고쳐줘"), or asks how a loop is doing.
---

# maintain-loop

Runs the cycle of a loop defined by `make-loop`: propose → review → learn → apply. The review exists to spend the user's time only on what the agent cannot know; every correction must make the next cycle's proposals better. The same correction showing up again in a later cycle means learning failed.

## Personal state (zero-trace contract)

Same contract as `make-loop` — keep the two in sync:

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

This skill reads `loop.md` and owns everything else. Never write any of this, or any mention of this skill pack, into a target project's files, commits, PRs, or issues.

## Steps

1. **Load.** Find the loop under the root by topic. None → say so and offer `make-loop` (if installed) instead of improvising one. Read `loop.md`, `rules.json`, `reference.json`, and the latest cycle with its corrections and caveats. If the latest cycle is not `closed`, resume it from its status instead of starting a new one.
2. **Collect.** Start from the cursor rule. Collect every item in range; dropping an item is itself a proposal (`exclude`) and goes through review. Record caveats (an unreachable source, a gap in the data). Read the Gate's result if one is defined.
3. **Enrich.** Do every lookup in `loop.md`'s Enrich section before proposing. Never hand the user a placeholder for something the agent could have looked up.
4. **Propose.** For each item: the proposal in the defined shape, `cites` (ids of the rules it applied), a one- or two-sentence `why`, and `conf`:
   - `certain` — every cited rule is a `lookup` or `confirmed`/`automated`, and nothing was guessed.
   - `inferred` — a judgment call; say what it rests on.
   - `ask` — depends on facts only the user has; say exactly what is unknown.
   Values must come from `reference.json` where a list exists.
5. **Route.** An item skips review (`review.status: skipped`) only if it is `certain` and every cited rule is `automated`. Still pull one in ten skipped items into review as an audit, chosen at random.
6. **Review.** Ask once, late, with everything prepared: a brief per item (proposal, why, what is unknown), not raw data. Group by `conf`; `ask` items first. Let the user approve in bulk and correct individually — each correction needs the right value and a reason. Use the Review surface from `loop.md`. Record every answer in the cycle file as it comes.
7. **Learn.** Before applying:
   - Update each cited rule's `record`: approved → `approved`+1, `streak`+1; corrected → `corrected`+1, `streak` = 0.
   - Generalize each correction: fix the rule that misled the proposal, or add a `tentative` rule with the item as `basis`. A mapping (name → value) is a `lookup`.
   - **Repeat check:** if an item with the same `key` was corrected the same way in an earlier cycle, count it in `repeat_corrections`, tell the user which rule failed to capture it, and fix that rule now.
   - Propose state changes in one batch, each with its evidence; apply only what the user approves:
     - `tentative` → `confirmed` once it has been approved without correction.
     - `confirmed` → `automated` at the `loop.md` Promotion streak. State the bound plainly: N approvals in a row means the error rate is below about 3/N at 95% confidence.
     - `automated` → `confirmed` on any audit correction.
     - A `guideline` that keeps resolving to the same mapping → propose rewriting it as a `lookup`. If the Gate lives in a code repository and the rule is mechanical, propose moving it into the repo's lint or check script through a normal PR, and retire it from `rules.json` once merged. Never force this: propose it only if the deterministic version reproduces every past verdict.
   - Bump `version`.
8. **Apply.** Apply to the Sink only items that are approved, corrected (use `final`), or skipped. Never apply an unreviewed item. Record anything applied differently from `final` in `applied.deviations` and tell the user.
9. **Verify.** Run the `loop.md` Verify check. A mismatch is found and fixed before closing, not reported and left.
10. **Close.** Write `metrics`, set `status: closed`, and report in a few lines: items, how many needed review (and the trend over recent cycles), corrections, repeat corrections, rule changes made.

## Outside a cycle

- "Why did it propose that?" → show the cited rules with their `basis` and `record`.
- A rule edit the user asks for → edit `rules.json`, keep `basis`, reset `streak` if the rule's meaning changed.
- "How is the loop doing?" → the review-needed ratio and corrections across cycles, the rules closest to promotion, and the rules with the most corrections.
- A change to Source, Sink, Review, or anything else in `loop.md` → that is a redefinition; hand it to `make-loop`.

## Guardrails

- Everything in `loop.md`'s Never section is off-limits. Actions visible to others (posting, sending, paying) need the user's go-ahead in the current cycle.
- Promotions are proposals. Automation happens only after the user approves it.
- A shrinking review count with rising corrections is a regression, not progress. Say so.
