# Wall and Openings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the site a wall view of all twenty-five engines at the current seed, printable as a chapbook, and open cold visits on a curated sheet.

**Architecture:** The pure render leaves `main.js` for `src/render.js`. The wall is a second stage view driven by `state.view` and a `view=wall` hash key, rendering `ENGINES.length` tiles through the shared render. Print is a stylesheet. Openings are a data module consulted once at boot when there is no hash.

**Tech Stack:** Vanilla ES modules, CSS grid, `@media print`, `node tools/smoke.mjs`, headless Chrome (`--screenshot`, `--print-to-pdf`).

**Spec:** `docs/superpowers/specs/2026-09-06-wall-and-openings-design.md`

## Global Constraints

- The hash remains the whole state; no state lives only in JS.
- Engines and `renderPoem` stay pure; the wall draws nothing itself.
- Smoke green after every task; one commit per task; prose-style messages ending `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Proofing: `python3 -u -m http.server 8765 &`; screenshots via headless Chrome; PDFs via `--print-to-pdf=<file> --no-pdf-header-footer`.

---

### Task 1: `src/render.js`

**Files:** Create `src/render.js`; modify `src/main.js` (remove `renderPoem` and now-unused imports, import from `./render.js`); modify `tools/smoke.mjs` (`render()` calls `renderPoem`).

- [ ] Move `renderPoem` (main.js ~L106–170) and its comment into `src/render.js` with imports: `makeRng` (prng), `choosePalette` (palette), `makeSheet, setFonts, pairingFor, facesLoaded` (typography), `el, resetIds` (svg), `makeTextSource` (text/procedures), `pickEngine, sheetSizeFor, pickHybrid` (engines/index), `buildColophon` (colophon). `export function renderPoem`.
- [ ] In `main.js`: `import { renderPoem } from './render.js';` and prune imports no longer used there (keep `randomSeed`, `TYPE_PAIRINGS`, `LEGACY_PAIRING_IDS`, `loadFonts`, `pairingFor`, `ENGINES`, `ENGINE_MAP`, export functions, aiParser functions). Run `node --check src/main.js`.
- [ ] In smoke: `const { renderPoem } = await import('../src/render.js');` and `render(seed, engine, mode, userText, hybrid, pairing, entropy)` becomes: `const r = renderPoem({ seed, engineId: engine.id, source: mode, userText, entropy, paperMode: 'auto', typeId: (pairing || baskervillePairing).id, hybrid }); return { xml: serialize(r.svg), colophon: r.meta.colophon, title: r.meta.title };` where `baskervillePairing = TYPE_PAIRINGS.find((p) => p.id === 'baskerville') || TYPE_PAIRINGS[0]`. Note `hybrid` forced: `pickHybrid(rng, engine, force)` inside renderPoem honours it.
- [ ] Smoke green; browser loads and renders as before. Commit — "the pure render moves to render.js".

---

### Task 2: the wall

**Files:** `index.html` (markup, CSS, rail keys), `src/main.js` (state, URL, key, rail item, `renderWall`, `show`), `README.md` (keys, running).

- [ ] **Markup**: inside `<main id="stage">` after `#sheet-holder`: `<div id="wall" hidden></div>`. Keys section: add `<kbd>W</kbd> the wall`.
- [ ] **CSS** (desktop): 
```css
  #wall { flex: 1; min-height: 0; width: 100%; overflow-y: auto; display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; align-content: start; padding: 2px 2px 8px; }
  #wall .tile { margin: 0; cursor: pointer; }
  #wall .tile svg { display: block; width: 100%; height: auto; background: var(--paper);
    box-shadow: 0 1px 2px rgba(22,20,18,.18), 0 6px 18px rgba(22,20,18,.18); }
  #wall .tile figcaption { font-variant: all-small-caps; letter-spacing: .12em; font-size: 11px; color: var(--faint); text-align: center; margin-top: 6px; }
  #wall .tile:hover figcaption { color: var(--ink); }
```
  Mobile block: `#wall { grid-template-columns: repeat(2, 1fr); overflow: visible; }`.
- [ ] **State**: `view: 'sheet'` in `state`; `readURL`: `if (h.get('view') === 'wall') state.view = 'wall';`; `writeURL`: `if (state.view === 'wall') h.set('view', 'wall');`.
- [ ] **Rail item**: in `buildEngineList`, after the engines: `mk('__wall', 'the wall', 'all twenty-five engines at this seed')` — but its click handler sets `state.view = 'wall'` and calls `show({ seed: state.seed, engineId: state.engine })`. Give `mk` an optional `onClick`. `markEngineList` marks active: the wall item when `state.view === 'wall'`, else the engine match (and in wall view no engine is marked).
- [ ] **renderWall()**:
```js
function renderWall() {
  const wall = document.getElementById('wall');
  wall.innerHTML = '';
  for (const e of ENGINES) {
    const r = renderPoem({ seed: state.seed, engineId: e.id, source: state.source, userText: state.userText,
      entropy: state.entropy, paperMode: state.paperMode, typeId: state.typeId, hybrid: state.hybrid });
    const fig = document.createElement('figure');
    fig.className = 'tile';
    fig.dataset.engine = e.id;
    fig.dataset.colophon = r.meta.colophon;
    fig.appendChild(r.svg);
    const cap = document.createElement('figcaption');
    cap.textContent = e.name;
    fig.appendChild(cap);
    fig.addEventListener('click', () => { state.engine = e.id; state.view = 'sheet'; show({ seed: state.seed, engineId: e.id }); });
    wall.appendChild(fig);
  }
}
```
- [ ] **show()**: after the sheet is rendered and placed, `const onWall = state.view === 'wall'; document.getElementById('sheet-holder').hidden = onWall; document.getElementById('wall').hidden = !onWall; if (onWall) { renderWall(); colophon.textContent = wallColophon(current.meta); }`. `wallColophon(meta)` builds `№ … · the wall · seed … · twenty-five engines · set in … · year` — take the number from `meta.colophon`'s leading `№ …` token, the type credit from its `set in …` segment (split on ` · `).
- [ ] **W key**: in the keydown handler: `else if (e.key === 'w' || e.key === 'W') { state.view = state.view === 'wall' ? 'sheet' : 'wall'; show({ seed: state.seed, engineId: state.engine }, { push: false }); }`.
- [ ] **README**: Keys line adds `W` the wall; Running gains: "Press `W` (or pick *the wall* in the engine list) for a wall of all twenty-five engines at the current seed; click a tile to open it."
- [ ] Verify: smoke green; `#seed=8f3a21c9&view=wall` screenshot shows 25 tiles; click behaviour via a second screenshot after navigating to the resulting hash by hand. Commit — "the wall: every engine at this seed".

---

### Task 3: print

**Files:** `index.html` (CSS).

- [ ] Add:
```css
  @media print {
    @page { margin: 12mm; }
    html, body { height: auto; overflow: visible; background: #fff; }
    #app { display: block; }
    #rail, #mobead, #touchbar, #gallery, #rotate-hint, #no-module { display: none !important; }
    #stage { display: block; padding: 0; overflow: visible; }
    #sheet-holder { display: block; }
    #sheet-holder svg { display: block; max-width: 100%; max-height: 85vh; margin: 0 auto; box-shadow: none; }
    #colophon { border: 0; background: none; white-space: normal; text-align: center; }
    #wall { display: block; overflow: visible; }
    #wall .tile { break-after: page; break-inside: avoid; page-break-after: always; margin: 0 0 8mm; }
    #wall .tile svg { max-height: 85vh; width: auto; margin: 0 auto; box-shadow: none; }
    #wall .tile figcaption { font-variant: normal; letter-spacing: 0; font-style: italic; font-size: 11pt; color: #000; }
    #wall .tile figcaption::after { content: attr(data-colophon); display: block; font-size: 9.5pt; margin-top: 3pt; }
    body.on-wall #colophon { display: none; }
  }
```
  The `::after` reads `attr(data-colophon)` from the figcaption, so `renderWall` sets `cap.dataset.colophon` too (or move the attribute to the caption only). `show()` toggles `document.body.classList.toggle('on-wall', onWall)`.
- [ ] Verify with headless Chrome `--print-to-pdf` for `#seed=8f3a21c9&engine=grammar` (1 page) and `#seed=8f3a21c9&view=wall` (25 pages); count pages with `grep -c "/Type /Page[^s]"` or by `mdls`/`pdfinfo` if present. README: "Print (⌘P) prints the sheet; on the wall, twenty-five pages, one engine each, colophon as the foot." Commit — "print: the sheet, or the wall as a chapbook".

---

### Task 4: openings

**Files:** Create `src/openings.js`; modify `src/main.js` (boot); `README.md`.

- [ ] `src/openings.js`:
```js
/* The curated openings: a dozen sheets chosen by eye. A cold visit opens
 * on one of them; every roll after that is chance. Each line says why. */
export const OPENINGS = [
  { engine: 'grammar', seed: '5b15bb49' },            // three sentences diagrammed by hand
  { engine: 'tendre', seed: 'deadbeef' },             // a country with eight settlements and a long sea
  { engine: 'calligramme', seed: '7b9d0e2f' },        // Stein's rain in five lanes
  { engine: 'lineprinter', seed: 'b3e76784' },        // A House of Dust, pass 04
  { engine: 'typestract', seed: 'deadbeef', e: 0.2 }, // a dsh lozenge in t, n, e
  { engine: 'revisedPhilosophy', seed: '8f3a21c9', e: 0.9 }, // Thalas and the pupil, a Glas page
  { engine: 'intextus', seed: '4e5d55c3' },           // "told me you" threaded through the grid
  { engine: 'diagram', seed: '1a96220e' },            // Freud's egg, annotated
  { engine: 'mesostic', seed: '8f3a21c9', e: 0.9 },   // MARGIN read through Dickinson
  { engine: 'technopaegnia', seed: 'deadbeef', e: 0.2 }, // the altar, one elegiac voice
  { engine: 'gloss', seed: '8f3a21c9' },              // the Brain is wider than the Sky, glossed
  { engine: 'dirtyConcrete', seed: 'fcb37a07' },      // Apollinaire's cœur against NONONO
];
```
  (Author's picks from this session's proofs; the review with the user may strike or add.)
- [ ] Boot in `main.js`, after `readURL()`:
```js
/* a cold visit opens on a curated sheet; everything after is chance */
if (!location.hash && !new URLSearchParams(location.search).has('engine') && !new URLSearchParams(location.search).has('hybrid')) {
  const o = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
  state.engine = o.engine; state.seed = o.seed; if (o.e !== undefined) state.entropy = o.e;
}
```
  before the control sync, so the slider shows the opening's entropy. `show({ seed: state.seed || randomSeed(), engineId: state.engine })` is unchanged.
- [ ] README (Running): "A first visit opens on one of a dozen sheets chosen by eye (`src/openings.js`); every roll after that is chance."
- [ ] Verify: smoke green; three cold loads in headless Chrome with `--dump-dom` show `#engine-list .active` naming an opening engine, and the seed box holding its seed. Commit — "curated openings: a first visit lands on a chosen sheet".
- [ ] **Review with the user**: render walls for ten seeds (`8f3a21c9 deadbeef cafe1234 7b9d0e2f 1234abcd 00000001 feedface 0badf00d c0ffee00 a1b2c3d4`) headlessly at 1500×2400, present them, mark the picks, amend `OPENINGS` on the user's word (one more commit if anything changes).

---

## Self-review

- Spec §1 → Task 1; §2 → Task 2; §3 → Task 3; §4 → Task 4 (including the review step). README changes ride with their tasks.
- Names: `renderPoem` (render.js), `state.view`, `renderWall`, `wallColophon`, `OPENINGS` — each defined in the task that introduces it and used only after.
- The `data-colophon` attribute: set on the figcaption (Task 3 reads it from the caption's `::after`); Task 2 puts it on the figure as well for scripts.
