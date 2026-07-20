/*
 * diagram — after Eugenia Leigh, "Oh I Thought You Knew, She Said, Dad
 * Is Alive" (a poem written onto a Penrose spacetime diagram, its axes
 * annotated *TIME [lung], **SPACE [star]), and after the whole habit of
 * scientific diagramming as a first-class poetics.
 *
 * A scaffold is drawn in fine rules with proper arrowheads and ticks —
 * Penrose conformal diagram, Minkowski axes with light cone, Reed–Kellogg
 * sentence diagram (1877), Feynman-style vertex diagram, astronomical
 * chart, or a commutative square. The poem's phrases are set AS the
 * labels: on axes with bracketed asides, along geodesics via textPath,
 * at vertices, and in asterisked footnotes at the sheet's floor. The
 * confessional interjections that don't fit the diagram's logic are set
 * in italic — the pathos lives in that mismatch.
 */

import { g, el, textEl, line, path, polyPath, smoothPath, arrowHead, tick, textOnPath, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { asemicLine } from './asemic.js';

const RULE = 0.7; // ≈ 0.5 pt at print scale

/* An axis label in the Leigh manner: **SPACE [star] */
function axisLabel({ x, y, stars, word, aside, size, ink, anchor = 'start', transform }) {
  const label = `${'*'.repeat(stars)}${word.toUpperCase()}`;
  const tracking = size * 0.12;
  const w1 = measure(label, { size, family: FONTS.serif, tracking });
  const w2 = aside ? measure(` [${aside}]`, { size: size * 0.92, family: FONTS.serif, style: 'italic' }) : 0;
  let x0 = x;
  if (anchor === 'middle') x0 = x - (w1 + w2) / 2;
  if (anchor === 'end') x0 = x - (w1 + w2);
  const t = el('text', {
    y: r2(y), 'font-family': FONTS.serif, fill: ink, transform: transform || null,
  });
  t.appendChild(el('tspan', { x: r2(x0), 'font-size': r2(size), 'letter-spacing': r2(tracking) }, label));
  if (aside) {
    t.appendChild(el('tspan', {
      'font-size': r2(size * 0.92), 'font-style': 'italic', dx: r2(size * 0.2),
    }, `[${aside}]`));
  }
  return t;
}

/* Asterisked footnotes at the sheet's floor. */
function footnotes(sheet, notes) {
  const out = [];
  const size = 12.5;
  let y = sheet.height - sheet.margin * 0.55 - (notes.length - 1) * sheet.baseline * 0.8;
  for (const n of notes) {
    out.push(textEl(`${n.stars} ${n.text}`, {
      x: sheet.box.x, y, size, family: FONTS.serif, style: 'italic',
      fill: sheet.palette.ink, opacity: 0.92,
    }));
    y += sheet.baseline * 0.8;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Scaffolds. Each takes (rng, sheet, texts, defs) and returns nodes.
 * texts: { main: {text, words, attribution}, phrases[], word1, word2,
 *          interjection }
 * ------------------------------------------------------------------ */

function penrose(rng, sheet, texts, defs) {
  const ink = sheet.palette.ink;
  const accent = sheet.palette.accent || ink;
  const nodes = [];
  const cx = sheet.width / 2;
  const cy = sheet.height * 0.44;
  const d = Math.min(sheet.box.w, sheet.box.h) * rng.range(0.42, 0.5);
  const T = [cx, cy - d], B = [cx, cy + d], L = [cx - d, cy], R = [cx + d, cy];

  // the conformal boundary
  nodes.push(path(polyPath([T, R, B, L]) + ' Z', { stroke: ink, width: RULE * 1.4 }));

  // timelike geodesics (constant r), curving from i⁻ to i⁺
  const nGeo = rng.int(3, 5);
  const geoPaths = [];
  for (let i = 0; i < nGeo; i++) {
    const a = ((i + 1) / (nGeo + 1)) * 2 - 1; // -1..1
    const bulge = a * rng.range(0.75, 0.95);
    const pts = [B, [cx + bulge * d * 0.62, cy + d * 0.42], [cx + bulge * d, cy], [cx + bulge * d * 0.62, cy - d * 0.42], T];
    const dPath = smoothPath(pts);
    geoPaths.push(dPath);
    nodes.push(path(dPath, { stroke: ink, width: RULE, opacity: 0.65 }));
  }
  // spacelike slices (constant t)
  for (let i = 0; i < 3; i++) {
    const a = ((i + 1) / 4) * 2 - 1;
    const bulge = a * rng.range(0.75, 0.95);
    const pts = [L, [cx - d * 0.42, cy + bulge * d * 0.62], [cx, cy + bulge * d], [cx + d * 0.42, cy + bulge * d * 0.62], R];
    nodes.push(path(smoothPath(pts), { stroke: ink, width: RULE, opacity: 0.4, dash: '1.5 3' }));
  }

  // infinities, in the physicist's hand
  const infSize = 14;
  nodes.push(textEl('i⁺', { x: T[0] + 8, y: T[1] - 8, size: infSize, family: FONTS.serif, style: 'italic', fill: ink }));
  nodes.push(textEl('i⁻', { x: B[0] + 8, y: B[1] + 18, size: infSize, family: FONTS.serif, style: 'italic', fill: ink }));
  nodes.push(textEl('i⁰', { x: R[0] + 8, y: R[1] + 4, size: infSize, family: FONTS.serif, style: 'italic', fill: ink }));
  nodes.push(textEl('ℐ⁺', { x: cx + d * 0.55 + 12, y: cy - d * 0.55, size: infSize, family: FONTS.serif, style: 'italic', fill: ink }));

  // the poem rides the geodesics
  const ride = rng.shuffle(geoPaths).slice(0, Math.min(2, texts.phrases.length));
  ride.forEach((p, i) => {
    nodes.push(textOnPath(texts.phrases[i], p, defs, {
      size: 14.5, family: FONTS.serif, fill: i === 0 ? accent : ink, startOffset: `${rng.int(6, 18)}%`,
    }));
  });

  // axes, annotated the Leigh way
  nodes.push(axisLabel({
    x: cx - d - 14, y: cy - 6, stars: 1, word: 'time', aside: texts.word1, size: 13, ink,
    anchor: 'start', transform: `rotate(-90 ${r2(cx - d - 14)} ${r2(cy)})`,
  }));
  nodes.push(axisLabel({
    x: cx, y: cy + d + 26, stars: 2, word: 'space', aside: texts.word2, size: 13, ink, anchor: 'middle',
  }));

  // the interjection that doesn't fit the physics
  nodes.push(textEl(texts.interjection, {
    x: cx + d * 0.18, y: cy + d * 0.78, size: 14, family: FONTS.serif, style: 'italic', fill: ink,
  }));

  return nodes;
}

function minkowski(rng, sheet, texts, defs) {
  const ink = sheet.palette.ink;
  const accent = sheet.palette.accent || ink;
  const nodes = [];
  const ox = sheet.width * 0.5;
  const oy = sheet.height * 0.58;
  const ax = Math.min(sheet.box.w, sheet.box.h) * 0.42;

  // axes with arrowheads and ticks
  nodes.push(line(ox - ax, oy, ox + ax, oy, { stroke: ink, width: RULE }));
  nodes.push(arrowHead(ox + ax, oy, 0, 7, ink));
  nodes.push(line(ox, oy + ax * 0.55, ox, oy - ax, { stroke: ink, width: RULE }));
  nodes.push(arrowHead(ox, oy - ax, -Math.PI / 2, 7, ink));
  const step = ax / 6;
  for (let i = 1; i <= 5; i++) {
    nodes.push(tick(ox + i * step, oy, 0, 6, { stroke: ink, width: RULE }));
    nodes.push(tick(ox - i * step, oy, 0, 6, { stroke: ink, width: RULE }));
    nodes.push(tick(ox, oy - i * step, Math.PI / 2, 6, { stroke: ink, width: RULE }));
  }

  // the light cone
  nodes.push(line(ox - ax * 0.85, oy + ax * 0.5 * 0.85, ox + ax * 0.85, oy - ax * 0.85 * 1, { stroke: ink, width: RULE, dash: '4 3', opacity: 0.75 }));
  nodes.push(line(ox + ax * 0.85, oy + ax * 0.5 * 0.85, ox - ax * 0.85, oy - ax * 0.85 * 1, { stroke: ink, width: RULE, dash: '4 3', opacity: 0.75 }));

  // hyperbolae of constant interval
  for (const k of [0.35, 0.6]) {
    const pts = [];
    for (let x = -0.8; x <= 0.801; x += 0.1) {
      pts.push([ox + x * ax, oy - Math.sqrt(x * x + k * k) * ax * 0.9]);
    }
    nodes.push(path(smoothPath(pts), { stroke: ink, width: RULE, opacity: 0.5 }));
  }

  // a worldline wanders upward, carrying the poem
  const wpts = [];
  let wx = ox - ax * rng.range(0.35, 0.6);
  for (let t = 0; t <= 1.001; t += 0.2) {
    wpts.push([wx, oy + ax * 0.4 - t * ax * 1.3]);
    wx += rng.range(-0.16, 0.3) * ax;
  }
  const wd = smoothPath(wpts);
  nodes.push(path(wd, { stroke: accent, width: RULE * 1.6 }));
  nodes.push(textOnPath(texts.phrases[0] || texts.main.text, wd, defs, {
    size: 14, family: FONTS.serif, fill: ink, startOffset: '4%', style: 'italic',
  }));

  // events, named
  const evWords = texts.main.words.slice(0, rng.int(2, 4));
  evWords.forEach((w, i) => {
    const ex = ox + rng.range(-0.7, 0.7) * ax;
    const ey = oy - rng.range(0.15, 0.85) * ax;
    nodes.push(el('circle', { cx: r2(ex), cy: r2(ey), r: 2.2, fill: ink }));
    nodes.push(textEl(w.replace(/[^\p{L}'-]/gu, ''), {
      x: ex + 7, y: ey - 5, size: 12.5, family: FONTS.serif, fill: ink,
    }));
  });

  nodes.push(axisLabel({ x: ox + 12, y: oy - ax - 14, stars: 1, word: 'time', aside: texts.word1, size: 13, ink }));
  nodes.push(axisLabel({ x: ox + ax, y: oy + 28, stars: 2, word: 'space', aside: texts.word2, size: 13, ink, anchor: 'end' }));

  nodes.push(textEl(texts.interjection, {
    x: ox - ax * 0.9, y: oy + ax * 0.48, size: 14, family: FONTS.serif, style: 'italic', fill: ink,
  }));

  return nodes;
}

function reedKellogg(rng, sheet, texts) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const words = texts.main.words.filter((w) => w.length);
  const size = 17;
  const font = { size, family: FONTS.serif };

  // naive grammar, honest struts: subject | verb | rest
  const s = Math.max(1, Math.min(3, Math.floor(words.length / 3)));
  const v = Math.min(words.length, s + rng.int(1, 2));
  const subject = words.slice(0, s);
  const verb = words.slice(s, v);
  const rest = words.slice(v);
  const hang = rest.splice(0, Math.min(rest.length > 3 ? rng.int(1, 3) : 0, 3)); // modifiers to hang

  const segs = [subject.join(' '), verb.join(' '), rest.join(' ')].filter(Boolean);
  const widths = segs.map((t) => measure(t, font) + 40);
  const total = widths.reduce((a, b) => a + b, 0);
  const scale = Math.min(1, (sheet.box.w * 0.94) / total);
  const y = sheet.height * rng.range(0.36, 0.46);
  let x = sheet.width / 2 - (total * scale) / 2;

  nodes.push(line(x, y, x + total * scale, y, { stroke: ink, width: RULE * 1.4 }));
  segs.forEach((t, i) => {
    nodes.push(textEl(t, {
      x: x + (widths[i] * scale) / 2, y: y - 7, size, family: FONTS.serif, fill: ink, anchor: 'middle',
    }));
    if (i < segs.length - 1) {
      // the first divider cuts the baseline; later ones rest upon it
      const dx = x + widths[i] * scale;
      nodes.push(line(dx, y - (i === 0 ? 26 : 24), dx, y + (i === 0 ? 12 : 0), { stroke: ink, width: RULE * 1.4 }));
    }
    x += widths[i] * scale;
  });

  // modifiers on slanted struts
  const anchors = [sheet.width / 2 - total * scale / 2 + widths[0] * scale * 0.4];
  if (widths.length > 1) anchors.push(sheet.width / 2 - total * scale / 2 + widths[0] * scale + widths[1] * scale * 0.4);
  hang.forEach((w, i) => {
    const axx = anchors[i % anchors.length] + i * 14;
    const len = measure(w, { size: size * 0.88, family: FONTS.serif, style: 'italic' }) + 18;
    nodes.push(line(axx, y, axx + len * 0.5, y + len * 0.75, { stroke: ink, width: RULE }));
    nodes.push(textEl(w, {
      x: axx + len * 0.30 + 4, y: y + len * 0.52, size: size * 0.88, family: FONTS.serif,
      style: 'italic', fill: ink, transform: `rotate(56 ${r2(axx + len * 0.3)} ${r2(y + len * 0.5)})`,
    }));
  });

  // a second sentence refuses the diagram
  nodes.push(textEl(texts.interjection, {
    x: sheet.width / 2, y: sheet.height * 0.66, size: 14, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle',
  }));
  nodes.push(axisLabel({
    x: sheet.width / 2, y: sheet.height * 0.72, stars: 1, word: 'the sentence', aside: texts.word1,
    size: 12, ink, anchor: 'middle',
  }));

  return nodes;
}

function feynman(rng, sheet, texts) {
  const ink = sheet.palette.ink;
  const accent = sheet.palette.accent || ink;
  const nodes = [];
  const cy = sheet.height * rng.range(0.4, 0.48);
  const cx = sheet.width / 2;
  const spread = sheet.box.w * rng.range(0.16, 0.22);
  const v1 = [cx - spread, cy];
  const v2 = [cx + spread, cy];
  const leg = sheet.box.w * 0.3;

  // the wavy propagator between the vertices
  const waves = rng.int(5, 8);
  const wpts = [];
  for (let i = 0; i <= waves * 8; i++) {
    const t = i / (waves * 8);
    wpts.push([v1[0] + (v2[0] - v1[0]) * t, cy + Math.sin(t * Math.PI * 2 * waves) * 7]);
  }
  nodes.push(path(smoothPath(wpts), { stroke: accent, width: RULE * 1.4 }));

  // fermion legs with mid-line arrowheads
  const legsSpec = [
    [v1, [v1[0] - leg * 0.8, cy - leg]], [ [v1[0] - leg * 0.8, cy + leg], v1],
    [v2, [v2[0] + leg * 0.8, cy - leg]], [ [v2[0] + leg * 0.8, cy + leg], v2],
  ];
  const ends = [];
  for (const [a, b] of legsSpec) {
    nodes.push(line(a[0], a[1], b[0], b[1], { stroke: ink, width: RULE * 1.4 }));
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    nodes.push(arrowHead((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ang, 6.5, ink));
    ends.push(b[1] < cy || a[1] < cy ? (a[1] < b[1] ? a : b) : (a[1] > b[1] ? a : b));
  }
  nodes.push(el('circle', { cx: r2(v1[0]), cy: r2(v1[1]), r: 2.6, fill: ink }));
  nodes.push(el('circle', { cx: r2(v2[0]), cy: r2(v2[1]), r: 2.6, fill: ink }));

  // in/out states, named from the poem
  const outer = [
    [v1[0] - leg * 0.8, cy - leg], [v1[0] - leg * 0.8, cy + leg],
    [v2[0] + leg * 0.8, cy - leg], [v2[0] + leg * 0.8, cy + leg],
  ];
  const ws = texts.main.words;
  outer.forEach((p, i) => {
    const w = (ws[i] || ws[ws.length - 1] || '·').replace(/[^\p{L}'-]/gu, '');
    const left = p[0] < cx;
    nodes.push(textEl(w, {
      x: p[0] + (left ? -8 : 8), y: p[1] + (p[1] < cy ? -8 : 16),
      size: 13.5, family: FONTS.serif, style: 'italic', fill: ink, anchor: left ? 'end' : 'start',
    }));
  });

  // what is exchanged
  nodes.push(textEl(texts.word1, {
    x: cx, y: cy - 18, size: 12.5, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
  }));

  // time's arrow, off to the side
  const tx = sheet.box.x + 10;
  nodes.push(line(tx, cy + leg, tx, cy - leg, { stroke: ink, width: RULE }));
  nodes.push(arrowHead(tx, cy - leg, -Math.PI / 2, 6, ink));
  nodes.push(axisLabel({
    x: tx + 14, y: cy - leg + 4, stars: 1, word: 'time', aside: texts.word2, size: 12, ink,
  }));

  // the caption is the poem
  nodes.push(textEl(`fig. ${rng.int(1, 9)}. ${texts.interjection}`, {
    x: cx, y: cy + leg + sheet.baseline * 2.2, size: 13.5, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle',
  }));

  return nodes;
}

function astronomical(rng, sheet, texts, defs) {
  const ink = sheet.palette.ink;
  const accent = sheet.palette.accent || ink;
  const nodes = [];
  const cx = sheet.width / 2;
  const cy = sheet.height * 0.45;
  const R = Math.min(sheet.box.w, sheet.box.h) * rng.range(0.4, 0.46);

  // the chart: concentric circles and hour ticks
  for (const f of [1, 0.72, 0.45]) {
    nodes.push(el('circle', {
      cx: r2(cx), cy: r2(cy), r: r2(R * f), fill: 'none',
      stroke: ink, 'stroke-width': f === 1 ? RULE * 1.4 : RULE, opacity: f === 1 ? 1 : 0.45,
    }));
  }
  for (let h = 0; h < 24; h++) {
    const a = (h / 24) * Math.PI * 2 - Math.PI / 2;
    const long = h % 6 === 0;
    const r1 = R * (long ? 0.955 : 0.975);
    nodes.push(line(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * R, cy + Math.sin(a) * R, { stroke: ink, width: RULE }));
    if (long) {
      const rn = ['XXIV', 'VI', 'XII', 'XVIII'][h / 6];
      nodes.push(textEl(rn, {
        x: cx + Math.cos(a) * R * 0.9, y: cy + Math.sin(a) * R * 0.9 + 4,
        size: 11, family: FONTS.serif, fill: ink, anchor: 'middle', opacity: 0.8,
      }));
    }
  }
  // the ecliptic
  nodes.push(el('ellipse', {
    cx: r2(cx), cy: r2(cy), rx: r2(R * 0.82), ry: r2(R * 0.34),
    fill: 'none', stroke: ink, 'stroke-width': RULE, 'stroke-dasharray': '3 4',
    transform: `rotate(${r2(rng.range(-30, 30))} ${r2(cx)} ${r2(cy)})`, opacity: 0.6,
  }));

  // stars; a few are named from the poem, one burns in accent
  const stars = [];
  const nStars = rng.int(16, 26);
  for (let i = 0; i < nStars; i++) {
    const a = rng.range(0, Math.PI * 2);
    const rr = Math.sqrt(rng.range(0.02, 0.88)) * R;
    stars.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, rng.range(0.8, 2.4)]);
  }
  stars.forEach((s, i) => {
    nodes.push(el('circle', {
      cx: r2(s[0]), cy: r2(s[1]), r: r2(s[2]),
      fill: i === 0 ? accent : ink,
    }));
  });

  // the constellation the poem draws
  const constellation = rng.shuffle(stars).slice(0, rng.int(5, 8)).sort((a, b) => a[0] - b[0]);
  nodes.push(path(polyPath(constellation), { stroke: ink, width: RULE, opacity: 0.7 }));
  const named = constellation.slice(0, Math.min(constellation.length, texts.main.words.length));
  named.forEach((s, i) => {
    nodes.push(textEl(texts.main.words[i].replace(/[^\p{L}'-]/gu, '').toLowerCase(), {
      x: s[0] + 6, y: s[1] - 5, size: 11.5, family: FONTS.serif, style: 'italic', fill: ink, opacity: 0.9,
    }));
  });

  // a phrase orbits the rim
  const orbitR = R * 1.06;
  const orbit = `M ${r2(cx - orbitR)} ${r2(cy)} A ${r2(orbitR)} ${r2(orbitR)} 0 1 1 ${r2(cx + orbitR)} ${r2(cy)}`;
  nodes.push(textOnPath(texts.phrases[0] || texts.main.text, orbit, defs, {
    size: 13.5, family: FONTS.serif, fill: ink, startOffset: `${rng.int(4, 30)}%`, tracking: 1.2,
  }));

  nodes.push(axisLabel({
    x: cx, y: cy + R + sheet.baseline * 1.8, stars: 1, word: 'right ascension', aside: texts.word1,
    size: 12, ink, anchor: 'middle',
  }));

  return nodes;
}

function commutative(rng, sheet, texts) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const cx = sheet.width / 2;
  const cy = sheet.height * 0.42;
  const half = Math.min(sheet.box.w, sheet.box.h) * rng.range(0.24, 0.3);
  const P = {
    A: [cx - half, cy - half * 0.8], B: [cx + half, cy - half * 0.8],
    C: [cx - half, cy + half * 0.8], D: [cx + half, cy + half * 0.8],
  };
  const ws = texts.main.words.map((w) => w.replace(/[^\p{L}'-]/gu, ''));
  const nodeWords = { A: ws[0] || 'a', B: ws[1] || 'b', C: ws[2] || 'c', D: ws[3] || 'd' };
  const size = 18;

  for (const k of Object.keys(P)) {
    nodes.push(textEl(nodeWords[k], {
      x: P[k][0], y: P[k][1] + 6, size, family: FONTS.serif, fill: ink, anchor: 'middle', style: 'italic',
    }));
  }

  const arrow = (a, b, label, dash) => {
    const pad = 30 + measure(nodeWords.A, { size, family: FONTS.serif }) * 0.3;
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const ax = a[0] + Math.cos(ang) * pad, ay = a[1] + Math.sin(ang) * pad;
    const bx = b[0] - Math.cos(ang) * pad, by = b[1] - Math.sin(ang) * pad;
    nodes.push(line(ax, ay, bx, by, { stroke: ink, width: RULE, dash: dash ? '3 4' : null }));
    nodes.push(arrowHead(bx, by, ang, 6, ink));
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    const px = -Math.sin(ang), py = Math.cos(ang);
    nodes.push(textEl(label, {
      x: mx - px * 14, y: my - py * 14 + 4, size: 12.5, family: FONTS.serif, style: 'italic',
      fill: ink, anchor: 'middle',
    }));
  };
  const verbs = ws.slice(4).filter((w) => w.length > 1);
  arrow(P.A, P.B, verbs[0] || 'becomes');
  arrow(P.A, P.C, verbs[1] || 'forgets');
  arrow(P.B, P.D, verbs[2] || 'insists');
  arrow(P.C, P.D, verbs[3] || 'returns');
  arrow(P.A, P.D, '?', true); // the diagonal that may not commute

  nodes.push(textEl('the diagram commutes, or it does not.', {
    x: cx, y: cy + half * 0.8 + sheet.baseline * 2.6, size: 13, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle',
  }));
  nodes.push(textEl(texts.interjection, {
    x: cx, y: cy + half * 0.8 + sheet.baseline * 3.8, size: 13, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle', opacity: 0.9,
  }));

  return nodes;
}

function schemaL(rng, sheet, texts) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const cx = sheet.width / 2;
  const cy = sheet.height * 0.42;
  const half = Math.min(sheet.box.w, sheet.box.h) * rng.range(0.26, 0.32);
  const P = {
    S: [cx - half, cy - half * 0.75],
    aPrime: [cx + half, cy - half * 0.75],
    a: [cx - half, cy + half * 0.75],
    A: [cx + half, cy + half * 0.75],
  };
  const ws = texts.main.words.map((w) => w.replace(/[^\p{L}'-]/gu, '').toLowerCase());

  // a corner: the algebra, its gloss, and the poem's word in brackets
  const corner = (pt, letter, gloss, word, align) => {
    const anchor = align === 'left' ? 'end' : 'start';
    const dx = align === 'left' ? -14 : 14;
    nodes.push(textEl(letter, {
      x: pt[0] + dx, y: pt[1] + 7, size: 24, family: FONTS.serif, style: 'italic',
      fill: ink, anchor,
    }));
    nodes.push(textEl(gloss, {
      x: pt[0] + dx, y: pt[1] + 24, size: 11, family: FONTS.serif, fill: ink,
      anchor, opacity: 0.8, tracking: 1.1,
    }));
    if (word) {
      nodes.push(textEl(`[${word}]`, {
        x: pt[0] + dx, y: pt[1] + 40, size: 11.5, family: FONTS.serif,
        style: 'italic', fill: ink, anchor,
      }));
    }
  };
  corner(P.S, 'S', 'THE SUBJECT', ws[0], 'left');
  corner(P.aPrime, 'a′', 'THE OTHER', ws[1], 'right');
  corner(P.a, 'a', 'THE EGO', ws[2], 'left');
  corner(P.A, 'A', 'THE OTHER, CAPITALIZED', ws[3], 'right');

  const pad = 34;
  const seg = (p, q) => {
    const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
    return {
      ang,
      x1: p[0] + Math.cos(ang) * pad, y1: p[1] + Math.sin(ang) * pad,
      x2: q[0] - Math.cos(ang) * pad, y2: q[1] - Math.sin(ang) * pad,
    };
  };

  // the imaginary axis: a′ ↔ a, both arrowheads, solid
  const im = seg(P.aPrime, P.a);
  nodes.push(line(im.x1, im.y1, im.x2, im.y2, { stroke: ink, width: RULE * 1.4 }));
  nodes.push(arrowHead(im.x2, im.y2, im.ang, 6.5, ink));
  nodes.push(arrowHead(im.x1, im.y1, im.ang + Math.PI, 6.5, ink));
  nodes.push(textEl('the imaginary relation', {
    x: cx + 14, y: cy - 8, size: 11.5, family: FONTS.serif, style: 'italic', fill: ink, opacity: 0.85,
  }));

  // the symbolic axis: A → S, dashed — interrupted by the imaginary
  const sy = seg(P.A, P.S);
  nodes.push(line(sy.x1, sy.y1, sy.x2, sy.y2, { stroke: ink, width: RULE, dash: '5 5' }));
  nodes.push(arrowHead(sy.x2, sy.y2, sy.ang, 6.5, ink));
  nodes.push(textEl('the unconscious', {
    x: cx - 14, y: cy + 22, size: 11.5, family: FONTS.serif, style: 'italic',
    fill: ink, anchor: 'end', opacity: 0.85,
  }));

  // the Z's connecting strokes, thin
  const top = seg(P.S, P.aPrime);
  nodes.push(line(top.x1, top.y1, top.x2, top.y2, { stroke: ink, width: RULE, opacity: 0.6 }));
  nodes.push(arrowHead(top.x2, top.y2, top.ang, 5.5, ink));
  const bottom = seg(P.a, P.A);
  nodes.push(line(bottom.x1, bottom.y1, bottom.x2, bottom.y2, { stroke: ink, width: RULE, opacity: 0.6 }));
  nodes.push(arrowHead(bottom.x2, bottom.y2, bottom.ang, 5.5, ink));

  // what the couch could not hold
  nodes.push(textEl(texts.interjection, {
    x: cx, y: cy + half * 0.75 + sheet.baseline * 3, size: 14, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle',
  }));

  return nodes;
}

function psychicalApparatus(rng, sheet, texts, defs) {
  const ink = sheet.palette.ink;
  const accent = sheet.palette.accent || ink;
  const nodes = [];
  const cx = sheet.width / 2;
  const cy = sheet.height * 0.44;
  const rx = sheet.box.w * rng.range(0.3, 0.35);
  const ry = sheet.box.h * rng.range(0.33, 0.38);

  // the egg, hand-drawn: an ellipse that has been in analysis
  const pts = [];
  const wobbles = [];
  const N = 22;
  for (let i = 0; i < N; i++) wobbles.push(1 + rng.gauss(0, 0.015));
  for (let i = 0; i <= N + 1; i++) {
    const a = ((i % N) / N) * Math.PI * 2 - Math.PI / 2;
    const w = wobbles[i % N];
    // narrower at the top: an egg, not an ellipse
    const squeeze = 1 - 0.18 * Math.max(0, -Math.sin(a));
    pts.push([cx + Math.cos(a) * rx * w * squeeze, cy + Math.sin(a) * ry * w]);
  }
  nodes.push(path(smoothPath(pts), { stroke: ink, width: RULE * 1.4 }));

  // internal boundaries: wavy, dashed, uncertain of themselves
  const chord = (k, waves, amp) => {
    const y = cy + ry * k;
    const xr = rx * Math.sqrt(Math.max(0.05, 1 - k * k)) * (1 - 0.18 * Math.max(0, -k));
    const linePts = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      linePts.push([cx - xr + t * 2 * xr, y + Math.sin(t * Math.PI * waves) * amp]);
    }
    return smoothPath(linePts);
  };
  nodes.push(path(chord(-0.55, 3, 6), { stroke: ink, width: RULE, dash: '4 4', opacity: 0.75 }));
  nodes.push(path(chord(0.12, 4, 8), { stroke: ink, width: RULE, dash: '4 4', opacity: 0.75 }));

  // the repressed: a hatched band on the lower right rim
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.18 + i * 0.035);
    const x1 = cx + Math.cos(a) * rx * 0.98;
    const y1 = cy + Math.sin(a) * ry * 0.98;
    const x2 = cx + Math.cos(a) * rx * 0.82;
    const y2 = cy + Math.sin(a) * ry * 0.82;
    nodes.push(line(x1, y1, x2, y2, { stroke: ink, width: RULE }));
  }

  // the regions, named — with the poem in brackets
  const region = (label, word, x, y, size = 13) => {
    nodes.push(axisLabel({ x, y, stars: 0, word: label, aside: word, size, ink, anchor: 'middle' }));
  };
  nodes.push(textEl('pcpt.-cs.', {
    x: cx, y: cy - ry - 12, size: 12, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
  }));
  region('ego', texts.word1, cx - rx * 0.1, cy - ry * 0.24, 14);
  region('id', texts.word2, cx, cy + ry * 0.55, 16);
  nodes.push(textEl('SUPER-EGO', {
    x: cx - rx * 0.72, y: cy - ry * 0.05, size: 11.5, family: FONTS.serif, fill: ink,
    anchor: 'middle', tracking: 1.2,
    transform: `rotate(-72 ${r2(cx - rx * 0.72)} ${r2(cy - ry * 0.05)})`,
  }));
  nodes.push(textEl('the repressed', {
    x: cx + rx * 0.98, y: cy + ry * 0.62, size: 11.5, family: FONTS.serif, style: 'italic',
    fill: ink, transform: `rotate(58 ${r2(cx + rx * 0.98)} ${r2(cy + ry * 0.62)})`,
  }));

  // the poem swims along the floor of the id
  const arc = `M ${r2(cx - rx * 0.62)} ${r2(cy + ry * 0.62)} Q ${r2(cx)} ${r2(cy + ry * 0.95)} ${r2(cx + rx * 0.62)} ${r2(cy + ry * 0.62)}`;
  nodes.push(textOnPath(texts.phrases[0] || texts.main.text, arc, defs, {
    size: 13, family: FONTS.serif, style: 'italic', fill: accent, startOffset: '2%',
  }));

  // what the diagram cannot metabolize
  nodes.push(textEl(texts.interjection, {
    x: cx, y: cy + ry + sheet.baseline * 2.4, size: 14, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle',
  }));

  return nodes;
}

function botanical(rng, sheet, texts) {
  const ink = sheet.palette.ink;
  const accent = sheet.palette.accent || ink;
  const nodes = [];
  const cx = sheet.width * rng.range(0.44, 0.52);
  const groundY = sheet.height * 0.68;
  const topY = sheet.height * 0.16;

  // the stem, with a botanist's gentle S
  const sway = rng.range(-1, 1) * sheet.box.w * 0.06;
  const stemPts = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    stemPts.push([cx + Math.sin(t * Math.PI * 1.4) * sway, groundY - t * (groundY - topY)]);
  }
  nodes.push(path(smoothPath(stemPts), { stroke: ink, width: RULE * 1.6 }));

  const stemAt = (t) => {
    const i = t * 6;
    const lo = Math.floor(i), hi = Math.min(6, lo + 1);
    const f = i - lo;
    return [
      stemPts[lo][0] + (stemPts[hi][0] - stemPts[lo][0]) * f,
      stemPts[lo][1] + (stemPts[hi][1] - stemPts[lo][1]) * f,
    ];
  };

  // leaves: two mirrored curves meeting at the tip
  const leafParts = [];
  const nLeaves = rng.int(2, 4);
  for (let i = 0; i < nLeaves; i++) {
    const t = 0.2 + (i / nLeaves) * 0.5 + rng.range(0, 0.08);
    const [lx, ly] = stemAt(t);
    const side = i % 2 === 0 ? 1 : -1;
    const len = sheet.box.w * rng.range(0.14, 0.2);
    const lift = rng.range(0.2, 0.45);
    const tip = [lx + side * len, ly - len * lift];
    const d = [
      `M ${r2(lx)} ${r2(ly)}`,
      `Q ${r2(lx + side * len * 0.45)} ${r2(ly - len * 0.55)} ${r2(tip[0])} ${r2(tip[1])}`,
      `Q ${r2(lx + side * len * 0.6)} ${r2(ly + len * 0.15)} ${r2(lx)} ${r2(ly)}`,
    ].join(' ');
    nodes.push(path(d, { stroke: ink, width: RULE }));
    nodes.push(line(lx, ly, tip[0] - side * len * 0.12, tip[1] + len * 0.06, { stroke: ink, width: RULE * 0.8, opacity: 0.6 })); // midrib
    leafParts.push({ pt: tip, side });
  }

  // the flower head: radiating petal outlines
  const head = stemAt(1);
  const nPetals = rng.int(5, 9);
  const petalLen = sheet.box.w * rng.range(0.07, 0.1);
  for (let i = 0; i < nPetals; i++) {
    const a = (i / nPetals) * Math.PI * 2 + rng.range(-0.1, 0.1);
    const tip = [head[0] + Math.cos(a) * petalLen, head[1] + Math.sin(a) * petalLen];
    const perp = [Math.cos(a + Math.PI / 2), Math.sin(a + Math.PI / 2)];
    const w = petalLen * 0.34;
    const d = [
      `M ${r2(head[0])} ${r2(head[1])}`,
      `Q ${r2(head[0] + Math.cos(a) * petalLen * 0.5 + perp[0] * w)} ${r2(head[1] + Math.sin(a) * petalLen * 0.5 + perp[1] * w)} ${r2(tip[0])} ${r2(tip[1])}`,
      `Q ${r2(head[0] + Math.cos(a) * petalLen * 0.5 - perp[0] * w)} ${r2(head[1] + Math.sin(a) * petalLen * 0.5 - perp[1] * w)} ${r2(head[0])} ${r2(head[1])}`,
    ].join(' ');
    nodes.push(path(d, { stroke: ink, width: RULE }));
  }
  nodes.push(el('circle', { cx: r2(head[0]), cy: r2(head[1]), r: 3, fill: accent }));

  // the ground, and roots trailing under it
  nodes.push(line(sheet.box.x + sheet.box.w * 0.14, groundY, sheet.box.x + sheet.box.w * 0.86, groundY, { stroke: ink, width: RULE, opacity: 0.6 }));
  for (let i = 0; i < rng.int(3, 5); i++) {
    const rootPts = [[cx, groundY]];
    let rx2 = cx, ry2 = groundY;
    for (let s = 0; s < 4; s++) {
      rx2 += rng.range(-1, 1) * 26;
      ry2 += rng.range(10, 26);
      rootPts.push([rx2, ry2]);
    }
    nodes.push(path(smoothPath(rootPts), { stroke: ink, width: RULE * 0.8, opacity: 0.6 }));
  }

  // leader lines: the parts of the flower, named by the poem
  const ws = texts.main.words.map((w) => w.replace(/[^\p{L}'-]/gu, '').toLowerCase()).filter(Boolean);
  const letters = ['a', 'b', 'c', 'd'];
  const targets = [
    { pt: head, side: 1 },
    ...leafParts.slice(0, 2),
    { pt: [cx, groundY + 30], side: -1 },
  ].slice(0, Math.min(4, ws.length));
  targets.forEach((tg, i) => {
    const lx = tg.pt[0] + tg.side * sheet.box.w * 0.2;
    nodes.push(line(tg.pt[0] + tg.side * 8, tg.pt[1] - 3, lx, tg.pt[1] - 14, { stroke: ink, width: RULE * 0.8 }));
    nodes.push(textEl(`${letters[i]}.`, {
      x: lx + tg.side * 6, y: tg.pt[1] - 10, size: 12, family: FONTS.serif, style: 'italic',
      fill: ink, anchor: tg.side > 0 ? 'start' : 'end',
    }));
  });

  // the legend is the poem
  const legend = targets.map((_, i) => `${letters[i]}. ${ws[i]}`).join('    ');
  nodes.push(textEl(legend, {
    x: sheet.width / 2, y: groundY + sheet.baseline * 3.6, size: 13, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle',
  }));
  nodes.push(axisLabel({
    x: sheet.width / 2, y: sheet.height * 0.1, stars: 0,
    word: `plate ${['ii', 'iv', 'vii', 'ix', 'xii'][rng.int(0, 4)]}`, aside: texts.word1,
    size: 13, ink, anchor: 'middle',
  }));
  nodes.push(textEl(texts.interjection, {
    x: sheet.width / 2, y: groundY + sheet.baseline * 5, size: 13.5, family: FONTS.serif,
    style: 'italic', fill: ink, anchor: 'middle', opacity: 0.9,
  }));

  return nodes;
}

/* Each scaffold carries its own colophon caption, so the lineage the
 * sheet names is always the lineage the sheet draws. */
const SCAFFOLDS = [
  { name: 'Penrose diagram', fn: penrose, caption: 'after Eugenia Leigh, “Oh I Thought You Knew…” (a Penrose diagram)' },
  { name: 'Minkowski diagram', fn: minkowski, caption: 'after the spacetime diagram annotated *TIME [lung], via Eugenia Leigh' },
  { name: 'Reed–Kellogg diagram', fn: reedKellogg, caption: 'after the Reed–Kellogg sentence diagram (1877), repurposed' },
  { name: 'Feynman diagram', fn: feynman, caption: 'after the Feynman diagram (1949), relabeled' },
  { name: 'astronomical chart', fn: astronomical, caption: 'after the star chart, via the diagrammatic lyric of Eugenia Leigh' },
  { name: 'commutative diagram', fn: commutative, caption: 'after the commutative diagram, via the diagrammatic lyric of Eugenia Leigh' },
  { name: 'Schema L', fn: schemaL, caption: 'after Lacan’s Schema L (1955), relabeled' },
  { name: 'psychical apparatus', fn: psychicalApparatus, caption: 'after Freud’s egg of the psychical apparatus (1923)' },
  { name: 'botanical plate', fn: botanical, caption: 'after the botanical plate, via Erasmus Darwin’s Loves of the Plants (1789)' },
];

export default {
  id: 'diagram',
  name: 'diagram',
  lineage: 'Eugenia Leigh’s Penrose-diagram poem; Reed–Kellogg (1877); Freud’s egg (1923); Lacan’s Schema L (1955)',
  acceptsMaterial: ['typestract', 'asemic'],

  generate(rng, source, sheet) {
    const scaffold = rng.pick(SCAFFOLDS);
    const defs = el('defs', {});

    const main = source.fragment(rng, { minWords: 5, maxWords: 14 });
    const extra = source.fragment(rng, { minWords: 4, maxWords: 10 });
    const inter = source.fragment(rng, { minWords: 3, maxWords: 9 });
    const texts = {
      main: { ...main, words: main.text.split(/\s+/) },
      phrases: [main.text, extra.text],
      word1: source.word(rng).text,
      word2: source.word(rng).text,
      interjection: inter.text.toLowerCase().replace(/[.:;,]$/, '') + ' —',
    };

    const nodes = scaffold.fn(rng, sheet, texts, defs);

    // crossbreed: the scaffold annotated in another engine's hand —
    // near-writing marginalia, or a typestract character-run band
    if (sheet.material === 'asemic') {
      const y0 = sheet.height * 0.78;
      for (let i = 0; i < 3; i++) {
        nodes.push(...asemicLine(
          rng, sheet.box.x + sheet.box.w * 0.18, y0 + i * sheet.baseline,
          sheet.box.w * 0.64, 13, sheet.palette.ink, { slant: 0.18, justify: i < 2 }
        ).nodes);
      }
    } else if (sheet.material === 'typestract') {
      const glyphs = [...new Set(main.text.replace(/\s+/g, '').split(''))];
      const cols = 52;
      const size = sheet.box.w / cols / 0.6;
      for (let row = 0; row < 3; row++) {
        let s = '';
        for (let c = 0; c < cols; c++) {
          const v = (Math.sin(c * 0.4 + row) + 1) / 2;
          s += rng.chance(v * 0.85) ? glyphs[Math.floor(v * (glyphs.length - 1))] : ' ';
        }
        const t = textEl(s, {
          x: sheet.box.x, y: sheet.height * 0.79 + row * size * 1.05,
          size, family: FONTS.mono, fill: sheet.palette.ink, preserveSpace: true,
        });
        nodes.push(t);
      }
    }

    // one phrase is always exiled to the footnotes
    const exiled = rng.pick([extra.text, inter.text]);
    nodes.push(...footnotes(sheet, [
      { stars: '*', text: `${texts.word1}, as measured from inside.` },
      { stars: '**', text: exiled.toLowerCase() },
    ]));

    let attribution = main.attribution;
    if (extra.attribution !== main.attribution) attribution += ' · ' + extra.attribution;

    return {
      nodes: [defs, g({}, ...nodes)],
      title: `${scaffold.name}: ${texts.word1} / ${texts.word2}`,
      attribution,
      caption: scaffold.caption,
    };
  },
};
