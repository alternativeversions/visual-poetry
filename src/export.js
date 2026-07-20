/*
 * export.js — SVG serialization and PNG rasterization.
 *
 * Exports are real vector: <text> stays text (not outlined), paths stay
 * paths. Width/height are given in mm so print software opens the sheet
 * at a sensible physical size (900 px ≙ 190 mm wide).
 */

const MM_PER_PX = 190 / 900;

/**
 * Serialize the poem SVG with metadata. Clones the node; injects
 * xmlns, mm dimensions, <title> and <desc> (the full colophon).
 */
export function serializeSVG(svgNode, meta = {}) {
  const clone = svgNode.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
  const vb = (clone.getAttribute('viewBox') || '0 0 900 1200').split(/\s+/).map(Number);
  clone.setAttribute('width', `${Math.round(vb[2] * MM_PER_PX)}mm`);
  clone.setAttribute('height', `${Math.round(vb[3] * MM_PER_PX)}mm`);

  // <title> and <desc> must be first children
  const desc = document.createElementNS('http://www.w3.org/2000/svg', 'desc');
  desc.textContent = meta.colophon || '';
  clone.insertBefore(desc, clone.firstChild);
  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
  title.textContent = meta.title || 'typestract';
  clone.insertBefore(title, clone.firstChild);

  const xml = new XMLSerializer().serializeToString(clone);
  return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
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

export function downloadSVG(svgNode, meta) {
  const xml = serializeSVG(svgNode, meta);
  download(new Blob([xml], { type: 'image/svg+xml' }), meta.filename || 'typestract.svg');
}

/** Rasterize the sheet to PNG at `scale`× and download. */
export function downloadPNG(svgNode, meta, scale = 2) {
  const xml = serializeSVG(svgNode, meta);
  const vb = (svgNode.getAttribute('viewBox') || '0 0 900 1200').split(/\s+/).map(Number);
  const img = new Image();
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml' }));
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = vb[2] * scale;
    canvas.height = vb[3] * scale;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => download(blob, (meta.filename || 'typestract').replace(/\.svg$/, '') + `@${scale}x.png`), 'image/png');
  };
  img.src = url;
}

/**
 * Flattened export for filter-heavy sheets (dirtyConcrete): groups
 * tagged data-flatten="1" are rasterized at 2× into an embedded
 * <image>; untagged layers (all the text) remain live vector on top.
 */
export async function downloadFlattenedSVG(svgNode, meta) {
  const vb = (svgNode.getAttribute('viewBox') || '0 0 900 1200').split(/\s+/).map(Number);

  // 1. Clone with only the flatten-tagged layers (plus background).
  const rasterOnly = svgNode.cloneNode(true);
  rasterOnly.querySelectorAll('[data-keep-vector="1"]').forEach((n) => n.remove());
  const rasterXml = serializeSVG(rasterOnly, meta);

  // 2. Rasterize at 2×.
  const dataUrl = await new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([rasterXml], { type: 'image/svg+xml' }));
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = vb[2] * 2;
      canvas.height = vb[3] * 2;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });

  // 3. Rebuild: embedded image underneath, vector layers on top.
  const out = svgNode.cloneNode(true);
  out.querySelectorAll('[data-flatten="1"]').forEach((n) => n.remove());
  out.querySelectorAll('filter').forEach((n) => n.remove());
  const image = document.createElementNS('http://www.w3.org/2000/svg', 'image');
  image.setAttribute('href', dataUrl);
  image.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', dataUrl);
  image.setAttribute('x', vb[0]);
  image.setAttribute('y', vb[1]);
  image.setAttribute('width', vb[2]);
  image.setAttribute('height', vb[3]);
  out.insertBefore(image, out.firstChild);

  const xml = serializeSVG(out, meta);
  download(new Blob([xml], { type: 'image/svg+xml' }), (meta.filename || 'typestract.svg').replace(/\.svg$/, '-flat.svg'));
}
