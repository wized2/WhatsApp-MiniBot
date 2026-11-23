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
  const base = { connected: true, registered: true, channels: 2, connectedSince: now - 3_600_000, lastScanOk: now - 10_000, rssMb: 100 };
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
