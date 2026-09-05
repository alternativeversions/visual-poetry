/*
 * export.js — SVG serialization and PNG rasterization.
 *
 * Exports are real vector: <text> stays text (not outlined), paths stay
 * paths. Width/height are given in mm so print software opens the sheet
 * at a sensible physical size (900 px ≙ 190 mm wide).
 *
 * The faces travel with the export. The site ships its type (fonts/),
 * and an SVG opened elsewhere — a browser, a slide, a rasterizer — would
 * otherwise fall to whatever is installed. So every export carries, in
 * a <style> of @font-face rules with data: URIs, exactly the faces its
 * text uses: a sheet in one serif and its italic carries those files,
 * not the shelf. Illustrator and Inkscape ignore the rule and use the
 * installed face of the same name; the text stays live either way.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';
const MM_PER_PX = 190 / 900;

/* ------------------------------------------------------------------ *
 * The faces a sheet uses, and the rules that carry them.
 * ------------------------------------------------------------------ */

const unquote = (s) => String(s || '').replace(/["']/g, '').trim();
const firstFamily = (stack) => unquote(String(stack || '').split(',')[0]);
const numericWeight = (w) => (w === 'bold' ? 700 : w === 'normal' || !w ? 400 : Number(w) || 400);

/** Every (family, style, weight) set on the sheet's text, nearest-ancestor
 * attributes resolved the way the renderer resolves them. */
function fontUses(svgNode) {
  const uses = new Map();
  const attr = (node, name) => {
    for (let n = node; n && n.getAttribute; n = n.parentNode) {
      const v = n.getAttribute(name);
      if (v) return v;
    }
    return null;
  };
  svgNode.querySelectorAll('text, tspan, textPath').forEach((node) => {
    const family = firstFamily(attr(node, 'font-family'));
    if (!family) return;
    const style = attr(node, 'font-style') || 'normal';
    const weight = numericWeight(attr(node, 'font-weight'));
    uses.set(`${family}|${style}|${weight}`, { family, style, weight });
  });
  return [...uses.values()];
}

/** The document's @font-face rules, read once per export. */
function fontFaceRules() {
  const rules = [];
  for (const sheet of document.styleSheets) {
    let list;
    try { list = sheet.cssRules; } catch { continue; } // a cross-origin sheet; not ours
    for (const rule of list) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const weight = rule.style.getPropertyValue('font-weight') || '400';
      const [lo, hi] = weight.split(/\s+/).map(Number);
      const src = rule.style.getPropertyValue('src');
      const m = src && src.match(/url\(\s*["']?([^"')]+)["']?\s*\)/);
      if (!m) continue;
      rules.push({
        family: unquote(rule.style.getPropertyValue('font-family')),
        style: rule.style.getPropertyValue('font-style') || 'normal',
        weight,
        lo,
        hi: Number.isFinite(hi) ? hi : lo,
        range: rule.style.getPropertyValue('unicode-range'),
        url: new URL(m[1], sheet.href || document.baseURI).href,
      });
    }
  }
  return rules;
}

/** The rules that best serve a use: exact style and a weight in range
 * when the family has them, else what it has — the browser synthesizes
 * the rest, as it does on the sheet. */
function rulesFor(use, rules) {
  const family = rules.filter((r) => r.family === use.family);
  if (!family.length) return [];
  const styled = family.filter((r) => r.style === use.style);
  const pool = styled.length ? styled : family.filter((r) => r.style === 'normal');
  const inRange = pool.filter((r) => use.weight >= r.lo && use.weight <= r.hi);
  if (inRange.length) return inRange;
  // nearest weight, every subset of it
  const nearest = pool.reduce((best, r) => {
    const d = Math.min(Math.abs(use.weight - r.lo), Math.abs(use.weight - r.hi));
    return !best || d < best.d ? { d, weight: r.weight } : best;
  }, null);
  return nearest ? pool.filter((r) => r.weight === nearest.weight) : [];
}

const faceData = new Map(); // url → data: URI, fetched once per session

async function dataUri(url) {
  if (!faceData.has(url)) {
    faceData.set(url, (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    })().catch((err) => { faceData.delete(url); throw err; }));
  }
  return faceData.get(url);
}

/**
 * The @font-face rules for the faces the sheet uses, sources inlined.
 * Resolves to '' when nothing on the sheet is on the shelf (the
 * stand-ins were used) or the files cannot be read (file://) — the
 * export then names its faces and leaves the reader to supply them.
 */
export async function fontsCssFor(svgNode) {
  let rules;
  try { rules = fontFaceRules(); } catch { return ''; }
  const chosen = new Map();
  for (const use of fontUses(svgNode)) {
    for (const rule of rulesFor(use, rules)) chosen.set(rule.url + rule.range, rule);
  }
  const out = [];
  for (const rule of chosen.values()) {
    let data;
    try { data = await dataUri(rule.url); } catch { continue; }
    out.push(
      `@font-face{font-family:'${rule.family}';font-style:${rule.style};font-weight:${rule.weight};` +
      (rule.range ? `unicode-range:${rule.range};` : '') +
      `src:url(${data}) format('woff2')}`
    );
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Serialization.
 * ------------------------------------------------------------------ */

/**
 * Serialize the poem SVG with metadata. Clones the node; injects
 * xmlns, mm dimensions, <title> and <desc> (the full colophon), and,
 * when given, a <style> carrying the faces.
 */
export function serializeSVG(svgNode, meta = {}, { fontsCss = '' } = {}) {
  const clone = svgNode.cloneNode(true);
  clone.setAttribute('xmlns', SVG_NS);
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  const vb = (clone.getAttribute('viewBox') || '0 0 900 1200').split(/\s+/).map(Number);
  clone.setAttribute('width', `${Math.round(vb[2] * MM_PER_PX)}mm`);
  clone.setAttribute('height', `${Math.round(vb[3] * MM_PER_PX)}mm`);

  // <title> and <desc> must be first children; the faces follow them
  if (fontsCss) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('type', 'text/css');
    style.textContent = fontsCss;
    clone.insertBefore(style, clone.firstChild);
  }
  const desc = document.createElementNS(SVG_NS, 'desc');
  desc.textContent = meta.colophon || '';
  clone.insertBefore(desc, clone.firstChild);
  const title = document.createElementNS(SVG_NS, 'title');
  title.textContent = meta.title || 'typestract';
  clone.insertBefore(title, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
}

/** serializeSVG with the sheet's faces embedded. */
export async function serializeSVGWithFonts(svgNode, meta = {}) {
  return serializeSVG(svgNode, meta, { fontsCss: await fontsCssFor(svgNode) });
}

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function downloadSVG(svgNode, meta) {
  const xml = await serializeSVGWithFonts(svgNode, meta);
  download(new Blob([xml], { type: 'image/svg+xml' }), meta.filename || 'typestract.svg');
}

/** Draw serialized SVG onto a canvas at `scale`×. */
function rasterize(xml, vb, scale) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = vb[2] * scale;
      canvas.height = vb[3] * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

/** Rasterize the sheet to a PNG blob at `scale`× — the faces embedded,
 * since an SVG drawn as an image cannot see the page's own. */
export async function renderPNG(svgNode, meta, scale = 2) {
  const xml = await serializeSVGWithFonts(svgNode, meta);
  const vb = (svgNode.getAttribute('viewBox') || '0 0 900 1200').split(/\s+/).map(Number);
  const canvas = await rasterize(xml, vb, scale);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

/** Rasterize the sheet to PNG at `scale`× and download. */
export async function downloadPNG(svgNode, meta, scale = 2) {
  const blob = await renderPNG(svgNode, meta, scale);
  download(blob, (meta.filename || 'typestract').replace(/\.svg$/, '') + `@${scale}x.png`);
}

/**
 * Flattened export for filter-heavy sheets (dirtyConcrete): groups
 * tagged data-flatten="1" are rasterized at 2× into an embedded
 * <image>; untagged layers (all the text) remain live vector on top.
 */
export async function downloadFlattenedSVG(svgNode, meta) {
  const vb = (svgNode.getAttribute('viewBox') || '0 0 900 1200').split(/\s+/).map(Number);
  const fontsCss = await fontsCssFor(svgNode);

  // 1. Clone with only the flatten-tagged layers (plus background).
  const rasterOnly = svgNode.cloneNode(true);
  rasterOnly.querySelectorAll('[data-keep-vector="1"]').forEach((n) => n.remove());
  const rasterXml = serializeSVG(rasterOnly, meta, { fontsCss });

  // 2. Rasterize at 2×.
  const dataUrl = (await rasterize(rasterXml, vb, 2)).toDataURL('image/png');

  // 3. Rebuild: embedded image underneath, vector layers on top.
  const out = svgNode.cloneNode(true);
  out.querySelectorAll('[data-flatten="1"]').forEach((n) => n.remove());
  out.querySelectorAll('filter').forEach((n) => n.remove());
  const image = document.createElementNS(SVG_NS, 'image');
  image.setAttribute('href', dataUrl);
  image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
  image.setAttribute('x', vb[0]);
  image.setAttribute('y', vb[1]);
  image.setAttribute('width', vb[2]);
  image.setAttribute('height', vb[3]);
  out.insertBefore(image, out.firstChild);

  const xml = serializeSVG(out, meta, { fontsCss });
  download(new Blob([xml], { type: 'image/svg+xml' }), (meta.filename || 'typestract.svg').replace(/\.svg$/, '-flat.svg'));
}
