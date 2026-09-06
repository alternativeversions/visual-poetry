# Weak Engines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish calligramme's fountain and ocean, make technopaegnia pour one voice, and recompose typestract as figures on white.

**Architecture:** Three engine files and the text source change; no new modules. calligramme gets a `fitToPath` helper local to the file. `procedures.js` gains `mood`/`lang` filters on `source.fragment`. typestract gains a `FIGURES` table and a mask-driven `rowText`, keeping the old full-bleed path as the Chopin sheet. Smoke gains a coverage check.

**Tech Stack:** Vanilla ES modules, SVG, `measure()`, `node tools/smoke.mjs`, headless Chrome for proofs.

**Spec:** `docs/superpowers/specs/2026-09-06-weak-engines-design.md`

## Global Constraints

- Engines draw only from their `rng`; same inputs ⇒ byte-identical SVG.
- Text is measured with `measure()` at its set size/tracking, never counted.
- Smoke green after every task; one commit per task, prose-style messages ending `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Proofing: `python3 -u -m http.server 8765 &` and a `shot engine seed e` shell function around headless Chrome (`--headless=new --disable-gpu --virtual-time-budget=8000 --window-size=1500,1100 --screenshot=… "http://localhost:8765/#seed=$2&engine=$1&e=$3"`).

---

### Task 1: calligramme — fountain and ocean fill their paths

**Files:** Modify `src/engines/calligramme.js` (fountain block ~L118–160, ocean block ~L162–212; `measure` already imported).

**Interfaces:** Produces two file-local helpers:
- `polyLen(pts)` → number: sum of segment lengths × 1.05.
- `fitToPath(rng, source, pool, seed, lengthPx, opts, want = 0.9)` → `{ text, pool }`: appends phrases from `pool` (refilling from `source.fragment(rng, {minWords: 8, maxWords: 24})`, at most 40 appends, recording new attributions in a file-local `atts` array) until `measure(text, opts) ≥ lengthPx · want`.

- [ ] **Step 1:** Add the helpers above `export default`; `atts` is created in `generate` and passed in, or closed over via a small factory — keep it simple: `generate` declares `const atts = [frag.attribution]` and `fitToPath` takes `atts` as a parameter.
- [ ] **Step 2 (fountain):** replace the per-jet `startOffset` scatter with `fitToPath` to `polyLen(pts)` at `{ size, family: FONTS.serif, style: 'italic', tracking: size * 0.08 }`, `startOffset: '0%'`. The pool line: `fitToPath` to the quadratic's length (chord + 8/3·s²/chord, s = 30) at `{ size: 13, family: FONTS.serif, tracking: 1.2 }`, `startOffset: '0%'`.
- [ ] **Step 3 (ocean):** spokes: `fitToPath` to `(rMax − r0) · 0.92` at `{ size, family: FONTS.serif, tracking: 0.6 }`, starting the pool for each spoke as the cycled word slice it uses today (so spokes still begin at different words). Rings: `fitToPath` to `2π·r·sweep · 0.95`, `startOffset: '0%'`.
- [ ] **Step 4:** attribution: `[...new Set(atts)].slice(0, 2).join(' · ')`.
- [ ] **Step 5:** smoke green; proofs: fountain at `deadbeef`, `8f3a21c9`; ocean at `cafe1234`, `1234abcd`; e=0.5 and 0.9. Commit — "calligramme: the fountain and the ocean fill their paths".

---

### Task 2: the text source learns mood and language

**Files:** Modify `src/text/procedures.js` (`source.fragment`, ~L124–147).

**Interfaces:** `source.fragment(r, { minWords, maxWords, mood, lang })`; fallback: filtered pool < 4 → drop `lang`; still < 4 → drop `mood`. User mode ignores both.

- [ ] **Step 1:** in `source.fragment`, after `const pool = byLength(...)...`:
```js
    let pool = byLength(minWords, maxWords).filter((f) => f.kind !== 'word');
    const narrow = (p, m, l) => p.filter((f) => (!m || f.mood === m) && (!l || f.lang === l));
    if (mood || lang) {
      let p = narrow(pool, mood, lang);
      if (p.length < 4) p = narrow(pool, mood, null);
      if (p.length < 4) p = pool;
      pool = p;
    }
```
  (`pool` becomes `let`; the rest of the function is unchanged, including procedural ops.)
- [ ] **Step 2:** smoke green (no engine passes filters yet, so output is byte-identical — confirm by rendering two engines before/after and diffing). Commit — "the text source can be asked for one mood, one language".

---

### Task 3: technopaegnia — one voice

**Files:** Modify `src/engines/technopaegnia.js` (`gatherWords`, ~L68–90).

- [ ] **Step 1:** `gatherWords(rng, source, budgetPx, size, { avoidMood = null, oneVoice = false } = {})`. When `oneVoice`: after the first fragment record `mood`, `lang`; every later pull passes `{ mood, lang }`; keep `const seen = new Set()` of texts; re-pull up to three times if `seen.has(frag.text)`, then accept. The main call passes `{ oneVoice: true }`; the contrary call keeps `{ avoidMood: mood }`.
- [ ] **Step 2:** README technopaegnia paragraph: add "The shape is poured in one voice: the first fragment sets the mood and the language, and every fragment after it agrees, none repeated."
- [ ] **Step 3:** smoke green; proofs at `8f3a21c9`, `deadbeef`, e=0.2 and 0.9. Commit — "technopaegnia: one voice poured into one shape".

---

### Task 4: typestract — figures on white

**Files:** Modify `src/engines/typestract.js` (whole `generate`), `tools/smoke.mjs` (coverage check), `README.md` (typestract paragraph).

**Interfaces (file-local):**
- `const FIGURES = { lozenge, column, annulus, band, bar }` — each `(rng) => ({ kind, mask(u, v) → boolean, box: {u0,u1,v0,v1} })`, with centers drawn in `[0.2,0.8]×[0.15,0.85]` and extents in `[0.18,0.55]` of the shorter side, clamped three cells inside.
- `makeFigure(rng, kind, ramp, entropy)` → `{ kind, mask, box, field, gamma, ribbon: 'black'|'red', glyphs: [...], overstrikes: boolean }`; `glyphs` are the poem's letters at the light/mid/dark thirds of the ramp (two glyphs when the poem has fewer than three distinct letters).
- `separate(figures)` — no draws; pushes centers apart until bounding boxes overlap ≤ 25 % of the smaller.
- `cellOf(figures, u, v)` → `{ ch, red, strike }` or blank: the last figure whose mask contains `(u, v)` wins; `val = pow(field(u,v), gamma)`; `ch = ['', ...glyphs][floor(val · (glyphs.length + 1))]`; `strike = overstrikes && val > 0.96`.

- [ ] **Step 1:** implement the helpers above `export default`.
- [ ] **Step 2:** in `generate`: draw `count` by entropy (1 / 2 / `rng.int(2,3)`), then `chopin = entropy >= 0.85 && rng.chance((entropy - 0.85) / 0.15 * 0.8)`. If `chopin`, run the existing code path unchanged (move it into `chopinSheet(rng, sheet, frag, ramp)` and return). Otherwise build figures: kinds `rng.pick` without repetition, at most one `ribbon: 'red'` (`rng.chance(0.3)` on each until one is red), `overstrikes` per figure with `rng.chance(0.15 + entropy * 0.5)` and at most one below 0.7; `separate(figures)`.
- [ ] **Step 3:** `rowText(row, y, xOffset, pass)` iterates cells with `cellOf`, building `black`, `redS`, `over` strings as today; for `pass === 'rotated'` apply `Math.pow(val, 2.6)` inside `cellOf` via a `sparse` flag.
- [ ] **Step 4:** platen slip unchanged; rotated pass only if `entropy > 0.7 && rng.chance((entropy - 0.7) * 1.5)`, rendered through the figures.
- [ ] **Step 5:** title `${figures.map((f) => f.kind).join(' + ')}: ${first three words}`.
- [ ] **Step 6 (smoke):** after the entropy checks:
```js
// typestract at low entropy is figures on white: 3–30 % of the grid struck
{
  const engine = ENGINES.find((x) => x.id === 'typestract');
  for (const seed of seeds) {
    const xml = render(seed, engine, 'corpus', '', false, null, 0.2).xml;
    const texts = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((m) => m[1]);
    const struck = texts.reduce((n, t) => n + t.replace(/\s/g, '').length, 0);
    const cells = texts.reduce((n, t) => n + t.length, 0) || 1;
    const ratio = struck / cells;
    if (ratio < 0.03 || ratio > 0.30) { console.error(`FAIL typestract coverage ${ratio.toFixed(2)}: ${seed}`); failures++; }
  }
  console.log('ok  typestract coverage (figures on white)');
}
```
  Note: rows are emitted only when they contain a strike, and blank leading cells are spaces inside the row string, so `cells` undercounts fully blank rows; the ratio is therefore an upper bound on true coverage and the check is conservative in the right direction. If it proves too tight, compute `cells = cols · rows` from the engine's grid by exposing them in `result.caption`-free metadata — prefer the simple version first.
- [ ] **Step 7:** README typestract paragraph: replace "drives the poem's own letters, ordered by ink density, through field functions on a strict monospace grid — black ribbon and red — with overstrike, platen slip, and the occasional second pass rotated 90°." with "sets one to three figures — lozenge, column, annulus, wave band, diagonal bar — on a white monospace grid, each typed from two or three of the poem's letters, black ribbon and red, with platen slip; overstrike is a rare event, and only at the top of the entropy slider does the sheet fill edge to edge, Chopin-fashion."
- [ ] **Step 8:** smoke green; proofs at `8f3a21c9`, `deadbeef`, `cafe1234` at e=0.2, 0.5, 0.9, and one at 1.0 to see the Chopin sheet. Commit — "typestract: figures on white, after dsh".

---

## Self-review

- Spec §1 → Task 1; §2 → Tasks 2–3; §3 → Task 4 including the coverage check and README. Order matches the spec.
- Names used across tasks: `fitToPath`, `polyLen`, `atts` (Task 1, local); `mood`/`lang` filter keys (Task 2 → Task 3); `FIGURES`, `makeFigure`, `separate`, `cellOf`, `chopinSheet` (Task 4, local).
