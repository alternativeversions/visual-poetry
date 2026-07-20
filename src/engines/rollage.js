/*
 * rollage — after Jiří Kolář, rollage (1962–).
 *
 * Kolář sliced two reproductions into strips and re-wove them into one
 * sheet that waves between its sources. Here the same fragment is set
 * twice — once monumental, display words filling the sheet; once as a
 * dense small-text block, the fragment repeated like newsprint — and
 * the two settings are cut into vertical strips and interleaved. One
 * layer takes a progressive vertical shift per strip: the shear. At
 * high entropy the strips narrow, shuffle, and some flip 180° — the
 * reverse rollage. License breaks: poster-scale display type; when the
 * accent lands, the small layer prints entirely in it — a two-color
 * separation no letterpress would apologize for.
 */

import { el, g, textEl, r2, uid } from '../svg.js';
import { measure, breakLines, FONTS } from '../typography.js';

export default {
  id: 'rollage',
  name: 'rollage',
  lineage: 'Jiří Kolář, rollage (1962–)',

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 4, maxWords: 18 });
    const words = frag.text.split(/\s+/).filter(Boolean);

    /* ---- layer A layout: the monument (plain data, built per strip) ---- */
    const heads = words.slice(0, Math.min(words.length, rng.int(2, 4)))
      .map((w) => w.replace(/[.,;:!?—]+$/, '').toUpperCase());
    const layoutA = [];
    {
      const rotated = rng.chance(0.25);
      const usable = rotated ? box.h : box.w;
      let size = 240;
      for (const w of heads) {
        const fit = (usable * 0.92) / Math.max(1, measure(w, { size: 100, family: FONTS.sans, weight: 'bold' }) / 100);
        size = Math.min(size, Math.max(64, fit));
      }
      if (rotated) {
        // heads.length * lead is the pre-rotation vertical stack height —
        // rotate(-90) around the box center swaps the axes, so that stack
        // becomes the block's HORIZONTAL extent post-rotation. It must fit
        // box.w, not box.h (which only bounds each head's own width above),
        // or multi-head titles overflow the sheet edge.
        size = Math.min(size, (box.w * 0.92) / (heads.length * 1.02));
      }
      const lead = size * 1.02;
      const blockH = heads.length * lead;
      const y0 = box.y + (box.h - blockH) / 2 + size * 0.8;
      heads.forEach((w, i) => {
        layoutA.push({
          str: w, size, family: FONTS.sans, weight: 'bold', anchor: 'middle',
          x: box.x + box.w / 2, y: y0 + i * lead,
          transform: rotated ? `rotate(-90 ${r2(box.x + box.w / 2)} ${r2(box.y + box.h / 2)})` : null,
        });
      });
    }

    /* ---- layer B layout: the dense block ---- */
    const layoutB = [];
    {
      const size = rng.range(12, 14);
      const lead = size * 1.28;
      let text = frag.text;
      while (measure(text, { size, family: FONTS.serif }) < box.w * (box.h / lead) * 0.95) text += ' ' + frag.text;
      const lines = breakLines(text, box.w, { size, family: FONTS.serif });
      let y = box.y + size;
      for (const ln of lines) {
        if (y > box.y + box.h) break;
        layoutB.push({ str: ln, size, family: FONTS.serif, x: box.x, y });
        y += lead;
      }
    }

    const buildLayer = (layout, fill) =>
      g({}, ...layout.map((t) => textEl(t.str, { ...t, fill })));

    /* ---- the strips ---- */
    const defs = el('defs');
    const nodes = [defs];
    const stripW = rng.range(48, 26) - entropy * rng.range(0, 18); // narrows as entropy rises
    const w = Math.max(14, stripW);
    const count = Math.ceil(box.w / w);
    const shiftPer = (2 + entropy * 12) * (rng.chance(0.5) ? 1 : -1);
    const order = entropy > 0.6 ? rng.shuffle([...Array(count).keys()]) : [...Array(count).keys()];
    const fillB = palette.accent || ink;

    for (let i = 0; i < count; i++) {
      const sx = box.x + i * w;
      const clipId = uid('strip');
      const clip = el('clipPath', { id: clipId });
      clip.appendChild(el('rect', { x: r2(sx), y: 0, width: r2(w + 0.6), height: sheet.height }));
      defs.appendChild(clip);
      const src = order[i];
      const isA = src % 2 === 0;
      const dy = isA ? 0 : (src - count / 2) * shiftPer;
      const flip = entropy > 0.7 && rng.chance((entropy - 0.55) * 0.9);
      const layer = buildLayer(isA ? layoutA : layoutB, isA ? ink : fillB);
      const t = [];
      if (dy) t.push(`translate(0 ${r2(dy)})`);
      if (flip) t.push(`rotate(180 ${r2(sx + w / 2)} ${r2(sheet.height / 2)})`);
      nodes.push(g({ 'clip-path': `url(#${clipId})`, transform: t.length ? t.join(' ') : null }, layer));
    }

    return {
      nodes,
      title: heads.join(' ').toLowerCase() || frag.text.split(/\s+/)[0],
      attribution: frag.attribution,
    };
  },
};
