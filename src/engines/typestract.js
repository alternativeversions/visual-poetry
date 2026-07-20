/*
 * typestract — after Dom Sylvester Houédard's typestracts (1963–) and
 * Henri Chopin's dactylopoèmes: the typewriter as printing press,
 * machine-made and hand-guided at once.
 *
 * A strict monospace character grid. The poem's own letters become
 * pixels, ordered by ink density and driven through a field function —
 * waves, diagonal shear, concentric rings, interference. Two ribbons:
 * black and red. Overstrike doubles a glyph at half-pixel offset;
 * the platen slips a row now and then; sometimes a second pass goes
 * through the machine rotated 90°.
 */

import { g, el, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { ACCENTS } from '../palette.js';

/* Approximate ink coverage of a typed glyph, for the density ramp. */
const DENSITY = {
  ' ': 0, '.': 0.08, "'": 0.08, ',': 0.1, '-': 0.12, ':': 0.14, ';': 0.16,
  i: 0.24, l: 0.22, j: 0.28, t: 0.3, r: 0.32, f: 0.34, c: 0.36, v: 0.38,
  s: 0.4, u: 0.43, x: 0.43, z: 0.44, y: 0.45, n: 0.46, o: 0.47, a: 0.49,
  e: 0.49, h: 0.51, k: 0.51, d: 0.53, b: 0.53, p: 0.53, q: 0.53, g: 0.56,
  w: 0.62, m: 0.66,
};
const densityOf = (ch) => {
  const lower = ch.toLowerCase();
  const base = DENSITY[lower] !== undefined ? DENSITY[lower] : 0.4;
  return ch !== lower ? Math.min(1, base + 0.18) : base;
};

/* Field functions on normalized u,v in [0,1] -> value in [0,1]. */
function makeField(rng, kind) {
  const phase = rng.range(0, Math.PI * 2);
  const phase2 = rng.range(0, Math.PI * 2);
  const fx = rng.range(2, 6);
  const fy = rng.range(2, 6);
  const cx = rng.range(0.3, 0.7);
  const cy = rng.range(0.3, 0.7);
  const cx2 = rng.range(0.2, 0.8);
  const cy2 = rng.range(0.2, 0.8);
  switch (kind) {
    case 'waves':
      return (u, v) =>
        (Math.sin(u * Math.PI * fx + phase) * Math.sin(v * Math.PI * fy + phase2) + 1) / 2;
    case 'shear': {
      const k = rng.range(0.5, 2.2) * (rng.chance(0.5) ? 1 : -1);
      return (u, v) => {
        const t = (u + v * k + phase / 6) * fx * 0.7;
        return t - Math.floor(t); // sawtooth drift
      };
    }
    case 'concentric':
      return (u, v) => {
        const d = Math.hypot((u - cx) * 1.2, v - cy);
        return (Math.cos(d * Math.PI * 2 * fx + phase) + 1) / 2;
      };
    case 'interference':
    default:
      return (u, v) => {
        const d1 = Math.hypot(u - cx, v - cy);
        const d2 = Math.hypot(u - cx2, v - cy2);
        return (Math.cos(d1 * Math.PI * 2 * fx + phase) + Math.cos(d2 * Math.PI * 2 * fy + phase2) + 2) / 4;
      };
  }
}

export default {
  id: 'typestract',
  name: 'typestract',
  lineage: 'Houédard’s typestracts (1963–); Chopin’s dactylopoèmes',
  paletteOpts: { accent: 'never' }, // the red ribbon is our accent, always vermillion
  providesMaterial: true,

  generate(rng, source, sheet) {
    const { box, entropy } = sheet;
    const mono = FONTS.mono;
    const ink = sheet.palette.ink;
    const red = ACCENTS[0].hex; // vermillion: the second ribbon

    const frag = source.fragment(rng, { minWords: 3, maxWords: 12 });

    // density ramp from the poem's own letters (space = no strike)
    const letters = [...new Set(frag.text.replace(/\s+/g, '').split(''))];
    const ramp = [' '].concat(letters.sort((a, b) => densityOf(a) - densityOf(b)));

    // the grid
    const cols = rng.int(44, 62);
    const size = (box.w / cols) / 0.6; // Courier advance is exactly 0.6 em
    const cellW = measure('M', { size, family: mono });
    const cellH = size * 1.04;
    const rows = Math.floor(box.h / cellH);
    const x0 = box.x;
    const y0 = box.y + size;

    const fieldKind = rng.pick(['waves', 'shear', 'concentric', 'interference']);
    const field = makeField(rng, fieldKind);
    const redField = makeField(rng, rng.pick(['waves', 'shear', 'concentric', 'interference']));
    const redMode = rng.pick(['field', 'band', 'rows']);
    const redThreshold = 0.72 - entropy * 0.12;
    const gamma = rng.range(0.8, 1.6); // contrast of the strike

    const isRed = (u, v, row) => {
      if (redMode === 'rows') return row % rng._redEvery === 0;
      if (redMode === 'band') {
        const band = (u + v * rng._bandSlope) % 1;
        return band > 0.62 && band < 0.86;
      }
      return redField(u, v) > redThreshold;
    };
    rng._redEvery = rng.int(5, 9);
    rng._bandSlope = rng.range(0.4, 1.6);

    const rowText = (row, y, xOffset, pass) => {
      // one <text> per row per ribbon: black, red, overstrike
      let black = '';
      let redS = '';
      let over = '';
      let anyB = false, anyR = false, anyO = false;
      for (let c = 0; c < cols; c++) {
        const u = c / (cols - 1);
        const v = row / (rows - 1);
        let val = Math.pow(field(u, v), gamma);
        if (pass === 'rotated') val = Math.pow(val, 2.6); // the second pass is sparse
        const idx = Math.min(ramp.length - 1, Math.floor(val * ramp.length));
        const ch = ramp[idx];
        const redHere = isRed(u, v, row);
        black += redHere ? ' ' : ch;
        redS += redHere ? ch : ' ';
        const strike = val > 0.82 && ch !== ' ';
        over += strike ? ch : ' ';
        anyB = anyB || (!redHere && ch !== ' ');
        anyR = anyR || (redHere && ch !== ' ');
        anyO = anyO || strike;
      }
      const mk = (str, fill, dx, dy) => {
        const t = el('text', {
          x: r2(x0 + xOffset + dx), y: r2(y + dy),
          'font-family': mono, 'font-size': r2(size),
          fill, 'xml:space': 'preserve',
        });
        t.appendChild(document.createTextNode(str));
        return t;
      };
      const out = [];
      if (anyB) out.push(mk(black, ink, 0, 0));
      if (anyR) out.push(mk(redS, red, 0, 0));
      if (anyO) out.push(mk(over, pass === 'rotated' ? red : ink, 0.5, 0.5));
      return out;
    };

    const nodes = [];
    for (let row = 0; row < rows; row++) {
      // platen slippage: an occasional row rides off its stop
      const slip = rng.chance(0.06 + entropy * 0.06) ? rng.range(-0.45, 0.45) * cellW : 0;
      nodes.push(...rowText(row, y0 + row * cellH, slip, 'main'));
    }

    const groups = [g({}, ...nodes)];

    // rotated second pass, at 90° through the platen
    if (rng.chance(0.2 + entropy * 0.2)) {
      const rot = [];
      const rRows = Math.floor(rows * 0.42);
      // centre the second pass so the rotation keeps it inside the sheet
      const ry0 = (sheet.height - rRows * cellH) / 2 + size;
      for (let row = 0; row < rRows; row++) {
        rot.push(...rowText(row, ry0 + row * cellH, 0, 'rotated'));
      }
      groups.push(g({
        transform: `rotate(90 ${sheet.width / 2} ${sheet.height / 2})`,
        opacity: 0.85,
      }, ...rot));
    }

    return {
      nodes: groups,
      title: `${fieldKind} field: ${frag.text.split(/\s+/).slice(0, 3).join(' ').toLowerCase()}`,
      attribution: frag.attribution,
    };
  },
};
