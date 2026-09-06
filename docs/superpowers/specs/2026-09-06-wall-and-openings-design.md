# The wall, and the curated openings

**Date**: 2026-09-06 · **Status**: implemented 2026-09-06; openings list open to amendment · **Parent**: the
[second-edition proposal](2026-09-05-second-edition-proposal.md), §2 (the
exhibition wall, curated openings)

## Scope

1. **The pure render moves out** of `main.js` into `src/render.js`, so the
   page, the wall and smoke all call the same function.
2. **The wall**: a second view of the page showing all twenty-five engines
   at the current seed and settings, each tile opening into the sheet view.
3. **Print as chapbook**: a print stylesheet that prints the sheet, or the
   wall one sheet per page, each with its colophon as the foot.
4. **Curated openings**: a cold visit opens one of a dozen sheets chosen by
   eye; everything after is chance.

Out of scope: the lineage drawer, sharing meta tags, motion (proposal §2's
other items), and printing the session gallery.

## Constraints

- Engines and the render stay pure; the wall calls the render twenty-five
  times and draws nothing itself.
- The hash remains the whole state: `view=wall` is one more key, so a wall
  is shareable like a sheet.
- No new dependencies, no build step.
- Smoke stays green; it gains nothing but a switch to the shared render.

## 1. `src/render.js`

`renderPoem({ seed, engineId, source, userText, entropy, paperMode, typeId,
hybrid })` moves verbatim to `src/render.js` with the imports it needs
(`makeRng`, `choosePalette`, `makeSheet`/`pairingFor`/`setFonts`/
`facesLoaded`, `el`/`resetIds`, `makeTextSource`, `pickEngine`/
`sheetSizeFor`/`pickHybrid`, `buildColophon`). It returns `{ svg, meta,
engine }` as today. `main.js` imports it. `tools/smoke.mjs` replaces its
mirrored `render()` body with a call to `renderPoem`, passing `typeId`
(the pinned pairing's id) and `entropy`, and serializes `result.svg`; its
checks are unchanged. (`renderPoem` stamps the year into the colophon; that
is stable within a run, so determinism checks hold.)

## 2. The wall

### State and URL

`state.view` is `'sheet'` (default) or `'wall'`. `writeURL()` writes
`view=wall` when set; `readURL()` reads it. Nothing else in the hash
changes meaning.

### Entering and leaving

- The **W** key toggles the view. The keys section of the rail lists it.
- The engine list gains a last entry, **the wall**, styled as an engine
  item and marked active in wall view; clicking it enters the wall.
- A tile click leaves the wall: `state.engine` becomes that tile's engine,
  `state.view` becomes `'sheet'`, and `show()` runs with the current seed —
  so the reader lands on the sheet they pointed at, same seed, and the
  hash records the engine.
- The chance entry in the engine list still works in wall view: it sets
  `state.engine = null` and stays on the wall (the wall does not depend on
  the engine choice).

### Rendering

`show()` keeps doing what it does — render the single sheet for the
current state, update colophon, seed box, history and gallery — and then,
if `state.view === 'wall'`, calls `renderWall()` and shows `#wall` in place
of `#sheet-holder`. `renderWall()` renders every engine in `ENGINES`
through `renderPoem` with the current state and `engineId` set to that
engine, and fills `#wall` with one `<figure class="tile">` per engine: the
result SVG (already sized by its `viewBox`) and a `<figcaption>` with the
engine's name. Each figure carries `data-engine` and `data-colophon` (the
tile's colophon, for print). Fonts are loaded once before the loop, as
`show()` already does. The hybrid flag is honoured per tile as it is for
the sheet.

Twenty-five renders cost under two seconds in total; the wall renders
synchronously, no spinner. Re-rolls, slider moves, source and type changes
all re-render the wall through `show()` as they re-render the sheet.

### Colophon in wall view

`№ … · the wall · seed 8f3a21c9 · twenty-five engines · set in … · 2026`
— built from the sheet render's meta (its number, seed and type credit),
with "the wall" and the count in place of the engine and the text credit.

### Layout

`#wall` is a CSS grid inside `#stage`: `grid-template-columns:
repeat(auto-fill, minmax(150px, 1fr))`, a 14 px gap, scrolling vertically
within the stage (the stage itself keeps `overflow: hidden`). Tiles are
paper-coloured with the sheet's drop shadow; captions in the rail's small
caps at 11 px. On phones (`max-width: 760px`) the grid is two columns and
scrolls with the page like the rest of the mobile layout. Landscape sheets
(coupDeDes, tendre) simply take their aspect within the tile.

### History and gallery

The wall pushes nothing to history of its own; the sheet render that
`show()` makes is pushed as today, so ← and → still walk sheets. Entering
the wall is not a history step.

## 3. Print

An `@media print` block:

- Hides `#rail`, `#mobead`, `#touchbar`, `#gallery`, `#rotate-hint`, and
  the no-module notice.
- `@page { margin: 12mm }`.
- **Sheet view**: `#sheet-holder svg` at `max-height: 85vh`, centred;
  `#colophon` becomes a static block beneath it, not fixed, so it prints
  once as the sheet's foot.
- **Wall view**: `#wall` becomes a block, not a grid; each `.tile` is
  `break-after: page; break-inside: avoid`, its SVG at `max-height: 85vh`,
  and its caption prints the engine name on one line and, via
  `::after { content: attr(data-colophon) }`, that tile's colophon on the
  next, in the colophon bar's italic. The shared `#colophon` bar is hidden
  in wall print (each page has its own).
- Shadows are removed in print.

The result: Ctrl+P on a sheet gives one page; on the wall, a twenty-five
page chapbook, one engine per page, each with its colophon.

## 4. Curated openings

### The list

`src/openings.js` exports `OPENINGS`: an array of about twelve
`{ engine, seed, e }` entries (entropy optional, default 0.5), each a
sheet chosen by eye, with a one-line comment naming why. The list is the
only curated thing on the site; everything else stays chance.

### The cold visit

In `main.js` at boot, after `readURL()`: if `location.hash` is empty and
the query names neither `engine` nor `hybrid`, pick one entry with
`Math.random()` (unseeded — the choice of opening is not part of any
poem's reproducibility) and set `state.engine`, `state.seed` and
`state.entropy` from it before the first `show()`. `writeURL()` then
records the sheet, so the visitor can share what they opened on. Every
subsequent action is chance as now. A visit with any hash is never
redirected.

### Choosing the dozen

Once the wall exists it is the proofing tool: headless walls are rendered
for ten seeds at the default entropy, the candidate tiles put in front of
the user with the author's picks marked, and the user strikes or adds.
The list ships with the author's picks and is amended on the user's word;
choosing is a one-line edit per entry thereafter.

## README

- Keys: add `W` the wall.
- Running: a sentence on the wall and on printing it as a chapbook.
- A sentence on the openings: "A first visit opens on one of a dozen
  sheets chosen by eye; every roll after that is chance."

## Testing

- Smoke green after each task; after task 1 it exercises `renderPoem`
  itself.
- Browser: open `#seed=8f3a21c9&view=wall`, count 25 tiles, click one and
  confirm the hash gains `engine=` and loses `view=`; press W and confirm
  the round trip; move the slider on the wall and confirm all tiles
  change. Print preview to PDF via headless Chrome's `--print-to-pdf` for
  both views; confirm page counts (1 and 25).
- Cold visit: open `/` with no hash and confirm the hash after load names
  one of the openings.

## Order of work

1. `render.js` extraction, smoke switched to it
2. the wall (state, key, rail item, render, layout, colophon)
3. print
4. openings module and cold-visit logic, with the author's picks; then
   the candidate review with the user and any amendments
