# The lineage drawer, sharing meta, and a wider corpus

**Date**: 2026-09-06 · **Status**: approved design · **Parent**: the
[second-edition proposal](2026-09-05-second-edition-proposal.md), §2 (the
lineage in the app; sharing meta) and §4 (widen the corpus). Motion
(proposal decision 2) stays open and is not part of this.

## 1. Sharing meta

- **Favicon**: an inline SVG data URI in `<link rel="icon">` — a serif
  capital T on paper (`#F6F1E5`) in ink (`#161412`), 32-unit viewBox.
- **Description**: `<meta name="description">` — "Generative visual poetry:
  twenty-five engines, one seed, a colophon that knows its lineage."
- **Open Graph**: `og:type` website, `og:title` TYPESTRACT, `og:description`
  as above, `og:url` `https://alternativeversions.github.io/visual-poetry/`,
  `og:image` the same origin's `og.png` — a 1200×630 PNG of a wall,
  rendered headlessly at seed `8f3a21c9` and committed. `twitter:card`
  `summary_large_image`.
- **Title**: `show()` sets `document.title` to `TYPESTRACT · <the poem's
  title>` (from `meta.title`); on the wall, `TYPESTRACT · the wall · <seed>`.
- **Copy link**: a `copy link` button in the Export row and the `C` key.
  `navigator.clipboard.writeText(location.href)`; the button reads
  "copied" for 1.2 s, then reverts. If the clipboard API is unavailable the
  button selects the seed box's text as a fallback and reads "select & copy".

## 2. The lineage drawer

**Source of truth** is the README. Its lineage section (from the heading
"The lineage (an annotated bibliography)" to "The anthologies") holds
twenty paragraphs, each naming the engine(s) it feeds as `` `engineId` ``.
The page fetches `README.md` from its own origin on first use (it serves
its repository root), caches the text, and finds the paragraphs that
mention the current engine. No copy of the paragraphs lives in code.

**Rendering**: a paragraph is rendered with a minimal markdown pass —
`**bold**` → `<strong>`, `*italic*` → `<em>`, `` `code` `` → `<code>`,
`[text](url)` → text — and nothing else; the text is inserted as
elements built from the parsed pieces, never as raw HTML.

**The drawer**: `<aside id="drawer" hidden>` positioned over the stage's
right side (420 px wide, full height, paper background, hairline left
border, scrolling; full width on phones). Contents, top to bottom: the
engine's name in the rail's small caps; the README paragraph(s); "as the
colophon cites it" followed by the engine's `CAPTIONS` list from
`colophon.js`, one per line; a link "the README, in full" to
`README.md#the-lineage-an-annotated-bibliography`. For a crossbreed both
engines' sections are shown in order. A close button at top right.

**Opening and closing**: clicking the colophon bar opens the drawer for the
current render (`current.meta.engineId`, and `hybridWith.id` if set); the
bar gets `cursor: pointer` and a `title` "the lineage". Escape or a click
on the stage outside the drawer closes it. Re-rolls and engine changes
update the drawer if it is open. The drawer's open state is not in the
hash. If the fetch fails (offline, or a host that does not serve the
README) the drawer shows the captions list alone with a line saying the
bibliography could not be loaded.

## 3. A wider corpus

**Rule**: as now — work published before 1929, so it is public domain in
the United States where the site is hosted; translations too. Every
fragment carries `attribution` (author, work, year or fragment number,
translator where one is used), `mood` ∈ {still, elegiac, ecstatic, wry,
cosmic}, `kind` ∈ {word, phrase, line, sentence}, `lang`.

**Additions** (about 120 fragments and 30 words), one commit per group:

| group | lang | sources |
| --- | --- | --- |
| Chinese in translation | en | Waley, *A Hundred and Seventy Chinese Poems* (1918): Po Chü-i, T'ao Ch'ien, Li Po; Pound, *Cathay* (1915) |
| Japanese in translation | en | Bashō, Buson, Issa via Chamberlain, *Japanese Poetry* (1910) and Noguchi (1914) |
| German | de | Rilke (*Neue Gedichte* 1907, *Stunden-Buch* 1905), Hölderlin, Goethe, Trakl, Novalis, Heine |
| French | fr | Rimbaud, Baudelaire, Nerval, Laforgue, Valéry (*Le Cimetière marin*, 1920) |
| Italian and Latin | it, la | Leopardi, Petrarch; Catullus, Horace, Lucretius, Ovid |
| Spanish and Portuguese | es, pt | Machado, Góngora, San Juan de la Cruz, Bécquer; Camões, Pessoa (*Orpheu*, 1915) |
| English | en | Dickinson, Hopkins, Whitman, Blake (more); Donne, Marvell, Clare, Emily Brontë, Thomas Browne, Julian of Norwich; *The Wanderer* and *The Seafarer* in Victorian translation |
| words | mixed | resonant single words across the languages above |

New language codes `es` and `pt` are opaque to every engine except the
technopaegnia filter, which treats them like any other.

**Checks**: smoke already renders every engine over the corpus; a new
smoke check asserts every fragment has the four fields with valid values
and that no two fragments share a text.

## Testing

- Smoke green after every commit.
- Meta: view-source shows the tags; `og.png` exists and is 1200×630; the
  tab title changes across two renders; the copy button reads "copied"
  after a click (verified in a real browser by the user; headless Chrome
  has no clipboard).
- Drawer: headless screenshot after a synthetic click on the colophon
  (via a small inline script invoked with `?drawer=1` during proofing
  only — removed before commit), showing the paragraph for the current
  engine; a crossbreed link shows two.
- Corpus: the field/uniqueness smoke check; a wall at one seed before and
  after, to see the new voices arrive.

## Order of work

1. sharing meta (one commit, `og.png` included)
2. the drawer (one commit)
3. the corpus, one commit per group, the smoke check with the first
