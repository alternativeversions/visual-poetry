/*
 * tendre — after Madeleine de Scudéry's Carte de Tendre (Clélie,
 * 1654), engraved by François Chauveau, and Guy Debord & Asger Jorn,
 * The Naked City (1957).
 *
 * The poem as a country. Its phrases become toponyms: settlements
 * with circle-and-dot symbols, a river carrying its name along its
 * own curve, the longest phrase spread across the sea, the last
 * trailing into terres inconnues. A dotted route walks the
 * settlements in the poem's phrase order — the poem is the journey.
 * Engraver's apparatus: neatline, cartouche, compass rose, a scale
 * bar in leagues, hachured hills, stippled shores. At high entropy
 * Debord takes the map apart: fracture bands break the country into
 * drifting plates and accent arrows leap the gaps. License breaks:
 * landscape sheet; linework denser than the baseline grid ever
 * intended.
 */

import { el, g, textEl, smallCapsText, path, line, smoothPath, polyPath, arrowHead, textOnPath, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';

function phrasesOf(text, max) {
  let parts = text.split(/(?<=[,;:.!?—])\s*/).map((p) => p.replace(/[.,;:!?—]+$/, '').trim()).filter((p) => p.length > 2);
  if (parts.length < 3) {
    const words = text.split(/\s+/).filter(Boolean);
    const per = Math.max(2, Math.ceil(words.length / 4));
    parts = [];
    for (let i = 0; i < words.length; i += per) parts.push(words.slice(i, i + per).join(' '));
  }
  return parts.slice(0, max).length ? parts.slice(0, max) : [text || 'tendre'];
}

export default {
  id: 'tendre',
  name: 'tendre',
  lineage: 'Scudéry’s Carte de Tendre (1654); Debord & Jorn (1957)',
  sheetSize: { width: 1400, height: 1000 },

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.sentence(rng, 10);
    const phrases = phrasesOf(frag.text, 9);
    const debord = entropy > 0.55;

    const defs = el('defs');
    const nodes = [];

    /* ---- the coast: land above, sea below ---- */
    const coastPts = [];
    let cy = box.y + box.h * rng.range(0.56, 0.68);
    for (let x = box.x - 10; x <= box.x + box.w + 10; x += 64) {
      cy += rng.gauss(0, 26);
      cy = Math.max(box.y + box.h * 0.42, Math.min(box.y + box.h * 0.8, cy));
      coastPts.push([x, cy]);
    }
    const coastY = (x) => {
      const i = Math.max(1, Math.min(coastPts.length - 1, Math.ceil((x - coastPts[0][0]) / 64)));
      const [xa, ya] = coastPts[i - 1];
      const [xb, yb] = coastPts[i];
      return ya + ((x - xa) / (xb - xa || 1)) * (yb - ya);
    };
    nodes.push(path(smoothPath(coastPts), { stroke: ink, width: 1.1 }));
    for (let k = 1; k <= 4; k++) {
      nodes.push(path(smoothPath(coastPts.map(([x, y]) => [x, y + k * 15 + rng.gauss(0, 2)])),
        { stroke: ink, width: 0.55, opacity: r2(0.55 - k * 0.11) }));
    }
    for (const [x, y] of coastPts) {
      for (let d = 0; d < 3; d++) {
        nodes.push(el('circle', {
          cx: r2(x + rng.gauss(0, 20)), cy: r2(y - rng.range(4, 16)), r: 0.9, fill: ink, opacity: 0.55,
        }));
      }
    }

    /* ---- hills with hachures ----
     * Positions are drawn from `rng` first (unchanged order/count), then
     * nudged apart in a pure geometric pass — no extra rng draws — so two
     * hachure clusters never merge into one illegible scribble; only
     * after that do we render the hachure lines. */
    const hills = [];
    for (let h = 0; h < rng.int(2, 3); h++) {
      const hx = box.x + box.w * rng.range(0.12, 0.88);
      const hy = box.y + 60 + (coastY(hx) - box.y - 130) * rng.range(0.1, 0.8);
      hills.push([hx, hy]);
    }
    for (let i = 1; i < hills.length; i++) {
      for (let j = 0; j < i; j++) {
        const dx = hills[i][0] - hills[j][0];
        const dy = hills[i][1] - hills[j][1];
        const d = Math.hypot(dx, dy) || 1;
        if (d < 70) {
          const push = 70 - d + 10;
          hills[i][0] += (dx / d) * push;
          hills[i][1] += (dy / d) * push * 0.4;
        }
      }
      hills[i][0] = Math.max(box.x + 24, Math.min(box.x + box.w - 24, hills[i][0]));
      hills[i][1] = Math.max(box.y + 60, Math.min(coastY(hills[i][0]) - 20, hills[i][1]));
    }
    for (const [hx, hy] of hills) {
      for (let row = 0; row < 3; row++) {
        const n = 7 - row * 2;
        for (let s2 = 0; s2 < n; s2++) {
          const a = Math.PI * (0.15 + 0.7 * (s2 / (n - 1 || 1)));
          const len = 16 - row * 3.5;
          const bx = hx + Math.cos(a) * (10 + row * 9) * 1.6;
          const by = hy + row * 7;
          nodes.push(line(bx, by, bx + Math.cos(a + Math.PI / 2) * 3, by + len * 0.55, { stroke: ink, width: 0.6, opacity: 0.8 }));
        }
      }
    }

    /* index into `nodes` just past the coast/hachures/hills — fracture
     * bands (below) are spliced in here, so they still occlude the coast
     * and hills but sit under every legible toponym drawn after this
     * point (settlements, river/sea names, route, apparatus). */
    const preToponymIndex = nodes.length;

    /* ---- toponyms ---- */
    const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), phrases[0]);
    const seaPhrase = longest;
    const lastPhrase = phrases[phrases.length - 1];
    const settlements = phrases.filter((p) => p !== seaPhrase && p !== lastPhrase).slice(0, 6);
    if (!settlements.length) settlements.push(phrases[0]);
    const spts = settlements.map((p, i) => {
      const x = box.x + box.w * ((i + 0.7) / (settlements.length + 0.6)) + rng.gauss(0, 24);
      const y = box.y + 70 + (coastY(x) - box.y - 120) * rng.range(0.15, 0.95);
      return { p, x, y };
    });
    /* keep settlement markers/labels clear of hachured hills and of each
     * other — a pure geometric nudge (no rng draws), so it never perturbs
     * anything downstream. Two passes let the hill push and the coastline
     * clamp converge instead of fighting each other. */
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < spts.length; i++) {
        for (const [hxh, hyh] of hills) {
          const dx = spts[i].x - hxh;
          const dy = spts[i].y - hyh;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 68) {
            const push = 68 - d + 12;
            spts[i].x += (dx / d) * push * 0.6;
            spts[i].y += (dy / d) * push;
          }
        }
        for (let j = 0; j < i; j++) {
          const dx = spts[i].x - spts[j].x;
          const dy = spts[i].y - spts[j].y;
          if (Math.abs(dx) < 160 && Math.abs(dy) < 16) {
            spts[i].y += dy >= 0 ? 16 - dy + 6 : -(16 + dy + 6);
          }
        }
        spts[i].y = Math.max(box.y + 40, Math.min(coastY(spts[i].x) - 14, spts[i].y));
      }
    }
    for (const s2 of spts) {
      nodes.push(el('circle', { cx: r2(s2.x), cy: r2(s2.y), r: 3.2, fill: 'none', stroke: ink, 'stroke-width': 0.9 }));
      nodes.push(el('circle', { cx: r2(s2.x), cy: r2(s2.y), r: 1.1, fill: ink }));
      const label = smallCapsText(s2.p, { x: s2.x + 7, y: s2.y + 3.5, size: 10.5, family: FONTS.serif, fill: ink, trackingEm: 0.08 });
      if (s2.x + 7 + label._width > box.x + box.w) label.setAttribute('transform', `translate(${r2(-(label._width + 16))} 0)`);
      nodes.push(label);
    }

    /* ---- the river, named along its curve ----
     * Built from the hill origin to the coast mouth as a chain of 5–6
     * points, each interior point set on the straight origin-mouth line
     * and then nudged laterally (perpendicular to that line) by a
     * seeded gauss offset, so smoothPath meanders instead of bowing
     * through one harsh midpoint jitter. */
    const [hx, hy] = hills[0];
    const mouthX = box.x + box.w * rng.range(0.25, 0.75);
    const riverOrigin = [hx, hy + 14];
    const riverMouth = [mouthX, coastY(mouthX)];
    const riverSteps = rng.int(4, 5); // 5–6 points total incl. origin/mouth
    const rdx = riverMouth[0] - riverOrigin[0];
    const rdy = riverMouth[1] - riverOrigin[1];
    const rlen = Math.hypot(rdx, rdy) || 1;
    const rnx = -rdy / rlen;
    const rny = rdx / rlen;
    const riverPts = [riverOrigin];
    for (let k = 1; k < riverSteps; k++) {
      const t = k / riverSteps;
      const wob = rng.gauss(0, 40);
      riverPts.push([riverOrigin[0] + rdx * t + rnx * wob, riverOrigin[1] + rdy * t + rny * wob]);
    }
    riverPts.push(riverMouth);
    const riverD = smoothPath(riverPts);
    nodes.push(path(riverD, { stroke: ink, width: 1 }));
    const verbish = frag.text.split(/\s+/).find((w) => /ing$/.test(w)) || settlements[0].split(' ')[0] || 'longing';
    nodes.push(textOnPath(`the river of ${verbish.toLowerCase().replace(/[^\p{L}]/gu, '')}`, riverD, defs, {
      size: 10.5, family: FONTS.serif, style: 'italic', fill: ink, startOffset: '12%',
    }));

    /* ---- the sea, named at size; terres inconnues ---- */
    const seaMidY = (coastY(box.x + box.w * 0.3) + box.y + box.h) / 2 + 30;
    const seaD = `M${r2(box.x + 40)} ${r2(seaMidY)} Q${r2(box.x + box.w / 2)} ${r2(seaMidY + 34)} ${r2(box.x + box.w - 40)} ${r2(seaMidY)}`;
    nodes.push(textOnPath(`the sea of ${seaPhrase.toLowerCase()}`, seaD, defs, {
      size: sheet.scale(1.5), family: FONTS.serif, style: 'italic', fill: ink, tracking: 3, opacity: 0.9,
    }));
    const tiX = box.x + box.w - 20;
    nodes.push(smallCapsText('terres inconnues', {
      x: tiX, y: box.y + 30, size: 11, family: FONTS.serif, fill: ink, anchor: 'end', trackingEm: 0.16, opacity: 0.7,
    }));
    nodes.push(textEl(lastPhrase.toLowerCase(), {
      x: tiX, y: box.y + 48, size: 11, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'end', opacity: 0.4,
    }));

    /* ---- the route: the poem walked in order ---- */
    if (spts.length > 1) {
      const routeD = smoothPath(spts.map((s2) => [s2.x, s2.y]));
      nodes.push(path(routeD, { stroke: ink, width: 1, dash: '1.5 6', linecap: 'round' }));
      const [xa, ya] = [spts[spts.length - 2].x, spts[spts.length - 2].y];
      const [xb, yb] = [spts[spts.length - 1].x, spts[spts.length - 1].y];
      nodes.push(arrowHead(xb, yb, Math.atan2(yb - ya, xb - xa), 7, ink));
    }

    /* ---- Debord: fracture bands and leaping arrows ----
     * The paper-fill bands are spliced in at `preToponymIndex` — right
     * after the coast/hachures/hills, before any toponym — so they still
     * occlude terrain (the "drifting plates" break) but never paint over
     * a settlement label, the river/sea names, or the route: those are
     * all added to `nodes` after this block runs. The leaping arrows
     * stay appended normally, on top of everything but the apparatus. */
    if (debord) {
      const bandNodes = [];
      for (let b = 0; b < rng.int(2, 3); b++) {
        const bx = box.x + box.w * rng.range(0.2, 0.8);
        const wB = rng.range(18, 44);
        const ptsL = [];
        const ptsR = [];
        for (let y = box.y - 10; y <= box.y + box.h + 10; y += 60) {
          const wob = rng.gauss(0, 24);
          ptsL.push([bx + wob, y]);
          ptsR.push([bx + wob + wB, y]);
        }
        bandNodes.push(path(polyPath(ptsL.concat(ptsR.reverse())) + ' Z', { fill: palette.paper }));
        const ay = box.y + box.h * rng.range(0.2, 0.75);
        const a0x = bx - rng.range(40, 90);
        const a1x = bx + wB + rng.range(40, 90);
        nodes.push(path(`M${r2(a0x)} ${r2(ay)} Q${r2(bx + wB / 2)} ${r2(ay - 46)} ${r2(a1x)} ${r2(ay)}`,
          { stroke: palette.accent || ink, width: 2.2 }));
        nodes.push(arrowHead(a1x, ay, Math.PI * 0.32, 8, palette.accent || ink));
      }
      nodes.splice(preToponymIndex, 0, ...bandNodes);
    }

    /* ---- apparatus: neatline, cartouche, compass, scale bar ---- */
    const nl = 16;
    nodes.push(el('rect', { x: r2(box.x - nl), y: r2(box.y - nl), width: r2(box.w + nl * 2), height: r2(box.h + nl * 2), fill: 'none', stroke: ink, 'stroke-width': 1.2 }));
    nodes.push(el('rect', { x: r2(box.x - nl + 6), y: r2(box.y - nl + 6), width: r2(box.w + nl * 2 - 12), height: r2(box.h + nl * 2 - 12), fill: 'none', stroke: ink, 'stroke-width': 0.6 }));
    const short = phrases[0].split(/\s+/).slice(0, 4).join(' ').toLowerCase();
    const title = `a map of ${short}`;
    const cw = Math.max(200, measure(title.toUpperCase(), { size: 14, family: FONTS.serif }) * 0.9 + 60);
    nodes.push(el('rect', { x: r2(box.x + 14), y: r2(box.y + 14), width: r2(cw), height: 64, fill: palette.paper, stroke: ink, 'stroke-width': 0.9 }));
    nodes.push(smallCapsText(title, { x: box.x + 14 + cw / 2, y: box.y + 44, size: 14, family: FONTS.serif, fill: ink, anchor: 'middle', trackingEm: 0.12 }));
    nodes.push(line(box.x + 34, box.y + 58, box.x + 14 + cw - 20, box.y + 58, { stroke: ink, width: 0.6 }));
    /* compass, in the sea */
    const cpx = box.x + box.w * 0.9;
    const cpy = box.y + box.h * 0.88;
    const cRot = rng.range(-20, 20);
    const compass = [];
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const len = a % 2 === 0 ? 26 : 14;
      compass.push(line(cpx, cpy, cpx + Math.cos(ang) * len, cpy + Math.sin(ang) * len, { stroke: ink, width: a % 2 === 0 ? 0.9 : 0.5 }));
    }
    compass.push(textEl('N', { x: cpx, y: cpy - 32, size: 11, family: FONTS.serif, fill: ink, anchor: 'middle' }));
    nodes.push(g({ transform: `rotate(${r2(cRot)} ${r2(cpx)} ${r2(cpy)})` }, ...compass));
    /* scale bar */
    const sbx = box.x + 20;
    const sby = box.y + box.h - 24;
    for (let s3 = 0; s3 < 5; s3++) {
      nodes.push(el('rect', {
        x: r2(sbx + s3 * 26), y: r2(sby), width: 26, height: 5,
        fill: s3 % 2 === 0 ? ink : 'none', stroke: ink, 'stroke-width': 0.6,
      }));
    }
    nodes.push(textEl('leagues', { x: sbx + 140, y: sby + 6, size: 10, family: FONTS.serif, style: 'italic', fill: ink }));

    return {
      nodes: [defs, g({}, ...nodes)],
      title,
      attribution: frag.attribution,
      caption: debord ? 'after Debord & Jorn, The Naked City (1957)' : 'after Madeleine de Scudéry’s Carte de Tendre (1654)',
    };
  },
};
