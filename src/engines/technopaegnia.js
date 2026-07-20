/*
 * technopaegnia — after Simias of Rhodes, "The Axe" (c. 300 BCE), and
 * George Herbert, "Easter Wings" and "The Altar" (1633).
 *
 * Text is poured into a silhouette: per-line width budgets are computed
 * from a shape function, corpus lines are fitted by measurement and
 * hyphenated the way a seventeenth-century printer would. Centered
 * serif; optionally the type itself diminishes toward the waist, as
 * Herbert's wings thin to "Most poore" — the shrinking is the theology.
 */

import { g, textEl, line, smallCapsText } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { asemicLine } from './asemic.js';
import { cachedProfile, shapeCandidates } from '../text/aiParser.js';

/*
 * Shape functions: f(t in 0..1) -> width fraction of the measure.
 * `blocks` splits the poem into stanzas that each run the shape
 * (Herbert's wings are two diminishing-then-rising stanzas).
 */
const SHAPES = [
  {
    name: 'wings',
    blocks: 2,
    lines: [8, 10],
    f: (t) => 0.16 + 0.84 * Math.abs(1 - 2 * t),
    diminish: true,
  },
  {
    name: 'altar',
    blocks: 1,
    lines: [11, 14],
    f: (t) => (t < 0.22 ? 1 : t < 0.72 ? 0.3 : 0.95),
    diminish: false,
  },
  {
    name: 'axe',
    blocks: 1,
    lines: [10, 13],
    // double-bitted head tapering to a haft
    f: (t) => (t < 0.55 ? 1 - t * 1.35 : 0.24),
    diminish: true,
  },
  {
    name: 'hourglass',
    blocks: 1,
    lines: [11, 15],
    f: (t) => 0.14 + 0.86 * Math.pow(Math.abs(1 - 2 * t), 1.6),
    diminish: true,
  },
  {
    name: 'wave',
    blocks: 1,
    lines: [12, 16],
    f: (t, phase) => 0.62 + 0.38 * Math.sin(t * Math.PI * 2.4 + phase),
    diminish: false,
  },
  {
    name: 'column',
    blocks: 1,
    lines: [12, 16],
    f: (t) => (t < 0.09 || t > 0.93 ? 0.98 : 0.5),
    diminish: false,
  },
];

/** Pull fragments until their measured length covers `budgetPx` of set text. */
function gatherWords(rng, source, budgetPx, size) {
  const words = [];
  let attribution = null;
  let gathered = 0;
  let guard = 0;
  while (gathered < budgetPx * 1.2 && guard++ < 40) {
    const frag = source.fragment(rng, { minWords: 5, maxWords: 20 });
    for (const w of frag.text.split(/\s+/)) {
      words.push(w);
      gathered += measure(w + ' ', { size, family: FONTS.serif });
    }
    if (!attribution) attribution = frag.attribution;
    else if (guard === 2) attribution += ' · ' + frag.attribution;
  }
  return { words, attribution };
}

export default {
  id: 'technopaegnia',
  name: 'technopaegnia',
  lineage: 'Simias of Rhodes, “The Axe” (c. 300 BCE); Herbert, “Easter Wings” (1633)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const serif = FONTS.serif;
    /* the amendment: in user mode, if the local model has already read
     * one of the poem's own nouns as a width profile (cache only —
     * never the network), the poem takes its subject's silhouette */
    let oracle = null;
    if (source.mode === 'user' && source.userText) {
      const cands = shapeCandidates(source.userText, 3);
      if (cands.length) {
        const word = rng.pick(cands);
        const widths = cachedProfile(word);
        if (widths) {
          oracle = { word };
          oracle.shape = {
            name: `the ${word}`,
            blocks: 1,
            lines: [Math.max(10, widths.length - 4), widths.length],
            f: (t) => {
              const x = t * (widths.length - 1);
              const a = Math.floor(x);
              return widths[a] + (widths[Math.min(a + 1, widths.length - 1)] - widths[a]) * (x - a);
            },
            diminish: false,
          };
        }
      }
    }
    const shape = oracle ? oracle.shape : rng.pick(SHAPES);
    const phase = rng.range(0, Math.PI * 2);
    /* a drawn profile reads top-down; never flip the model's subject */
    const flip = rng.chance(0.35 * (0.5 + entropy)) && !oracle; // taper direction
    const emblemRules = rng.chance(0.55);

    const nLines = rng.int(shape.lines[0], shape.lines[1]);
    const totalLines = nLines * shape.blocks + (shape.blocks - 1) * 2;
    // the silhouette should command the sheet: ~62% of the content height
    const leading = Math.max(baseline, Math.round((box.h * 0.62) / totalLines / baseline) * baseline);
    const baseSize = Math.min(leading * 0.66, sheet.scale(2));
    const measureW = box.w * 0.92;
    const cx = sheet.width / 2;

    // total ink budget: the sum of every line's width at its size
    let inkBudget = 0;
    for (let b = 0; b < shape.blocks; b++) {
      for (let i = 0; i < nLines; i++) {
        const t = nLines === 1 ? 0 : i / (nLines - 1);
        const frac = Math.max(0.1, Math.min(1, shape.f(t, phase)));
        inkBudget += Math.max(baseSize * 2.2, measureW * frac);
      }
    }
    const { words, attribution } = gatherWords(rng, source, inkBudget, baseSize);
    const queue = words.slice();

    const nodes = [];
    const blockH = totalLines * leading;
    let y = sheet.snap(box.y + Math.max(0, (box.h - blockH) / 2)) + leading;

    if (emblemRules) {
      const ruleW = measureW * 0.6;
      const ry = y - leading * 1.5;
      nodes.push(line(cx - ruleW / 2, ry, cx + ruleW / 2, ry, { stroke: sheet.palette.ink, width: 2 }));
      nodes.push(line(cx - ruleW / 2, ry + 5, cx + ruleW / 2, ry + 5, { stroke: sheet.palette.ink, width: 0.7 }));
    }

    /** Fill one line to `budget` px at `size`, hyphenating as a printer would. */
    const fillLine = (budget, size) => {
      const opts = { size, family: serif };
      let text = '';
      while (queue.length) {
        const word = queue[0];
        const trial = text ? text + ' ' + word : word;
        if (measure(trial, opts) <= budget) {
          text = trial;
          queue.shift();
        } else if (!text || measure(text, opts) < budget * 0.55) {
          // the line is still too empty: hyphenate the next word
          let cut = word.length - 2;
          while (cut > 2 && measure((text ? text + ' ' : '') + word.slice(0, cut) + '-', opts) > budget) cut--;
          if (cut > 2) {
            text = (text ? text + ' ' : '') + word.slice(0, cut) + '-';
            queue[0] = word.slice(cut);
          }
          break;
        } else break;
      }
      return text;
    };

    // crossbreed: the silhouette filled with asemic near-writing
    const asemicFill = sheet.material === 'asemic';
    const lengths = asemicFill
      ? words.map((w) => w.replace(/[^\p{L}]/gu, '').length || 3)
      : null;

    for (let b = 0; b < shape.blocks; b++) {
      for (let i = 0; i < nLines; i++) {
        let t = nLines === 1 ? 0 : i / (nLines - 1);
        if (flip) t = 1 - t;
        const frac = Math.max(0.1, Math.min(1, shape.f(t, phase)));
        const size = shape.diminish ? baseSize * (0.55 + 0.45 * frac) : baseSize;
        const budget = Math.max(size * 2.2, measureW * frac);
        if (asemicFill) {
          nodes.push(...asemicLine(rng, cx - budget / 2, y, budget, size * 0.8, sheet.palette.ink, {
            justify: true, lengths, slant: 0.12,
          }).nodes);
        } else {
          const text = fillLine(budget, size);
          if (text) {
            nodes.push(textEl(text, {
              x: cx, y, size, family: serif, anchor: 'middle', fill: sheet.palette.ink,
            }));
          }
        }
        y += leading;
      }
      y += leading * 2; // stanza break between wings
    }

    if (emblemRules) {
      const ruleW = measureW * 0.6;
      const ry = y - leading * 1.6;
      nodes.push(line(cx - ruleW / 2, ry, cx + ruleW / 2, ry, { stroke: sheet.palette.ink, width: 0.7 }));
      nodes.push(line(cx - ruleW / 2, ry + 4, cx + ruleW / 2, ry + 4, { stroke: sheet.palette.ink, width: 2 }));
    }

    /* ---- the footnote owns the silhouette ---- */
    if (oracle) {
      nodes.push(smallCapsText('silhouette by a local model', {
        x: cx, y: box.y + box.h, size: 10, family: serif,
        anchor: 'middle', fill: sheet.palette.ink, opacity: 0.55,
      }));
    }

    return {
      nodes: [g({}, ...nodes)],
      title: `${shape.name}, poured`,
      attribution,
      caption: oracle
        ? 'after the Greek technopaegnia (4th c. BCE) · silhouette by a local model'
        : null,
    };
  },
};
