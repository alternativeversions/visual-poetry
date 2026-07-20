/*
 * lineprinter — after Theo Lutz, Stochastische Texte (Zuse Z22, 1959);
 * Nanni Balestrini, Tape Mark I (1961); Alison Knowles & James Tenney,
 * A House of Dust (1967).
 *
 * The first computer poems arrived on continuous stationery, and this
 * site is their descendant; here it says so. Sprocket holes, form
 * perforations, a job header, chain-printer capitals — and the poem's
 * own words recombined by the ancestors' procedures: Lutz's logical
 * propositions, Balestrini's tape passes, the Knowles–Tenney house
 * frame. Chain-printer artifacts throughout: baseline wobble, doubled
 * strikes, a band where the ribbon dried. License break: pale
 * greenbar bands, accent at seven percent, across alternating line
 * groups — the palette rules never met an accounting department.
 */

import { el, g, textEl, line, r2 } from '../svg.js';
import { monoAdvance, FONTS } from '../typography.js';

const AZ = (s) => s.toUpperCase().replace(/[^A-Z0-9 '.,-]/g, '');

export default {
  id: 'lineprinter',
  name: 'line printer',
  lineage: 'Lutz (1959); Balestrini (1961); Knowles & Tenney (1967)',

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const size = 13;
    const adv = monoAdvance(size);
    const lead = 22;
    const cols = Math.floor(box.w / adv);
    const frag = source.fragment(rng, { minWords: 8, maxWords: 30 });
    const wordsRaw = frag.text.split(/\s+/).map((w) => w.replace(/[.,;:!?—"]+$/, '')).filter(Boolean);
    const letters = (w) => w.replace(/[^\p{L}]/gu, '');
    const nouns = [...new Set(wordsRaw.filter((w) => letters(w).length >= 5).map((w) => letters(w).toUpperCase()))];
    if (!nouns.length) nouns.push(...wordsRaw.map((w) => letters(w).toUpperCase()).filter(Boolean));
    if (!nouns.length) nouns.push('DUST');
    const shorts = [...new Set(wordsRaw.filter((w) => letters(w).length >= 3 && letters(w).length <= 5).map((w) => letters(w).toUpperCase()))];
    if (!shorts.length) shorts.push(...nouns);
    const chunks = frag.text.split(/(?<=[,;:.!?—])\s+/).map((c) => AZ(c.replace(/[.,;:!?—]+$/, ''))).filter((c) => c.length > 2);
    if (!chunks.length) chunks.push(AZ(frag.text) || 'THE TAPE IS BLANK');
    const N = () => rng.pick(nouns);
    const W = () => rng.pick(shorts);

    const mode = rng.pick(['dust', 'lutz', 'tape']);
    const lines = []; // strings; '' = blank row
    if (mode === 'dust') {
      const q = rng.int(4, 6);
      for (let i = 0; i < q; i++) {
        lines.push(`A ${N()} OF ${N()}`);
        lines.push(`     IN ${rng.pick(chunks)}`);
        lines.push(`     USING ${rng.pick(chunks)}`);
        lines.push(`     INHABITED BY ${N()}S`);
        lines.push('');
      }
    } else if (mode === 'lutz') {
      const n = rng.int(9, 14);
      for (let i = 0; i < n; i++) {
        lines.push(rng.pick([
          () => `EVERY ${N()} IS ${W()}.`,
          () => `NOT EVERY ${N()} IS ${W()}.`,
          () => `NO ${N()} IS EVERY ${W()}.`,
          () => `A ${N()} IS A ${N()} IS A ${N()}.`,
        ])());
        if (rng.chance(0.25)) lines.push('');
      }
    } else {
      const passes = rng.int(2, 4);
      for (let p = 1; p <= passes; p++) {
        lines.push(`TAPE PASS ${String(p).padStart(2, '0')}`);
        lines.push('');
        for (const c of rng.shuffle(chunks)) lines.push(c);
        lines.push('');
      }
    }

    /* high entropy: the printer misbehaves */
    if (entropy > 0.55 && lines.length > 4) {
      const at = rng.int(1, lines.length - 2);
      if (rng.chance(0.7) && lines[at]) {
        let run = lines[at].split(' ');
        const reps = rng.int(2, 3);
        const runaway = [];
        for (let k = 0; k < reps && run.length > 1; k++) { run = run.slice(0, -1); runaway.push(run.join(' ')); }
        lines.splice(at + 1, 0, ...runaway);
      }
    }

    const jobNames = { dust: 'A HOUSE OF DUST', lutz: 'STOCHASTISCHE TEXTE', tape: 'TAPE MARK' };
    const header = `RUN ${rng.hex(4).toUpperCase()} · ${jobNames[mode]} · PASS ${String(rng.int(1, 9)).padStart(2, '0')}`;

    const nodes = [];
    /* greenbar bands behind everything */
    const bandFill = palette.accent || ink;
    const bandOp = palette.accent ? 0.07 : 0.035;
    const totalRows = Math.min(lines.length + 4, Math.floor(box.h / lead));
    for (let rIdx = 0; rIdx < totalRows; rIdx += 4) {
      nodes.push(el('rect', {
        x: r2(box.x - 12), y: r2(box.y + rIdx * lead + 6),
        width: r2(box.w + 24), height: r2(lead * 2), fill: bandFill, opacity: bandOp,
      }));
    }
    /* sprocket holes */
    for (let y = sheet.margin / 2; y < sheet.height - sheet.margin / 4; y += 27) {
      for (const x of [sheet.margin / 2, sheet.width - sheet.margin / 2]) {
        nodes.push(el('circle', { cx: r2(x), cy: r2(y), r: 4.2, fill: 'none', stroke: ink, 'stroke-width': 0.8, opacity: 0.75 }));
      }
    }
    /* form perforations */
    for (let rIdx = 14; rIdx < totalRows; rIdx += 14) {
      nodes.push(line(0, box.y + rIdx * lead - lead / 2, sheet.width, box.y + rIdx * lead - lead / 2,
        { stroke: ink, width: 0.5, dash: '3 5', opacity: 0.5 }));
    }
    /* the text, with artifacts */
    const ribbonAt = rng.int(2, Math.max(3, totalRows - 4));
    let y = box.y + lead;
    nodes.push(textEl(header, { x: box.x, y, size, family: FONTS.mono, fill: ink, preserveSpace: true }));
    y += lead;
    nodes.push(textEl('='.repeat(Math.min(cols, header.length)), { x: box.x, y, size, family: FONTS.mono, fill: ink }));
    y += lead * 2;
    let printed = 0;
    for (const ln of lines) {
      if (y > box.y + box.h - lead) break;
      const row = Math.round((y - box.y) / lead);
      const faded = Math.abs(row - ribbonAt) <= 1;
      if (ln) {
        const wobble = rng.chance(0.12 + entropy * 0.15);
        const struck = entropy > 0.6 && rng.chance((entropy - 0.5) * 0.4);
        const opacity = faded ? 0.45 : 1;
        const text = ln.slice(0, cols);
        if (wobble) {
          for (let c = 0; c < text.length; c++) {
            if (text[c] === ' ') continue;
            nodes.push(textEl(text[c], {
              x: box.x + c * adv + adv / 2, y: y + rng.gauss(0, 1.1),
              size, family: FONTS.mono, fill: ink, anchor: 'middle', opacity,
            }));
          }
        } else {
          nodes.push(textEl(text, { x: box.x, y, size, family: FONTS.mono, fill: ink, opacity, preserveSpace: true }));
          if (rng.chance(0.06)) nodes.push(textEl(text, {
            x: box.x + 0.5, y: y + 0.4, size, family: FONTS.mono, fill: ink, opacity: opacity * 0.55, preserveSpace: true,
          }));
        }
        if (struck) nodes.push(textEl('X'.repeat(Math.min(text.length, cols)), {
          x: box.x, y, size, family: FONTS.mono, fill: ink, opacity: 0.8, preserveSpace: true,
        }));
        printed++;
      }
      y += lead;
    }
    /* if the sheet somehow holds nothing, print the header again (presence guard) */
    if (!printed) nodes.push(textEl('NNNN', { x: box.x, y: box.y + lead * 4, size, family: FONTS.mono, fill: ink }));

    const first = lines.find((l) => l) || header;
    const captions = {
      dust: 'after Alison Knowles & James Tenney, A House of Dust (1967)',
      lutz: 'after Theo Lutz, Stochastische Texte (1959)',
      tape: 'after Nanni Balestrini, Tape Mark I (1961)',
    };
    return {
      nodes: [g({}, ...nodes)],
      title: first.toLowerCase(),
      attribution: frag.attribution,
      caption: captions[mode],
    };
  },
};
