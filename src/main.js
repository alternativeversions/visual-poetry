/*
 * main.js — boot, seed handling, keyboard, export wiring.
 *
 * All state that shapes a poem (seed, engine, source) lives in the URL
 * hash, so any render is shareable and reproducible.
 */

import { makeRng, randomSeed } from './prng.js';
import { choosePalette } from './palette.js';
import { makeSheet, TYPE_PAIRINGS, setFonts } from './typography.js';
import { el, g, resetIds, NS } from './svg.js';
import { makeTextSource } from './text/procedures.js';
import { ENGINES, ENGINE_MAP, pickEngine, sheetSizeFor, pickHybrid } from './engines/index.js';
import { buildColophon } from './colophon.js';
import { serializeSVG, downloadSVG, downloadPNG, downloadFlattenedSVG } from './export.js';
import { provider, requestParses, requestShapes, requestProfiles, shapeCandidates, onOracle } from './text/aiParser.js';

/* ------------------------------------------------------------------ *
 * State ↔ URL.
 * ------------------------------------------------------------------ */

const state = {
  seed: null,
  engine: null, // engine id or null for chance
  source: 'corpus',
  userText: '',
  entropy: 0.5,
  paperMode: 'auto',
  typeId: 'chance', // type pairing, or 'chance' to let the seed choose
  hybrid: false, // forced hybrid via ?hybrid=1
};

function readURL() {
  const q = new URLSearchParams(location.search);
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  state.seed = h.get('seed') || null;
  state.engine = h.get('engine') || q.get('engine') || null;
  if (state.engine && !ENGINE_MAP[state.engine]) state.engine = null;
  if (h.get('source')) state.source = h.get('source');
  const t = h.get('type') || q.get('type');
  if (t && TYPE_PAIRINGS.some((p) => p.id === t)) state.typeId = t;
  state.hybrid = q.get('hybrid') === '1' || h.get('hybrid') === '1';
  // ?ai=ollama | anthropic | off — persist the parsing provider
  const ai = q.get('ai');
  if (ai) {
    try {
      if (ai === 'off') localStorage.removeItem('typestract-ai');
      else localStorage.setItem('typestract-ai', ai);
    } catch { /* no storage */ }
  }
}

function writeURL() {
  const h = new URLSearchParams();
  h.set('seed', state.seed);
  if (state.engine) h.set('engine', state.engine);
  if (state.source !== 'corpus') h.set('source', state.source);
  if (state.typeId !== 'chance') h.set('type', state.typeId);
  if (state.hybrid) h.set('hybrid', '1');
  history.replaceState(null, '', '#' + h.toString());
}

/* ------------------------------------------------------------------ *
 * Rendering.
 * ------------------------------------------------------------------ */

let current = null; // { svg, meta, engine }
const historyList = [];
let historyIndex = -1;
let rotateHintDismissed = false;

/**
 * Pure render: everything derives from (seed, engineId, source, userText,
 * entropy, paperMode). Returns { svg, meta, engine }.
 */
export function renderPoem({ seed, engineId, source, userText, entropy, paperMode, typeId, hybrid }) {
  resetIds();

  // the type pairing: pinned from the rail, or the seed's own choice
  const pairing =
    TYPE_PAIRINGS.find((p) => p.id === typeId) ||
    makeRng(seed + ':type').pick(TYPE_PAIRINGS);
  setFonts(pairing);

  // Independent streams so one facet's draws never perturb another's.
  const engineRng = makeRng(seed + ':engine');
  const engine = pickEngine(engineRng, engineId);
  const hybridWith = pickHybrid(makeRng(seed + ':hybrid'), engine, hybrid);

  const paletteRng = makeRng(seed + ':palette');
  const palette = choosePalette(paletteRng, {
    ...(engine.paletteOpts || {}),
    paperMode: paperMode !== 'auto' ? paperMode : (engine.paletteOpts || {}).paperMode || 'auto',
  });

  const size = sheetSizeFor(engine);
  const sheet = makeSheet({
    width: size.width,
    height: size.height,
    palette,
    entropy,
    material: hybridWith ? hybridWith.id : null,
    marginRatio: engine.marginRatio || 0.09,
  });

  const textSource = makeTextSource(makeRng(seed + ':text'), {
    mode: source,
    userText,
  });

  const result = engine.generate(makeRng(seed + ':gen:' + engine.id), textSource, sheet);

  const svg = el('svg', {
    viewBox: `0 0 ${sheet.width} ${sheet.height}`,
    'font-kerning': 'normal',
  });
  svg.appendChild(el('rect', {
    x: 0, y: 0, width: sheet.width, height: sheet.height,
    fill: palette.paper,
  }));
  for (const node of result.nodes) svg.appendChild(node);

  const meta = {
    engineId: engine.id,
    engineName: engine.name,
    seed,
    attribution: result.attribution,
    hybridWith: hybridWith ? { id: hybridWith.id, name: hybridWith.name } : null,
    caption: result.caption || null,
    title: result.title || 'untitled',
  };
  meta.colophon = buildColophon(meta) + ` · set in ${pairing.name} · ${new Date().getFullYear()}`;
  meta.filename = `typestract-${engine.id}-${seed}.svg`;
  return { svg, meta, engine };
}

function show(entry, { push = true } = {}) {
  state.seed = entry.seed;
  if (entry.engineId !== undefined) state.engine = entry.engineId;
  writeURL();

  current = renderPoem({
    seed: state.seed,
    engineId: state.engine,
    source: state.source,
    userText: state.userText,
    entropy: state.entropy,
    paperMode: state.paperMode,
    typeId: state.typeId,
    hybrid: state.hybrid,
  });

  const holder = document.getElementById('sheet-holder');
  holder.innerHTML = '';
  holder.appendChild(current.svg);
  document.getElementById('colophon').textContent = current.meta.colophon;
  document.getElementById('seed-input').value = state.seed;
  document.getElementById('export-flat').style.display =
    current.svg.querySelector('[data-flatten="1"]') ? '' : 'none';
  markEngineList();

  if (push) {
    historyList.splice(historyIndex + 1);
    historyList.push({ seed: state.seed, engineId: state.engine });
    historyIndex = historyList.length - 1;
    addThumb(current, historyIndex);
  }
  markThumb();
  updateRotateHint();
}

/* ------------------------------------------------------------------ *
 * Session gallery (in memory only).
 * ------------------------------------------------------------------ */

function addThumb(entry, index) {
  const gallery = document.getElementById('gallery');
  const xml = serializeSVG(entry.svg, entry.meta);
  const img = document.createElement('img');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  img.title = entry.meta.colophon;
  img.dataset.index = index;
  img.addEventListener('click', () => {
    historyIndex = Number(img.dataset.index);
    show(historyList[historyIndex], { push: false });
  });
  gallery.appendChild(img);
  while (gallery.children.length > 14) {
    gallery.removeChild(gallery.firstChild);
  }
  gallery.scrollLeft = gallery.scrollWidth;
}

function markThumb() {
  document.querySelectorAll('#gallery img').forEach((img) => {
    img.classList.toggle('current', Number(img.dataset.index) === historyIndex);
  });
}

/* ------------------------------------------------------------------ *
 * Controls.
 * ------------------------------------------------------------------ */

function buildEngineList() {
  const list = document.getElementById('engine-list');
  list.innerHTML = '';
  const mk = (id, name, lineage) => {
    const btn = document.createElement('button');
    btn.className = 'engine-item';
    btn.dataset.engine = id || '';
    const nm = document.createElement('span');
    nm.textContent = name;
    btn.appendChild(nm);
    if (lineage) {
      const ln = document.createElement('span');
      ln.className = 'lineage';
      ln.textContent = lineage;
      btn.appendChild(ln);
    }
    btn.addEventListener('click', () => {
      state.engine = id;
      show({ seed: state.seed, engineId: id });
    });
    list.appendChild(btn);
  };
  mk(null, 'chance', 'the dice pick the engine');
  for (const e of ENGINES) mk(e.id, e.name, e.lineage);
}

function markEngineList() {
  document.querySelectorAll('.engine-item').forEach((btn) => {
    btn.classList.toggle('active', (btn.dataset.engine || null) === (state.engine || null));
  });
}

function reroll() {
  show({ seed: randomSeed(), engineId: state.engine });
}

function cycleEngine(dir = 1) {
  const ids = ENGINES.map((e) => e.id);
  const at = state.engine ? ids.indexOf(state.engine) : -1;
  const next = ids[(at + dir + ids.length) % ids.length];
  show({ seed: state.seed, engineId: next });
}

/** Walk session history by `dir` (±1); the arrow keys and the mobile
 * thumb bar share this. No-ops at either end. */
function stepHistory(dir) {
  const next = historyIndex + dir;
  if (next < 0 || next >= historyList.length) return;
  historyIndex = next;
  show(historyList[historyIndex], { push: false });
}

/* On a phone, a landscape spread (coupDeDes, tendre) scales to a thin
 * band; suggest rotating — once, until dismissed. Inert on desktop,
 * where the hint element is display:none regardless. */
function updateRotateHint() {
  const hint = document.getElementById('rotate-hint');
  if (!hint) return;
  const onPhone = window.matchMedia('(max-width: 760px)').matches;
  const vb = current && current.svg.getAttribute('viewBox');
  const dims = vb ? vb.split(/\s+/).map(Number) : null;
  const landscape = dims && dims[2] > dims[3] * 1.15;
  const portrait = window.innerHeight >= window.innerWidth;
  hint.hidden = !(onPhone && landscape && portrait && !rotateHintDismissed);
}

function wire() {
  buildEngineList();

  document.getElementById('reroll-btn').addEventListener('click', reroll);

  const seedInput = document.getElementById('seed-input');
  seedInput.addEventListener('change', () => {
    const v = seedInput.value.trim();
    if (v) show({ seed: v, engineId: state.engine });
  });

  document.querySelectorAll('input[name="source"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      state.source = radio.value;
      document.getElementById('user-text').classList.toggle('open', state.source === 'user');
      show({ seed: state.seed, engineId: state.engine });
      if (state.source === 'user') upgradeParses();
    });
  });

  const drawer = document.getElementById('user-text');
  drawer.addEventListener('change', () => {
    state.userText = drawer.value;
    if (state.source === 'user') {
      show({ seed: state.seed, engineId: state.engine });
      upgradeParses();
    }
  });

  const entropy = document.getElementById('entropy');
  entropy.addEventListener('input', () => {
    state.entropy = entropy.value / 100;
    document.getElementById('entropy-val').textContent = state.entropy.toFixed(2);
  });
  entropy.addEventListener('change', () => show({ seed: state.seed, engineId: state.engine }));

  document.getElementById('paper-mode').addEventListener('change', (e) => {
    state.paperMode = e.target.value;
    show({ seed: state.seed, engineId: state.engine });
  });

  const typeSelect = document.getElementById('type-pairing');
  for (const p of TYPE_PAIRINGS) {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.name;
    typeSelect.appendChild(opt);
  }
  typeSelect.value = state.typeId;
  typeSelect.addEventListener('change', () => {
    state.typeId = typeSelect.value;
    show({ seed: state.seed, engineId: state.engine });
  });

  document.getElementById('export-svg').addEventListener('click', () => downloadSVG(current.svg, current.meta));
  document.getElementById('export-png2').addEventListener('click', () => downloadPNG(current.svg, current.meta, 2));
  document.getElementById('export-png4').addEventListener('click', () => downloadPNG(current.svg, current.meta, 4));
  document.getElementById('export-flat').addEventListener('click', () => downloadFlattenedSVG(current.svg, current.meta));

  /* Mobile thumb bar and rotate hint. These elements are display:none on
   * desktop, so wiring them there is harmless; on a phone they stand in
   * for the keyboard shortcuts below. */
  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  };
  bind('touch-reroll', reroll);
  bind('hist-prev', () => stepHistory(-1));
  bind('hist-next', () => stepHistory(1));
  bind('rotate-hint-dismiss', () => { rotateHintDismissed = true; updateRotateHint(); });
  window.addEventListener('orientationchange', updateRotateHint);
  window.addEventListener('resize', updateRotateHint);

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
    if (e.key === 'r' || e.key === 'R') reroll();
    else if (e.key === 'e' || e.key === 'E') cycleEngine(1);
    else if (e.key === 's' || e.key === 'S') downloadSVG(current.svg, current.meta);
    else if (e.key === 'ArrowLeft') stepHistory(-1);
    else if (e.key === 'ArrowRight') stepHistory(1);
    else return;
    e.preventDefault();
  });
}

/*
 * Optional AI parsing (see src/text/aiParser.js). The render is never
 * blocked on the network: the rule-based parse appears immediately,
 * and if Claude returns better grammar the same seed re-renders with
 * it — the diagram improves once the machine has had time to think.
 */
/* The operator's log, printed under the paste drawer: what the oracle
 * was asked, what arrived, what the gate declined. The line only
 * exists while a provider is set — otherwise the drawer stays silent. */
onOracle((evt) => {
  const el = document.getElementById('oracle-status');
  if (!el) return;
  const secs = evt.ms !== undefined ? ` (${(evt.ms / 1000).toFixed(0)}s)` : '';
  const line = evt.phase === 'asked' ? `the oracle is asked for the ${evt.task} of “${evt.word}”…`
    : evt.phase === 'received' ? `“${evt.word}” arrived${secs}`
    : evt.phase === 'declined' ? `“${evt.word}” declined${secs} — ${evt.detail}`
    : `“${evt.word}”: ${evt.detail}${secs}`;
  el.textContent = line;
  el.classList.add('on');
});

function upgradeParses() {
  if (!provider() || !state.userText.trim()) return;
  const sentences = state.userText.replace(/\s+/g, ' ').trim()
    .split(/(?<=[.!?])\s+/).filter((s) => s.split(' ').length >= 3);
  requestParses(sentences.slice(0, 8)).then((gained) => {
    if (gained && state.source === 'user') {
      show({ seed: state.seed, engineId: state.engine }, { push: false });
    }
  });
  /* and, Ollama only: ask for the poem's own subjects — silhouette
   * grids for transmission, width profiles for technopaegnia — from
   * the same candidates the engines derive, so the cache always has
   * what they will reach for */
  const rerender = (gained) => {
    if (gained && state.source === 'user') {
      show({ seed: state.seed, engineId: state.engine }, { push: false });
    }
  };
  const cands = shapeCandidates(state.userText, 3);
  requestShapes(cands).then(rerender);
  requestProfiles(cands).then(rerender);
}

/* ------------------------------------------------------------------ *
 * Boot.
 * ------------------------------------------------------------------ */

readURL();
wire();
const sourceRadio = document.querySelector(`input[name="source"][value="${state.source}"]`);
if (sourceRadio) sourceRadio.checked = true;
document.getElementById('user-text').classList.toggle('open', state.source === 'user');
show({ seed: state.seed || randomSeed(), engineId: state.engine });
if (state.source === 'user') upgradeParses();
