/*
 * inscription — after Ian Hamilton Finlay's Little Sparta (1966–) and
 * the Roman lapidary hand (Trajan's column, 113 CE).
 *
 * One sentence carved: capitals letterspaced the Roman way, V for U,
 * I for J, interpuncts between words, the first line largest and the
 * rest diminishing down the stone. A drawn stele holds it — double
 * fine rules, a pediment when the seed grants one, grass at its foot,
 * and a hedera to close the text. The attribution is the dedication,
 * in small italics beneath. When the accent lands the letters print
 * rubricated — inscriptions were painted minium red. At mid entropy
 * the carved line holding one word weathers — the whole line dims —
 * and that word is restored beneath in epigrapher's brackets; at
 * high entropy the stele breaks, and Sappho is on a broken stone
 * again. License break: full-accent rubrication.
 */

import { el, g, textEl, path, line, polyPath, inkStroke, r2, uid } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const lapidary = (text) =>
  text.split(/\s+/).slice(0, 12).map((w) =>
    w.toUpperCase().replace(/U/g, 'V').replace(/J/g, 'I').replace(/[^A-ZÀ-Þ]/g, '')
  ).filter(Boolean);

export default {
  id: 'inscription',
  name: 'inscription',
  lineage: 'Ian Hamilton Finlay, Little Sparta (1966–); the lapidary hand',

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const letterFill = palette.accent || palette.ink;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 4, maxWords: 14 });
    const words = lapidary(frag.text);
    if (!words.length) words.push('SILENTIVM');

    /* ---- stone geometry ---- */
    const stoneW = box.w * rng.range(0.62, 0.78);
    const sx = sheet.width / 2 - stoneW / 2;
    const pediment = rng.chance(0.5);
    const groundY = box.y + box.h * 0.86;

    /* ---- carve lines: first largest, diminishing; interpuncts ---- */
    const measureW = stoneW * 0.84;
    const lines = [];
    let s = sheet.scale(2);
    let i = 0;
    while (i < words.length) {
      const track = s * 0.15;
      const row = [];
      while (i < words.length) {
        const trial = row.concat(words[i]).join(' · ');
        if (measure(trial, { size: s, family: FONTS.serif, tracking: track }) > measureW && row.length) break;
        row.push(words[i]); i++;
      }
      lines.push({ str: row.join(' · '), size: s, track });
      s = Math.max(sheet.scale(2) * 0.55, s * 0.86);
    }
    const lineLead = (sz) => sz * 1.55;
    const textH = lines.reduce((h, ln) => h + lineLead(ln.size), 0);
    const stoneH = textH + 90;
    const sy = groundY - stoneH;
    const cx = sheet.width / 2;

    /* layout array so the broken stele can rebuild per clip half */
    const layout = [];
    let y = sy + 58;
    for (const ln of lines) {
      layout.push({ str: ln.str, x: cx, y, size: ln.size, family: FONTS.serif, anchor: 'middle', tracking: ln.track, fill: letterFill });
      y += lineLead(ln.size);
    }
    /* weathered word, restored in brackets (mid entropy) */
    let restored = null;
    if (entropy > 0.35 && entropy <= 0.66 && rng.chance(0.7) && words.length > 3) {
      const wi = rng.int(1, words.length - 1);
      restored = words[wi].toLowerCase();
      const li = layout.findIndex((t) => t.str.split(' · ').includes(words[wi]));
      if (li >= 0) layout[li] = { ...layout[li], opacity: 0.15 };
    }

    const stoneNodes = () => {
      const ns = [];
      /* double border, chamfered corners */
      const ch = 12;
      const ring = (inset, w) => {
        const x0 = sx + inset, y0 = sy + inset, x1 = sx + stoneW - inset, y1 = groundY - inset;
        return path(polyPath([
          [x0 + ch, y0], [x1 - ch, y0], [x1, y0 + ch], [x1, y1 - ch], [x1 - ch, y1],
          [x0 + ch, y1], [x0, y1 - ch], [x0, y0 + ch], [x0 + ch, y0],
        ]), { stroke: ink, width: w });
      };
      ns.push(ring(0, 1.1), ring(7, 0.6));
      if (pediment) {
        ns.push(path(polyPath([[sx - 8, sy], [cx, sy - stoneW * 0.16], [sx + stoneW + 8, sy]]),
          { stroke: ink, width: 1.1, linejoin: 'miter' }));
      }
      for (const t of layout) ns.push(textEl(t.str, t));
      /* hedera: a drawn ivy leaf, plotter-true */
      const hy = sy + 58 + textH - 6;
      const hs = 7;
      ns.push(path(
        `M${r2(cx)} ${r2(hy)} C${r2(cx - hs * 1.6)} ${r2(hy - hs * 1.4)} ${r2(cx - hs * 1.2)} ${r2(hy + hs * 0.8)} ${r2(cx)} ${r2(hy + hs * 0.4)} ` +
        `C${r2(cx + hs * 1.2)} ${r2(hy + hs * 0.8)} ${r2(cx + hs * 1.6)} ${r2(hy - hs * 1.4)} ${r2(cx)} ${r2(hy)} ` +
        `M${r2(cx)} ${r2(hy + hs * 0.4)} L${r2(cx)} ${r2(hy + hs * 1.3)}`,
        { fill: letterFill, stroke: letterFill, width: 0.8 }));
      return ns;
    };

    const defs = el('defs');
    const nodes = [defs];
    if (entropy > 0.66) {
      /* the broken stele: a jagged crack, halves displaced */
      const crack = [];
      let xx = cx + rng.range(-stoneW * 0.18, stoneW * 0.18);
      for (let yy = sy - stoneW * 0.2; yy <= groundY + 10; yy += 24) {
        crack.push([xx, yy]);
        xx += rng.gauss(0, 14);
      }
      const far = sheet.width + 50;
      const mkClip = (leftSide) => {
        const id = uid('shard');
        const cp = el('clipPath', { id });
        const pts = leftSide
          ? [[-50, -50], ...crack.map((p) => [p[0], p[1]]), [-50, sheet.height + 50]]
          : [[far, -50], ...crack.map((p) => [p[0], p[1]]), [far, sheet.height + 50]];
        cp.appendChild(path(polyPath(pts) + ' Z', { fill: '#000' }));
        defs.appendChild(cp);
        return id;
      };
      const gap = 4 + entropy * 10;
      nodes.push(g({ 'clip-path': `url(#${mkClip(true)})`, transform: `translate(${r2(-gap)} 0) rotate(-0.6 ${r2(cx)} ${r2(groundY)})` }, ...stoneNodes()));
      nodes.push(g({ 'clip-path': `url(#${mkClip(false)})`, transform: `translate(${r2(gap)} ${r2(gap * 0.8)}) rotate(0.8 ${r2(cx)} ${r2(groundY)})` }, ...stoneNodes()));
    } else {
      nodes.push(g({}, ...stoneNodes()));
    }

    /* ground line and grass */
    nodes.push(line(box.x + 20, groundY, box.x + box.w - 20, groundY, { stroke: ink, width: 0.9 }));
    for (let k = 0; k < rng.int(2, 3); k++) {
      const gx = rng.range(box.x + 30, box.x + box.w - 30);
      const h = rng.range(10, 22);
      nodes.push(inkStroke(
        [[gx, groundY], [gx + rng.range(-4, 4), groundY - h * 0.6], [gx + rng.range(-8, 8), groundY - h]],
        [2.2, 1.4, 0.5], ink));
    }
    /* restoration and dedication */
    let dedY = groundY + 26;
    if (restored) {
      nodes.push(textEl(`[${restored}]`, {
        x: cx, y: dedY, size: 12, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
      }));
      dedY += 20;
    }
    nodes.push(textEl(frag.attribution, {
      x: cx, y: dedY, size: 11.5, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle', opacity: 0.85,
    }));

    return {
      nodes,
      title: words.slice(0, 2).join(' ').toLowerCase(),
      attribution: frag.attribution,
    };
  },
};
