/*
 * openings.js — the curated openings: a dozen sheets chosen by eye. A
 * cold visit (no hash) opens on one of them; every roll after that is
 * chance, and the hash records whatever is showing. Each line says why.
 */

export const OPENINGS = [
  { engine: 'grammar', seed: '5b15bb49' },                  // three sentences diagrammed by hand
  { engine: 'tendre', seed: 'deadbeef' },                   // a country of settlements and a long sea
  { engine: 'calligramme', seed: '7b9d0e2f' },              // Stein's rain in five lanes
  { engine: 'lineprinter', seed: 'b3e76784' },              // A House of Dust, pass 04
  { engine: 'typestract', seed: 'deadbeef', e: 0.2 },       // a dsh lozenge in t, n and e
  { engine: 'revisedPhilosophy', seed: '8f3a21c9', e: 0.9 }, // Thalas and the pupil, a Glas page
  { engine: 'intextus', seed: '4e5d55c3' },                 // "told me you", threaded through the grid
  { engine: 'diagram', seed: '1a96220e' },                  // Freud's egg, annotated
  { engine: 'mesostic', seed: '8f3a21c9', e: 0.9 },         // MARGIN read through Dickinson and Sappho
  { engine: 'technopaegnia', seed: 'deadbeef', e: 0.2 },    // the altar, one elegiac voice
  { engine: 'gloss', seed: '8f3a21c9' },                    // the Brain is wider than the Sky, glossed
  { engine: 'dirtyConcrete', seed: 'fcb37a07' },            // Apollinaire's cœur against NONONO
];
