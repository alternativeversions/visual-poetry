/*
 * corpus.js — the built-in text source: public-domain fragments, kept
 * short because visual poetry runs on phrases, not paragraphs.
 *
 * Tags: mood ∈ {still, elegiac, ecstatic, wry, cosmic}
 *       kind ∈ {word, phrase, line, sentence}
 *       lang ∈ {en, fr, de, la, it}
 *
 * Attributions are what the colophon prints; keep them precise, and
 * where a fragment number is uncertain, prefer no number to a wrong
 * one. Sappho follows H. T. Wharton's prose renderings (1885); the
 * pre-Socratics follow John Burnet, Early Greek Philosophy (1892).
 *
 * A private supplement can be dropped in as src/text/corpus.local.js
 * (gitignored) exporting `CORPUS`; it is merged at load. Use it for
 * material you have rights to but that shouldn't ship with the repo.
 */

export const CORPUS = [
  // ——— Sappho (trans. H. T. Wharton, 1885) ———
  { text: 'The moon has set, and the Pleiades; it is midnight, the time is going by, and I sleep alone.', attribution: 'Sappho, fr. 52 (trans. Wharton)', mood: 'elegiac', kind: 'sentence', lang: 'en' },
  { text: 'I loved thee once, Atthis, long ago', attribution: 'Sappho, fr. 33 (trans. Wharton)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Evening, thou that bringest all that bright morning scattered', attribution: 'Sappho, fr. 95 (trans. Wharton)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'thou bringest the sheep, thou bringest the goat, thou bringest her child home to the mother', attribution: 'Sappho, fr. 95 (trans. Wharton)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'the golden-sandalled Dawn', attribution: 'Sappho, fr. 19 (trans. Wharton)', mood: 'ecstatic', kind: 'phrase', lang: 'en' },
  { text: 'and round about the breeze murmurs cool through apple-boughs, and slumber streams from quivering leaves', attribution: 'Sappho, fr. 4 (trans. Wharton)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'Love shook my heart like the wind that falls upon oaks on the mountain', attribution: 'Sappho, fr. 42 (trans. Wharton)', mood: 'ecstatic', kind: 'sentence', lang: 'en' },
  { text: 'Death is an evil; the gods have so judged: had it been good, they would die.', attribution: 'Sappho, fr. 137 (trans. Wharton)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'I flutter like a child after her mother', attribution: 'Sappho, fr. 90 (trans. Wharton)', mood: 'elegiac', kind: 'phrase', lang: 'en' },
  { text: 'more golden than gold', attribution: 'Sappho, fr. 123 (trans. Wharton)', mood: 'ecstatic', kind: 'phrase', lang: 'en' },
  { text: 'The stars about the fair moon in their turn hide their bright face when she lights up all earth with silver.', attribution: 'Sappho, fr. 3 (trans. Wharton)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'Delicate Adonis is dying, Cytherea; what shall we do?', attribution: 'Sappho (trans. Wharton)', mood: 'elegiac', kind: 'sentence', lang: 'en' },
  { text: 'I have a fair daughter with a form like golden flowers, Cleïs the beloved', attribution: 'Sappho (trans. Wharton)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Sweet mother, I cannot weave my web, broken as I am by longing', attribution: 'Sappho (trans. Wharton)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'The mountain-summits sleep, glens, cliffs, and caves', attribution: 'Alcman (trans. Campbell)', mood: 'still', kind: 'line', lang: 'en' },

  // ——— Emily Dickinson ———
  { text: 'After great pain, a formal feeling comes', attribution: 'E. Dickinson, Fr 372', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'I dwell in Possibility — a fairer House than Prose', attribution: 'E. Dickinson, Fr 466', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Tell all the truth but tell it slant', attribution: 'E. Dickinson, Fr 1263', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'The Truth must dazzle gradually or every man be blind', attribution: 'E. Dickinson, Fr 1263', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'I heard a Fly buzz — when I died', attribution: 'E. Dickinson, Fr 591', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'The Brain — is wider than the Sky', attribution: 'E. Dickinson, Fr 598', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: "There's a certain Slant of light, Winter Afternoons", attribution: 'E. Dickinson, Fr 320', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'Hope is the thing with feathers that perches in the soul', attribution: 'E. Dickinson, Fr 314', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'This is my letter to the World that never wrote to Me', attribution: 'E. Dickinson, Fr 519', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Because I could not stop for Death — He kindly stopped for me', attribution: 'E. Dickinson, Fr 479', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'The Carriage held but just Ourselves — and Immortality', attribution: 'E. Dickinson, Fr 479', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'Zero at the Bone', attribution: 'E. Dickinson, Fr 1096', mood: 'still', kind: 'phrase', lang: 'en' },
  { text: 'Wild nights — Wild nights! Were I with thee, Wild nights should be our luxury!', attribution: 'E. Dickinson, Fr 269', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Much Madness is divinest Sense — to a discerning Eye', attribution: 'E. Dickinson, Fr 620', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'I taste a liquor never brewed', attribution: 'E. Dickinson, Fr 207', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'The Soul selects her own Society — then — shuts the Door', attribution: 'E. Dickinson, Fr 409', mood: 'still', kind: 'line', lang: 'en' },
  { text: "I'm Nobody! Who are you? Are you — Nobody — too?", attribution: 'E. Dickinson, Fr 260', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'There is no Frigate like a Book to take us Lands away', attribution: 'E. Dickinson, Fr 1286', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Split the Lark — and you’ll find the Music', attribution: 'E. Dickinson, Fr 905', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Forever — is composed of Nows', attribution: 'E. Dickinson, Fr 690', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'The Bustle in a House the Morning after Death', attribution: 'E. Dickinson, Fr 1108', mood: 'elegiac', kind: 'line', lang: 'en' },

  // ——— George Herbert (1633) ———
  { text: 'Lord, who createdst man in wealth and store, though foolishly he lost the same', attribution: 'G. Herbert, "Easter Wings" (1633)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'O let me rise as larks, harmoniously', attribution: 'G. Herbert, "Easter Wings" (1633)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Then shall the fall further the flight in me', attribution: 'G. Herbert, "Easter Wings" (1633)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'For, if I imp my wing on thine, affliction shall advance the flight in me', attribution: 'G. Herbert, "Easter Wings" (1633)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Prayer the church’s banquet, angel’s age, God’s breath in man returning to his birth', attribution: 'G. Herbert, "Prayer (I)" (1633)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'something understood', attribution: 'G. Herbert, "Prayer (I)" (1633)', mood: 'still', kind: 'phrase', lang: 'en' },
  { text: 'A broken altar, Lord, thy servant rears, made of a heart, and cemented with tears', attribution: 'G. Herbert, "The Altar" (1633)', mood: 'elegiac', kind: 'line', lang: 'en' },

  // ——— The seventeenth century, otherwise ———
  { text: 'You never enjoy the world aright, till the Sea itself floweth in your veins', attribution: 'T. Traherne, Centuries (c. 1672)', mood: 'ecstatic', kind: 'line', lang: 'en' },

  // ——— William Blake ———
  { text: 'The road of excess leads to the palace of wisdom.', attribution: 'W. Blake, Marriage of Heaven and Hell (c. 1790)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'The cut worm forgives the plow.', attribution: 'W. Blake, Marriage of Heaven and Hell (c. 1790)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'Eternity is in love with the productions of time.', attribution: 'W. Blake, Marriage of Heaven and Hell (c. 1790)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'The tygers of wrath are wiser than the horses of instruction.', attribution: 'W. Blake, Marriage of Heaven and Hell (c. 1790)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'If the doors of perception were cleansed every thing would appear to man as it is, infinite.', attribution: 'W. Blake, Marriage of Heaven and Hell (c. 1790)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'To see a World in a Grain of Sand and a Heaven in a Wild Flower', attribution: 'W. Blake, "Auguries of Innocence" (c. 1803)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'Hold Infinity in the palm of your hand and Eternity in an hour', attribution: 'W. Blake, "Auguries of Innocence" (c. 1803)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'Tyger Tyger, burning bright, in the forests of the night', attribution: 'W. Blake, "The Tyger" (1794)', mood: 'ecstatic', kind: 'line', lang: 'en' },

  // ——— The Romantics ———
  { text: 'A thing of beauty is a joy for ever', attribution: 'J. Keats, Endymion (1818)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Heard melodies are sweet, but those unheard are sweeter', attribution: 'J. Keats, "Ode on a Grecian Urn" (1819)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'tender is the night', attribution: 'J. Keats, "Ode to a Nightingale" (1819)', mood: 'still', kind: 'phrase', lang: 'en' },
  { text: 'Season of mists and mellow fruitfulness', attribution: 'J. Keats, "To Autumn" (1819)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'huge cloudy symbols of a high romance', attribution: 'J. Keats, "When I have fears" (1818)', mood: 'cosmic', kind: 'phrase', lang: 'en' },
  { text: 'Look on my Works, ye Mighty, and despair!', attribution: 'P. B. Shelley, "Ozymandias" (1818)', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'The lone and level sands stretch far away.', attribution: 'P. B. Shelley, "Ozymandias" (1818)', mood: 'elegiac', kind: 'sentence', lang: 'en' },
  { text: 'O wild West Wind, thou breath of Autumn’s being', attribution: 'P. B. Shelley, "Ode to the West Wind" (1819)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'If Winter comes, can Spring be far behind?', attribution: 'P. B. Shelley, "Ode to the West Wind" (1819)', mood: 'ecstatic', kind: 'sentence', lang: 'en' },
  { text: 'Water, water, every where, nor any drop to drink', attribution: 'S. T. Coleridge, "The Ancient Mariner" (1798)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'In Xanadu did Kubla Khan a stately pleasure-dome decree', attribution: 'S. T. Coleridge, "Kubla Khan" (1816)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'through caverns measureless to man, down to a sunless sea', attribution: 'S. T. Coleridge, "Kubla Khan" (1816)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'A sunny pleasure-dome with caves of ice!', attribution: 'S. T. Coleridge, "Kubla Khan" (1816)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'I wandered lonely as a cloud that floats on high o’er vales and hills', attribution: 'W. Wordsworth, "I wandered lonely as a cloud" (1807)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'The world is too much with us; late and soon', attribution: 'W. Wordsworth, "The world is too much with us" (1807)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'trailing clouds of glory do we come', attribution: 'W. Wordsworth, "Intimations of Immortality" (1807)', mood: 'cosmic', kind: 'phrase', lang: 'en' },

  // ——— The nineteenth century, American ———
  { text: 'Call me Ishmael.', attribution: 'H. Melville, Moby-Dick (1851)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'It is not down in any map; true places never are.', attribution: 'H. Melville, Moby-Dick (1851)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'The sun is but a morning star.', attribution: 'H. D. Thoreau, Walden (1854)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'Time is but the stream I go a-fishing in.', attribution: 'H. D. Thoreau, Walden (1854)', mood: 'still', kind: 'sentence', lang: 'en' },
  { text: 'Who has seen the wind? Neither I nor you', attribution: 'C. Rossetti, "Who Has Seen the Wind?" (1872)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'When I am dead, my dearest, sing no sad songs for me', attribution: 'C. Rossetti, "Song" (1862)', mood: 'elegiac', kind: 'line', lang: 'en' },

  // ——— Walt Whitman ———
  { text: 'I am large, I contain multitudes', attribution: 'W. Whitman, "Song of Myself" (1855)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'I sound my barbaric yawp over the roofs of the world', attribution: 'W. Whitman, "Song of Myself" (1855)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'If you want me again look for me under your boot-soles', attribution: 'W. Whitman, "Song of Myself" (1855)', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'The press of my foot to the earth springs a hundred affections', attribution: 'W. Whitman, "Song of Myself" (1855)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'I depart as air, I shake my white locks at the runaway sun', attribution: 'W. Whitman, "Song of Myself" (1855)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'A noiseless patient spider, I mark’d where on a little promontory it stood isolated', attribution: 'W. Whitman, "A Noiseless Patient Spider" (1868)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'ceaselessly musing, venturing, throwing, seeking the spheres to connect them', attribution: 'W. Whitman, "A Noiseless Patient Spider" (1868)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'Out of the cradle endlessly rocking', attribution: 'W. Whitman, "Out of the Cradle Endlessly Rocking" (1859)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'I too lived, Brooklyn of ample hills was mine', attribution: 'W. Whitman, "Crossing Brooklyn Ferry" (1856)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'What is it then between us?', attribution: 'W. Whitman, "Crossing Brooklyn Ferry" (1856)', mood: 'elegiac', kind: 'sentence', lang: 'en' },

  // ——— Gerard Manley Hopkins ———
  { text: 'The world is charged with the grandeur of God', attribution: 'G. M. Hopkins, "God’s Grandeur" (1877)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'It will flame out, like shining from shook foil', attribution: 'G. M. Hopkins, "God’s Grandeur" (1877)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'There lives the dearest freshness deep down things', attribution: 'G. M. Hopkins, "God’s Grandeur" (1877)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'I caught this morning morning’s minion, kingdom of daylight’s dauphin', attribution: 'G. M. Hopkins, "The Windhover" (1877)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'dapple-dawn-drawn Falcon', attribution: 'G. M. Hopkins, "The Windhover" (1877)', mood: 'ecstatic', kind: 'phrase', lang: 'en' },
  { text: 'Glory be to God for dappled things', attribution: 'G. M. Hopkins, "Pied Beauty" (1877)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'All things counter, original, spare, strange', attribution: 'G. M. Hopkins, "Pied Beauty" (1877)', mood: 'wry', kind: 'line', lang: 'en' },
  { text: 'O the mind, mind has mountains; cliffs of fall frightful, sheer, no-man-fathomed', attribution: 'G. M. Hopkins, "No worst, there is none" (1885)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Margaret, are you grieving over Goldengrove unleaving?', attribution: 'G. M. Hopkins, "Spring and Fall" (1880)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Elected Silence, sing to me and beat upon my whorlèd ear', attribution: 'G. M. Hopkins, "The Habit of Perfection" (1866)', mood: 'still', kind: 'line', lang: 'en' },

  // ——— W. B. Yeats ———
  { text: 'I will arise and go now, and go to Innisfree', attribution: 'W. B. Yeats, "The Lake Isle of Innisfree" (1890)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'And I shall have some peace there, for peace comes dropping slow', attribution: 'W. B. Yeats, "The Lake Isle of Innisfree" (1890)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'Tread softly because you tread on my dreams', attribution: 'W. B. Yeats, "He wishes for the Cloths of Heaven" (1899)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Things fall apart; the centre cannot hold', attribution: 'W. B. Yeats, "The Second Coming" (1920)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'The falcon cannot hear the falconer', attribution: 'W. B. Yeats, "The Second Coming" (1920)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'A terrible beauty is born', attribution: 'W. B. Yeats, "Easter, 1916" (1916)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'An aged man is but a paltry thing, a tattered coat upon a stick', attribution: 'W. B. Yeats, "Sailing to Byzantium" (1927)', mood: 'elegiac', kind: 'line', lang: 'en' },

  // ——— The Imagists and after ———
  { text: 'The apparition of these faces in the crowd; petals on a wet, black bough.', attribution: 'E. Pound, "In a Station of the Metro" (1913)', mood: 'still', kind: 'sentence', lang: 'en' },
  { text: 'The jewelled steps are already quite white with dew', attribution: 'Li Po, "The Jewel Stairs’ Grievance" (trans. Pound, 1915)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'Whirl up, sea — whirl your pointed pines', attribution: 'H.D., "Oread" (1914)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'so much depends upon a red wheel barrow glazed with rain water beside the white chickens', attribution: 'W. C. Williams, "The Red Wheelbarrow" (1923)', mood: 'still', kind: 'sentence', lang: 'en' },
  { text: 'The fog comes on little cat feet.', attribution: 'C. Sandburg, "Fog" (1916)', mood: 'still', kind: 'sentence', lang: 'en' },

  // ——— Gertrude Stein ———
  { text: 'A carafe, that is a blind glass.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'The difference is spreading.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'A single image is not splendor.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'Act so that there is no use in a centre.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'Sugar is not a vegetable.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'The sight of a reason, the same sight slighter', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'phrase', lang: 'en' },
  { text: 'a system to pointing', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'phrase', lang: 'en' },
  { text: 'All this and not ordinary, not unordered in not resembling.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'Dirt and not copper makes a color darker.', attribution: 'G. Stein, Tender Buttons (1914)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'Rose is a rose is a rose is a rose', attribution: 'G. Stein, "Sacred Emily" (1913)', mood: 'wry', kind: 'line', lang: 'en' },

  // ——— Pre-Socratics (trans. John Burnet, 1892) ———
  { text: 'You cannot step twice into the same rivers; for fresh waters are ever flowing in upon you.', attribution: 'Heraclitus, fr. 41 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'The way up and the way down is one and the same.', attribution: 'Heraclitus, fr. 69 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'Nature loves to hide.', attribution: 'Heraclitus, fr. 10 (trans. Burnet)', mood: 'still', kind: 'sentence', lang: 'en' },
  { text: 'The sun is new every day.', attribution: 'Heraclitus, fr. 32 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'Time is a child playing draughts, the kingly power is a child’s.', attribution: 'Heraclitus, fr. 79 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'The hidden attunement is better than the open.', attribution: 'Heraclitus, fr. 47 (trans. Burnet)', mood: 'still', kind: 'sentence', lang: 'en' },
  { text: 'War is the father of all and the king of all.', attribution: 'Heraclitus, fr. 44 (trans. Burnet)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'The bow is called life, but its work is death.', attribution: 'Heraclitus, fr. 66 (trans. Burnet)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'Man is kindled and put out like a light in the night-time.', attribution: 'Heraclitus, fr. 77 (trans. Burnet)', mood: 'elegiac', kind: 'sentence', lang: 'en' },
  { text: 'Eyes and ears are bad witnesses to men if they have souls that understand not their language.', attribution: 'Heraclitus, fr. 4 (trans. Burnet)', mood: 'wry', kind: 'sentence', lang: 'en' },
  { text: 'They give satisfaction and reparation to one another for their injustice, according to the ordering of time', attribution: 'Anaximander, fr. 1 (trans. Burnet)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'It is all one to me where I begin; for I shall come back again there.', attribution: 'Parmenides, fr. 3 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'For it is the same thing that can be thought and that can be.', attribution: 'Parmenides, fr. 5 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'For I have been ere now a boy and a girl, a bush and a bird and a dumb fish in the sea.', attribution: 'Empedocles, fr. 117 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'The gods have not revealed all things to men from the beginning; but by seeking they find in time what is better.', attribution: 'Xenophanes, fr. 18 (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },
  { text: 'In everything there is a portion of everything.', attribution: 'Anaxagoras (trans. Burnet)', mood: 'cosmic', kind: 'sentence', lang: 'en' },

  // ——— Antiquity, otherwise ———
  { text: 'They told me, Heraclitus, they told me you were dead', attribution: 'Callimachus (trans. Cory, 1858)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'I am the tomb of one shipwrecked; but sail thou', attribution: 'Greek Anthology (trans. Mackail, 1890)', mood: 'elegiac', kind: 'line', lang: 'en' },
  { text: 'Odi et amo.', attribution: 'Catullus, Carmen 85', mood: 'elegiac', kind: 'sentence', lang: 'la' },
  { text: 'sunt lacrimae rerum', attribution: 'Virgil, Aeneid I (c. 19 BCE)', mood: 'elegiac', kind: 'phrase', lang: 'la' },

  // ——— Scripture (KJV, 1611) ———
  { text: 'Vanity of vanities, saith the Preacher; all is vanity.', attribution: 'Ecclesiastes 1:2 (KJV, 1611)', mood: 'elegiac', kind: 'sentence', lang: 'en' },
  { text: 'The wind goeth toward the south, and turneth about unto the north', attribution: 'Ecclesiastes 1:6 (KJV, 1611)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'All the rivers run into the sea; yet the sea is not full', attribution: 'Ecclesiastes 1:7 (KJV, 1611)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'Rise up, my love, my fair one, and come away.', attribution: 'Song of Solomon 2:10 (KJV, 1611)', mood: 'ecstatic', kind: 'sentence', lang: 'en' },
  { text: 'Many waters cannot quench love, neither can the floods drown it', attribution: 'Song of Solomon 8:7 (KJV, 1611)', mood: 'ecstatic', kind: 'line', lang: 'en' },
  { text: 'Deep calleth unto deep at the noise of thy waterspouts', attribution: 'Psalm 42:7 (KJV, 1611)', mood: 'cosmic', kind: 'line', lang: 'en' },
  { text: 'In the beginning was the Word', attribution: 'John 1:1 (KJV, 1611)', mood: 'cosmic', kind: 'phrase', lang: 'en' },

  // ——— Japan (trans. W. G. Aston, 1899) ———
  { text: 'An ancient pond — a frog leaps in, the sound of the water', attribution: 'Bashō (trans. after Aston, 1899)', mood: 'still', kind: 'line', lang: 'en' },
  { text: 'On a withered branch a crow is perched: an autumn evening', attribution: 'Bashō (trans. after Aston, 1899)', mood: 'still', kind: 'line', lang: 'en' },

  // ——— Mallarmé & the French ———
  { text: 'Un coup de dés jamais n’abolira le hasard', attribution: 'S. Mallarmé, Un coup de dés (1897)', mood: 'cosmic', kind: 'line', lang: 'fr' },
  { text: 'RIEN N’AURA EU LIEU QUE LE LIEU', attribution: 'S. Mallarmé, Un coup de dés (1897)', mood: 'cosmic', kind: 'phrase', lang: 'fr' },
  { text: 'Toute Pensée émet un Coup de Dés', attribution: 'S. Mallarmé, Un coup de dés (1897)', mood: 'cosmic', kind: 'line', lang: 'fr' },
  { text: 'au seul souci de voyager outre une Inde splendide et trouble', attribution: 'S. Mallarmé, "Au seul souci de voyager" (1898)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'Le vierge, le vivace et le bel aujourd’hui', attribution: 'S. Mallarmé, "Le vierge, le vivace…" (1885)', mood: 'still', kind: 'line', lang: 'fr' },
  { text: 'Aboli bibelot d’inanité sonore', attribution: 'S. Mallarmé, "Ses purs ongles…" (1887)', mood: 'wry', kind: 'line', lang: 'fr' },
  { text: 'Sous le pont Mirabeau coule la Seine et nos amours', attribution: 'G. Apollinaire, "Le Pont Mirabeau" (1913)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'Vienne la nuit sonne l’heure les jours s’en vont je demeure', attribution: 'G. Apollinaire, "Le Pont Mirabeau" (1913)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'Douces figures poignardées chères lèvres fleuries', attribution: 'G. Apollinaire, "La colombe poignardée" (1916)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'Et toi mon cœur pourquoi bats-tu', attribution: 'G. Apollinaire, "Cœur couronne et miroir" (1918)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'Il pleut des voix de femmes comme si elles étaient mortes même dans le souvenir', attribution: 'G. Apollinaire, "Il pleut" (1916)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'A noir, E blanc, I rouge, U vert, O bleu: voyelles', attribution: 'A. Rimbaud, "Voyelles" (1871)', mood: 'ecstatic', kind: 'line', lang: 'fr' },
  { text: 'Je est un autre.', attribution: 'A. Rimbaud, lettre du voyant (1871)', mood: 'wry', kind: 'sentence', lang: 'fr' },
  { text: 'Là, tout n’est qu’ordre et beauté, luxe, calme et volupté.', attribution: 'C. Baudelaire, "L’Invitation au voyage" (1857)', mood: 'still', kind: 'sentence', lang: 'fr' },
  { text: 'Il faut être toujours ivre.', attribution: 'C. Baudelaire, "Enivrez-vous" (1869)', mood: 'ecstatic', kind: 'sentence', lang: 'fr' },
  { text: 'Il pleure dans mon cœur comme il pleut sur la ville', attribution: 'P. Verlaine, Romances sans paroles (1874)', mood: 'elegiac', kind: 'line', lang: 'fr' },
  { text: 'Les sanglots longs des violons de l’automne', attribution: 'P. Verlaine, "Chanson d’automne" (1866)', mood: 'elegiac', kind: 'line', lang: 'fr' },

  // ——— German & Italian ———
  { text: 'Wo aber Gefahr ist, wächst das Rettende auch.', attribution: 'F. Hölderlin, "Patmos" (1803)', mood: 'cosmic', kind: 'sentence', lang: 'de' },
  { text: 'Du mußt dein Leben ändern.', attribution: 'R. M. Rilke, "Archaïscher Torso Apollos" (1908)', mood: 'ecstatic', kind: 'sentence', lang: 'de' },
  { text: 'Über allen Gipfeln ist Ruh', attribution: 'J. W. Goethe, "Wandrers Nachtlied" (1780)', mood: 'still', kind: 'line', lang: 'de' },
  { text: 'E quindi uscimmo a riveder le stelle.', attribution: 'Dante, Inferno XXXIV (c. 1320)', mood: 'cosmic', kind: 'sentence', lang: 'it' },
  { text: 'Nel mezzo del cammin di nostra vita', attribution: 'Dante, Inferno I (c. 1320)', mood: 'elegiac', kind: 'line', lang: 'it' },

  // ——— Single resonant words, good for permutation ———
  { text: 'silence', attribution: 'after E. Gomringer, "silencio" (1953)', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'echo', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'wave', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'dust', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'o', attribution: 'the oldest vowel', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'still', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'breath', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'stone', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'rain', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'ash', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'snow', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'salt', attribution: 'a resonant word', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'lung', attribution: 'after E. Leigh, "*TIME [lung]"', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'star', attribution: 'after E. Leigh, "**SPACE [star]"', mood: 'cosmic', kind: 'word', lang: 'en' },
  { text: 'mer', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'fr' },
  { text: 'nuit', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'fr' },
  { text: 'vent', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'fr' },
  { text: 'grass', attribution: 'after W. Whitman', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'bone', attribution: 'after E. Dickinson, Fr 1096', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'ice', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'moth', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'ink', attribution: 'the material itself', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'mirror', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'door', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'river', attribution: 'after Heraclitus, fr. 41', mood: 'cosmic', kind: 'word', lang: 'en' },
  { text: 'night', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'light', attribution: 'a resonant word', mood: 'ecstatic', kind: 'word', lang: 'en' },
  { text: 'shadow', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'thread', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'knot', attribution: 'a resonant word', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'bell', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'hush', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'ember', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'root', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'seed', attribution: 'the app’s own first principle', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'pulse', attribution: 'a resonant word', mood: 'ecstatic', kind: 'word', lang: 'en' },
  { text: 'static', attribution: 'a resonant word', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'margin', attribution: 'the material itself', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'gutter', attribution: 'the fold of the book', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'glyph', attribution: 'the material itself', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'vowel', attribution: 'after A. Rimbaud, "Voyelles" (1871)', mood: 'ecstatic', kind: 'word', lang: 'en' },
  { text: 'zero', attribution: 'a resonant word', mood: 'cosmic', kind: 'word', lang: 'en' },
  { text: 'north', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'hollow', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'en' },
  { text: 'amber', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'harbor', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'en' },
  { text: 'comma', attribution: 'the material itself', mood: 'wry', kind: 'word', lang: 'en' },
  { text: 'pluie', attribution: 'after Apollinaire, "Il pleut" (1916)', mood: 'elegiac', kind: 'word', lang: 'fr' },
  { text: 'cendre', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'fr' },
  { text: 'étoile', attribution: 'a resonant word', mood: 'cosmic', kind: 'word', lang: 'fr' },
  { text: 'Nacht', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'de' },
  { text: 'Stille', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'de' },
  { text: 'mare', attribution: 'a resonant word', mood: 'still', kind: 'word', lang: 'it' },
  { text: 'stella', attribution: 'after Dante, Inferno XXXIV', mood: 'cosmic', kind: 'word', lang: 'it' },
  { text: 'lux', attribution: 'a resonant word', mood: 'ecstatic', kind: 'word', lang: 'la' },
  { text: 'umbra', attribution: 'a resonant word', mood: 'elegiac', kind: 'word', lang: 'la' },
];

/* Merge a private, gitignored supplement if one exists. */
try {
  const local = await import('./corpus.local.js');
  if (Array.isArray(local.CORPUS)) CORPUS.push(...local.CORPUS);
} catch {
  /* no local corpus; the shipped one stands alone */
}

/** Fragments filtered by kind. */
export function byKind(kind) {
  return CORPUS.filter((f) => f.kind === kind);
}

/** Fragments whose word count falls in [min, max]. */
export function byLength(min, max) {
  return CORPUS.filter((f) => {
    const n = f.text.split(/\s+/).length;
    return n >= min && n <= max;
  });
}
