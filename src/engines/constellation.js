/*
 * constellation — after Eugen Gomringer's konstellationen ("silencio",
 * 1953) and the Noigandres group's verbivocovisual isomorphism; at
 * sentence scale, after Brion Gysin's permutation poems (composed from
 * 1959; run through Ian Sommerville's Honeywell and broadcast as The
 * Permutated Poems of Brion Gysin, BBC, 1960) and Gertrude Stein's
 * insistence ("Sacred Emily," 1913: rose is a rose is a rose).
 *
 * Words — or a whole sentence — permuted across an invisible grid;
 * the meaning is enacted spatially. Rules a careful reader can derive.
 * Word modes:
 *   absence — the word tiles the sheet, one cell conspicuously empty
 *   exchange — two words trade letters progressively down the rows
 *   fade — letters fall away along the diagonal until one remains
 *   mirror — word and reflection alternate in a checkerboard
 * Sentence modes:
 *   cycle — every rotation of the word order, stacked
 *   changes — one adjacent pair swaps per row, the swap position
 *             advancing like bell-ringing
 *   insistence — the sentence repeats; one word doubles, the point of
 *                insistence moving through it
 *   dissolve — one word vanishes per row; the survivors hold their
 *              exact positions until a single word is left
 *
 * Geometric sans, lowercase, ink only, enormous white space.
 */

import { g, textEl } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { permutationCycle } from '../text/procedures.js';

const MODES = ['absence', 'exchange', 'fade', 'mirror'];
const SENTENCE_MODES = ['cycle', 'changes', 'insistence', 'dissolve'];
const SENTENCE_CAPTIONS = {
  cycle: 'after Brion Gysin’s permutation poems (1959–60)',
  changes: 'after Gysin & Sommerville, The Permutated Poems (BBC, 1960)',
  insistence: 'after Gertrude Stein, “Sacred Emily” (1913)',
  dissolve: 'after Eugen Gomringer’s konstellationen (1953), dissolving',
};

export default {
  id: 'constellation',
  name: 'constellation',
  lineage: 'Gomringer, “silencio” (1953); Gysin’s permutations (1959–60)',
  paletteOpts: { accent: 'never' },

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const sans = FONTS.sans;
    const ink = sheet.palette.ink;
    let mode = rng.pick([...MODES, ...SENTENCE_MODES]);

    /* ---- sentence scale: the Gysin move ---- */
    if (SENTENCE_MODES.includes(mode)) {
      const frag = source.fragment(rng, { minWords: 4, maxWords: 9 });
      const words = frag.text.toLowerCase()
        .replace(/[^\p{L}\p{N}'’\- ]/gu, ' ')
        .split(/\s+/).filter(Boolean).slice(0, 9);
      if (words.length >= 3) {
        return sentencePoem(rng, sheet, mode, words, frag.attribution);
      }
      mode = 'absence'; // too little language to permute
    }

    const w1 = source.word(rng);
    const word = w1.text.toLowerCase();
    let attribution = w1.attribution;

    const nodes = [];
    const put = (str, x, y, size, opacity = 1) => {
      if (!str) return;
      nodes.push(textEl(str, {
        x, y, size, family: sans, anchor: 'middle', fill: sheet.palette.ink,
        tracking: size * 0.02, opacity,
      }));
    };

    // Shared grid geometry: the block occupies just over half the sheet,
    // leaving the silence around it to do its work.
    const layoutGrid = (cols, rows, sample) => {
      const unit = measure(sample, { size: 100, family: sans }) / 100;
      const spacing = 1.35 + rng.range(0, 0.45) * (0.5 + entropy);
      const gridW = box.w * (0.52 + rng.range(0, 0.26));
      let size = gridW / (Math.max(cols, 1) * Math.max(unit, 0.5) * spacing);
      size = Math.max(13, Math.min(size, sheet.scale(4)));
      const cellW = unit * size * spacing;
      const rowH = Math.max(2, Math.ceil((size * 1.7) / baseline)) * baseline;
      const x0 = sheet.width / 2 - ((cols - 1) * cellW) / 2;
      const gridH = (rows - 1) * rowH;
      const y0 = sheet.snap(box.y + (box.h - gridH) / 2);
      return { size, cellW, rowH, x0, y0 };
    };

    let title = word;

    if (mode === 'absence') {
      const cols = rng.int(3, 5);
      const rows = rng.int(5, 8);
      const { size, cellW, rowH, x0, y0 } = layoutGrid(cols, rows, word);
      // Gomringer put the hole dead centre; entropy lets it wander.
      const hole = rng.chance(entropy * 0.8)
        ? [rng.int(0, cols - 1), rng.int(1, rows - 2)]
        : [Math.floor(cols / 2), Math.floor(rows / 2)];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (c === hole[0] && r === hole[1]) continue;
          put(word, x0 + c * cellW, y0 + r * rowH, size);
        }
      }
      title = word;
    }

    if (mode === 'exchange') {
      const w2 = source.word(rng);
      let other = w2.text.toLowerCase();
      if (other === word) other = other.split('').reverse().join('');
      if (w2.attribution !== attribution) attribution += ' · ' + w2.attribution;
      const steps = Math.max(word.length, other.length) + 1;
      const rows = Math.min(steps, 9);
      const two = sheet.width > 700 && rng.chance(0.7);
      const cols = two ? 2 : 1;
      const sample = word.length >= other.length ? word : other;
      const { size, cellW, rowH, x0, y0 } = layoutGrid(cols, rows, sample);
      const morph = (a, b, i) => {
        const chars = a.split('');
        for (let k = 0; k < Math.min(i, a.length, b.length); k++) chars[k] = b[k];
        return chars.join('');
      };
      for (let r = 0; r < rows; r++) {
        const i = Math.round((r / (rows - 1)) * Math.max(word.length, other.length));
        put(morph(word, other, i), x0, y0 + r * rowH, size);
        if (two) put(morph(other, word, i), x0 + cellW, y0 + r * rowH, size);
      }
      title = `${word} / ${other}`;
    }

    if (mode === 'fade') {
      const cols = rng.int(4, 6);
      const rows = rng.int(6, 9);
      const { size, cellW, rowH, x0, y0 } = layoutGrid(cols, rows, word);
      const corner = rng.pick([[1, 1], [0, 1], [1, 0]]); // which corner survives longest
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = corner[0] ? c / (cols - 1) : 1 - c / (cols - 1);
          const py = corner[1] ? r / (rows - 1) : 1 - r / (rows - 1);
          const p = (px + py) / 2; // 0 = intact corner, 1 = vanished corner
          const keep = Math.max(0, Math.round(word.length * (1 - Math.pow(p, 0.8) * 1.15)));
          if (keep === 0) continue;
          put(word.slice(0, keep), x0 + c * cellW, y0 + r * rowH, size);
        }
      }
      title = `${word}, failing`;
    }

    if (mode === 'mirror') {
      const drow = word.split('').reverse().join('');
      const cols = rng.int(2, 4);
      const rows = rng.int(5, 9);
      const { size, cellW, rowH, x0, y0 } = layoutGrid(cols, rows, word);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          put((r + c) % 2 === 0 ? word : drow, x0 + c * cellW, y0 + r * rowH, size);
        }
      }
      title = `${word} / ${drow}`;
    }

    return { nodes: [g({}, ...nodes)], title, attribution };
  },
};

/* ------------------------------------------------------------------ *
 * Sentence-scale permutation. Left-aligned so the reader can watch the
 * words move; the block floats in the same silence as the word grids.
 * ------------------------------------------------------------------ */

function sentencePoem(rng, sheet, mode, words, attribution) {
  const { box, baseline } = sheet;
  const sans = FONTS.sans;
  const ink = sheet.palette.ink;
  const nodes = [];
  const n = words.length;
  const gridW = box.w * (0.55 + rng.range(0, 0.22));
  const fit = (longest100) =>
    Math.max(13, Math.min((gridW / Math.max(longest100, 1)) * 100, sheet.scale(3)));

  const putLines = (lines) => {
    const longest100 = lines.reduce(
      (m, ln) => Math.max(m, measure(ln, { size: 100, family: sans, tracking: 2 })), 0);
    const size = fit(longest100);
    const rowH = Math.max(2, Math.ceil((size * 1.7) / baseline)) * baseline;
    const x0 = sheet.width / 2 - (longest100 * size) / 100 / 2;
    const y0 = sheet.snap(box.y + (box.h - (lines.length - 1) * rowH) / 2);
    lines.forEach((ln, i) => {
      nodes.push(textEl(ln, {
        x: x0, y: y0 + i * rowH, size, family: sans, fill: ink, tracking: size * 0.02,
      }));
    });
  };

  let title = words.slice(0, 3).join(' ');

  if (mode === 'cycle') {
    putLines(permutationCycle(words));
    title += ', turning';
  }

  if (mode === 'changes') {
    const lines = [];
    const arr = words.slice();
    lines.push(arr.join(' '));
    let p = 0;
    const rows = Math.min(n * 2, 11);
    for (let r = 1; r < rows; r++) {
      [arr[p], arr[p + 1]] = [arr[p + 1], arr[p]];
      lines.push(arr.join(' '));
      p = (p + 1) % (n - 1);
    }
    putLines(lines);
    title += ', changes';
  }

  if (mode === 'insistence') {
    const lines = [];
    const rows = rng.int(5, 9);
    for (let r = 0; r < rows; r++) {
      const copy = words.slice();
      copy.splice(r % n, 0, words[r % n]);
      lines.push(copy.join(' '));
    }
    putLines(lines);
    title += ', again';
  }

  if (mode === 'dissolve') {
    /* fixed word positions; one word vanishes per row */
    const space100 = Math.max(measure(' ', { size: 100, family: sans }), 22);
    const starts = [];
    let cursor = 0;
    for (const w of words) {
      starts.push(cursor);
      cursor += measure(w, { size: 100, family: sans }) + space100;
    }
    const total100 = cursor - space100;
    const size = fit(total100);
    const rowH = Math.max(2, Math.ceil((size * 1.7) / baseline)) * baseline;
    const x0 = sheet.width / 2 - (total100 * size) / 100 / 2;
    const y0 = sheet.snap(box.y + (box.h - (n - 1) * rowH) / 2);
    const vanish = rng.shuffle([...Array(n).keys()]).slice(0, n - 1);
    for (let r = 0; r < n; r++) {
      const gone = new Set(vanish.slice(0, r));
      for (let i = 0; i < n; i++) {
        if (gone.has(i)) continue;
        nodes.push(textEl(words[i], {
          x: x0 + (starts[i] * size) / 100, y: y0 + r * rowH,
          size, family: sans, fill: ink,
        }));
      }
    }
    title += ', dissolving';
  }

  return {
    nodes: [g({}, ...nodes)],
    title,
    attribution,
    caption: SENTENCE_CAPTIONS[mode],
  };
}
