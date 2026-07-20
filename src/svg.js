/*
 * svg.js — SVG node builders and path utilities.
 *
 * Everything is real SVG: <text>/<tspan> with explicit coordinates,
 * <textPath> on real paths, filled outlines for brush strokes. Never
 * <foreignObject> — exports must open as editable text in Illustrator
 * and Inkscape and as cuttable paths on a plotter.
 */

export const NS = 'http://www.w3.org/2000/svg';
export const XLINK = 'http://www.w3.org/1999/xlink';

import { measure, smallCapsSpec, FONTS } from './typography.js';

/* Deterministic per-render id counter — reset before each generate() so the
 * same seed yields byte-identical markup. */
let idCounter = 0;
export function resetIds() {
  idCounter = 0;
}
export function uid(prefix = 'ts') {
  return `${prefix}-${idCounter++}`;
}

/** Create an element with attributes and children. */
export function el(name, attrs = {}, ...children) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    node.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/** Group. */
export function g(attrs = {}, ...children) {
  return el('g', attrs, ...children);
}

/** Round to 2 decimals — keeps files small and diffs stable. */
export function r2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * A <text> element. attrs: x, y, size, family, fill, style (italic),
 * weight, anchor, tracking (px letter-spacing), opacity, transform...
 */
export function textEl(str, a = {}) {
  const attrs = {
    x: a.x !== undefined ? r2(a.x) : null,
    y: a.y !== undefined ? r2(a.y) : null,
    'font-family': a.family || FONTS.serif,
    'font-size': r2(a.size || 15),
    fill: a.fill || 'currentColor',
    'font-style': a.style && a.style !== 'normal' ? a.style : null,
    'font-weight': a.weight && a.weight !== 'normal' ? a.weight : null,
    'text-anchor': a.anchor && a.anchor !== 'start' ? a.anchor : null,
    'letter-spacing': a.tracking ? r2(a.tracking) : null,
    opacity: a.opacity !== undefined && a.opacity !== 1 ? a.opacity : null,
    transform: a.transform || null,
    'text-decoration': a.decoration || null,
    /* both space-preservation dialects: xml:space is SVG 1.1 and what
     * Illustrator/Inkscape honor on import; white-space:pre is SVG 2,
     * and the one browsers still obey for runs of interior spaces */
    'xml:space': a.preserveSpace ? 'preserve' : null,
    style: a.preserveSpace ? 'white-space:pre' : null,
  };
  return el('text', attrs, str);
}

/**
 * Letterspaced small caps as tspans: capitals full size, lowercase as
 * 78% capitals. anchor: 'start' | 'middle' | 'end' (handled by measuring).
 */
export function smallCapsText(str, a = {}) {
  const spec = smallCapsSpec(str, a.size || 15, a.trackingEm !== undefined ? a.trackingEm : 0.1);
  let total = 0;
  const widths = spec.spans.map((s) => {
    const w = measure(s.ch, { size: s.size, family: a.family || FONTS.serif, weight: a.weight || 'normal' });
    total += w + spec.tracking;
    return w;
  });
  total -= spec.tracking;
  let x = a.x || 0;
  if (a.anchor === 'middle') x -= total / 2;
  if (a.anchor === 'end') x -= total;
  const text = el('text', {
    y: r2(a.y || 0),
    'font-family': a.family || FONTS.serif,
    fill: a.fill || 'currentColor',
    'font-weight': a.weight && a.weight !== 'normal' ? a.weight : null,
    opacity: a.opacity !== undefined && a.opacity !== 1 ? a.opacity : null,
    transform: a.transform || null,
  });
  spec.spans.forEach((s, i) => {
    text.appendChild(
      el('tspan', { x: r2(x), 'font-size': r2(s.size) }, s.ch)
    );
    x += widths[i] + spec.tracking;
  });
  text._width = total;
  return text;
}

/** Width a smallCapsText would occupy (for layout before creation). */
export function smallCapsMeasure(str, a = {}) {
  const spec = smallCapsSpec(str, a.size || 15, a.trackingEm !== undefined ? a.trackingEm : 0.1);
  let total = 0;
  for (const s of spec.spans) {
    total += measure(s.ch, { size: s.size, family: a.family || FONTS.serif, weight: a.weight || 'normal' }) + spec.tracking;
  }
  return total - spec.tracking;
}

/* ------------------------------------------------------------------ *
 * Paths and rules.
 * ------------------------------------------------------------------ */

export function line(x1, y1, x2, y2, a = {}) {
  return el('line', {
    x1: r2(x1), y1: r2(y1), x2: r2(x2), y2: r2(y2),
    stroke: a.stroke || 'currentColor',
    'stroke-width': a.width !== undefined ? a.width : 0.7,
    'stroke-linecap': a.linecap || 'butt',
    'stroke-dasharray': a.dash || null,
    opacity: a.opacity !== undefined && a.opacity !== 1 ? a.opacity : null,
  });
}

export function path(d, a = {}) {
  return el('path', {
    d,
    fill: a.fill !== undefined ? a.fill : 'none',
    stroke: a.stroke || null,
    'stroke-width': a.stroke ? (a.width !== undefined ? a.width : 0.7) : null,
    'stroke-linecap': a.stroke ? (a.linecap || 'round') : null,
    'stroke-linejoin': a.stroke ? (a.linejoin || 'round') : null,
    'stroke-dasharray': a.dash || null,
    opacity: a.opacity !== undefined && a.opacity !== 1 ? a.opacity : null,
    transform: a.transform || null,
    id: a.id || null,
  });
}

/** Polyline points -> path data. */
export function polyPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${r2(p[0])} ${r2(p[1])}`).join(' ');
}

/** Smooth cubic chain through points (Catmull-Rom -> Bézier). */
export function smoothPath(pts, tension = 1) {
  if (pts.length < 2) return '';
  let d = `M${r2(pts[0][0])} ${r2(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C${r2(c1x)} ${r2(c1y)} ${r2(c2x)} ${r2(c2y)} ${r2(p2[0])} ${r2(p2[1])}`;
  }
  return d;
}

/**
 * Arrowhead as an explicit filled path (not a marker — markers get
 * mangled or expanded unpredictably outside browsers). Points along
 * `angle` radians with tip at (x, y).
 */
export function arrowHead(x, y, angle, size = 7, fill = 'currentColor') {
  const a1 = angle + Math.PI * 0.87;
  const a2 = angle - Math.PI * 0.87;
  const d = [
    `M${r2(x)} ${r2(y)}`,
    `L${r2(x + Math.cos(a1) * size)} ${r2(y + Math.sin(a1) * size)}`,
    `L${r2(x + Math.cos(a2) * size)} ${r2(y + Math.sin(a2) * size)}`,
    'Z',
  ].join(' ');
  return path(d, { fill });
}

/** Tick mark perpendicular to `angle` at (x, y). */
export function tick(x, y, angle, len = 5, a = {}) {
  const px = Math.cos(angle + Math.PI / 2);
  const py = Math.sin(angle + Math.PI / 2);
  return line(x - px * len / 2, y - py * len / 2, x + px * len / 2, y + py * len / 2, a);
}

/**
 * Text on a path. Registers the path in `defs`, returns the <text> node.
 * Writes both href and xlink:href for editor compatibility.
 */
export function textOnPath(str, pathD, defs, a = {}) {
  const id = uid('tp');
  defs.appendChild(path(pathD, { id, fill: 'none' }));
  const tp = el('textPath', {
    startOffset: a.startOffset !== undefined ? a.startOffset : '0%',
  }, str);
  tp.setAttribute('href', `#${id}`);
  tp.setAttributeNS(XLINK, 'xlink:href', `#${id}`);
  const text = el('text', {
    'font-family': a.family || FONTS.serif,
    'font-size': r2(a.size || 13),
    fill: a.fill || 'currentColor',
    'font-style': a.style && a.style !== 'normal' ? a.style : null,
    'letter-spacing': a.tracking ? r2(a.tracking) : null,
    opacity: a.opacity !== undefined && a.opacity !== 1 ? a.opacity : null,
  });
  text.appendChild(tp);
  return text;
}

/**
 * A calligraphic stroke as a closed filled outline: `pts` is the spine,
 * `widths` the brush width at each point. Real filled geometry, so
 * plotters and cutters can use it and no renderer disagrees about
 * variable stroke-width.
 */
export function inkStroke(pts, widths, fill = 'currentColor') {
  if (pts.length < 2) return null;
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next[0] - prev[0];
    const dy = next[1] - prev[1];
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const w = (widths[i] !== undefined ? widths[i] : widths[widths.length - 1]) / 2;
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  const outline = left.concat(right.reverse());
  let d = smoothPath(outline, 0.8) + ' Z';
  return path(d, { fill });
}
