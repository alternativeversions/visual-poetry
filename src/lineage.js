/*
 * lineage.js — the lineage, in the app. The README is the source of
 * truth: its annotated bibliography names each engine in backticks, so
 * the page fetches README.md from its own origin once and finds the
 * paragraphs that speak of the current engine. Nothing is copied into
 * code, nothing goes stale, and nothing from the README is inserted as
 * raw HTML — the paragraphs are rebuilt from parsed pieces.
 */

import { CAPTIONS } from './colophon.js';

let readmeText = null;

/** The README's text, fetched once; '' when it cannot be had. */
export async function loadReadme() {
  if (readmeText !== null) return readmeText;
  try {
    const r = await fetch('README.md', { cache: 'force-cache' });
    readmeText = r.ok ? await r.text() : '';
  } catch {
    readmeText = '';
  }
  return readmeText;
}

/** The lineage paragraphs that name `engineId`, in README order. */
export function lineageParagraphs(text, engineId) {
  const start = text.indexOf('## The lineage');
  const end = text.indexOf('### The anthologies');
  if (start < 0) return [];
  const section = text.slice(start, end > start ? end : undefined);
  const needle = '`' + engineId + '`';
  return section
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p && !p.startsWith('#') && p.includes(needle));
}

/**
 * A minimal inline-markdown pass — **bold**, *italic*, `code`,
 * [text](url) — returning a DocumentFragment built from elements, so the
 * README's text is never handed to innerHTML.
 */
export function renderInline(raw) {
  /* a backslash-escaped mark (\*, \_, \`) is literal: hide it from the
   * tokenizer, restore it in the text */
  const str = raw.replace(/\\([*_`])/g, (_, ch) => '\u0001' + ch.charCodeAt(0).toString(16).padStart(2, '0'));
  const un = (t) => t.replace(/\u0001([0-9a-f]{2})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const frag = document.createDocumentFragment();
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  while ((m = re.exec(str))) {
    if (m.index > last) frag.appendChild(document.createTextNode(un(str.slice(last, m.index))));
    const tok = m[0];
    let node;
    if (tok.startsWith('**')) { node = document.createElement('strong'); node.textContent = un(tok.slice(2, -2)); }
    else if (tok.startsWith('*')) { node = document.createElement('em'); node.textContent = un(tok.slice(1, -1)); }
    else if (tok.startsWith('`')) { node = document.createElement('code'); node.textContent = un(tok.slice(1, -1)); }
    else node = document.createTextNode(un(tok.slice(1, tok.indexOf(']'))));
    frag.appendChild(node);
    last = m.index + tok.length;
  }
  if (last < str.length) frag.appendChild(document.createTextNode(un(str.slice(last))));
  return frag;
}

/** The colophon captions an engine can carry. */
export function captionsFor(engineId) {
  return CAPTIONS[engineId] || [];
}

/**
 * Fill `body` with the lineage of one or two engines: name, the README's
 * paragraphs (or a line saying they could not be loaded), the captions,
 * and a link to the README section.
 */
export function renderLineage(body, engines, text) {
  body.innerHTML = '';
  for (const e of engines) {
    const h = document.createElement('h2');
    h.textContent = e.name;
    body.appendChild(h);
    const paras = text ? lineageParagraphs(text, e.id) : [];
    if (paras.length) {
      for (const p of paras) {
        const el = document.createElement('p');
        el.appendChild(renderInline(p));
        body.appendChild(el);
      }
    } else {
      const el = document.createElement('p');
      el.className = 'faint';
      el.textContent = text
        ? 'The README has no paragraph for this engine yet.'
        : 'The bibliography could not be loaded; the colophon’s citations follow.';
      body.appendChild(el);
    }
    const label = document.createElement('p');
    label.className = 'cites-label';
    label.textContent = 'as the colophon cites it';
    body.appendChild(label);
    const ul = document.createElement('ul');
    ul.className = 'cites';
    for (const c of captionsFor(e.id)) {
      const li = document.createElement('li');
      li.textContent = c;
      ul.appendChild(li);
    }
    body.appendChild(ul);
  }
  const a = document.createElement('a');
  a.href = 'README.md#the-lineage-an-annotated-bibliography';
  a.textContent = 'the README, in full';
  a.className = 'readme-link';
  body.appendChild(a);
}
