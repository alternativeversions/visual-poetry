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

const { makeRng } = await import('../src/prng.js');
const { choosePalette } = await import('../src/palette.js');
const { makeSheet, TYPE_PAIRINGS, setFonts } = await import('../src/typography.js');
const { resetIds, el } = await import('../src/svg.js');
const { makeTextSource } = await import('../src/text/procedures.js');
const { ENGINES, sheetSizeFor, pickHybrid } = await import('../src/engines/index.js');
const { buildColophon } = await import('../src/colophon.js');

function render(seed, engine, mode = 'corpus', userText = '', hybrid = false, pairing = null) {
  resetIds();
  setFonts(pairing || TYPE_PAIRINGS.find((p) => p.id === 'baskerville') || TYPE_PAIRINGS[0]);
  const hybridWith = pickHybrid(makeRng(seed + ':hybrid'), engine, hybrid);
  const palette = choosePalette(makeRng(seed + ':palette'), engine.paletteOpts || {});
  const size = sheetSizeFor(engine);
  const sheet = makeSheet({
    width: size.width, height: size.height, palette,
    entropy: 0.5, material: hybridWith ? hybridWith.id : null,
    marginRatio: engine.marginRatio || 0.09,
  });
  const source = makeTextSource(makeRng(seed + ':text'), { mode, userText });
  const result = engine.generate(makeRng(seed + ':gen:' + engine.id), source, sheet);
  const svg = el('svg', { viewBox: `0 0 ${sheet.width} ${sheet.height}` });
  svg.appendChild(el('rect', { x: 0, y: 0, width: sheet.width, height: sheet.height, fill: palette.paper }));
  for (const n of result.nodes) svg.appendChild(n);
  const colophon = buildColophon({
    engineId: engine.id, engineName: engine.name, seed,
    attribution: result.attribution,
    hybridWith: hybridWith ? { id: hybridWith.id, name: hybridWith.name } : null,
    caption: result.caption || null,
  });
  return { xml: serialize(svg), colophon, title: result.title };
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

if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll checks passed.');
