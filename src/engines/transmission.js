/*
 * transmission — after the character-built picture in all three of its
 * lives: Flora F. F. Stacey's typewriter butterfly (1898), the first
 * surviving typewriter artwork; Knowlton & Harmon's "Studies in
 * Perception I" (Bell Labs, 1966), a photograph rebuilt from typed
 * symbols by brightness; and the radioteletype picture (1960s–), which
 * arrived scanline by scanline over the air and did not always finish.
 *
 * A picture is received. The test tape runs first — RYRYRY, R and Y
 * because they are Boolean complements in Baudot code, two letters
 * that are each other's opposites repeated to prove the line is alive.
 * The header promises IMG 1 OF 2. The image builds downward out of the
 * poem's own letters, ordered by ink weight; partway down the signal
 * degrades — substitutions, dropouts, the platen slipping — and then
 * the carrier is lost. What should have been the rest of the picture
 * arrives as language instead: the poem's last words in plain
 * teletype, then NNNN, end of message. The header for the second
 * image prints, and nothing follows it. At the foot, the operator's
 * sign-off: SK — end of contact, which is also what operators call
 * one of their own who has died.
 */

import { g, textEl, r2 } from '../svg.js';
import { monoAdvance, breakLines, FONTS } from '../typography.js';
import { SUBJECTS, gridSampler } from '../text/subjects.js';
import { cachedShape, shapeCandidates } from '../text/aiParser.js';

/* character weights, light to heavy; the ramp is rebuilt per render
 * from only the poem's own letters */
const WEIGHT = ' `.-\':_,^=;i!l~+<>?*rcvxzjstJ7fneoauyqpdbkhgFEPSAUXKHRBDGNQWM';

export default {
  id: 'transmission',
  name: 'transmission',
  lineage: 'Stacey (1898); Knowlton & Harmon (1966); the RTTY picture (1960s–)',

  generate(rng, source, sheet) {
    const { box, entropy } = sheet;
    const ink = sheet.palette.ink;
    const accent = sheet.palette.accent;
    const mono = FONTS.mono;
    const nodes = [];

    const frag = source.fragment(rng, { minWords: 10, maxWords: 28 });
    const words = frag.text.split(/\s+/).filter(Boolean);

    /* ---- the ramp: the poem's letters in four hard bands, the
     * line-printer's trick — space, punctuation, lowercase, CAPITALS —
     * so the picture resolves whatever letters the poem happens to
     * offer ---- */
    const seen = new Set();
    const lower = [];
    const punct = [];
    for (const ch of frag.text.toLowerCase()) {
      if (seen.has(ch)) continue;
      seen.add(ch);
      if (/\p{L}/u.test(ch)) lower.push(ch);
      else if (/[.,;:'!?]/.test(ch)) punct.push(ch);
    }
    if (!punct.length) punct.push('.', ',');
    if (lower.length < 4) lower.push('o', 'n', 'e', 's');
    lower.sort((a, b) => WEIGHT.indexOf(a) - WEIGHT.indexOf(b));
    const caps = lower.map((c) => c.toUpperCase());
    const band = (arr, t) => arr[Math.max(0, Math.min(arr.length - 1, Math.floor(t * arr.length)))];
    const ramp = [...punct, ...lower, ...caps]; // for noise substitutions
    const charAt = (v) => {
      if (v < 0.14) return ' ';
      if (v < 0.32) return band(punct, (v - 0.14) / 0.18);
      if (v < 0.62) return band(lower, (v - 0.32) / 0.3);
      return band(caps, (v - 0.62) / 0.38);
    };

    /* ---- the grid ---- */
    const cols = rng.int(74, 88);
    const gridW = box.w * rng.range(0.86, 0.93);
    const cellW = gridW / cols;
    const size = cellW / 0.6; // Courier advance is exactly 0.6 em
    const cellH = size * 1.06;
    const rows = Math.min(Math.floor((box.h * 0.6) / cellH), Math.round(cols * 0.78));
    const x0 = sheet.width / 2 - gridW / 2;
    const imgW = cols * cellW;
    const imgH = rows * cellH;

    /* ---- where the carrier will drop: decided first, so the subject
     * is composed inside the scanlines that will actually arrive ---- */
    const failRow = Math.round(rows * (rng.range(0.58, 0.84) - entropy * 0.06));
    const liveH = failRow * cellH;

    /* ---- the subject: a brightness field, ink 0..1 — three composed
     * procedurally, the rest sampled from the tapes in the drawer
     * (subjects.js). In user mode, if the local model has already
     * drawn one of the poem's own nouns (the amendment: cache-only
     * here, never the network), the poem's subject takes the slot ---- */
    let oracle = null;
    if (source.mode === 'user' && source.userText) {
      const cands = shapeCandidates(source.userText, 3);
      if (cands.length) {
        const word = rng.pick(cands);
        const rows = cachedShape(word);
        if (rows) oracle = { word, rows };
      }
    }
    const subject = oracle ? `the ${oracle.word}` : rng.pick([
      'the moon', 'the lit window', 'the door ajar',
      ...SUBJECTS.map((s) => s.name),
    ]);
    const curated = oracle || SUBJECTS.find((s) => s.name === subject);
    let field; // (px, py) -> { v, glow }
    if (curated) {
      /* square grid pixels, letterboxed into the scanlines that will
       * actually arrive; edge clamping carries grounds outward */
      const sample = gridSampler(curated.rows);
      const W = curated.rows[0].length;
      const H = curated.rows.length;
      const unit = Math.min(imgW / W, liveH / H);
      const ox = (imgW - W * unit) / 2;
      const oy = (liveH - H * unit) / 2;
      field = (px, py) => ({ v: sample((px - ox) / (W * unit), (py - oy) / (H * unit)) });
    } else if (subject === 'the moon') {
      const cx = imgW * rng.range(0.42, 0.58);
      const cy = liveH * rng.range(0.42, 0.52);
      const R = liveH * rng.range(0.32, 0.4);
      const dir = rng.chance(0.5) ? 1 : -1;
      const ph = rng.range(0.5, 0.9); // how far the shadow has come
      const maria = [];
      for (let i = 0; i < rng.int(2, 4); i++) {
        maria.push({
          x: cx + rng.range(-0.45, 0.45) * R, y: cy + rng.range(-0.45, 0.45) * R,
          r: R * rng.range(0.16, 0.3),
        });
      }
      const stars = new Set();
      for (let i = 0; i < Math.round(cols * rows * 0.012); i++) {
        stars.add(rng.int(0, rows - 1) * cols + rng.int(0, cols - 1));
      }
      field = (px, py, c, r) => {
        const d = Math.hypot(px - cx, py - cy);
        if (d < R) {
          const shadow = Math.hypot(px - (cx + dir * R * ph * 1.5), py - cy) < R;
          if (shadow) return { v: 0.84 - (py / imgH) * 0.06 };
          let v = 0.06;
          for (const m of maria) if (Math.hypot(px - m.x, py - m.y) < m.r) v += 0.16;
          return { v: Math.min(v, 0.3) };
        }
        if (stars.has(r * cols + c)) return { v: 0.02 };
        return { v: 0.82 - (py / imgH) * 0.08 };
      };
    } else if (subject === 'the lit window') {
      const hx0 = imgW * 0.3, hx1 = imgW * 0.72;
      const hy0 = liveH * 0.3, ground = liveH * 0.86;
      const wx0 = imgW * rng.range(0.4, 0.48), wx1 = wx0 + imgW * 0.09;
      const wy0 = liveH * rng.range(0.44, 0.52), wy1 = wy0 + liveH * 0.15;
      field = (px, py) => {
        if (px > wx0 && px < wx1 && py > wy0 && py < wy1) return { v: 0.04, glow: true };
        const peak = (hx0 + hx1) / 2;
        const roofY = hy0 - (1 - Math.abs(px - peak) / ((hx1 - hx0) / 2)) * liveH * 0.16;
        if (px > hx0 && px < hx1 && py > Math.max(roofY, hy0 - liveH * 0.16) && py < ground) {
          /* lamplight spills a little way into the house's dark */
          const dw = Math.hypot(px - (wx0 + wx1) / 2, (py - (wy0 + wy1) / 2) * 0.7);
          return { v: Math.min(0.95, 0.55 + dw / (imgW * 0.12)) };
        }
        if (py >= ground) return { v: 0.52 };
        return { v: 0.36 + (1 - py / liveH) * 0.12 };
      };
    } else {
      /* the door ajar: one wedge of light in a dark room */
      const sx = imgW * rng.range(0.42, 0.62);
      field = (px, py) => {
        const t = Math.min(1, py / liveH);
        const slit = imgW * (0.016 + t * t * 0.055);
        const d = Math.abs(px - sx);
        if (d < slit) return { v: 0.03, glow: true };
        if (d < slit * 3.2) return { v: 0.3 + ((d - slit) / (slit * 2.2)) * 0.5 };
        return { v: 0.88 - t * 0.05 };
      };
    }

    /* ---- teletype furniture ---- */
    const lineText = (str, x, y, opts = {}) => textEl(str, {
      x, y, size: opts.size || size, family: mono, fill: opts.fill || ink,
      opacity: opts.opacity, preserveSpace: true, tracking: opts.tracking,
    });
    let y = sheet.snap(box.y + cellH);
    nodes.push(lineText('RY'.repeat(Math.floor(cols / 2)), x0, y, { opacity: 0.22 }));
    y += cellH * 1.6;
    const utc = `${String(rng.int(0, 23)).padStart(2, '0')}${String(rng.int(0, 59)).padStart(2, '0')}`;
    nodes.push(lineText(`RCVD ${utc} UTC · IMG 1 OF 2 · ${subject.toUpperCase()}`, x0, y, { size: size * 0.95, opacity: 0.7 }));
    y += cellH * 1.7;

    /* ---- the picture, scanline by scanline, until the carrier drops ---- */
    const yImg = y;
    for (let r = 0; r < failRow; r++) {
      const ruin = Math.max(0, (r - failRow * 0.7) / (failRow * 0.3)); // 0 clean -> 1 dying
      const p = ruin * ruin * 0.65;
      let inkRow = '';
      let glowRow = '';
      let hasGlow = false;
      for (let c = 0; c < cols; c++) {
        const cell = field(c * cellW + cellW / 2, r * cellH + cellH / 2, c, r);
        let ch = charAt(Math.max(0, Math.min(1, cell.v + rng.gauss(0, 0.012 + cell.v * 0.035))));
        if (p > 0 && rng.chance(p * 0.5)) ch = rng.pick(ramp); // substitution noise
        if (p > 0 && rng.chance(p * 0.3)) ch = ' '; // dropout
        if (cell.glow && accent && ch !== ' ') {
          glowRow += ch; inkRow += ' '; hasGlow = true;
        } else {
          inkRow += ch; glowRow += ' ';
        }
      }
      const slip = p > 0 && rng.chance(p * 0.5) ? rng.int(-3, 4) * cellW : 0;
      const ry = yImg + r * cellH;
      nodes.push(lineText(inkRow, x0 + slip, ry));
      if (hasGlow) nodes.push(lineText(glowRow, x0 + slip, ry, { fill: accent }));
      if (p > 0 && rng.chance(p * 0.18)) {
        /* the platen stutters: the same line prints again, displaced */
        nodes.push(lineText(inkRow, x0 + slip + rng.int(1, 3) * cellW, ry + cellH * 0.45, { opacity: 0.5 }));
      }
    }
    /* a last partial line, mostly noise, then nothing */
    let tail = '';
    const tailLen = rng.int(4, Math.max(5, Math.floor(cols * 0.4)));
    for (let c = 0; c < tailLen; c++) tail += rng.chance(0.4) ? ' ' : rng.pick(ramp);
    nodes.push(lineText(tail, x0, yImg + failRow * cellH, { opacity: 0.75 }));

    /* ---- what should have been the picture arrives as language ---- */
    let cy = yImg + rows * cellH + cellH * 1.4;
    const coda = words.slice(-rng.int(6, 10)).join(' ');
    for (const ln of breakLines(coda, imgW * 0.9, { size, family: mono }).slice(0, 3)) {
      nodes.push(lineText(ln, x0, cy, { opacity: 0.85 }));
      cy += cellH * 1.15;
    }
    cy += cellH * 0.6;
    nodes.push(lineText('NNNN', x0, cy, { opacity: 0.6 }));
    cy += cellH * 2.2;
    const second = rng.pick([
      'the moon', 'the lit window', 'the door ajar', 'the garden', 'the harbor',
      ...SUBJECTS.map((s) => s.name),
    ].filter((s) => s !== subject));
    nodes.push(lineText(`RCVD —— UTC · IMG 2 OF 2 · ${second.toUpperCase()}`, x0, cy, { size: size * 0.95, opacity: 0.38 }));
    /* nothing follows it */

    /* ---- the footnote owns the picture's provenance ---- */
    if (oracle) {
      nodes.push(lineText('silhouette by a local model', x0, box.y + box.h,
        { size: size * 0.9, opacity: 0.45 }));
    }
    nodes.push(lineText('SK', x0 + imgW - size * 1.4, box.y + box.h, { opacity: 0.5 }));

    return {
      nodes: [g({}, ...nodes)],
      title: `${subject}, interrupted`,
      attribution: frag.attribution,
      caption: 'after the RTTY picture, via Knowlton & Harmon’s Studies in Perception I (1966)'
        + (oracle ? ' · silhouette by a local model' : ''),
    };
  },
};
