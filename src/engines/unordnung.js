/*
 * unordnung — after Timm Ulrichs, "ordnung – unordnung" (1961), and
 * Claus Bremer, "lesbares in unlesbares übersetzen" — translating the
 * readable into the unreadable (1963).
 *
 * Ulrichs typed one word into a perfect grid and let its letters break
 * rank until order became disorder; Bremer performed the same collapse
 * on legibility itself. Here the top row is typescript in perfect
 * order. Reading downward, entropy accumulates: letters jitter off the
 * platen line, permute within their row (the same letters, the order
 * broken — the anagram as ruin), rotate, and finally fall out of the
 * text altogether, dropping through the empty lower page into a heap
 * of type on the bottom margin. A seeded sandpile stacks the fallen
 * letters, so the same seed always collapses into the same drift.
 */

import { g, textEl, r2 } from '../svg.js';
import { monoAdvance, FONTS } from '../typography.js';

export default {
  id: 'unordnung',
  name: 'unordnung',
  lineage: 'Timm Ulrichs, “ordnung – unordnung” (1961); Claus Bremer (1963)',
  paletteOpts: { accent: 'never' },

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const ink = sheet.palette.ink;
    const mono = FONTS.mono;
    const nodes = [];

    const w = source.word(rng);
    const word = w.text.toLowerCase();
    const attribution = w.attribution;

    /* ---- the grid: one word, repeated, typewriter-true ---- */
    const size = rng.range(16, 21);
    const adv = monoAdvance(size);
    const gridW = box.w * rng.range(0.68, 0.8);
    const charsPerRow = Math.max(word.length, Math.floor(gridW / adv));
    const reps = Math.max(1, Math.floor((charsPerRow + 1) / (word.length + 1)));
    const rowStr = Array(reps).fill(word).join(' ');
    const rowChars = rowStr.length;
    const rows = rng.int(14, 20);
    const x0 = sheet.width / 2 - (rowChars * adv) / 2;
    const y0 = sheet.line(2);
    const floorY = box.y + box.h; // where fallen type comes to rest

    /* how far order has failed by row r: 0 = typescript, 1 = ruin */
    const strength = 0.55 + entropy * 0.6;
    const disorder = (r) => Math.pow(r / Math.max(1, rows - 1), 1.35) * strength;

    /* ---- the heap: seeded sandpile along the bottom margin.
     * Fallen type drifts toward one spot, the way sweepings do. ---- */
    const buckets = new Map();
    const heap = [];
    const falling = [];
    const driftX = x0 + rowChars * adv * rng.range(0.3, 0.7);
    const dropLetter = (ch, xTargetRaw, fromY) => {
      const xTarget = driftX + (xTargetRaw - driftX) * 0.45;
      const d = rng();
      if (d < 0.18) {
        /* caught mid-fall */
        const y = fromY + (floorY - size - fromY) * rng.range(0.2, 0.85);
        const x = xTarget + rng.gauss(0, adv * 0.6);
        falling.push(textEl(ch, {
          x, y, size, family: mono, fill: ink, anchor: 'middle',
          transform: `rotate(${r2(rng.range(-80, 80))} ${r2(x)} ${r2(y)})`,
        }));
        return;
      }
      let b = Math.round((xTarget + rng.gauss(0, adv * 1.2)) / adv);
      for (let k = 0; k < 3; k++) { // grains roll toward the lower neighbor
        const cur = buckets.get(b) || 0;
        const left = buckets.get(b - 1) || 0;
        const right = buckets.get(b + 1) || 0;
        if (left < cur - size * 0.5) b -= 1;
        else if (right < cur - size * 0.5) b += 1;
        else break;
      }
      const h = buckets.get(b) || 0;
      const x = b * adv + rng.range(-2, 2);
      const y = floorY - h - size * 0.14;
      buckets.set(b, h + size * rng.range(0.42, 0.58));
      heap.push(textEl(ch, {
        x, y, size, family: mono, fill: ink, anchor: 'middle',
        transform: `rotate(${r2(rng.range(-100, 100))} ${r2(x)} ${r2(y)})`,
      }));
    };

    /* ---- the rows ---- */
    for (let r = 0; r < rows; r++) {
      const d = disorder(r);
      const y = y0 + r * baseline;

      if (d < 0.04) {
        /* perfect typescript: one run, exact advance */
        nodes.push(textEl(rowStr, {
          x: x0, y, size, family: mono, fill: ink,
          tracking: adv - monoAdvance(size), preserveSpace: true,
        }));
        continue;
      }

      /* letter by letter: permute a share of the row, then perturb */
      const chars = rowStr.split('');
      const idx = [];
      for (let k = 0; k < chars.length; k++) if (chars[k] !== ' ') idx.push(k);
      const swapCount = Math.round(idx.length * Math.min(1, d * 0.85));
      const chosen = rng.shuffle(idx).slice(0, swapCount);
      const permuted = rng.shuffle(chosen);
      const replaced = chosen.map((k, i) => chars[permuted[i]]);
      chosen.forEach((k, i) => { chars[k] = replaced[i]; });

      for (let k = 0; k < chars.length; k++) {
        const ch = chars[k];
        if (ch === ' ') continue;
        const cellX = x0 + (k + 0.5) * adv;
        if (rng.chance(d * d * 0.5)) {
          dropLetter(ch, cellX, y);
          continue;
        }
        const dx = rng.gauss(0, d * adv * 0.5);
        const dy = rng.gauss(0, d * baseline * 0.42);
        const rot = rng.gauss(0, d * 42);
        const x = cellX + dx;
        nodes.push(textEl(ch, {
          x, y: y + dy, size, family: mono, fill: ink, anchor: 'middle',
          transform: Math.abs(rot) > 1.5 ? `rotate(${r2(rot)} ${r2(x)} ${r2(y + dy)})` : null,
        }));
      }
    }

    nodes.push(...falling, ...heap);

    let anagram = rng.shuffle(word.split('')).join('');
    if (anagram === word) anagram = word.split('').reverse().join('');
    return {
      nodes: [g({}, ...nodes)],
      title: `${word} / ${anagram}`,
      attribution,
    };
  },
};
