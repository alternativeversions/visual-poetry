/*
 * engines/index.js — the registry. Each engine is a pure visual grammar:
 * { id, name, lineage, paletteOpts?, sheetSize?, generate(rng, source, sheet) }.
 * Same seed in, same poem out.
 */

import constellation from './constellation.js';
import technopaegnia from './technopaegnia.js';
import coupDeDes from './coupDeDes.js';
import typestract from './typestract.js';
import dirtyConcrete from './dirtyConcrete.js';
import diagram from './diagram.js';
import workshops from './workshops.js';
import revisedPhilosophy from './revisedPhilosophy.js';
import asemic from './asemic.js';
import babel from './babel.js';
import unordnung from './unordnung.js';
import ruins from './ruins.js';
import decollage from './decollage.js';
import gloss from './gloss.js';
import grammar from './grammar.js';
import transmission from './transmission.js';
import intextus from './intextus.js';
import tendre from './tendre.js';
import aria from './aria.js';
import lineprinter from './lineprinter.js';
import mesostic from './mesostic.js';
import bookIndex from './bookIndex.js';
import rollage from './rollage.js';
import inscription from './inscription.js';
import calligramme from './calligramme.js';

export const ENGINES = [constellation, technopaegnia, coupDeDes, typestract, dirtyConcrete, diagram, workshops, revisedPhilosophy, asemic, babel, unordnung, ruins, decollage, gloss, grammar, transmission, intextus, tendre, aria, lineprinter, mesostic, bookIndex, rollage, inscription, calligramme];

export const ENGINE_MAP = Object.fromEntries(ENGINES.map((e) => [e.id, e]));

/** Pick an engine — equal weights, `override` (from ?engine=) wins. */
export function pickEngine(rng, override) {
  if (override && ENGINE_MAP[override]) return ENGINE_MAP[override];
  return rng.pick(ENGINES);
}

/** Sheet dimensions for an engine (coupDeDes uses a spread). */
export function sheetSizeFor(engine) {
  return engine.sheetSize || { width: 900, height: 1200 };
}

/**
 * Crossbreed mode: 10% chance (or forced via ?hybrid=1), a second engine
 * lends its material vocabulary to the first's composition logic. Only
 * engines that declare materials/compositions participate.
 */
export function pickHybrid(rng, engine, force = false) {
  if (!force && !rng.chance(0.1)) return null;
  const materials = ENGINES.filter(
    (e) => e.id !== engine.id && e.providesMaterial && (engine.acceptsMaterial || []).includes(e.id)
  );
  if (!materials.length) return null;
  return rng.pick(materials);
}
