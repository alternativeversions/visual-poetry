/*
 * mesostic — after John Cage, 62 Mesostics re Merce Cunningham (1971)
 * and the writings through Finnegans Wake (1977–); after Jackson Mac
 * Low's diastics (1963–).
 *
 * A spine word stands in capitals down the center axis; the wing text
 * is read through, and for each spine letter the next word containing
 * it is set so that letter falls exactly on the axis. The 50% rule —
 * the spine letter may not recur between one spine letter and the
 * next — is enforced as strictly as the text allows, which is what
 * Cage said too. High entropy writes through the writing: wings
 * lengthen and drift, words ghost to 8%, the leading tightens.
 * License breaks: none — this one is orthodox and proud of it.
 */

import { g, textEl } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const clean = (w) => w.replace(/[.,;:!?—"“”]+$/, '').replace(/^["“”]+/, '');

export default {
  id: 'mesostic',
  name: 'mesostic',
  lineage: 'John Cage, 62 Mesostics re Merce Cunningham (1971)',

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const axis = sheet.width / 2;

    /* the wing text — built first so the spine can be checked against it */
    const fragA = source.fragment(rng, { minWords: 8, maxWords: 30 });
    const fragB = source.fragment(rng, { minWords: 8, maxWords: 30 });
    let wing = (fragA.text + ' ' + fragB.text).split(/\s+/).map(clean).filter(Boolean);
    let wingLetters = wing.join(' ').toLowerCase();
    const coversAllLetters = (w) => [...w].every((ch) => wingLetters.includes(ch));

    /* the spine: prefer a word of 4+ letters, all of them found
     * somewhere in the wing — a letter with no home in the wing can't
     * honestly land on the axis (the 50%-rule scan below has nothing
     * to find and would otherwise fall through to a fabricated 'x') */
    let spine = source.word(rng).text.toLowerCase().replace(/[^\p{L}]/gu, '');
    for (let i = 0; i < 8 && (spine.length < 4 || !coversAllLetters(spine)); i++) {
      spine = source.word(rng).text.toLowerCase().replace(/[^\p{L}]/gu, '');
    }
    if (!spine || !coversAllLetters(spine)) {
      spine = [...'cage'].filter((ch) => wingLetters.includes(ch)).join('') || spine || 'cage';
    }
    if (!coversAllLetters(spine)) {
      /* the wing carries none of the spine's letters at all — a
       * numeral- or symbol-only paste, or a wing too narrow for even
       * the 'cage' fallback to survive. Rather than fabricate a letter
       * the text never contained, the mesostic reads the spine through
       * itself: silence through silence. */
      wing = [spine];
      wingLetters = spine;
    }

    const size = 15;
    const spineSize = sheet.scale(1); // one step up
    const lead = sheet.baseline * (1.35 - entropy * 0.35);
    const rows = [];
    let p = 0; // pointer into wing, cycling
    const at = (i) => wing[((i % wing.length) + wing.length) % wing.length];

    const totalRows = Math.floor((box.h * 0.86) / lead);
    outer: for (let cycle = 0; cycle < 3; cycle++) {
      if (cycle > 0) rows.push(null); // blank row between cycles
      for (const L of spine) {
        if (rows.length >= totalRows) break outer;
        /* find next word containing L; 50% rule: no intervening word
         * may contain L. Every spine letter is guaranteed to occur
         * somewhere in the wing (see spine selection above, and the
         * cyclic `at()` above), so this scan always finds a match
         * inside two passes over the wing. */
        let chosen = -1;
        let scan = p;
        while (scan - p < wing.length * 2) {
          const w = at(scan).toLowerCase();
          if (w.includes(L)) { chosen = scan; break; }
          scan++;
        }
        const word = at(chosen);
        const li = word.toLowerCase().indexOf(L);
        const pre = rng.int(0, Math.min(3, Math.round(entropy * 3)));
        const post = rng.int(0, Math.min(3, 1 + Math.round(entropy * 2)));
        rows.push({
          left: Array.from({ length: pre }, (_, k) => at(chosen - pre + k)).join(' '),
          word, li,
          right: Array.from({ length: post }, (_, k) => at(chosen + 1 + k)).join(' '),
          ghost: entropy > 0.5 && rng.chance((entropy - 0.4) * 0.5),
          jitter: rng.gauss(0, entropy * 22),
        });
        p = chosen + 1 + post;
      }
      if (p >= wing.length * 2) break;
    }

    const y0 = box.y + (box.h - rows.length * lead) / 2 + lead;
    const nodes = [];
    rows.forEach((row, i) => {
      if (!row) return;
      const y = y0 + i * lead;
      const jx = row.jitter;
      const L = row.word[row.li] || 'x';
      const preStr = row.word.slice(0, row.li).toLowerCase();
      const postStr = row.word.slice(row.li + 1).toLowerCase();
      const wL = measure(L.toUpperCase(), { size: spineSize, family: FONTS.serif });
      const opacity = row.ghost ? 0.08 : 1;
      /* spine letter, exactly on the axis */
      nodes.push(textEl(L.toUpperCase(), {
        x: axis + jx, y, size: spineSize, family: FONTS.serif, anchor: 'middle',
        fill: palette.accent || ink, opacity,
      }));
      const leftRun = (row.left ? row.left.toLowerCase() + ' ' : '') + preStr;
      const rightRun = postStr + (row.right ? ' ' + row.right.toLowerCase() : '');
      if (leftRun) nodes.push(textEl(leftRun, {
        x: axis + jx - wL / 2 - measure(leftRun, { size, family: FONTS.serif }) - size * 0.18,
        y, size, family: FONTS.serif, fill: ink, opacity,
      }));
      if (rightRun) nodes.push(textEl(rightRun, {
        x: axis + jx + wL / 2 + size * 0.18, y, size, family: FONTS.serif, fill: ink, opacity,
      }));
    });

    return {
      nodes: [g({}, ...nodes)],
      title: spine,
      attribution: fragA.attribution === fragB.attribution
        ? fragA.attribution : `${fragA.attribution} × ${fragB.attribution}`,
    };
  },
};
