# The weak engines — calligramme, technopaegnia, typestract

**Date**: 2026-09-06 · **Status**: implemented 2026-09-06 · **Parent**: the
[second-edition proposal](2026-09-05-second-edition-proposal.md), §3

## Scope

The proposal's proofing found four weak engines. `aria`'s remedy (content
budgets) shipped with section one. Three remain:

1. `calligramme`: the fountain and ocean modes set short phrases on long
   invisible paths, so the figure is stranded scraps. Rain was fixed in
   section one; this finishes the engine.
2. `technopaegnia`: the shape holds but the fill stitches ten unrelated
   fragments into word salad. It becomes one voice.
3. `typestract`: a full-bleed wall of overstruck type whose dense end smears
   to black. It is recomposed toward dsh: figures on white.

Out of scope: the exhibition wall, curated openings, and everything else in
the proposal's §2 and §4 (a separate spec follows this one).

## Constraints that hold throughout

- Engines stay pure: `generate(rng, source, sheet)` draws only from its
  `rng`; same inputs ⇒ byte-identical SVG.
- Text is measured with `measure()` at the size and tracking it will be
  set in, never estimated by character count.
- `node tools/smoke.mjs` stays green after each engine; typestract gains a
  coverage check (below).
- Existing links to these three engines will render differently. Accepted:
  the proposal's verdict on them was "weak".

## 1. calligramme — the fountain and the ocean fill their paths

The principle is the one rain uses since section one: a path's text is
built to the path's measured length before it is set.

**Path lengths.** A helper `pathLength(pts)` returns the polyline length of
the points a `smoothPath` is built from, times 1.05 for the curve's bow;
for the ocean's straight spokes the length is exact, and for its rings
`2πr · sweep`.

**Fountain.** Each jet's text is assembled from a shared phrase pool (the
fragment's phrases, then further fragments pulled as the pool runs dry,
capped at 40 appends) until its measured width at the jet's size and
tracking reaches 0.9 of the jet's length; `startOffset` becomes `0%`, so
the text leaves the nozzle. The pool line fills its arc the same way. The
jets keep their count (4–6, more with entropy), their alternating sides,
their overshoot at high entropy, and the accent on one jet.

**Ocean.** Each spoke's text is built the same way to 0.92 of the spoke's
length (from the hub's clearance to `rMax`), from the fragment's words
cycled as now but continuing until the measure is met. Each ring's text is
built to 0.95 of the ring's arc length; a broken ring (high entropy) fills
its sweep only, so the break stays visible. The hub word is unchanged.

**Text source.** Fountain and ocean pull further fragments with
`source.fragment(rng, { minWords: 8, maxWords: 24 })`; attribution becomes
`A · B` for the first two sources, as gloss already does.

## 2. technopaegnia — one voice poured into one shape

**The text source learns mood and language.** In `src/text/procedures.js`,
`source.fragment(r, { minWords, maxWords, mood, lang })` accepts two
optional filters. In corpus and procedural mode the pool is filtered by
whichever are given; if the filtered pool holds fewer than four fragments,
`lang` is dropped; if still fewer than four, `mood` is dropped too. In user
mode both are ignored (the paste is one voice already). The fragment
returned keeps carrying `mood` and `lang` as today.

**The pour.** `gatherWords` pulls its first fragment freely and records its
`mood` and `lang`; every further pull passes both as filters and skips a
fragment whose text it has already used (a `Set` of texts; up to three
re-pulls per slot, then accept). The contrary text at entropy ≥ 0.6 keeps
passing `avoidMood` and is otherwise unfiltered, so the argument stays an
argument.

**What the reader sees.** A wings poem in one mood — thirty elegiac
fragments, or thirty wry ones — with no fragment repeated within the
shape. The colophon's attribution, as now, names the first two sources.

## 3. typestract — figures on white

### What stays

The strict Courier grid (44–62 columns, advance 0.6 em), the density ramp
built from the poem's own letters, the field functions (waves, shear,
concentric, interference), the two ribbons (black and vermillion), platen
slip, the density gamma, and the rotated second pass. The engine remains a
material provider for the diagram crossbreed.

### What changes: composition

The field is no longer read over every cell. It is read inside **figures**,
each a mask on the grid, placed on a white sheet with wide margins.

**Figure count** by entropy: one below 0.35; two from 0.35 to 0.7; two or
three above 0.7. At entropy ≥ 0.85 the engine also draws, with probability
`(entropy − 0.85) / 0.15 · 0.8`, the **Chopin sheet**: the current full-bleed
field, unchanged, in place of the figures. The slider runs from dsh to
Chopin.

**Figure kinds** (mask on normalized grid coordinates `u, v ∈ [0, 1]`):

| kind | mask | dsh source |
| --- | --- | --- |
| lozenge | `|u−cu|/a + |v−cv|/b ≤ 1` | the diamond typestracts |
| column | `|u−cu| ≤ a`, full or partial height | Lax's verticals, dsh's columns |
| annulus | `r0 ≤ hypot((u−cu)·k, v−cv) ≤ r1` | the ring pieces |
| band | `|v − (cv + sin(u·π·f + φ)·h)| ≤ a` | the wave bands |
| bar | `|(u−cu)·cosθ + (v−cv)·sinθ| ≤ a` | the diagonal shears |

Each figure draws: kind, center `(cu, cv)`, extent (fractions of the grid,
between 0.18 and 0.55 of the shorter side), a field kind, a gamma, a
ribbon (black, or red with probability 0.3, at most one red figure per
sheet), and a **glyph set of two or three characters** drawn from the
poem's letters at the light, middle and dark thirds of the density ramp.
Inside the mask the ramp is `[' ', light, mid, dark]` (two glyphs: `[' ',
light, dark]`), so white space is material inside the figure too. Outside
the mask the cell is blank.

**Placement.** Centers are drawn in `[0.2, 0.8] × [0.15, 0.85]` and the
extent is clamped so the figure stays three cells inside the box. With two
or more figures, a pure geometric pass (no draws) pushes centers apart
until their bounding boxes overlap by at most 25 % of the smaller one;
where figures do overlap, the later figure's glyph wins the cell.

**Overstrike is rare.** A cell is struck twice only when its value exceeds
0.96 *and* the figure was drawn as an overstriking figure (probability
`0.15 + entropy · 0.5`, at most one such figure below entropy 0.7). The
half-pixel offset and ribbon rules are unchanged.

**Platen slip** keeps its current rate. The **rotated second pass** appears
only above entropy 0.7, with probability `(entropy − 0.7) · 1.5`, and runs
through the figures (not full-bleed): it re-renders the figure cells with
the current sparse power curve.

**Title**: `${kinds.join(' + ')}: ${first three words}`; on the Chopin sheet
the current `${fieldKind} field: …` title.

### Coverage check in smoke

For `typestract` at entropy 0.2 over six seeds, count struck cells (non-space
characters across the row `<text>` nodes) against `cols · rows`, which the
main group reports in a `data-grid` attribute. The ratio must lie in
`[0.02, 0.30]`: white space is the material, but the sheet is not empty.
(Inside a figure only the faintest tenth of the field is blank, so the
silhouette holds; the floor was lowered from 0.03 to admit a single thin
column.) At entropy 1.0 there is no bound.

## Testing

- Smoke green after each engine; the typestract coverage check added with
  that engine.
- Browser proofs in headless Chrome at seeds `8f3a21c9`, `deadbeef` and two
  more per engine, at entropy 0.2, 0.5 and 0.9: calligramme's fountain and
  ocean seeds found with the mode-probe script (seeds `deadbeef`,
  `8f3a21c9`, `00000001` draw the fountain; `cafe1234`, `1234abcd`,
  `abcdef01` the ocean); technopaegnia read for one voice; typestract read
  for figure, margin, and the Chopin sheet at the top.

## Order of work

1. calligramme (one commit)
2. the text-source filters, then technopaegnia (two commits)
3. typestract (one commit, with the smoke check and README paragraph)

README's lineage paragraphs for typestract and technopaegnia are updated in
the commit that changes the engine.
