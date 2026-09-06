# Section One Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the README's promises true: share links reproduce the sheet, the entropy slider moves every engine, labels do not collide, sparse engines fill the page, and a cold load has a clean console.

**Architecture:** Every change lives in an existing file. `main.js` gains three hash keys and boot-time control sync; `corpus.js` gates its probe; five engines gain geometry passes or entropy bands; `tools/smoke.mjs` gains an entropy parameter and an entropy-sensitivity check. No new modules, no build step, no dependencies.

**Tech Stack:** Vanilla ES modules, SVG DOM, the project's `rng`/`measure`/`svg.js` helpers, `node tools/smoke.mjs` as the test runner, headless Chrome for proofing.

**Spec:** `docs/superpowers/specs/2026-09-05-section-one-design.md`

## Global Constraints

- Engines draw only from their `rng`; same inputs ⇒ byte-identical SVG.
- Geometric fixes (nudges, budget scaling) make **no** `rng` draws.
- Strikes, leaders, windows are SVG primitives, never `text-decoration`.
- `node tools/smoke.mjs` is green after every task.
- One commit per task; messages in the repo's lower-case, prose style, ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Proofing command (after Task 2 the hash carries `e=`):
  `python3 -m http.server 8765 &` then
  `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --virtual-time-budget=8000 --window-size=1400,900 --screenshot=<png> "http://localhost:8765/#seed=<seed>&engine=<id>&e=<e>"`

---

### Task 1: Gate the local-corpus probe

**Files:**
- Modify: `src/text/corpus.js:283-288` (the `try { await import('./corpus.local.js') }` block)
- Modify: `src/main.js:46-53` (the `?ai=` block in `readURL`)
- Modify: `README.md:466-471`

**Interfaces:**
- Produces: nothing consumed later. Persisted flag key: `typestract-local`, value `'1'`.

- [x] **Step 1: Gate the probe**

Replace the block in `corpus.js` with:

```js
/* Merge a private, gitignored supplement if one exists. The probe runs
 * only when asked — once with ?local=1, remembered — so a cold load
 * requests nothing that is not there. */
const wantsLocal = (() => {
  try {
    if (typeof location !== 'undefined' && /[?&]local=1(&|$)/.test(location.search)) return true;
    if (typeof localStorage !== 'undefined') return localStorage.getItem('typestract-local') === '1';
  } catch { /* no location or storage */ }
  return false;
})();
if (wantsLocal) {
  try {
    const local = await import('./corpus.local.js');
    if (Array.isArray(local.CORPUS)) CORPUS.push(...local.CORPUS);
  } catch {
    /* asked for, not present; the shipped corpus stands alone */
  }
}
```

- [x] **Step 2: Persist the flag in `readURL`**

After the `?ai=` block add:

```js
  // ?local=1 | 0 — remember whether to probe for corpus.local.js
  const local = q.get('local');
  if (local === '1' || local === '0') {
    try {
      if (local === '1') localStorage.setItem('typestract-local', '1');
      else localStorage.removeItem('typestract-local');
    } catch { /* no storage */ }
  }
```

- [x] **Step 3: README**

Replace the "probes for this file on every boot … harmless and expected" sentences with: "The site probes for it only when told to: open the page once with `?local=1` and the choice is remembered in this browser (`?local=0` forgets it). With the flag off, nothing is requested and the console stays clean."

- [x] **Step 4: Verify**

`node tools/smoke.mjs` green. Headless Chrome on `http://localhost:8765/` with `--enable-logging=stderr` shows no `corpus.local.js` line; with `/?local=1` it shows the 404.

- [x] **Step 5: Commit** — "the local corpus is probed only when asked"

---

### Task 2: Share links carry entropy, paper and text

**Files:**
- Modify: `src/main.js:33-64` (`readURL`, `writeURL`), `src/main.js:426-432` (boot)
- Modify: `README.md:28-33` (Keys paragraph)

**Interfaces:**
- Produces: hash keys `e`, `paper`, `text`; constant `TEXT_CAP = 4000`.

- [x] **Step 1: `readURL`**

After `state.hybrid = …` add:

```js
  const e = parseFloat(h.get('e'));
  if (Number.isFinite(e)) state.entropy = Math.max(0, Math.min(1, e));
  const paper = h.get('paper');
  if (paper === 'warm' || paper === 'cool') state.paperMode = paper;
  const text = h.get('text');
  if (text && text.trim()) {
    state.userText = text.slice(0, TEXT_CAP);
    if (!h.get('source')) state.source = 'user'; // a link with text means text
  }
```

with `const TEXT_CAP = 4000;` above `readURL`.

- [x] **Step 2: `writeURL`**

After `if (state.hybrid) h.set('hybrid', '1');` add:

```js
  if (Math.abs(state.entropy - 0.5) > 0.004) h.set('e', state.entropy.toFixed(2));
  if (state.paperMode !== 'auto') h.set('paper', state.paperMode);
  if (state.source === 'user') {
    const t = state.userText.replace(/\s+/g, ' ').trim().slice(0, TEXT_CAP);
    if (t) h.set('text', t);
  }
```

- [x] **Step 3: Boot sync**

Replace the boot block's control sync with:

```js
readURL();
wire();
const sourceRadio = document.querySelector(`input[name="source"][value="${state.source}"]`);
if (sourceRadio) sourceRadio.checked = true;
const drawer0 = document.getElementById('user-text');
drawer0.value = state.userText;
drawer0.classList.toggle('open', state.source === 'user');
document.getElementById('entropy').value = Math.round(state.entropy * 100);
document.getElementById('entropy-val').textContent = state.entropy.toFixed(2);
document.getElementById('paper-mode').value = state.paperMode;
```

(The type select is already synced inside `wire()`; check, and leave it.)

- [x] **Step 4: README** — extend the Keys paragraph: "The hash also carries the entropy (`e`), the paper (`paper`) and, for your own words, the text itself (`text`, up to 4,000 characters), so a link reproduces the sheet exactly."

- [x] **Step 5: Verify**

Smoke green. Browser: open `#seed=8f3a21c9&engine=mesostic&e=0.9&paper=cool&text=the%20rain%20it%20raineth%20every%20day` — slider at 90 and readout 0.90, paper select "cool", drawer open with the text, radio on "your own words", colophon says "text: user text". Move the slider: hash gains a new `e`.

- [x] **Step 6: Commit** — "share links carry the whole sheet"

---

### Task 3: Smoke learns entropy

**Files:**
- Modify: `tools/smoke.mjs:73-102` (`render`), add a check block before the hybrid pass

**Interfaces:**
- Produces: `render(seed, engine, mode, userText, hybrid, pairing, entropy = 0.5)`; a constant `ENTROPY_ENGINES = ['diagram', 'revisedPhilosophy', 'gloss', 'technopaegnia']` and the check that they differ at 0 and 1. **This check fails until Tasks 8–11 land**, so it is added as a *warning* here (`console.warn('WARN entropy-insensitive: …')`) and promoted to a failure in Task 11.

- [x] **Step 1:** add `entropy = 0.5` as the last parameter of `render` and pass it to `makeSheet`.

- [x] **Step 2:** after the main loop add:

```js
// the slider must move every engine at least a little, and these four
// must not ignore it (they did, through the first edition)
const ENTROPY_ENGINES = ['diagram', 'revisedPhilosophy', 'gloss', 'technopaegnia'];
for (const engine of ENGINES) {
  for (const seed of seeds.slice(0, 3)) {
    for (const e of [0, 1]) {
      try {
        const r = render(seed, engine, 'corpus', '', false, null, e);
        if (/NaN|undefined/.test(r.xml)) { console.error(`FAIL hygiene at entropy ${e}: ${engine.id}/${seed}`); failures++; }
      } catch (err) {
        console.error(`FAIL exception at entropy ${e}: ${engine.id}/${seed}`);
        console.error('  ', err.stack.split('\n').slice(0, 4).join('\n   '));
        failures++;
      }
    }
  }
}
for (const id of ENTROPY_ENGINES) {
  const engine = ENGINES.find((x) => x.id === id);
  for (const seed of seeds.slice(0, 4)) {
    const lo = render(seed, engine, 'corpus', '', false, null, 0).xml;
    const hi = render(seed, engine, 'corpus', '', false, null, 1).xml;
    if (lo === hi) { console.warn(`WARN entropy-insensitive: ${id}/${seed}`); }
  }
}
console.log('ok  entropy ends (0 and 1) render clean');
```

- [x] **Step 3:** run; expect green with four engines' WARN lines. Commit — "smoke renders both ends of the slider"

---

### Task 4: tendre — sea name fits, labels clear

**Files:**
- Modify: `src/engines/tendre.js:150-163` (settlement labels), `:195-199` (sea)

**Interfaces:**
- Consumes: `measure`, `textOnPath`, `smallCapsText` (returns node with `_width`).

- [x] **Step 1: Sea name**

Replace the sea block with:

```js
    /* ---- the sea, named at size and measured against the neatline ---- */
    const seaMidY = (coastY(box.x + box.w * 0.3) + box.y + box.h) / 2 + 30;
    const seaX0 = box.x + 40;
    const seaX1 = box.x + box.w - 40;
    const seaArc = (yy) => `M${r2(seaX0)} ${r2(yy)} Q${r2(box.x + box.w / 2)} ${r2(yy + 34)} ${r2(seaX1)} ${r2(yy)}`;
    /* quadratic length ≈ chord + a sagitta correction (8/3 · s² / chord) */
    const seaLen = (seaX1 - seaX0) + (8 / 3) * (17 * 17) / (seaX1 - seaX0);
    const seaName = `the sea of ${seaPhrase.toLowerCase()}`;
    let seaSize = sheet.scale(1.5);
    const seaOpts = (sz) => ({ size: sz, family: FONTS.serif, style: 'italic', tracking: 3 });
    const seaFits = (s, sz) => measure(s, seaOpts(sz)) <= seaLen * 0.88;
    while (!seaFits(seaName, seaSize) && seaSize * 0.9 >= sheet.scale(0.5)) seaSize *= 0.9;
    const seaLines = [seaName];
    if (!seaFits(seaName, seaSize)) {
      const ws = seaName.split(' ');
      let best = 1, bestDiff = Infinity;
      for (let k = 1; k < ws.length; k++) {
        const diff = Math.abs(measure(ws.slice(0, k).join(' '), seaOpts(seaSize)) - measure(ws.slice(k).join(' '), seaOpts(seaSize)));
        if (diff < bestDiff) { bestDiff = diff; best = k; }
      }
      seaLines.splice(0, 1, ws.slice(0, best).join(' '), ws.slice(best).join(' '));
    }
    seaLines.forEach((s, i) => {
      nodes.push(textOnPath(s, seaArc(seaMidY + i * seaSize * 1.3), defs, {
        ...seaOpts(seaSize), fill: ink, opacity: 0.9,
        startOffset: `${r2(Math.max(0, (1 - measure(s, seaOpts(seaSize)) / seaLen) * 50))}%`,
      }));
    });
```

(`textOnPath` must accept `startOffset` as a percentage string; it does — calligramme uses it.)

- [x] **Step 2: Label collision pass**

Replace the `for (const s2 of spts)` label loop with a two-stage pass: compute each label's rectangle (`x: s2.x + 7, y: s2.y - 8, w: label._width, h: 12`), the sea band `{ x: seaX0, y: seaMidY - seaSize, w: seaX1 - seaX0, h: seaSize * 1.4 * seaLines.length }`, and a helper `hits(a, b)` for rectangle overlap. For each label in order: if it overlaps any earlier label's final rectangle or the sea band, flip to the left (`x: s2.x - 7 - label._width`); if it still overlaps, step `y` up by 16 up to three times. Then push marker circles and the label at its final position (`transform` for the flipped case, as the existing right-margin flip does). The existing right-margin flip stays as the first rule.

- [x] **Step 3: Verify** — smoke green; proofs at `deadbeef`/`8f3a21c9`, e=0.5 show the sea name inside the neatline and no label over another. Commit — "tendre: the sea is named to fit, and no settlement prints over another"

---

### Task 5: calligramme — rain in lanes, full height

**Files:**
- Modify: `src/engines/calligramme.js:55-107` (rain mode)

- [x] **Step 1:** In rain mode: `const lane = (box.w * 0.92) / threads;` `const amp = Math.min(8 + entropy * 42, lane * 0.32);` lean per thread `lean * rng.range(0.85, 1)`; `const len = box.h * rng.range(0.86, 0.98);`.

- [x] **Step 2:** Build each thread's text to length. Before the loop: `let pool = phrases.slice(); let spare = null;` Inside, for thread `i`:

```js
        const size = rng.range(11.5, 14.5);
        const tracking = size * rng.range(0.06, 0.22);
        const tOpts = { size, family: FONTS.serif, style: 'italic', tracking };
        let phrase = pool.length ? pool.shift() : phrases[i % phrases.length];
        for (let guard = 0; measure(phrase, tOpts) < len * 0.85 && guard < 6; guard++) {
          if (!pool.length) {
            spare = spare || source.fragment(rng, { minWords: 8, maxWords: 24 });
            pool = phrasesOf(spare.text, threads);
          }
          phrase += ' ' + pool.shift();
        }
```

then `textOnPath(phrase, d, defs, { ...tOpts, fill, startOffset: '0%' })` — note `size` and `tracking` are drawn *before* the pour, so their draw order is stable per thread. Import `measure` from `../typography.js`.

- [x] **Step 3:** Verify: smoke green; proofs at both seeds show five threads, none crossing, each running most of the page. Commit — "calligramme: the rain falls in lanes, the height of the page"

---

### Task 6: aria and mesostic fill the sheet

**Files:**
- Modify: `src/engines/aria.js:51-60` (`phrasesOf`), `:75-80` (phrases)
- Modify: `src/engines/mesostic.js:59-98`

- [x] **Step 1 (aria):** In `phrasesOf`, after the punctuation split, if `parts.length < want`, split the longest parts by words until `want` is reached (loop: take the part with most words, split it in half at a word boundary, repeat while `parts.length < want` and the longest part has ≥ 4 words). In `generate`: `let phrases = phrasesOf(frag.text, rng.int(4, 6)); if (phrases.length < 4) { const more = source.fragment(rng, { minWords: 8, maxWords: 26 }); phrases = phrases.concat(phrasesOf(more.text, 4 - phrases.length)); }`.

- [x] **Step 2 (mesostic):** after `rows` are built, before `y0`:

```js
    /* the column should command the sheet: scale the type up, no draws */
    let bodySize = size, spineSz = spineSize, leadPx = lead;
    const rowsH = rows.length * lead;
    if (rowsH < box.h * 0.6) {
      const k = Math.min(1.6, (box.h * 0.6) / rowsH);
      bodySize *= k; spineSz *= k; leadPx *= k;
    }
```

and use `bodySize`, `spineSz`, `leadPx` in the render loop in place of `size`, `spineSize`, `lead` (change `const size = 15` to `let`-free by renaming; keep `size` for the row-building measures untouched).

- [x] **Step 3:** Verify: smoke green; proofs. Commit — "aria and mesostic fill the sheet"

---

### Task 7: tendre — eight to twelve settlements

**Files:**
- Modify: `src/engines/tendre.js:40-42` (phrases), `:122-125` (settlements)

- [x] **Step 1:** After `const phrases = phrasesOf(frag.text, 9);`:

```js
    /* a country wants settlements: pull further fragments until eight
     * to twelve toponyms stand, or the pulls are spent */
    const wantTowns = rng.int(8, 12);
    const seen = new Set(phrases.map((p) => p.toLowerCase()));
    for (let pulls = 0; phrases.length < wantTowns + 2 && pulls < 4; pulls++) {
      const more = source.fragment(rng, { minWords: 6, maxWords: 24 });
      for (const p of phrasesOf(more.text, 6)) {
        if (!seen.has(p.toLowerCase())) { seen.add(p.toLowerCase()); phrases.push(p); }
      }
    }
```

and change `.slice(0, 6)` to `.slice(0, wantTowns)`. `longest`, `seaPhrase` and `lastPhrase` are computed after this block so they see the enlarged list; keep `lastPhrase` as the *first* fragment's last phrase by capturing `const lastPhrase = phrasesOf(frag.text, 9).slice(-1)[0]` before pulling (the terres inconnues line stays the poem's own ending).

- [x] **Step 2:** Verify smoke; proofs show 8–12 towns, labels clear (Task 4's pass). Commit — "tendre: a country of eight to twelve settlements"

---

### Task 8: technopaegnia — the contrary text

**Files:**
- Modify: `src/engines/technopaegnia.js:143-207`

- [x] **Step 1:** After `gatherWords`, when `entropy >= 0.6 && !asemicFill`:

```js
    let contrary = null;
    if (entropy >= 0.6 && sheet.material !== 'asemic') {
      let f = null;
      for (let k = 0; k < 4; k++) {
        f = source.fragment(rng, { minWords: 8, maxWords: 40 });
        if (!words.mood || f.mood !== words.mood) break;
      }
      contrary = { queue: f.text.split(/\s+/), attribution: f.attribution };
    }
```

(`gatherWords` returns `{ words, attribution }`; extend it to also return `mood` from the first fragment it pulls — read the function, it is above `generate`.)

- [x] **Step 2:** Make `fillLine(budget, size, q = queue)` take its queue as a parameter. In the pour loop, for line index `n` (counting across blocks): `const useB = contrary && n % 2 === 1;` `const text = fillLine(budget, size, useB ? contrary.queue : queue);` and when `useB`, render with `style: 'italic', fill: sheet.palette.accent || sheet.palette.ink, opacity: sheet.palette.accent ? 1 : 0.7`. When the contrary queue runs dry, fall back to the main queue for that line.

- [x] **Step 3:** Attribution: `contrary && contrary.attribution !== attribution ? \`${attribution} × ${contrary.attribution}\` : attribution`. Title unchanged.

- [x] **Step 4:** Verify: smoke green; the WARN for technopaegnia disappears; proofs at e=0, 0.5, 1. Commit — "technopaegnia: above 0.6 a contrary text pours through the same shape"

---

### Task 9: gloss — the voices close in

**Files:**
- Modify: `src/engines/gloss.js:38, 147-150, 158-196, 200-215`

- [x] **Step 1:** Stand-off: `const closeIn = entropy > 0.5 ? Math.min(1, (entropy - 0.5) / 0.35) : 0; const standoff = 26 - closeIn * 40;` and use `standoff` in `innerW` and `outerX`.

- [x] **Step 2:** Trail: in `renderGloss`, `const trailFrac = 0.75 - entropy * 0.4; const cut = opts.trail ? Math.max(1, Math.round(lines.length * trailFrac)) : fit;` — this replaces the `rng.int(2, 4)` draw, so remove it (draw count changes; accepted).

- [x] **Step 3:** Overprint above 0.85, after the four `fillColumn` calls:

```js
    /* the commentary prints over the text it comments on */
    if (entropy > 0.85 && !asemicGloss) {
      const opts = nextGloss();
      opts.opacity = 0.25;
      opts.trail = false;
      renderGloss(cx0, cw, cy0 + cs * 0.2, cy0 + cH + 20, opts);
    }
```

- [x] **Step 4:** Verify: smoke green, WARN gone for gloss; proofs at 0, 0.5, 1. Commit — "gloss: the voices close in with entropy, and print over the text at the top"

---

### Task 10: diagram — the labels come unpinned

**Files:**
- Modify: `src/engines/diagram.js:754-816` (`generate`), `:45-58` (`footnotes`)

The spec names a `placeLabel` helper; nine scaffolds with ~35 label sites make a post-pass over the scaffold's nodes the smaller change with the same effect. It runs on the scaffold output only, before the crossbreed and footnote nodes are added, so those never drift.

- [x] **Step 1:** Add above `export default`:

```js
/* Above 0.4 the labels come unpinned: each anchored <text> drifts by a
 * seeded gaussian, and a hairline leader runs from where it belonged.
 * Text on a path stays; its path is the anchor. */
function unpin(nodes, rng, sheet) {
  const amp = Math.max(0, (sheet.entropy - 0.4) / 0.6) * 70;
  if (!amp) return nodes;
  const out = [];
  const walk = (node, sink) => {
    const tag = (node.tagName || node.name || '').toLowerCase();
    if (tag === 'g') { for (const c of Array.from(node.children || [])) walk(c, sink); return; }
    if (tag !== 'text') return;
    if (node.getAttribute('transform')) return; // rotated labels stay put
    const kids = Array.from(node.children || []);
    const holder = node.getAttribute('x') !== null ? node : (kids[0] && kids[0].getAttribute && kids[0].getAttribute('x') !== null ? kids[0] : null);
    if (!holder || node.getAttribute('y') === null) return;
    if (kids.some((k) => (k.tagName || k.name || '').toLowerCase() === 'textpath')) return;
    const x = parseFloat(holder.getAttribute('x'));
    const y = parseFloat(node.getAttribute('y'));
    const dx = rng.gauss(0, amp * 0.6);
    const dy = rng.gauss(0, amp * 0.45);
    holder.setAttribute('x', r2(x + dx));
    node.setAttribute('y', r2(y + dy));
    sink.push(line(x, y, x + dx, y + dy, { stroke: sheet.palette.ink, width: 0.5, opacity: 0.6 }));
  };
  for (const n of nodes) walk(n, out);
  return nodes.concat(out);
}
```

`line` and `r2` are already imported. Call it in `generate`: `let nodes = unpin(scaffold.fn(rng, sheet, texts, defs), rng, sheet);` (make `nodes` a `let`).

- [x] **Step 2:** Footnote orphan: build the `notes` array first; `if (sheet.entropy > 0.85) notes[rng.int(0, notes.length - 1)].stars = '';` then in `footnotes`, print `n.stars ? \`${n.stars} ${n.text}\` : n.text`.

- [x] **Step 3:** Verify: smoke green (the shim's `VEl` has `children`, `getAttribute`, `setAttribute`, `name` — confirm `walk` finds `<text>` nodes there: add a temporary `console.log` count, then remove). WARN gone for diagram. Proofs at 0, 0.5, 1 for two seeds. Commit — "diagram: above 0.4 the labels come unpinned, on leaders"

---

### Task 11: revisedPhilosophy — the revised page

**Files:**
- Modify: `src/engines/revisedPhilosophy.js:100-219`
- Modify: `tools/smoke.mjs` (promote WARN to FAIL)

- [x] **Step 1: différance.** Above the dialogue:

```js
    /* différance: one letter off, visible in writing, inaudible in speech */
    const slip = (name) => {
      if (/e/i.test(name)) return name.replace(/e/i, (m) => (m === 'E' ? 'A' : 'a'));
      if (/a/i.test(name)) return name.replace(/a/i, (m) => (m === 'A' ? 'E' : 'e'));
      return name.replace(/i/i, (m) => (m === 'I' ? 'Y' : 'y'));
    };
    const spoken = entropy >= 0.3 ? slip(authority) : authority;
```

and `const speakers = [spoken, other];`. Destructure `entropy` from `sheet`.

- [x] **Step 2: the contradiction (0.3–0.7).** Replace the moral block's condition with `if (entropy < 0.7 && (entropy >= 0.3 || rng.chance(0.6)))` and choose the pool by band:

```js
      const denials = [
        `The doctrine of ${word1} was never his; the editors regret the epigraph.`,
        `Later hands deny he ever reached ${word2}.`,
        `The biographers, consulted again, withdraw the ${word1}.`,
        `He was born, if at all, elsewhere.`,
        `Nothing above should be taken as having been said.`,
      ];
      const moral = rng.pick(entropy >= 0.3 ? denials : morals);
```

(`morals` is the existing array, hoisted out of the `if`.)

- [x] **Step 3: the Glas page (≥ 0.7).** Wrap the existing dialogue loop in `if (entropy < 0.7) { … } else { glas(); }` where the else branch:

```js
      const turns = rng.int(3, 5);
      const gutter = baseline * 2;
      const colW = (box.w * 0.84 - gutter) / 2;
      const xL = box.x + box.w * 0.08;
      const xR = xL + colW + gutter;
      const yStart = y;
      const floor = box.y + box.h - baseline * 2;
      let yL = y, yR = y;
      const rightWords = [];
      for (let i = 0; i < turns; i++) {
        const frag = source.fragment(rng, { minWords: 3, maxWords: 16 });
        if (!attribution) attribution = frag.attribution;
        else if (i === 1 && frag.attribution !== attribution) attribution += ' · ' + frag.attribution;
        let text = frag.text.replace(/[.;,:]$/, '.');
        if (!/[.!?…]$/.test(text)) text += '.';
        const left = i % 2 === 0;
        const yy = left ? yL : yR;
        if (yy > floor - baseline * 2) break;
        const spName = (left ? spoken : other).toUpperCase() + '.';
        nodes.push(smallCapsText(spName, { x: left ? xL : xR, y: yy, size: bodySize * 0.86, trackingEm: 0.1, family: serif, fill: ink }));
        const blk = justifiedBlock(text, { x: left ? xL : xR, y: yy + baseline, width: colW, size: bodySize, leading: baseline, family: serif, fill: ink });
        nodes.push(...blk.nodes);
        if (!left) rightWords.push(...text.split(/\s+/));
        if (left) yL = yy + baseline + blk.height + baseline * 0.5; else yR = yy + baseline + blk.height + baseline * 0.5;
      }
      /* the judas window: three words of the other column, let in */
      if (rightWords.length >= 3 && yL - yStart > baseline * 4) {
        const wi = rng.int(0, rightWords.length - 3);
        const words3 = rightWords.slice(wi, wi + 3).join(' ').replace(/[.,;:!?]$/, '');
        const ww = colW * 0.4;
        const wh = baseline * 2;
        const wx = xL + colW * 0.3;
        const wy = yStart + (yL - yStart) * 0.55 - wh / 2;
        nodes.push(el('rect', { x: r2(wx), y: r2(wy), width: r2(ww), height: r2(wh), fill: sheet.palette.paper, stroke: ink, 'stroke-width': 0.7 }));
        nodes.push(textEl(words3, { x: wx + ww / 2, y: wy + wh / 2 + bodySize * 0.35, size: bodySize, family: serif, style: 'italic', fill: ink, anchor: 'middle' }));
      }
      y = Math.max(yL, yR);
```

No moral in this band (Step 2's condition already excludes it).

- [x] **Step 4: promote the smoke check.** In `tools/smoke.mjs`, change the `console.warn('WARN entropy-insensitive…')` line to `console.error(\`FAIL entropy-insensitive: ${id}/${seed}\`); failures++;` and the log line to `ok  entropy moves ${ENTROPY_ENGINES.length} once-deaf engines`.

- [x] **Step 5: README.** In the lineage paragraph for Grandbois (find "Revised Poetry" in README.md) add one sentence: "Push the entropy up and the page is revised again: the speaker's name slips one letter from the heading (différance), the moral denies the epigraph, and at the top the dialogue splits into two columns that argue past each other, Glas-fashion, with a judas window letting three words across."

- [x] **Step 6: Verify** — smoke fully green with no WARN; proofs of revisedPhilosophy at 0, 0.5, 0.9 for both seeds; the window sits inside the left column; nothing runs past the floor. Commit — "revised philosophy: différance, a denial, and a Glas page at the top of the slider"

---

## Self-review

- **Spec coverage**: §1 → Task 2; §2 technopaegnia → 8, gloss → 9, diagram → 10, revisedPhilosophy → 11; §3 tendre → 4, calligramme → 5; §4 aria/mesostic → 6, tendre → 7; §5 → 1; testing → 3 and 11. Order matches the spec's, with smoke's entropy parameter pulled forward to Task 3 so every engine change is checked at both ends as it lands.
- **Deviation from spec, recorded**: diagram uses a post-pass (`unpin`) rather than a `placeLabel` helper routed through every scaffold; same effect on anchored labels, text-on-path exempt, far smaller diff. Gloss's trail cut replaces an `rng.int` draw with a computed fraction, which changes draw order for that engine (accepted under the spec's "existing links will render differently" line).
- **Names**: `TEXT_CAP`, `ENTROPY_ENGINES`, `unpin`, `slip`, `spoken`, `seaArc`, `seaLines`, `wantTowns`, `standoff`, `closeIn` are each defined in the task that uses them.
