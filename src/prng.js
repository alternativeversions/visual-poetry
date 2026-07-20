/*
 * prng.js — all randomness in TYPESTRACT flows from here.
 *
 * xmur3 string hash feeding mulberry32. One seed, one poem: engines are
 * pure functions of (rng, text, sheet), so the same eight hex characters
 * reproduce the same page forever — the constraint every chance-driven
 * poetics from Mallarmé's dice to Cage's I Ching operations depends on.
 */

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Make a seeded generator with helpers. `seedStr` is any string; the same
 * string always yields the same stream. Use `makeRng(seed + ':facet')` to
 * derive independent streams so, e.g., palette draws never perturb layout.
 */
export function makeRng(seedStr) {
  const next = mulberry32(xmur3(String(seedStr))());

  const rng = () => next();

  /** Integer in [min, max] inclusive. */
  rng.int = (min, max) => min + Math.floor(next() * (max - min + 1));

  /** Float in [min, max). */
  rng.range = (min, max) => min + next() * (max - min);

  /** True with probability p. */
  rng.chance = (p) => next() < p;

  /** Uniform pick from an array. */
  rng.pick = (arr) => arr[Math.floor(next() * arr.length)];

  /** Weighted pick from [{value, weight}, ...]. */
  rng.weighted = (items) => {
    const total = items.reduce((s, it) => s + it.weight, 0);
    let roll = next() * total;
    for (const it of items) {
      roll -= it.weight;
      if (roll <= 0) return it.value;
    }
    return items[items.length - 1].value;
  };

  /** Fisher–Yates on a copy; the original is untouched. */
  rng.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  /** Approximate gaussian (Irwin–Hall of 6). */
  rng.gauss = (mean = 0, sd = 1) => {
    let s = 0;
    for (let i = 0; i < 6; i++) s += next();
    return mean + ((s - 3) / Math.sqrt(0.5)) * sd;
  };

  /** n hex characters. */
  rng.hex = (n) => {
    let out = '';
    for (let i = 0; i < n; i++) out += Math.floor(next() * 16).toString(16);
    return out;
  };

  return rng;
}

/** A fresh 8-hex-char seed for a new render. */
export function randomSeed() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0].toString(16).padStart(8, '0');
  }
  return Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
}

/** Deterministic 32-bit integer from a seed string (for №, folios, etc.). */
export function seedInt(seedStr) {
  return xmur3(String(seedStr))();
}
