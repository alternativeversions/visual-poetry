/*
 * aiParser.js — the constitutional amendment: optional, runtime,
 * machine parsing for pasted text.
 *
 * The site's constitution holds: zero dependencies, no build step,
 * works offline, and every render is a pure function of its seed.
 * This module bends none of that by default, because by default it is
 * inert. Point it at a machine — a local one,
 *
 *   localStorage.setItem('typestract-ai', 'ollama')   // localhost:11434
 *
 * (start Ollama with OLLAMA_ORIGINS allowing this page's origin), or
 * a remote one via an Anthropic API key —
 *
 *   localStorage.setItem('typestract-anthropic-key', 'sk-ant-...')
 *
 * — and user-pasted sentences are parsed by the model into the same
 * clause shape parser.js produces, the results are cached in memory
 * and localStorage (so a given sentence keeps the same diagram, and
 * re-renders of a seed stay byte-stable once the cache is warm), and
 * the grammar engine's footnote discloses the parser honestly. No
 * key, no network: the rule-based parser does the work, as before.
 * Corpus sentences never touch the network — their parses were
 * authored by hand at build time.
 */

const KEY_NAME = 'typestract-anthropic-key';
const PROVIDER_NAME = 'typestract-ai'; // 'ollama' | 'anthropic' | unset
const OLLAMA_MODEL_NAME = 'typestract-ollama-model';
const CACHE_NAME = 'typestract-parse-cache-v1';
const SHAPE_CACHE_NAME = 'typestract-shape-cache-v1';
const MODEL = 'claude-haiku-4-5-20251001';
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'qwen3:30b-a3b';

const PROFILE_CACHE_NAME = 'typestract-profile-cache-v1';

const inBrowser = typeof window !== 'undefined';

const cache = new Map();
const shapeCache = new Map();
const profileCache = new Map();
const shapeFailed = new Set(); // this session's refusals — don't re-ask
const profileFailed = new Set();
try {
  if (inBrowser) {
    const stored = JSON.parse(localStorage.getItem(CACHE_NAME) || '{}');
    for (const [k, v] of Object.entries(stored)) cache.set(k, v);
    const shapes = JSON.parse(localStorage.getItem(SHAPE_CACHE_NAME) || '{}');
    for (const [k, v] of Object.entries(shapes)) shapeCache.set(k, v);
    const profiles = JSON.parse(localStorage.getItem(PROFILE_CACHE_NAME) || '{}');
    for (const [k, v] of Object.entries(profiles)) profileCache.set(k, v);
  }
} catch { /* no localStorage or corrupt cache */ }

const norm = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

/* ------------------------------------------------------------------ *
 * The operator's log. Every request reports its life — asked,
 * received, declined (the gate said no), failed (no answer) — to the
 * console and to any listener (main.js prints it under the paste
 * drawer). Silent unless a provider is set, like everything here.
 * ------------------------------------------------------------------ */

const oracleListeners = new Set();

/** Subscribe to oracle events: fn({task, word, phase, ms, detail}). */
export function onOracle(fn) {
  oracleListeners.add(fn);
  return () => oracleListeners.delete(fn);
}

function report(task, word, phase, ms, detail) {
  const evt = { task, word, phase, ms, detail };
  try {
    console.info(`typestract oracle · ${task} “${word}” ${phase}`
      + (ms !== undefined ? ` in ${(ms / 1000).toFixed(1)}s` : '')
      + (detail ? ` — ${detail}` : ''));
  } catch { /* no console */ }
  for (const fn of oracleListeners) {
    try { fn(evt); } catch { /* a listener's error is its own */ }
  }
}

const failureDetail = (e, res) => (
  res && !res.ok ? `http ${res.status}`
    : e && e.name === 'TimeoutError' ? 'timed out — server busy?'
      : 'no answer'
);

/** Which machine does the grammar: 'ollama', 'anthropic', or null. */
export function provider() {
  try {
    if (!inBrowser) return null;
    const p = localStorage.getItem(PROVIDER_NAME);
    if (p === 'ollama' || p === 'anthropic') return p;
    return localStorage.getItem(KEY_NAME) ? 'anthropic' : null;
  } catch { return null; }
}

/** Synchronous cache lookup — engines stay pure functions. */
export function cachedParse(text) {
  return cache.get(norm(text)) || null;
}

function persist() {
  try {
    if (inBrowser) localStorage.setItem(CACHE_NAME, JSON.stringify(Object.fromEntries(cache)));
  } catch { /* storage full; memory cache still works */ }
}

/** Minimal shape check so a confused model can't crash a render. */
function validUnit(u) {
  return u && typeof u.w === 'string' && u.w.length > 0 &&
    (u.m === undefined || (Array.isArray(u.m) && u.m.every((m) =>
      validUnit(m) && (m.obj === undefined || validUnit(m.obj)))));
}
function validClause(c) {
  return c && validUnit(c.subj) && validUnit(c.verb) &&
    (c.post === undefined || c.post === null || validUnit(c.post)) &&
    (c.post2 === undefined || c.post2 === null || validUnit(c.post2));
}

const PROMPT = `Parse the sentence into a Reed–Kellogg diagram structure. Reply with ONLY a JSON object, no prose:
{"subj":UNIT,"verb":UNIT,"div":"|"or"\\\\","post":UNIT,"div2":"\\\\","post2":UNIT}
UNIT = {"w":"headword","m":[MOD,...]} — "m" optional.
MOD = {"w":"the"} for articles/adjectives/adverbs, or {"w":"of","obj":UNIT} for a preposition with its object.
"div" is "|" before a direct object, "\\\\" before a subject complement; omit "post" if the verb is intransitive. Use "post2" only for an objective complement (Call me | Ishmael \\\\ ...). Keep aux+verb together in verb.w ("is charged", "cannot hold"). Use "(you)" as subj.w for imperatives; restore declarative order for questions. Do not invent words not in the sentence (except "(you)" and elliptical "(is)").
Sentence: `;

/*
 * Ollama's qwen3-family templates open a `<think>` block for the
 * assistant's turn unconditionally — `think:false` never reaches the
 * prompt. Under `format:'json'` the grammar then forbids `</think>`
 * forever: the model answers from inside an unclosed thought, degraded
 * and unbounded (measured on qwen3:4b — open block: mangled keys;
 * closed block: clean JSON in a second). So for thinking-family models
 * we prefill the assistant turn with a closed, empty think block — the
 * template renders a trailing assistant message as a continuation —
 * and we cap generation, so a wedged model costs tokens, not minutes.
 */
const THINK_FAMILY = /qwen3|qwq|deepseek-r1/i;

function ollamaBody(model, prompt, numPredict = 700) {
  const messages = [{ role: 'user', content: prompt }];
  const thinker = THINK_FAMILY.test(model);
  if (thinker) messages.push({ role: 'assistant', content: '<think>\n\n</think>\n\n' });
  return {
    model,
    stream: false,
    format: 'json',
    ...(thinker ? { think: false } : {}),
    options: { temperature: 0, seed: 1877, num_predict: numPredict },
    messages,
  };
}

/**
 * Fetch parses for any uncached sentences. Returns true if the cache
 * gained entries (the caller may re-render). Never throws.
 */
export async function requestParses(sentences) {
  const which = provider();
  if (!which) return false;
  let apiKey = null;
  let ollamaModel = OLLAMA_MODEL;
  try {
    apiKey = localStorage.getItem(KEY_NAME);
    ollamaModel = localStorage.getItem(OLLAMA_MODEL_NAME) || OLLAMA_MODEL;
  } catch { /* no storage */ }
  if (which === 'anthropic' && !apiKey) return false;
  let gained = false;
  for (const text of sentences) {
    const key = norm(text);
    if (!key || cache.has(key)) continue;
    const label = text.split(/\s+/).slice(0, 4).join(' ') + '…';
    const t0 = Date.now();
    let res;
    try {
      report('parse', label, 'asked');
      /* a slow local model must never wedge the page: give up per
       * sentence after 90s and let the rule parser stand */
      const abort = AbortSignal.timeout(which === 'ollama' ? 90000 : 30000);
      if (which === 'ollama') {
        /* local, private, free — and seeded, so the model itself is a
         * pure function on this machine (1877: Reed & Kellogg's year) */
        res = await fetch(OLLAMA_URL, {
          method: 'POST',
          signal: abort,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(ollamaBody(ollamaModel, PROMPT + text)),
        });
      } else {
        res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: abort,
          headers: {
            'content-type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 600,
            messages: [{ role: 'user', content: PROMPT + text }],
          }),
        });
      }
      if (!res.ok) { report('parse', label, 'failed', Date.now() - t0, failureDetail(null, res)); continue; }
      const data = await res.json();
      const rawText = which === 'ollama'
        ? (data.message && data.message.content) || ''
        : (data.content && data.content[0] && data.content[0].text) || '';
      const raw = rawText.replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      const clause = JSON.parse(raw);
      if (validClause(clause)) {
        clause.ai = which;
        cache.set(key, clause);
        gained = true;
        report('parse', label, 'received', Date.now() - t0);
      } else {
        report('parse', label, 'declined', Date.now() - t0, 'not a clause');
      }
    } catch (e) { /* server down, bad key, or bad JSON — the rule parser stands in */
      report('parse', label, 'failed', Date.now() - t0, failureDetail(e, res));
    }
  }
  if (gained) persist();
  return gained;
}

/* ------------------------------------------------------------------ *
 * The shape oracle — a second amendment task, Ollama only: ask the
 * local model for the silhouette of a word, so transmission can
 * receive the pasted poem's own subject. Measured fact (qwen3:4b and
 * 30b-a3b alike): these models cannot paint a pixel grid — asked for
 * digit rows they emit blank paper — but they compose geometry
 * fluently. So the model answers in rectangles, discs and lines, and
 * this module rasterizes them onto the same 24×16 ink grid the
 * hand-authored tapes use (subjects.js). The model composes; the
 * machine merely develops the picture.
 * ------------------------------------------------------------------ */

const SHAPE_W = 24;
const SHAPE_H = 16;

const shapePrompt = (word) => `You compose tiny pictures for a 1960s teletype on a ${SHAPE_W}-wide, ${SHAPE_H}-tall pixel grid (x 0-${SHAPE_W - 1} left to right, y 0-${SHAPE_H - 1} top to bottom).
A picture is a JSON object {"parts":[...]} where each part is one of:
{"kind":"rect","x":int,"y":int,"w":int,"h":int,"ink":int}
{"kind":"disc","cx":int,"cy":int,"r":int,"ink":int}
{"kind":"line","x1":int,"y1":int,"x2":int,"y2":int,"ink":int}
ink is 9 for the solid body, 2-5 for ground or shadow. Later parts paint over earlier ones; ink 0 cuts holes.
Example — an umbrella: {"parts":[{"kind":"disc","cx":11,"cy":6,"r":9,"ink":9},{"kind":"rect","x":2,"y":7,"w":20,"h":9,"ink":0},{"kind":"rect","x":11,"y":6,"w":2,"h":8,"ink":9},{"kind":"line","x1":11,"y1":14,"x2":14,"y2":14,"ink":9}]}
Now compose the silhouette of: ${word} — one bold, simple, recognizable ${word}, 4 to 10 parts, its widest part spanning most of the grid. Reply with ONLY the JSON object.`;

/** Paint the model's parts onto a fresh grid; malformed parts are inert. */
function rasterizeParts(parts) {
  const grid = Array.from({ length: SHAPE_H }, () => Array(SHAPE_W).fill(0));
  const put = (x, y, ink) => {
    if (x >= 0 && x < SHAPE_W && y >= 0 && y < SHAPE_H) grid[y][x] = Math.max(0, Math.min(9, Math.round(ink)));
  };
  if (!Array.isArray(parts)) return null;
  for (const p of parts) {
    if (!p || typeof p !== 'object') continue;
    const ink = Number(p.ink ?? 9);
    if (Number.isNaN(ink)) continue;
    if (p.kind === 'rect') {
      for (let y = p.y; y < p.y + p.h; y++) for (let x = p.x; x < p.x + p.w; x++) put(x, y, ink);
    } else if (p.kind === 'disc') {
      for (let y = 0; y < SHAPE_H; y++) {
        for (let x = 0; x < SHAPE_W; x++) {
          if (Math.hypot(x - p.cx, y - p.cy) <= p.r + 0.2) put(x, y, ink);
        }
      }
    } else if (p.kind === 'line') {
      const n = Math.max(Math.abs(p.x2 - p.x1), Math.abs(p.y2 - p.y1), 1);
      if (Number.isNaN(n)) continue;
      for (let i = 0; i <= n; i++) {
        put(Math.round(p.x1 + (p.x2 - p.x1) * (i / n)), Math.round(p.y1 + (p.y2 - p.y1) * (i / n)), ink);
      }
    }
  }
  return grid.map((row) => row.join(''));
}

/**
 * Concrete-noun candidates from pasted text, deterministically: words
 * that follow a determiner (poetry's nouns mostly do), then any plain
 * word, first-seen order, up to `max`. Pure — engines and main.js must
 * agree on it without sharing state.
 */
export function shapeCandidates(text, max = 3) {
  const STOP = new Set(('and but or nor with from into over under then than when where while have has had was were are is be been not you she her him his they them their our your its it of in on at to for as by we he who what all one some any each very most more also just only so do does did will would can could shall should may might must upon after before about against between through during again once here there why how both few other such no too own same down out off up').split(' '));
  const raw = text.toLowerCase().split(/\s+/)
    .map((w) => w.replace(/[^\p{L}'-]/gu, ''))
    .filter(Boolean);
  const DET = new Set(['the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their']);
  const out = [];
  const take = (w) => {
    if (w.length >= 3 && w.length <= 12 && !STOP.has(w) && !DET.has(w) && !out.includes(w)) out.push(w);
  };
  for (let i = 1; i < raw.length && out.length < max; i++) {
    if (DET.has(raw[i - 1])) take(raw[i]);
  }
  for (let i = 0; i < raw.length && out.length < max; i++) {
    if (raw[i].length >= 4) take(raw[i]);
  }
  return out;
}

/**
 * Shape sanity: digits only, real contrast, one coherent dark body —
 * not a scatter, not a solid slab. Returns 16 normalized row strings,
 * or null (the hand-authored tapes stand in).
 */
function validShape(rows) {
  if (!Array.isArray(rows) || rows.length < SHAPE_H - 3 || rows.length > SHAPE_H + 3) return null;
  const norm = [];
  for (let y = 0; y < SHAPE_H; y++) {
    let r = String(rows[y] ?? '');
    if (/[^0-9]/.test(r)) return null;
    if (r.length > SHAPE_W) r = r.slice(0, SHAPE_W);
    norm.push(r.padEnd(SHAPE_W, '0'));
  }
  const d = (x, y) => Number(norm[y][x]);
  let dark = 0;
  let light = 0;
  let max = 0;
  let x0 = SHAPE_W, x1 = -1, y0 = SHAPE_H, y1 = -1;
  for (let y = 0; y < SHAPE_H; y++) {
    for (let x = 0; x < SHAPE_W; x++) {
      const v = d(x, y);
      max = Math.max(max, v);
      if (v >= 6) {
        dark++;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x);
        y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      } else if (v <= 1) light++;
    }
  }
  const cells = SHAPE_W * SHAPE_H;
  if (max < 7 || dark < cells * 0.04 || dark > cells * 0.6 || light < cells * 0.25) return null;
  /* one body: the largest connected dark region owns most of the ink */
  const seen = new Set();
  let best = 0;
  for (let y = 0; y < SHAPE_H; y++) {
    for (let x = 0; x < SHAPE_W; x++) {
      if (d(x, y) < 6 || seen.has(y * SHAPE_W + x)) continue;
      let size = 0;
      const stack = [[x, y]];
      seen.add(y * SHAPE_W + x);
      while (stack.length) {
        const [cx, cy] = stack.pop();
        size++;
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (nx < 0 || ny < 0 || nx >= SHAPE_W || ny >= SHAPE_H) continue;
          const k = ny * SHAPE_W + nx;
          if (!seen.has(k) && d(nx, ny) >= 6) { seen.add(k); stack.push([nx, ny]); }
        }
      }
      best = Math.max(best, size);
    }
  }
  if (best < Math.max(10, dark * 0.5)) return null;
  /* a silhouette, not a slab: ink must not fill its own bounding box */
  if (dark / ((x1 - x0 + 1) * (y1 - y0 + 1)) > 0.92) return null;
  return norm;
}

/** Synchronous shape lookup — engines stay pure functions. */
export function cachedShape(word) {
  return shapeCache.get(String(word).toLowerCase()) || null;
}

function persistShapes() {
  try {
    if (inBrowser) localStorage.setItem(SHAPE_CACHE_NAME, JSON.stringify(Object.fromEntries(shapeCache)));
  } catch { /* storage full; memory cache still works */ }
}

/**
 * Ask the local model to draw any uncached words. Returns true if the
 * cache gained shapes (the caller may re-render). Never throws.
 * Ollama only: silhouettes are drawn by a local model or not at all.
 */
export async function requestShapes(words) {
  if (provider() !== 'ollama') return false;
  let ollamaModel = OLLAMA_MODEL;
  try { ollamaModel = localStorage.getItem(OLLAMA_MODEL_NAME) || OLLAMA_MODEL; } catch { /* no storage */ }
  let gained = false;
  for (const word of words) {
    const key = String(word).toLowerCase();
    if (!key || shapeCache.has(key) || shapeFailed.has(key)) continue;
    const t0 = Date.now();
    let res;
    try {
      report('silhouette', key, 'asked');
      /* drawing is slower than parsing; still, never wedge the page */
      res = await fetch(OLLAMA_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(120000),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ollamaBody(ollamaModel, shapePrompt(word), 900)),
      });
      if (!res.ok) { report('silhouette', key, 'failed', Date.now() - t0, failureDetail(null, res)); continue; }
      const data = await res.json();
      const rawText = (data.message && data.message.content) || '';
      const obj = JSON.parse(rawText.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      const rows = validShape(rasterizeParts(obj.parts));
      if (rows) {
        shapeCache.set(key, rows);
        gained = true;
        report('silhouette', key, 'received', Date.now() - t0);
      } else {
        shapeFailed.add(key); // it drew badly; don't ask again this session
        report('silhouette', key, 'declined', Date.now() - t0, 'drawn badly — a tape stands in');
      }
    } catch (e) { /* server down or busy — the hand-authored tapes stand in */
      report('silhouette', key, 'failed', Date.now() - t0, failureDetail(e, res));
    }
  }
  if (gained) persistShapes();
  return gained;
}

/* ------------------------------------------------------------------ *
 * The profile oracle — a third amendment task, Ollama only: the width
 * of a word's silhouette, top to bottom, as ~20 floats in 0.05..1, so
 * technopaegnia can pour a pattern poem into the shape of its own
 * subject. One dimension suits these models: they cannot paint pixels
 * but they state widths readily.
 * ------------------------------------------------------------------ */

const PROFILE_N = 20;
/* the two worked examples in the prompt — a lazy model echoes one back
 * verbatim, and an echo is not a reading of the word */
const PROFILE_EXAMPLES = [
  [0.85, 0.95, 0.9, 0.75, 0.5, 0.25, 0.12, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.12, 0.15, 0.2, 0.35, 0.6, 0.85, 0.95],
  [0.08, 0.15, 0.25, 0.2, 0.35, 0.5, 0.4, 0.6, 0.75, 0.65, 0.85, 0.95, 1.0, 0.9, 0.12, 0.1, 0.1, 0.1, 0.3, 0.4],
];

const profilePrompt = (word) => `A pattern poem pours its text into a silhouette: one centered line of type per level, ${PROFILE_N} levels from top to bottom, each level's width set by a number.
Reply with ONLY a JSON object {"widths":[...]} — exactly ${PROFILE_N} numbers from 0.05 to 1.0: the relative width of the silhouette of ${word} at each level. The first number is the very top of ${word}, the last is the ground it stands on.
Example — a wineglass (bowl at top, thin stem, flared foot):
{"widths":${JSON.stringify(PROFILE_EXAMPLES[0])}}
Example — a spruce tree (narrow tip at top, boughs widening downward, bare trunk at the ground):
{"widths":${JSON.stringify(PROFILE_EXAMPLES[1])}}
Now: the silhouette of ${word}. Think about where ${word} is wide and where it is narrow, then make it bold and recognizable, varying strongly.`;

/**
 * Profile sanity: numbers that actually vary and are not an echo of a
 * worked example. Returns exactly PROFILE_N floats in 0.05..1, or null.
 */
function validProfile(widths) {
  if (!Array.isArray(widths) || widths.length < 12 || widths.length > 32) return null;
  const raw = widths.map(Number);
  if (raw.some((v) => Number.isNaN(v))) return null;
  /* resample to PROFILE_N and clamp */
  const out = [];
  for (let i = 0; i < PROFILE_N; i++) {
    const t = (i / (PROFILE_N - 1)) * (raw.length - 1);
    const a = Math.floor(t);
    const v = raw[a] + (raw[Math.min(a + 1, raw.length - 1)] - raw[a]) * (t - a);
    out.push(Math.max(0.05, Math.min(1, Math.round(v * 100) / 100)));
  }
  if (Math.max(...out) - Math.min(...out) < 0.4) return null; // too timid
  for (const ex of PROFILE_EXAMPLES) {
    let diff = 0;
    for (let i = 0; i < PROFILE_N; i++) diff += Math.abs(out[i] - ex[i]);
    if (diff / PROFILE_N < 0.06) return null; // an echo, not a reading
  }
  return out;
}

/** Synchronous profile lookup — engines stay pure functions. */
export function cachedProfile(word) {
  return profileCache.get(String(word).toLowerCase()) || null;
}

function persistProfiles() {
  try {
    if (inBrowser) localStorage.setItem(PROFILE_CACHE_NAME, JSON.stringify(Object.fromEntries(profileCache)));
  } catch { /* storage full; memory cache still works */ }
}

/**
 * Ask the local model for any uncached width profiles. Returns true if
 * the cache gained profiles (the caller may re-render). Never throws.
 */
export async function requestProfiles(words) {
  if (provider() !== 'ollama') return false;
  let ollamaModel = OLLAMA_MODEL;
  try { ollamaModel = localStorage.getItem(OLLAMA_MODEL_NAME) || OLLAMA_MODEL; } catch { /* no storage */ }
  let gained = false;
  for (const word of words) {
    const key = String(word).toLowerCase();
    if (!key || profileCache.has(key) || profileFailed.has(key)) continue;
    const t0 = Date.now();
    let res;
    try {
      report('profile', key, 'asked');
      /* measured on a shared server: the 30b answers in 60-80s when
       * another project holds the slot — give it the same 120s */
      res = await fetch(OLLAMA_URL, {
        method: 'POST',
        signal: AbortSignal.timeout(120000),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ollamaBody(ollamaModel, profilePrompt(word), 400)),
      });
      if (!res.ok) { report('profile', key, 'failed', Date.now() - t0, failureDetail(null, res)); continue; }
      const data = await res.json();
      const rawText = (data.message && data.message.content) || '';
      const obj = JSON.parse(rawText.replace(/^[^{]*/, '').replace(/[^}]*$/, ''));
      const widths = validProfile(obj.widths);
      if (widths) {
        profileCache.set(key, widths);
        gained = true;
        report('profile', key, 'received', Date.now() - t0);
      } else {
        profileFailed.add(key);
        report('profile', key, 'declined', Date.now() - t0, 'too timid or an echo');
      }
    } catch (e) { /* server down or busy — the classical shapes stand in */
      report('profile', key, 'failed', Date.now() - t0, failureDetail(e, res));
    }
  }
  if (gained) persistProfiles();
  return gained;
}

/* internals, exported for tools/oracle.mjs — the command-line probe
 * exercises the very prompts, request bodies and gates the site uses */
export { shapePrompt, profilePrompt, rasterizeParts, validShape, validProfile, ollamaBody, OLLAMA_MODEL };
