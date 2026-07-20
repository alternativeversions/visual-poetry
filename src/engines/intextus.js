/*
 * intextus — after Optatian Porfyry's carmina cancellata (4th c. CE)
 * and Hrabanus Maurus, De laudibus sanctae crucis (c. 810).
 *
 * The oldest grid poem: letters marshalled into rank and file, and a
 * second poem — the versus intextus — threading through them along a
 * figure, picked out in color. The tinted letters, read in the order
 * the figure is drawn, really do spell the buried phrase; the foot of
 * the sheet quotes it so the reader can check. At high entropy the
 * field reverses, Hrabanus's way: the figure's cells flood with ink
 * and carry paper-colored letters. License breaks: accent always
 * (the intext needs its color); ink as field, not line.
 */

import { el, g, textEl, r2 } from '../svg.js';
import { FONTS } from '../typography.js';

/* Figure walks: ordered [col,row] cell lists on a cols×rows grid. */
const FIGURES = {
  cross(c, r) {
    const cells = [];
    const mc = Math.floor(c / 2);
    for (let y = 0; y < r; y++) cells.push([mc, y]);
    const my = Math.floor(r / 2.6); // crossing above center, as on a crucifix
    for (let x = 0; x < c; x++) if (x !== mc) cells.push([x, my]);
    return cells;
  },
  saltire(c, r) {
    const cells = [];
    const n = Math.min(c, r);
    for (let i = 0; i < n; i++) cells.push([Math.round((i / (n - 1)) * (c - 1)), Math.round((i / (n - 1)) * (r - 1))]);
    for (let i = 0; i < n; i++) {
      const cell = [Math.round((i / (n - 1)) * (c - 1)), Math.round(((n - 1 - i) / (n - 1)) * (r - 1))];
      if (!cells.some((q) => q[0] === cell[0] && q[1] === cell[1])) cells.push(cell);
    }
    return cells;
  },
  lozenge(c, r) {
    const cells = [];
    const mc = (c - 1) / 2;
    const mr = (r - 1) / 2;
    const steps = 2 * (Math.min(c, r) - 1);
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const cell = [Math.round(mc + Math.cos(t) * mc * 0.86), Math.round(mr + Math.sin(t) * mr * 0.86)];
      if (!cells.some((q) => q[0] === cell[0] && q[1] === cell[1])) cells.push(cell);
    }
    return cells;
  },
  ring(c, r) {
    const cells = [];
    const mc = (c - 1) / 2;
    const mr = (r - 1) / 2;
    const rad = Math.min(mc, mr) * 0.82;
    const steps = Math.round(rad * 8);
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2 - Math.PI / 2;
      const cell = [Math.round(mc + Math.cos(t) * rad), Math.round(mr + Math.sin(t) * rad * 1.1)];
      if (!cells.some((q) => q[0] === cell[0] && q[1] === cell[1])) cells.push(cell);
    }
    return cells;
  },
};

const lettersOnly = (s) => s.toUpperCase().replace(/[^\p{L}]/gu, '');

export default {
  id: 'intextus',
  name: 'intextus',
  lineage: 'Optatian’s carmina cancellata (4th c.); Hrabanus Maurus (c. 810)',
  paletteOpts: { accent: 'force' },
  acceptsMaterial: ['typestract'],

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const accent = palette.accent || ink;
    const mono = sheet.material === 'typestract';
    const family = mono ? FONTS.mono : FONTS.serif;
    const frag = source.fragment(rng, { minWords: 8, maxWords: 30 });

    /* the intext: 2–5 consecutive words, 6–26 letters */
    const words = frag.text.split(/\s+/).filter(Boolean);
    let intext = words[0] || 'LVX';
    for (let tries = 0; tries < 12; tries++) {
      const at = rng.int(0, Math.max(0, words.length - 2));
      const take = rng.int(2, Math.min(5, words.length - at));
      const cand = words.slice(at, at + take).join(' ');
      const n = lettersOnly(cand).length;
      if (n >= 6 && n <= 26) { intext = cand; break; }
    }
    if (!lettersOnly(intext)) intext = 'LVX';
    const intextLetters = lettersOnly(intext);

    /* the grid */
    const cols = rng.int(21, 27);
    const cell = box.w / cols;
    const rows = Math.max(12, Math.min(38, Math.floor((box.h - 40) / cell)));
    const size = cell * 0.62;
    const figureName = rng.pick(Object.keys(FIGURES));
    const figCells = FIGURES[figureName](cols, rows);
    const figKey = new Map(figCells.map((q, i) => [q[0] + ':' + q[1], i]));

    const stream = lettersOnly(frag.text) || 'SILENTIVM';
    const reversed = entropy > 0.66;
    const nodes = [];
    let k = 0; // stream cursor (skips figure cells, keeps reading order)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = box.x + (x + 0.5) * cell;
        const cy = box.y + (y + 0.72) * cell;
        const fi = figKey.get(x + ':' + y);
        if (fi !== undefined) {
          const ch = intextLetters[fi % intextLetters.length];
          if (reversed) {
            nodes.push(el('rect', {
              x: r2(box.x + x * cell), y: r2(box.y + y * cell),
              width: r2(cell), height: r2(cell), fill: ink,
            }));
            nodes.push(textEl(ch, { x: cx, y: cy, size, family, fill: palette.paper, anchor: 'middle' }));
          } else {
            nodes.push(textEl(ch, { x: cx, y: cy, size, family, fill: accent, anchor: 'middle', weight: 'bold' }));
          }
        } else {
          nodes.push(textEl(stream[k % stream.length], { x: cx, y: cy, size, family, fill: ink, anchor: 'middle' }));
          k++;
        }
      }
    }

    /* the foot: quote the buried verse so the reader can verify */
    nodes.push(textEl(`intextus: ${intext.toLowerCase()}`, {
      x: box.x + box.w / 2, y: box.y + rows * cell + 26,
      size: 12, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
    }));

    return {
      nodes: [g({}, ...nodes)],
      title: intext.toLowerCase(),
      attribution: frag.attribution,
      caption: figureName === 'cross' || figureName === 'saltire'
        ? 'after Hrabanus Maurus, De laudibus sanctae crucis (c. 810)'
        : 'after Optatian’s carmina cancellata (4th c.)',
    };
  },
};
