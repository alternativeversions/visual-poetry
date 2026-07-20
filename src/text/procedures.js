/*
 * procedures.js — legible operations, the kind a 1960s concretist could
 * have performed with scissors, a typewriter, and patience: permutation,
 * erasure, stutter, recombination. Never Markov-babble.
 *
 * Also home of makeTextSource(), the uniform interface engines consume —
 * engines are indifferent to whether their words came from the corpus,
 * the paste drawer, or a procedure.
 */

import { CORPUS, byKind, byLength } from './corpus.js';

/* ------------------------------------------------------------------ *
 * Operations. Each returns { text, tokens, attribution } where tokens
 * is [{ word, erased?, ghost? }]. Engines that place word-by-word may
 * honor `erased` (render as gap or 8%-opacity ghost); others just use
 * `text`, which omits erased words.
 * ------------------------------------------------------------------ */

/** All rotations of a word list — the permutation cycle as poem. */
export function permutationCycle(words) {
  const lines = [];
  for (let i = 0; i < words.length; i++) {
    lines.push(words.slice(i).concat(words.slice(0, i)).join(' '));
  }
  return lines;
}

/** Erase 30–60% of a fragment's words; survivors keep their positions. */
export function erasure(rng, fragment) {
  const words = fragment.text.split(/\s+/);
  const rate = rng.range(0.3, 0.6);
  const tokens = words.map((word) => ({ word, erased: rng.chance(rate) }));
  // never erase everything
  if (tokens.every((t) => t.erased)) tokens[rng.int(0, tokens.length - 1)].erased = false;
  return {
    text: tokens.filter((t) => !t.erased).map((t) => t.word).join(' '),
    tokens,
    attribution: `erasure of ${fragment.attribution}`,
    mood: fragment.mood || null,
    lang: fragment.lang || null,
    kind: fragment.kind || null,
  };
}

/** Stutter: duplicate words in place — back back back, thethethe. */
export function stutter(rng, text, rate = 0.25) {
  const words = text.split(/\s+/);
  const out = [];
  for (const word of words) {
    if (rng.chance(rate)) {
      const times = rng.int(2, 4);
      const bare = word.replace(/[.,;:!?—]+$/, '');
      if (bare.length <= 3 && rng.chance(0.5)) {
        out.push(Array(times).fill(bare).join('')); // fused: thethethe
      } else {
        out.push(...Array(times).fill(bare)); // spaced: back back back
      }
    } else {
      out.push(word);
    }
  }
  return out.join(' ');
}

/** Splice two fragments at phrase boundaries. */
export function recombine(rng, fragA, fragB) {
  const splitAt = (t) => {
    const parts = t.split(/(?<=[,;:—.!?])\s+/).filter(Boolean);
    return parts.length > 1 ? parts : t.split(/\s+/).length > 5
      ? [t.split(/\s+/).slice(0, Math.ceil(t.split(/\s+/).length / 2)).join(' '),
         t.split(/\s+/).slice(Math.ceil(t.split(/\s+/).length / 2)).join(' ')]
      : [t];
  };
  const a = splitAt(fragA.text);
  const b = splitAt(fragB.text);
  const head = a.slice(0, rng.int(1, a.length));
  const tail = b.slice(rng.int(0, b.length - 1));
  const text = head.concat(tail).join(' ').replace(/\s+/g, ' ');
  return {
    text,
    tokens: text.split(/\s+/).map((word) => ({ word })),
    attribution: `${fragA.attribution} × ${fragB.attribution}`,
    mood: fragA.mood || null,
    lang: fragA.lang || null,
    kind: fragA.kind || null,
  };
}

/* ------------------------------------------------------------------ *
 * The text source.
 * ------------------------------------------------------------------ */

function plain(fragment) {
  return {
    text: fragment.text,
    tokens: fragment.text.split(/\s+/).map((word) => ({ word })),
    attribution: fragment.attribution,
    mood: fragment.mood || null,
    lang: fragment.lang || null,
    kind: fragment.kind || null,
  };
}

function fromUser(userText) {
  const clean = userText.replace(/\s+/g, ' ').trim();
  const sentences = clean.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  const words = clean.split(/\s+/).filter((w) => w.length > 0);
  return { clean, sentences, words };
}

/**
 * Build the text source for one render.
 * mode: 'corpus' | 'user' | 'procedural'
 */
export function makeTextSource(rng, { mode = 'corpus', userText = '' } = {}) {
  if (mode === 'user' && !userText.trim()) mode = 'corpus';

  const user = mode === 'user' ? fromUser(userText) : null;

  const source = { mode, userText: user ? user.clean : '' };

  /** One fragment, roughly minWords..maxWords words. */
  source.fragment = (r, { minWords = 3, maxWords = 14 } = {}) => {
    if (user) {
      const candidates = user.sentences.filter((s) => {
        const n = s.split(/\s+/).length;
        return n >= Math.min(minWords, 2) && n <= maxWords * 2;
      });
      const s = candidates.length ? r.pick(candidates) : user.sentences[0] || user.clean;
      const words = s.split(/\s+/).slice(0, maxWords * 2);
      return plain({ text: words.join(' '), attribution: 'user text' });
    }
    const pool = byLength(minWords, maxWords).filter((f) => f.kind !== 'word');
    const frag = r.pick(pool.length ? pool : CORPUS.filter((f) => f.kind !== 'word'));
    if (mode === 'procedural') {
      const op = r.pick(['erasure', 'stutter', 'recombine', 'plain']);
      if (op === 'erasure') return erasure(r, frag);
      if (op === 'stutter') {
        const text = stutter(r, frag.text, 0.2 + r.range(0, 0.2));
        return { text, tokens: text.split(/\s+/).map((word) => ({ word })), attribution: `stutter of ${frag.attribution}`, mood: frag.mood || null, lang: frag.lang || null, kind: frag.kind || null };
      }
      if (op === 'recombine') {
        const other = r.pick(pool.length > 1 ? pool : CORPUS.filter((f) => f.kind !== 'word'));
        return recombine(r, frag, other);
      }
    }
    return plain(frag);
  };

  /** One resonant word (for constellations, brackets, permutations). */
  source.word = (r) => {
    if (user) {
      const good = user.words
        .map((w) => w.toLowerCase().replace(/[^\p{L}'-]/gu, ''))
        .filter((w) => w.length >= 2 && w.length <= 9);
      const w = good.length ? r.pick(good) : 'silence';
      return { text: w, attribution: 'user text' };
    }
    const frag = r.pick(byKind('word'));
    return { text: frag.text, attribution: frag.attribution };
  };

  /** A long run for coupDeDes: one sentence, or two recombined. */
  source.sentence = (r, minWords = 12) => {
    if (user) {
      const long = user.sentences.filter((s) => s.split(/\s+/).length >= Math.min(minWords, 6));
      if (long.length) return plain({ text: r.pick(long), attribution: 'user text' });
      return plain({ text: user.clean.split(/\s+/).slice(0, 30).join(' '), attribution: 'user text' });
    }
    const long = byLength(minWords, 40).filter((f) => f.kind !== 'word');
    if (long.length && r.chance(0.6)) return plain(r.pick(long));
    const pool = byLength(5, 20).filter((f) => f.kind !== 'word');
    const a = r.pick(pool);
    let b = r.pick(pool);
    if (b === a) b = r.pick(pool);
    return recombine(r, a, b);
  };

  return source;
}
