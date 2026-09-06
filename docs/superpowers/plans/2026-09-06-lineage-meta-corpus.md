# Lineage, Meta and Corpus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sharing meta and a copy-link control; a lineage drawer fed by the README; a corpus widened by about 120 fragments in eight languages.

**Architecture:** Meta is static HTML plus one committed PNG and a title update in `show()`. The drawer is a small module, `src/lineage.js`, that fetches and parses the README once and renders paragraphs for an engine; `main.js` wires the colophon click and the keys. The corpus grows in `src/text/corpus.js` by appended groups; smoke gains a field check.

**Tech Stack:** Vanilla ES modules, `fetch`, `navigator.clipboard`, headless Chrome.

**Spec:** `docs/superpowers/specs/2026-09-06-lineage-meta-corpus-design.md`

## Global Constraints

- Nothing rendered into the page from the README is raw HTML: build elements from parsed pieces.
- Fragments follow the pre-1929 rule and carry `attribution`, `mood`, `kind`, `lang`.
- Smoke green after every commit; one commit per task (per group for the corpus).

---

### Task 1: sharing meta

**Files:** `index.html` (head; Export row), `src/main.js` (`show()` title; copy handler; `C` key), `og.png` (new), `README.md` (keys: `C` copy link).

- [ ] Head: favicon SVG data URI (`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' fill='%23F6F1E5'/><text x='16' y='23' text-anchor='middle' font-family='Georgia,serif' font-size='22' fill='%23161412'>T</text></svg>`), description, `og:*`, `twitter:card`.
- [ ] Export row: `<button class="text-btn" id="copy-link">copy link</button>`. Handler: `copyLink()` — `navigator.clipboard?.writeText(location.href).then(ok, fallback)`; on ok set text "copied" and restore after 1200 ms; fallback selects `#seed-input` and sets "select & copy". `C` key calls it.
- [ ] `show()`: `document.title = onWall ? \`TYPESTRACT · the wall · ${state.seed}\` : \`TYPESTRACT · ${current.meta.title}\`;`
- [ ] `og.png`: headless Chrome `--window-size=1200,630 --screenshot=og.png "…/#seed=8f3a21c9&view=wall"`; check it is 1200×630 with `sips -g pixelWidth -g pixelHeight`.
- [ ] README keys line: add `C` copy link. Smoke green. Commit — "sharing meta: favicon, description, Open Graph, a live title, copy link".

---

### Task 2: the lineage drawer

**Files:** create `src/lineage.js`; `index.html` (drawer markup + CSS); `src/main.js` (wiring).

- [ ] `src/lineage.js`:
```js
import { CAPTIONS } from './colophon.js';
let readmeText = null;
export async function loadReadme() { if (readmeText !== null) return readmeText; try { const r = await fetch('README.md'); readmeText = r.ok ? await r.text() : ''; } catch { readmeText = ''; } return readmeText; }
export function lineageParagraphs(text, engineId) { /* slice between '## The lineage' and '### The anthologies'; split on blank lines; keep paragraphs containing `\`${engineId}\`` */ }
export function renderInline(str) { /* returns a DocumentFragment: tokens for **, *, `, [text](url) */ }
export function captionsFor(engineId) { return CAPTIONS[engineId] || []; }
```
- [ ] Markup after `#wall`: `<aside id="drawer" hidden><button id="drawer-close" aria-label="close">×</button><div id="drawer-body"></div></aside>`; CSS: `#stage { position: relative }`, `#drawer { position: absolute; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100%; background: var(--paper); border-left: 1px solid var(--hairline); padding: 28px 26px; overflow-y: auto; font-size: 13.5px; line-height: 1.55; box-shadow: -8px 0 24px rgba(22,20,18,.12); }`, `#drawer h2 { small caps like .label }`, `#drawer p { margin-bottom: 12px }`, `#drawer .cites { color: var(--faint); font-style: italic }`, mobile: `width: 100%`. `#colophon { cursor: pointer }`.
- [ ] `main.js`: `openDrawer()` builds the body for `current.meta.engineId` (+ `hybridWith.id`): heading, paragraphs via `renderInline`, "as the colophon cites it" list, README link, or the fallback line when the text is empty. Colophon click → open; `#drawer-close`, Escape, and clicks on `#stage` outside the drawer → close; `show()` re-renders the drawer body if open.
- [ ] Proof: temporary `?drawer=1` hook in main.js to open at boot; screenshot `#seed=8f3a21c9&engine=gloss` and a hybrid `#seed=8f3a21c9&engine=diagram&hybrid=1`; remove the hook. Smoke green. Commit — "the lineage, in the app: a drawer fed by the README".

---

### Task 3: the corpus

**Files:** `src/text/corpus.js`, `tools/smoke.mjs` (field check, first group), README text-sources section (one sentence on the widening).

- [ ] Smoke check (with group 1):
```js
{
  const { CORPUS } = await import('../src/text/corpus.js');
  const MOODS = new Set(['still', 'elegiac', 'ecstatic', 'wry', 'cosmic']);
  const KINDS = new Set(['word', 'phrase', 'line', 'sentence']);
  const seen = new Map();
  for (const f of CORPUS) {
    if (!f.text || !f.attribution || !MOODS.has(f.mood) || !KINDS.has(f.kind) || !/^[a-z]{2}$/.test(f.lang || '')) { console.error(`FAIL corpus fields: ${JSON.stringify(f).slice(0, 80)}`); failures++; }
    if (seen.has(f.text)) { console.error(`FAIL corpus duplicate: ${f.text.slice(0, 60)}`); failures++; }
    seen.set(f.text, true);
  }
  console.log(`ok  corpus (${CORPUS.length} fragments, fields and uniqueness)`);
}
```
  If existing fragments fail (a missing `lang`, say), fix them in the same commit.
- [ ] Groups, each appended under a `// ——— … ———` banner before the closing `];`, each its own commit: (1) Chinese in translation + Japanese; (2) German; (3) French; (4) Italian and Latin; (5) Spanish and Portuguese; (6) English; (7) words. Attribution style follows the file: `'Po Chü-i, "The Red Cockatoo" (trans. Waley, 1918)'`, `'R. M. Rilke, "Der Panther" (1907)'`.
- [ ] After the last group: a wall screenshot at `#seed=cafe1234&view=wall`; README "Text sources" gains one sentence with the new count and languages. Commit with the words group.

---

## Self-review

- Spec §1 → Task 1; §2 → Task 2; §3 → Task 3 (seven commits). README changes ride with their tasks.
- Names: `copyLink`, `loadReadme`, `lineageParagraphs`, `renderInline`, `captionsFor`, `openDrawer` — defined where introduced.
