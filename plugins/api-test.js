const { isOwner } = require('../lib/owner');

const TESTS = [
  { name: 'JokeAPI', url: 'https://v2.jokeapi.dev/joke/Any?safe-mode&type=single', pick: (j) => j.joke },
  { name: 'Official Joke API', url: 'https://official-joke-api.appspot.com/random_joke', pick: (j) => j.setup + ' ' + j.punchline },
];

async function probe(t) {
  const t0 = Date.now();
  try {
    const res = await fetch(t.url, { signal: AbortSignal.timeout(12000), headers: { accept: 'application/json' } });
    const ms = Date.now() - t0;
    if (!res.ok) return { ok: false, name: t.name, ms, err: 'HTTP ' + res.status };
    const j = await res.json();
    return { ok: true, name: t.name, ms, joke: String(t.pick(j) || '').slice(0, 300) };
  } catch (e) {
    const c = e && e.cause && (e.cause.code || e.cause.message);
    return { ok: false, name: t.name, ms: Date.now() - t0, err: (e && e.name === 'TimeoutError' ? 'timeout (12s)' : (c || e.message || String(e))) };
  }
}

module.exports = {
  name: 'api',
  pattern: 'api',
  aliases: ['nettest', 'internet'],
  desc: 'Test the bot server internet access with a joke API (owner)',
  category: 'tools',
  async handler(ctx) {
    const { reply } = ctx;
    if (!isOwner(ctx)) return reply('Owner only.');
    if (typeof fetch !== 'function') return reply('This Node version has no fetch (need Node 18+).');
    const res = await Promise.all(TESTS.map(probe));
    const up = res.filter((r) => r.ok);
    const lines = res.map((r) => (r.ok ? '✅ ' + r.name + ' · ' + r.ms + 'ms' : '❌ ' + r.name + ' · ' + r.err + ' (' + r.ms + 'ms)'));
    let out = (up.length ? '*Internet: OK*' : '*Internet: NO ACCESS*') + '\n' + lines.join('\n');
    if (up.length) out += '\n\n😄 ' + up[0].joke;
    else out += '\n\nThe server could not reach the outside web (blocked network, DNS or firewall).';
    return reply(out);
  },
  _probe: probe,
};
