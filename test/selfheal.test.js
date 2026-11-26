const test = require('node:test');
const assert = require('node:assert');
const { createReconnector, backoffMs } = require('../lib/reconnect');
const { decide, DEFAULTS } = require('../lib/watchdog');
const engine = require('../lib/cfwdEngine');

function fakeTimers() {
  const q = [];
  let id = 0;
  return {
    q,
    setTimeout: (fn, ms) => { const t = { id: ++id, fn, ms }; q.push(t); return t; },
    clearTimeout: (t) => { const i = q.indexOf(t); if (i >= 0) q.splice(i, 1); },
    fire() { const t = q.shift(); if (t) t.fn(); return t; },
  };
}

test('backoff grows, caps, and 440 waits at least 30s', () => {
  assert.equal(backoffMs(0), 2000);
  assert.equal(backoffMs(2), 8000);
  assert.equal(backoffMs(99), 60000);
  assert.equal(backoffMs(0, 440), 30000);
});

test('reconnector keeps retrying after failed starts and never double-schedules', async () => {
  const timers = fakeTimers();
  let calls = 0;
  const r = createReconnector({
    jitter: false, timers,
    start: async () => { calls++; if (calls < 4) throw new Error('offline'); },
  });
  await r.startNow();
  assert.equal(r.pending, true);
  assert.equal(r.schedule(undefined, 'dup'), false);
  assert.equal(timers.q.length, 1);
  for (let i = 0; i < 3; i++) { timers.fire(); await new Promise((x) => setImmediate(x)); }
  assert.equal(calls, 4);
  assert.equal(r.pending, false);
});

test('reconnector resets attempts only after a stable connection', () => {
  const timers = fakeTimers();
  const r = createReconnector({ jitter: false, timers, start: async () => {} });
  r.schedule(); timers.fire();
  assert.equal(r.attempts, 1);
  r.opened();
  timers.fire(); // stable timer
  assert.equal(r.attempts, 0);
});

test('watchdog: stale scan -> reconnect, dead -> restart, idle/loggedOut -> none', () => {
  const now = 10_000_000;
  const base = { connected: true, registered: true, channels: 2, connectedSince: now - 3_600_000, lastScanOk: now - 10_000, lastInbound: now - 10_000, rssMb: 100 };
  assert.equal(decide(base, DEFAULTS, now).action, 'none');
  assert.equal(decide({ ...base, lastScanOk: now - 5 * 60000 }, DEFAULTS, now).action, 'reconnect');
  assert.equal(decide({ ...base, channels: 0, lastScanOk: 0 }, DEFAULTS, now).action, 'none');
  assert.equal(decide({ ...base, connected: false, disconnectedSince: now - 9 * 60000 }, DEFAULTS, now).action, 'restart');
  assert.equal(decide({ ...base, connected: false, disconnectedSince: now - 60000 }, DEFAULTS, now).action, 'none');
  assert.equal(decide({ ...base, idle: true, lastScanOk: 1 }, DEFAULTS, now).action, 'none');
  assert.equal(decide({ ...base, loggedOut: true, lastScanOk: 1 }, DEFAULTS, now).action, 'none');
  assert.equal(decide({ ...base, rssMb: 900 }, { ...DEFAULTS, maxRssMb: 512 }, now).action, 'restart');
});

test('engine detects closed sockets and connection errors', () => {
  assert.equal(engine.sockClosed(null), false);
  assert.equal(engine.sockClosed({ ws: { isClosed: true } }), true);
  assert.equal(engine.sockClosed({ ws: { isOpen: true } }), false);
  for (const m of ['Connection Closed', 'read ECONNRESET', 'getaddrinfo ENOTFOUND x', 'Connection Terminated', 'socket not open', 'stream errored']) {
    assert.equal(engine.isConnError(new Error(m)), true, m);
  }
  assert.equal(engine.isConnError(new Error('bad-request')), false);
});

/* ---- delivery speed ---- */
const fs = require('fs');
const os = require('os');
const path = require('path');

test('different source channels to one target send in parallel; one source stays in order', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfwd-'));
  process.env.FORWARDS_JSON = path.join(dir, 'rules.json');
  fs.writeFileSync(process.env.FORWARDS_JSON, JSON.stringify([
    { from: '1@newsletter', to: '9@newsletter', enabled: true },
    { from: '2@newsletter', to: '9@newsletter', enabled: true },
  ]));
  const E = require('../lib/cfwdEngine');
  E._reset();
  const log = [];
  let inflight = 0, peak = 0;
  const sock = {
    ws: { isOpen: true },
    sendMessage: async (to, c) => {
      inflight++; peak = Math.max(peak, inflight);
      log.push('start:' + c.text);
      await new Promise((r) => setTimeout(r, 120));
      log.push('end:' + c.text);
      inflight--;
      return {};
    },
  };
  const mk = (jid, id, text) => ({ key: { remoteJid: jid, id, fromMe: false }, message: { conversation: text }, messageTimestamp: Math.floor(Date.now() / 1000) });
  await E.handleMessage(sock, mk('1@newsletter', 'A1', 'a1'), {});
  await E.handleMessage(sock, mk('1@newsletter', 'A2', 'a2'), {});
  await E.handleMessage(sock, mk('2@newsletter', 'B1', 'b1'), {});
  await new Promise((r) => setTimeout(r, 1200));
  assert.ok(peak >= 2, 'sources should overlap, peak=' + peak);
  assert.ok(log.indexOf('end:a1') < log.indexOf('start:a2'), 'same source must stay in order: ' + log.join(','));
  assert.equal(E._pending().length, 0);
});

test('posts older than the age limit are not forwarded (live or queued)', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfwd-'));
  process.env.FORWARDS_JSON = path.join(dir, 'rules.json');
  fs.writeFileSync(process.env.FORWARDS_JSON, JSON.stringify([{ from: '5@newsletter', to: '8@newsletter', enabled: true }]));
  const E = require('../lib/cfwdEngine');
  E._reset();
  const sent = [];
  const sock = { ws: { isOpen: true }, sendMessage: async (to, c) => { sent.push(c.text); return {}; } };
  const now = Math.floor(Date.now() / 1000);
  const mk = (id, text, ts) => ({ key: { remoteJid: '5@newsletter', id }, message: { conversation: text }, messageTimestamp: ts });
  assert.equal(await E.handleMessage(sock, mk('O1', 'old', now - 3 * 3600), {}), false);
  assert.equal(await E.handleMessage(sock, mk('F1', 'fresh', now - 120), {}), true);
  await new Promise((r) => setTimeout(r, 600));
  assert.deepEqual(sent, ['fresh']);
  // an old job restored from disk is dropped, not sent
  E._pending().push({ id: 'X>8@newsletter', jid: '5@newsletter', to: '8@newsletter', rule: { to: '8@newsletter' }, msg: mk('O2', 'stale', now - 5 * 3600), attempts: 0, next: 0, created: Date.now() });
  await E.processQueue(sock);
  assert.deepEqual(sent, ['fresh']);
  assert.equal(E._pending().length, 0);
});

test('identical headline posted again later is forwarded; same-id repeats and instant echoes are not', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cfwd-'));
  process.env.FORWARDS_JSON = path.join(dir, 'rules.json');
  fs.writeFileSync(process.env.FORWARDS_JSON, JSON.stringify([{ from: '6@newsletter', to: '7@newsletter', enabled: true }]));
  const E = require('../lib/cfwdEngine');
  E._reset();
  const sent = [];
  const sock = { ws: { isOpen: true }, sendMessage: async (to, c) => { sent.push(c.text); return {}; } };
  const mk = (id) => ({ key: { remoteJid: '6@newsletter', id }, message: { conversation: 'Breaking: same text' }, messageTimestamp: Math.floor(Date.now() / 1000) });
  assert.equal(await E.handleMessage(sock, mk('R1'), {}), true);
  assert.equal(await E.handleMessage(sock, mk('R1'), {}), false, 'same id');
  assert.equal(await E.handleMessage(sock, mk('R2'), {}), false, 'same content echoed within 3 min');
  const realNow = Date.now;
  Date.now = () => realNow() + 10 * 60 * 1000;
  try {
    assert.equal(await E.handleMessage(sock, mk('R3'), {}), true, 'same text 10 min later is a new post');
  } finally { Date.now = realNow; }
  for (const j of E._pending()) j.next = 0;
  await E.processQueue(sock);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(sent.length, 2);
});

test('watchdog reconnects a connected socket that gets no incoming events', () => {
  const now = 50_000_000;
  const s = { connected: true, registered: true, channels: 0, connectedSince: now - 3_600_000, lastInbound: now - 40 * 60000, rssMb: 100 };
  assert.equal(decide(s, DEFAULTS, now).action, 'reconnect');
  assert.equal(decide({ ...s, lastInbound: now - 60000 }, DEFAULTS, now).action, 'none');
  assert.equal(decide({ ...s, connectedSince: now - 60000 }, DEFAULTS, now).action, 'none');
});

test('health card collects facts and renders; .api reports failures cleanly', async () => {
  const hc = require('../plugins/health-card');
  const d = hc._collect();
  assert.ok(Array.isArray(d.rows) && d.rows.length > 5);
  assert.match(hc._text(d), /Bot health/);
  const api = require('../plugins/api-test');
  const orig = global.fetch;
  global.fetch = async () => { throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } }); };
  try {
    const r = await api._probe({ name: 'X', url: 'https://x.invalid', pick: () => '' });
    assert.equal(r.ok, false);
    assert.equal(r.err, 'ENOTFOUND');
  } finally { global.fetch = orig; }
});

test('.api card is valid HTML with the server results embedded and a live fetch button', () => {
  const html = require('../plugins/api-test')._card([{ ok: true, name: 'A', ms: 5 }, { ok: false, name: '</script>B', err: 'x' }]);
  assert.match(html, /Test from mini app/);
  assert.ok(!html.includes('</script>B'), 'results must be escaped');
  const js = html.match(/<script>([\s\S]*)<\/script>/)[1];
  new Function(js); // syntax check
});

test('.bubble mini game html is self-contained and its script parses', () => {
  const html = require('../plugins/bubble')._html();
  assert.ok(html.length < 40000);
  assert.ok(!/https?:\/\//.test(html.replace(/xmlns[^"]*"/g, '')), 'no network needed');
  new Function(html.match(/<script>([\s\S]*)<\/script>/)[1]);
});
