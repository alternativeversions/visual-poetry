# Nine New Engines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Grow TYPESTRACT from sixteen to twenty-five engines per
`docs/superpowers/specs/2026-07-18-nine-new-engines-design.md`.

**Architecture:** Nine self-contained engine modules in `src/engines/`, each a
pure visual grammar `{ id, name, lineage, generate(rng, source, sheet) }`
returning `{ nodes, title, attribution, caption? }`. One additive change to
`src/text/procedures.js` (fragments carry `mood`/`lang`/`kind`). Registry,
colophon captions, and README updated alongside. No new shared modules; no
build step; no dependencies.

**Tech Stack:** Vanilla ES modules, inline SVG via `src/svg.js` builders,
seeded PRNG (`src/prng.js`), metrics via `src/typography.js`. Tests:
`node tools/smoke.mjs` + headless Chrome screenshots.

## Global Constraints

- Determinism: all randomness from the passed `rng`; never `Math.random`, never `Date`. Same seed ⇒ byte-identical SVG.
- Purity: engines touch nothing outside their arguments; DOM only through `src/svg.js` builders.
- Real text only: `<text>`/`<tspan>`/`<textPath>`; drawn marks are filled/stroked paths. Never `foreignObject`, never SVG `<marker>`.
- Colophon captions cite real poets/works/dates and must match smoke's regex: `/after .*\(|after .*\d{4}|via /`.
- No engine throws on any source mode or degenerate input (single pasted word, one-phrase fragment). Degrade to a sparser poem, never an error.
- License breaks (landscape sheet, forced accent, tinted bands, poster type, curved staves) are deliberate and declared in the engine's header comment.
- Round coordinates through `r2()` (the `svg.js` builders do this for you; do it yourself in raw `d` strings via `polyPath`/`smoothPath`, which already round).
- Every task ends with `node tools/smoke.mjs` printing `All checks passed.` and a commit in the repository's voice with the `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` trailer.
- Captions are added to `src/colophon.js` in the same task as the engine — smoke's colophon check fails on the fallback caption.

**Shared APIs (read once, used by every task):**

- `rng()` → float [0,1); `rng.int(min,max)` incl.; `rng.range(min,max)`; `rng.chance(p)`; `rng.pick(arr)`; `rng.weighted([{value,weight}])`; `rng.shuffle(arr)` (copy); `rng.gauss(mean,sd)`; `rng.hex(n)`.
- `sheet`: `{ width, height, margin, palette: {paper, ink, accent|null}, baseline, entropy, material, fonts, scale(n), box: {x,y,w,h}, snap(y), line(n), lines }`.
- `source`: `fragment(r, {minWords, maxWords})` → `{text, tokens, attribution, mood|null, lang|null, kind|null}` (after Task 0); `word(r)` → `{text, attribution}`; `sentence(r, minWords)`; `mode`; `userText`.
- `svg.js`: `el(name, attrs, ...children)`, `g(attrs, ...children)`, `r2(n)`, `textEl(str, {x,y,size,family,fill,style,weight,anchor,tracking,opacity,transform,decoration,preserveSpace})`, `smallCapsText(str, {x,y,size,family,fill,weight,anchor,trackingEm,opacity,transform})` (returns node with `._width`), `smallCapsMeasure(str, {size,family,trackingEm})`, `line(x1,y1,x2,y2,{stroke,width,linecap,dash,opacity})`, `path(d,{fill,stroke,width,linecap,linejoin,dash,opacity,transform,id})`, `polyPath(pts)`, `smoothPath(pts,tension)`, `arrowHead(x,y,angle,size,fill)`, `tick(x,y,angle,len,attrs)`, `textOnPath(str, pathD, defs, {family,size,fill,style,tracking,opacity,startOffset})`, `inkStroke(pts, widths, fill)`, `uid(prefix)`.
- `typography.js`: `FONTS.{serif,sans,mono}`, `measure(text, {size,family,style,weight,tracking})`, `monoAdvance(size)`, `breakLines(text, maxWidth, {size,family,...})`, `makeScale`.
- ClipPath idiom (from `decollage.js`): `const defs = el('defs'); const clipId = uid('x'); const clip = el('clipPath', {id: clipId}); clip.appendChild(path(d, {fill:'#000'})); defs.appendChild(clip);` then `g({'clip-path': 'url(#' + clipId + ')'}, ...)`. Include `defs` in returned `nodes` (first).
- When one layout must appear in several clipped copies, precompute a **layout array** (plain data: `{str, x, y, size, ...}`) and build fresh nodes per copy from it — nodes cannot have two parents, and re-running layout code would advance the rng differently.

**Visual check harness (used by every engine task):** start a server once,
in the background, from the repo root:

```bash
python3 -m http.server 8000
```

Screenshot a render (macOS, Chrome installed):

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu \
  --screenshot=/private/tmp/claude-501/-Users-alextyson-dev-visual-poetry/a43553ca-cde2-419a-9289-41161ae37290/scratchpad/ENGINE-SEED.png \
  --window-size=1200,1500 "http://localhost:8000/#engine=ENGINE&seed=SEED"
```

Read the PNG with the Read tool. Entropy is not URL-addressable; the default
0.5 render is what screenshots show — check entropy extremes by temporarily
hardcoding `entropy` in the screenshot session only if a high-entropy branch
looks doubtful, and never commit that change. Visual tuning (sizes, spacing,
densities) is allowed and expected after the screenshot — it must stay
seeded, and smoke must pass again afterwards.

---

### Task 0: Fragments carry their weather (mood/lang/kind passthrough)

**Files:**
- Modify: `src/text/procedures.js` (functions `plain`, `erasure`, and the stutter/recombine returns)

**Interfaces:**
- Produces: `source.fragment()` results now include `mood`, `lang`, `kind` (each a string or `null`). Only `aria` (Task 8) reads `mood`; nothing else changes.

- [ ] **Step 1: Verify the current absence (the "failing test")**

```bash
cd /Users/alextyson/dev/visual-poetry && node --input-type=module -e "
const { makeRng } = await import('./src/prng.js');
const { makeTextSource } = await import('./src/text/procedures.js');
const s = makeTextSource(makeRng('t1'), { mode: 'corpus' });
const f = s.fragment(makeRng('t2'));
console.log(JSON.stringify({ mood: f.mood ?? null, kind: f.kind ?? null, lang: f.lang ?? null }));
"
```

Expected: `{"mood":null,"kind":null,"lang":null}` (fields absent → null).

- [ ] **Step 2: Implement the passthrough**

In `src/text/procedures.js`, change `plain()` to:

```js
function plain(fragment) {
  return {
    text: fragment.text,
    tokens: fragment.text.split(/\s+/).map((word) => ({ word })),
    attribution: fragment.attribution,
    mood: fragment.mood || null,
    lang: fragment.lang || null,
    kind: fragment.kind || null,
  };
}
```

In `erasure()`, add to the returned object (after `attribution`):

```js
    mood: fragment.mood || null,
    lang: fragment.lang || null,
    kind: fragment.kind || null,
```

In `source.fragment`'s procedural branch, the stutter return gains
`mood: frag.mood || null, lang: frag.lang || null, kind: frag.kind || null`,
and `recombine()`'s return gains
`mood: fragA.mood || null, lang: fragA.lang || null, kind: fragA.kind || null`.
(User-text fragments flow through `plain()` with no tags → all null, as specced.)

- [ ] **Step 3: Re-run the probe from Step 1**

Expected: real values, e.g. `{"mood":"elegiac","kind":"line","lang":"en"}`.

- [ ] **Step 4: Run smoke (no behavior change for existing engines)**

Run: `node tools/smoke.mjs` — Expected: `All checks passed.`

- [ ] **Step 5: Commit**

```bash
git add src/text/procedures.js
git commit -m "the fragments remember their weather: mood, kind, and tongue ride along

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 1: `calligramme` — drawing with the line of text

**Files:**
- Create: `src/engines/calligramme.js`
- Modify: `src/engines/index.js` (import + `ENGINES`)
- Modify: `src/colophon.js` (`CAPTIONS.calligramme`)

**Interfaces:**
- Consumes: `textOnPath`, `smoothPath`, `el`, `g`, `textEl`, `path`, `r2` from `svg.js`; `measure`, `FONTS` from `typography.js`; `sheet.material === 'asemic'` for hybrid.
- Produces: registry entry `id: 'calligramme'`; proves the textPath→defs→export pipeline for later tasks (`tendre` reuses it).

- [ ] **Step 1: Write `src/engines/calligramme.js`**

```js
/*
 * calligramme — after Guillaume Apollinaire: "Lettre-Océan" (1914),
 * "Il Pleut" (1916), Calligrammes (1918).
 *
 * Technopaegnia fills shapes with measured text; this engine draws with
 * the line of text itself, on real textPath curves. Three figures: the
 * rain of "Il Pleut" — five wavering threads falling the height of the
 * page; the jet d'eau of "La colombe poignardée" — threads rising from
 * a basin, arcing, and falling to a pool; and the radial océan of
 * "Lettre-Océan" — a hub word with text spokes and concentric rings,
 * Apollinaire hearing the wireless. At high entropy the weather wins:
 * wind bends and crosses the rain, the fountain breaks into droplet
 * letters past the end of its arc, the océan's rings shatter to arcs.
 * License breaks: none the tradition didn't make first.
 */

import { el, g, textEl, smoothPath, textOnPath, inkStroke, r2 } from '../svg.js';
import { FONTS } from '../typography.js';

/* Split into phrase-sized pieces; always returns at least one piece. */
function phrasesOf(text, want) {
  let parts = text.split(/(?<=[,;:.!?—])\s+/).filter((p) => p.trim().length);
  if (parts.length < want) {
    const words = text.split(/\s+/).filter(Boolean);
    const per = Math.max(2, Math.ceil(words.length / want));
    parts = [];
    for (let i = 0; i < words.length; i += per) parts.push(words.slice(i, i + per).join(' '));
  }
  if (!parts.length) parts = [text || 'pluie'];
  return parts;
}

const strip = (s) => s.replace(/[.,;:!?—]+$/, '');

export default {
  id: 'calligramme',
  name: 'calligramme',
  lineage: 'Apollinaire, “Lettre-Océan” (1914); “Il Pleut” (1916)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const defs = el('defs');
    const nodes = [];
    const mode = rng.weighted([
      { value: 'rain', weight: 4 },
      { value: 'fountain', weight: 3 },
      { value: 'ocean', weight: 3 },
    ]);
    const frag = source.fragment(rng, { minWords: 6, maxWords: 24 });
    let title = '';
    let caption = '';

    if (mode === 'rain') {
      caption = 'after Apollinaire, “Il Pleut” (1916)';
      const threads = 5;
      const phrases = phrasesOf(frag.text, threads);
      const amp = 8 + entropy * 42;
      const lean = 30 + entropy * 90; // rain falls aslant, as in SIC
      const accentAt = palette.accent ? rng.int(0, threads - 1) : -1;
      for (let i = 0; i < threads; i++) {
        const x0 = box.x + ((i + 0.6) / threads) * box.w * 0.92 + rng.range(-14, 14);
        const len = box.h * rng.range(0.62, 0.98);
        const pts = [];
        const n = 7;
        for (let k = 0; k <= n; k++) {
          const t = k / n;
          pts.push([
            x0 + t * lean * rng.range(0.6, 1) + Math.sin(t * Math.PI * rng.range(1.5, 3)) * amp,
            box.y + 6 + t * len,
          ]);
        }
        const d = smoothPath(pts);
        /* hybrid: asemic material rains near-writing instead of words */
        if (sheet.material === 'asemic') {
          const widths = pts.map((_, q) => 0.6 + Math.sin((q / n) * Math.PI) * rng.range(1.4, 2.8));
          nodes.push(inkStroke(pts, widths, i === accentAt ? palette.accent : ink));
          continue;
        }
        const phrase = phrases[i % phrases.length];
        const size = rng.range(11.5, 14.5);
        nodes.push(textOnPath(phrase, d, defs, {
          size, family: FONTS.serif, style: 'italic',
          fill: i === accentAt ? palette.accent : ink,
          tracking: size * rng.range(0.06, 0.22),
        }));
        /* droplet letters shaken loose below the thread's end */
        if (entropy > 0.55 && rng.chance(entropy)) {
          const tail = strip(phrase.split(/\s+/).pop() || 'eau');
          for (let j = 0; j < Math.min(tail.length, rng.int(2, 5)); j++) {
            const dx = rng.gauss(0, amp * 0.6);
            const dy = rng.range(10, box.y + box.h - (pts[n][1] + 4));
            nodes.push(textEl(tail[j], {
              x: pts[n][0] + dx, y: pts[n][1] + Math.max(10, dy), size: size * 0.9,
              family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
              opacity: r2(rng.range(0.35, 0.8)),
            }));
          }
        }
      }
      title = `il pleut ${strip(phrases[0].split(/\s+/)[0] || '').toLowerCase()}`;
    }

    if (mode === 'fountain') {
      caption = 'after the jet d’eau, via “La colombe poignardée et le jet d’eau” (1918)';
      const cx = box.x + box.w / 2;
      const baseY = box.y + box.h * rng.range(0.72, 0.82);
      const jets = rng.int(4, 6) + (entropy > 0.6 ? rng.int(0, 2) : 0);
      const phrases = phrasesOf(frag.text, jets + 1);
      const accentAt = palette.accent ? rng.int(0, jets - 1) : -1;
      for (let i = 0; i < jets; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const spread = (Math.ceil((i + 1) / 2) / Math.ceil(jets / 2)) * box.w * 0.34;
        const apexY = box.y + box.h * rng.range(0.12, 0.3) + (spread / box.w) * box.h * 0.18;
        const over = entropy > 0.6 && rng.chance(entropy - 0.3) ? rng.range(1.1, 1.35) : 1;
        const pts = [
          [cx + side * rng.range(0, 8), baseY],
          [cx + side * spread * 0.35, (baseY + apexY) / 2],
          [cx + side * spread * 0.8, apexY],
          [cx + side * spread * 1.15, (baseY + apexY) / 2],
          [cx + side * spread * 1.3 * over, baseY - rng.range(0, 20)],
        ];
        const size = rng.range(11, 14);
        nodes.push(textOnPath(phrases[i % phrases.length], smoothPath(pts), defs, {
          size, family: FONTS.serif, style: 'italic',
          fill: i === accentAt ? palette.accent : ink,
          tracking: size * 0.08,
        }));
      }
      /* the pool: one line on a shallow curve */
      const poolR = box.w * 0.36;
      const poolD = `M${r2(cx - poolR)} ${r2(baseY + 14)} Q${r2(cx)} ${r2(baseY + 44)} ${r2(cx + poolR)} ${r2(baseY + 14)}`;
      nodes.push(textOnPath(phrases[jets % phrases.length], poolD, defs, {
        size: 13, family: FONTS.serif, fill: ink, tracking: 1.2,
      }));
      title = 'jet d’eau';
    }

    if (mode === 'ocean') {
      caption = 'after Apollinaire, “Lettre-Océan” (1914)';
      const hub = source.word(rng).text.toUpperCase();
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h * 0.46;
      const rMax = Math.min(box.w, box.h * 0.86) / 2 - 10;
      nodes.push(textEl(hub, {
        x: cx, y: cy + sheet.scale(2) * 0.32, size: sheet.scale(2),
        family: FONTS.sans, fill: ink, anchor: 'middle', tracking: sheet.scale(2) * 0.12,
      }));
      const spokes = rng.int(8, 11) + Math.round(entropy * 4);
      const words = frag.text.split(/\s+/).filter(Boolean);
      const rot = rng.range(0, Math.PI * 2);
      for (let i = 0; i < spokes; i++) {
        const a = rot + (i / spokes) * Math.PI * 2 + rng.gauss(0, entropy * 0.05);
        const r0 = rMax * 0.22;
        const d = `M${r2(cx + Math.cos(a) * r0)} ${r2(cy + Math.sin(a) * r0)} L${r2(cx + Math.cos(a) * rMax)} ${r2(cy + Math.sin(a) * rMax)}`;
        const text = words.slice(i % words.length).concat(words).slice(0, rng.int(3, 6)).map(strip).join(' ');
        nodes.push(textOnPath(text, d, defs, {
          size: rng.range(10.5, 13), family: FONTS.serif, fill: ink, tracking: 0.6,
        }));
      }
      const rings = rng.int(1, 2);
      for (let i = 0; i < rings; i++) {
        const r = rMax * (0.5 + i * 0.32);
        const broken = entropy > 0.6 && rng.chance(entropy - 0.2);
        const sweep = broken ? rng.range(0.45, 0.8) : 1;
        const a0 = rng.range(0, Math.PI * 2);
        const a1 = a0 + Math.PI * 2 * sweep;
        const large = sweep > 0.5 ? 1 : 0;
        const d = broken
          ? `M${r2(cx + Math.cos(a0) * r)} ${r2(cy + Math.sin(a0) * r)} A${r2(r)} ${r2(r)} 0 ${large} 1 ${r2(cx + Math.cos(a1) * r)} ${r2(cy + Math.sin(a1) * r)}`
          : `M${r2(cx + r)} ${r2(cy)} A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx - r)} ${r2(cy)} A${r2(r)} ${r2(r)} 0 1 1 ${r2(cx + r)} ${r2(cy)}`;
        nodes.push(textOnPath(frag.text, d, defs, {
          size: 11.5, family: FONTS.serif, style: 'italic',
          fill: palette.accent && i === 0 ? palette.accent : ink,
          startOffset: `${rng.int(0, 40)}%`,
        }));
      }
      title = `${hub.toLowerCase()}-océan`;
    }

    return { nodes: [defs, g({}, ...nodes)], title, attribution: frag.attribution, caption };
  },
};
```

Hybrid note: when `sheet.material === 'asemic'`, the rain mode prints its
threads as ink strokes — near-writing weather — per the branch above;
fountain and océan ignore the material (allowed: hybrids offer, never
require).

- [ ] **Step 2: Register the engine**

In `src/engines/index.js` add `import calligramme from './calligramme.js';`
after the `transmission` import, and append `calligramme` to the `ENGINES`
array (inside the brackets, after `transmission`).

- [ ] **Step 3: Add captions**

In `src/colophon.js`, after the `transmission` entry in `CAPTIONS`, add:

```js
  calligramme: [
    'after Guillaume Apollinaire, “Il Pleut” (1916)',
    'after Apollinaire, “Lettre-Océan” (1914)',
    'after Apollinaire’s Calligrammes (1918)',
  ],
```

- [ ] **Step 4: Run smoke**

Run: `node tools/smoke.mjs`
Expected: a new line `ok  calligramme (6 seeds × 3 modes)` and `All checks passed.`

- [ ] **Step 5: Visual check**

Screenshot seeds `8f3a21c9`, `deadbeef`, `cafe1234` with
`#engine=calligramme&seed=…` per the harness above; Read each PNG. Look
for: threads legible and non-colliding, rain leaning one way, océan hub
clear of its spokes, exactly one accent thread when accent is present.
Tune constants (amplitudes, sizes, radii) if needed; re-run smoke after.

- [ ] **Step 6: Commit**

```bash
git add src/engines/calligramme.js src/engines/index.js src/colophon.js
git commit -m "calligramme: drawing with the line itself, after Apollinaire (1914–18)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: `rollage` — the poem sliced and re-woven

**Files:**
- Create: `src/engines/rollage.js`
- Modify: `src/engines/index.js` (import + `ENGINES`)
- Modify: `src/colophon.js` (`CAPTIONS.rollage`)

**Interfaces:**
- Consumes: clipPath idiom and layout-array pattern from Global Constraints; `breakLines`, `measure`.
- Produces: registry entry `id: 'rollage'`; the layout-array + clip pattern reused by `inscription` (Task 6).

- [ ] **Step 1: Write `src/engines/rollage.js`**

```js
/*
 * rollage — after Jiří Kolář, rollage (1962–).
 *
 * Kolář sliced two reproductions into strips and re-wove them into one
 * sheet that waves between its sources. Here the same fragment is set
 * twice — once monumental, display words filling the sheet; once as a
 * dense small-text block, the fragment repeated like newsprint — and
 * the two settings are cut into vertical strips and interleaved. One
 * layer takes a progressive vertical shift per strip: the shear. At
 * high entropy the strips narrow, shuffle, and some flip 180° — the
 * reverse rollage. License breaks: poster-scale display type; when the
 * accent lands, the small layer prints entirely in it — a two-color
 * separation no letterpress would apologize for.
 */

import { el, g, textEl, r2, uid } from '../svg.js';
import { measure, breakLines, FONTS } from '../typography.js';

export default {
  id: 'rollage',
  name: 'rollage',
  lineage: 'Jiří Kolář, rollage (1962–)',

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 4, maxWords: 18 });
    const words = frag.text.split(/\s+/).filter(Boolean);

    /* ---- layer A layout: the monument (plain data, built per strip) ---- */
    const heads = words.slice(0, Math.min(words.length, rng.int(2, 4)))
      .map((w) => w.replace(/[.,;:!?—]+$/, '').toUpperCase());
    const layoutA = [];
    {
      const rotated = rng.chance(0.25);
      const usable = rotated ? box.h : box.w;
      let size = 160;
      for (const w of heads) {
        const fit = (usable * 0.92) / Math.max(1, measure(w, { size: 100, family: FONTS.sans, weight: 'bold' }) / 100);
        size = Math.min(size, Math.max(64, fit));
      }
      const lead = size * 1.02;
      const blockH = heads.length * lead;
      const y0 = box.y + (box.h - blockH) / 2 + size * 0.8;
      heads.forEach((w, i) => {
        layoutA.push({
          str: w, size, family: FONTS.sans, weight: 'bold', anchor: 'middle',
          x: box.x + box.w / 2, y: y0 + i * lead,
          transform: rotated ? `rotate(-90 ${r2(box.x + box.w / 2)} ${r2(box.y + box.h / 2)})` : null,
        });
      });
    }

    /* ---- layer B layout: the dense block ---- */
    const layoutB = [];
    {
      const size = rng.range(12, 14);
      const lead = size * 1.28;
      let text = frag.text;
      while (measure(text, { size, family: FONTS.serif }) < box.w * (box.h / lead) * 0.95) text += ' ' + frag.text;
      const lines = breakLines(text, box.w, { size, family: FONTS.serif });
      let y = box.y + size;
      for (const ln of lines) {
        if (y > box.y + box.h) break;
        layoutB.push({ str: ln, size, family: FONTS.serif, x: box.x, y });
        y += lead;
      }
    }

    const buildLayer = (layout, fill) =>
      g({}, ...layout.map((t) => textEl(t.str, { ...t, fill })));

    /* ---- the strips ---- */
    const defs = el('defs');
    const nodes = [defs];
    const stripW = rng.range(48, 26) - entropy * rng.range(0, 18); // narrows as entropy rises
    const w = Math.max(14, stripW);
    const count = Math.ceil(box.w / w);
    const shiftPer = (2 + entropy * 12) * (rng.chance(0.5) ? 1 : -1);
    const order = entropy > 0.6 ? rng.shuffle([...Array(count).keys()]) : [...Array(count).keys()];
    const fillB = palette.accent || ink;

    for (let i = 0; i < count; i++) {
      const sx = box.x + i * w;
      const clipId = uid('strip');
      const clip = el('clipPath', { id: clipId });
      clip.appendChild(el('rect', { x: r2(sx), y: 0, width: r2(w + 0.6), height: sheet.height }));
      defs.appendChild(clip);
      const src = order[i];
      const isA = src % 2 === 0;
      const dy = isA ? 0 : (src - count / 2) * shiftPer;
      const flip = entropy > 0.7 && rng.chance((entropy - 0.55) * 0.9);
      const layer = buildLayer(isA ? layoutA : layoutB, isA ? ink : fillB);
      const t = [];
      if (dy) t.push(`translate(0 ${r2(dy)})`);
      if (flip) t.push(`rotate(180 ${r2(sx + w / 2)} ${r2(sheet.height / 2)})`);
      nodes.push(g({ 'clip-path': `url(#${clipId})`, transform: t.length ? t.join(' ') : null }, layer));
    }

    return {
      nodes,
      title: heads.join(' ').toLowerCase() || frag.text.split(/\s+/)[0],
      attribution: frag.attribution,
    };
  },
};
```

- [ ] **Step 2: Register** — in `src/engines/index.js` add
`import rollage from './rollage.js';` and append `rollage` to `ENGINES`
(after `calligramme`; from here on, each task appends after the previous
task's engine, building the spec's registry order).

Note: spec orders the registry `intextus, tendre, aria, lineprinter,
mesostic, index, rollage, inscription, calligramme` — tasks land in
implementation order instead. **Task 10 reorders the `ENGINES` array and
the import block to the spec's order** once all nine exist; until then,
append order is fine.

- [ ] **Step 3: Captions** — in `src/colophon.js` add:

```js
  rollage: [
    'after Jiří Kolář, rollage (1962–)',
    'after the sliced image, via Kolář (1962–)',
    'after Kolář’s chiasmage and rollage (1960s)',
  ],
```

- [ ] **Step 4: Run smoke** — `node tools/smoke.mjs` → `ok  rollage (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Visual check** — screenshot 3 seeds as in Task 1. Look for:
monument words readable through the weave, shear visible but not chaotic at
default entropy, both layers present in every render, accent layer only
when the colophon names an accent. Tune `stripW`/`shiftPer` if needed.

- [ ] **Step 6: Commit**

```bash
git add src/engines/rollage.js src/engines/index.js src/colophon.js
git commit -m "rollage: the poem sliced and re-woven, after Kolář (1962–)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: `intextus` — the woven grid

**Files:**
- Create: `src/engines/intextus.js`
- Modify: `src/engines/index.js` (import + `ENGINES`, after `rollage`)
- Modify: `src/colophon.js` (`CAPTIONS.intextus`)

**Interfaces:**
- Consumes: `textEl`, `el`, `g`, `r2`; `FONTS`; `sheet.material === 'typestract'` (grid in mono).
- Produces: registry entry `id: 'intextus'`.

- [ ] **Step 1: Write `src/engines/intextus.js`**

```js
/*
 * intextus — after Optatian Porfyry's carmina cancellata (4th c. CE)
 * and Hrabanus Maurus, De laudibus sanctae crucis (c. 810).
 *
 * The oldest grid poem: letters marshalled into rank and file, and a
 * second poem — the versus intextus — threading through them along a
 * figure, picked out in color. The tinted letters, read in the order
 * the figure is drawn, really do spell the buried phrase; the foot of
 * the sheet quotes it so the reader can check. At high entropy the
 * field reverses, Hrabanus's way: the figure's cells flood with ink
 * and carry paper-colored letters. License breaks: accent always
 * (the intext needs its color); ink as field, not line.
 */

import { el, g, textEl, r2 } from '../svg.js';
import { FONTS } from '../typography.js';

/* Figure walks: ordered [col,row] cell lists on a cols×rows grid. */
const FIGURES = {
  cross(c, r) {
    const cells = [];
    const mc = Math.floor(c / 2);
    for (let y = 0; y < r; y++) cells.push([mc, y]);
    const my = Math.floor(r / 2.6); // crossing above center, as on a crucifix
    for (let x = 0; x < c; x++) if (x !== mc) cells.push([x, my]);
    return cells;
  },
  saltire(c, r) {
    const cells = [];
    const n = Math.min(c, r);
    for (let i = 0; i < n; i++) cells.push([Math.round((i / (n - 1)) * (c - 1)), Math.round((i / (n - 1)) * (r - 1))]);
    for (let i = 0; i < n; i++) {
      const cell = [Math.round((i / (n - 1)) * (c - 1)), Math.round(((n - 1 - i) / (n - 1)) * (r - 1))];
      if (!cells.some((q) => q[0] === cell[0] && q[1] === cell[1])) cells.push(cell);
    }
    return cells;
  },
  lozenge(c, r) {
    const cells = [];
    const mc = (c - 1) / 2;
    const mr = (r - 1) / 2;
    const steps = 2 * (Math.min(c, r) - 1);
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const cell = [Math.round(mc + Math.cos(t) * mc * 0.86), Math.round(mr + Math.sin(t) * mr * 0.86)];
      if (!cells.some((q) => q[0] === cell[0] && q[1] === cell[1])) cells.push(cell);
    }
    return cells;
  },
  ring(c, r) {
    const cells = [];
    const mc = (c - 1) / 2;
    const mr = (r - 1) / 2;
    const rad = Math.min(mc, mr) * 0.82;
    const steps = Math.round(rad * 8);
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2 - Math.PI / 2;
      const cell = [Math.round(mc + Math.cos(t) * rad), Math.round(mr + Math.sin(t) * rad * 1.1)];
      if (!cells.some((q) => q[0] === cell[0] && q[1] === cell[1])) cells.push(cell);
    }
    return cells;
  },
};

const lettersOnly = (s) => s.toUpperCase().replace(/[^\p{L}]/gu, '');

export default {
  id: 'intextus',
  name: 'intextus',
  lineage: 'Optatian’s carmina cancellata (4th c.); Hrabanus Maurus (c. 810)',
  paletteOpts: { accent: 'force' },
  acceptsMaterial: ['typestract'],

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const accent = palette.accent || ink;
    const mono = sheet.material === 'typestract';
    const family = mono ? FONTS.mono : FONTS.serif;
    const frag = source.fragment(rng, { minWords: 8, maxWords: 30 });

    /* the intext: 2–5 consecutive words, 6–26 letters */
    const words = frag.text.split(/\s+/).filter(Boolean);
    let intext = words[0] || 'LVX';
    for (let tries = 0; tries < 12; tries++) {
      const at = rng.int(0, Math.max(0, words.length - 2));
      const take = rng.int(2, Math.min(5, words.length - at));
      const cand = words.slice(at, at + take).join(' ');
      const n = lettersOnly(cand).length;
      if (n >= 6 && n <= 26) { intext = cand; break; }
    }
    const intextLetters = lettersOnly(intext) || 'LVX';

    /* the grid */
    const cols = rng.int(21, 27);
    const cell = box.w / cols;
    const rows = Math.max(12, Math.min(38, Math.floor((box.h - 40) / cell)));
    const size = cell * 0.62;
    const figureName = rng.pick(Object.keys(FIGURES));
    const figCells = FIGURES[figureName](cols, rows);
    const figKey = new Map(figCells.map((q, i) => [q[0] + ':' + q[1], i]));

    const stream = lettersOnly(frag.text) || 'SILENTIVM';
    const reversed = entropy > 0.66;
    const nodes = [];
    let k = 0; // stream cursor (skips figure cells, keeps reading order)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const cx = box.x + (x + 0.5) * cell;
        const cy = box.y + (y + 0.72) * cell;
        const fi = figKey.get(x + ':' + y);
        if (fi !== undefined) {
          const ch = intextLetters[fi % intextLetters.length];
          if (reversed) {
            nodes.push(el('rect', {
              x: r2(box.x + x * cell), y: r2(box.y + y * cell),
              width: r2(cell), height: r2(cell), fill: ink,
            }));
            nodes.push(textEl(ch, { x: cx, y: cy, size, family, fill: palette.paper, anchor: 'middle' }));
          } else {
            nodes.push(textEl(ch, { x: cx, y: cy, size, family, fill: accent, anchor: 'middle', weight: 'bold' }));
          }
        } else {
          nodes.push(textEl(stream[k % stream.length], { x: cx, y: cy, size, family, fill: ink, anchor: 'middle' }));
          k++;
        }
      }
    }

    /* the foot: quote the buried verse so the reader can verify */
    nodes.push(textEl(`intextus: ${intext.toLowerCase()}`, {
      x: box.x + box.w / 2, y: box.y + rows * cell + 26,
      size: 12, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
    }));

    return {
      nodes: [g({}, ...nodes)],
      title: intext.toLowerCase(),
      attribution: frag.attribution,
      caption: figureName === 'cross' || figureName === 'saltire'
        ? 'after Hrabanus Maurus, De laudibus sanctae crucis (c. 810)'
        : 'after Optatian’s carmina cancellata (4th c.)',
    };
  },
};
```

(The spec also lists a chi and the poem's initial as figures; the saltire
**is** the chi, and the initial-letter figure is cut — a 5×7 bitfont earns
its place only if the four figures above feel thin after visual review.
Note the cut in the commit body.)

- [ ] **Step 2: Register** — `import intextus from './intextus.js';`, append after `rollage`.

- [ ] **Step 3: Captions** — add to `CAPTIONS`:

```js
  intextus: [
    'after Optatian’s carmina cancellata (4th c.)',
    'after Hrabanus Maurus, De laudibus sanctae crucis (c. 810)',
    'after the versus intexti, via Hrabanus (c. 810)',
    'after the letter-grid poem, via Optatian (4th c.)',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  intextus (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Verify the intext really reads** — one-off check that tinted
letters in figure order spell the phrase (cycled): screenshot two seeds and
read the figure in draw order against the foot line. If a figure's walk
order makes the phrase unreadable (e.g. the saltire's second diagonal
restarting confusingly), reorder that figure's cell list, not the planting.

- [ ] **Step 6: Commit**

```bash
git add src/engines/intextus.js src/engines/index.js src/colophon.js
git commit -m "intextus: the hidden verse threads the grid, after Optatian and Hrabanus (c. 810)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: `mesostic` — the spine of capitals

**Files:**
- Create: `src/engines/mesostic.js`
- Modify: `src/engines/index.js` (import + `ENGINES`, after `intextus`)
- Modify: `src/colophon.js` (`CAPTIONS.mesostic`)

**Interfaces:**
- Consumes: `measure` (prefix widths — the spine letter must sit exactly on the axis), `textEl`, `g`.
- Produces: registry entry `id: 'mesostic'`.

- [ ] **Step 1: Write `src/engines/mesostic.js`**

```js
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

    /* the spine: prefer a word of 4+ letters */
    let spine = source.word(rng).text;
    for (let i = 0; i < 5 && spine.length < 4; i++) spine = source.word(rng).text;
    spine = spine.toLowerCase().replace(/[^\p{L}]/gu, '') || 'cage';

    /* the wing text */
    const fragA = source.fragment(rng, { minWords: 8, maxWords: 30 });
    const fragB = source.fragment(rng, { minWords: 8, maxWords: 30 });
    const wing = (fragA.text + ' ' + fragB.text).split(/\s+/).map(clean).filter(Boolean);

    const size = 15;
    const spineSize = sheet.scale(1); // one step up
    const lead = sheet.baseline * (1.35 - entropy * 0.35);
    const rows = [];
    let p = 0; // pointer into wing, cycling
    let wraps = 0;
    const at = (i) => wing[i % wing.length];

    const totalRows = Math.floor((box.h * 0.86) / lead);
    outer: for (let cycle = 0; cycle < 3; cycle++) {
      if (cycle > 0) rows.push(null); // blank row between cycles
      for (const L of spine) {
        if (rows.length >= totalRows) break outer;
        /* find next word containing L; 50% rule: no intervening word
         * may contain L. If the scan wraps twice, relax the rule. */
        let chosen = -1;
        let scan = p;
        let violated = false;
        while (scan - p < wing.length * 2) {
          const w = at(scan).toLowerCase();
          if (w.includes(L)) { chosen = scan; break; }
          scan++;
        }
        if (chosen === -1) { chosen = p; violated = true; wraps++; }
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
          violated,
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
```

- [ ] **Step 2: Register** — `import mesostic from './mesostic.js';`, append after `intextus`.

- [ ] **Step 3: Captions**

```js
  mesostic: [
    'after John Cage, 62 Mesostics re Merce Cunningham (1971)',
    'after Cage’s writings through Finnegans Wake (1977–)',
    'after the 50% mesostic rule, via Cage',
    'after Jackson Mac Low’s diastics (1963–)',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  mesostic (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Visual check** — 3 seeds. The spine must read vertically at
a glance; every spine capital must actually appear in its row's word (spot-
check two rows against the wing text); wings must not collide with the
sheet edge (if they do, clamp `leftRun` x to `box.x` by trimming words).

- [ ] **Step 6: Commit**

```bash
git add src/engines/mesostic.js src/engines/index.js src/colophon.js
git commit -m "mesostic: the name stands in the text like a spine, after Cage (1971)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: `index` — the back matter of a book that does not exist

**Files:**
- Create: `src/engines/bookIndex.js` (id `'index'` — avoids a second `index.js` in the directory)
- Modify: `src/engines/index.js` (import + `ENGINES`, after `mesostic`)
- Modify: `src/colophon.js` (`CAPTIONS.index`)

**Interfaces:**
- Consumes: `smallCapsText`, `textEl`, `measure`, `breakLines`.
- Produces: registry entry `id: 'index'`.

- [ ] **Step 1: Write `src/engines/bookIndex.js`**

```js
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
```

- [ ] **Step 2: Register** — `import bookIndex from './bookIndex.js';`, append `bookIndex` after `mesostic`.

- [ ] **Step 3: Captions**

```js
  index: [
    'after the index to Nabokov’s Pale Fire (1962)',
    'after J. G. Ballard, “The Index” (1977)',
    'after back matter as narrative, via Nabokov & Ballard',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  index (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Verify the hidden order** — for one seed, list the entries'
page references in ascending order and check they follow the poem's word
order (stopwords excepted). Screenshot 2 seeds; entries must not overflow
their column (tune the wrap guard), the folio must clear the last line.

- [ ] **Step 6: Commit**

```bash
git add src/engines/bookIndex.js src/engines/index.js src/colophon.js
git commit -m "index: the poem filed under its own words, after Pale Fire (1962) and Ballard (1977)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: `inscription` — the garden stone

**Files:**
- Create: `src/engines/inscription.js`
- Modify: `src/engines/index.js` (import + `ENGINES`, after `bookIndex`)
- Modify: `src/colophon.js` (`CAPTIONS.inscription`)

**Interfaces:**
- Consumes: layout-array + clip idiom (Task 2's pattern) for the broken stele; `inkStroke` for grass and hedera; `measure`.
- Produces: registry entry `id: 'inscription'`.

- [ ] **Step 1: Write `src/engines/inscription.js`**

```js
/*
 * inscription — after Ian Hamilton Finlay's Little Sparta (1966–) and
 * the Roman lapidary hand (Trajan's column, 113 CE).
 *
 * One sentence carved: capitals letterspaced the Roman way, V for U,
 * I for J, interpuncts between words, the first line largest and the
 * rest diminishing down the stone. A drawn stele holds it — double
 * fine rules, a pediment when the seed grants one, grass at its foot,
 * and a hedera to close the text. The attribution is the dedication,
 * in small italics beneath. When the accent lands the letters print
 * rubricated — inscriptions were painted minium red. At mid entropy
 * one weathered word is restored beneath in epigrapher's brackets; at
 * high entropy the stele breaks, and Sappho is on a broken stone
 * again. License break: full-accent rubrication.
 */

import { el, g, textEl, path, line, polyPath, inkStroke, r2, uid } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const lapidary = (text) =>
  text.split(/\s+/).slice(0, 12).map((w) =>
    w.toUpperCase().replace(/U/g, 'V').replace(/J/g, 'I').replace(/[^A-ZÀ-Þ]/g, '')
  ).filter(Boolean);

export default {
  id: 'inscription',
  name: 'inscription',
  lineage: 'Ian Hamilton Finlay, Little Sparta (1966–); the lapidary hand',

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const letterFill = palette.accent || palette.ink;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 4, maxWords: 14 });
    const words = lapidary(frag.text);
    if (!words.length) words.push('SILENTIVM');

    /* ---- stone geometry ---- */
    const stoneW = box.w * rng.range(0.62, 0.78);
    const sx = sheet.width / 2 - stoneW / 2;
    const pediment = rng.chance(0.5);
    const groundY = box.y + box.h * 0.86;

    /* ---- carve lines: first largest, diminishing; interpuncts ---- */
    const measureW = stoneW * 0.84;
    const lines = [];
    let s = sheet.scale(2);
    let i = 0;
    while (i < words.length) {
      const track = s * 0.15;
      const row = [];
      while (i < words.length) {
        const trial = row.concat(words[i]).join(' · ');
        if (measure(trial, { size: s, family: FONTS.serif, tracking: track }) > measureW && row.length) break;
        row.push(words[i]); i++;
      }
      lines.push({ str: row.join(' · '), size: s, track });
      s = Math.max(sheet.scale(2) * 0.55, s * 0.86);
    }
    const lineLead = (sz) => sz * 1.55;
    const textH = lines.reduce((h, ln) => h + lineLead(ln.size), 0);
    const stoneH = textH + 90;
    const sy = groundY - stoneH;
    const cx = sheet.width / 2;

    /* layout array so the broken stele can rebuild per clip half */
    const layout = [];
    let y = sy + 58;
    for (const ln of lines) {
      layout.push({ str: ln.str, x: cx, y, size: ln.size, family: FONTS.serif, anchor: 'middle', tracking: ln.track, fill: letterFill });
      y += lineLead(ln.size);
    }
    /* weathered word, restored in brackets (mid entropy) */
    let restored = null;
    if (entropy > 0.35 && entropy <= 0.66 && rng.chance(0.7) && words.length > 3) {
      const wi = rng.int(1, words.length - 1);
      restored = words[wi].toLowerCase();
      const li = layout.findIndex((t) => t.str.includes(words[wi]));
      if (li >= 0) layout[li] = { ...layout[li], opacity: 0.15 };
    }

    const stoneNodes = () => {
      const ns = [];
      /* double border, chamfered corners */
      const ch = 12;
      const ring = (inset, w) => {
        const x0 = sx + inset, y0 = sy + inset, x1 = sx + stoneW - inset, y1 = groundY - inset;
        return path(polyPath([
          [x0 + ch, y0], [x1 - ch, y0], [x1, y0 + ch], [x1, y1 - ch], [x1 - ch, y1],
          [x0 + ch, y1], [x0, y1 - ch], [x0, y0 + ch], [x0 + ch, y0],
        ]), { stroke: ink, width: w });
      };
      ns.push(ring(0, 1.1), ring(7, 0.6));
      if (pediment) {
        ns.push(path(polyPath([[sx - 8, sy], [cx, sy - stoneW * 0.16], [sx + stoneW + 8, sy]]),
          { stroke: ink, width: 1.1, linejoin: 'miter' }));
      }
      for (const t of layout) ns.push(textEl(t.str, t));
      /* hedera: a drawn ivy leaf, plotter-true */
      const hy = sy + 58 + textH - 6;
      const hs = 7;
      ns.push(path(
        `M${r2(cx)} ${r2(hy)} C${r2(cx - hs * 1.6)} ${r2(hy - hs * 1.4)} ${r2(cx - hs * 1.2)} ${r2(hy + hs * 0.8)} ${r2(cx)} ${r2(hy + hs * 0.4)} ` +
        `C${r2(cx + hs * 1.2)} ${r2(hy + hs * 0.8)} ${r2(cx + hs * 1.6)} ${r2(hy - hs * 1.4)} ${r2(cx)} ${r2(hy)} ` +
        `M${r2(cx)} ${r2(hy + hs * 0.4)} L${r2(cx)} ${r2(hy + hs * 1.3)}`,
        { fill: letterFill, stroke: letterFill, width: 0.8 }));
      return ns;
    };

    const defs = el('defs');
    const nodes = [defs];
    if (entropy > 0.66) {
      /* the broken stele: a jagged crack, halves displaced */
      const crack = [];
      let xx = cx + rng.range(-stoneW * 0.18, stoneW * 0.18);
      for (let yy = sy - stoneW * 0.2; yy <= groundY + 10; yy += 24) {
        crack.push([xx, yy]);
        xx += rng.gauss(0, 14);
      }
      const far = sheet.width + 50;
      const mkClip = (leftSide) => {
        const id = uid('shard');
        const cp = el('clipPath', { id });
        const pts = leftSide
          ? [[-50, -50], ...crack.map((p) => [p[0], p[1]]), [-50, sheet.height + 50]]
          : [[far, -50], ...crack.map((p) => [p[0], p[1]]), [far, sheet.height + 50]];
        cp.appendChild(path(polyPath(pts) + ' Z', { fill: '#000' }));
        defs.appendChild(cp);
        return id;
      };
      const gap = 4 + entropy * 10;
      nodes.push(g({ 'clip-path': `url(#${mkClip(true)})`, transform: `translate(${r2(-gap)} 0) rotate(-0.6 ${r2(cx)} ${r2(groundY)})` }, ...stoneNodes()));
      nodes.push(g({ 'clip-path': `url(#${mkClip(false)})`, transform: `translate(${r2(gap)} ${r2(gap * 0.8)}) rotate(0.8 ${r2(cx)} ${r2(groundY)})` }, ...stoneNodes()));
    } else {
      nodes.push(g({}, ...stoneNodes()));
    }

    /* ground line and grass */
    nodes.push(line(box.x + 20, groundY, box.x + box.w - 20, groundY, { stroke: ink, width: 0.9 }));
    for (let k = 0; k < rng.int(2, 3); k++) {
      const gx = rng.range(box.x + 30, box.x + box.w - 30);
      const h = rng.range(10, 22);
      nodes.push(inkStroke(
        [[gx, groundY], [gx + rng.range(-4, 4), groundY - h * 0.6], [gx + rng.range(-8, 8), groundY - h]],
        [2.2, 1.4, 0.5], ink));
    }
    /* restoration and dedication */
    let dedY = groundY + 26;
    if (restored) {
      nodes.push(textEl(`[${restored}]`, {
        x: cx, y: dedY, size: 12, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle',
      }));
      dedY += 20;
    }
    nodes.push(textEl(frag.attribution, {
      x: cx, y: dedY, size: 11.5, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'middle', opacity: 0.85,
    }));

    return {
      nodes,
      title: words.slice(0, 2).join(' ').toLowerCase(),
      attribution: frag.attribution,
    };
  },
};
```

- [ ] **Step 2: Register** — `import inscription from './inscription.js';`, append after `bookIndex`.

- [ ] **Step 3: Captions**

```js
  inscription: [
    'after Ian Hamilton Finlay, Little Sparta (1966–)',
    'after Finlay’s garden inscriptions, via Wild Hawthorn Press (1961–)',
    'after the Roman lapidary hand (Trajan’s column, 113 CE)',
    'after THE PRESENT ORDER…, via Finlay & Saint-Just (1983)',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  inscription (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Visual check** — 3 seeds. The stone must hold all its lines
inside the border (if a long fragment overflows, the diminishing scale
floor `0.55` needs lowering); interpuncts visible; hedera reads as a leaf,
not a blot; when the render is rubricated the whole carved text is accent
while borders/grass stay ink.

- [ ] **Step 6: Commit**

```bash
git add src/engines/inscription.js src/engines/index.js src/colophon.js
git commit -m "inscription: the garden stone, after Finlay (1966–) and the lapidary hand (113 CE)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: `lineprinter` — the ancestors acknowledged

**Files:**
- Create: `src/engines/lineprinter.js`
- Modify: `src/engines/index.js` (import + `ENGINES`, after `inscription`)
- Modify: `src/colophon.js` (`CAPTIONS.lineprinter`)

**Interfaces:**
- Consumes: `monoAdvance`, `textEl` with `preserveSpace`, `el` for sprockets/bands.
- Produces: registry entry `id: 'lineprinter'`.

- [ ] **Step 1: Write `src/engines/lineprinter.js`**

```js
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
```

- [ ] **Step 2: Register** — `import lineprinter from './lineprinter.js';`, append after `inscription`.

- [ ] **Step 3: Captions**

```js
  lineprinter: [
    'after Alison Knowles & James Tenney, A House of Dust (1967)',
    'after Theo Lutz, Stochastische Texte (1959)',
    'after Nanni Balestrini, Tape Mark I (1961)',
    'after the line printer’s first poems (1959–67)',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  lineprinter (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Visual check** — 3 seeds (re-roll until all three modes have
been seen). Bands must sit behind the text and read as stationery, not
highlighting; sprocket holes clear of the text block; the dried-ribbon band
visible but legible; no line overrunning the right sprockets.

- [ ] **Step 6: Commit**

```bash
git add src/engines/lineprinter.js src/engines/index.js src/colophon.js
git commit -m "line printer: the ancestors acknowledged — Lutz (1959), Balestrini (1961), Knowles & Tenney (1967)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: `aria` — the poem scored for a voice that will never sing it

**Files:**
- Create: `src/engines/aria.js`
- Modify: `src/engines/index.js` (import + `ENGINES`, after `lineprinter`)
- Modify: `src/colophon.js` (`CAPTIONS.aria`)

**Interfaces:**
- Consumes: `fragment().mood` from Task 0; `inkStroke`, `smoothPath`, `textOnPath`; `sheet.material === 'asemic'`.
- Produces: registry entry `id: 'aria'`.

- [ ] **Step 1: Write `src/engines/aria.js`**

```js
/*
 * aria — after John Cage, Aria (1958), and Cornelius Cardew, Treatise
 * (1963–67).
 *
 * The poem scored for a voice that will never sing it. Each phrase is
 * a system: five staff lines, an invented clef (Cardew's alphabet,
 * not a counterfeit G), syllables as noteheads placed by their vowel,
 * the words beneath as hyphenated lyrics. Punctuation conducts: ff,
 * fermata, tenuto, breath. The fragment's mood chooses the tempo
 * direction. One or two wordless swells cross the systems in the
 * accent — Aria's colored voice. At high entropy Treatise wins: the
 * staves themselves bend, and the lyrics follow the curve. License
 * break: the baseline grid gives way to curved staves.
 */

import { el, g, textEl, line, path, smoothPath, textOnPath, inkStroke, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';

const TEMPI = {
  still: 'quasi niente',
  elegiac: 'lento, sotto voce',
  ecstatic: 'con fuoco',
  wry: 'secco, parlando',
  cosmic: 'immenso, senza misura',
};
const DEG = { a: 0, e: 2, i: 4, o: 5, u: 8, y: 3 };

function syllables(word) {
  const w = word.toLowerCase().replace(/[^\p{L}'’]/gu, '');
  const parts = w.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]+(?![aeiouy]))?/g);
  return parts && parts.length ? parts : [w || '·'];
}

function phrasesOf(text, want) {
  let parts = text.split(/(?<=[,;:.!?—])\s*/).filter((p) => p.trim().length > 1);
  if (parts.length < 2) {
    const words = text.split(/\s+/).filter(Boolean);
    const per = Math.max(2, Math.ceil(words.length / want));
    parts = [];
    for (let i = 0; i < words.length; i += per) parts.push(words.slice(i, i + per).join(' '));
  }
  return parts.slice(0, want).length ? parts.slice(0, want) : [text || 'aria'];
}

export default {
  id: 'aria',
  name: 'aria',
  lineage: 'John Cage, Aria (1958); Cornelius Cardew, Treatise (1963–67)',
  acceptsMaterial: ['asemic'],

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.fragment(rng, { minWords: 8, maxWords: 26 });
    const mood = frag.mood || rng.pick(Object.keys(TEMPI));
    const tempo = TEMPI[mood] || 'senza tempo';
    const phrases = phrasesOf(frag.text, rng.int(4, 6));
    const asemicLyrics = sheet.material === 'asemic';

    const gap = 7;
    const sysGap = box.h / (phrases.length + 0.6);
    const x0 = box.x + 46;
    const x1 = box.x + box.w - 10;
    const bend = entropy > 0.55 ? (entropy - 0.5) * 70 : 0;
    const defs = el('defs');
    const nodes = [];

    /* tempo direction */
    nodes.push(textEl(tempo, {
      x: box.x, y: box.y + 4, size: sheet.scale(0), family: FONTS.serif, style: 'italic', fill: ink,
    }));

    /* the invented clef: one seeded glyph, redrawn per system */
    const clefPts = [];
    for (let k = 0; k < 5; k++) clefPts.push([rng.range(-8, 8), k * gap - rng.range(0, 6)]);
    const clefWidths = clefPts.map(() => rng.range(1.2, 3.4));

    const sysTop = (i) => box.y + 40 + i * sysGap;
    const phase = rng.range(0.6, 1.8);
    const topAt = (i, x) => sysTop(i) + (bend ? Math.sin(((x - x0) / (x1 - x0)) * Math.PI * phase + i) * bend : 0);

    let totalSyl = 0;
    const parsed = phrases.map((p) => {
      const ws = p.split(/\s+/).filter(Boolean);
      const parts = ws.map((w) => ({ raw: w, syl: syllables(w) }));
      totalSyl += parts.reduce((n, w) => n + w.syl.length, 0);
      return parts;
    });

    parsed.forEach((wordsIn, i) => {
      /* staff: five lines, straight or bent */
      for (let k = 0; k < 5; k++) {
        if (!bend) {
          nodes.push(line(x0, sysTop(i) + k * gap, x1, sysTop(i) + k * gap, { stroke: ink, width: 0.7 }));
        } else {
          const pts = [];
          for (let x = x0; x <= x1; x += 40) pts.push([x, topAt(i, x) + k * gap]);
          nodes.push(path(smoothPath(pts), { stroke: ink, width: 0.7 }));
        }
      }
      /* clef */
      nodes.push(g({ transform: `translate(${r2(x0 - 26)} ${r2(topAt(i, x0))})` },
        inkStroke(clefPts, clefWidths, ink)));
      /* time signature, first system only */
      if (i === 0) {
        const nWords = frag.text.split(/\s+/).filter(Boolean).length;
        nodes.push(textEl(String(nWords), { x: x0 + 8, y: sysTop(0) + gap * 1.7, size: 15, family: FONTS.serif, weight: 'bold', fill: ink, anchor: 'middle' }));
        nodes.push(textEl(String(totalSyl), { x: x0 + 8, y: sysTop(0) + gap * 3.8, size: 15, family: FONTS.serif, weight: 'bold', fill: ink, anchor: 'middle' }));
      }
      /* noteheads and lyrics */
      const sylCount = wordsIn.reduce((n, w) => n + w.syl.length, 0) || 1;
      const step = (x1 - x0 - 40) / sylCount;
      let x = x0 + 30;
      wordsIn.forEach((w) => {
        const noteXs = [];
        w.syl.forEach((syl, si) => {
          const v = (syl.match(/[aeiouy]/) || ['e'])[0];
          const off = entropy > 0.7 && rng.chance(entropy - 0.55) ? rng.gauss(0, gap * 2.2) : 0;
          const yN = topAt(i, x) + (8 - DEG[v]) * (gap / 2) + off;
          nodes.push(el('ellipse', {
            cx: r2(x), cy: r2(yN), rx: 4.4, ry: 3.1, fill: ink,
            transform: `rotate(-14 ${r2(x)} ${r2(yN)})`,
          }));
          noteXs.push([x, yN]);
          if (asemicLyrics) {
            const sq = [];
            for (let q = 0; q < 4; q++) sq.push([x - 6 + q * 4, topAt(i, x) + gap * 6 + rng.gauss(0, 1.5)]);
            nodes.push(inkStroke(sq, [0.8, 1.6, 1.2, 0.5], ink));
          } else {
            nodes.push(textEl(syl + (si < w.syl.length - 1 ? '-' : ''), {
              x, y: topAt(i, x) + gap * 6.4, size: 10.5, family: FONTS.serif, fill: ink, anchor: 'middle',
            }));
          }
          x += step;
        });
        /* slur over polysyllables */
        if (noteXs.length >= 3) {
          const [xa, ya] = noteXs[0];
          const [xb, yb] = noteXs[noteXs.length - 1];
          nodes.push(path(`M${r2(xa)} ${r2(ya - 7)} Q${r2((xa + xb) / 2)} ${r2(Math.min(ya, yb) - gap * 2)} ${r2(xb)} ${r2(yb - 7)}`,
            { stroke: ink, width: 0.8 }));
        }
        /* dynamics from the word's trailing punctuation */
        const tail = w.raw.match(/[!?,—]$/);
        const [lx, ly] = noteXs[noteXs.length - 1];
        if (tail) {
          if (tail[0] === '!') nodes.push(textEl(rng.pick(['f', 'ff', 'sfz']), {
            x: lx, y: topAt(i, lx) + gap * 8, size: 13, family: FONTS.serif, style: 'italic', weight: 'bold', fill: ink, anchor: 'middle',
          }));
          if (tail[0] === '?') {
            nodes.push(path(`M${r2(lx - 6)} ${r2(ly - 12)} A8 8 0 0 1 ${r2(lx + 6)} ${r2(ly - 12)}`, { stroke: ink, width: 0.9 }));
            nodes.push(el('circle', { cx: r2(lx), cy: r2(ly - 13), r: 1.3, fill: ink }));
            nodes.push(line(lx + 10, topAt(i, lx) + gap * 7.6, lx + 46, topAt(i, lx) + gap * 8.2, { stroke: ink, width: 0.7 }));
            nodes.push(line(lx + 10, topAt(i, lx) + gap * 8.8, lx + 46, topAt(i, lx) + gap * 8.2, { stroke: ink, width: 0.7 }));
          }
          if (tail[0] === '—') nodes.push(line(lx - 4, ly - 8, lx + 4, ly - 8, { stroke: ink, width: 1.4 }));
          if (tail[0] === ',') nodes.push(textEl('’', {
            x: lx + step * 0.4, y: topAt(i, lx) - 4, size: 15, family: FONTS.serif, fill: ink, anchor: 'middle',
          }));
        }
      });
    });

    /* the wordless voice: swells across systems, in the accent */
    const swells = rng.int(1, 2);
    for (let s = 0; s < swells; s++) {
      const iA = rng.int(0, Math.max(0, phrases.length - 2));
      const pts = [];
      const n = 6;
      const xa = rng.range(x0, x0 + (x1 - x0) * 0.3);
      const xb = rng.range(x0 + (x1 - x0) * 0.6, x1);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        pts.push([xa + (xb - xa) * t, sysTop(iA) + t * sysGap * rng.range(0.9, 1.6) + Math.sin(t * Math.PI * 2) * 18]);
      }
      const widths = pts.map((_, k) => 0.5 + Math.sin((k / n) * Math.PI) * rng.range(3, 6));
      nodes.push(inkStroke(pts, widths, palette.accent || ink));
    }

    return {
      nodes: [defs, g({}, ...nodes)],
      title: tempo,
      attribution: frag.attribution,
    };
  },
};
```

(`defs` is present for the curved-lyric variant: if visual review of the
bent staves shows straight lyrics fighting the curve, move the lyric
`textEl`s onto `textOnPath` along the staff's own path — the import and
`defs` are already wired. Only do this if the default looks wrong.)

- [ ] **Step 2: Register** — `import aria from './aria.js';`, append after `lineprinter`.

- [ ] **Step 3: Captions**

```js
  aria: [
    'after John Cage, Aria (1958)',
    'after Cornelius Cardew, Treatise (1963–67)',
    'after the graphic score, via Cage & Cardew',
    'after Cage’s Song Books (1970)',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  aria (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Visual check** — 3 seeds. Noteheads must sit on plausible
staff positions; lyrics aligned under their notes; dynamics sparse (most
corpus fragments have little punctuation — that is correct, not a bug);
swells must read as gesture, not smudge. Check one Dickinson fragment
(em-dashes) for tenuto marks.

- [ ] **Step 6: Commit**

```bash
git add src/engines/aria.js src/engines/index.js src/colophon.js
git commit -m "aria: the poem scored for a voice that will never sing it, after Cage (1958) and Cardew (1963–67)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: `tendre` — the poem as a country

**Files:**
- Create: `src/engines/tendre.js`
- Modify: `src/engines/index.js` (import + `ENGINES`, after `aria`)
- Modify: `src/colophon.js` (`CAPTIONS.tendre`)

**Interfaces:**
- Consumes: `textOnPath` (river/sea labels), `smallCapsText` (settlements, cartouche), `arrowHead`, `smoothPath`.
- Produces: registry entry `id: 'tendre'`; the second `sheetSize` override in the codebase.

- [ ] **Step 1: Write `src/engines/tendre.js`**

```js
/*
 * tendre — after Madeleine de Scudéry's Carte de Tendre (Clélie,
 * 1654), engraved by François Chauveau, and Guy Debord & Asger Jorn,
 * The Naked City (1957).
 *
 * The poem as a country. Its phrases become toponyms: settlements
 * with circle-and-dot symbols, a river carrying its name along its
 * own curve, the longest phrase spread across the sea, the last
 * trailing into terres inconnues. A dotted route walks the
 * settlements in the poem's phrase order — the poem is the journey.
 * Engraver's apparatus: neatline, cartouche, compass rose, a scale
 * bar in leagues, hachured hills, stippled shores. At high entropy
 * Debord takes the map apart: fracture bands break the country into
 * drifting plates and accent arrows leap the gaps. License breaks:
 * landscape sheet; linework denser than the baseline grid ever
 * intended.
 */

import { el, g, textEl, smallCapsText, path, line, smoothPath, polyPath, arrowHead, textOnPath, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';

function phrasesOf(text, max) {
  let parts = text.split(/(?<=[,;:.!?—])\s*/).map((p) => p.replace(/[.,;:!?—]+$/, '').trim()).filter((p) => p.length > 2);
  if (parts.length < 3) {
    const words = text.split(/\s+/).filter(Boolean);
    const per = Math.max(2, Math.ceil(words.length / 4));
    parts = [];
    for (let i = 0; i < words.length; i += per) parts.push(words.slice(i, i + per).join(' '));
  }
  return parts.slice(0, max).length ? parts.slice(0, max) : [text || 'tendre'];
}

export default {
  id: 'tendre',
  name: 'tendre',
  lineage: 'Scudéry’s Carte de Tendre (1654); Debord & Jorn (1957)',
  sheetSize: { width: 1400, height: 1000 },

  generate(rng, source, sheet) {
    const { box, entropy, palette } = sheet;
    const ink = palette.ink;
    const frag = source.sentence(rng, 10);
    const phrases = phrasesOf(frag.text, 9);
    const debord = entropy > 0.55;

    const defs = el('defs');
    const nodes = [];

    /* ---- the coast: land above, sea below ---- */
    const coastPts = [];
    let cy = box.y + box.h * rng.range(0.56, 0.68);
    for (let x = box.x - 10; x <= box.x + box.w + 10; x += 64) {
      cy += rng.gauss(0, 26);
      cy = Math.max(box.y + box.h * 0.42, Math.min(box.y + box.h * 0.8, cy));
      coastPts.push([x, cy]);
    }
    const coastY = (x) => {
      const i = Math.max(1, Math.min(coastPts.length - 1, Math.ceil((x - coastPts[0][0]) / 64)));
      const [xa, ya] = coastPts[i - 1];
      const [xb, yb] = coastPts[i];
      return ya + ((x - xa) / (xb - xa || 1)) * (yb - ya);
    };
    nodes.push(path(smoothPath(coastPts), { stroke: ink, width: 1.1 }));
    for (let k = 1; k <= 4; k++) {
      nodes.push(path(smoothPath(coastPts.map(([x, y]) => [x, y + k * 15 + rng.gauss(0, 2)])),
        { stroke: ink, width: 0.55, opacity: r2(0.55 - k * 0.11) }));
    }
    for (const [x, y] of coastPts) {
      for (let d = 0; d < 3; d++) {
        nodes.push(el('circle', {
          cx: r2(x + rng.gauss(0, 20)), cy: r2(y - rng.range(4, 16)), r: 0.9, fill: ink, opacity: 0.55,
        }));
      }
    }

    /* ---- hills with hachures ---- */
    const hills = [];
    for (let h = 0; h < rng.int(2, 3); h++) {
      const hx = box.x + box.w * rng.range(0.12, 0.88);
      const hy = box.y + 60 + (coastY(hx) - box.y - 130) * rng.range(0.1, 0.8);
      hills.push([hx, hy]);
      for (let row = 0; row < 3; row++) {
        const n = 7 - row * 2;
        for (let s2 = 0; s2 < n; s2++) {
          const a = Math.PI * (0.15 + 0.7 * (s2 / (n - 1 || 1)));
          const len = 16 - row * 3.5;
          const bx = hx + Math.cos(a) * (10 + row * 9) * 1.6;
          const by = hy + row * 7;
          nodes.push(line(bx, by, bx + Math.cos(a + Math.PI / 2) * 3, by + len * 0.55, { stroke: ink, width: 0.6, opacity: 0.8 }));
        }
      }
    }

    /* ---- toponyms ---- */
    const longest = phrases.reduce((a, b) => (b.length > a.length ? b : a), phrases[0]);
    const seaPhrase = longest;
    const lastPhrase = phrases[phrases.length - 1];
    const settlements = phrases.filter((p) => p !== seaPhrase && p !== lastPhrase).slice(0, 6);
    if (!settlements.length) settlements.push(phrases[0]);
    const spts = settlements.map((p, i) => {
      const x = box.x + box.w * ((i + 0.7) / (settlements.length + 0.6)) + rng.gauss(0, 24);
      const y = box.y + 70 + (coastY(x) - box.y - 120) * rng.range(0.15, 0.95);
      return { p, x, y };
    });
    for (const s2 of spts) {
      nodes.push(el('circle', { cx: r2(s2.x), cy: r2(s2.y), r: 3.2, fill: 'none', stroke: ink, 'stroke-width': 0.9 }));
      nodes.push(el('circle', { cx: r2(s2.x), cy: r2(s2.y), r: 1.1, fill: ink }));
      const label = smallCapsText(s2.p, { x: s2.x + 7, y: s2.y + 3.5, size: 10.5, family: FONTS.serif, fill: ink, trackingEm: 0.08 });
      if (s2.x + 7 + label._width > box.x + box.w) label.setAttribute('transform', `translate(${r2(-(label._width + 16))} 0)`);
      nodes.push(label);
    }

    /* ---- the river, named along its curve ---- */
    const [hx, hy] = hills[0];
    const mouthX = box.x + box.w * rng.range(0.25, 0.75);
    const riverPts = [[hx, hy + 14], [(hx + mouthX) / 2 + rng.gauss(0, 60), (hy + coastY(mouthX)) / 2], [mouthX, coastY(mouthX)]];
    const riverD = smoothPath(riverPts);
    nodes.push(path(riverD, { stroke: ink, width: 1 }));
    const verbish = frag.text.split(/\s+/).find((w) => /ing$/.test(w)) || settlements[0].split(' ')[0] || 'longing';
    nodes.push(textOnPath(`the river of ${verbish.toLowerCase().replace(/[^\p{L}]/gu, '')}`, riverD, defs, {
      size: 10.5, family: FONTS.serif, style: 'italic', fill: ink, startOffset: '12%',
    }));

    /* ---- the sea, named at size; terres inconnues ---- */
    const seaMidY = (coastY(box.x + box.w * 0.3) + box.y + box.h) / 2 + 30;
    const seaD = `M${r2(box.x + 40)} ${r2(seaMidY)} Q${r2(box.x + box.w / 2)} ${r2(seaMidY + 34)} ${r2(box.x + box.w - 40)} ${r2(seaMidY)}`;
    nodes.push(textOnPath(`the sea of ${seaPhrase.toLowerCase()}`, seaD, defs, {
      size: sheet.scale(1.5), family: FONTS.serif, style: 'italic', fill: ink, tracking: 3, opacity: 0.9,
    }));
    const tiX = box.x + box.w - 20;
    nodes.push(smallCapsText('terres inconnues', {
      x: tiX, y: box.y + 30, size: 11, family: FONTS.serif, fill: ink, anchor: 'end', trackingEm: 0.16, opacity: 0.7,
    }));
    nodes.push(textEl(lastPhrase.toLowerCase(), {
      x: tiX, y: box.y + 48, size: 11, family: FONTS.serif, style: 'italic', fill: ink, anchor: 'end', opacity: 0.4,
    }));

    /* ---- the route: the poem walked in order ---- */
    if (spts.length > 1) {
      const routeD = smoothPath(spts.map((s2) => [s2.x, s2.y]));
      nodes.push(path(routeD, { stroke: ink, width: 1, dash: '1.5 6', linecap: 'round' }));
      const [xa, ya] = [spts[spts.length - 2].x, spts[spts.length - 2].y];
      const [xb, yb] = [spts[spts.length - 1].x, spts[spts.length - 1].y];
      nodes.push(arrowHead(xb, yb, Math.atan2(yb - ya, xb - xa), 7, ink));
    }

    /* ---- Debord: fracture bands and leaping arrows ---- */
    if (debord) {
      for (let b = 0; b < rng.int(2, 3); b++) {
        const bx = box.x + box.w * rng.range(0.2, 0.8);
        const wB = rng.range(18, 44);
        const ptsL = [];
        const ptsR = [];
        for (let y = box.y - 10; y <= box.y + box.h + 10; y += 60) {
          const wob = rng.gauss(0, 24);
          ptsL.push([bx + wob, y]);
          ptsR.push([bx + wob + wB, y]);
        }
        nodes.push(path(polyPath(ptsL.concat(ptsR.reverse())) + ' Z', { fill: palette.paper }));
        const ay = box.y + box.h * rng.range(0.2, 0.75);
        const a0x = bx - rng.range(40, 90);
        const a1x = bx + wB + rng.range(40, 90);
        nodes.push(path(`M${r2(a0x)} ${r2(ay)} Q${r2(bx + wB / 2)} ${r2(ay - 46)} ${r2(a1x)} ${r2(ay)}`,
          { stroke: palette.accent || ink, width: 2.2 }));
        nodes.push(arrowHead(a1x, ay, Math.PI * 0.32, 8, palette.accent || ink));
      }
    }

    /* ---- apparatus: neatline, cartouche, compass, scale bar ---- */
    const nl = 16;
    nodes.push(el('rect', { x: r2(box.x - nl), y: r2(box.y - nl), width: r2(box.w + nl * 2), height: r2(box.h + nl * 2), fill: 'none', stroke: ink, 'stroke-width': 1.2 }));
    nodes.push(el('rect', { x: r2(box.x - nl + 6), y: r2(box.y - nl + 6), width: r2(box.w + nl * 2 - 12), height: r2(box.h + nl * 2 - 12), fill: 'none', stroke: ink, 'stroke-width': 0.6 }));
    const short = phrases[0].split(/\s+/).slice(0, 4).join(' ').toLowerCase();
    const title = `a map of ${short}`;
    const cw = Math.max(200, measure(title.toUpperCase(), { size: 14, family: FONTS.serif }) * 0.9 + 60);
    nodes.push(el('rect', { x: r2(box.x + 14), y: r2(box.y + 14), width: r2(cw), height: 64, fill: palette.paper, stroke: ink, 'stroke-width': 0.9 }));
    nodes.push(smallCapsText(title, { x: box.x + 14 + cw / 2, y: box.y + 44, size: 14, family: FONTS.serif, fill: ink, anchor: 'middle', trackingEm: 0.12 }));
    nodes.push(line(box.x + 34, box.y + 58, box.x + 14 + cw - 20, box.y + 58, { stroke: ink, width: 0.6 }));
    /* compass, in the sea */
    const cpx = box.x + box.w * 0.9;
    const cpy = box.y + box.h * 0.88;
    const cRot = rng.range(-20, 20);
    const compass = [];
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      const len = a % 2 === 0 ? 26 : 14;
      compass.push(line(cpx, cpy, cpx + Math.cos(ang) * len, cpy + Math.sin(ang) * len, { stroke: ink, width: a % 2 === 0 ? 0.9 : 0.5 }));
    }
    compass.push(textEl('N', { x: cpx, y: cpy - 32, size: 11, family: FONTS.serif, fill: ink, anchor: 'middle' }));
    nodes.push(g({ transform: `rotate(${r2(cRot)} ${r2(cpx)} ${r2(cpy)})` }, ...compass));
    /* scale bar */
    const sbx = box.x + 20;
    const sby = box.y + box.h - 24;
    for (let s3 = 0; s3 < 5; s3++) {
      nodes.push(el('rect', {
        x: r2(sbx + s3 * 26), y: r2(sby), width: 26, height: 5,
        fill: s3 % 2 === 0 ? ink : 'none', stroke: ink, 'stroke-width': 0.6,
      }));
    }
    nodes.push(textEl('leagues', { x: sbx + 140, y: sby + 6, size: 10, family: FONTS.serif, style: 'italic', fill: ink }));

    return {
      nodes: [defs, g({}, ...nodes)],
      title,
      attribution: frag.attribution,
      caption: debord ? 'after Debord & Jorn, The Naked City (1957)' : 'after Madeleine de Scudéry’s Carte de Tendre (1654)',
    };
  },
};
```

(Divergence from spec, on purpose: Debord mode uses paper-fill fracture
bands rather than clip-and-translate plates — same reading, far less
machinery. The spec's "drifting plates" survive as the bands + arrows.)

- [ ] **Step 2: Register** — `import tendre from './tendre.js';`, append after `aria`.

- [ ] **Step 3: Captions**

```js
  tendre: [
    'after Madeleine de Scudéry’s Carte de Tendre (1654)',
    'after the Carte de Tendre, engraved by Chauveau (1654)',
    'after Debord & Jorn, The Naked City (1957)',
    'after the dérive, via Debord (1956)',
  ],
```

- [ ] **Step 4: Run smoke** — expect `ok  tendre (6 seeds × 3 modes)`, `All checks passed.`

- [ ] **Step 5: Visual check** — 3 seeds at window-size 1500×1200. Labels
must not collide with hachures or each other (nudge seeded y-ranges if two
settlements stack); the sea name must sit in water; the route must touch
every settlement; cartouche opaque over the linework (it has a paper fill).

- [ ] **Step 6: Commit**

```bash
git add src/engines/tendre.js src/engines/index.js src/colophon.js
git commit -m "tendre: the poem as a country, after Scudéry (1654) and Debord (1957)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: The manual grows a second wing (registry order + README + sweep)

**Files:**
- Modify: `src/engines/index.js` (reorder to spec order)
- Modify: `README.md` (bibliography, table, counts, amendment note)
- Check: `index.html` (grep only; edit only if "sixteen" appears)

**Interfaces:**
- Consumes: all nine registered engines.
- Produces: the shipped documentation; the final registry order `constellation … transmission, intextus, tendre, aria, lineprinter, mesostic, bookIndex, rollage, inscription, calligramme`.

- [ ] **Step 1: Reorder the registry**

In `src/engines/index.js`, arrange the nine new entries at the end of
`ENGINES` in spec order — after `transmission`:
`intextus, tendre, aria, lineprinter, mesostic, bookIndex, rollage, inscription, calligramme`
(and group the import block the same way). Run `node tools/smoke.mjs` —
order changes nothing; expect `All checks passed.`

- [ ] **Step 2: Sweep the count**

```bash
grep -rn "ixteen" README.md index.html src/
```

Update every hit: "Sixteen style engines" → "Twenty-five style engines";
"## The sixteen engines" → "## The twenty-five engines"; the repository-map
line `src/engines/   the sixteen engines + registry` → `…the twenty-five
engines + registry`; any others by sense. Expected after: `grep -rn
"ixteen" README.md index.html src/` returns nothing (or only lineage prose
that genuinely means sixteen — there is none today).

- [ ] **Step 3: Add the bibliography entries**

In `README.md`, insert these paragraphs into "The lineage" in historical
sequence (anchors given per paragraph); adjust neighboring transitions only
if a sentence demands it. **Insert after the "Technopaegnia" paragraph:**

> **The woven grid.** Late antiquity already had a second way to shape a
> poem: Optatian Porfyry's carmina cancellata (4th c. CE) marshalled
> letters into a strict grid and threaded a second text — the *versus
> intextus* — through them along a figure, picked out in color; Hrabanus
> Maurus perfected the form in *De laudibus sanctae crucis* (c. 810),
> where the highlighted cells draw crosses and the highlighted letters
> read as their own verse. The `intextus` engine sets the poem as a letter
> grid, plants a phrase of it along a cross, saltire, lozenge, or ring in
> the accent color — the tinted letters, read in figure order, really do
> spell the phrase the foot of the sheet quotes — and at high entropy
> reverses the field, Hrabanus's way, ink cells carrying paper letters.

**Insert after the woven-grid paragraph (new paragraph):**

> **The allegorical map.** Madeleine de Scudéry's Carte de Tendre
> (*Clélie*, 1654), engraved by François Chauveau, drew a country whose
> geography is a sentiment — villages named Billet Doux, a Dangerous Sea,
> terres inconnues past the edge; three centuries on, Guy Debord and
> Asger Jorn cut Paris apart and let arrows leap the gaps in *The Naked
> City* (1957). The `tendre` engine maps the poem: its phrases become
> settlements, a river carrying its name along its own curve, the longest
> phrase spread across the sea, and a dotted route that walks the
> settlements in the poem's phrase order — the poem as journey — with
> engraver's apparatus (neatline, cartouche, compass rose, hachures,
> leagues) done in fine rules. Push the entropy up and Debord takes the
> country apart.

**Insert after "The modernist page" paragraph** (it already name-checks
Apollinaire; extend the story):

> The calligramme proper gets its own engine: `calligramme` draws with
> the line of text itself on real curved paths — the slanting rain of
> "Il Pleut" (1916), the rising and breaking jet d'eau of "La colombe
> poignardée et le jet d'eau" (1918), and the radial wireless of
> "Lettre-Océan" (1914), a hub word with text spokes and concentric
> rings. Where `technopaegnia` fills shapes with measured text, this is
> the other hand: the poem as pen stroke.

**Insert after "The mimeo and typewriter avant-garde" paragraph:**

> **The graphic score.** John Cage's *Aria* (1958) scored a voice in
> colored gesture and scattered words; Cornelius Cardew's *Treatise*
> (1963–67) spent 193 pages proving notation could be drawing. The `aria`
> engine scores the poem for a voice that will never sing it: five-line
> staves in fine rules, syllables as noteheads placed by their vowel,
> hyphenated lyrics beneath, punctuation conducting (*ff*, fermata,
> tenuto, breath), the fragment's mood choosing the tempo direction, an
> invented ink-stroke clef, and one or two wordless swells crossing the
> systems in the accent. At high entropy the staves themselves bend.
>
> **The first computer poems.** Theo Lutz fed the vocabulary of Kafka's
> *The Castle* to a Zuse Z22 and printed *Stochastische Texte* (1959);
> Nanni Balestrini recombined three texts by IBM 7070 for *Tape Mark I*
> (1961); Alison Knowles and James Tenney's Fortran quatrains, *A House
> of Dust* (1967), came off the line printer onto continuous stationery.
> These are this site's direct ancestors, and the `lineprinter` engine
> says so: sprocket holes, form perforations, greenbar bands, a job
> header, and the poem's own words run through the ancestors' procedures
> — the house frame, Lutz's logical propositions, Balestrini's tape
> passes — with the chain printer's wobble, double strikes, and dried
> ribbon. The colophon names whichever ancestor the render followed.
>
> **The mesostic.** John Cage read through texts along a spine — *62
> Mesostics re Merce Cunningham* (1971), the writings through *Finnegans
> Wake* (1977–) — under rules he kept "as strictly as possible"; Jackson
> Mac Low's diastics (1963–) did kindred reading-through. The `mesostic`
> engine stands a spine word in capitals down the center axis and reads
> the fragment through it under the 50% rule, each spine letter measured
> into exact alignment; at high entropy the wings drift and ghost —
> writing through the writing.

**Insert after the "Décollage" paragraph:**

> **Rollage.** Jiří Kolář sliced reproductions into strips and re-wove
> them (rollage, 1962–), one image waving through another. The `rollage`
> engine sets the same fragment twice — monumental display capitals and a
> dense small-text block — cuts both into vertical strips, interleaves
> them with a progressive shear, and at high entropy shuffles and flips
> strips outright; when the accent lands, the small layer prints entirely
> in it, a two-color separation.

**Insert after the "Grammar as drawing" paragraph:**

> **The inscription.** Ian Hamilton Finlay planted poems in stone at
> Little Sparta (1966–), the Roman lapidary hand doing the carrying —
> Trajan's column (113 CE) as type specimen. The `inscription` engine
> draws the stele in fine double rules, carves one lapidary sentence — V
> for U, interpuncts, letterspaced capitals diminishing down the stone —
> closes it with a drawn hedera, and sets the attribution beneath as the
> dedication. When the accent lands the letters print rubricated, as the
> Romans painted theirs; at high entropy the stone breaks, and the poem
> is a fragment again.
>
> **The index.** Nabokov's *Pale Fire* (1962) hid half its novel in the
> index; J. G. Ballard's "The Index" (1977) told a whole life as one. The
> `index` engine files the poem as the back matter of a book that does
> not exist — alphabetized entries, subentries from each word's own
> surroundings, one *passim*, one *see also*, one entry with no page —
> and page numbers assigned so that reading every reference in ascending
> order re-derives the poem. At high entropy the index misremembers
> another book.

- [ ] **Step 4: Extend the engine table**

Rename the heading to `## The twenty-five engines` (done in Step 2) and
append to the table:

```markdown
| `intextus` | Optatian's carmina cancellata (4th c.); Hrabanus Maurus (c. 810) |
| `tendre` | Scudéry's Carte de Tendre (1654); Debord & Jorn, *The Naked City* (1957) |
| `aria` | Cage, *Aria* (1958); Cardew, *Treatise* (1963–67) |
| `lineprinter` | Lutz (1959); Balestrini (1961); Knowles & Tenney, *A House of Dust* (1967) |
| `mesostic` | Cage, *62 Mesostics re Merce Cunningham* (1971); Mac Low's diastics |
| `index` | Nabokov's *Pale Fire* index (1962); Ballard, "The Index" (1977) |
| `rollage` | Jiří Kolář, rollage (1962–) |
| `inscription` | Finlay, Little Sparta (1966–); the Roman lapidary hand (113 CE) |
| `calligramme` | Apollinaire, "Lettre-Océan" (1914); "Il Pleut" (1916) |
```

- [ ] **Step 5: The AI-amendment note**

In the README's "The amendment: optional AI oracles" section, append to
the closing paragraph ("In every case the render never waits on the
network…") one sentence:

> The nine engines added in July 2026 — `intextus` through `calligramme`
> — never consult the oracles at all: their poems are composed entirely
> offline, whatever provider is set.

- [ ] **Step 6: Full verification**

```bash
node tools/smoke.mjs
```

Expected: 25 `ok` engine lines, `ok  hybrid pass`, `ok  type pairings (6)`,
`All checks passed.` Then screenshot each of the nine engines once (any
seed) as a last look, and `grep -c "^| \`" README.md` → 25 table rows.

- [ ] **Step 7: Commit**

```bash
git add src/engines/index.js README.md index.html
git commit -m "the manual grows a second wing: sixteen becomes twenty-five

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(Drop `index.html` from the `git add` if Step 2 found nothing to change there.)

---

## Execution notes

- Tasks 1–9 each leave the suite green; the plan can pause between any two
  tasks with a working site.
- If a screenshot reveals a composition failure the constants can't fix,
  adjust the algorithm but keep the engine's spec contract: its lineage,
  its declared license breaks, its title/caption rules, and determinism.
- The paste-drawer text used by smoke ("The photocopier hums…") is the
  degenerate-input canary; a single pasted word is worth one manual check
  on `mesostic`, `index`, and `tendre` before Task 10.

