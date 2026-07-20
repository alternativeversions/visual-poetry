/*
 * aria — after John Cage, Aria (1958), and Cornelius Cardew, Treatise
 * (1963–67).
 *
 * The poem scored for a voice that will never sing it. Each phrase is
 * a system: five staff lines, an invented clef (Cardew's alphabet,
 * not a counterfeit G), syllables as noteheads placed by their vowel,
 * the words beneath as hyphenated lyrics. Punctuation conducts: ff,
 * fermata, tenuto, breath. The fragment's mood chooses the tempo
 * direction. One or two wordless swells cross the systems in the
 * accent — Aria's colored voice. At high entropy Treatise wins: the
 * staves themselves bend, and the lyrics follow the curve. License
 * break: the baseline grid gives way to curved staves.
 */

import { el, g, textEl, line, path, smoothPath, textOnPath, inkStroke, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const TEMPI = {
  still: 'quasi niente',
  elegiac: 'lento, sotto voce',
  ecstatic: 'con fuoco',
  wry: 'secco, parlando',
  cosmic: 'immenso, senza misura',
};
const DEG = { a: 0, e: 2, i: 4, o: 5, u: 8, y: 3 };

/* Diacritic-stripped skeleton, index-aligned with the input: each char's
   NFD decomposition puts the base letter first (é -> e + combining acute),
   so classification (syllable split, vowel degree) can run on ASCII while
   the original — accents intact — stays what gets displayed. */
function skeletonOf(s) {
  let out = '';
  for (let i = 0; i < s.length; i++) out += s[i].normalize('NFD')[0];
  return out;
}

const SYL_RE = /[^aeiouy]*[aeiouy]+(?:[^aeiouy]+(?![aeiouy]))?/g;

function syllables(word) {
  const w = word.toLowerCase().replace(/[^\p{L}'’]/gu, '');
  if (!w) return ['·'];
  const skel = skeletonOf(w);
  const parts = [];
  let m;
  SYL_RE.lastIndex = 0;
  while ((m = SYL_RE.exec(skel))) parts.push(w.slice(m.index, m.index + m[0].length));
  return parts.length ? parts : [w];
}

function phrasesOf(text, want) {
  let parts = text.split(/(?<=[,;:.!?—])\s*/).filter((p) => p.trim().length > 1);
  if (parts.length < 2) {
    const words = text.split(/\s+/).filter(Boolean);
    const per = Math.max(2, Math.ceil(words.length / want));
    parts = [];
    for (let i = 0; i < words.length; i += per) parts.push(words.slice(i, i + per).join(' '));
  }
  return parts.slice(0, want).length ? parts.slice(0, want) : [text || 'aria'];
}

export default {
  id: 'aria',
  name: 'aria',
  lineage: 'John Cage, Aria (1958); Cornelius Cardew, Treatise (1963–67)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 8, maxWords: 26 });
    const mood = frag.mood || rng.pick(Object.keys(TEMPI));
    const tempo = TEMPI[mood] || 'senza tempo';
    const phrases = phrasesOf(frag.text, rng.int(4, 6));
    const asemicLyrics = sheet.material === 'asemic';

    const gap = 7;
    const sysGap = box.h / (phrases.length + 0.6);
    const x0 = box.x + 46;
    const x1 = box.x + box.w - 10;
    const bend = entropy > 0.55 ? (entropy - 0.5) * 70 : 0;
    const defs = el('defs');
    const nodes = [];

    /* tempo direction */
    nodes.push(textEl(tempo, {
      x: box.x, y: box.y + 4, size: sheet.scale(0), family: FONTS.serif, style: 'italic', fill: ink,
    }));

    /* the invented clef: one seeded glyph, redrawn per system */
    const clefPts = [];
    for (let k = 0; k < 5; k++) clefPts.push([rng.range(-8, 8), k * gap - rng.range(0, 6)]);
    const clefWidths = clefPts.map(() => rng.range(1.2, 3.4));

    const sysTop = (i) => box.y + 40 + i * sysGap;
    const phase = rng.range(0.6, 1.8);
    const topAt = (i, x) => sysTop(i) + (bend ? Math.sin(((x - x0) / (x1 - x0)) * Math.PI * phase + i) * bend : 0);

    let totalSyl = 0;
    const parsed = phrases.map((p) => {
      const ws = p.split(/\s+/).filter(Boolean);
      const parts = ws.map((w) => ({ raw: w, syl: syllables(w) }));
      totalSyl += parts.reduce((n, w) => n + w.syl.length, 0);
      return parts;
    });

    parsed.forEach((wordsIn, i) => {
      /* staff: five lines, straight or bent */
      for (let k = 0; k < 5; k++) {
        if (!bend) {
          nodes.push(line(x0, sysTop(i) + k * gap, x1, sysTop(i) + k * gap, { stroke: ink, width: 0.7 }));
        } else {
          const pts = [];
          for (let x = x0; x <= x1; x += 40) pts.push([x, topAt(i, x) + k * gap]);
          nodes.push(path(smoothPath(pts), { stroke: ink, width: 0.7 }));
        }
      }
      /* clef */
      nodes.push(g({ transform: `translate(${r2(x0 - 26)} ${r2(topAt(i, x0))})` },
        inkStroke(clefPts, clefWidths, ink)));
      /* time signature, first system only */
      if (i === 0) {
        const nWords = frag.text.split(/\s+/).filter(Boolean).length;
        nodes.push(textEl(String(nWords), { x: x0 + 8, y: sysTop(0) + gap * 1.7, size: 15, family: FONTS.serif, weight: 'bold', fill: ink, anchor: 'middle' }));
        nodes.push(textEl(String(totalSyl), { x: x0 + 8, y: sysTop(0) + gap * 3.8, size: 15, family: FONTS.serif, weight: 'bold', fill: ink, anchor: 'middle' }));
      }
      /* noteheads and lyrics */
      const sylCount = wordsIn.reduce((n, w) => n + w.syl.length, 0) || 1;
      const step = (x1 - x0 - 40) / sylCount;
      let x = x0 + 30;
      wordsIn.forEach((w) => {
        const noteXs = [];
        w.syl.forEach((syl, si) => {
          const v = (skeletonOf(syl).match(/[aeiouy]/) || ['e'])[0];
          const off = entropy > 0.7 && rng.chance(entropy - 0.55) ? rng.gauss(0, gap * 2.2) : 0;
          const yN = topAt(i, x) + (8 - DEG[v]) * (gap / 2) + off;
          nodes.push(el('ellipse', {
            cx: r2(x), cy: r2(yN), rx: 4.4, ry: 3.1, fill: ink,
            transform: `rotate(-14 ${r2(x)} ${r2(yN)})`,
          }));
          noteXs.push([x, yN]);
          if (asemicLyrics) {
            const sq = [];
            for (let q = 0; q < 4; q++) sq.push([x - 6 + q * 4, topAt(i, x) + gap * 6 + rng.gauss(0, 1.5)]);
            nodes.push(inkStroke(sq, [0.8, 1.6, 1.2, 0.5], ink));
          } else {
            nodes.push(textEl(syl + (si < w.syl.length - 1 ? '-' : ''), {
              x, y: topAt(i, x) + gap * 6.4, size: 10.5, family: FONTS.serif, fill: ink, anchor: 'middle',
            }));
          }
          x += step;
        });
        /* slur over polysyllables */
        if (noteXs.length >= 3) {
          const [xa, ya] = noteXs[0];
          const [xb, yb] = noteXs[noteXs.length - 1];
          nodes.push(path(`M${r2(xa)} ${r2(ya - 7)} Q${r2((xa + xb) / 2)} ${r2(Math.min(ya, yb) - gap * 2)} ${r2(xb)} ${r2(yb - 7)}`,
            { stroke: ink, width: 0.8 }));
        }
        /* dynamics from the word's trailing punctuation */
        const tail = w.raw.match(/[!?,—]$/);
        const [lx, ly] = noteXs[noteXs.length - 1];
        if (tail) {
          if (tail[0] === '!') nodes.push(textEl(rng.pick(['f', 'ff', 'sfz']), {
            x: lx, y: topAt(i, lx) + gap * 8, size: 13, family: FONTS.serif, style: 'italic', weight: 'bold', fill: ink, anchor: 'middle',
          }));
          if (tail[0] === '?') {
            nodes.push(path(`M${r2(lx - 6)} ${r2(ly - 12)} A8 8 0 0 1 ${r2(lx + 6)} ${r2(ly - 12)}`, { stroke: ink, width: 0.9 }));
            nodes.push(el('circle', { cx: r2(lx), cy: r2(ly - 13), r: 1.3, fill: ink }));
            nodes.push(line(lx + 10, topAt(i, lx) + gap * 7.6, lx + 46, topAt(i, lx) + gap * 8.2, { stroke: ink, width: 0.7 }));
            nodes.push(line(lx + 10, topAt(i, lx) + gap * 8.8, lx + 46, topAt(i, lx) + gap * 8.2, { stroke: ink, width: 0.7 }));
          }
          if (tail[0] === '—') nodes.push(line(lx - 4, ly - 8, lx + 4, ly - 8, { stroke: ink, width: 1.4 }));
          if (tail[0] === ',') nodes.push(textEl('’', {
            x: lx + step * 0.4, y: topAt(i, lx) - 4, size: 15, family: FONTS.serif, fill: ink, anchor: 'middle',
          }));
        }
      });
    });

    /* the wordless voice: swells across systems, in the accent */
    const swells = rng.int(1, 2);
    for (let s = 0; s < swells; s++) {
      const iA = rng.int(0, Math.max(0, phrases.length - 2));
      const pts = [];
      const n = 6;
      const xa = rng.range(x0, x0 + (x1 - x0) * 0.3);
      const xb = rng.range(x0 + (x1 - x0) * 0.6, x1);
      /* clamp the swell's vertical run to a system's height (or less) so
         it reads as a gesture crossing the staff, not a page-dominating
         smudge when there are only a couple of systems to cross. */
      const span = Math.min(sysGap, box.h * 0.25);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        pts.push([xa + (xb - xa) * t, sysTop(iA) + t * span * rng.range(0.9, 1.6) + Math.sin(t * Math.PI * 2) * 18]);
      }
      const widths = pts.map((_, k) => 0.5 + Math.sin((k / n) * Math.PI) * rng.range(3, 6));
      nodes.push(inkStroke(pts, widths, palette.accent || ink));
    }

    return {
      nodes: [defs, g({}, ...nodes)],
      title: tempo,
      attribution: frag.attribution,
    };
  },
};
