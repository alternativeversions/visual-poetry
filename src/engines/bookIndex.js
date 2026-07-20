/*
 * index — after the index to Nabokov's Pale Fire (1962) and J. G.
 * Ballard, "The Index" (1977).
 *
 * The poem as the back matter of a book that does not exist: entries
 * alphabetized, subentries drawn from each word's own surroundings,
 * page numbers ascending. The hidden order is Ballard's: each
 * occurrence of a word gets one page reference, assigned so that
 * reading every reference in ascending order re-derives the poem's
 * word order — the index is the poem, filed. One see-also, one
 * passim, one entry with no page at all. At high entropy the index
 * misremembers: another book's entries intrude, a cross-reference
 * loops, a page exceeds the book. License breaks: none; the whisper
 * is the art. Palette: accent never.
 */

import { g, textEl, smallCapsText } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const STOP = new Set(('a an and are as at be but by for from had has have he her his i in is it its me my ' +
  'no not of on or our she so that the thee thou thy to was we were when with you').split(' '));

const bare = (w) => w.toLowerCase().replace(/[^\p{L}'-]/gu, '');

export default {
  id: 'index',
  name: 'index',
  lineage: 'the index to Pale Fire (1962); Ballard, “The Index” (1977)',
  paletteOpts: { accent: 'never' },

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 10, maxWords: 30 });
    const words = frag.text.split(/\s+/).filter(Boolean);

    /* occurrences in poem order -> ascending page numbers */
    let page = rng.int(3, 20);
    const occs = []; // { key, at, page }
    words.forEach((w, at) => {
      const key = bare(w);
      if (!key || key.length < 3 || STOP.has(key)) return;
      page += rng.int(1, 7);
      occs.push({ key, at, page });
    });
    if (!occs.length) occs.push({ key: bare(words[0] || 'silence') || 'silence', at: 0, page });
    const book = page + rng.int(10, 60);

    /* entries: key -> { pages, sub } */
    const entries = new Map();
    for (const o of occs) {
      if (!entries.has(o.key)) entries.set(o.key, { pages: [], sub: [] });
      const e = entries.get(o.key);
      e.pages.push(o.page);
      const ctx = words.slice(o.at + 1, o.at + 4).join(' ').replace(/[.!?]+$/, '');
      if (ctx) e.sub.push({ ctx: ctx.toLowerCase(), page: o.page });
    }

    const keys = [...entries.keys()].sort();
    const most = keys.reduce((a, b) => (entries.get(b).pages.length > (entries.get(a)?.pages.length || 0) ? b : a), keys[0]);
    const noPage = keys[keys.length - 1];
    const loop = entropy > 0.5 && keys.length >= 2 ? [keys[rng.int(0, keys.length - 1)], keys[rng.int(0, keys.length - 1)]] : null;

    /* intruders: another book remembered */
    const ghosts = [];
    if (entropy > 0.55) {
      const other = source.fragment(rng, { minWords: 6, maxWords: 20 });
      const ow = other.text.split(/\s+/).map(bare).filter((w) => w.length >= 4 && !STOP.has(w) && !entries.has(w));
      for (const w of rng.shuffle(ow).slice(0, rng.int(2, 4))) ghosts.push(w);
    }

    /* ---- layout: two columns, hanging indent ---- */
    const size = 12.5;
    const lead = size * 1.5;
    const gutter = 34;
    const colW = (box.w - gutter) / 2;
    const head = smallCapsText('Index', {
      x: sheet.width / 2, y: box.y + 10, size: sheet.scale(1),
      family: FONTS.serif, fill: ink, anchor: 'middle', trackingEm: 0.14,
    });
    const nodes = [head];
    let col = 0;
    let y = box.y + 56;
    const colX = () => box.x + col * (colW + gutter);
    const maxY = box.y + box.h - 30;
    const putLine = (str, indent, italicTail = null) => {
      if (y > maxY) { col++; y = box.y + 56; }
      if (col > 1) return false;
      nodes.push(textEl(str, { x: colX() + indent, y, size, family: FONTS.serif, fill: ink }));
      if (italicTail) nodes.push(textEl(italicTail, {
        x: colX() + indent + measure(str + ' ', { size, family: FONTS.serif }),
        y, size, family: FONTS.serif, style: 'italic', fill: ink,
      }));
      y += lead;
      return true;
    };

    const allKeys = [...keys, ...ghosts].sort();
    for (const k of allKeys) {
      const e = entries.get(k);
      if (!e) { // intruder from the other book
        putLine(`${k}, ${rng.int(book, book + 200)}`, 0);
        continue;
      }
      let headStr;
      if (k === most && e.pages.length > 2) { putLine(`${k},`, 0, 'passim'); continue; }
      else if (k === noPage) headStr = `${k}, —`;
      else headStr = `${k}, ${e.pages.join(', ')}`;
      /* wrap with hanging indent */
      const first = headStr;
      if (measure(first, { size, family: FONTS.serif }) <= colW) putLine(first, 0);
      else putLine(first.slice(0, Math.floor(first.length * (colW / measure(first, { size, family: FONTS.serif })))), 0);
      for (const s of e.sub.slice(0, 2)) {
        const subStr = `${s.ctx}, ${s.page}`;
        if (measure(subStr, { size, family: FONTS.serif }) <= colW - 14) putLine(subStr, 14);
      }
      if (loop && k === loop[0]) putLine(`— `, 14, `see ${loop[1]}`);
      if (loop && k === loop[1] && loop[0] !== loop[1]) putLine(`— `, 14, `see ${loop[0]}`);
    }

    /* folio */
    nodes.push(textEl(`— ${rng.int(80, 300)} —`, {
      x: sheet.width / 2, y: box.y + box.h - 4, size: 11,
      family: FONTS.serif, fill: ink, anchor: 'middle',
    }));

    return {
      nodes: [g({}, ...nodes)],
      title: `index (${allKeys[0]}–${allKeys[allKeys.length - 1]})`,
      attribution: frag.attribution,
    };
  },
};
