/*
 * workshops — after Afrizal Malna, "There's No Meaning: A Repeating
 * Poem" (trans. Daniel Owen): one text passed through successive
 * workshops — diagrammed, boxed and stuttered, panelled, cascaded,
 * and finally released into plain lineation.
 *
 * The repetition-with-difference IS the poem: every workshop on the
 * sheet reuses the identical words.
 */

import { g, el, textEl, line, smallCapsText, r2 } from '../svg.js';
import { measure, breakLines, FONTS } from '../typography.js';

const RULE = 0.7;

/* ——— treatments: (rng, sheet, words, region) -> nodes ——— */

function bracketTree(rng, sheet, words, rg) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const text = words.join(' ');
  let size = 16;
  while (measure(text, { size, family: FONTS.serif }) > rg.w * 0.92 && size > 9) size -= 0.5;
  const tw = measure(text, { size, family: FONTS.serif });
  const x0 = rg.x + (rg.w - tw) / 2;
  const y = rg.y + rg.h * 0.4;
  nodes.push(textEl(text, { x: x0, y, size, family: FONTS.serif, fill: ink }));

  // group the sentence into three constituents and bracket them
  const cut1 = Math.max(1, Math.floor(words.length / 3));
  const cut2 = Math.min(words.length - 1, cut1 + Math.ceil(words.length / 3));
  const groups = [[0, cut1], [cut1, cut2], [cut2, words.length]].filter(([a, b]) => b > a);
  const labels = ['the one who', 'what it does', 'to what remains'];
  const wordX = [];
  let acc = x0;
  for (const w of words) {
    const ww = measure(w + ' ', { size, family: FONTS.serif });
    wordX.push([acc, acc + measure(w, { size, family: FONTS.serif })]);
    acc += ww;
  }
  groups.forEach(([a, b], gi) => {
    const gx1 = wordX[a][0];
    const gx2 = wordX[b - 1][1];
    const by = y + 12;
    nodes.push(line(gx1, by, gx2, by, { stroke: ink, width: RULE }));
    nodes.push(line(gx1, by, gx1, by - 4, { stroke: ink, width: RULE }));
    nodes.push(line(gx2, by, gx2, by - 4, { stroke: ink, width: RULE }));
    const mid = (gx1 + gx2) / 2;
    nodes.push(line(mid, by, mid, by + 14, { stroke: ink, width: RULE }));
    nodes.push(textEl(labels[gi] || '…', {
      x: mid, y: by + 28, size: 11, family: FONTS.serif, style: 'italic',
      fill: ink, anchor: 'middle', opacity: 0.85,
    }));
  });
  return nodes;
}

function boxedGrid(rng, sheet, words, rg) {
  const ink = sheet.palette.ink;
  const nodes = [];
  // stutter: words duplicate in place — back back back, thethethe
  const stuttered = [];
  const rate = 0.18 + rng.range(0, 0.2) + sheet.entropy * 0.1;
  for (const w of words) {
    const bare = w.replace(/[.,;:!?—]+$/, '');
    if (rng.chance(rate)) {
      if (bare.length <= 4 && rng.chance(0.5)) {
        stuttered.push(bare.toLowerCase().repeat(rng.int(3, 4)));
      } else {
        const times = rng.int(2, 3);
        for (let i = 0; i < times; i++) stuttered.push(bare);
      }
    } else {
      stuttered.push(w);
    }
  }
  const n = stuttered.length;
  const cols = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(n * 1.4))));
  const rows = Math.ceil(n / cols);
  const cellW = Math.min(rg.w / cols, 150);
  const cellH = Math.min(rg.h / rows, sheet.baseline * 1.6);
  const gx = rg.x + (rg.w - cellW * cols) / 2;
  const gy = rg.y + (rg.h - cellH * rows) / 2;
  const size = Math.min(13, cellH * 0.48);
  stuttered.forEach((w, i) => {
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = gx + c * cellW;
    const y = gy + r * cellH;
    nodes.push(el('rect', {
      x: r2(x), y: r2(y), width: r2(cellW), height: r2(cellH),
      fill: 'none', stroke: ink, 'stroke-width': RULE,
    }));
    let s = size;
    while (measure(w, { size: s, family: FONTS.mono }) > cellW * 0.9 && s > 6) s -= 0.5;
    nodes.push(textEl(w, {
      x: x + cellW / 2, y: y + cellH / 2 + s * 0.35, size: s,
      family: FONTS.mono, fill: ink, anchor: 'middle',
    }));
  });
  return nodes;
}

function panels(rng, sheet, words, rg) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const nPanels = words.length >= 9 ? 3 : 2;
  const gap = 14;
  const pw = (rg.w - gap * (nPanels - 1)) / nPanels;
  const per = Math.ceil(words.length / nPanels);
  const size = 13.5;
  for (let i = 0; i < nPanels; i++) {
    const chunk = words.slice(i * per, (i + 1) * per).join(' ');
    if (!chunk) continue;
    const lines = breakLines(chunk, pw - 24, { size, family: FONTS.serif });
    const ph = Math.max(lines.length * sheet.baseline * 0.85 + 26, 54);
    const px = rg.x + i * (pw + gap);
    const py = rg.y + (rg.h - ph) / 2;
    nodes.push(el('rect', {
      x: r2(px), y: r2(py), width: r2(pw), height: r2(ph),
      fill: 'none', stroke: ink, 'stroke-width': RULE * 1.3,
    }));
    lines.forEach((ln, li) => {
      nodes.push(textEl(ln, {
        x: px + 12, y: py + 20 + li * sheet.baseline * 0.85, size,
        family: FONTS.serif, fill: ink,
      }));
    });
  }
  return nodes;
}

function cascade(rng, sheet, words, rg) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const nCols = Math.min(5, Math.max(3, Math.round(words.length / 3)));
  const colW = rg.w / nCols;
  const size = 12.5;
  const step = sheet.baseline * 0.75;
  // the columns' start heights silhouette a shape
  const silhouette = rng.pick([
    (t) => Math.abs(t - 0.5) * 2, // valley
    (t) => 1 - Math.abs(t - 0.5) * 2, // peak
    (t) => t, // stairs down
    (t) => 1 - t, // stairs up
  ]);
  words.forEach((w, i) => {
    const c = i % nCols;
    const depth = Math.floor(i / nCols);
    const t = nCols === 1 ? 0 : c / (nCols - 1);
    const y = rg.y + silhouette(t) * rg.h * 0.35 + depth * step + size;
    if (y > rg.y + rg.h - 4) return;
    nodes.push(textEl(w.toLowerCase().replace(/[.,;:!?]+$/, ''), {
      x: rg.x + c * colW + colW / 2, y, size,
      family: FONTS.serif, fill: ink, anchor: 'middle',
    }));
  });
  return nodes;
}

function lineation(rng, sheet, words, rg, tokens) {
  const ink = sheet.palette.ink;
  const nodes = [];
  const size = 15;
  const perLine = rng.int(3, 5);
  const lines = [];
  for (let i = 0; i < tokens.length; i += perLine) lines.push(tokens.slice(i, i + perLine));
  const x = rg.x + rg.w * 0.18;
  let y = rg.y + Math.max(sheet.baseline, (rg.h - lines.length * sheet.baseline) / 2) + size * 0.4;
  for (const lineTokens of lines) {
    let lx = x;
    for (const tk of lineTokens) {
      // erased words survive as ghosts — the release remembers the cuts
      nodes.push(textEl(tk.word, {
        x: lx, y, size, family: FONTS.serif, fill: ink,
        opacity: tk.erased ? 0.08 : 1,
      }));
      lx += measure(tk.word + ' ', { size, family: FONTS.serif });
    }
    y += sheet.baseline;
    if (y > rg.y + rg.h) break;
  }
  return nodes;
}

const TREATMENTS = [
  { key: 'bracketTree', title: 'the sentence, diagrammed', fn: bracketTree, h: 0.8 },
  { key: 'boxedGrid', title: 'the words, boxed and stuttered', fn: boxedGrid, h: 1.3 },
  { key: 'panels', title: 'the stanza, panelled', fn: panels, h: 1 },
  { key: 'cascade', title: 'the words, falling', fn: cascade, h: 1.2 },
  { key: 'lineation', title: 'release', fn: lineation, h: 1 },
];

export default {
  id: 'workshops',
  name: 'workshops',
  lineage: 'Afrizal Malna, “There’s No Meaning: A Repeating Poem” (trans. Owen)',

  generate(rng, source, sheet) {
    const { box } = sheet;
    const ink = sheet.palette.ink;

    // ONE text; every workshop reuses it verbatim
    const frag = source.fragment(rng, { minWords: 6, maxWords: 14 });
    const tokens = frag.tokens || frag.text.split(/\s+/).map((word) => ({ word }));
    const words = tokens.map((t) => t.word);

    const count = rng.int(2, 3);
    let chosen = rng.shuffle(TREATMENTS.filter((t) => t.key !== 'lineation')).slice(0, count - (rng.chance(0.75) ? 1 : 0));
    if (chosen.length < count) chosen.push(TREATMENTS.find((t) => t.key === 'lineation'));

    const headerH = sheet.baseline * 2;
    const totalWeight = chosen.reduce((s, t) => s + t.h, 0);
    const avail = box.h - chosen.length * headerH;

    const nodes = [];
    let y = box.y;
    chosen.forEach((treatment, i) => {
      const rh = (treatment.h / totalWeight) * avail;
      // the workshop's letterspaced small-caps title, with its rule
      const title = `WORKSHOP ${i + 1}: ${treatment.title.toUpperCase()}`;
      nodes.push(smallCapsText(title, {
        x: box.x, y: y + 13, size: 12.5, trackingEm: 0.14, family: FONTS.serif, fill: ink,
      }));
      nodes.push(line(box.x, y + 21, box.x + box.w, y + 21, { stroke: ink, width: RULE, opacity: 0.6 }));
      const region = { x: box.x, y: y + headerH * 0.9, w: box.w, h: rh - headerH * 0.4 };
      nodes.push(...treatment.fn(rng, sheet, words, region, tokens));
      y += rh + headerH;
    });

    return {
      nodes: [g({}, ...nodes)],
      title: `${words.slice(0, 3).join(' ').toLowerCase()}, repeated ${chosen.length} ways`,
      attribution: frag.attribution,
    };
  },
};
