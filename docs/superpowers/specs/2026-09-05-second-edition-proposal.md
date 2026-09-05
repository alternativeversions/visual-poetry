# Second edition — a proofing pass and a proposal

**Date**: 2026-09-05 · **Status**: proposal; three decisions pending (type,
motion, order) before this becomes a spec

## What was checked

Fifty renders (twenty-five engines × seeds `8f3a21c9`, `deadbeef`) taken
headlessly from the shell as a visitor sees it, at entropy 0.5 and the
corpus source; entropy sweeps (0.05, 0.3, 0.95) for the engines that looked
thin; a byte-level diff of every engine's SVG at entropy 0, 0.5 and 1 over
eight seeds; `node tools/smoke.mjs` (green); the three GitHub Pages runs
(all green); a read of `index.html`, `main.js`, the registry, colophon,
export and typography modules. The proofing machine had none of the named
faces installed, so Liberation Serif stood in for Baskerville — which is
also what most visitors on Windows, Linux and Android see.

Every engine renders in under 50 ms. Nothing throws. Nothing leaks NaN.

## The verdict, engine by engine

| engine | verdict | note |
| --- | --- | --- |
| `constellation` | fine | absence grid at this seed; the Gysin dissolve at others is the better mode |
| `technopaegnia` | weak | the shape holds; the fill stitches ~10 unrelated fragments into word salad |
| `coupDeDes` | strong | the spread, the gutter crossing, the tiered voices |
| `typestract` | weak | a full-bleed wall of overstruck type; the left columns smear to black |
| `dirtyConcrete` | fine | bold marks; the composition can feel half-empty |
| `diagram` | strong | witty; never reads `sheet.entropy` |
| `workshops` | fine | dry but legible |
| `revisedPhilosophy` | strong | the book page convinces; never reads `sheet.entropy` |
| `asemic` | strong | handsome spiral; strokes read as seismograph rather than brush |
| `babel` | fine | the tower reads; the rotated words over the block make mud, not rubble |
| `unordnung` | strong | classic |
| `ruins` | strong | both modes work; the struck-through page is the best |
| `decollage` | strong | the boldest sheet on the site |
| `gloss` | strong | dense and rich; destructures `entropy` and never uses it |
| `grammar` | strong | misrule is the wittiest thing on the site |
| `transmission` | strong | fully legible as a concept |
| `intextus` | strong | the thread really spells the phrase |
| `tendre` | fine | two settlements and one river on a whole country; see defects |
| `aria` | weak | two systems and one enormous swell; three-quarters empty at both seeds |
| `lineprinter` | strong | the most convincing period object |
| `mesostic` | fine | correct and tidy, but small on the sheet |
| `index` | fine | the whisper works; sparse by design |
| `rollage` | strong | the strongest graphic on the site |
| `inscription` | strong | restrained and right |
| `calligramme` | weak | rain that does not read as rain; threads overprint; océan is the good mode |

Fourteen strong, seven fine, four weak.

## Defects, with the seed that reproduces each

1. **Share links do not reproduce the sheet.** `writeURL()` in `main.js`
   writes `seed`, `engine`, `source`, `type`, `hybrid` — not entropy, not
   paper, not the pasted text. A link shared after moving the slider
   renders differently; a `source=user` link renders from the corpus
   (`makeTextSource` falls back on blank text).
2. **The colophon misreports the type.** Five of the six `TYPE_PAIRINGS`
   lead with Apple system faces (Baskerville, Didot, Palatino, Hoefler,
   American Typewriter, Avenir, Optima). On a machine without them the
   sheet is set in Georgia or Liberation and the colophon still says
   "set in Hoefler & Avenir". Nothing calls `document.fonts.check()`.
3. **Three engines ignore the entropy slider.** Over eight seeds,
   `diagram`, `revisedPhilosophy` and `gloss` serialize byte-identically
   at entropy 0, 0.5 and 1. `technopaegnia` differs in two seeds of eight
   (it uses entropy only to bias the taper direction). The README promises
   the slider "governs how far an engine strays from its classic form".
4. **`tendre`, seed `deadbeef`, entropy 0.5**: the sea's name is set at a
   size that is not measured against the neatline and runs past it.
   **Seed `8f3a21c9`**: the settlement label "scattered" and the phrase
   "RIEN N'AURA EU" print on top of one another.
5. **`calligramme`, seed `deadbeef`, entropy 0.5**: rain threads cross and
   overprint ("The mountain-summits" through "cliffs, and"). At
   `8f3a21c9` the figure is five short phrases on invisible paths.
6. **Chronic sparseness**: `aria`, `calligramme`, `mesostic`, `tendre`
   routinely fill a quarter of the sheet.
7. **A console error on every load**: the `corpus.local.js` probe 404s.
   The README calls it normal; it is still a red line in every visitor's
   console.

## The proposal, in order

### 1. Keep the promises the README makes

- Write `e=` (entropy), `paper=` and a capped `text=` into the hash; read
  them at boot. Same seed + engine + source + entropy + paper + text ⇒
  same sheet, from a link.
- Check each face of the active pairing with `document.fonts.check()` and
  credit what actually rendered in the colophon ("set in Georgia, standing
  in for Baskerville") — or ship open faces (decision 1).
- Give `diagram`, `revisedPhilosophy`, `gloss` and `technopaegnia` real
  entropy branches. Candidates: a diagram whose labels migrate off their
  nodes; a philosophy page whose epigraph and dialogue contradict, or a
  second authority interrupting; a gloss whose outer voices overprint the
  center text; a shape poured with a second, contrary text at high entropy.
- `tendre`: measure the sea label against the neatline (shrink or break);
  simple label collision avoidance. `calligramme`: minimum thread spacing;
  five full-height threads for rain, as Apollinaire has.
- Minimum content budgets relative to the sheet: more systems in `aria`,
  three spine cycles in `mesostic`, eight to twelve settlements in `tendre`
  (pull a second fragment when the first is short).
- Gate the local-corpus probe behind a flag (`?local=1` once, persisted),
  so the default console is clean.

### 2. Make the first minute compelling

- **The exhibition wall.** Extract the pure render from `main.js` into
  `src/render.js` (`renderPoem` has no DOM dependencies beyond the
  builders); add a wall view that renders all twenty-five engines for the
  current seed as a contact sheet, each opening into the sheet view. With a
  print stylesheet (`@page`, one sheet per page, colophon as the foot) the
  session gallery prints as a chapbook with the browser alone.
- **Curated openings.** A cold visit (no hash) draws its first sheet from
  a short list of engine × seed pairs chosen by eye; every roll after that
  is chance.
- **The lineage, in the app.** Move each engine's bibliography paragraph
  from the README into a small data module; clicking the colophon's
  caption opens a drawer with the paragraph and the works it cites.
- **Sharing meta.** Favicon (an SVG data URI), `<meta name="description">`,
  Open Graph tags with a preview image from the wall, a `<title>` that
  carries the poem's title, a "copy link" control.
- **The poem arrives** (decision 2). Engine-specific reveals applied to
  the live sheet only, via the Web Animations API so nothing is written
  into the DOM and nothing reaches the export: `transmission` arrives at
  45.45 baud; `lineprinter` prints line by line; `ruins` erases before the
  reader's eyes; `unordnung`'s letters fall; `typestract` types. Off under
  `prefers-reduced-motion`; a rail toggle.

### 3. Craft the weak four

- `typestract`: rethink toward dsh — sparse geometric figures made of two
  or three characters, white space as material, overstrike as a rare event.
- `technopaegnia`: pour one long text (Herbert's own move) or fragments
  filtered to one `mood` and one `lang` (fragments carry both since July).
- `aria`, `calligramme`: the content budgets and thread rules above.

### 4. Widen the corpus

223 fragments, mostly English. Public-domain candidates: Waley, *A Hundred
and Seventy Chinese Poems* (1918); Chamberlain's Bashō (1902); H.D., *Sea
Garden* (1916); Rossetti; Rilke; Hölderlin; Pessoa; Sor Juana. More
languages feed `babel`'s courses and `intextus`'s grids directly.

### 5. Guardrails before the craft work

- Golden snapshots: a hash per engine × seed committed under `tools/`,
  checked in CI beside smoke, updated only with an explicit flag.
- A proofing tool in the repo: the July plan's screenshot recipe is a
  Mac-only Chrome path; a Playwright script that renders every engine to
  PNG (and, optionally, an HTML contact sheet) makes proofing reproducible.
- `role="img"` and an `aria-label` from title and colophon on the live
  sheet.

## Decisions

1. **Type: ship it or confess it.** Shipping open faces (Libre Baskerville,
   EB Garamond, Jost, Courier Prime; ~600 KB of woff2 in the repo, no CDN)
   keeps "zero dependencies, no build" and gives every visitor the design
   the colophon describes. Recommendation: ship.
2. **Motion.** The constitution bans gradients, neon and particles, not
   time. Recommendation: build it, restrained and switchable.
3. **Order.** Tiers 1 and 2 first (they change how the site is met), then 3
   with the snapshots from 5 in place.
