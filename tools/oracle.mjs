/*
 * tools/oracle.mjs — the operator's bench. Ask the local model for
 * silhouettes and profiles from the command line, through the very
 * prompts, request bodies and gates the site uses (aiParser.js), and
 * see what the teletype would receive before ever opening the page.
 *
 *   node tools/oracle.mjs kettle ladder
 *   node tools/oracle.mjs --task=profile bottle lighthouse
 *   node tools/oracle.mjs --task=both --model=qwen3:30b-a3b harbor
 *
 * Also reports the server's state first: a loaded model whose
 * keep-alive expiry is already in the past has a request in flight —
 * another project holds the slot, and everything below will queue.
 */

import {
  shapePrompt, profilePrompt, rasterizeParts, validShape, validProfile,
  ollamaBody, OLLAMA_MODEL,
} from '../src/text/aiParser.js';

const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split('=').slice(1).join('=') : dflt;
};
const words = args.filter((x) => !x.startsWith('--'));
const task = flag('task', 'shape');
const model = flag('model', OLLAMA_MODEL);
const base = flag('url', 'http://localhost:11434');
const timeout = Number(flag('timeout', '180')) * 1000;

if (!words.length) {
  console.log('usage: node tools/oracle.mjs [--task=shape|profile|both] [--model=…] [--url=…] [--timeout=seconds] word [word…]');
  process.exit(1);
}

/* ---- the server, before anything is asked of it ---- */
try {
  const version = await (await fetch(`${base}/api/version`, { signal: AbortSignal.timeout(4000) })).json();
  const ps = await (await fetch(`${base}/api/ps`, { signal: AbortSignal.timeout(4000) })).json();
  console.log(`ollama ${version.version} at ${base}`);
  if (!ps.models || !ps.models.length) {
    console.log('no model loaded — the first request will pay the load time');
  }
  for (const m of ps.models || []) {
    const stale = new Date(m.expires_at) < new Date();
    console.log(`loaded: ${m.name} (${(m.size_vram / 1e9).toFixed(1)} GB)${stale
      ? ' — expiry already passed: a request is IN FLIGHT; everything below will queue' : ''}`);
  }
} catch {
  console.log(`no Ollama at ${base} — is it running?`);
  process.exit(1);
}

/* ---- the asking ---- */
const shade = (d) => (d === '0' ? '·' : d >= '6' ? '#' : ',');

async function ask(word, which) {
  const prompt = which === 'shape' ? shapePrompt(word) : profilePrompt(word);
  const numPredict = which === 'shape' ? 900 : 400;
  const t0 = Date.now();
  process.stdout.write(`\n${which} of “${word}” — asked… `);
  let res;
  try {
    res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      signal: AbortSignal.timeout(timeout),
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(ollamaBody(model, prompt, numPredict)),
    });
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    const data = await res.json();
    if (!res.ok) { console.log(`http ${res.status} after ${secs}s: ${JSON.stringify(data).slice(0, 120)}`); return; }
    const raw = ((data.message && data.message.content) || '').replace(/^[^{]*/, '').replace(/[^}]*$/, '');
    const obj = JSON.parse(raw);
    if (which === 'shape') {
      const rows = validShape(rasterizeParts(obj.parts));
      console.log(`answered in ${secs}s (${data.eval_count} tokens, ${obj.parts?.length ?? 0} parts) — gate: ${rows ? 'PASSED' : 'DECLINED (a hand tape would stand in)'}`);
      for (const r of rasterizeParts(obj.parts) || []) console.log('  ' + [...r].map(shade).join(''));
    } else {
      const widths = validProfile(obj.widths);
      console.log(`answered in ${secs}s (${data.eval_count} tokens, ${obj.widths?.length ?? 0} widths) — gate: ${widths ? 'PASSED' : 'DECLINED (a classical shape would stand in)'}`);
      for (const v of widths || obj.widths || []) {
        const w = Math.max(1, Math.round(Number(v) * 44));
        console.log('  ' + ' '.repeat(Math.round((46 - w) / 2)) + '#'.repeat(w));
      }
    }
  } catch (e) {
    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(e.name === 'TimeoutError'
      ? `timed out after ${secs}s — the slot is likely held by another job`
      : `failed after ${secs}s: ${String(e).split('\n')[0]}`);
  }
}

for (const word of words) {
  if (task === 'shape' || task === 'both') await ask(word, 'shape');
  if (task === 'profile' || task === 'both') await ask(word, 'profile');
}
