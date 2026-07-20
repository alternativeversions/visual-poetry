# Nine new engines — design

**Date**: 2026-07-18 · **Status**: approved in design dialogue; awaiting spec review

TYPESTRACT grows from sixteen engines to twenty-five. Each new engine is a
distinct visual grammar with a real lineage the colophon can cite honestly,
and none repeats an existing engine's move.

## Constitution and license

The constitution holds, unamended:

- One seed, one poem — all randomness from the engine's `rng`; no `Date`,
  no `Math.random`. Same seed + engine + source ⇒ byte-identical SVG.
- Engines stay pure: `{ id, name, lineage, generate(rng, source, sheet) }`
  returning `{ nodes, title, attribution, caption? }`. No network, no DOM
  beyond the builders in `svg.js`.
- Real text: only `<text>`/`<tspan>`/`<textPath>`; drawn marks are real
  filled/stroked paths. Never `foreignObject`.
- Colophons cite real poets, works, and dates. Every date in this spec has
  been checked; the implementation re-checks before landing captions.

**New policy — the license** (agreed this session): the craft *defaults*
(baseline grid, ~35 % accent, sober scale, portrait sheet) are breakable
**on purpose**. An engine that breaks one declares the transgression in its
header comment. The point is to make great art, not conform. Each engine
spec below names its break.

**Robustness rule**: no engine may throw on any source mode or degenerate
input (a single pasted word, an empty-ish drawer — `makeTextSource` already
falls back to corpus for blank user text). Degenerate text degrades
gracefully into a sparser poem, never an error.

## Approach

**Nine islands** (approach A of the design dialogue): each engine is a
self-contained file in `src/engines/`, in the house pattern, touching only:

- `src/engines/index.js` — nine imports, appended to `ENGINES` in the order:
  `intextus`, `tendre`, `aria`, `lineprinter`, `mesostic`, `index`,
  `rollage`, `inscription`, `calligramme`.
- `src/colophon.js` — nine `CAPTIONS` entries (3–5 captions each).
- `src/text/procedures.js` — one additive change: `plain()` (and the other
  ops where cheap) carries the corpus fragment's `mood`, `lang`, `kind`
  through onto the returned object. User text gets `mood: null` (engines
  that want a mood then pick one seeded). Nothing existing reads these keys,
  so no engine changes behavior.
- `README.md` and any other "sixteen" sightings (grep for `sixteen` /
  `Sixteen`, incl. `index.html`) — becomes twenty-five; new
  annotated-bibliography paragraphs; nine table rows.

No new shared modules. Helpers used by exactly one engine (syllabification
in `aria`, spine search in `mesostic`, toponym assignment in `tendre`) stay
local to that engine.

**Engine id note**: the index engine's file is `src/engines/bookIndex.js`
with `id: 'index'` and display name `index` — the registry maps by string
id, so the reader-facing word is kept while avoiding a second `index.js`
in the engines directory.

## The nine engines

### 1. `intextus` — the woven grid

- **After**: Optatian Porfyry's carmina cancellata (4th c. CE); Hrabanus
  Maurus, *De laudibus sanctae crucis* (c. 810). Captions: "after
  Optatian's carmina cancellata (4th c.)", "after Hrabanus Maurus, De
  laudibus sanctae crucis (c. 810)", "after the versus intexti, via
  Hrabanus (c. 810)", "after the letter-grid poem, via Optatian (4th c.)".
- **Palette**: `accent: 'force'` — the intext needs its color.
- **Text**: one or two fragments, letters run continuously without spaces,
  uppercased; a short phrase (2–5 words, from the fragment's own words, or
  `source.word` when the fragment is thin) as the intext.
- **Composition**: a strict grid of serif capitals (each letter its own
  `textEl`, anchor middle, centered in its cell; grid sized to fill the
  content box, roughly 20–30 columns × 26–38 rows, seeded). The intext's
  letters are planted cell-by-cell along a figure path — one of: Latin
  cross, saltire, lozenge, ring, chi, or the poem's initial letter drawn
  large across the grid. Planted cells print in accent. Read in path
  order, the tinted letters spell the intext exactly; a small italic line
  at the foot quotes it so the reader can verify. Grid letters elsewhere
  come from the fragment, wrapping as needed to fill.
- **Entropy**: low — one clean figure. Mid — a meander border joins the
  figure. High — the reversed field: figure cells become solid ink squares
  (`rect`s) carrying paper-colored letters.
- **Hybrid**: `acceptsMaterial: ['typestract']` — grid set in mono
  characters from the typestract vocabulary instead of serif caps.
- **Title**: the intext phrase. **License break**: accent always; ink as
  field, not line, at high entropy.

### 2. `tendre` — the allegorical map

- **After**: Madeleine de Scudéry, Carte de Tendre (*Clélie*, 1654),
  engraved by François Chauveau; Guy Debord & Asger Jorn, *The Naked City*
  (1957). Captions: "after Madeleine de Scudéry's Carte de Tendre (1654)",
  "after the Carte de Tendre, engraved by Chauveau (1654)", "after Debord
  & Jorn, The Naked City (1957)", "after the dérive, via Debord (1956)".
  The engine supplies `caption` naming whichever ancestor the render
  actually followed (Scudéry at low entropy, Debord at high).
- **Sheet**: `sheetSize: { width: 1400, height: 1000 }` — landscape, the
  second override after coupDeDes.
- **Palette**: accent auto; dérive arrows use accent when present, ink
  otherwise.
- **Text**: one long fragment (or two recombined), split at phrase/clause
  boundaries into 5–10 toponym phrases, kept in order.
- **Composition**: seeded coastline (smooth path through a jittered
  polyline dividing land from sea), sea shown by 3–5 coast-following
  ripple lines, stippled shore dots, hachured hill clusters (short strokes
  fanning from seeded ridge points). Toponyms: settlements (circle-and-dot
  symbol + small-caps label) take most phrases; one or two rivers carry
  their labels along the curve via `textOnPath`; the longest phrase
  becomes "the Sea of …" in the water; the final phrase trails into
  *terres inconnues* at the map edge, fading. A dotted route visits the
  settlements **in the poem's phrase order** — the poem is the journey.
  Apparatus: double-rule neatline, cartouche (small caps + rule
  flourish), compass rose in fine lines (seeded rotation), scale bar in
  leagues.
- **Entropy**: low — orderly Scudéry allegory. High — Debord: the
  landmass cuts into 2–4 drifting plates with gaps; accent arrows leap
  between them; labels may cross the cuts.
- **Hybrid**: none (its vocabulary is cartographic, not lendable yet).
- **Title**: "a map of {first toponym}". **License break**: landscape
  sheet; engraving-dense linework texture.

### 3. `aria` — the graphic score

- **After**: John Cage, *Aria* (1958); Cornelius Cardew, *Treatise*
  (1963–67). Captions: "after John Cage, Aria (1958)", "after Cornelius
  Cardew, Treatise (1963–67)", "after the graphic score, via Cage &
  Cardew", "after Cage's Song Books (1970)".
- **Palette**: accent auto; the gestural voice-curves print in accent
  when present (Aria's colored lines).
- **Text**: one fragment split into 4–7 phrases, one phrase per system;
  the fragment's `mood` tag (from the procedures change; seeded pick for
  user text) selects the tempo direction: still → "quasi niente", elegiac
  → "lento, sotto voce", ecstatic → "con fuoco", wry → "secco, parlando",
  cosmic → "immenso, senza misura".
- **Composition**: 4–7 five-line staves (0.7 rules) down the sheet. A
  local naive syllabifier (vowel-group split) breaks each word; each
  syllable is a notehead — small filled ellipse, slight rotation — x
  advancing by time, y by vowel pitch (a e i o u → scale degrees), with
  the syllable beneath as a hyphenated lyric ("mid-night"). Punctuation
  becomes dynamics: `!` → *f/ff/sfz*, `?` → fermata over a diminuendo
  hairpin, `—` → tenuto stroke, `,` → breath mark above the staff.
  Hairpins are two converging fine lines. An invented clef opens each
  system: a small seeded `inkStroke` glyph (Cardew's alphabet, not a
  counterfeit G-clef). Time signature: word count over syllable count.
  One or two wordless gestural swells (`inkStroke` curves) weave across
  systems.
- **Entropy**: low — a tidy lyric score. High — Treatise: staves bend
  (`smoothPath` staves, lyrics on curved `textOnPath`), a staff line
  peels off into a free curve, noteheads leave the staff.
- **Hybrid**: `acceptsMaterial: ['asemic']` — the lyric line rendered as
  near-writing beneath the notes.
- **Title**: the tempo direction. **License break**: the baseline grid
  gives way to curved staves at high entropy.

### 4. `lineprinter` — the stochastic line printer

- **After**: Theo Lutz, *Stochastische Texte* (Zuse Z22, 1959); Nanni
  Balestrini, *Tape Mark I* (1961); Alison Knowles & James Tenney, *A
  House of Dust* (1967). Captions: "after Alison Knowles & James Tenney,
  A House of Dust (1967)", "after Theo Lutz, Stochastische Texte (1959)",
  "after Nanni Balestrini, Tape Mark I (1961)", "after the line printer's
  first poems (1959–67)". The engine supplies `caption` naming the mode's
  true ancestor.
- **Palette**: accent auto; greenbar bands (below) want it.
- **Text**: one or two fragments supply the lexicon: word pools (longer
  words as noun-ish, shorter as modifier-ish — a legible heuristic, not
  POS pretense) and clause chunks split at punctuation.
- **Composition**: continuous stationery — sprocket holes (small circles)
  down both margins, dashed perforation rules across the sheet at form
  boundaries, a job-header line in chain-printer caps (job name + PASS
  number). All text mono, ALL CAPS, double-spaced, `preserveSpace`.
  Three seeded modes: **dust** — quatrains in the Knowles–Tenney frame (A
  {noun} OF {noun} / IN {chunk} / USING {chunk} / INHABITED BY {noun}S);
  **lutz** — logical propositions (EVERY {noun} IS {word}. NOT EVERY
  {noun} IS {word}.); **tape mark** — the fragment's clause chunks
  recombined, pass numbers incrementing. Chain-printer artifacts
  throughout: per-character baseline wobble (±1 px, low rate), doubled
  strikes (re-print offset 0.5 px), one dried-ribbon band (reduced
  opacity across a horizontal stripe).
- **Entropy**: low — clean output. High — overstruck XXXX deletions, a
  runaway repeat shedding its last word each time, a quatrain split
  across a perforation.
- **Hybrid**: none.
- **Title**: the first generated line, lowercased. **License break**:
  pale greenbar bands — accent at ~7 % opacity behind alternating line
  groups (paper-toned when no accent).

### 5. `mesostic`

- **After**: John Cage, *62 Mesostics re Merce Cunningham* (1971) and the
  writings through *Finnegans Wake* (1977–); Jackson Mac Low's diastics
  (1963–). Captions: "after John Cage, 62 Mesostics re Merce Cunningham
  (1971)", "after Cage's writings through Finnegans Wake (1977–)", "after
  the 50 % mesostic rule, via Cage", "after Jackson Mac Low's diastics
  (1963–)".
- **Palette**: accent auto; spine capitals in accent when present.
- **Text**: spine from `source.word` (redrawn up to a few times for ≥4
  distinct letters; shorter accepted if the text insists); wing text from
  one or two fragments.
- **Composition**: the spine word's letters descend the center axis as
  capitals one scale step larger, tracked. For each spine letter, scan
  forward through the wing text for the next word containing it, honoring
  the 50 % rule (the spine letter must not recur between this spine
  letter and the next) where the text allows — enforced by skipping
  violating words, relaxed when the scan exhausts (Cage: "as strictly as
  possible"; the header comment says so). The chosen word is placed so
  its spine letter sits exactly on the axis (`measure` the prefix);
  seeded 0–3 wing words before and after on the same line. The spine
  cycles two or three times if the page affords it.
- **Entropy**: low — one tidy spine. High — wings lengthen and drift
  (x jitter), some wing words ghost to 8 % opacity, leading tightens —
  writing through the writing.
- **Hybrid**: none.
- **Title**: the spine word. **License break**: none — this one is
  orthodox and proud of it.

### 6. `index` (file `bookIndex.js`)

- **After**: the index to Nabokov's *Pale Fire* (1962); J. G. Ballard,
  "The Index" (1977). Captions: "after the index to Nabokov's Pale Fire
  (1962)", "after J. G. Ballard, 'The Index' (1977)", "after back matter
  as narrative, via Nabokov & Ballard".
- **Palette**: `accent: 'never'` — book-page sobriety.
- **Text**: one or two fragments; words deduped, lowercased, stopwords
  dropped, alphabetized into entries; each entry's subentries are the
  short phrases surrounding its occurrences.
- **Composition**: a book's index page — running head (INDEX in
  letterspaced small caps), two columns, hanging indents, folio at the
  foot ("— {seeded page} —"). Entries: `word, {pages}` with subentry runs
  ("moon: has set, 3; and the Pleiades, 12"). The hidden order: each
  occurrence of a word in the poem gets one page reference, and pages are
  assigned so that **reading every page reference in ascending order
  re-derives the poem's word order** — the index is the poem, filed.
  Apparatus wit, one each: a *see also* pair between co-occurring words;
  *passim* (italic) for the most frequent word; one entry with no page
  number at all.
- **Entropy**: low — a sober apparatus. High — the index misremembers:
  entries from a different corpus fragment intrude, a cross-reference
  loops (moon, *see* night · night, *see* moon), a page number exceeds
  the book.
- **Hybrid**: none.
- **Title**: "index ({first entry}–{last entry})". **License break**:
  none; the whisper is the art.

### 7. `rollage`

- **After**: Jiří Kolář, rollage (1962–). Captions: "after Jiří Kolář,
  rollage (1962–)", "after the sliced image, via Kolář (1962–)", "after
  Kolář's chiasmage and rollage (1960s)".
- **Palette**: accent auto; when present, the small-text layer prints
  entirely in accent — a two-color separation.
- **Text**: one fragment, set twice.
- **Composition**: Setting A — monumental: display words at 90–160 px,
  few words, possibly rotated 90°, filling the sheet. Setting B — the
  fragment repeated as a dense small-text block (12–14 px, `breakLines`,
  ragged right) over the same area. Both sliced into vertical strips
  (seeded width 20–48 px) by `clipPath` (the decollage machinery) and
  interleaved A/B/A/B; one layer takes a progressive vertical shift per
  strip — Kolář's shear, the image waving.
- **Entropy**: low — wide strips, small shift, the monument mostly
  legible. High — narrow strips, large progressive offsets, strip order
  shuffled, alternate strips rotated 180° (reverse rollage).
- **Hybrid**: none — rollage's contribution is a composition, not a
  lendable material vocabulary.
- **Title**: the fragment's first words. **License break**: poster-scale
  display type; two-color printing.

### 8. `inscription`

- **After**: Ian Hamilton Finlay, Little Sparta (1966–); the Roman
  lapidary hand (Trajan's column, 113 CE). Captions: "after Ian Hamilton
  Finlay, Little Sparta (1966–)", "after Finlay's garden inscriptions,
  via Wild Hawthorn Press (1961–)", "after the Roman lapidary hand
  (Trajan's column, 113 CE)", "after THE PRESENT ORDER…, via Finlay &
  Saint-Just (1983)".
- **Palette**: accent auto; when accent lands, the whole inscription
  prints in it — rubrication (inscriptions were painted minium red;
  vermillion is already on the shelf).
- **Text**: one fragment compressed to a lapidary sentence: ≤ 12 words,
  uppercased, V for U, I for J, interpuncts (·) between words, all other
  punctuation dropped.
- **Composition**: a drawn stele in double fine rules — plain slab or
  pedimented, chamfered corners, a ground line, two or three grass
  strokes of `inkStroke` at its foot. The sentence in letterspaced
  capitals (+12–18 % tracking), centered, first line largest and
  diminishing down the stone (`breakLines` with per-line scale). A small
  hedera — an ivy leaf drawn as a filled path, plotter-true, not the
  Unicode glyph — closes the text. Beneath the stone, the attribution as
  a small italic subscription — the dedication.
- **Entropy**: low — the stone entire. Mid — one weathered word restored
  beneath in epigrapher's [brackets], smaller. High — the stele breaks: a
  jagged crack path, the two clip halves displaced a few degrees and
  pixels apart, letters lost in the gap. Sappho on a broken stone is the
  engine's whole argument.
- **Hybrid**: none.
- **Title**: the first two carved words, lowercased. **License break**:
  full-accent rubrication when the accent lands.

### 9. `calligramme`

- **After**: Guillaume Apollinaire — "Lettre-Océan" (1914), "Il Pleut"
  (1916), *Calligrammes* (1918). Captions: "after Apollinaire, 'Il Pleut'
  (1916)", "after Apollinaire, 'Lettre-Océan' (1914)", "after
  Calligrammes (1918)", "after the jet d'eau, via 'La colombe poignardée
  et le jet d'eau' (1918)". The engine supplies `caption` per mode.
- **Palette**: accent auto; one thread or ring in accent when present.
- **Text**: one fragment split into phrases (rain, fountain); a hub word
  via `source.word` plus phrases (océan).
- **Composition** — three seeded modes, all on real `textOnPath` curves:
  **rain** — phrases fall in five wavering near-vertical S-curves, small
  type, Apollinaire's five threads; **fountain** — 4–7 threads rise from
  a basin point, arc, and fall; the pool is one line on a shallow curve
  at the foot; **océan** — the hub word in caps at center, text spokes
  radiating on straight paths, one or two concentric text rings
  (`startOffset` seeded).
- **Entropy**: low — the classic figures. High — wind bends and crosses
  the rain; the fountain overshoots and breaks into single scattered
  droplet letters placed past the path's end; the océan's spokes multiply
  and its rings break into arcs.
- **Hybrid**: `acceptsMaterial: ['asemic']` — the threads rain
  near-writing strokes instead of words.
- **Title**: in the mode's voice ("il pleut {first word}"; "jet d'eau";
  "{hub word}-océan"). **License break**: none the tradition didn't make
  first.

## Cross-cutting

- **Registry/UI**: `main.js` builds the rail, cycling, and `?engine=`
  from `ENGINES`; no UI change needed beyond any literal "sixteen" text.
- **Colophon**: nine `CAPTIONS` entries as listed; smoke's lineage regex
  (`after …(` / year / `via`) is satisfied by all.
- **README**: sixteen → twenty-five throughout; new bibliography
  paragraphs for: the woven grid (Optatian/Hrabanus), cartography
  (Scudéry/Debord), the score (Cage/Cardew), the first computer poems
  (Lutz/Balestrini/Knowles & Tenney), Cage's mesostics/Mac Low, the index
  (Nabokov/Ballard), Kolář, Finlay/lapidary, Apollinaire's calligrammes
  proper; nine table rows; the engine-count line in the repository map.
- **Testing/acceptance**: `node tools/smoke.mjs` green (determinism,
  hygiene, presence, colophon lineage, hybrid no-throw, type pairings) —
  no smoke changes required; browser eyeball per engine across several
  seeds, all three source modes, entropy low/mid/high; SVG export opens
  clean (textPath engines checked in at least one external renderer).
- **Implementation order** (riskiest machinery first): calligramme
  (proves textOnPath end to end) → rollage (strip clipping) → intextus →
  mesostic → index → inscription → lineprinter → aria → tendre (largest)
  → README/bibliography last, in one closing commit.
- **Commits**: one per engine, in the repository's voice.
