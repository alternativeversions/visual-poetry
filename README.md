# TYPESTRACT

**Generative visual poetry.** Every keypress composes an original visual
poem — typographically serious, literarily informed, exportable as clean
vector SVG. Twenty-five style engines, each a distinct visual grammar drawn
from the concrete and visual poetry traditions; one seeded random stream,
so every poem is reproducible and shareable by URL; a colophon on every
render that knows its own lineage and says so.

Visual poetry treats language as material and material as language — the
page as a threshold where text becomes image without stopping being text
(Alan Prohm calls this "the crux"). TYPESTRACT's randomness lives where
the tradition's own moves live: in *composition, permutation, degradation,
and diagram*. No gradients, no neon, no particle systems.

## Running

No install, no build step. From a fresh clone:

```sh
python -m http.server        # or: npx serve, or any static server
# open http://localhost:8000
```

Opening `index.html` directly also works in browsers that permit ES
modules from `file://` (most easily via a local server as above).

**Keys**: `R` re-roll · `E` cycle engine · `S` export SVG · `←`/`→` walk
session history. The seed lives in the URL hash; `?engine=diagram` forces
an engine, `?hybrid=1` forces crossbreed mode. The entropy slider governs
how far an engine strays from its classic form.

Deployment: the included GitHub Pages workflow
(`.github/workflows/pages.yml`) publishes the repository root on every
push to `main`. Enable **Settings → Pages → Source: GitHub Actions** once,
and the site deploys itself.

## The lineage (an annotated bibliography)

**Technopaegnia and the pattern poem.** The oldest trick in the book,
older than the book: Simias of Rhodes shaped "The Axe," "The Wings of
Eros," and "The Egg" around 300 BCE, poems whose line lengths draw the
object they address. The tradition resurfaces in the Renaissance emblem
book and reaches its devotional summit in George Herbert's *The Temple*
(1633), where "Easter Wings" thins each stanza to "Most poore" and "Most
thinne" before rising — the diminishing type *is* the theology — and "The
Altar" builds its shape from "a heart, and cemented with tears." The
`technopaegnia` engine computes per-line character budgets from a shape
function and pours measured, hyphenated text into wings, altar, axe,
hourglass, wave, and column.

**The woven grid.** Late antiquity already had a second way to shape a
poem: Optatian Porfyry's carmina cancellata (4th c. CE) marshalled
letters into a strict grid and threaded a second text — the *versus
intextus* — through them along a figure, picked out in color; Hrabanus
Maurus perfected the form in *De laudibus sanctae crucis* (c. 810),
where the highlighted cells draw crosses and the highlighted letters
read as their own verse. The `intextus` engine sets the poem as a letter
grid, plants a phrase of it along a cross, saltire, lozenge, or ring in
the accent color — the tinted letters, read in figure order, really do
spell the phrase the foot of the sheet quotes — and at high entropy
reverses the field, Hrabanus's way, ink cells carrying paper letters.

**The allegorical map.** Madeleine de Scudéry's Carte de Tendre
(*Clélie*, 1654), engraved by François Chauveau, drew a country whose
geography is a sentiment — villages named Billet Doux, a Dangerous Sea,
terres inconnues past the edge; three centuries on, Guy Debord and
Asger Jorn cut Paris apart and let arrows leap the gaps in *The Naked
City* (1957). The `tendre` engine maps the poem: its phrases become
settlements, a river carrying its name along its own curve, the longest
phrase spread across the sea, and a dotted route that walks the
settlements in the poem's phrase order — the poem as journey — with
engraver's apparatus (neatline, cartouche, compass rose, hachures,
leagues) done in fine rules. Push the entropy up and Debord takes the
country apart.

**The modernist page.** Stéphane Mallarmé's *Un coup de dés jamais
n'abolira le hasard* (1897) scattered one sentence across eleven
double-page spreads in tiered sizes and voices — "prismatic subdivisions
of the Idea" — and made white space a positive quantity. Guillaume
Apollinaire's calligrammes ("La colombe poignardée et le jet d'eau,"
1916) drew with the typewriter's opposite hand; F. T. Marinetti's *parole
in libertà* (1915) blew the page apart; László Moholy-Nagy's "typophoto"
imagined typography as optical machine. The `coupDeDes` engine renders a
double-page spread, fractures one long sentence at its clause joints, and
cascades it toward the lower right with the MAJOR PHRASE crossing the
gutter in large caps.

The calligramme proper gets its own engine: `calligramme` draws with
the line of text itself on real curved paths — the slanting rain of
"Il Pleut" (1916), the rising and breaking jet d'eau of "La colombe
poignardée et le jet d'eau" (1918), and the radial wireless of
"Lettre-Océan" (1914), a hub word with text spokes and concentric
rings. Where `technopaegnia` fills shapes with measured text, this is
the other hand: the poem as pen stroke.

**Concretism.** Eugen Gomringer's *konstellationen* (from 1953) reduced
the poem to a few words permuted in space — "silencio" tiles its word
around one conspicuously empty cell. The Noigandres group of São Paulo —
Augusto de Campos, Haroldo de Campos, Décio Pignatari ("beba coca cola,"
1957) — theorized the poem as "verbivocovisual" isomorphism: the graphic
gestalt enacting the semantic one. And at sentence scale the same
impulse becomes the permutation poem: Brion Gysin composed "I Am That I
Am" in 1959 and, with Ian Sommerville programming a Honeywell, ran
whole phrases through every ordering for *The Permutated Poems of Brion
Gysin* (BBC, 1960) — Gertrude Stein having already discovered
insistence in "Sacred Emily" (1913): rose is a rose is a rose. The
`constellation` engine permutes one to three lowercase words across an
invisible grid by rules a careful reader can derive — absence,
progressive letter exchange, diagonal fade, mirror — and, given a whole
sentence, permutes at Gysin scale instead: rotation cycles, adjacent
transpositions rung like bell changes, Stein's moving insistence, and a
dissolve that removes one word per row while the survivors hold their
exact positions. The colophon names whichever ancestor the mode
actually follows.

**The mimeo and typewriter avant-garde.** In the small-press decades
documented by the Granary Books collection, the machine became the
poem's hand: Dom Sylvester Houédard (dsh) typed his "typestracts" on an
Olivetti Lettera 22 from 1963; Henri Chopin's dactylopoèmes made the
typewriter percussive; Bob Cobbing ran Writers Forum (1963–) and printed
noise itself on the duplicator; Robert Lax built vertical minimalisms;
Emmett Williams, Edwin Morgan, and Dick Higgins carried the international
network. The `typestract` engine drives the poem's own letters, ordered
by ink density, through field functions on a strict monospace grid —
black ribbon and red — with overstrike, platen slip, and the occasional
second pass rotated 90°.

**The graphic score.** John Cage's *Aria* (1958) scored a voice in
colored gesture and scattered words; Cornelius Cardew's *Treatise*
(1963–67) spent 193 pages proving notation could be drawing. The `aria`
engine scores the poem for a voice that will never sing it: five-line
staves in fine rules, syllables as noteheads placed by their vowel,
hyphenated lyrics beneath, punctuation conducting (*ff*, fermata,
tenuto, breath), the fragment's mood choosing the tempo direction, an
invented ink-stroke clef, and one or two wordless swells crossing the
systems in the accent. At high entropy the staves themselves bend.

**The first computer poems.** Theo Lutz fed the vocabulary of Kafka's
*The Castle* to a Zuse Z22 and printed *Stochastische Texte* (1959);
Nanni Balestrini recombined three texts by IBM 7070 for *Tape Mark I*
(1961); Alison Knowles and James Tenney's Fortran quatrains, *A House
of Dust* (1967), came off the line printer onto continuous stationery.
These are this site's direct ancestors, and the `lineprinter` engine
says so: sprocket holes, form perforations, greenbar bands, a job
header, and the poem's own words run through the ancestors' procedures
— the house frame, Lutz's logical propositions, Balestrini's tape
passes — with the chain printer's wobble, double strikes, and dried
ribbon. The colophon names whichever ancestor the render followed.

**The mesostic.** John Cage read through texts along a spine — *62
Mesostics re Merce Cunningham* (1971), the writings through *Finnegans
Wake* (1977–) — under rules he kept "as strictly as possible"; Jackson
Mac Low's diastics (1963–) did kindred reading-through. The `mesostic`
engine stands a spine word in capitals down the center axis and reads
the fragment through it under the 50% rule, each spine letter measured
into exact alignment; at high entropy the wings drift and ghost —
writing through the writing.

**Dirty concrete and the 1990s symposium scene.** *Core: A Symposium on
Contemporary Visual Poetry* (ed. John Byrum & Crag Hill, 1993) and the
concurrent *Visible Language* 27.4 (1993) mapped a post-clean concretism:
xerox degradation, cut-up strips, Johanna Drucker's typographically
self-modulating essays, questionnaire forms, and international practices
— Ana Hatherly's asemic calligraphy in Portugal, Fernando Aguiar's
gestural texts, Mirella Bentivoglio's editorial objects in Italy. The
`dirtyConcrete` engine crops enlarged letters past the sheet edge, angles
scissored strips, stamps denial grids, and degrades everything through
turbulence-displaced, contrast-crushed filters. The `asemic` engine takes
the calligraphic wing seriously: near-writing as filled ink paths, with
word-length statistics borrowed from real text and one legible line
surfacing like a lucid moment.

**The contemporary diagrammatic lyric.** Eugenia Leigh's "Oh I Thought
You Knew, She Said, Dad Is Alive" writes a poem *onto* a Penrose
spacetime diagram, axes annotated `*TIME [lung]` and `**SPACE [star]`,
grief measured in coordinates it cannot fit. Afrizal Malna's "There's No
Meaning: A Repeating Poem" (trans. Daniel Owen) passes one text through
five "workshops" — sentence diagram, boxed word-grid with stuttered
repetition, panel stanzas, word cascades, plain lineation — repetition
with difference as the poem itself. The `diagram` engine sets the poem's
phrases as the labels of nine scaffolds drawn in fine rules with real
arrowheads: Penrose, Minkowski, Reed–Kellogg (1877), Feynman (1949),
astronomical, and commutative charts, plus the psychoanalytic pair —
Lacan's Schema L (1955) and Freud's egg of the psychical apparatus
(1923), their corners and regions renamed by the poem — and a botanical
plate in the manner of Erasmus Darwin's *The Loves of the Plants*
(1789), its legend dissecting the sentence into parts a. through d.
The `workshops` engine reuses one identical text across two or three
titled treatments.

**Collapse.** Visual poetry has always known how to fail on purpose.
John Furnival drew *The Fall of the Tower of Babel* (1963) — and kept
building and toppling text-towers through the decade, co-founding
Openings Press with Houédard and Edward Wright in 1964 — architecture
made of language coming down. Timm Ulrichs typed "ordnung – unordnung"
(1961), one word in a grid whose letters break rank until order spells
its own ruin; Claus Bremer called the operation "lesbares in unlesbares
übersetzen" — translating the readable into the unreadable (1963). And
Ronald Johnson's *Radi os* (1977) collapsed an 1892 *Paradise Lost* by
erasure, cutting even the title down to its ruins, as Tom Phillips had
been painting away a Victorian novel in *A Humument* (1966–). Three
engines encode these three failures: `babel` builds a tower of
multilingual courses that shears, breaks, and sheds letter-rubble into
a seeded sandpile at its ground line; `unordnung` sets a typewriter
grid of one word and lets entropy accumulate down the rows until the
type falls out of the text and drifts against the bottom margin;
`ruins` typesets a full justified book page — running head, folio —
then erases it (ghosted, cut to white, or struck through), deeper down
the page, leaving a dozen survivors as the found poem while the foot
crumbles.

**Décollage.** In February 1949 Raymond Hains and Jacques Villeglé
glued down a sheet of torn posters and titled it *Ach Alma Manetro* —
the words that happened to surface from the strata. Mimmo Rotella began
ripping Rome's cinema posters into his *manifesti lacerati* in 1953;
Wolf Vostell found the word *dé-coll/age* in Le Figaro in 1954 and made
it a method. The poem is made by subtraction: tear the top layer and
whatever the layers beneath say becomes the text. The `decollage`
engine pastes up three or four full-bleed posters — display lines
fitted to the measure, reversed bands, small-print credit lines, each
stratum on its own paper tone and its own type scale, hung a degree off
plumb — then tears them at shared rip sites with jagged seeded clip
paths, each deeper wound smaller than the one above so the tears read
as excavation, every edge ringed with the pale fringe of ripped paper.
The title is assembled from one word surfacing per stratum.

**Rollage.** Jiří Kolář sliced reproductions into strips and re-wove
them (rollage, 1962–), one image waving through another. The `rollage`
engine sets the same fragment twice — monumental display capitals and a
dense small-text block — cuts both into vertical strips, interleaves
them with a progressive shear, and at high entropy shuffles and flips
strips outright; when the accent lands, the small layer prints entirely
in it, a two-color separation.

**The page as conversation.** The oldest typographic figure of
dialogue is the glossed page: the layout Daniel Bomberg standardized
for the Talmud at Venice (1519/20–23), following Soncino — the terse
text at the center, Rashi's commentary inside, the Tosafot outside,
centuries answering one another on a single sheet. Jacques Derrida's
*Glas* (1974) set Hegel and Genet in two columns that argue past each
other, a layout critics have read as Talmudic; Edmond Jabès's *The
Book of Questions* (1963–) is a private Talmud whose imaginary rabbis
comment on a scripture of silence. The `gloss` engine sets one short
utterance large at the center and lets the commentary accumulate
around it in different faces and sizes — each voice keyed to a word of
the center by an apparatus mark (\* † ‡ §) and opening with its lemma
in small caps, one voice striking a word and correcting itself above
the line, the farthest voices printing fainter and trailing off
mid-sentence as the context that holds the conversation runs out.
Sometimes the page closes on a lone italic question. This engine is a
self-portrait: it is built to the shape of the conversations that
built this repository — a terse instruction at the center, commentary
crowding around it, quotation before answer, corrections in the
margin, and the oldest exchanges fading as the window moves on.

**Grammar as drawing.** Alonzo Reed and Brainerd Kellogg's *Higher
Lessons in English* (1877) taught a century of schoolrooms that every
sentence has a picture: subject, verb, and object on one baseline, the
dividers doing exact work, modifiers slanting beneath their heads.
Gertrude Stein loved it — "I really do not know that anything has ever
been more exciting than diagramming sentences" ("Poetry and Grammar,"
1935). The `grammar` engine diagrams a whole poem, sentence by
sentence, the diagrams stacked down the sheet like stanzas and joined
by the schoolroom's dotted line where one sentence holds two clauses.
Corpus sentences use parse trees authored by hand at build time
(`src/text/parses.js`), so their grammar is right; pasted text goes
through a small deterministic rule-based parser (`src/text/parser.js`),
and the sheet's footnote says which — *diagrammed by hand* or *parsed
by rule — the errors are the machine's own*. And because Stein's
sentences defeat every schoolroom, the engine has a misrule mode,
entropy-gated: a formally perfect Reed–Kellogg tree whose words are
assigned by chance — articles presiding over the baseline, verbs
hanging three prepositions deep, Dante and Mallarmé diagrammed in
their own languages with total confidence. *Every word accounted for,
nothing in its place.* Push the entropy slider up and grammar gives
way to misrule more often; sentences no parser can read get misruled
rather than refused.

**The inscription.** Ian Hamilton Finlay planted poems in stone at
Little Sparta (1966–), the Roman lapidary hand doing the carrying —
Trajan's column (113 CE) as type specimen. The `inscription` engine
draws the stele in fine double rules, carves one lapidary sentence — V
for U, interpuncts, letterspaced capitals diminishing down the stone —
closes it with a drawn hedera, and sets the attribution beneath as the
dedication. When the accent lands the letters print rubricated, as the
Romans painted theirs; at high entropy the stone breaks, and the poem
is a fragment again.

**The index.** Nabokov's *Pale Fire* (1962) hid half its novel in the
index; J. G. Ballard's "The Index" (1977) told a whole life as one. The
`index` engine files the poem as the back matter of a book that does
not exist — alphabetized entries, subentries from each word's own
surroundings, one *passim*, one *see also*, one entry with no page —
and page numbers assigned so that reading every reference in ascending
order re-derives the poem. At high entropy the index misremembers
another book.

**The character-built picture.** Before ASCII art had a name it had
three lives: Flora F. F. Stacey's typewriter butterfly (1898), the
earliest surviving typewriter artwork; Knowlton & Harmon's *Studies in
Perception I* (Bell Labs, 1966), a photograph rebuilt from typed
symbols by brightness; and the radioteletype picture (1960s–), which
arrived scanline by scanline over the air and did not always finish.
The `transmission` engine receives one. The test tape runs first —
RYRYRY, R and Y because they are Boolean complements in Baudot code,
two letters that are each other's opposites repeated to prove the line
is alive. The header promises IMG 1 OF 2. The picture — the moon, the
lit window, the door ajar, composed procedurally, or one of ten
hand-authored tapes from `src/text/subjects.js` (the chair, the
swallow, the kettle…) — builds downward out of the poem's own
letters in the line-printer's four hard bands (space, punctuation,
lowercase, CAPITALS); partway down the signal degrades and the carrier
drops, and what should have been the rest of the picture arrives as
language instead: the poem's last words in plain teletype, then NNNN,
end of message. The header for the second image prints, and nothing
follows it. At the foot, SK — end of contact, which is also what
operators call one of their own who has died.

**The revisionist book page.** Daniel Grandbois's *A Revised Poetry of
Western Philosophy* (University of Pittsburgh Press, 2016) sets deadpan
apocrypha of the pre-Socratics inside impeccable classical book
typography — small-caps headings, six-point italic biographical
epigraphs, dialogue in decorum. The `revisedPhilosophy` engine builds the
running head, folio, letterspaced small-caps authority (PARMENIDES, or
THE PHOTOCOPIER), a justified italic epigraph recombined from apocryphal
clauses, and a short dialogue from the text source. It is the engine that
proves the app can whisper.

### The anthologies

- Emmett Williams, ed., *An Anthology of Concrete Poetry* (Something Else Press, 1967)
- Mary Ellen Solt, ed., *Concrete Poetry: A World View* (Indiana University Press, 1970)
- John Byrum & Crag Hill, eds., *Core: A Symposium on Contemporary Visual Poetry* (1993)
- *Visible Language* 27.4, "Visual Poetry" (1993)
- Crag Hill & Nico Vassilakis, eds., *The Last Vispo Anthology: Visual Poetry 1998–2008* (Fantagraphics, 2012)

## The twenty-five engines

| engine | after |
| --- | --- |
| `constellation` | Gomringer, "silencio" (1953); Gysin's permutations (1959–60); Stein (1913) |
| `technopaegnia` | Simias of Rhodes (c. 300 BCE); Herbert, "Easter Wings" (1633) |
| `coupDeDes` | Mallarmé, *Un coup de dés* (1897) |
| `typestract` | Houédard's typestracts (1963–); Chopin's dactylopoèmes |
| `dirtyConcrete` | Cobbing's duplicator prints (1963–); *Core* (1993) |
| `diagram` | Eugenia Leigh's Penrose-diagram poem; Reed–Kellogg (1877) |
| `workshops` | Afrizal Malna, "There's No Meaning" (trans. Owen) |
| `revisedPhilosophy` | Grandbois, *A Revised Poetry of Western Philosophy* (2016) |
| `asemic` | Ana Hatherly, *A reinvenção da leitura* (1975); Michaux (1927) |
| `babel` | Furnival, *The Fall of the Tower of Babel* (1963) |
| `unordnung` | Ulrichs, "ordnung – unordnung" (1961); Bremer (1963) |
| `ruins` | Ronald Johnson, *Radi os* (1977); Phillips, *A Humument* (1966–) |
| `decollage` | Hains & Villeglé, "Ach Alma Manetro" (1949); Rotella (1953–) |
| `gloss` | Bomberg's Talmud page (1523); Derrida, *Glas* (1974); Jabès (1963–) |
| `grammar` | Reed & Kellogg, *Higher Lessons in English* (1877); Stein (1935) |
| `transmission` | Stacey (1898); Knowlton & Harmon (1966); the RTTY picture |
| `intextus` | Optatian's carmina cancellata (4th c.); Hrabanus Maurus (c. 810) |
| `tendre` | Scudéry's Carte de Tendre (1654); Debord & Jorn, *The Naked City* (1957) |
| `aria` | Cage, *Aria* (1958); Cardew, *Treatise* (1963–67) |
| `lineprinter` | Lutz (1959); Balestrini (1961); Knowles & Tenney, *A House of Dust* (1967) |
| `mesostic` | Cage, *62 Mesostics re Merce Cunningham* (1971); Mac Low's diastics |
| `index` | Nabokov's *Pale Fire* index (1962); Ballard, "The Index" (1977) |
| `rollage` | Jiří Kolář, rollage (1962–) |
| `inscription` | Finlay, Little Sparta (1966–); the Roman lapidary hand (113 CE) |
| `calligramme` | Apollinaire, "Lettre-Océan" (1914); "Il Pleut" (1916) |

A **crossbreed mode** (10% chance, or `?hybrid=1`) applies one engine's
composition logic with another's material vocabulary — Herbert wings
filled with asemic script, a spacetime scaffold annotated in typestract
characters. The colophon credits both parents.

### The amendment: optional AI oracles

The constitution — zero dependencies, no build, offline, one seed one
poem — holds by default. But there is one opt-in amendment with three
tasks. Supply an Anthropic API key in the browser console,

```js
localStorage.setItem('typestract-anthropic-key', 'sk-ant-...')
```

— or, entirely locally and for free, point it at Ollama:

```js
localStorage.setItem('typestract-ai', 'ollama')  // or visit ?ai=ollama once
localStorage.setItem('typestract-ollama-model', 'qwen3:30b-a3b')  // optional override
```

**Parsing** (either provider): pasted sentences are parsed by the
model into the same clause shape the rule-based parser produces,
cached locally so diagrams stay stable, upgraded in place when the
parse arrives. The `grammar` footnote always discloses who did the
grammar: *diagrammed by hand* (corpus parses authored at build time),
*parsed by rule* (the offline parser), or *parsed by claude, taken on
trust* / *parsed by a local model, taken on trust*.

**Silhouettes and profiles** (Ollama only): the model is asked to
draw the pasted poem's own nouns — for `transmission`, as geometry
(rectangles, discs, lines) rasterized onto the same 24×16 ink grid
the hand tapes use; for `technopaegnia`, as a twenty-number width
profile poured by the same machinery as Herbert's wings. Both are
gated (contrast, one connected body, no verbatim echo of the prompt's
examples), cached, and disclosed on the sheet and in the colophon as
*silhouette by a local model*; the hand-authored subjects and the
classical shapes stand in otherwise. Measured against qwen3: small
models (4b) cannot draw and their answers are rejected wholesale —
the drawing tasks want the default `qwen3:30b-a3b` or better.

To try it end to end: start Ollama with your page's origin allowed
(`OLLAMA_ORIGINS`), serve the site, and open

```text
http://localhost:8000/?ai=ollama#engine=transmission&source=user
```

— the `?ai=ollama` goes **before** the `#`, and only needs to be
visited once. Paste a sentence with concrete nouns into the drawer
and click elsewhere (it fires on blur). The sheet renders immediately
with a fallback subject; the oracle is asked in the background, and
when a drawing passes the gate the same seed re-renders with the
poem's own noun in the header. On a busy server a drawing takes one
to two minutes; requests give up at 120 s and try again on the next
edit. Cached words are never asked twice.

**The operator's log.** While a provider is set, every request
reports its life — *asked*, *received*, *declined* (the gate said no,
and why), *failed* (timed out, server busy?) — to the browser console
and to a small italic line under the paste drawer, so a long wait is
legible rather than mysterious. And the same machinery is on the
bench for the command line:

```sh
node tools/oracle.mjs kettle ladder            # silhouettes
node tools/oracle.mjs --task=profile bottle    # width profiles
node tools/oracle.mjs --task=both --model=qwen3:30b-a3b harbor
```

drives the very prompts, request bodies and validation gates the site
uses, prints the drawing and the gate's verdict, and reads the
server's state first — a loaded model whose keep-alive expiry has
already passed has a request in flight, meaning another job holds the
slot and everything will queue behind it.

In every case the render never waits on the network, no model ever
writes a colophon's lineage or dates, and with no key and no provider
there is no network — ever. Corpus text never leaves the page. The nine
engines added in July 2026 — `intextus` through `calligramme` — never
consult the oracles at all: their poems are composed entirely offline,
whatever provider is set.

## Text sources

1. **Corpus** — two-hundred-odd public-domain fragments, tagged by mood and
   length: Sappho (Wharton's renderings, 1885), Dickinson, Herbert,
   Whitman, Hopkins, Stein's *Tender Buttons* (1914), the pre-Socratics
   (Burnet, 1892), Mallarmé and Apollinaire in French, and single
   resonant words good for permutation.
2. **Your own words** — the paste drawer re-renders your sentence through
   whatever engine is active: the Malna move.
3. **Procedural** — legible operations a 1960s concretist could have done
   with scissors: permutation cycles, erasure (ghosts at 8% opacity),
   stutter, recombination at phrase boundaries. Never Markov-babble.

A private supplement is welcome: create `src/text/corpus.local.js`
(gitignored) exporting a `CORPUS` array in the same fragment shape, and
it merges into every mode at load. The site probes for this file on
every boot, so a **404 for `corpus.local.js` in the console is normal**
when you have none — Safari also logs a SyntaxError for the same probe;
both lines are harmless and expected.

## Craft rules

- All randomness flows from one seed (xmur3 → mulberry32). Same seed +
  engine + source ⇒ identical SVG, every time. The seed is editable and
  lives in the URL hash.
- Modular scale (ratio 1.333) per sheet; a baseline grid all text snaps
  to except where an engine deliberately breaks it; letterspaced true
  small caps (capitals full-size, lowercase as 78% capitals, +8–14%
  tracking); real apostrophes and em dashes; hanging punctuation on
  justified blocks.
- Text is measured before it is placed (offscreen canvas), so lines fit
  contours and grids by measurement, not hope.
- Palette: warm (`#F6F1E5`) or cool (`#FCFBF7`) paper, near-black ink
  (`#161412`), and at most one accent from a Granary-cover set —
  vermillion, process blue, mimeo violet, ochre — present in ~35% of
  renders and always sparingly.

## SVG export

The poem is a real inline `<svg>`; export serializes a clone with
`xmlns` attributes, an explicit `viewBox`, physical dimensions in mm, a
`<title>` (the generated poem title) and a `<desc>` carrying the full
colophon. Only `<text>`/`<tspan>`/`<textPath>` are used — never
`foreignObject` — so files open cleanly in Illustrator and Inkscape.
**Type is not outlined**: exported text remains live, editable text, so
substitute fonts freely. Asemic strokes and diagram scaffolds are real
filled/stroked paths with correct linecaps and joins, fit for plotters
and laser cutters.

`decollage` tears its strata with standard `<clipPath>` elements, which
Illustrator and Inkscape import as ordinary clipping masks; the text
inside stays live.

`dirtyConcrete` uses SVG filters, which renderers disagree about, so it
offers two flavors: **as-is** (filters preserved; fine in browsers) and
**flattened** (filtered layers rasterized at 2× into an embedded image;
all language kept as live vector on top). PNG export at 2× and 4× is
available for quick sharing.

## Repository

```text
index.html                 the shell: sheet, control rail, colophon bar
src/main.js                boot, seed handling, keyboard, export wiring
src/prng.js                seeded PRNG (xmur3 + mulberry32)
src/svg.js                 SVG builders, paths, arrowheads, ink strokes
src/typography.js          modular scale, baseline grid, measurement
src/palette.js             papers, ink, accents
src/colophon.js            lineage captions per engine
src/export.js              SVG serialization, PNG, flattened export
src/text/corpus.js         the public-domain fragment corpus
src/text/procedures.js     permutation, erasure, stutter, recombination
src/engines/               the twenty-five engines + registry
src/text/parses.js         corpus sentences diagrammed by hand
src/text/parser.js         the rule-based parser for pasted text
src/text/subjects.js       ten hand-authored 24×16 picture tapes + the grid sampler
src/text/aiParser.js       the amendment: parse/silhouette/profile oracles and their gates
tools/smoke.mjs            headless determinism/hygiene checks (node tools/smoke.mjs)
tools/oracle.mjs           the operator's bench: query the Ollama oracles from the CLI
```

MIT licensed. Set in the reader's own Baskerville, Futura, and Courier.
