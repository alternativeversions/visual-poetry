/*
 * grammar — after Alonzo Reed & Brainerd Kellogg, Higher Lessons in
 * English (1877), whose sentence diagram turned syntax into drawing;
 * and after Gertrude Stein, "Poetry and Grammar" (1935): "I really do
 * not know that anything has ever been more exciting than diagramming
 * sentences."
 *
 * A whole poem, sentence by sentence, as real Reed–Kellogg diagrams
 * stacked down the sheet like stanzas: subject | verb | object on one
 * baseline, the dividers doing their exact schoolroom work (crossing
 * the line before the verb, resting on it before the object, leaning
 * back for a complement), modifiers slanting beneath their heads,
 * prepositional phrases hanging their objects a level lower. Corpus
 * sentences use parse trees authored by hand at build time
 * (parses.js); pasted text goes through the deterministic rule-based
 * parser (parser.js), and the sheet says so in its footnote — the
 * diagram is only as honest as its parse.
 */

import { g, textEl, line, smallCapsText, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';
import { PARSES } from '../text/parses.js';
import { parseSentence, parseChaotic } from '../text/parser.js';
import { cachedParse } from '../text/aiParser.js';

const ANG = (55 * Math.PI) / 180;
const COS = Math.cos(ANG);
const SIN = Math.sin(ANG);
const RULE = 0.8;

export default {
  id: 'grammar',
  name: 'grammar',
  lineage: 'Reed & Kellogg, Higher Lessons in English (1877); Stein (1935)',

  generate(rng, source, sheet) {
    const { box, entropy } = sheet;
    const ink = sheet.palette.ink;
    const accent = sheet.palette.accent;
    const serif = FONTS.serif;
    const nodes = [];

    /* ---- measurement + drawing, recursive over units ---- */
    const mUnit = (u, size) => {
      const baseW = measure(u.w, { size, family: serif }) + size * 1.2;
      const mods = (u.m || []).map((mod) => {
        const slant = Math.max(
          measure(mod.w, { size: size * 0.85, family: serif, style: 'italic' }) + size * 0.5,
          size * 1.7
        );
        const dx = slant * COS;
        const dy = slant * SIN;
        const objM = mod.obj ? mUnit(mod.obj, size) : null;
        return {
          mod, slant, dx, dy, objM,
          w: objM ? dx + objM.baseW : dx + size * 0.3,
          h: objM ? dy + objM.underH + size * 1.1 : dy,
        };
      });
      let underW = size * 0.4;
      let underH = 0;
      for (const mm of mods) {
        underW += mm.w + size * 0.45;
        underH = Math.max(underH, mm.h);
      }
      return { u, mods, baseW: Math.max(baseW, underW), underH };
    };

    /* draw a unit's word above (x..x+baseW on the rule at y) and its
     * modifiers beneath; withBase draws its own rule (prep objects) */
    const drawUnit = (m, x, y, size, withBase = false) => {
      if (withBase) nodes.push(line(x, y, x + m.baseW, y, { stroke: ink, width: RULE }));
      const wW = measure(m.u.w, { size, family: serif });
      nodes.push(textEl(m.u.w, {
        x: x + m.baseW / 2 - wW / 2, y: y - size * 0.35, size, family: serif, fill: ink,
      }));
      let mx = x + size * 0.55;
      for (const mm of m.mods) {
        nodes.push(line(mx, y, mx + mm.dx, y + mm.dy, { stroke: ink, width: RULE }));
        nodes.push(textEl(mm.mod.w, {
          x: mx + size * 0.5, y: y - size * 0.22 + size * 0.9,
          size: size * 0.85, family: serif, style: 'italic', fill: ink,
          transform: `rotate(55 ${r2(mx)} ${r2(y)})`,
        }));
        if (mm.objM) drawUnit(mm.objM, mx + mm.dx, y + mm.dy, size, true);
        mx += mm.w + size * 0.45;
      }
    };

    const mClause = (c, size) => {
      const S = mUnit(c.subj, size);
      const V = mUnit(c.verb, size);
      const P = c.post ? mUnit(c.post, size) : null;
      const P2 = c.post2 ? mUnit(c.post2, size) : null;
      const width = S.baseW + V.baseW + (P ? P.baseW : 0) + (P2 ? P2.baseW : 0);
      const underH = Math.max(S.underH, V.underH, P ? P.underH : 0, P2 ? P2.underH : 0);
      return { c, S, V, P, P2, width, underH };
    };

    const divider = (kind, x, y, size) => {
      if (kind === '\\') {
        nodes.push(line(x - size * 0.55, y - size * 0.95, x, y, { stroke: ink, width: RULE }));
      } else if (kind === 'cross') {
        nodes.push(line(x, y - size * 0.95, x, y + size * 0.55, { stroke: ink, width: RULE }));
      } else {
        nodes.push(line(x, y - size * 0.95, x, y, { stroke: ink, width: RULE }));
      }
    };

    const drawClause = (M, x, y, size) => {
      nodes.push(line(x, y, x + M.width, y, { stroke: ink, width: RULE }));
      let cx = x;
      drawUnit(M.S, cx, y, size);
      cx += M.S.baseW;
      divider('cross', cx, y, size);
      drawUnit(M.V, cx, y, size);
      cx += M.V.baseW;
      if (M.P) {
        divider(M.c.div || '|', cx, y, size);
        drawUnit(M.P, cx, y, size);
        cx += M.P.baseW;
      }
      if (M.P2) {
        divider(M.c.div2 || '\\', cx, y, size);
        drawUnit(M.P2, cx, y, size);
      }
      return { verbX: x + M.S.baseW + M.V.baseW / 2 };
    };

    /* ---- gather the poem ---- */
    let entries = [];
    let heuristic = false;
    let aiParsed = false;

    /* misrule: the higher the entropy, the more often the page
     * abandons grammar — every word diagrammed, nothing in its place */
    const misrule = rng.chance(entropy * 0.75);
    if (misrule) {
      const seenTexts = new Set();
      for (let i = 0; i < 8 && entries.length < 4; i++) {
        const f = source.fragment(rng, { minWords: 4, maxWords: 14 });
        if (seenTexts.has(f.text)) continue;
        seenTexts.add(f.text);
        const clause = parseChaotic(rng, f.text);
        if (clause) entries.push({ text: f.text, attribution: f.attribution, clauses: [clause] });
      }
    }
    if (!entries.length && source.mode === 'user') {
      const seenTexts = new Set();
      for (let i = 0; i < 8 && entries.length < 4; i++) {
        const f = source.fragment(rng, { minWords: 3, maxWords: 20 });
        if (seenTexts.has(f.text)) continue;
        seenTexts.add(f.text);
        const clause = cachedParse(f.text) || parseSentence(f.text) || parseChaotic(rng, f.text);
        if (clause) {
          if (clause.ai) aiParsed = clause.ai;
          entries.push({ text: f.text, attribution: f.attribution, clauses: [clause] });
        }
      }
      heuristic = entries.length > 0 && !aiParsed;
    }
    if (!entries.length) {
      const count = rng.int(2, 4);
      const pool = rng.shuffle(PARSES);
      entries = pool.slice(0, count);
      heuristic = false;
    }

    /* ---- compose: fit each entry, stack like stanzas ---- */
    const baseSize = 15;
    const maxW = box.w * 0.86;
    let widest = 0;
    for (const entry of entries) {
      for (const c of entry.clauses) widest = Math.max(widest, mClause(c, baseSize).width);
    }
    /* one schoolbook size for the whole page, grown into the measure */
    const size = Math.max(11, Math.min((baseSize * maxW) / Math.max(widest, 1), 22));
    const laid = [];
    for (const entry of entries) {
      const Ms = entry.clauses.map((c) => mClause(c, size));
      let h = 0;
      for (const M of Ms) h += size * 1.5 + M.underH + size * 1.6;
      laid.push({ entry, Ms, size, h });
    }
    let total = laid.reduce((s, l) => s + l.h + 44, -44);
    while (total > box.h * 0.92 && laid.length > 1) {
      total -= laid.pop().h + 44;
    }

    let y = sheet.snap(box.y + (box.h - total) / 2 + 14);
    const ROMAN = ['I', 'II', 'III', 'IV'];
    laid.forEach((l, ei) => {
      const numeral = smallCapsText(ROMAN[ei] + '.', {
        x: box.x, y: y + l.size, size: 11, family: serif,
        fill: accent || ink, opacity: accent ? 1 : 0.55,
      });
      nodes.push(numeral);
      let prevVerb = null;
      for (const M of l.Ms) {
        const x = box.x + box.w * 0.07 + (box.w * 0.86 - M.width) * 0.5;
        const lineY = y + l.size * 1.35;
        const { verbX } = drawClause(M, x, lineY, l.size);
        if (prevVerb) {
          /* the schoolroom dotted line joining clauses of one sentence */
          nodes.push(line(prevVerb.x, prevVerb.y + l.size * 0.6, verbX, lineY - l.size * 1.1, {
            stroke: ink, width: RULE, dash: '2 3', opacity: 0.6,
          }));
        }
        prevVerb = { x: verbX, y: lineY };
        y = lineY + M.underH + l.size * 1.6;
      }
      y += 44;
    });

    /* ---- the footnote owns the parse ---- */
    const footnote = misrule ? 'diagrammed by misrule — every word accounted for, nothing in its place'
      : aiParsed === 'ollama' ? 'parsed by a local model, taken on trust'
      : aiParsed ? 'parsed by claude, taken on trust'
      : heuristic ? 'parsed by rule — the errors are the machine’s own'
      : 'diagrammed by hand';
    nodes.push(smallCapsText(footnote, {
      x: sheet.width / 2, y: box.y + box.h, size: 10, family: serif,
      anchor: 'middle', fill: ink, opacity: 0.55,
    }));

    const atts = [...new Set(laid.map((l) => l.entry.attribution))];
    return {
      nodes: [g({}, ...nodes)],
      title: laid[0].entry.text.split(/\s+/).slice(0, 4).join(' ').toLowerCase().replace(/[^\p{L}\p{N}' ]/gu, ''),
      attribution: atts.slice(0, 2).join(' · ') + (atts.length > 2 ? ' et al.' : ''),
      caption: misrule
        ? 'after Reed & Kellogg (1877), diagrammed by misrule'
        : aiParsed
          ? 'after Reed & Kellogg (1877), parsed by a language model'
          : heuristic
            ? 'after Reed & Kellogg (1877), parsed by rule'
            : 'after Reed & Kellogg, Higher Lessons in English (1877)',
    };
  },
};
