/*
 * render.js — the pure render. Everything derives from (seed, engineId,
 * source, userText, entropy, paperMode, typeId, hybrid); the page, the
 * wall and the smoke test all call this one function.
 */

import { makeRng } from './prng.js';
import { choosePalette } from './palette.js';
import { makeSheet, setFonts, pairingFor, facesLoaded } from './typography.js';
import { el, resetIds } from './svg.js';
import { makeTextSource } from './text/procedures.js';
import { pickEngine, sheetSizeFor, pickHybrid } from './engines/index.js';
import { buildColophon } from './colophon.js';

/**
 * Pure render: everything derives from (seed, engineId, source, userText,
 * entropy, paperMode). Returns { svg, meta, engine }.
 */
export function renderPoem({ seed, engineId, source, userText, entropy, paperMode, typeId, hybrid }) {
  resetIds();

  // the type pairing: pinned from the rail, or the seed's own choice
  const pairing = pairingFor(seed, typeId);
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
    /* geometric precision: hinted faces round their advances to the pixel
     * at the size they are drawn, so a word measured at 10 px and shown
     * at 8.5 px on a scaled sheet would not keep its measured width. This
     * turns hinting off for the sheet, as the measuring canvas does. */
    'text-rendering': 'geometricPrecision',
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
  /* the colophon names the faces honestly: the pairing when its
   * families are resident, the stand-ins when they are not */
  const setIn = facesLoaded(pairing)
    ? `set in ${pairing.name}`
    : `meant for ${pairing.name}, set in the system’s stand-ins`;
  meta.colophon = buildColophon(meta) + ` · ${setIn} · ${new Date().getFullYear()}`;
  meta.filename = `typestract-${engine.id}-${seed}.svg`;
  return { svg, meta, engine };
}
