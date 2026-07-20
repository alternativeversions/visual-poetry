/*
 * parser.js — a deterministic, rule-based sentence parser, roughly at
 * the level of a diligent 1877 schoolchild. No statistics, no model:
 * function-word lexicons and suffix heuristics, so the same sentence
 * always parses the same way and the site stays dependency-free. Its
 * mistakes are its own; the grammar engine footnotes them honestly
 * ("parsed by rule"). Hand-authored parses for the corpus live in
 * parses.js.
 */

/**
 * The misrule parser: a formally perfect clause tree with the words
 * assigned by chance. Every word is accounted for; nothing is in its
 * place. It never fails, so any sentence in any language can be
 * diagrammed — confidently, and wrong on purpose.
 */
export function parseChaotic(rng, text) {
  const words = text.replace(/[^\p{L}\p{N}'’\- ]/gu, ' ')
    .split(/\s+/).filter(Boolean).slice(0, 14);
  if (words.length < 2) return null;
  const order = rng.shuffle([...words.keys()]);
  const take = () => words[order.pop()];
  const clause = { subj: { w: take(), m: [] }, verb: { w: take(), m: [] }, chaotic: true };
  const pool = [clause.subj, clause.verb];
  if (order.length && rng.chance(0.7)) {
    clause.div = rng.chance(0.5) ? '|' : '\\';
    clause.post = { w: take(), m: [] };
    pool.push(clause.post);
  }
  while (order.length) {
    const host = rng.pick(pool); // the pool grows, so depth grows
    if (order.length >= 2 && rng.chance(0.45)) {
      const obj = { w: take(), m: [] };
      host.m.push({ w: take(), obj }); // a preposition by decree
      pool.push(obj);
    } else {
      host.m.push({ w: take() });
    }
  }
  return clause;
}

const ART = new Set(['a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'his', 'her', 'their', 'our', 'your', 'its', 'thy', 'thine', 'no', 'every', 'each', 'some', 'all', 'one']);
const PREP = new Set(['of', 'in', 'on', 'at', 'by', 'with', 'from', 'to', 'over', 'under', 'upon', 'unto', 'into', 'through', 'like', 'as', 'for', 'than', 'about', 'against', 'beside', 'toward', 'across', 'without']);
const AUX = new Set(['is', 'are', 'was', 'were', 'am', 'be', 'been', 'being', 'has', 'have', 'had', 'do', 'does', 'did', 'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must', 'cannot']);
const COPULA = new Set(['is', 'are', 'was', 'were', 'am', 'be', 'seems', 'seemed', 'becomes', 'became', 'appears']);
const ADV = new Set(['not', 'never', 'here', 'there', 'home', 'apart', 'away', 'again', 'always', 'still', 'now', 'then', 'often', 'soon', 'forever', 'alone', 'together', 'down', 'up', 'out', 'back']);
const VERBS = new Set(['come', 'comes', 'came', 'go', 'goes', 'went', 'fall', 'falls', 'fell', 'sing', 'sings', 'sang', 'hold', 'holds', 'held', 'leap', 'leaps', 'depend', 'depends', 'shine', 'shines', 'shone', 'burn', 'burns', 'run', 'runs', 'ran', 'see', 'sees', 'saw', 'hear', 'hears', 'heard', 'know', 'knows', 'knew', 'make', 'makes', 'made', 'take', 'takes', 'took', 'give', 'gives', 'gave', 'bring', 'brings', 'brought', 'call', 'calls', 'called', 'sound', 'sounds', 'contain', 'contains', 'dwell', 'dwells', 'lead', 'leads', 'led', 'hide', 'hides', 'hid', 'shake', 'shakes', 'shook', 'love', 'loves', 'loved', 'say', 'says', 'said', 'speak', 'speaks', 'spoke', 'find', 'finds', 'found', 'keep', 'keeps', 'kept', 'lie', 'lies', 'lay', 'stand', 'stands', 'stood', 'grow', 'grows', 'grew', 'turn', 'turns', 'turned', 'move', 'moves', 'moved', 'wait', 'waits', 'waited', 'live', 'lives', 'lived', 'die', 'dies', 'died', 'remember', 'remembers', 'forget', 'forgets', 'want', 'wants', 'need', 'needs', 'think', 'thinks', 'thought', 'feel', 'feels', 'felt', 'hums', 'hum']);

const isVerbish = (w) => VERBS.has(w) || AUX.has(w) ||
  (w.length > 4 && (w.endsWith('eth') || w.endsWith('est') || w.endsWith('ed') || w.endsWith('ing')));
const isAdverb = (w) => ADV.has(w) || (w.length > 3 && w.endsWith('ly'));
const isNounish = (w) => !ART.has(w) && !PREP.has(w) && !AUX.has(w) && !isAdverb(w) && !VERBS.has(w);

/**
 * Parse one sentence into a clause the grammar engine can draw, or
 * null when the rules find no verb to hang the sentence on.
 */
export function parseSentence(text) {
  const tokens = text.toLowerCase()
    .replace(/[^\p{L}\p{N}'’\- ]/gu, ' ')
    .split(/\s+/).filter(Boolean);
  if (tokens.length < 2 || tokens.length > 24) return null;

  /* the main verb: first auxiliary (merged with its participle) or
   * first lexicon/suffix verb after at least one candidate subject */
  let vi = -1;
  let verbWord = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (AUX.has(t)) {
      vi = i;
      verbWord = t;
      const next = tokens[i + 1];
      if (next && isVerbish(next) && !AUX.has(next)) verbWord = t + ' ' + next;
      break;
    }
    if (i > 0 && VERBS.has(t)) { vi = i; verbWord = t; break; }
  }
  if (vi === -1) {
    for (let i = 1; i < tokens.length; i++) {
      if (isVerbish(tokens[i])) { vi = i; verbWord = tokens[i]; break; }
    }
  }
  if (vi === -1 || !verbWord) return null;
  const vLen = verbWord.split(' ').length;

  /* the subject: last noun-ish token before the verb; earlier
   * articles and adjectives become its slants */
  let si = -1;
  for (let i = vi - 1; i >= 0; i--) {
    if (isNounish(tokens[i])) { si = i; break; }
  }
  if (si === -1) si = Math.max(0, vi - 1);
  const subj = { w: tokens[si], m: [] };
  for (let i = Math.max(0, si - 3); i < si; i++) {
    if (!PREP.has(tokens[i]) && !isVerbish(tokens[i])) subj.m.push({ w: tokens[i] });
  }

  const clause = { subj, verb: { w: verbWord, m: [] } };

  /* after the verb: adverbs to the verb; the first bare noun phrase
   * becomes object (or complement after a copula); prepositions open
   * phrases that attach to the verb, nesting when they stack */
  let post = null;
  let holder = clause.verb; // where the next prep phrase hangs
  let i = vi + vLen;
  while (i < tokens.length) {
    const t = tokens[i];
    if (isAdverb(t) && !post) {
      clause.verb.m.push({ w: t });
      i++;
    } else if (PREP.has(t)) {
      const mods = [];
      i++;
      while (i < tokens.length && (ART.has(tokens[i]) || (!PREP.has(tokens[i]) && !isNounish(tokens[i])))) {
        mods.push({ w: tokens[i] });
        i++;
      }
      if (i >= tokens.length) break;
      const obj = { w: tokens[i], m: mods };
      holder.m = holder.m || [];
      holder.m.push({ w: t, obj });
      holder = obj;
      i++;
    } else if (!post) {
      const mods = [];
      while (i < tokens.length - 1 && (ART.has(tokens[i]) || (!isNounish(tokens[i]) && !PREP.has(tokens[i])))) {
        mods.push({ w: tokens[i] });
        i++;
      }
      post = { w: tokens[i], m: mods };
      clause.div = COPULA.has(tokens[vi]) ? '\\' : '|';
      clause.post = post;
      holder = post;
      i++;
    } else {
      i++; // leftovers fall silently; the footnote owns the losses
    }
  }

  return clause;
}
