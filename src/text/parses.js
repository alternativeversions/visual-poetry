/*
 * parses.js — corpus sentences diagrammed by hand.
 *
 * The grammar engine renders Reed–Kellogg diagrams, and a diagram is
 * only as honest as its parse. These parses were authored at build
 * time (the machine did the grammar once, carefully) and ship as
 * data, so renders stay deterministic and offline. User-pasted text
 * falls back to the rule-based parser in parser.js.
 *
 * Shape:
 *   unit   { w: 'fog', m: [mod, ...] }       a word with modifiers
 *   mod    { w: 'the' }                       a slant under its head
 *          { w: 'on', obj: unit }             a preposition + object
 *   clause { subj, verb, div: '|'|'\\',       divider before `post`
 *            post, div2, post2 }              object or complement
 *   entry  { text, attribution, clauses: [clause, ...] }
 */

export const PARSES = [
  {
    text: 'The fog comes on little cat feet.',
    attribution: 'C. Sandburg, “Fog” (1916)',
    clauses: [{
      subj: { w: 'fog', m: [{ w: 'the' }] },
      verb: { w: 'comes', m: [{ w: 'on', obj: { w: 'feet', m: [{ w: 'little' }, { w: 'cat' }] } }] },
    }],
  },
  {
    text: 'The Brain — is wider than the Sky.',
    attribution: 'E. Dickinson, Fr 598',
    clauses: [{
      subj: { w: 'Brain', m: [{ w: 'the' }] },
      verb: { w: 'is' },
      div: '\\',
      post: { w: 'wider', m: [{ w: 'than', obj: { w: 'Sky', m: [{ w: 'the' }] } }] },
    }],
  },
  {
    text: 'I sound my barbaric yawp over the roofs of the world.',
    attribution: 'W. Whitman, “Song of Myself” (1855)',
    clauses: [{
      subj: { w: 'I' },
      verb: { w: 'sound', m: [{ w: 'over', obj: { w: 'roofs', m: [{ w: 'the' }, { w: 'of', obj: { w: 'world', m: [{ w: 'the' }] } }] } }] },
      div: '|',
      post: { w: 'yawp', m: [{ w: 'my' }, { w: 'barbaric' }] },
    }],
  },
  {
    text: 'so much depends upon a red wheel barrow',
    attribution: 'W. C. Williams, “The Red Wheelbarrow” (1923)',
    clauses: [{
      subj: { w: 'much', m: [{ w: 'so' }] },
      verb: { w: 'depends', m: [{ w: 'upon', obj: { w: 'barrow', m: [{ w: 'a' }, { w: 'red' }, { w: 'wheel' }] } }] },
    }],
  },
  {
    text: 'The tigers of wrath are wiser than the horses of instruction.',
    attribution: 'W. Blake, The Marriage of Heaven and Hell (c. 1790)',
    clauses: [{
      subj: { w: 'tigers', m: [{ w: 'the' }, { w: 'of', obj: { w: 'wrath' } }] },
      verb: { w: 'are' },
      div: '\\',
      post: { w: 'wiser', m: [{ w: 'than', obj: { w: 'horses', m: [{ w: 'the' }, { w: 'of', obj: { w: 'instruction' } }] } }] },
    }],
  },
  {
    text: 'Call me Ishmael.',
    attribution: 'H. Melville, Moby-Dick (1851)',
    clauses: [{
      subj: { w: '(you)' },
      verb: { w: 'Call' },
      div: '|',
      post: { w: 'me' },
      div2: '\\',
      post2: { w: 'Ishmael' },
    }],
  },
  {
    text: '“Hope” is the thing with feathers.',
    attribution: 'E. Dickinson, Fr 314',
    clauses: [{
      subj: { w: 'Hope' },
      verb: { w: 'is' },
      div: '\\',
      post: { w: 'thing', m: [{ w: 'the' }, { w: 'with', obj: { w: 'feathers' } }] },
    }],
  },
  {
    text: 'I am large, I contain multitudes.',
    attribution: 'W. Whitman, “Song of Myself” (1855)',
    clauses: [
      { subj: { w: 'I' }, verb: { w: 'am' }, div: '\\', post: { w: 'large' } },
      { subj: { w: 'I' }, verb: { w: 'contain' }, div: '|', post: { w: 'multitudes' } },
    ],
  },
  {
    text: 'Deep calleth unto deep at the noise of thy waterspouts.',
    attribution: 'Psalm 42 (KJV, 1611)',
    clauses: [{
      subj: { w: 'Deep' },
      verb: { w: 'calleth', m: [
        { w: 'unto', obj: { w: 'deep' } },
        { w: 'at', obj: { w: 'noise', m: [{ w: 'the' }, { w: 'of', obj: { w: 'waterspouts', m: [{ w: 'thy' }] } }] } },
      ] },
    }],
  },
  {
    text: 'The world is charged with the grandeur of God.',
    attribution: 'G. M. Hopkins, “God’s Grandeur” (1877)',
    clauses: [{
      subj: { w: 'world', m: [{ w: 'the' }] },
      verb: { w: 'is charged', m: [{ w: 'with', obj: { w: 'grandeur', m: [{ w: 'the' }, { w: 'of', obj: { w: 'God' } }] } }] },
    }],
  },
  {
    text: 'Things fall apart; the centre cannot hold.',
    attribution: 'W. B. Yeats, “The Second Coming” (1920)',
    clauses: [
      { subj: { w: 'Things' }, verb: { w: 'fall', m: [{ w: 'apart' }] } },
      { subj: { w: 'centre', m: [{ w: 'the' }] }, verb: { w: 'cannot hold' } },
    ],
  },
  {
    text: 'I wandered lonely as a cloud.',
    attribution: 'W. Wordsworth, “I wandered lonely as a cloud” (1807)',
    clauses: [{
      subj: { w: 'I' },
      verb: { w: 'wandered', m: [{ w: 'lonely' }, { w: 'as', obj: { w: 'cloud', m: [{ w: 'a' }] } }] },
    }],
  },
  {
    text: 'A thing of beauty is a joy for ever.',
    attribution: 'J. Keats, Endymion (1818)',
    clauses: [{
      subj: { w: 'thing', m: [{ w: 'a' }, { w: 'of', obj: { w: 'beauty' } }] },
      verb: { w: 'is' },
      div: '\\',
      post: { w: 'joy', m: [{ w: 'a' }, { w: 'for', obj: { w: 'ever' } }] },
    }],
  },
  {
    text: 'Beauty is truth, truth beauty.',
    attribution: 'J. Keats, “Ode on a Grecian Urn” (1819)',
    clauses: [
      { subj: { w: 'Beauty' }, verb: { w: 'is' }, div: '\\', post: { w: 'truth' } },
      { subj: { w: 'truth' }, verb: { w: '(is)' }, div: '\\', post: { w: 'beauty' } },
    ],
  },
  {
    text: 'The sun is new each day.',
    attribution: 'Heraclitus, fr. 32 (trans. Burnet, 1892)',
    clauses: [{
      subj: { w: 'sun', m: [{ w: 'the' }] },
      verb: { w: 'is', m: [{ w: 'day', m: [{ w: 'each' }] }] },
      div: '\\',
      post: { w: 'new' },
    }],
  },
  {
    text: 'I dwell in Possibility.',
    attribution: 'E. Dickinson, Fr 466',
    clauses: [{
      subj: { w: 'I' },
      verb: { w: 'dwell', m: [{ w: 'in', obj: { w: 'Possibility' } }] },
    }],
  },
  {
    text: 'The road of excess leads to the palace of wisdom.',
    attribution: 'W. Blake, The Marriage of Heaven and Hell (c. 1790)',
    clauses: [{
      subj: { w: 'road', m: [{ w: 'the' }, { w: 'of', obj: { w: 'excess' } }] },
      verb: { w: 'leads', m: [{ w: 'to', obj: { w: 'palace', m: [{ w: 'the' }, { w: 'of', obj: { w: 'wisdom' } }] } }] },
    }],
  },
  {
    text: 'An old pond — a frog leaps in.',
    attribution: 'Bashō (trans. after Aston, 1899)',
    clauses: [{
      subj: { w: 'frog', m: [{ w: 'a' }] },
      verb: { w: 'leaps', m: [{ w: 'in' }] },
    }],
  },
  {
    text: 'I’m Nobody! Who are you?',
    attribution: 'E. Dickinson, Fr 260',
    clauses: [
      { subj: { w: 'I' }, verb: { w: 'am' }, div: '\\', post: { w: 'Nobody' } },
      { subj: { w: 'you' }, verb: { w: 'are' }, div: '\\', post: { w: 'Who' } },
    ],
  },
  {
    text: 'The stars about the fair moon hide their bright face.',
    attribution: 'Sappho, fr. 4 (trans. Wharton, 1885)',
    clauses: [{
      subj: { w: 'stars', m: [{ w: 'the' }, { w: 'about', obj: { w: 'moon', m: [{ w: 'the' }, { w: 'fair' }] } }] },
      verb: { w: 'hide' },
      div: '|',
      post: { w: 'face', m: [{ w: 'their' }, { w: 'bright' }] },
    }],
  },
  {
    text: 'Love shook my heart like the wind on the mountain.',
    attribution: 'Sappho, fr. 42 (trans. Wharton, 1885)',
    clauses: [{
      subj: { w: 'Love' },
      verb: { w: 'shook', m: [{ w: 'like', obj: { w: 'wind', m: [{ w: 'the' }, { w: 'on', obj: { w: 'mountain', m: [{ w: 'the' }] } }] } }] },
      div: '|',
      post: { w: 'heart', m: [{ w: 'my' }] },
    }],
  },
  {
    text: 'Evening, thou bringest the sheep, thou bringest the goat, thou bringest her child home.',
    attribution: 'Sappho, fr. 95 (trans. Wharton, 1885)',
    clauses: [
      { subj: { w: 'thou' }, verb: { w: 'bringest' }, div: '|', post: { w: 'sheep', m: [{ w: 'the' }] } },
      { subj: { w: 'thou' }, verb: { w: 'bringest' }, div: '|', post: { w: 'goat', m: [{ w: 'the' }] } },
      { subj: { w: 'thou' }, verb: { w: 'bringest', m: [{ w: 'home' }] }, div: '|', post: { w: 'child', m: [{ w: 'her' }] } },
    ],
  },
  {
    text: 'In the beginning was the Word.',
    attribution: 'John 1:1 (KJV, 1611)',
    clauses: [{
      subj: { w: 'Word', m: [{ w: 'the' }] },
      verb: { w: 'was', m: [{ w: 'in', obj: { w: 'beginning', m: [{ w: 'the' }] } }] },
    }],
  },
];
