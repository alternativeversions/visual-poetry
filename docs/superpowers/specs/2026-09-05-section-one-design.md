# Section one — keeping the promises the README makes

**Date**: 2026-09-05 · **Status**: approved design · **Parent**: the
[second-edition proposal](2026-09-05-second-edition-proposal.md), §1

## Scope

Five of the proposal's six first-section items. The sixth — crediting in
the colophon the faces that actually rendered — shipped with the open
faces on 2026-09-05 and is not repeated here.

1. Share links reproduce the sheet: entropy, paper and pasted text travel
   in the hash.
2. Four engines that ignore the entropy slider gain real entropy branches;
   `revisedPhilosophy`'s top-of-range branch is a Derridean page.
3. `tendre` and `calligramme` stop printing labels over one another.
4. `aria`, `mesostic` and `tendre` fill the sheet.
5. The local-corpus probe is gated, so a cold load has a clean console.

Out of scope: everything in the proposal's §2–4 (the wall, curated
openings, motion, the weak four, the corpus).

## Constraints that hold throughout

- Engines stay pure: `generate(rng, source, sheet)` draws only from its
  `rng`; the same seed, entropy, source and text serialize byte-identically.
- Geometric fixes (collision nudges, budget scaling) make no `rng` draws,
  the convention `tendre` already follows, so they perturb nothing
  downstream.
- Strikethroughs, leaders and windows are drawn as measured SVG primitives,
  never `text-decoration`, so exports match the screen and smoke can see
  them.
- Existing links at the default entropy of 0.5 **will** render differently
  for the four engines in item 2. Accepted: the proposal's point is that
  the slider was a broken promise.

## 1. Share links

### Hash keys

`writeURL()` adds three keys after the existing `seed`, `engine`, `source`,
`type`, `hybrid`, in this order so hashes stay comparable:

| key | written when | form |
| --- | --- | --- |
| `e` | entropy ≠ 0.50 | two decimals, `e=0.85` |
| `paper` | paper mode ≠ `auto` | `warm` or `cool` |
| `text` | source is `user` and the drawer is non-empty | the drawer text, trimmed, whitespace collapsed to single spaces, cut at 4,000 characters, `URLSearchParams`-encoded |

Text lives in the hash and never in the query, so it does not reach a
server log.

### Reading

`readURL()` reads all three. Entropy is clamped to [0, 1]; an unparsable
value leaves the default. Paper must be one of the `#paper-mode` options.
Text sets `state.userText` and, at boot, the drawer's value; if the hash
has `text` but no `source`, source becomes `user` (a link with text means
text).

Boot also has to push state back into the controls: slider value and its
readout, paper select, drawer contents and its `open` class. Today only
the source radio is synced.

### The cap

4,000 characters is about a page of verse. The text rides in the hash,
which the server never sees, so the only limits are the address bar and
wherever the link is pasted: Chrome and Edge allow around 2 MB, Firefox
and Safari tens of thousands of characters, and English text grows about
1.2–1.5× under URL encoding, so the URL stays near 6 KB. A link whose text
was cut opens with the cut text; nothing signals the cut beyond the drawer
showing what was kept. (An earlier draft proposed a notice; YAGNI.)

## 2. Entropy branches

Each engine keeps its classic form at low entropy and departs from it with
the slider. `sheet.entropy` is already on the sheet; the engines simply
never read it (`gloss` destructures it and drops it).

### `technopaegnia` — the contrary text

- Below 0.6: unchanged (entropy biases the taper direction only).
- At or above 0.6: a second fragment is drawn, preferring one whose `mood`
  differs from the first's (up to four pulls; accept whatever comes on the
  fourth). The pour alternates line by line between the two texts through
  the same silhouette, so the shape holds while the poem argues with
  itself. The second text is set italic, in the accent when the palette
  has one, else ink at 0.7 opacity. Attribution becomes `A × B`.
- The oracle path (a subject's silhouette from the local model) is
  unaffected; the second text pours through the oracle's shape too.

### `gloss` — the voices close in

- Below 0.5: unchanged.
- 0.5–0.85: each gloss's stand-off from the center shrinks linearly, so at
  the top of this band the outer voices touch the utterance's margin.
- Above 0.85: one gloss, chosen by `rng`, is set across the utterance
  itself in its own face at 0.25 opacity — commentary printed over text.
- Throughout: the trailing-off voice trails off sooner, cutting at a
  fraction of its text that falls from 0.75 at entropy 0 to 0.35 at 1.

### `diagram` — the labels come unpinned

- Below 0.4: unchanged.
- Above 0.4: every label placed at an anchor (axis ends, vertices,
  geodesic starts, chart points) drifts by a seeded gaussian offset whose
  scale rises from 0 at 0.4 to about 70 px at 1. A 0.5-width hairline
  leader runs from the label's original anchor to its new baseline start,
  so the scaffold still says where each word belonged. Text-on-path labels
  do not drift; their path is the anchor.
- Above 0.85: one footnote at the floor loses its asterisk in the diagram
  — the note remains, its referent is gone.
- Implementation: a `placeLabel` helper inside `diagram.js` that every
  scaffold routes anchored labels through; the drift and leader live
  there, not in each scaffold.

### `revisedPhilosophy` — the revised page

Three bands.

- Below 0.3: unchanged, the classic page.
- 0.3 and above, **différance**: the speaker label of the authority's
  turns spells the name one letter off from the heading — the first `e`
  becomes `a`; failing an `e`, the first `a` becomes `e`; failing both,
  the first `i` becomes `y`. The heading, running head and epigraph keep
  the true spelling. A difference visible in writing and inaudible in
  speech; the one who speaks is not quite the one the page names.
- 0.3–0.7, **the contradiction**: the moral (now always present in this
  band) is drawn from a second pool that denies the epigraph — templates
  taking `word1` and `word2`, e.g. "The doctrine of {word1} was never
  his; the editors regret the epigraph." and "Later hands deny he ever
  reached {word2}."
- 0.7 and above, **the Glas page**: the dialogue splits into two columns
  under the fleuron. Left column: the authority's turns, in order,
  justified to its measure. Right column: the interlocutor's turns, in
  order, justified to its own. Both start on the same baseline and run
  independently — neither answers the other; the alternation that made it
  a dialogue is gone. Column measure is `(box.w · 0.84 − gutter) / 2`
  with a gutter of two baselines. Turns are drawn until either column
  would pass the floor; the turn count rises to 3–5 so both columns have
  something to say. One **judas window**: a paper-filled rectangle with a
  0.7 hairline, about 40 % of the left column's measure by two lines
  tall, set over the left column at roughly 55 % of its run, carrying
  three consecutive words from the right column in italic at the body
  size. It occludes what lies under it, as Derrida's inserts do. No
  moral in this band. The différance label applies to the left column's
  speaker.

## 3. Collisions

### `tendre`

- **Sea name.** The quadratic arc's length is estimated (chord plus
  sagitta correction). The name is measured at `sheet.scale(1.5)` with its
  tracking. If it exceeds 0.88 of the arc, the size steps down by 0.9
  until it fits or reaches `sheet.scale(0.5)`; if it still does not fit,
  the phrase breaks at the word nearest its midpoint onto two arcs, the
  second offset one line-height below the first, both centered.
- **Settlement labels.** After the existing geometric nudge, a label pass
  computes each label's rectangle and checks it against the other
  labels' rectangles and against a band around the sea arc one
  line-height tall. On overlap the label flips to the left of its marker;
  if that still overlaps, it steps up one baseline at a time, up to
  three. Pure geometry, no draws. The river name is on a path and is not
  checked.

### `calligramme`, rain

- Thread lanes: the five `x0` slots keep their jitter but the sine
  amplitude is capped at 0.32 of a lane and per-thread lean varies over
  0.85–1 rather than 0.6–1, so adjacent threads cannot cross.
- Full height: thread length runs 0.86–0.98 of the box. Each thread's text
  is built by concatenating phrases until its measured length at the
  thread's size and tracking reaches at least 0.85 of the thread's
  length, pulling a second fragment when the first is exhausted;
  `startOffset` becomes 0. Five full threads, as Apollinaire has.

## 4. Budgets

- **`aria`**: `phrasesOf` further splits parts by words when punctuation
  yields fewer than `want`, so a fragment with two clauses still gives
  four systems; if the fragment yields fewer than four even so, a second
  fragment is pulled and its phrases appended. Minimum four systems.
- **`mesostic`**: after the rows are built, if their height is under 0.6
  of the box, the body size, spine size and leading scale up by
  `min(1.6, 0.6 · box.h / rowsHeight)`. No draws.
- **`tendre`**: target settlements `rng.int(8, 12)`. Phrases come from the
  first fragment, then further fragments (up to four) split the same way,
  deduplicated, until the target is met or the pulls are spent. In user
  mode a short paste may fall short; accept it. Settlement x positions
  spread across the land as now; the collision pass above handles
  crowding.

## 5. The probe

- `src/text/corpus.js` attempts the dynamic import of `corpus.local.js`
  only when `location.search` contains `local=1` or `localStorage`
  holds `typestract-local=1`, both guarded for environments without
  `location` or storage (smoke runs under node). Otherwise the shipped
  corpus stands alone and nothing is requested.
- `readURL()` persists `?local=1` and clears on `?local=0`, alongside the
  existing `?ai=` handling.
- README: the "404 is normal" line goes; the supplement section says to
  visit once with `?local=1`.

## Testing

`tools/smoke.mjs`:

- `render()` gains an `entropy` parameter (default 0.5).
- Every engine renders at entropy 0 and 1 over three seeds with the
  existing hygiene and presence checks.
- The four engines in item 2 must serialize differently at entropy 0 and
  1 for every seed of four; a match is a failure ("engine ignores
  entropy").
- A URL round-trip check for item 1 cannot run in smoke (no `location`);
  it is verified in the browser.

Browser proofing, per item, in headless Chrome against a local server:
screenshots at entropy 0, 0.5 and 1 for each touched engine at the
proposal's two seeds (`8f3a21c9`, `deadbeef`), plus a share-link
round-trip (open a link with `e`, `paper`, `text`; confirm the controls
and the colophon).

## Order of work

Each item is one commit on the branch, smoke green after each:

1. §5 the probe
2. §1 share links (this also makes entropy reachable by URL for proofing)
3. §3 collisions
4. §4 budgets
5. §2 entropy branches, one engine per commit: `technopaegnia`, `gloss`,
   `diagram`, `revisedPhilosophy`

README updates ride with the item they describe.
