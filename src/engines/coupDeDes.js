/*
 * coupDeDes — after Stéphane Mallarmé, Un coup de dés jamais n'abolira
 * le hasard (1897): "prismatic subdivisions of the Idea."
 *
 * A double-page spread (the gutter rendered as a faint vertical). One
 * long sentence fractures at clause joints and drifts in constellation
 * cascade toward the lower right, stepping down through the tiers of
 * the modular scale. The MAJOR PHRASE crosses both pages in large caps.
 * Ragged but deliberate: every fragment sits on the baseline grid, and
 * nothing collides unless the dice insist.
 */

import { g, textEl, line } from '../svg.js';
import { measure, FONTS } from '../typography.js';

export default {
  id: 'coupDeDes',
  name: 'coup de dés',
  lineage: 'Mallarmé, Un coup de dés jamais n’abolira le hasard (1897)',
  sheetSize: { width: 1600, height: 1000 },
  marginRatio: 0.07,

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const serif = FONTS.serif;
    const ink = sheet.palette.ink;
    const nodes = [];

    // ——— the gutter: the fold of the book, barely there ———
    const gutterX = sheet.width / 2;
    nodes.push(line(gutterX, sheet.height * 0.03, gutterX, sheet.height * 0.97, {
      stroke: ink, width: 0.7, opacity: 0.16,
    }));

    // ——— fracture one long sentence (borrowing a second if the first
    // runs short — the Idea needs matter enough to subdivide) ———
    const sentence = source.sentence(rng, 12);
    let attribution = sentence.attribution;
    let raw = sentence.text;
    if (raw.split(/\s+/).length < 18) {
      const more = source.sentence(rng, 8);
      raw += (/[.!?]$/.test(raw) ? ' ' : ' — ') + more.text;
      if (more.attribution !== attribution) attribution += ' · ' + more.attribution;
    }
    const clauses = raw.split(/(?<=[,;:.!?—])\s+/).filter(Boolean);
    const fragments = [];
    for (const clause of clauses) {
      const words = clause.split(/\s+/);
      let i = 0;
      while (i < words.length) {
        const take = Math.min(words.length - i, rng.int(1, 3));
        fragments.push({ text: words.slice(i, i + take).join(' '), clauseLen: words.length });
        i += take;
      }
    }

    // the MAJOR PHRASE: the heaviest fragment, or the sentence's spine
    let majorIdx = 0;
    let best = -1;
    fragments.forEach((f, i) => {
      const score = f.text.length + (f.text === f.text.toUpperCase() ? 40 : 0);
      if (score > best && f.text.split(/\s+/).length >= 2) { best = score; majorIdx = i; }
    });

    // tiers of the modular scale, large to small, sized for the spread
    const tier = (n) => sheet.scale(4 - n) * 1.35; // tier 0 … tier 5

    // ——— placement with baseline-row bookkeeping ———
    const rows = Math.floor(box.h / baseline);
    const occupied = []; // {row, x1, x2}
    const collides = (row, x1, x2, span) => {
      for (const o of occupied) {
        if (Math.abs(o.row - row) < span && x2 > o.x1 - 18 && x1 < o.x2 + 18) return true;
      }
      return false;
    };
    const claim = (row, x1, x2) => occupied.push({ row, x1, x2 });
    const put = (text, x, row, size, { style, tracking, opacity } = {}) => {
      const y = box.y + row * baseline;
      nodes.push(textEl(text, {
        x, y, size, family: serif, fill: ink,
        style, tracking, opacity,
      }));
    };

    // major phrase first, upper-middle, astride the gutter
    const major = fragments[majorIdx].text.toUpperCase();
    const majorSize = Math.min(tier(0), (box.w * 0.82) / Math.max(1, measure(major, { size: 100, family: serif }) / 100 + 0.001) * 0.98);
    const majorW = measure(major, { size: majorSize, family: serif, tracking: majorSize * 0.06 });
    const majorRow = rng.int(Math.round(rows * 0.22), Math.round(rows * 0.45));
    const majorX = gutterX - majorW * rng.range(0.35, 0.62); // it must cross the fold
    put(major, majorX, majorRow, majorSize, { tracking: majorSize * 0.06 });
    claim(majorRow, majorX, majorX + majorW);
    claim(majorRow - 1, majorX, majorX + majorW);
    claim(majorRow + 1, majorX, majorX + majorW);

    // the cascade: everything else steps down toward the lower right,
    // paced so the drift spans the whole spread and ends near the floor
    const rest = fragments.filter((_, i) => i !== majorIdx);
    const startRow = rng.int(0, 3);
    const drift = Math.max(0.6, (rows - startRow - 3) / Math.max(1, rest.length));
    let cursorRow = startRow;

    rest.forEach((frag, i) => {
      const p = rest.length === 1 ? 0 : i / (rest.length - 1);
      // clause weight decides tier and voice
      const w = frag.text.split(/\s+/).length;
      let t;
      if (w === 1) t = rng.pick([2, 3, 3, 4]);
      else if (w === 2) t = rng.pick([3, 3, 4, 5]);
      else t = rng.pick([3, 4, 4, 5, 5]);
      const size = tier(t);
      const italic = frag.clauseLen <= 4 || t >= 4 ? rng.chance(0.75) : rng.chance(0.2);
      const caps = t <= 2 && rng.chance(0.6);
      const text = caps ? frag.text.toUpperCase() : frag.text;
      const tracking = caps ? size * 0.06 : 0;
      const width = measure(text, { size, family: serif, style: italic ? 'italic' : 'normal', tracking });

      // x sweeps left page to right page; indent jitter is Mallarmé's rag
      const xBase = box.x + p * (box.w - width);
      const x = Math.max(box.x, Math.min(box.x + box.w - width, xBase + rng.gauss(0, 40 + entropy * 50)));

      cursorRow += drift + (rng.chance(0.15) ? -drift * rng.range(0.5, 1.5) : rng.range(-0.4, 0.6));
      let row = Math.max(0, Math.round(cursorRow));
      const span = Math.max(1, Math.ceil(size / baseline));
      while (row < rows && collides(row, x, x + width, span)) row++;
      if (row >= rows) row = rows - 1;
      cursorRow = Math.max(cursorRow, row);

      put(text, x, row, size, { style: italic ? 'italic' : undefined, tracking: tracking || undefined });
      claim(row, x, x + width);
      if (span > 1) claim(row - 1, x, x + width);
    });

    return {
      nodes: [g({}, ...nodes)],
      title: major.toLowerCase(),
      attribution: sentence.attribution,
    };
  },
};
