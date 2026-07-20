/*
 * palette.js — paper, ink, and one accent, in the manner of a small-press
 * cover: Granary Books restraint. Most sheets carry no accent at all.
 */

export const PAPERS = [
  { name: 'warm', hex: '#F6F1E5' },
  { name: 'cool', hex: '#FCFBF7' },
];

export const INK = '#161412';

export const ACCENTS = [
  { name: 'vermillion', hex: '#D93A21' },
  { name: 'process blue', hex: '#2B4C9B' },
  { name: 'mimeo violet', hex: '#6E4B8E' },
  { name: 'ochre', hex: '#C8951F' },
];

/**
 * Choose a palette for one render. Accent appears with ~35% probability
 * unless the engine forbids it (constellation is ink-only) or demands a
 * particular ribbon (typestract's red).
 *
 * opts.paperMode: 'auto' | 'warm' | 'cool'
 * opts.accent:    'auto' | 'never' | 'force' | a specific accent name
 */
export function choosePalette(rng, opts = {}) {
  const paperMode = opts.paperMode || 'auto';
  const paper =
    paperMode === 'auto'
      ? rng.pick(PAPERS)
      : PAPERS.find((p) => p.name === paperMode) || PAPERS[0];

  let accent = null;
  const mode = opts.accent || 'auto';
  if (mode === 'force') {
    accent = rng.pick(ACCENTS);
  } else if (mode === 'auto') {
    accent = rng.chance(0.35) ? rng.pick(ACCENTS) : null;
  } else if (mode !== 'never') {
    accent = ACCENTS.find((a) => a.name === mode) || null;
  }

  return {
    paper: paper.hex,
    paperName: paper.name,
    ink: INK,
    accent: accent ? accent.hex : null,
    accentName: accent ? accent.name : null,
  };
}
