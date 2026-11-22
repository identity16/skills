# HTML report format

The report is one self-contained HTML file in the OS temp directory. Tailwind and Mermaid come from CDNs. The pyramid cross-section is hand-built with divs, because it carries the point of every card: where the rule is held now, and where it would be held. Mermaid is for graph-shaped extras — how a device is wired (which event fires which script under which agent), or how a CI step gates a merge. Don't force a Mermaid graph into a card that doesn't need one.

## Scaffold

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cheaper trust for {{target}}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script type="module">
      import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
      mermaid.initialize({ startOnLoad: true, theme: "neutral", flowchart: { useMaxWidth: false } });
    </script>
    <style>
      body { word-break: keep-all; overflow-wrap: anywhere; }
      .scroll-x { overflow-x: auto; }
    </style>
  </head>
  <body class="bg-stone-50 text-slate-900 font-sans">
    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">
      <header>...</header>
      <section id="candidates" class="space-y-10">...</section>
      <section id="stays-prose">...</section>
      <section id="top-recommendation">...</section>
    </main>
  </body>
</html>
```

The user may read it on a phone. At narrow widths, every two-column block stacks (`grid grid-cols-1 md:grid-cols-2`) and nothing makes the page scroll sideways. A wide Mermaid graph goes inside `.scroll-x` so it scrolls alone at a readable size; `useMaxWidth: false` in the scaffold keeps Mermaid from shrinking it to fit instead.

## Header

Target (repo, path, or PR range), date, and a legend: the five layers with their colors, cheapest on top. Then one line of totals — candidates found, how many are `Strong`. No introduction paragraph.

Layer colors, used everywhere a layer appears:

| Layer | Color |
|---|---|
| codebase | emerald |
| static analysis | teal |
| verification | sky |
| prose | amber |
| human review | rose |

## Candidate card

Each candidate is one `<article id="c-N">`. The diagram carries the weight; prose is sparse and uses the pyramid's own words (layer names, running cost, definition cost, device).

- **Title** — the rule, in one line.
- **Badge row**
  - Strength: `Strong` (emerald), `Worth exploring` (amber), `Speculative` (slate). Strong means frequent, evidenced, and a deterministic device exists.
  - Move: `prose → static analysis`, colored from the source layer to the target layer.
  - Where it runs: `agent-agnostic` or `hooks: both agents`.
- **Before / After cross-section** — the centerpiece. Two columns, each the five layers as stacked bands (`h-9 border-l-4`, layer color at low opacity). A marker with the rule's short name sits in the layer that holds it: before, in the source layer; after, in the target layer, with the source band showing a faded remnant labeled with what prose remains (`deleted`, `one-line pointer`, `judgment only`).
- **Evidence** — monospaced list (`font-mono text-sm`) of `file:line`, PR links, incident records. Every candidate has at least one.
- **Cost now** — one sentence: how often it is paid today and by whom (e.g. "Flagged in 4 of the last 30 merged PRs").
- **Device** — one sentence: what to build and where it runs. For agent hooks, show both registrations (Claude Code and Codex) in a small two-column code block; a Mermaid graph fits when the wiring is the point.
- **Proof** — one violating example the device catches, in a code block.
- **Payback** — definition cost (`small` / `medium` / `large`) and roughly how many occurrences until it pays back.
- **Wins** — bullets of six words or fewer, in the pyramid's terms: "Review stops catching this", "Holds under both agents", "Prose shrinks to a pointer". Not "cleaner" or "easier to maintain".

No paragraphs. If a card needs a paragraph to be understood, the cross-section is drawn wrong.

## Stays in prose

A compact list: each rule that needs judgment, one line on why no machine can judge it, and its source. Deciding not to move something is a result.

## Top recommendation

One larger card: the candidate to build first, one sentence on why (usually the biggest `frequency × layer gap` with a small definition cost), and an anchor link to its card.

## Style

- Editorial, not dashboard. Generous whitespace; `font-serif` headings work with stone and slate.
- Color only for layers and strength badges; everything else neutral.
- Layer labels inside diagrams: `text-xs uppercase tracking-wider`.
- The only scripts are the Tailwind CDN and the Mermaid import. No app code, no interactivity beyond Mermaid's rendering.
