/*
 * décollage — after Raymond Hains & Jacques Villeglé, "Ach Alma
 * Manetro" (1949), titled for the words that surfaced from the torn
 * strata; Mimmo Rotella's manifesti lacerati (1953–); and Wolf
 * Vostell's dé-coll/age (1954), named for a word he found in Le
 * Figaro.
 *
 * The affichistes made poems by subtraction: rip the top poster and
 * whatever the layers beneath happen to say becomes the text. Here
 * three or four full-bleed posters are pasted up in sequence — stacked
 * display lines fitted to the measure, an occasional reversed band or
 * small-print credit line, each sheet on its own paper tone (one
 * buried layer may carry the accent) and each hung a degree or two off
 * plumb. Then the tearing: the stack shares a few rip sites, and each
 * deeper layer's wound is smaller than the one above, so the tears
 * nest and read as excavation. Every hole is a jagged seeded polygon,
 * clipped out of its layer, ringed by the pale fringe of ripped paper.
 * The title is assembled from one word surfacing per stratum.
 */

import { el, g, textEl, line, path, polyPath, r2, uid } from '../svg.js';
import { measure, FONTS } from '../typography.js';

/* mix two #rrggbb colors */
function mix(a, b, t) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

export default {
  id: 'decollage',
  name: 'décollage',
  lineage: 'Hains & Villeglé, “Ach Alma Manetro” (1949); Rotella (1953–)',
  marginRatio: 0.055,

  generate(rng, source, sheet) {
    const { box, entropy } = sheet;
    const paper = sheet.palette.paper;
    const ink = sheet.palette.ink;
    const accent = sheet.palette.accent;
    const nodes = [];
    const defs = el('defs');
    nodes.push(defs);

    /* ---- the strata: paper tones, bottom to top ---- */
    const K = rng.int(3, 4);
    const tones = [];
    const dimmed = rng.shuffle([
      mix(paper, ink, 0.1),
      mix(paper, ink, 0.05),
      mix(paper, '#ffffff', 0.65),
    ]);
    for (let k = 0; k < K - 1; k++) tones.push(dimmed[k % dimmed.length]);
    if (accent && rng.chance(0.8)) tones[rng.int(0, K - 2)] = accent;
    tones.push(paper); // the top poster is the sheet's own surface

    /* ---- shared rip sites: you keep tearing the same places ---- */
    const nSites = rng.int(2, 4);
    const sites = [];
    for (let i = 0; i < nSites; i++) {
      sites.push({
        x: box.x + box.w * rng.range(0.14, 0.86),
        y: box.y + box.h * rng.range(0.12, 0.88),
        rx: rng.range(85, 190) * (0.7 + entropy * 0.6),
        ry: 0, // set below
        rot: rng.range(-0.5, 0.5),
      });
      sites[i].ry = sites[i].rx * rng.range(0.45, 0.9);
    }

    /* one jagged wound at a site, scaled for its stratum */
    const wound = (site, scale) => {
      const n = rng.int(12, 19);
      const cx = site.x + rng.range(-16, 16);
      const cy = site.y + rng.range(-16, 16);
      const pts = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rng.range(-0.35, 0.35) / n * Math.PI;
        let rr = rng.range(0.6, 1.15);
        if (rng.chance(0.25)) rr *= rng.chance(0.5) ? 0.65 : 1.35; // deep spikes
        const px = Math.cos(a) * site.rx * scale * rr;
        const py = Math.sin(a) * site.ry * scale * rr;
        const cos = Math.cos(site.rot);
        const sin = Math.sin(site.rot);
        pts.push([cx + px * cos - py * sin, cy + px * sin + py * cos]);
      }
      pts.reverse(); // opposite winding to the outer boundary
      return polyPath(pts) + ' Z';
    };

    /* ---- one poster's worth of display typography ---- */
    const atts = new Set();
    const emergent = [];
    /*
     * Each stratum gets its own type scale and axis, the way pasted-over
     * posters never share a grid — so what surfaces through a tear reads
     * as another voice underneath, not a continuation of the line above.
     */
    const buildPoster = (ground, textColor, scaleMult, axisX) => {
      const out = [];
      let words = [];
      const refill = () => {
        const f = source.fragment(rng, { minWords: 4, maxWords: 16 });
        atts.add(f.attribution);
        words = words.concat(f.text.split(/\s+/).filter(Boolean));
      };
      refill();
      emergent.push((words[rng.int(0, words.length - 1)] || 'alma').toLowerCase().replace(/[^\p{L}]/gu, ''));
      const family = rng.weighted([
        { value: FONTS.sans, weight: 6 },
        { value: FONTS.serif, weight: 3 },
        { value: FONTS.mono, weight: 1 },
      ]);
      let y = box.y + box.h * rng.range(0.01, 0.08);
      const bottom = box.y + box.h * 0.99;
      let guard = 0;
      while (guard++ < 40) {
        if (words.length < 3) refill();
        const sub = rng.chance(0.1); // an italic subhead among the shouting
        const take = sub ? rng.int(3, 5) : rng.int(1, 3);
        const text = words.splice(0, take).join(' ');
        const display = sub ? text.toLowerCase() : text.toUpperCase();
        const fam = sub ? FONTS.serif : family;
        const weight = sub ? 'normal' : 'bold';
        const target = box.w * rng.range(0.62, 0.96) * scaleMult;
        const w100 = Math.max(1, measure(display, { size: 100, family: fam, weight, style: sub ? 'italic' : 'normal' }));
        let size = Math.max(22, Math.min((100 * target) / w100, (sub ? 44 : 165) * scaleMult));
        if (y + size * 1.1 > bottom) break;
        const tracking = sub ? 0 : size * 0.03;
        const width = measure(display, { size, family: fam, weight, tracking });
        const cx = axisX + rng.range(-8, 8);
        const baselineY = y + size * 0.93;
        if (!sub && rng.chance(0.18)) {
          /* reversed band: ink bar, paper letters */
          out.push(el('rect', {
            x: r2(cx - width / 2 - size * 0.22), y: r2(y),
            width: r2(width + size * 0.44), height: r2(size * 1.16), fill: ink,
          }));
          out.push(textEl(display, {
            x: cx, y: baselineY, size, family: fam, weight, anchor: 'middle',
            tracking, fill: ground,
          }));
        } else {
          out.push(textEl(display, {
            x: cx, y: baselineY, size, family: fam, weight, anchor: 'middle',
            tracking, fill: textColor, style: sub ? 'italic' : null,
          }));
        }
        y += size * rng.range(1.02, 1.16);
        if (rng.chance(0.14)) {
          y += size * 0.2;
          out.push(line(cx - target / 2, y, cx + target / 2, y, { stroke: textColor, width: 2.4 }));
          y += size * 0.25;
        }
      }
      if (rng.chance(0.6)) {
        /* the small print at the poster's foot */
        const credit = [...atts].slice(-1)[0] || '';
        out.push(textEl(credit.toUpperCase(), {
          x: axisX, y: bottom - 4, size: 10.5, family: FONTS.sans,
          anchor: 'middle', tracking: 1.6, fill: textColor, opacity: 0.8,
        }));
      }
      return out;
    };

    /* ---- paste up, bottom to top, tearing as we go ---- */
    for (let k = 0; k < K; k++) {
      const ground = tones[k];
      const textColor = ground === accent ? paper : ink;
      const scaleMult = k === K - 1 ? 1 : rng.pick([0.55, 0.7, 1.4]);
      const axisX = sheet.width / 2 + (k === K - 1 ? 0 : box.w * rng.range(-0.12, 0.12));
      const content = [
        el('rect', {
          x: -30, y: -30, width: sheet.width + 60, height: sheet.height + 60, fill: ground,
        }),
        ...buildPoster(ground, textColor, scaleMult, axisX),
      ];
      const tilt = k === 0 ? 0 : rng.range(-1.5, 1.5);
      const inner = g(
        tilt ? { transform: `rotate(${r2(tilt)} ${sheet.width / 2} ${sheet.height / 2})` } : {},
        ...content
      );

      if (k === 0) {
        nodes.push(inner);
        continue;
      }

      /* this layer's wounds: bigger than the stratum below, so tears nest */
      const scale = 0.42 + 0.58 * (k / (K - 1));
      const holes = [];
      for (const site of sites) {
        if (k === K - 1 || rng.chance(0.85)) holes.push(wound(site, scale));
      }
      const outer = `M-30 -30 L${sheet.width + 30} -30 L${sheet.width + 30} ${sheet.height + 30} L-30 ${sheet.height + 30} Z`;
      const clipId = uid('tear');
      const clip = el('clipPath', { id: clipId });
      clip.appendChild(el('path', { d: outer + ' ' + holes.join(' '), 'clip-rule': 'evenodd' }));
      defs.appendChild(clip);
      nodes.push(el('g', { 'clip-path': `url(#${clipId})` }, inner));

      /* the pale fringe of ripped paper, with its faint shadow */
      for (const d of holes) {
        nodes.push(path(d, { stroke: ink, width: 2.2, opacity: 0.12, fill: 'none', linejoin: 'miter' }));
        nodes.push(path(d, { stroke: mix(ground, '#ffffff', 0.7), width: rng.range(1.7, 2.6), fill: 'none', linejoin: 'miter' }));
      }
    }

    const attList = [...atts];
    return {
      nodes: [g({}, ...nodes)],
      title: emergent.filter(Boolean).join(' ') || 'ach alma manetro',
      attribution: attList.slice(0, 2).join(' · ') + (attList.length > 2 ? ' et al.' : ''),
    };
  },
};
