/*
 * dirtyConcrete — after Bob Cobbing's duplicator prints (Writers Forum,
 * 1963–) and the dirty-concrete wing of Core: A Symposium on Contemporary
 * Visual Poetry (ed. Byrum & Hill, 1993).
 *
 * Xerox poetics: an enlarged letter cropped past the sheet edge, cut-up
 * strips at slight angles, a stamped denial block, photocopy edge-shadow
 * bands. Degradation is layered SVG filters — feTurbulence driving
 * feDisplacementMap, then a steep feComponentTransfer to crush the
 * grays the way a fifth-generation copy would.
 *
 * Filtered layers carry data-flatten="1"; live text carries
 * data-keep-vector="1", so the flattened export can rasterize the noise
 * and keep the language editable.
 */

import { g, el, textEl, uid, r2 } from '../svg.js';
import { measure, FONTS } from '../typography.js';

function xeroxFilter(defs, rng, { scale = 8, freq = 0.012, octaves = 3 } = {}) {
  const id = uid('xerox');
  const filter = el('filter', {
    id, x: '-20%', y: '-20%', width: '140%', height: '140%',
    'color-interpolation-filters': 'sRGB',
  });
  filter.appendChild(el('feTurbulence', {
    type: 'fractalNoise',
    baseFrequency: `${r2(freq)} ${r2(freq * rng.range(0.8, 1.4))}`,
    numOctaves: octaves,
    seed: rng.int(1, 9999),
    result: 'noise',
  }));
  filter.appendChild(el('feDisplacementMap', {
    in: 'SourceGraphic', in2: 'noise',
    scale: r2(scale),
    xChannelSelector: 'R', yChannelSelector: 'G',
    result: 'displaced',
  }));
  // crush the tones: a steep transfer approximating a threshold
  const transfer = el('feComponentTransfer', { in: 'displaced' });
  for (const ch of ['feFuncR', 'feFuncG', 'feFuncB']) {
    transfer.appendChild(el(ch, { type: 'gamma', amplitude: 1, exponent: 2.6, offset: 0 }));
  }
  const alpha = el('feComponentTransfer', {});
  alpha.appendChild(el('feFuncA', { type: 'gamma', amplitude: 1.25, exponent: 0.75, offset: 0 }));
  filter.appendChild(transfer);
  filter.appendChild(alpha);
  defs.appendChild(filter);
  return id;
}

export default {
  id: 'dirtyConcrete',
  name: 'dirty concrete',
  lineage: 'Cobbing’s duplicator prints (1963–); Core symposium (1993)',
  paletteOpts: { accent: 'never' },
  marginRatio: 0.05,

  generate(rng, source, sheet) {
    const { entropy } = sheet;
    const ink = sheet.palette.ink;
    const W = sheet.width;
    const H = sheet.height;

    const defs = el('defs', {});
    const coarse = xeroxFilter(defs, rng, { scale: rng.range(10, 26), freq: 0.008, octaves: 2 });
    const fine = xeroxFilter(defs, rng, { scale: rng.range(3, 7), freq: 0.035, octaves: 3 });

    const frag = source.fragment(rng, { minWords: 4, maxWords: 16 });
    const words = frag.text.split(/\s+/);

    const raster = []; // heavily filtered: rasterized on flatten
    const vector = []; // language that must stay editable

    // ——— the enlarged letter, cropped past the edge ———
    const glyph = rng.pick(words.join('').replace(/[^\p{L}]/gu, '').split('') || ['O']);
    const glyphSize = rng.range(700, 1400) * (0.7 + entropy * 0.6);
    const gx = rng.pick([-glyphSize * 0.25, W - glyphSize * rng.range(0.25, 0.5)]);
    const gy = rng.range(H * 0.25, H * 0.95);
    raster.push(g({ filter: `url(#${coarse})`, 'data-flatten': '1' },
      textEl(glyph, {
        x: gx, y: gy, size: glyphSize, family: rng.chance(0.5) ? FONTS.serif : FONTS.sans,
        fill: ink, weight: 'bold', opacity: rng.range(0.88, 1),
      })));

    // sometimes its ghost, offset — the double-fed page
    if (rng.chance(0.45)) {
      raster.push(g({ filter: `url(#${coarse})`, 'data-flatten': '1', opacity: 0.28 },
        textEl(glyph, {
          x: gx + rng.range(-40, 40), y: gy + rng.range(10, 60),
          size: glyphSize, family: FONTS.serif, fill: ink, weight: 'bold',
        })));
    }

    // ——— photocopy edge-shadow bands ———
    const edge = rng.pick(['left', 'right', 'bottom']);
    const bandW = rng.range(14, 44);
    const bandAttrs =
      edge === 'left' ? { x: -6, y: -6, width: bandW, height: H + 12 } :
      edge === 'right' ? { x: W - bandW + 6, y: -6, width: bandW, height: H + 12 } :
      { x: -6, y: H - bandW + 6, width: W + 12, height: bandW };
    raster.push(g({ filter: `url(#${fine})`, 'data-flatten': '1' },
      el('rect', { ...bandAttrs, fill: ink, opacity: 0.82 })));

    // ——— the denial block: NONONONONO ———
    if (rng.chance(0.7)) {
      const word = rng.chance(0.7) ? 'NO' : rng.pick(words).replace(/[^\p{L}]/gu, '').toUpperCase() || 'NO';
      const stampRows = rng.int(3, 7);
      const stampSize = rng.range(26, 44);
      const repeat = Math.max(3, Math.round(rng.range(8, 14) / (word.length / 2)));
      const stampText = word.repeat(repeat);
      const stampW = measure(stampText, { size: stampSize, family: FONTS.mono, weight: 'bold' });
      const sx = rng.range(W * 0.06, Math.max(W * 0.07, W * 0.9 - stampW));
      const sy = rng.range(H * 0.12, H * 0.8);
      const angle = rng.range(-4, 4);
      const stamp = g({
        transform: `rotate(${r2(angle)} ${r2(sx)} ${r2(sy)})`,
        'data-keep-vector': '1',
      });
      const inverted = rng.chance(0.4);
      if (inverted) {
        stamp.appendChild(el('rect', {
          x: r2(sx - 14), y: r2(sy - stampSize * 1.1),
          width: r2(stampW + 28), height: r2(stampRows * stampSize * 1.12 + stampSize * 0.4),
          fill: ink,
        }));
      }
      for (let i = 0; i < stampRows; i++) {
        stamp.appendChild(textEl(stampText, {
          x: sx, y: sy + i * stampSize * 1.12, size: stampSize,
          family: FONTS.mono, weight: 'bold',
          fill: inverted ? sheet.palette.paper : ink,
          opacity: inverted ? 1 : rng.range(0.75, 0.95),
        }));
      }
      vector.push(stamp);
    }

    // ——— cut-up strips: how much language survives ———
    const nStrips = rng.int(3, 7);
    const stripSize = rng.range(15, 22);
    for (let i = 0; i < nStrips; i++) {
      const start = rng.int(0, Math.max(0, words.length - 4));
      const text = words.slice(start, start + rng.int(2, 5)).join(' ');
      const tw = measure(text, { size: stripSize, family: FONTS.serif });
      const pad = stripSize * 0.8;
      const sw = tw + pad * 2;
      const sh = stripSize * 1.9;
      const x = rng.range(-sw * 0.15, W - sw * 0.7);
      const y = H * 0.08 + (i + rng.range(0, 0.6)) * (H * 0.8 / nStrips);
      const angle = rng.range(-7, 7) * (0.5 + entropy);
      const strip = g({
        transform: `rotate(${r2(angle)} ${r2(x + sw / 2)} ${r2(y)})`,
        'data-keep-vector': '1',
      });
      // the scissored paper and its photocopy shadow
      strip.appendChild(el('rect', {
        x: r2(x + 3), y: r2(y - sh / 2 + 3), width: r2(sw), height: r2(sh),
        fill: ink, opacity: 0.55,
      }));
      strip.appendChild(el('rect', {
        x: r2(x), y: r2(y - sh / 2), width: r2(sw), height: r2(sh),
        fill: sheet.palette.paper, stroke: ink, 'stroke-width': 0.7,
      }));
      strip.appendChild(textEl(text, {
        x: x + pad, y: y + stripSize * 0.32, size: stripSize,
        family: FONTS.serif, fill: ink,
      }));
      vector.push(strip);
    }

    return {
      nodes: [defs, ...raster, ...vector],
      title: `${glyph} · ${words.slice(0, 3).join(' ').toLowerCase()}, copied`,
      attribution: frag.attribution,
    };
  },
};
