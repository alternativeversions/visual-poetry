/*
 * gloss — after the Talmud page Daniel Bomberg standardized at Venice
 * (1519/20–23), following Soncino: the terse text at the center, Rashi
 * inside, Tosafot outside, centuries answering each other on one
 * sheet; after Jacques Derrida's Glas (1974), whose two columns argue
 * past one another in a layout critics read as Talmudic; and after
 * Edmond Jabès, The Book of Questions (1963–), a private Talmud whose
 * imaginary rabbis comment on a scripture of silence.
 *
 * The page as conversation. One short utterance sits in the middle in
 * large type. Around it the commentary accumulates: glosses in
 * different faces and sizes — different centuries, different voices —
 * each keyed to a word of the center by an apparatus mark (* † ‡ §)
 * and opening with its lemma in small caps, the old convention of
 * quoting your interlocutor before you answer them. One gloss strikes
 * a word and corrects itself above the line. The farther the
 * commentary stands from the center, the fainter it prints, and the
 * last voice trails off mid-sentence — the conversation is longer
 * than the context that holds it. Sometimes a lone italic question
 * closes the page, which is how conversations like this one end:
 * not with an answer.
 */

import { g, textEl, line, smallCapsText, r2 } from '../svg.js';
import { measure, breakLines, FONTS } from '../typography.js';
import { asemicLine } from './asemic.js';

const MARKS = ['*', '†', '‡', '§'];
const CONNECTIVES = ['But see:', 'Others read:', 'Against this,', 'That is,', 'cf.', 'Elsewhere:', 'And yet —', 'sc.'];

export default {
  id: 'gloss',
  name: 'gloss',
  lineage: 'Bomberg’s Talmud page (1523); Derrida, Glas (1974); Jabès (1963–)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, entropy } = sheet;
    const ink = sheet.palette.ink;
    const accent = sheet.palette.accent;
    const asemicGloss = sheet.material === 'asemic';
    const serif = FONTS.serif;
    const nodes = [];
    const atts = [];

    /* ---- the utterance ---- */
    const central = source.fragment(rng, { minWords: 4, maxWords: 14 });
    atts.push(central.attribution);
    const cs = sheet.scale(2) * rng.range(0.92, 1.05);
    const cw = box.w * rng.range(0.42, 0.47);
    const cx0 = box.x + box.w * rng.range(0.24, 0.29);
    const cLines = breakLines(central.text, cw, { size: cs, family: serif });
    const cLeading = cs * 1.32;
    const cH = cLines.length * cLeading;
    const cy0 = sheet.snap(box.y + box.h * rng.range(0.34, 0.44) - cH / 2);

    /* the lemmata: which of the center's words the voices seize on */
    const seen = new Set();
    const lemmata = [];
    for (const raw of central.text.split(/\s+/)) {
      const bare = raw.toLowerCase().replace(/[^\p{L}'-]/gu, '');
      if (bare.length >= 4 && !seen.has(bare) && lemmata.length < MARKS.length) {
        seen.add(bare);
        lemmata.push({ word: bare, marker: MARKS[lemmata.length] });
      }
    }

    /* set the center word by word so the marks can hang off it */
    const marked = new Set();
    cLines.forEach((ln, li) => {
      let x = cx0;
      const y = cy0 + li * cLeading + cs;
      for (const word of ln.split(' ')) {
        const ww = measure(word, { size: cs, family: serif });
        nodes.push(textEl(word, { x, y, size: cs, family: serif, fill: ink }));
        const bare = word.toLowerCase().replace(/[^\p{L}'-]/gu, '');
        const lem = lemmata.find((l) => l.word === bare);
        if (lem && !marked.has(bare)) {
          marked.add(bare);
          nodes.push(textEl(lem.marker, {
            x: x + ww + 1.5, y: y - cs * 0.45, size: cs * 0.55,
            family: serif, fill: accent || ink,
          }));
        }
        x += ww + measure(' ', { size: cs, family: serif });
      }
    });

    /* ---- the voices ---- */
    const voices = [
      { family: serif, style: 'normal', size: 12, leading: 16 },
      { family: serif, style: 'italic', size: 12, leading: 16 },
      { family: FONTS.sans, style: 'normal', size: 11, leading: 15 },
      { family: FONTS.mono, style: 'normal', size: 10.5, leading: 15 },
    ];
    let voiceAt = 0;
    let glossAt = 0;
    const OPACITY = [1, 0.94, 0.88, 0.8, 0.72, 0.64, 0.56, 0.48, 0.4, 0.34, 0.28];
    let lemmaAt = 0;

    const nextGloss = () => {
      const f = source.fragment(rng, { minWords: 8, maxWords: 30 });
      atts.push(f.attribution);
      const lem = lemmaAt < lemmata.length ? lemmata[lemmaAt++] : null;
      const opacity = OPACITY[Math.min(glossAt, OPACITY.length - 1)];
      glossAt++;
      return {
        lemma: lem ? lem.word : null,
        marker: lem ? lem.marker : null,
        text: lem ? f.text : `${rng.pick(CONNECTIVES)} ${f.text}`,
        opacity,
        trail: opacity < 0.45 && rng.chance(0.6), // far memory trails off
        correct: false,
        fix: null,
      };
    };

    /* one voice corrects itself, the way working conversations do */
    let correction = rng.chance(0.75) ? rng.int(1, 4) : -1;

    const renderGloss = (x, w, yStart, yMax, opts) => {
      const voice = voices[voiceAt++ % voices.length];
      const mOpts = { size: voice.size, family: voice.family, style: voice.style };
      let y = yStart;
      if (opts.lemma) {
        nodes.push(textEl(opts.marker, {
          x, y, size: voice.size, family: serif, fill: accent || ink, opacity: opts.opacity,
        }));
        const mw = measure(opts.marker, { size: voice.size, family: serif }) + 4;
        const head = smallCapsText(opts.lemma + ']', {
          x: x + mw, y, size: voice.size + 1, family: serif, fill: ink, opacity: opts.opacity,
        });
        nodes.push(head);
        y += voice.leading * 1.15;
      }
      if (asemicGloss) {
        const rows = rng.int(3, 6);
        const marks = [];
        for (let i = 0; i < rows && y < yMax; i++) {
          const res = asemicLine(rng, x, y, w * rng.range(0.86, 1), voice.size * 0.85, ink);
          marks.push(...res.nodes);
          y += voice.leading;
        }
        nodes.push(g({ opacity: opts.opacity !== 1 ? opts.opacity : null }, ...marks));
        return y;
      }
      let lines = breakLines(opts.text, w, mOpts);
      const fit = Math.max(1, Math.floor((yMax - y) / voice.leading));
      const cut = opts.trail ? Math.min(lines.length, rng.int(2, 4)) : fit;
      if (lines.length > cut) {
        lines = lines.slice(0, cut);
        lines[lines.length - 1] = lines[lines.length - 1].replace(/[.,;:!?]$/, '') + ' —';
      }
      lines.forEach((ln, li) => {
        nodes.push(textEl(ln, {
          x, y: y + li * voice.leading, size: voice.size, family: voice.family,
          style: voice.style, fill: ink, opacity: opts.opacity,
        }));
      });
      if (opts.correct && lines.length > 1) {
        const li = rng.int(1, lines.length - 1);
        const words = lines[li].split(' ');
        const wi = rng.int(0, Math.max(0, words.length - 2));
        const prefix = words.slice(0, wi).join(' ') + (wi ? ' ' : '');
        const px = x + measure(prefix, mOpts);
        const ww = measure(words[wi], mOpts);
        const ly = y + li * voice.leading;
        nodes.push(line(px, ly - voice.size * 0.32, px + ww, ly - voice.size * 0.32, {
          stroke: ink, width: 0.8, opacity: opts.opacity,
        }));
        nodes.push(textEl(opts.fix, {
          x: px, y: ly - voice.size * 0.95, size: voice.size * 0.82,
          family: serif, style: 'italic', fill: accent || ink, opacity: opts.opacity,
        }));
      }
      return y + lines.length * voice.leading;
    };

    /* ---- the daf: inner column, outer column, and the center's own
     * band of commentary above and below the utterance ---- */
    const gap = () => rng.range(18, 34);
    const innerW = cx0 - box.x - 26;
    const outerX = cx0 + cw + 26;
    const outerW = box.x + box.w - outerX;
    /* fill while there is page: the conversation stops only where the
     * sheet does, fainter the whole way down */
    const fillColumn = (x, w, yStart, yMax, cap) => {
      let y = yStart;
      for (let i = 0; i < cap && y < yMax - 70; i++) {
        const opts = nextGloss();
        if (correction === glossAt - 1) {
          opts.correct = true;
          opts.fix = source.word(rng).text;
        }
        y = renderGloss(x, w, y, yMax, opts) + gap();
      }
    };

    const yTop = box.y + rng.range(0, 20);
    const yBottom = box.y + box.h;
    /* above the utterance, in its own column */
    fillColumn(cx0, cw, yTop, cy0 - 34, 2);
    /* the outer column (Tosafot), taller and louder */
    fillColumn(outerX, outerW, yTop + rng.range(0, 60), yBottom, 9);
    /* the inner column (Rashi), narrow */
    if (innerW > 88) fillColumn(box.x, innerW, yTop + rng.range(20, 90), yBottom, 7);
    /* below the utterance */
    fillColumn(cx0 + cw * 0.08, cw * 0.84, cy0 + cH + 40, yBottom - 60, 5);

    /* ---- the Jabès close: a page that ends on a question ---- */
    if (rng.chance(0.65) && lemmata.length) {
      const lemma = rng.pick(lemmata).word;
      const q = rng.pick([
        `and if ${lemma} —?`,
        `who is speaking?`,
        `${lemma}, again?`,
        `answered where?`,
        `and ${lemma} answers nothing.`,
      ]);
      nodes.push(textEl(q, {
        x: cx0 + cw / 2, y: sheet.snap(yBottom - 6), size: 13.5, family: serif,
        style: 'italic', anchor: 'middle', fill: ink, opacity: 0.85,
      }));
    }

    const uniq = [...new Set(atts)];
    return {
      nodes: [g({}, ...nodes)],
      title: central.text.split(/\s+/).slice(0, 4).join(' ').toLowerCase(),
      attribution: uniq.slice(0, 2).join(' · ') + (uniq.length > 2 ? ' et al.' : ''),
    };
  },
};
