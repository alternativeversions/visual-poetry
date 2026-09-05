/*
 * typography.js — the discipline layer: modular scale, baseline grid,
 * letterspacing, measurement. Engines may break the grid, but only on
 * purpose; everything else snaps.
 */

import { makeRng } from './prng.js';

/*
 * Type pairings — curated serif/sans/mono triples. The faces travel
 * with the site: seventeen open-licensed families under fonts/, fetched
 * as latin + latin-ext woff2 by tools/fonts.mjs and served from the
 * repository itself, never from a CDN. Each stack still ends in the
 * system faces it stood in for, so a sheet degrades to Georgia rather
 * than to nothing. One pairing is active per render: chosen by the
 * seed from those that allow chance, or pinned from the rail.
 */
const COURIER = "'Courier Prime', 'Courier New', 'Courier', monospace";

export const TYPE_PAIRINGS = [
  {
    id: 'baskerville',
    name: 'Libre Baskerville & Jost',
    after: 'after Baskerville & Futura: the English transitional and the Bauhaus geometric',
    serif: "'Libre Baskerville', 'Baskerville', 'Georgia', serif",
    sans: "'Jost', 'Futura', 'Century Gothic', 'Avenir Next', sans-serif",
    mono: COURIER,
    families: ['Libre Baskerville', 'Jost', 'Courier Prime'],
  },
  {
    id: 'garamond',
    name: 'EB Garamond & Cabin',
    after: 'after Garamond & Gill Sans: the French old-style and the English humanist',
    serif: "'EB Garamond', 'Garamond', 'Hoefler Text', 'Georgia', serif",
    sans: "'Cabin', 'Gill Sans', 'Gill Sans MT', 'Trebuchet MS', sans-serif",
    mono: COURIER,
    families: ['EB Garamond', 'Cabin', 'Courier Prime'],
  },
  {
    id: 'bodoni',
    name: 'Bodoni Moda & Archivo',
    after: 'after Bodoni & Akzidenz-Grotesk: the Italian modern and the Swiss grotesque',
    serif: "'Bodoni Moda', 'Didot', 'Bodoni MT', 'Bodoni 72', 'Georgia', serif",
    sans: "'Archivo', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    mono: COURIER,
    families: ['Bodoni Moda', 'Archivo', 'Courier Prime'],
  },
  {
    id: 'alegreya',
    name: 'Alegreya & Alegreya Sans',
    after: 'after Palatino & Optima: the calligraphic humanists',
    serif: "'Alegreya', 'Palatino', 'Palatino Linotype', 'Book Antiqua', serif",
    sans: "'Alegreya Sans', 'Optima', 'Candara', 'Segoe UI', sans-serif",
    mono: COURIER,
    families: ['Alegreya', 'Alegreya Sans', 'Courier Prime'],
  },
  {
    id: 'crimson',
    name: 'Crimson Pro & Nunito Sans',
    after: 'after Hoefler Text & Avenir: the Renaissance text face and the rounded geometric',
    serif: "'Crimson Pro', 'Hoefler Text', 'Iowan Old Style', 'Times New Roman', serif",
    sans: "'Nunito Sans', 'Avenir Next', 'Avenir', 'Helvetica Neue', sans-serif",
    mono: COURIER,
    families: ['Crimson Pro', 'Nunito Sans', 'Courier Prime'],
  },
  {
    id: 'typewriter',
    name: 'Cutive & Archivo',
    after: 'after American Typewriter & Helvetica: the office and the grotesque',
    serif: "'Cutive', 'American Typewriter', 'Courier New', serif",
    sans: "'Archivo', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    mono: COURIER,
    families: ['Cutive', 'Archivo', 'Courier Prime'],
  },
  {
    id: 'plex',
    name: 'IBM Plex',
    after: 'the machine age: the IBM 7070, the Zuse Z22, the chain printer',
    serif: "'IBM Plex Serif', 'Georgia', serif",
    sans: "'IBM Plex Sans', 'Helvetica Neue', 'Arial', sans-serif",
    mono: "'IBM Plex Mono', 'Courier Prime', 'Courier New', monospace",
    families: ['IBM Plex Serif', 'IBM Plex Sans', 'IBM Plex Mono'],
  },
  {
    id: 'spectral',
    name: 'Spectral & Source Sans',
    after: 'the book page: a serif made for the screen, with a working italic',
    serif: "'Spectral', 'Georgia', serif",
    sans: "'Source Sans 3', 'Helvetica Neue', 'Arial', sans-serif",
    mono: COURIER,
    families: ['Spectral', 'Source Sans 3', 'Courier Prime'],
  },
  {
    id: 'mimeo',
    name: 'Courier Prime throughout',
    after: 'the typewriter poem: dsh, Cobbing, the duplicator — every face the typewriter’s',
    serif: COURIER,
    sans: COURIER,
    mono: COURIER,
    families: ['Courier Prime'],
    chance: false, // pinned only: a Talmud page in Courier is a joke the dice should not make
  },
];

/** The pairings the seed may choose from when the rail says chance. */
export const CHANCE_PAIRINGS = TYPE_PAIRINGS.filter((p) => p.chance !== false);

/** Older links name the system faces the pairings stood in for. */
export const LEGACY_PAIRING_IDS = { didot: 'bodoni', palatino: 'alegreya', hoefler: 'crimson' };

/** The pairing a render uses: pinned by id, or the seed's own choice. */
export function pairingFor(seed, typeId) {
  const id = LEGACY_PAIRING_IDS[typeId] || typeId;
  return TYPE_PAIRINGS.find((p) => p.id === id) || makeRng(seed + ':type').pick(CHANCE_PAIRINGS);
}

/*
 * The active faces. Engines read FONTS.* at generate time, so calling
 * setFonts() before an engine runs re-dresses the whole system; the
 * same seed with the same pairing still yields the same sheet.
 */
export const FONTS = {
  serif: TYPE_PAIRINGS[0].serif,
  sans: TYPE_PAIRINGS[0].sans,
  mono: TYPE_PAIRINGS[0].mono,
};

export function setFonts(pairing) {
  FONTS.serif = pairing.serif;
  FONTS.sans = pairing.sans;
  FONTS.mono = pairing.mono;
}

/* ------------------------------------------------------------------ *
 * Loading the faces.
 *
 * Text is measured on a canvas at generate time and the coordinates are
 * frozen into the SVG, so a pairing's families must be resident before
 * the engine runs — measured against a stand-in, a sheet is laid out to
 * the wrong metrics and reflows the moment the real face arrives.
 * ------------------------------------------------------------------ */

const PROBE = 'aœ'; // reaches both the latin and the latin-ext subset

const unquote = (s) => String(s).replace(/["']/g, '').trim();

/** True when every family of the pairing has a face resident. In the
 * node harness there are no faces to load, and the metric tables serve. */
export function facesLoaded(pairing) {
  if (typeof document === 'undefined' || !document.fonts) return true;
  const loaded = new Set();
  document.fonts.forEach((face) => { if (face.status === 'loaded') loaded.add(unquote(face.family)); });
  return pairing.families.every((family) => loaded.has(family));
}

/**
 * Ask the browser for the pairing's faces — regular, italic and bold of
 * each family — and resolve true once they are resident, false if they
 * are not by `timeoutMs` (a blocked request, a shelf that never
 * arrived): the render then proceeds in the fallback faces and the
 * colophon says so. Never rejects.
 */
export async function loadFonts(pairing, timeoutMs = 4000) {
  if (typeof document === 'undefined' || !document.fonts || !document.fonts.load) return true;
  const wanted = [];
  for (const family of pairing.families) {
    for (const face of ['normal 400', 'italic 400', 'normal 700']) wanted.push(`${face} 16px "${family}"`);
  }
  const loads = Promise.all(wanted.map((f) => document.fonts.load(f, PROBE).catch(() => [])));
  const late = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([loads, late]);
  return facesLoaded(pairing);
}

/** Modular scale: step(0) = base, step(n) = base * ratio^n. */
export function makeScale(base = 15, ratio = 1.333) {
  return (n) => base * Math.pow(ratio, n);
}

/* ------------------------------------------------------------------ *
 * Measurement.
 *
 * In the browser we measure on a shared canvas context — coordinates are
 * computed once at generation time and serialized into the SVG, so the
 * exported file is frozen regardless of the viewer's fonts. Outside the
 * DOM (the node test harness) we fall back to a metrics table.
 * ------------------------------------------------------------------ */

let ctx = null;
if (typeof document !== 'undefined') {
  ctx = document.createElement('canvas').getContext('2d');
  /* Measure as the sheet renders: kerning on, hinting off. A hinted face
   * rounds its advances to whole pixels at the size it is drawn, so the
   * same word measures differently at 10 px and at the 8.5 px a scaled
   * sheet shows it at; geometric precision makes advances linear in size
   * on both sides (main.js sets the same on the <svg>). */
  if (ctx) {
    if ('fontKerning' in ctx) ctx.fontKerning = 'normal';
    if ('textRendering' in ctx) ctx.textRendering = 'geometricPrecision';
  }
}

/* Average advance widths (em fractions) approximating Baskerville/Futura;
 * only used when no canvas exists. Courier is exactly 0.6 em. */
const SERIF_W = {
  default: 0.5, ' ': 0.25, i: 0.28, j: 0.28, l: 0.28, f: 0.31, t: 0.31,
  r: 0.35, s: 0.39, a: 0.44, c: 0.44, e: 0.44, z: 0.44, g: 0.5, k: 0.5,
  v: 0.5, x: 0.5, y: 0.5, b: 0.5, d: 0.5, h: 0.5, n: 0.5, o: 0.5, p: 0.5,
  q: 0.5, u: 0.5, m: 0.78, w: 0.72, '.': 0.25, ',': 0.25, "'": 0.18,
  '-': 0.33, '—': 1.0, ';': 0.25, ':': 0.25, '!': 0.33, '?': 0.44,
  I: 0.33, J: 0.39, f_upper: 0.55, M: 0.89, W: 0.94, m_upper: 0.89,
};
const UPPER_FACTOR = 1.4;

function tableMeasure(text, size, family) {
  if (/mono|courier/i.test(family)) return text.length * size * 0.6;
  let w = 0;
  for (const ch of text) {
    if (ch >= 'A' && ch <= 'Z') {
      const lower = SERIF_W[ch.toLowerCase()] || SERIF_W.default;
      w += Math.min(lower * UPPER_FACTOR, 0.95);
    } else {
      w += SERIF_W[ch] !== undefined ? SERIF_W[ch] : SERIF_W.default;
    }
  }
  return w * size;
}

/**
 * Width of `text` at `size` px in `family`, with optional per-glyph
 * tracking (px added between characters) and italic/bold styling.
 */
export function measure(text, { size, family = FONTS.serif, style = 'normal', weight = 'normal', tracking = 0 } = {}) {
  let w;
  if (ctx) {
    ctx.font = `${style} ${weight} ${size}px ${family}`;
    w = ctx.measureText(text).width;
  } else {
    w = tableMeasure(text, size, family);
  }
  if (tracking && text.length > 1) w += tracking * (text.length - 1);
  return w;
}

/** Advance width of one monospace cell at `size` px. */
export function monoAdvance(size) {
  return measure('M', { size, family: FONTS.mono });
}

/* ------------------------------------------------------------------ *
 * The sheet: viewport, margins, palette, baseline grid, scale.
 * ------------------------------------------------------------------ */

/**
 * Build the sheet object handed to every engine.
 * Default 900×1200 (3:4); coupDeDes overrides to a 1600×1000 spread.
 */
export function makeSheet({
  width = 900,
  height = 1200,
  marginRatio = 0.09,
  palette,
  baseline = 24,
  scaleBase = 15,
  scaleRatio = 1.333,
  entropy = 0.5,
  material = null,
} = {}) {
  const margin = Math.round(Math.min(width, height) * marginRatio);
  const sheet = {
    width,
    height,
    margin,
    palette,
    baseline,
    entropy,
    material, // set only in crossbreed mode: the material-vocabulary parent
    fonts: FONTS,
    scale: makeScale(scaleBase, scaleRatio),
    box: {
      x: margin,
      y: margin,
      w: width - margin * 2,
      h: height - margin * 2,
    },
  };
  /** Snap a y coordinate down onto the baseline grid (origin: top margin). */
  sheet.snap = (y) => margin + Math.round((y - margin) / baseline) * baseline;
  /** The nth baseline from the top margin. */
  sheet.line = (n) => margin + n * baseline;
  /** How many baselines fit in the content box. */
  sheet.lines = Math.floor(sheet.box.h / baseline);
  return sheet;
}

/**
 * Letterspaced small caps, the classical way: capitals at full size,
 * lowercase rendered as capitals at ~78% size, tracked +8% to +14%.
 * Returns a spec consumed by svg.smallCapsText.
 */
export function smallCapsSpec(text, size, trackingEm = 0.1) {
  const tracking = size * trackingEm;
  const spans = [];
  for (const ch of text) {
    const isLower = ch !== ch.toUpperCase();
    spans.push({
      ch: ch.toUpperCase(),
      size: isLower ? size * 0.78 : size,
    });
  }
  return { spans, tracking, size };
}

/** Measured width of a smallCapsSpec. */
export function smallCapsWidth(spec, family = FONTS.serif, weight = 'normal') {
  let w = 0;
  for (const s of spec.spans) {
    w += measure(s.ch, { size: s.size, family, weight }) + spec.tracking;
  }
  return Math.max(0, w - spec.tracking);
}

/**
 * Break `text` into lines no wider than `maxWidth` at `size`/`family`.
 * Returns array of strings. Never breaks inside a word unless the word
 * alone exceeds the measure (then hyphenates with a real hyphen).
 */
export function breakLines(text, maxWidth, opts) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = '';
  const width = (s) => measure(s, opts);
  for (let word of words) {
    while (width(word) > maxWidth && word.length > 4) {
      // hyphenate: find the largest head that fits
      let cut = word.length - 2;
      while (cut > 2 && width((cur ? cur + ' ' : '') + word.slice(0, cut) + '-') > maxWidth) cut--;
      if (cut <= 2) break;
      lines.push((cur ? cur + ' ' : '') + word.slice(0, cut) + '-');
      cur = '';
      word = word.slice(cut);
    }
    const trial = cur ? cur + ' ' + word : word;
    if (width(trial) <= maxWidth || !cur) {
      cur = trial;
    } else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
