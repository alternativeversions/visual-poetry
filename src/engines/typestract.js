/*
 * typestract — after Dom Sylvester Houédard's typestracts (1963–) and
 * Henri Chopin's dactylopoèmes: the typewriter as printing press,
 * machine-made and hand-guided at once.
 *
 * Figures on white. One to three geometric figures — lozenge, column,
 * annulus, wave band, diagonal bar — are typed on a strict monospace
 * grid, each from two or three of the poem's own letters chosen by ink
 * density and driven through a field function inside the figure's mask.
 * White space is the material, inside the figure as much as around it.
 * Two ribbons: black and red. The platen slips a row now and then.
 * Overstrike is a rare event; the rotated second pass rarer. Only at the
 * top of the entropy slider does the sheet fill edge to edge — the
 * Chopin sheet, the field read over every cell.
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

const FIELD_KINDS = ['waves', 'shear', 'concentric', 'interference'];
const FIGURE_KINDS = ['lozenge', 'column', 'annulus', 'band', 'bar'];

/* ------------------------------------------------------------------ *
 * Figures: masks on the normalized grid. `vk` = box.h / box.w corrects
 * distances so a circle is round on the sheet. Every figure keeps its
 * centre (cu, cv) mutable so the placement pass can shift it without
 * draws; bbox() reports its extent in normalized units.
 * ------------------------------------------------------------------ */

function makeFigure(rng, kind, sorted, entropy, vk, ext) {
  const f = {
    kind,
    cu: rng.range(0.2, 0.8),
    cv: rng.range(0.15, 0.85),
    field: makeField(rng, rng.pick(FIELD_KINDS)),
    gamma: rng.range(0.8, 1.6),
    ribbon: 'black',
    overstrikes: false,
  };
  /* two or three of the poem's letters: light, middle, dark */
  const n = sorted.length;
  if (n <= 1) f.glyphs = [sorted[0] || 'x'];
  else {
    const light = sorted[rng.int(0, Math.max(0, Math.floor(n * 0.35) - 1))];
    const dark = sorted[rng.int(Math.min(n - 1, Math.floor(n * 0.7)), n - 1)];
    if (n >= 3 && rng.chance(0.6)) {
      const mid = sorted[rng.int(Math.floor(n * 0.35), Math.max(Math.floor(n * 0.35), Math.floor(n * 0.7) - 1))];
      f.glyphs = [light, mid, dark];
    } else f.glyphs = [light, dark];
  }
  switch (kind) {
    case 'lozenge': {
      const a = ext / 2;
      const b = a * rng.range(0.9, 1.6);
      f.mask = (u, v) => Math.abs(u - f.cu) / a + Math.abs((v - f.cv) * vk) / b <= 1;
      f.bbox = () => ({ u0: f.cu - a, u1: f.cu + a, v0: f.cv - b / vk, v1: f.cv + b / vk });
      break;
    }
    case 'column': {
      const a = Math.max(0.06, ext * rng.range(0.25, 0.45)) / 2;
      const h = rng.range(0.5, 0.85) / 2;
      f.mask = (u, v) => Math.abs(u - f.cu) <= a && Math.abs(v - f.cv) <= h;
      f.bbox = () => ({ u0: f.cu - a, u1: f.cu + a, v0: f.cv - h, v1: f.cv + h });
      break;
    }
    case 'annulus': {
      const r1 = ext / 2;
      const r0 = r1 * rng.range(0.45, 0.7);
      f.mask = (u, v) => {
        const d = Math.hypot(u - f.cu, (v - f.cv) * vk);
        return d >= r0 && d <= r1;
      };
      f.bbox = () => ({ u0: f.cu - r1, u1: f.cu + r1, v0: f.cv - r1 / vk, v1: f.cv + r1 / vk });
      break;
    }
    case 'band': {
      const freq = rng.range(1, 2.5);
      const phi = rng.range(0, Math.PI * 2);
      const h = ext * 0.3; // amplitude, in u units
      const a = ext * rng.range(0.06, 0.12); // half-thickness, in u units
      const w = rng.range(0.5, 1) / 2; // half-width across the sheet
      f.mask = (u, v) => Math.abs(u - f.cu) <= w
        && Math.abs((v - f.cv) * vk - Math.sin((u - f.cu + w) * Math.PI * freq + phi) * h) <= a;
      f.bbox = () => ({ u0: f.cu - w, u1: f.cu + w, v0: f.cv - (h + a) / vk, v1: f.cv + (h + a) / vk });
      break;
    }
    case 'bar':
    default: {
      const theta = (rng.chance(0.5) ? 1 : -1) * (Math.PI / 4 + rng.range(-0.25, 0.25));
      const a = Math.max(0.03, ext * rng.range(0.1, 0.22)) / 2;
      const len = ext * rng.range(0.6, 1.1);
      const cos = Math.cos(theta);
      const sin = Math.sin(theta);
      f.mask = (u, v) => {
        const du = u - f.cu;
        const dv = (v - f.cv) * vk;
        const along = du * cos + dv * sin;
        const across = -du * sin + dv * cos;
        return Math.abs(across) <= a && Math.abs(along) <= len;
      };
      const eu = Math.abs(cos) * len + Math.abs(sin) * a;
      const ev = (Math.abs(sin) * len + Math.abs(cos) * a) / vk;
      f.bbox = () => ({ u0: f.cu - eu, u1: f.cu + eu, v0: f.cv - ev, v1: f.cv + ev });
      break;
    }
  }
  return f;
}

/* Keep a figure inside the margins; shift its centre, no draws. */
function clampInto(f, mu, mv) {
  const b = f.bbox();
  if (b.u0 < mu) f.cu += mu - b.u0;
  else if (b.u1 > 1 - mu) f.cu -= b.u1 - (1 - mu);
  const c = f.bbox();
  if (c.v0 < mv) f.cv += mv - c.v0;
  else if (c.v1 > 1 - mv) f.cv -= c.v1 - (1 - mv);
}

/* Push figures apart until their boxes overlap by at most a quarter of
 * the smaller; pure geometry, no draws. */
function separate(figures, mu, mv) {
  const area = (b) => Math.max(0, b.u1 - b.u0) * Math.max(0, b.v1 - b.v0);
  for (let iter = 0; iter < 24; iter++) {
    let moved = false;
    for (let i = 0; i < figures.length; i++) {
      for (let j = 0; j < i; j++) {
        const A = figures[i].bbox();
        const B = figures[j].bbox();
        const ou = Math.min(A.u1, B.u1) - Math.max(A.u0, B.u0);
        const ov = Math.min(A.v1, B.v1) - Math.max(A.v0, B.v0);
        if (ou <= 0 || ov <= 0) continue;
        if (ou * ov <= 0.25 * Math.min(area(A), area(B))) continue;
        let du = figures[i].cu - figures[j].cu;
        let dv = figures[i].cv - figures[j].cv;
        const d = Math.hypot(du, dv) || 1;
        if (d < 1e-6) { du = 1; dv = 0; }
        figures[i].cu += (du / d) * 0.03;
        figures[i].cv += (dv / d) * 0.03;
        figures[j].cu -= (du / d) * 0.03;
        figures[j].cv -= (dv / d) * 0.03;
        moved = true;
      }
    }
    for (const f of figures) clampInto(f, mu, mv);
    if (!moved) break;
  }
}

/* The cell at (u, v): the last figure whose mask holds it wins. */
function cellOf(figures, u, v, sparse) {
  for (let i = figures.length - 1; i >= 0; i--) {
    const f = figures[i];
    if (!f.mask(u, v)) continue;
    let val = Math.pow(f.field(u, v), f.gamma);
    if (sparse) val = Math.pow(val, 2.6);
    /* the silhouette holds: only the faintest tenth of the field is left
     * blank inside a figure; the rest chooses among its glyphs */
    const n = f.glyphs.length;
    const ch = val < 0.1 ? ' ' : f.glyphs[Math.min(n - 1, Math.floor(((val - 0.1) / 0.9) * n))];
    return { ch, red: f.ribbon === 'red', strike: f.overstrikes && ch !== ' ' && val > 0.96 };
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * The Chopin sheet: the field read over every cell, edge to edge — the
 * engine's first-edition behaviour, kept for the top of the slider.
 * ------------------------------------------------------------------ */
function chopinSheet(rng, sheet, frag, ramp, grid) {
  const { box, entropy } = sheet;
  const { cols, rows, size, cellW, cellH, x0, y0, mono, ink, red } = grid;
  const fieldKind = rng.pick(FIELD_KINDS);
  const field = makeField(rng, fieldKind);
  const redField = makeField(rng, rng.pick(FIELD_KINDS));
  const redMode = rng.pick(['field', 'band', 'rows']);
  const redThreshold = 0.72 - entropy * 0.12;
  const gamma = rng.range(0.8, 1.6);
  const redEvery = rng.int(5, 9);
  const bandSlope = rng.range(0.4, 1.6);
  const isRed = (u, v, row) => {
    if (redMode === 'rows') return row % redEvery === 0;
    if (redMode === 'band') {
      const band = (u + v * bandSlope) % 1;
      return band > 0.62 && band < 0.86;
    }
    return redField(u, v) > redThreshold;
  };
  const rowText = (row, y, xOffset, pass) => {
    let black = '';
    let redS = '';
    let over = '';
    let anyB = false, anyR = false, anyO = false;
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1);
      const v = row / (rows - 1);
      let val = Math.pow(field(u, v), gamma);
      if (pass === 'rotated') val = Math.pow(val, 2.6);
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
    const out = [];
    if (anyB) out.push(typed(black, ink, x0 + xOffset, y, size, mono));
    if (anyR) out.push(typed(redS, red, x0 + xOffset, y, size, mono));
    if (anyO) out.push(typed(over, pass === 'rotated' ? red : ink, x0 + xOffset + 0.5, y + 0.5, size, mono));
    return out;
  };
  const nodes = [];
  for (let row = 0; row < rows; row++) {
    const slip = rng.chance(0.06 + entropy * 0.06) ? rng.range(-0.45, 0.45) * cellW : 0;
    nodes.push(...rowText(row, y0 + row * cellH, slip, 'main'));
  }
  const groups = [g({ 'data-grid': `${cols}x${rows}` }, ...nodes)];
  if (rng.chance(0.2 + entropy * 0.2)) {
    const rot = [];
    const rRows = Math.floor(rows * 0.42);
    const ry0 = (sheet.height - rRows * cellH) / 2 + size;
    for (let row = 0; row < rRows; row++) rot.push(...rowText(row, ry0 + row * cellH, 0, 'rotated'));
    groups.push(g({ transform: `rotate(90 ${sheet.width / 2} ${sheet.height / 2})`, opacity: 0.85 }, ...rot));
  }
  void box;
  return { groups, title: `${fieldKind} field: ${frag.text.split(/\s+/).slice(0, 3).join(' ').toLowerCase()}` };
}

/* One typed row: a <text> with preserved spaces — both dialects, since
 * Chrome ignores xml:space and Illustrator ignores white-space:pre. */
function typed(str, fill, x, y, size, mono) {
  const t = el('text', {
    x: r2(x), y: r2(y), 'font-family': mono, 'font-size': r2(size), fill,
    'xml:space': 'preserve', style: 'white-space:pre',
  });
  t.appendChild(document.createTextNode(str));
  return t;
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

    // the poem's own letters, ordered by ink density
    const letters = [...new Set(frag.text.replace(/\s+/g, '').split(''))];
    const sorted = letters.sort((a, b) => densityOf(a) - densityOf(b));
    const ramp = [' '].concat(sorted);

    // the grid
    const cols = rng.int(44, 62);
    const size = (box.w / cols) / 0.6; // Courier advance is exactly 0.6 em
    const cellW = measure('M', { size, family: mono });
    const cellH = size * 1.04;
    const rows = Math.floor(box.h / cellH);
    const x0 = box.x;
    const y0 = box.y + size;
    const grid = { cols, rows, size, cellW, cellH, x0, y0, mono, ink, red };

    /* the Chopin sheet, at the very top of the slider */
    const chopin = entropy >= 0.85 && rng.chance(((entropy - 0.85) / 0.15) * 0.8);
    if (chopin) {
      const c = chopinSheet(rng, sheet, frag, ramp, grid);
      return { nodes: c.groups, title: c.title, attribution: frag.attribution };
    }

    /* the figures */
    const count = entropy < 0.35 ? 1 : entropy < 0.7 ? 2 : rng.int(2, 3);
    const vk = box.h / box.w;
    const mu = 3 / cols;
    const mv = 3 / rows;
    const kinds = FIGURE_KINDS.slice();
    const figures = [];
    for (let i = 0; i < count; i++) {
      const kind = kinds.splice(rng.int(0, kinds.length - 1), 1)[0];
      const ext = count === 1 ? rng.range(0.45, 0.7) : rng.range(0.25, 0.5);
      const f = makeFigure(rng, kind, sorted, entropy, vk, ext);
      f.ribbon = rng.chance(0.3) ? 'red' : 'black';
      f.overstrikes = rng.chance(0.15 + entropy * 0.5);
      figures.push(f);
    }
    /* red on at most one figure; below 0.7, overstrike on at most one */
    let seenRed = false;
    let seenOver = false;
    for (const f of figures) {
      if (f.ribbon === 'red') { if (seenRed) f.ribbon = 'black'; seenRed = true; }
      if (f.overstrikes && entropy < 0.7) { if (seenOver) f.overstrikes = false; seenOver = true; }
    }
    for (const f of figures) clampInto(f, mu, mv);
    if (figures.length > 1) separate(figures, mu, mv);

    const rowText = (row, y, xOffset, sparse) => {
      let black = '';
      let redS = '';
      let over = '';
      let anyB = false, anyR = false, anyO = false;
      const v = row / (rows - 1);
      for (let c = 0; c < cols; c++) {
        const cell = cellOf(figures, c / (cols - 1), v, sparse);
        const ch = cell ? cell.ch : ' ';
        const redHere = cell ? cell.red : false;
        black += redHere ? ' ' : ch;
        redS += redHere ? ch : ' ';
        const strike = cell ? cell.strike : false;
        over += strike ? ch : ' ';
        anyB = anyB || (!redHere && ch !== ' ');
        anyR = anyR || (redHere && ch !== ' ');
        anyO = anyO || strike;
      }
      const out = [];
      if (anyB) out.push(typed(black, ink, x0 + xOffset, y, size, mono));
      if (anyR) out.push(typed(redS, red, x0 + xOffset, y, size, mono));
      if (anyO) out.push(typed(over, sparse ? red : ink, x0 + xOffset + 0.5, y + 0.5, size, mono));
      return out;
    };

    const nodes = [];
    for (let row = 0; row < rows; row++) {
      // platen slippage: an occasional row rides off its stop
      const slip = rng.chance(0.06 + entropy * 0.06) ? rng.range(-0.45, 0.45) * cellW : 0;
      nodes.push(...rowText(row, y0 + row * cellH, slip, false));
    }
    const groups = [g({ 'data-grid': `${cols}x${rows}` }, ...nodes)];

    /* the rotated second pass, rare and only near the top: the figures
     * again, sparse, at 90° through the platen — only the rows that stay
     * inside the sheet once turned */
    if (entropy > 0.7 && rng.chance((entropy - 0.7) * 1.5)) {
      const rot = [];
      const half = sheet.width / 2 - size;
      for (let row = 0; row < rows; row++) {
        const y = y0 + row * cellH;
        if (Math.abs(y - sheet.height / 2) > half) continue;
        rot.push(...rowText(row, y, 0, true));
      }
      groups.push(g({ transform: `rotate(90 ${sheet.width / 2} ${sheet.height / 2})`, opacity: 0.85 }, ...rot));
    }

    return {
      nodes: groups,
      title: `${figures.map((f) => f.kind).join(' + ')}: ${frag.text.split(/\s+/).slice(0, 3).join(' ').toLowerCase()}`,
      attribution: frag.attribution,
    };
  },
};
