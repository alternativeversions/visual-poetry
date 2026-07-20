/*
 * asemic — after Ana Hatherly's asemic calligraphy (A reinvenção da
 * leitura, 1975) and the calligraphic wing of visual poetry (Michaux's
 * alphabets, Fernando Aguiar's gestural texts).
 *
 * Writing that is only almost language: cursive stroke-chains with
 * word-length clustering, baseline wander, ascender/descender
 * statistics borrowed from a real corpus fragment. Set as a justified
 * block or a spiral; one legible line surfaces like a lucid moment.
 *
 * Strokes are built as closed filled outlines (svg.inkStroke), so
 * exports stay plotter- and cutter-safe with no renderer disagreements
 * about variable stroke width.
 */

import { g, textEl, inkStroke } from '../svg.js';
import { measure, FONTS } from '../typography.js';

/**
 * One pseudo-word in local coordinates: spine points along +x from 0,
 * y wandering about 0 (the baseline). Returns { pts, widths, advance }.
 */
export function pseudoWord(rng, size, letters, weight = 1) {
  const pts = [];
  const widths = [];
  let x = 0;
  for (let i = 0; i < letters; i++) {
    const segs = rng.int(2, 3);
    for (let s = 0; s < segs; s++) {
      x += size * rng.range(0.1, 0.26);
      let y = rng.gauss(0, size * 0.13);
      const roll = rng();
      if (roll < 0.1) y -= size * rng.range(0.45, 0.8); // ascender
      else if (roll < 0.18) y += size * rng.range(0.35, 0.65); // descender
      pts.push([x, y]);
    }
  }
  if (pts.length < 3) {
    pts.push([x + size * 0.2, rng.gauss(0, size * 0.1)]);
  }
  // brush pressure: thin at entry and exit, alive in the middle
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    widths.push(
      weight * size * 0.13 * (0.45 + Math.sin(t * Math.PI) * 0.9 + rng.range(-0.12, 0.2))
    );
  }
  return { pts, widths, advance: pts[n - 1][0] + size * 0.1 };
}

/**
 * A line of asemic writing starting at (x, y), fitted to `width`.
 * Used by the engine and lent out to crossbreeds (wings filled with
 * near-script, diagrams labeled in it). Returns { nodes, used }.
 */
export function asemicLine(rng, x, y, width, size, ink, { slant = 0, weight = 1, justify = false, lengths = null } = {}) {
  const words = [];
  let used = 0;
  let guard = 0;
  while (used < width * 0.92 && guard++ < 60) {
    const L = lengths && lengths.length ? lengths[guard % lengths.length] : rng.int(2, 8);
    const w = pseudoWord(rng, size, Math.max(1, Math.min(9, L)), weight);
    if (used + w.advance > width && words.length) break;
    words.push(w);
    used += w.advance + size * 0.38;
  }
  used -= size * 0.38;
  const gap = justify && words.length > 1 ? (width - (used - 0)) / (words.length - 1) + size * 0.38 : size * 0.38;

  const nodes = [];
  let cx = x;
  for (const w of words) {
    const placed = w.pts.map(([px, py]) => [cx + px + -py * slant, y + py]);
    const stroke = inkStroke(placed, w.widths, ink);
    if (stroke) nodes.push(stroke);
    cx += w.advance + (justify ? gap : size * 0.38);
  }
  return { nodes, used: cx - x };
}

export default {
  id: 'asemic',
  name: 'asemic',
  lineage: 'Ana Hatherly, A reinvenção da leitura (1975); Michaux’s alphabets',
  providesMaterial: true,

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const ink = sheet.palette.ink;
    const nodes = [];

    // borrow statistics from real language
    const model = source.fragment(rng, { minWords: 6, maxWords: 20 });
    const lengths = model.text.split(/\s+/).map((w) => w.replace(/[^\p{L}]/gu, '').length || 3);
    const legible = source.fragment(rng, { minWords: 3, maxWords: 9 });

    const slant = rng.range(-0.08, 0.3) + entropy * 0.1;
    const weight = rng.range(0.8, 1.6);
    const mode = rng.chance(0.72) ? 'block' : 'spiral';

    if (mode === 'block') {
      const size = rng.range(15, 21);
      const lineStep = Math.max(baseline, Math.round((size * 1.5) / baseline) * baseline);
      const top = sheet.snap(box.y + baseline);
      const bottom = box.y + box.h - baseline * 2;
      const nLines = Math.floor((bottom - top) / lineStep);
      // the lucid moment: one line surfaces as legible text
      const legibleAt = Math.floor(nLines * rng.range(0.35, 0.7));
      let wanderY = 0;
      for (let i = 0; i < nLines; i++) {
        const y = top + i * lineStep + wanderY;
        wanderY += rng.gauss(0, 1.2) * (0.5 + entropy);
        if (i === legibleAt) {
          nodes.push(textEl(legible.text.toLowerCase(), {
            x: box.x, y, size: size * 0.92, family: FONTS.serif, style: 'italic',
            fill: sheet.palette.accent || ink,
          }));
          continue;
        }
        // paragraph indents and short last lines, as if it meant something
        const indent = rng.chance(0.12) ? size * 2.2 : 0;
        const shortEnd = rng.chance(0.14) ? rng.range(0.5, 0.8) : 1;
        const { nodes: lineNodes } = asemicLine(
          rng, box.x + indent, y, (box.w - indent) * shortEnd, size, ink,
          { slant, weight, justify: shortEnd === 1, lengths }
        );
        nodes.push(...lineNodes);
      }
    } else {
      // the spiral: writing that curls toward its own centre
      const cx = sheet.width / 2;
      const cy = box.y + box.h / 2;
      const size = rng.range(13, 17);
      let r = Math.min(box.w, box.h) * 0.46;
      let theta = rng.range(0, Math.PI * 2);
      const rStep = size * rng.range(1.6, 2.2);
      let wi = 0;
      while (r > size * 3) {
        const L = lengths[wi % lengths.length];
        const w = pseudoWord(rng, size, Math.max(1, Math.min(9, L)), weight);
        const tangent = theta + Math.PI / 2;
        const tx = Math.cos(tangent), ty = Math.sin(tangent);
        const nx = Math.cos(theta), ny = Math.sin(theta);
        const ox = cx + Math.cos(theta) * r;
        const oy = cy + Math.sin(theta) * r;
        const placed = w.pts.map(([px, py]) => [
          ox + tx * px + nx * py, oy + ty * px + ny * py,
        ]);
        const stroke = inkStroke(placed, w.widths, ink);
        if (stroke) nodes.push(stroke);
        const arc = (w.advance + size * 0.45) / r;
        theta += arc;
        r -= (arc / (Math.PI * 2)) * rStep;
        wi++;
        if (wi > 400) break;
      }
      // the lucid moment rests beneath the coil
      nodes.push(textEl(legible.text.toLowerCase(), {
        x: cx, y: box.y + box.h - baseline, size: 13, family: FONTS.serif,
        style: 'italic', fill: sheet.palette.accent || ink, anchor: 'middle',
      }));
    }

    return {
      nodes: [g({}, ...nodes)],
      title: mode === 'block' ? 'a page of near-writing' : 'a spiral of near-writing',
      attribution: legible.attribution,
    };
  },
};
