/*
 * tools/smoke.mjs — headless sanity for the engines. Run: node tools/smoke.mjs
 *
 * Installs a minimal DOM shim, renders every engine across several seeds
 * and every text-source mode, and asserts: (1) determinism — the same
 * seed serializes byte-identically twice; (2) hygiene — no NaN/undefined
 * leaks into attributes; (3) presence — the sheet actually holds marks.
 * Text metrics fall back to the built-in width tables here, so layouts
 * differ slightly from the browser, but the code paths are the same.
 */

/* ---------- DOM shim ---------- */

class VText {
  constructor(text) { this.nodeType = 3; this.data = String(text); }
  cloneNode() { return new VText(this.data); }
}

class VEl {
  constructor(name) {
    this.nodeType = 1;
    this.name = name;
    this.attrs = new Map();
    this.children = [];
  }
  setAttribute(k, v) { this.attrs.set(k, String(v)); }
  setAttributeNS(ns, k, v) { this.attrs.set(k, String(v)); }
  getAttribute(k) { return this.attrs.has(k) ? this.attrs.get(k) : null; }
  appendChild(c) { this.children.push(c); return c; }
  insertBefore(c, ref) {
    const i = this.children.indexOf(ref);
    if (i === -1) this.children.push(c); else this.children.splice(i, 0, c);
    return c;
  }
  set textContent(t) { this.children = [new VText(t)]; }
  cloneNode(deep) {
    const el = new VEl(this.name);
    for (const [k, v] of this.attrs) el.attrs.set(k, v);
    if (deep) el.children = this.children.map((c) => c.cloneNode(true));
    return el;
  }
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function serialize(node) {
  if (node.nodeType === 3) return esc(node.data);
  const attrs = [...node.attrs].map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  const inner = node.children.map(serialize).join('');
  return `<${node.name}${attrs}>${inner}</${node.name}>`;
}

globalThis.document = {
  createElementNS: (ns, name) => new VEl(name),
  createElement: (name) => {
    const el = new VEl(name);
    el.getContext = () => null; // typography falls back to metric tables
    return el;
  },
  createTextNode: (t) => new VText(t),
};

/* ---------- render pipeline (mirrors main.js without UI) ---------- */

const { TYPE_PAIRINGS } = await import('../src/typography.js');
const { ENGINES } = await import('../src/engines/index.js');

const { renderPoem } = await import('../src/render.js');
const pinned = TYPE_PAIRINGS.find((p) => p.id === 'baskerville') || TYPE_PAIRINGS[0];

/* the same render the page uses, serialized through the shim */
function render(seed, engine, mode = 'corpus', userText = '', hybrid = false, pairing = null, entropy = 0.5) {
  const r = renderPoem({
    seed, engineId: engine.id, source: mode, userText, entropy,
    paperMode: 'auto', typeId: (pairing || pinned).id, hybrid,
  });
  return { xml: serialize(r.svg), colophon: r.meta.colophon, title: r.meta.title };
}

/* ---------- checks ---------- */

const seeds = ['8f3a21c9', 'deadbeef', '00000001', 'cafe1234', '7b9d0e2f', 'a1b2c3d4'];
const userText = 'The photocopier hums in the empty office and nobody remembers why the light was left on.';
let failures = 0;

for (const engine of ENGINES) {
  for (const seed of seeds) {
    for (const mode of ['corpus', 'procedural', 'user']) {
      const label = `${engine.id} / ${seed} / ${mode}`;
      try {
        const a = render(seed, engine, mode, userText);
        const b = render(seed, engine, mode, userText);
        if (a.xml !== b.xml) { console.error(`FAIL determinism: ${label}`); failures++; continue; }
        if (/NaN|undefined/.test(a.xml)) {
          console.error(`FAIL hygiene (NaN/undefined): ${label}`);
          console.error('   ...' + a.xml.match(/.{0,80}(NaN|undefined).{0,80}/)[0]);
          failures++; continue;
        }
        const marks = (a.xml.match(/<(text|path|line|rect|circle)\b/g) || []).length;
        if (marks < 3) { console.error(`FAIL presence (${marks} marks): ${label}`); failures++; continue; }
        if (!/after .*\(|after .*\d{4}|via /.test(a.colophon)) {
          console.error(`FAIL colophon lineage: ${label} -> ${a.colophon}`); failures++; continue;
        }
      } catch (err) {
        console.error(`FAIL exception: ${label}`);
        console.error('  ', err.stack.split('\n').slice(0, 4).join('\n   '));
        failures++;
      }
    }
  }
  console.log(`ok  ${engine.id} (${seeds.length} seeds × 3 modes)`);
}

// both ends of the slider render clean, for every engine
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
console.log('ok  entropy ends (0 and 1) render clean');

// the slider must move these four; they ignored it through the first edition
const ENTROPY_ENGINES = ['diagram', 'revisedPhilosophy', 'gloss', 'technopaegnia'];
for (const id of ENTROPY_ENGINES) {
  const engine = ENGINES.find((x) => x.id === id);
  for (const seed of seeds.slice(0, 4)) {
    const lo = render(seed, engine, 'corpus', '', false, null, 0).xml;
    const hi = render(seed, engine, 'corpus', '', false, null, 1).xml;
    if (lo === hi) { console.error(`FAIL entropy-insensitive: ${id}/${seed}`); failures++; }
  }
}
console.log(`ok  entropy moves ${ENTROPY_ENGINES.length} once-deaf engines`);

// typestract at low entropy is figures on white: 2–30 % of the grid struck
{
  const engine = ENGINES.find((x) => x.id === 'typestract');
  for (const seed of seeds) {
    const xml = render(seed, engine, 'corpus', '', false, null, 0.2).xml;
    const gm = xml.match(/data-grid="(\d+)x(\d+)"/);
    const cells = gm ? Number(gm[1]) * Number(gm[2]) : 0;
    const struck = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
      .reduce((n, m) => n + m[1].replace(/\s/g, '').length, 0);
    const ratio = cells ? struck / cells : -1;
    if (ratio < 0.02 || ratio > 0.30) { console.error(`FAIL typestract coverage ${ratio.toFixed(3)}: ${seed}`); failures++; }
  }
  console.log('ok  typestract coverage (figures on white)');
}

// forced hybrid across seeds (engines may or may not pair; must not throw)
for (const engine of ENGINES) {
  for (const seed of seeds.slice(0, 3)) {
    try {
      render(seed, engine, 'corpus', '', true);
    } catch (err) {
      console.error(`FAIL hybrid exception: ${engine.id}/${seed}`);
      console.error('  ', err.stack.split('\n').slice(0, 4).join('\n   '));
      failures++;
    }
  }
}
console.log(`ok  hybrid pass`);

// every type pairing renders deterministically
for (const pairing of TYPE_PAIRINGS) {
  for (const engine of ENGINES.slice(0, 3)) {
    const a = render('8f3a21c9', engine, 'corpus', '', false, pairing);
    const b = render('8f3a21c9', engine, 'corpus', '', false, pairing);
    if (a.xml !== b.xml) { console.error(`FAIL pairing determinism: ${pairing.id}/${engine.id}`); failures++; }
    if (/NaN|undefined/.test(a.xml)) { console.error(`FAIL pairing hygiene: ${pairing.id}/${engine.id}`); failures++; }
  }
}
console.log(`ok  type pairings (${TYPE_PAIRINGS.length})`);

// the shelf: every family a pairing names has @font-face rules, and every
// rule's file is on disk (a pairing that names a missing face renders in
// the stand-ins while the colophon claims otherwise)
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const fontsDir = new URL('../fonts/', import.meta.url).pathname;
  const css = fs.readFileSync(path.join(fontsDir, 'fonts.css'), 'utf8');
  const families = new Set([...css.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1]));
  for (const pairing of TYPE_PAIRINGS) {
    for (const family of pairing.families) {
      if (!families.has(family)) { console.error(`FAIL fonts: ${pairing.id} names ${family}, which fonts.css lacks`); failures++; }
    }
  }
  let files = 0;
  for (const [, file] of css.matchAll(/url\(([^)]+)\)/g)) {
    files++;
    if (!fs.existsSync(path.join(fontsDir, file))) { console.error(`FAIL fonts: ${file} is not on the shelf`); failures++; }
  }
  console.log(`ok  fonts (${families.size} families, ${files} files, ${TYPE_PAIRINGS.length} pairings)`);
}

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll checks passed.');
