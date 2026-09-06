/*
 * revisedPhilosophy — after Daniel Grandbois, A Revised Poetry of
 * Western Philosophy: deadpan apocrypha inside impeccable classical
 * book typography. Running head, folio, centered letterspaced
 * small-caps heading naming an authority (real pre-Socratic or
 * invented), a six-point justified italic epigraph giving an
 * apocryphal biography, then a short philosophical dialogue.
 *
 * The joke and the beauty are both in the decorum. This engine shows
 * the app can whisper.
 */

import { g, textEl, line, smallCapsText, smallCapsMeasure, el, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { seedInt } from '../prng.js';

const AUTHORITIES = [
  'Thales', 'Anaximander', 'Anaximenes', 'Pythagoras', 'Heraclitus',
  'Parmenides', 'Zeno of Elea', 'Empedocles', 'Anaxagoras', 'Democritus',
  'The Typesetter', 'The Photocopier', 'The Proofreader', 'The Bookbinder',
  'The Amanuensis', 'The Marginalist',
];

const INTERLOCUTORS = ['The Pupil', 'A Stranger', 'The River', 'The Press', 'The Margin', 'An Echo'];

const PLACES = ['Ephesus', 'Miletus', 'Croton', 'Elea', 'Abdera', 'Samos', 'Agrigentum', 'Clazomenae'];
const ORDINALS = ['thirty-ninth', 'forty-second', 'fifty-eighth', 'sixty-ninth', 'seventieth'];

function epigraphText(rng, name, word1, word2) {
  const birth = rng.pick([
    `Born at ${rng.pick(PLACES)} in the ${rng.pick(ORDINALS)} Olympiad,`,
    `A native of ${rng.pick(PLACES)}, by way of ${rng.pick(PLACES)},`,
    `Born, the biographers agree, at least once,`,
    `Of ${rng.pick(PLACES)}, though the city denied it,`,
  ]);
  const vocation = rng.pick([
    `${name} kept silence for thirty years and billed for twenty-nine.`,
    `${name} weighed smoke, and found it wanting.`,
    `${name} numbered the vowels and pronounced them insufficient.`,
    `${name} taught arithmetic to the fish of the harbor.`,
    `${name} refused to write anything down, then wrote that down.`,
  ]);
  const doctrine = rng.pick([
    `He held that ${word1} is the first principle of all things, and that all things owe it an apology.`,
    `He declared ${word1} divine, and ${word2} merely well-connected.`,
    `He demonstrated that motion is impossible, and was late everywhere thereafter.`,
    `He maintained that the soul is a kind of ${word1}, damp in the young and dry in the wise.`,
  ]);
  const death = rng.pick([
    `He died of a surfeit of ${word2}.`,
    `He was last seen walking into the ${word2}, taking notes.`,
    `His book, if there was a book, is lost, and improves each year it stays so.`,
    `Nothing else survives, which he would have counted a success.`,
  ]);
  return `${birth} ${vocation} ${doctrine} ${death}`;
}

/* Justified block with hanging punctuation; returns nodes and height. */
function justifiedBlock(text, { x, y, width, size, leading, family, style, fill }) {
  const nodes = [];
  const words = text.split(/\s+/);
  const opts = { size, family, style };
  const lines = [];
  let cur = [];
  for (const w of words) {
    const trial = cur.concat(w).join(' ');
    if (measure(trial, opts) > width && cur.length) {
      lines.push(cur);
      cur = [w];
    } else cur.push(w);
  }
  if (cur.length) lines.push(cur);

  lines.forEach((lineWords, li) => {
    const yy = y + li * leading;
    const isLast = li === lines.length - 1;
    let xx = x;
    // hanging punctuation: a leading quote hangs into the margin
    if (/^["'“‘]/.test(lineWords[0])) xx -= measure(lineWords[0][0], opts);
    if (isLast || lineWords.length === 1) {
      nodes.push(textEl(lineWords.join(' '), { x: xx, y: yy, size, family, style, fill }));
    } else {
      const wordsW = lineWords.reduce((s, w) => s + measure(w, opts), 0);
      const gap = (width - wordsW) / (lineWords.length - 1);
      let wx = xx;
      for (const w of lineWords) {
        nodes.push(textEl(w, { x: wx, y: yy, size, family, style, fill }));
        wx += measure(w, opts) + gap;
      }
    }
  });
  return { nodes, height: lines.length * leading };
}

export default {
  id: 'revisedPhilosophy',
  name: 'revised philosophy',
  lineage: 'Daniel Grandbois, A Revised Poetry of Western Philosophy (2016)',

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const ink = sheet.palette.ink;
    const serif = FONTS.serif;
    const cx = sheet.width / 2;
    const nodes = [];

    const authority = rng.pick(AUTHORITIES);
    const other = rng.pick(INTERLOCUTORS);
    const word1 = source.word(rng).text;
    const word2 = source.word(rng).text;

    // ——— running head and folio ———
    const folio = 3 + (seedInt(String(rng.int(0, 1e9))) % 120) * 2 + 1; // an odd recto folio
    nodes.push(smallCapsText('A REVISED POETRY OF WESTERN PHILOSOPHY', {
      x: cx, y: box.y + 4, size: 11.5, trackingEm: 0.16, family: serif, fill: ink, anchor: 'middle',
    }));
    nodes.push(textEl(String(folio), {
      x: box.x + box.w, y: box.y + 4, size: 11.5, family: serif, fill: ink, anchor: 'end',
    }));
    nodes.push(line(box.x, box.y + 14, box.x + box.w, box.y + 14, { stroke: ink, width: 0.7, opacity: 0.7 }));

    // ——— the authority's heading ———
    let y = sheet.snap(box.y + baseline * 5);
    nodes.push(smallCapsText(authority.toUpperCase(), {
      x: cx, y, size: 21, trackingEm: 0.12, family: serif, fill: ink, anchor: 'middle',
    }));
    y += baseline * 0.6;
    const dates = rng.pick(['fl. impossibly', 'dates disputed', 'c. whenever', 'b. before the comma', 'fl. between editions']);
    y += baseline * 0.8;
    nodes.push(textEl(`(${dates})`, {
      x: cx, y, size: 11.5, family: serif, style: 'italic', fill: ink, anchor: 'middle', opacity: 0.85,
    }));

    // ——— the six-point apocryphal epigraph, justified ———
    y = sheet.snap(y + baseline * 1.6);
    const epiW = box.w * 0.62;
    const epi = justifiedBlock(epigraphText(rng, authority, word1, word2), {
      x: cx - epiW / 2, y, width: epiW, size: 10, leading: baseline * 0.62,
      family: serif, style: 'italic', fill: ink,
    });
    nodes.push(...epi.nodes);
    y += epi.height;

    // ——— the small inline glyph ———
    y = sheet.snap(y + baseline * 1.2);
    const fleuron = rng.pick(['❧', '⁂', '☙', '§', '·  ·  ·']);
    nodes.push(textEl(fleuron, {
      x: cx, y, size: 14, family: serif,
      fill: sheet.palette.accent || ink, anchor: 'middle',
    }));

    // ——— the dialogue ———
    y = sheet.snap(y + baseline * 2);
    const bodySize = 15;
    /* différance: from 0.3 the speaker's name slips one letter from the
     * heading — a difference visible in writing and inaudible in speech.
     * The one who speaks is not quite the one the page names. */
    const slip = (name) => {
      if (/e/i.test(name)) return name.replace(/e/i, (m) => (m === 'E' ? 'A' : 'a'));
      if (/a/i.test(name)) return name.replace(/a/i, (m) => (m === 'A' ? 'E' : 'e'));
      return name.replace(/i/i, (m) => (m === 'I' ? 'Y' : 'y'));
    };
    const spoken = entropy >= 0.3 ? slip(authority) : authority;
    const speakers = [spoken, other];
    let attribution = null;
    const turnText = (frag) => {
      let text = frag.text.replace(/[.;,:]$/, '.');
      if (!/[.!?…]$/.test(text)) text += '.';
      return text;
    };
    const noteAttribution = (frag, i) => {
      if (!attribution) attribution = frag.attribution;
      else if (i === 1 && frag.attribution !== attribution) attribution += ' · ' + frag.attribution;
    };

    if (entropy >= 0.7) {
      /* the Glas page: the dialogue splits into two columns that run
       * independently — the authority on the left, the other on the
       * right — neither answering the other. One judas window in the
       * left column lets three words of the right one in. */
      const turns = rng.int(3, 5);
      const gutter = baseline * 2;
      const colW = (box.w * 0.84 - gutter) / 2;
      const xL = box.x + box.w * 0.08;
      const xR = xL + colW + gutter;
      const yStart = y;
      const floor = box.y + box.h - baseline * 2;
      let yL = y;
      let yR = y;
      const rightWords = [];
      for (let i = 0; i < turns; i++) {
        const frag = source.fragment(rng, { minWords: 3, maxWords: 16 });
        noteAttribution(frag, i);
        const text = turnText(frag);
        const left = i % 2 === 0;
        const yy = left ? yL : yR;
        if (yy > floor - baseline * 3) continue;
        const x = left ? xL : xR;
        nodes.push(smallCapsText((left ? spoken : other).toUpperCase() + '.', {
          x, y: yy, size: bodySize * 0.86, trackingEm: 0.1, family: serif, fill: ink,
        }));
        const blk = justifiedBlock(text, {
          x, y: yy + baseline, width: colW, size: bodySize, leading: baseline, family: serif, fill: ink,
        });
        nodes.push(...blk.nodes);
        if (!left) rightWords.push(...text.split(/\s+/));
        const next = yy + baseline + blk.height + baseline * 0.5;
        if (left) yL = next; else yR = next;
      }
      if (rightWords.length >= 3 && yL - yStart > baseline * 4) {
        const wi = rng.int(0, rightWords.length - 3);
        const words3 = rightWords.slice(wi, wi + 3).join(' ').replace(/[.,;:!?]$/, '');
        const ww = colW * 0.4;
        const wh = baseline * 2;
        const wx = xL + colW * 0.3;
        const wy = yStart + (yL - yStart) * 0.55 - wh / 2;
        nodes.push(el('rect', {
          x: r2(wx), y: r2(wy), width: r2(ww), height: r2(wh),
          fill: sheet.palette.paper, stroke: ink, 'stroke-width': 0.7,
        }));
        nodes.push(textEl(words3, {
          x: wx + ww / 2, y: wy + wh / 2 + bodySize * 0.35, size: bodySize,
          family: serif, style: 'italic', fill: ink, anchor: 'middle',
        }));
      }
      y = Math.max(yL, yR);
    }

    const turns = entropy >= 0.7 ? 0 : rng.int(2, 4);
    for (let i = 0; i < turns; i++) {
      const frag = source.fragment(rng, { minWords: 3, maxWords: 16 });
      noteAttribution(frag, i);
      const speaker = speakers[i % 2];
      const text = turnText(frag);

      // speaker in letterspaced small caps, then the line, book-style
      const spName = speaker.toUpperCase() + '.';
      const spW = smallCapsMeasure(spName, { size: bodySize * 0.86, trackingEm: 0.1, family: serif });
      const indent = box.x + box.w * 0.08;
      const availW = box.w * 0.84;
      nodes.push(smallCapsText(spName, {
        x: indent, y, size: bodySize * 0.86, trackingEm: 0.1, family: serif, fill: ink,
      }));
      // the utterance wraps with a hanging indent
      const textW = availW - spW - 10;
      const wordsQ = text.split(/\s+/);
      let cur = '';
      let lx = indent + spW + 10;
      let firstLine = true;
      const flush = () => {
        if (!cur) return;
        nodes.push(textEl(cur, { x: firstLine ? lx : indent + 24, y, size: bodySize, family: serif, fill: ink }));
        y += baseline;
        firstLine = false;
        cur = '';
      };
      for (const w of wordsQ) {
        const trial = cur ? cur + ' ' + w : w;
        const maxW = firstLine ? textW : availW - 24;
        if (measure(trial, { size: bodySize, family: serif }) > maxW && cur) flush();
        cur = cur ? cur + ' ' + w : w;
      }
      flush();
      y += baseline * 0.5;
      if (y > box.y + box.h - baseline * 4) break;
    }

    // ——— the moral: none on the Glas page; from 0.3 it denies the epigraph ———
    const morals = [
      'This is generally regarded as progress.',
      'The remainder is exercise for the dead.',
      'No reply is recorded.',
      'The manuscript breaks off here, relieved.',
      'Later editors supplied the moral, and it was wrong.',
    ];
    const denials = [
      `The doctrine of ${word1} was never his; the editors regret the epigraph.`,
      `Later hands deny he ever reached ${word2}.`,
      `The biographers, consulted again, withdraw the ${word1}.`,
      'He was born, if at all, elsewhere.',
      'Nothing above should be taken as having been said.',
    ];
    if (entropy < 0.7 && (entropy >= 0.3 || rng.chance(0.6))) {
      y = sheet.snap(Math.min(y + baseline * 1.5, box.y + box.h - baseline));
      const moral = rng.pick(entropy >= 0.3 ? denials : morals);
      nodes.push(textEl(moral, {
        x: cx, y, size: 12, family: serif, style: 'italic', fill: ink, anchor: 'middle', opacity: 0.9,
      }));
    }

    return {
      nodes: [g({}, ...nodes)],
      title: `${authority.toLowerCase()}, revised`,
      attribution,
    };
  },
};
