/*
 * babel — after John Furnival, "The Fall of the Tower of Babel" (1963),
 * and his tower drawings of 1963–68 (Openings Press, with Houédard and
 * Edward Wright, from 1964).
 *
 * Furnival built towers out of dense hand-lettered text and let them
 * fail. Here the tower is masonry made of language — each course a line
 * of text pulled from several tongues and set in a different face, the
 * confusion of Babel literalized. The foundation holds: justified,
 * mortared, plumb. Rising, the courses shear and lean in the direction
 * of the fall; near the top they break into tumbling chunks of one to
 * three words; the topmost dissolve into single letters that rain down
 * the fall side and pile into a rubble heap on the ground line — a
 * deterministic sandpile, so the same seed always ruins the same tower
 * the same way.
 */

import { g, textEl, line, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { asemicLine } from './asemic.js';

export default {
  id: 'babel',
  name: 'babel',
  lineage: 'Furnival, The Fall of the Tower of Babel (1963); Openings Press (1964–)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, entropy } = sheet;
    const ink = sheet.palette.ink;
    const accent = sheet.palette.accent;
    const asemicFill = sheet.material === 'asemic';
    const nodes = [];

    /* ---- the tongues: several fragments feed one word-queue ---- */
    const frags = [];
    for (let i = 0; i < 6; i++) frags.push(source.fragment(rng, { minWords: 4, maxWords: 18 }));
    const pool = [];
    for (const f of frags) pool.push(...f.text.split(/\s+/).filter(Boolean));
    if (!pool.length) pool.push('babel');
    let wi = 0;
    const nextWord = () => pool[wi++ % pool.length];
    const atts = [...new Set(frags.map((f) => f.attribution))];
    const attribution = atts.slice(0, 2).join(' · ') + (atts.length > 2 ? ' et al.' : '');

    /* ---- architecture ---- */
    const dir = rng.chance(0.5) ? 1 : -1; // which way the tower falls
    const gY = sheet.snap(box.y + box.h * 0.93); // the ground line
    const size = rng.range(16, 22);
    const courseH = size * rng.range(1.16, 1.32);
    const N = Math.min(34, Math.max(12, Math.floor((box.h * rng.range(0.74, 0.84)) / courseH)));
    const cx = sheet.width / 2 - dir * box.w * rng.range(0.03, 0.08);
    const baseW = box.w * rng.range(0.5, 0.6);
    const topW = baseW * rng.range(0.55, 0.72);
    const widthAt = (i) => baseW + (topW - baseW) * (i / Math.max(1, N - 1));
    const spread = 0.55 + entropy * 0.75; // how far the fall has gone
    const sev = (i) => Math.pow(i / Math.max(1, N - 1), 1.5) * spread;
    const families = [FONTS.serif, FONTS.sans, FONTS.mono];

    /* ---- the rubble heap: a seeded sandpile on the ground line ---- */
    const buckets = new Map();
    const bucketW = 13;
    const rubble = [];
    const dropRubble = (str, xTarget, sz, fam, fill) => {
      if (!str) return;
      let b = Math.round(xTarget / bucketW);
      for (let k = 0; k < 3; k++) { // grains roll toward the lower neighbor
        const cur = buckets.get(b) || 0;
        const left = buckets.get(b - 1) || 0;
        const right = buckets.get(b + 1) || 0;
        if (left < cur - sz) b -= 1;
        else if (right < cur - sz) b += 1;
        else break;
      }
      const h = buckets.get(b) || 0;
      const x = b * bucketW + rng.range(-4, 4);
      const y = gY - h - sz * 0.16;
      buckets.set(b, h + sz * rng.range(0.42, 0.6));
      if (asemicFill) {
        const mark = asemicLine(rng, x - sz * 0.5, y, sz * rng.range(0.8, 1.4), sz * 0.75, fill);
        rubble.push(g({ transform: `rotate(${r2(rng.range(-95, 95))} ${r2(x)} ${r2(y)})` }, ...mark.nodes));
      } else {
        rubble.push(textEl(str, {
          x, y, size: sz, family: fam, fill, anchor: 'middle',
          transform: `rotate(${r2(rng.range(-95, 95))} ${r2(x)} ${r2(y)})`,
        }));
      }
    };
    const debrisColor = () => (accent && rng.chance(0.18) ? accent : ink);

    /* ---- ground ---- */
    nodes.push(line(box.x, gY, box.x + box.w, gY, { stroke: ink, width: 0.9, opacity: 0.45 }));

    /* ---- courses, bottom up ---- */
    const air = [];
    let edgeTop = 0; // highest course whose silhouette still stands
    for (let i = 0; i < N; i++) {
      const s = sev(i);
      const w = widthAt(i);
      const left = cx - w / 2;
      const y = gY - i * courseH - courseH * 0.3;
      const fam = rng.pick(families);
      const caps = i === 0 && !asemicFill; // the plinth carries an inscription
      const tracking = caps ? size * 0.12 : 0;

      /* fill the course by measurement */
      let wordNodes = [];
      let placed = []; // { word, x, ww } for later chunking
      if (asemicFill) {
        const lineRes = asemicLine(rng, left, y, w, size * 0.8, ink, { justify: true });
        wordNodes = lineRes.nodes;
      } else {
        const sz = caps ? size * 0.82 : size;
        const spaceW = Math.max(measure(' ', { size: sz, family: fam }), sz * 0.24);
        const words = [];
        let used = 0;
        let guard = 0;
        while (guard++ < 40) {
          let word = caps ? nextWord().toUpperCase() : nextWord();
          let ww = measure(word, { size: sz, family: fam, tracking });
          if (ww > w * 0.94) {
            word = word.slice(0, Math.max(2, Math.floor((word.length * w * 0.85) / ww)));
            ww = measure(word, { size: sz, family: fam, tracking });
          }
          if (words.length && used + spaceW + ww > w) { wi--; break; }
          words.push({ word, ww });
          used += ww + spaceW;
        }
        used -= spaceW;
        const gap = words.length > 1 ? spaceW + (w - used) / (words.length - 1) : 0;
        let x = left;
        for (const it of words) {
          placed.push({ word: it.word, x, ww: it.ww });
          wordNodes.push(textEl(it.word, { x, y, size: sz, family: fam, fill: ink, tracking: tracking || null }));
          x += it.ww + gap;
        }
      }

      if (s < 0.2) {
        /* intact masonry: mortar hairline above the course */
        edgeTop = i;
        nodes.push(...wordNodes);
        nodes.push(line(left, gY - (i + 1) * courseH, left + w, gY - (i + 1) * courseH, {
          stroke: ink, width: 0.5, opacity: 0.12,
        }));
      } else if (s < 0.55 || asemicFill) {
        /* sheared: the whole course slips and leans */
        if (s < 0.55) edgeTop = i;
        const dx = dir * s * rng.range(8, 34) + rng.gauss(0, 4);
        const dy = rng.range(0, s * 7);
        const rot = rng.gauss(dir * s * 4, s * 2.5);
        nodes.push(g({
          transform: `translate(${r2(dx)} ${r2(dy)}) rotate(${r2(rot)} ${r2(cx)} ${r2(y)})`,
        }, ...wordNodes));
      } else {
        /* broken: chunks of 1–3 words displace, tumble, or dissolve */
        let k = 0;
        while (k < placed.length) {
          const take = Math.min(rng.int(1, 3), placed.length - k);
          const chunk = placed.slice(k, k + take);
          k += take;
          const chunkX = chunk[0].x;
          const chunkW = chunk[chunk.length - 1].x + chunk[chunk.length - 1].ww - chunkX;
          const mid = chunkX + chunkW / 2;
          const roll = rng();
          if (s > 0.75 && roll < s * 0.4) {
            /* dissolved: every letter goes to the heap */
            for (const it of chunk) {
              for (const ch of it.word) {
                dropRubble(ch, cx + dir * (w / 2 + rng.range(-20, 150)), size * rng.range(0.7, 1), fam, debrisColor());
              }
            }
          } else if (roll < s - 0.3) {
            /* airborne: caught mid-fall between course and ground */
            const t = rng.range(0.15, 0.85);
            const ax = mid + dir * (rng.range(40, 170) * t + s * 50);
            const ay = y + (gY - size - y) * t;
            const rot = rng.range(-75, 75);
            air.push(g({
              transform: `translate(${r2(ax - mid)} ${r2(ay - y)}) rotate(${r2(rot)} ${r2(mid)} ${r2(y)})`,
            }, ...chunk.map((it) => textEl(it.word, { x: it.x, y, size, family: fam, fill: ink }))));
          } else {
            /* displaced in place: the course is coming apart */
            const dx = dir * s * rng.range(10, 60) + rng.gauss(0, 8);
            const dy = rng.range(-0.2, 0.5) * courseH;
            const rot = rng.gauss(0, s * 13);
            nodes.push(g({
              transform: `translate(${r2(dx)} ${r2(dy)}) rotate(${r2(rot)} ${r2(mid)} ${r2(y)})`,
            }, ...chunk.map((it) => textEl(it.word, { x: it.x, y, size, family: fam, fill: ink }))));
          }
        }
      }
    }

    /* ---- silhouette: edge lines up to where the wall still stands ---- */
    const hEdge = (edgeTop + 1) * courseH;
    const wEdge = widthAt(edgeTop);
    for (const side of [-1, 1]) {
      nodes.push(line(cx + side * baseW / 2, gY, cx + side * wEdge / 2, gY - hEdge, {
        stroke: ink, width: 0.6, opacity: 0.18,
      }));
    }

    /* ---- loose letters in the air on the fall side ---- */
    const airCount = rng.int(4, 9);
    for (let i = 0; i < airCount; i++) {
      const ch = nextWord().charAt(0);
      const x = cx + dir * rng.range(baseW * 0.2, baseW * 0.95) + rng.gauss(0, 30);
      const y = gY - courseH * N * rng.range(0.15, 1.02);
      if (asemicFill) {
        const mark = asemicLine(rng, x, y, size, size * 0.7, debrisColor());
        air.push(g({ transform: `rotate(${r2(rng.range(-60, 60))} ${r2(x)} ${r2(y)})` }, ...mark.nodes));
      } else {
        air.push(textEl(ch, {
          x, y, size: size * rng.range(0.7, 0.95), family: rng.pick(families),
          fill: debrisColor(), anchor: 'middle',
          transform: `rotate(${r2(rng.range(-60, 60))} ${r2(x)} ${r2(y)})`,
        }));
      }
    }

    /* ---- the heap always receives something, even early in the fall ---- */
    const extra = Math.round(16 + spread * 30);
    for (let i = 0; i < extra; i++) {
      const ch = nextWord().charAt(rng.int(0, 1));
      dropRubble(ch, cx + dir * (baseW / 2 + 30) + rng.gauss(0, 52), size * rng.range(0.65, 1), rng.pick(families), debrisColor());
    }

    nodes.push(...air, ...rubble);

    const title = rng.pick([
      'the fall of the tower',
      'tour de babel',
      `babel, ${pool[0].toLowerCase().replace(/[^\p{L}]/gu, '') || 'falling'}`,
    ]);
    return { nodes: [g({}, ...nodes)], title, attribution };
  },
};
