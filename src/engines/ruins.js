/*
 * ruins — after Ronald Johnson, "Radi os" (1977), which erased its way
 * through an 1892 Paradise Lost until a new poem stood in the ruins of
 * the old ("to etch is 'to cut away'"); and after Tom Phillips's
 * treated Victorian novel, A Humument (1966–).
 *
 * A full book page is typeset first — justified prose, running head,
 * folio — and then collapses: most words fall away (ghosted to 7%, cut
 * to blank space that keeps its position, or struck through with a
 * rule, chosen per render), leaving a dozen survivors in their exact
 * typeset places as the found poem. The erasure deepens down the page,
 * and at the foot even the survivors crumble, shedding letters that
 * drift into the bottom margin. Even the running head is erased the
 * way Johnson cut his title out of PARADISE LOST.
 */

import { g, textEl, line, path, smoothPath, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const STYLES = [
  { id: 'ghost', weight: 5, caption: 'after the erasure poem, via Ronald Johnson’s Radi os (1977)' },
  { id: 'blank', weight: 4, caption: 'after Ronald Johnson, Radi os (1977)' },
  { id: 'struck', weight: 2, caption: 'after the treated page, via Tom Phillips’s A Humument (1966–)' },
];

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'or', 'to', 'in', 'is', 'it', 'as', 'at', 'by', 'on', 'be', 'la', 'le', 'et', 'de', 'der', 'die', 'das', 'und']);

export default {
  id: 'ruins',
  name: 'ruins',
  lineage: 'Ronald Johnson, Radi os (1977); Phillips, A Humument (1966–)',

  generate(rng, source, sheet) {
    const { box, baseline, entropy } = sheet;
    const ink = sheet.palette.ink;
    const serif = FONTS.serif;
    const nodes = [];
    const style = rng.weighted(STYLES.map((s) => ({ value: s, weight: s.weight })));

    /* ---- gather the page's prose ---- */
    const frags = [];
    let wordCount = 0;
    const maxLines = Math.floor((box.h - baseline * 4) / baseline);
    while (wordCount < maxLines * 11 && frags.length < 44) {
      const f = source.fragment(rng, { minWords: 5, maxWords: 30 });
      frags.push(f);
      wordCount += f.text.split(/\s+/).length;
    }
    const atts = [...new Set(frags.map((f) => f.attribution))];
    const attribution = `erasure of ${atts[0]}` + (atts.length > 1 ? ' et al.' : '');

    /* ---- typeset the intact page (positions frozen before the cut) ---- */
    const size = rng.range(14.5, 16.5);
    const opts = { size, family: serif };
    const spaceW = Math.max(measure(' ', opts), size * 0.22);
    const indent = size * 1.5;
    const measureW = box.w * rng.range(0.82, 0.92);
    const left = sheet.width / 2 - measureW / 2;
    const top = sheet.line(3);

    const tokens = [];
    frags.forEach((f, fi) => {
      f.text.split(/\s+/).filter(Boolean).forEach((word, i) => {
        tokens.push({ word, paraStart: i === 0 && fi > 0 && rng.chance(0.5) });
      });
    });

    const lines = []; // [{ words: [{word, ww}], indent, last }]
    let cur = { words: [], indent: 0, last: false };
    for (const t of tokens) {
      if (lines.length >= maxLines) break;
      const ww = measure(t.word, opts);
      const curW = cur.words.reduce((s, w2) => s + w2.ww, 0) + spaceW * Math.max(0, cur.words.length - 1);
      if (t.paraStart && cur.words.length) {
        cur.last = true;
        lines.push(cur);
        cur = { words: [], indent, last: false };
      } else if (cur.words.length && cur.indent + curW + spaceW + ww > measureW) {
        lines.push(cur);
        cur = { words: [], indent: 0, last: false };
      }
      if (lines.length >= maxLines) break;
      cur.words.push({ word: t.word, ww });
    }
    if (cur.words.length && lines.length < maxLines) { cur.last = true; lines.push(cur); }
    const L = lines.length;

    /* assign x positions (justified except paragraph-final lines) */
    const placed = []; // { word, x, ww, li, y, center }
    lines.forEach((ln, li) => {
      const y = top + li * baseline;
      const totalWW = ln.words.reduce((s, w2) => s + w2.ww, 0);
      let gap = spaceW;
      if (!ln.last && ln.words.length > 1) {
        gap = spaceW + (measureW - ln.indent - totalWW - spaceW * (ln.words.length - 1)) / (ln.words.length - 1);
        if (gap > spaceW * 2.4) gap = spaceW; // give up rather than open rivers
      }
      let x = left + ln.indent;
      for (const w2 of ln.words) {
        placed.push({ word: w2.word, x, ww: w2.ww, li, y, center: x + w2.ww / 2 });
        x += w2.ww + gap;
      }
    });

    /* ---- decide the survivors: the found poem ----
     * blank pages cut evenly (Johnson kept words all the way down);
     * ghost and struck pages erase harder as they descend. */
    const deepen = (style.id === 'blank' ? 0.45 : 0.75) + entropy * 0.2;
    const baseProb = style.id === 'blank' ? 0.16 : 0.13;
    for (const p of placed) {
      const t = L > 1 ? p.li / (L - 1) : 0;
      const bare = p.word.toLowerCase().replace(/[^\p{L}'-]/gu, '');
      let prob = baseProb * (1 - t * deepen);
      if (STOPWORDS.has(bare) || bare.length < 3) prob *= 0.35;
      p.survives = rng.chance(prob);
    }
    let survivors = placed.filter((p) => p.survives);
    const candidates = placed.filter((p) => !p.survives && p.li < L * 0.6 && !STOPWORDS.has(p.word.toLowerCase()) && p.word.length > 3);
    while (survivors.length < 6 && candidates.length) {
      const pick = candidates.splice(rng.int(0, candidates.length - 1), 1)[0];
      pick.survives = true;
      survivors.push(pick);
    }
    survivors = placed.filter((p) => p.survives);

    /* ---- running head, erased the way RADI OS was cut ---- */
    const headText = (atts[0] || 'the ruined page').split(',')[0].toUpperCase();
    const headSize = 12;
    const headTrack = headSize * 0.14;
    let hw = 0;
    const headAdv = [...headText].map((ch) => {
      const a = measure(ch, { size: headSize, family: serif }) + headTrack;
      hw += a;
      return a;
    });
    let hx = sheet.width / 2 - hw / 2;
    [...headText].forEach((ch, i) => {
      if (ch !== ' ' && !rng.chance(0.45)) {
        nodes.push(textEl(ch, { x: hx, y: sheet.line(0), size: headSize, family: serif, fill: ink }));
      }
      hx += headAdv[i];
    });
    if (rng.chance(0.6)) {
      nodes.push(textEl(String(rng.int(3, 297)), {
        x: left + measureW, y: sheet.line(0), size: 11, family: serif,
        style: 'italic', fill: ink, anchor: 'end', opacity: 0.75,
      }));
    }

    /* ---- render the page: ruins first, survivors on top ---- */
    const crumbleFrom = 0.78;
    const fallen = []; // letters shed at the foot of the page
    for (const p of placed) {
      const t = L > 1 ? p.li / (L - 1) : 0;
      const crumble = t > crumbleFrom ? (t - crumbleFrom) / (1 - crumbleFrom) : 0;
      let word = p.word;
      let dy = 0;
      let rot = 0;
      if (crumble > 0) {
        const keep = Math.max(p.survives ? 1 : 0, Math.ceil(word.length * (1 - crumble * rng.range(0.4, 1))));
        for (const ch of word.slice(keep)) {
          if (rng.chance(0.3)) fallen.push({ ch, x: p.x + rng.range(0, p.ww), fromY: p.y });
        }
        word = word.slice(0, keep);
        dy = crumble * rng.range(0, baseline * 1.1);
        rot = rng.gauss(0, crumble * 8);
      }
      if (!word) continue;
      const transform = Math.abs(rot) > 1 ? `rotate(${r2(rot)} ${r2(p.x)} ${r2(p.y + dy)})` : null;
      if (p.survives) {
        nodes.push(textEl(word, { x: p.x, y: p.y + dy, size, family: serif, fill: ink, transform }));
      } else if (style.id === 'ghost') {
        nodes.push(textEl(word, { x: p.x, y: p.y + dy, size, family: serif, fill: ink, opacity: 0.07, transform }));
      } else if (style.id === 'struck') {
        nodes.push(textEl(word, { x: p.x, y: p.y + dy, size, family: serif, fill: ink, opacity: 0.3, transform }));
        nodes.push(line(p.x - 1, p.y + dy - size * 0.3, p.x + p.ww + 1, p.y + dy - size * 0.3, {
          stroke: ink, width: 0.9, opacity: 0.6,
        }));
      }
      /* blank: the cut word keeps only its position, as white space */
    }

    /* ---- the foot of the page gives way ---- */
    const floor = box.y + box.h;
    for (const f of fallen.slice(0, 14)) {
      const y = f.fromY + (floor - f.fromY) * rng.range(0.25, 0.95);
      nodes.push(textEl(f.ch, {
        x: f.x, y, size: size * rng.range(0.8, 1), family: serif, fill: ink,
        anchor: 'middle', opacity: rng.range(0.5, 0.9),
        transform: `rotate(${r2(rng.range(-70, 70))} ${r2(f.x)} ${r2(y)})`,
      }));
    }

    /* ---- Phillips's river: a hairline joining the found poem ---- */
    if (survivors.length > 2 && rng.chance(0.45)) {
      const pts = survivors.map((p) => [p.center, p.y - size * 0.3]);
      nodes.unshift(path(smoothPath(pts, 0.7), {
        stroke: sheet.palette.accent || ink, width: 0.8,
        opacity: sheet.palette.accent ? 0.5 : 0.22,
      }));
    }

    const title = survivors.slice(0, 4)
      .map((p) => p.word.toLowerCase().replace(/[^\p{L}'—-]/gu, ''))
      .filter(Boolean).join(' ') || 'radi os';
    return {
      nodes: [g({}, ...nodes)],
      title,
      attribution,
      caption: style.caption,
    };
  },
};
