/*
 * colophon.js — every render knows its own lineage and says so.
 *
 * The colophon line names at least one real poet, work, or tradition
 * with a correct date, e.g.:
 *   № 0047 · constellation · after Eugen Gomringer, "silencio" (1953)
 *   · seed 8f3a21c9 · text: E. Dickinson, Fr 372
 */

import { seedInt, makeRng } from './prng.js';

/** Lineage captions per engine; one is chosen per render, seeded. */
export const CAPTIONS = {
  constellation: [
    'after Eugen Gomringer, “silencio” (1953)',
    'after Eugen Gomringer’s konstellationen (1953)',
    'after Décio Pignatari, “beba coca cola” (1957)',
    'after the Noigandres group, São Paulo (1952–)',
    'after Augusto de Campos, Poetamenos (1953)',
  ],
  technopaegnia: [
    'after Simias of Rhodes, “The Axe” (c. 300 BCE)',
    'after George Herbert, “Easter Wings” (1633)',
    'after George Herbert, “The Altar” (1633)',
    'after the Greek technopaegnia (4th c. BCE)',
    'after the altar-poem tradition, via The Temple (1633)',
  ],
  coupDeDes: [
    'after Stéphane Mallarmé, Un coup de dés (1897)',
    'after Mallarmé’s “prismatic subdivisions of the Idea” (1897)',
    'after Un coup de dés jamais n’abolira le hasard (1897)',
  ],
  typestract: [
    'after Dom Sylvester Houédard’s typestracts (1963–)',
    'after Henri Chopin’s dactylopoèmes (1950s–)',
    'after dsh, typestract, Olivetti Lettera 22 (1960s)',
    'after the typewriter poem, via Houédard & Chopin',
  ],
  dirtyConcrete: [
    'after Bob Cobbing’s duplicator prints (1960s–)',
    'after the Core symposium on visual poetry (1993)',
    'after dirty concrete, via Cobbing & Writers Forum (1963–)',
    'after Visible Language 27.4 (1993)',
  ],
  diagram: [
    'after Eugenia Leigh, “Oh I Thought You Knew…” (a Penrose diagram)',
    'after the diagrammatic lyric, via Eugenia Leigh',
    'after the Reed–Kellogg sentence diagram (1877), repurposed',
    'after the spacetime diagram annotated *TIME [lung], via Eugenia Leigh',
    'after Lacan’s Schema L (1955), relabeled',
    'after Freud’s egg of the psychical apparatus (1923)',
    'after the botanical plate, via Erasmus Darwin’s Loves of the Plants (1789)',
  ],
  workshops: [
    'after Afrizal Malna, “There’s No Meaning: A Repeating Poem” (trans. Daniel Owen)',
    'after Afrizal Malna’s workshops for one repeating text (trans. Owen)',
    'after the repeating poem, via Afrizal Malna',
  ],
  revisedPhilosophy: [
    'after Daniel Grandbois, A Revised Poetry of Western Philosophy (2016)',
    'after Grandbois’s revised pre-Socratics (Pitt Poetry Series, 2016)',
    'after the classical book page, via Grandbois',
  ],
  asemic: [
    'after Ana Hatherly’s asemic calligraphy (1960s–)',
    'after Ana Hatherly, A reinvenção da leitura (1975)',
    'after Henri Michaux’s alphabets (1927), via Hatherly',
    'after the calligraphic wing of visual poetry, via Hatherly & Aguiar',
  ],
  babel: [
    'after John Furnival, The Fall of the Tower of Babel (1963)',
    'after Furnival’s tower drawings (1963–68), via Openings Press',
    'after the confusion of tongues, via John Furnival (1963)',
  ],
  unordnung: [
    'after Timm Ulrichs, “ordnung – unordnung” (1961)',
    'after Claus Bremer, “lesbares in unlesbares übersetzen” (1963)',
    'after the typewriter losing its temper, via Ulrichs (1961)',
  ],
  ruins: [
    'after Ronald Johnson, Radi os (1977)',
    'after the erasure poem, via Ronald Johnson’s Radi os (1977)',
    'after the treated page, via Tom Phillips’s A Humument (1966–)',
  ],
  decollage: [
    'after Hains & Villeglé, “Ach Alma Manetro” (1949)',
    'after Mimmo Rotella’s manifesti lacerati (1953–)',
    'after Wolf Vostell’s dé-coll/age (1954)',
    'after the affichistes, via Hains, Villeglé & Rotella',
  ],
  gloss: [
    'after the Talmud page of Daniel Bomberg (Venice, 1523)',
    'after Jacques Derrida, Glas (1974)',
    'after Edmond Jabès, The Book of Questions (1963–)',
    'after the glossed page, via Bomberg (1523)',
  ],
  grammar: [
    'after Reed & Kellogg, Higher Lessons in English (1877)',
    'after the schoolroom sentence diagram (1877), taken at its word',
    'after Gertrude Stein, “Poetry and Grammar” (1935)',
  ],
  transmission: [
    'after Knowlton & Harmon, Studies in Perception I (1966)',
    'after the radioteletype picture (1960s–), carrier lost',
    'after Flora Stacey’s typewriter butterfly (1898), by wire',
  ],
  calligramme: [
    'after Guillaume Apollinaire, “Il Pleut” (1916)',
    'after Apollinaire, “Lettre-Océan” (1914)',
    'after Apollinaire’s Calligrammes (1918)',
  ],
  rollage: [
    'after Jiří Kolář, rollage (1962–)',
    'after the sliced image, via Kolář (1962–)',
    'after Kolář’s chiasmage and rollage (1960s)',
  ],
  intextus: [
    'after Optatian’s carmina cancellata (4th c.)',
    'after Hrabanus Maurus, De laudibus sanctae crucis (c. 810)',
    'after the versus intexti, via Hrabanus (c. 810)',
    'after the letter-grid poem, via Optatian (4th c.)',
  ],
  mesostic: [
    'after John Cage, 62 Mesostics re Merce Cunningham (1971)',
    'after Cage’s writings through Finnegans Wake (1977–)',
    'after the 50% mesostic rule, via Cage',
    'after Jackson Mac Low’s diastics (1963–)',
  ],
  index: [
    'after the index to Nabokov’s Pale Fire (1962)',
    'after J. G. Ballard, “The Index” (1977)',
    'after back matter as narrative, via Nabokov & Ballard',
  ],
  inscription: [
    'after Ian Hamilton Finlay, Little Sparta (1966–)',
    'after Finlay’s garden inscriptions, via Wild Hawthorn Press (1961–)',
    'after the Roman lapidary hand (Trajan’s column, 113 CE)',
    'after THE PRESENT ORDER…, via Finlay & Saint-Just (1983)',
  ],
  lineprinter: [
    'after Alison Knowles & James Tenney, A House of Dust (1967)',
    'after Theo Lutz, Stochastische Texte (1959)',
    'after Nanni Balestrini, Tape Mark I (1961)',
    'after the line printer’s first poems (1959–67)',
  ],
  aria: [
    'after John Cage, Aria (1958)',
    'after Cornelius Cardew, Treatise (1963–67)',
    'after the graphic score, via Cage & Cardew',
    'after Cage’s Song Books (1970)',
  ],
  tendre: [
    'after Madeleine de Scudéry’s Carte de Tendre (1654)',
    'after the Carte de Tendre, engraved by Chauveau (1654)',
    'after Debord & Jorn, The Naked City (1957)',
    'after the dérive, via Debord (1956)',
  ],
};

/** Pick a caption deterministically for a render. */
export function captionFor(engineId, seed) {
  const list = CAPTIONS[engineId] || ['after the visual-poetry tradition'];
  const rng = makeRng(seed + ':caption:' + engineId);
  return rng.pick(list);
}

/** The render's deterministic edition number, derived from the seed. */
export function editionNumber(seed) {
  return String(seedInt(seed + ':no') % 10000).padStart(4, '0');
}

/**
 * Full colophon string.
 * meta: { engineId, engineName, seed, attribution, hybridWith, caption }
 * `caption` — an engine-supplied lineage line (e.g., the diagram engine
 * names the scaffold it actually drew) — wins over the seeded pick.
 */
export function buildColophon(meta) {
  const parts = [`№ ${editionNumber(meta.seed)}`];
  const own = meta.caption || captionFor(meta.engineId, meta.seed);
  if (meta.hybridWith) {
    parts.push(`${meta.engineName} × ${meta.hybridWith.name}`);
    parts.push(own);
    parts.push(captionFor(meta.hybridWith.id, meta.seed));
  } else {
    parts.push(meta.engineName);
    parts.push(own);
  }
  parts.push(`seed ${meta.seed}`);
  if (meta.attribution) parts.push(`text: ${meta.attribution}`);
  return parts.join(' · ');
}
