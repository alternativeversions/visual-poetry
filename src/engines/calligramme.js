/*
 * calligramme — after Guillaume Apollinaire: "Lettre-Océan" (1914),
 * "Il Pleut" (1916), Calligrammes (1918).
 *
 * Technopaegnia fills shapes with measured text; this engine draws with
 * the line of text itself, on real textPath curves. Three figures: the
 * rain of "Il Pleut" — five wavering threads falling the height of the
 * page; the jet d'eau of "La colombe poignardée" — threads rising from
 * a basin, arcing, and falling to a pool; and the radial océan of
 * "Lettre-Océan" — a hub word with text spokes and concentric rings,
 * Apollinaire hearing the wireless. At high entropy the weather wins:
 * wind bends and crosses the rain, the fountain breaks into droplet
 * letters past the end of its arc, the océan's rings shatter to arcs.
 * License breaks: none the tradition didn't make first.
 */

import { el, g, textEl, smoothPath, textOnPath, inkStroke, r2 } from '../svg.js';
import { FONTS } from '../typography.js';

/* Split into phrase-sized pieces; always returns at least one piece. */
function phrasesOf(text, want) {
  let parts = text.split(/(?<=[,;:.!?—])\s+/).filter((p) => p.trim().length);
  if (parts.length < want) {
    const words = text.split(/\s+/).filter(Boolean);
    const per = Math.max(2, Math.ceil(words.length / want));
    parts = [];
    for (let i = 0; i < words.length; i += per) parts.push(words.slice(i, i + per).join(' '));
  }
  if (!parts.length) parts = [text || 'pluie'];
  return parts;
}

const strip = (s) => s.replace(/[.,;:!?—]+$/, '');

export default {
  id: 'calligramme',
  name: 'calligramme',
  lineage: 'Apollinaire, “Lettre-Océan” (1914); “Il Pleut” (1916)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const defs = el('defs');
    const nodes = [];
    const mode = rng.weighted([
      { value: 'rain', weight: 4 },
      { value: 'fountain', weight: 3 },
      { value: 'ocean', weight: 3 },
    ]);
    const frag = source.fragment(rng, { minWords: 6, maxWords: 24 });
    let title = '';
    let caption = '';

    if (mode === 'rain') {
      caption = 'after Apollinaire, “Il Pleut” (1916)';
      const threads = 5;
      const phrases = phrasesOf(frag.text, threads);
      const amp = 8 + entropy * 42;
      const lean = 30 + entropy * 90; // rain falls aslant, as in SIC
      const accentAt = palette.accent ? rng.int(0, threads - 1) : -1;
      for (let i = 0; i < threads; i++) {
        const x0 = box.x + ((i + 0.6) / threads) * box.w * 0.92 + rng.range(-14, 14);
        const len = box.h * rng.range(0.62, 0.98);
        const pts = [];
        const n = 7;
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          pts.push([
            x0 + t * lean * rng.range(0.6, 1) + Math.sin(t * Math.PI * rng.range(1.5, 3)) * amp,
            box.y + 6 + t * len,
          ]);
        }
        const d = smoothPath(pts);
        /* hybrid: asemic material rains near-writing instead of words */
        if (sheet.material === 'asemic') {
          const widths = pts.map((_, q) => 0.6 + Math.sin((q / n) * Math.PI) * rng.range(1.4, 2.8));
          nodes.push(inkStroke(pts, widths, i === accentAt ? palette.accent : ink));
          continue;
        }
        const phrase = phrases[i % phrases.length];
        const size = rng.range(11.5, 14.5);
        nodes.push(textOnPath(phrase, d, defs, {
          size, family: FONTS.serif, style: 'italic',
          fill: i === accentAt ? palette.accent : ink,
          tracking: size * rng.range(0.06, 0.22),
          /* a short phrase is a small fraction of a full-height thread;
           * scatter where along the fall it catches the light, or every
           * thread reads stranded at the top */
          startOffset: `${rng.int(0, 55)}%`,
        }));
        /* droplet letters shaken loose below the thread's end */
        if (entropy > 0.55 && rng.chance(entropy)) {
          const tail = strip(phrase.split(/\s+/).pop() || 'eau');
          for (let j = 0; j < Math.min(tail.length, rng.int(2, 5)); j++) {
            const dx = rng.gauss(0, amp * 0.6);
            const dy = rng.range(10, box.y + box.h - (pts[n][1] + 4));
            nodes.push(textEl(tail[j], {
              x: pts[n][0] + dx, y: pts[n][1] + Math.max(10, dy), size: size * 0.9,
              family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
              opacity: r2(rng.range(0.35, 0.8)),
            }));
          }
        }
      }
      title = `il pleut ${strip(phrases[0].split(/\s+/)[0] || '').toLowerCase()}`;
    }

    if (mode === 'fountain') {
      caption = 'after the jet d’eau, via “La colombe poignardée et le jet d’eau” (1918)';
      const cx = box.x + box.w / 2;
      const baseY = box.y + box.h * rng.range(0.72, 0.82);
      const jets = rng.int(4, 6) + (entropy > 0.6 ? rng.int(0, 2) : 0);
      const phrases = phrasesOf(frag.text, jets + 1);
      const accentAt = palette.accent ? rng.int(0, jets - 1) : -1;
      for (let i = 0; i < jets; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const spread = (Math.ceil((i + 1) / 2) / Math.ceil(jets / 2)) * box.w * 0.34;
        const apexY = box.y + box.h * rng.range(0.12, 0.3) + (spread / box.w) * box.h * 0.18;
        const over = entropy > 0.6 && rng.chance(entropy - 0.3) ? rng.range(1.1, 1.35) : 1;
        const pts = [
          [cx + side * rng.range(0, 8), baseY],
          [cx + side * spread * 0.35, (baseY + apexY) / 2],
          [cx + side * spread * 0.8, apexY],
          [cx + side * spread * 1.15, (baseY + apexY) / 2],
          [cx + side * spread * 1.3 * over, baseY - rng.range(0, 20)],
        ];
        const size = rng.range(11, 14);
        nodes.push(textOnPath(phrases[i % phrases.length], smoothPath(pts), defs, {
          size, family: FONTS.serif, style: 'italic',
          fill: i === accentAt ? palette.accent : ink,
          tracking: size * 0.08,
          /* a short phrase can't trace the whole rise-and-fall; let it
           * catch the jet at a different height each time, or every jet
           * bunches at the nozzle */
          startOffset: `${rng.int(0, 40)}%`,
        }));
      }
      /* the pool: one line on a shallow curve */
      const poolR = box.w * 0.36;
      const poolD = `M${r2(cx - poolR)} ${r2(baseY + 14)} Q${r2(cx)} ${r2(baseY + 44)} ${r2(cx + poolR)} ${r2(baseY + 14)}`;
      nodes.push(textOnPath(phrases[jets % phrases.length], poolD, defs, {
        size: 13, family: FONTS.serif, fill: ink, tracking: 1.2,
        startOffset: `${rng.int(15, 40)}%`,
      }));
      title = 'jet d’eau';
    }

    if (mode === 'ocean') {
      caption = 'after Apollinaire, “Lettre-Océan” (1914)';
      const hub = source.word(rng).text.toUpperCase();
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h * 0.46;
      const rMax = Math.min(box.w, box.h * 0.86) / 2 - 10;
      nodes.push(textEl(hub, {
        x: cx, y: cy + sheet.scale(2) * 0.32, size: sheet.scale(2),
        family: FONTS.sans, fill: ink, anchor: 'middle', tracking: sheet.scale(2) * 0.12,
      }));
      const spokes = rng.int(8, 11) + Math.round(entropy * 4);
      const words = frag.text.split(/\s+/).filter(Boolean);
      const rot = rng.range(0, Math.PI * 2);
      for (let i = 0; i < spokes; i++) {
        const a = rot + (i / spokes) * Math.PI * 2 + rng.gauss(0, entropy * 0.05);
        const r0 = rMax * 0.22;
        const d = `M${r2(cx + Math.cos(a) * r0)} ${r2(cy + Math.sin(a) * r0)} L${r2(cx + Math.cos(a) * rMax)} ${r2(cy + Math.sin(a) * rMax)}`;
        const text = words.slice(i % words.length).concat(words).slice(0, rng.int(3, 6)).map(strip).join(' ');
        nodes.push(textOnPath(text, d, defs, {
          size: rng.range(10.5, 13), family: FONTS.serif, fill: ink, tracking: 0.6,
        }));
      }
      const rings = rng.int(1, 2);
      for (let i = 0; i < rings; i++) {
        const r = rMax * (0.5 + i * 0.32);
        const broken = entropy > 0.6 && rng.chance(entropy - 0.2);
        const sweep = broken ? rng.range(0.45, 0.8) : 1;
        const a0 = rng.range(0, Math.PI * 2);
        const a1 = a0 + Math.PI * 2 * sweep;
        const large = sweep > 0.5 ? 1 : 0;
        const d = broken
          ? `M${r2(cx + Math.cos(a0) * r)} ${r2(cy + Math.sin(a0) * r)} A${r2(r)} ${r2(r)} 0 ${large} 1 ${r2(cx + Math.cos(a1) * r)} ${r2(cy + Math.sin(a1) * r)}`
          : `M${r2(cx + r)} ${r2(cy)} A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx - r)} ${r2(cy)} A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx + r)} ${r2(cy)}`;
        nodes.push(textOnPath(frag.text, d, defs, {
          size: 11.5, family: FONTS.serif, style: 'italic',
          fill: palette.accent && i === 0 ? palette.accent : ink,
          startOffset: `${rng.int(0, 40)}%`,
        }));
      }
      title = `${hub.toLowerCase()}-océan`;
    }

    return { nodes: [defs, g({}, ...nodes)], title, attribution: frag.attribution, caption };
  },
};
