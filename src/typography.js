/*
 * typography.js — the discipline layer: modular scale, baseline grid,
 * letterspacing, measurement. Engines may break the grid, but only on
 * purpose; everything else snaps.
 */

/*
 * Type pairings — curated serif/sans/mono triples, all system stacks
 * with generic fallbacks (no webfonts; exports stay live, editable
 * text wherever they open). One pairing is active per render: chosen
 * by the seed, or pinned from the rail.
 */
export const TYPE_PAIRINGS = [
  {
    id: 'baskerville',
    name: 'Baskerville & Futura',
    serif: "'Baskerville', 'Georgia', serif",
    sans: "'Futura', 'Century Gothic', 'Avant Garde', 'Avenir Next', sans-serif",
    mono: "'Courier New', 'Courier', monospace",
  },
  {
    id: 'garamond',
    name: 'Garamond & Gill Sans',
    serif: "'Garamond', 'EB Garamond', 'Hoefler Text', 'Georgia', serif",
    sans: "'Gill Sans', 'Gill Sans MT', 'Lato', 'Trebuchet MS', sans-serif",
    mono: "'Courier New', 'Courier', monospace",
  },
  {
    id: 'didot',
    name: 'Didot & Helvetica',
    serif: "'Didot', 'Bodoni MT', 'Bodoni 72', 'Georgia', serif",
    sans: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    mono: "'Menlo', 'Consolas', 'Courier New', monospace",
  },
  {
    id: 'palatino',
    name: 'Palatino & Optima',
    serif: "'Palatino', 'Palatino Linotype', 'Book Antiqua', serif",
    sans: "'Optima', 'Candara', 'Segoe UI', sans-serif",
    mono: "'Courier New', 'Courier', monospace",
  },
  {
    id: 'hoefler',
    name: 'Hoefler & Avenir',
    serif: "'Hoefler Text', 'Iowan Old Style', 'Times New Roman', serif",
    sans: "'Avenir Next', 'Avenir', 'Helvetica Neue', sans-serif",
    mono: "'Menlo', 'Consolas', 'Courier New', monospace",
  },
  {
    id: 'typewriter',
    name: 'American Typewriter & Courier',
    serif: "'American Typewriter', 'Prestige Elite Std', 'Courier New', serif",
    sans: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
    mono: "'Courier New', 'Courier', monospace",
  },
];

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
