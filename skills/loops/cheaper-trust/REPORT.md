# HTML report format

The report is one self-contained HTML file in the OS temp directory, styled with Tailwind from its CDN. It answers three questions in order, one section each:

1. **What already guards this project** — the device map from step 0.
2. **Which mistake is stopped where, by what** — a coverage matrix: mistake classes × stages.
3. **What to change** — proposal cards, then retirements, what stays in prose, and the top recommendation.

Write every word the reader sees in the language the user is conversing in. Code, file paths, and tool names stay as they are.

## Scaffold

```html
<!doctype html>
<html lang="{{user's language}}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cheaper trust — {{target}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body { word-break: keep-all; overflow-wrap: anywhere; }
      .scroll-x { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      table.m { border-collapse: separate; border-spacing: 0; min-width: 760px; }
      table.m th, table.m td { border-bottom: 1px solid #e7e5e4; padding: .5rem; vertical-align: top; }
      table.m th:first-child, table.m td:first-child {
        position: sticky; left: 0; z-index: 1; background: #fff;
        min-width: 8.5rem; max-width: 11rem; box-shadow: 1px 0 0 #e7e5e4;
      }
      .chip { display: inline-block; border-radius: .35rem; padding: .1rem .4rem; font-size: .72rem; line-height: 1.1rem; margin: .1rem 0; }
      .gate  { background: #0d9488; color: #fff; }                                  /* a device that stops it */
      .sign  { border: 1.5px dashed #f59e0b; color: #92400e; background: #fffbeb; } /* prose: asks, can't stop */
      .human { background: #ffe4e6; color: #9f1239; }                               /* people catch it */
      .esc   { background: #fee2e2; color: #b91c1c; font-weight: 600; }             /* escaped, or a gap */
      .add   { border: 1.5px dashed #0d9488; color: #0f766e; background: #f0fdfa; } /* proposed */
      .del   { background: #f1f5f9; color: #64748b; text-decoration: line-through; } /* retire */
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <header>...</header>
      <section id="map">...</section>
      <section id="matrix">...</section>
      <section id="proposals">...</section>
      <section id="retire">...</section>
      <section id="stays-prose">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

The six chip classes are the whole visual vocabulary. Use them the same way in every section, so a reader who learned them in the map reads the matrix and cards without a second legend.

The user may read it on a phone: blocks stack at narrow widths (`grid-cols-1 md:grid-cols-5`, `md:grid-cols-2`) and nothing makes the page scroll sideways. Only the matrix scrolls, inside `.scroll-x`, with the mistake column pinned; add a one-line "scroll sideways" hint under it, shown only on small screens (`md:hidden`).

## Header

Target (repo, path, or PR range), date, and one line of totals: devices mapped, mistake classes, how many `Strong`, retirements, empty stages. No introduction paragraph.

## 1. Device map

One card per stage, in a change's order: ① writing, ② agent session, ③ commit, ④ CI, ⑤ review. Each card lists that stage's devices as `.gate` chips (`.human` for review), with a short note beside each when it matters: `required`, which agent it runs under, rule count. Flag problems on the device itself, in amber or rose text:

- not blocking ("not required — doesn't block merge")
- one agent only ("Codex: none" as an `.esc` chip)
- duplicates another device
- run by hand

An empty stage gets a dashed rose border and one line on what that leaves unguarded. Below the five cards, one dashed amber strip for prose: each file or memory store as a `.sign` chip with its rule count and how many are copies.

## 2. Coverage matrix

A table: one row per mistake class, columns **prose, ① … ⑤**. The first cell is the class, a link to its card, with frequency and grade underneath. Every other cell holds the chips for that class at that stage:

- `.gate` — the device that stops it today
- `.sign` — the prose rule that asks for it
- `.human` — "caught N×" in review or sessions; `.esc` — "escaped N×"
- `.add` — "+ <device>" proposed
- `.del` — a device or rule to retire

A legend of the six chips sits above the table. Read across a row and the reader sees where the class gets through, who catches it now, and where the proposal stops it. Several `.gate` chips in one row are duplication; a row whose only chips are `.sign` and `.human` is the core of this skill.

## 3. Proposal cards

One `<article id="c-N">` per candidate, linked from its matrix row.

- **Title** — the mistake class, in one line.
- **Badges** — grade (`Strong` emerald, `Worth exploring` amber, `Speculative` slate), `unenforced` (rose) when it applies, the layer move ("prose + review → static analysis"), and where it runs (`agent-agnostic` / `hooks: both agents`).
- **The mistake and what the device says** — side by side (`md:grid-cols-2`): left, the real past mistake's snippet with its source in a rose box; right, the device's actual error message in a dark box. This pair is the card's point: what gets filtered, and what the agent is told instead.
- **Now** — one line: who catches it today and how often, and whether it escaped.
- **After** — one line: which device stops it at which stage, and what happens to the prose.
- **Why not higher** — one line per higher layer that cannot hold it.
- **Payback** — definition cost (`small` / `medium` / `large`) and roughly how many occurrences until it pays back.
- **Proof** — the source of the real past mistake it was checked on. A `Speculative` card says what proof is missing.

No paragraphs. If a card needs one, the mistake/message pair is wrong.

## Retire

Compact cards, one per retirement:

- **What to remove** — the device or prose, with its location (`file:line`, CI job, hook registration), as a `.del` chip.
- **Kind** — `prose repeats device`, `covered by higher device`, `dead`, or `copied prose`.
- **What holds the class instead** — the remaining device as a `.gate` chip, or why the mistake can no longer be written.
- **Proof** — the real past mistake the remaining device still catches, with its source.
- **Saves** — the running cost removed, in one line (e.g. "40 s per CI run", "12 lines of context every session").

## Stays in prose

A compact list: each rule that needs judgment, one line on why no machine can judge it, and its source. Deciding not to move something is a result.

## Top recommendation

One larger card: the candidate to build first, one sentence on why (usually the biggest `frequency × layer gap` with a small definition cost), and an anchor link to its card.

## Style

- Editorial, not dashboard. Generous whitespace; `font-serif` headings work with stone and slate.
- Color only through the six chips and the grade badges; everything else neutral.
- Stage and section labels: `text-xs uppercase tracking-wider`.
- The only script is the Tailwind CDN. No app code, no interactivity.
