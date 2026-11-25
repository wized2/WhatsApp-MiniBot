/**
 * Channel-forward engine.
 *  - every accepted post is written to a durable queue BEFORE any send is attempted
 *  - dedupe by several ids (key id, server id, content fingerprint), kept ~72h
 *  - failed sends retry with backoff; media is never silently downgraded until late attempts
 *  - per-channel server-id cursor lets the scanner look back over anything missed (downtime, idle, errors)
 *  - ocfwd sends carry the native "Forwarded from channel" context (tag + View channel button)
 */
const cf = require('./channelForward');
const nf = require('./newsletterFetch');
const store = require('./jsonStore');
const botState = require('./botState');
const health = require('./health');

const SEEN_TTL_MS = 72 * 3600 * 1000;
const EARLY_S = [3, 6, 12, 25, 50, 90]; // quick retries first: most failures are momentary
const BACKOFF_S = [120, 300, 600, 1200, 1800, 3600, 7200];
const MAX_ATTEMPTS = 10;
const DEGRADE_AT = 6; // attempt index from which a media post may go out as text only
// News goes stale: never forward a post older than this, even after the bot was off for days.
const MAX_POST_AGE_S = Math.max(60, (Number(process.env.CFWD_MAX_AGE_MIN) || 60) * 60);
const FIRST_LOOKBACK_S = Math.min(600, MAX_POST_AGE_S);
const MAX_LOOKBACK_S = MAX_POST_AGE_S;

function postSec(m) {
  const ts = Number((m && m.messageTimestamp) || 0);
  return ts > 1e12 ? Math.floor(ts / 1000) : ts;
}
function isStale(m, fallbackMs) {
  const sec = postSec(m) || Math.floor((fallbackMs || Date.now()) / 1000);
  return Date.now() / 1000 - sec > MAX_POST_AGE_S;
}
const SCAN_COUNT = 100;
const RESUB_MS = 10 * 60 * 1000;

let seen = null; // { id: ts }
let pending = null; // [job]
let state = null; // { cursor: {jid: sec}, sid: {jid: serverId}, skip }
let failed = null; // [ {...} ]
let processing = false;
const lastScan = {};
let writers = {};
const nameCache = new Map();
const subAt = new Map();
const fullAt = {}; // jid -> last cursor-less safety fetch
const scanBackoff = {}; // jid -> { fails, until }
const MAX_JOB_AGE_MS = 48 * 3600 * 1000;

function load() {
  if (seen) return;
  seen = store.readJson('cfwd-seen.json', {});
  pending = store.readJson('cfwd-pending.json', []);
  state = store.readJson('cfwd-state.json', { cursor: {} });
  failed = store.readJson('cfwd-failed.json', []);
  if (!Array.isArray(pending)) pending = [];
  if (!Array.isArray(failed)) failed = [];
  if (!state.cursor) state.cursor = {};
  const cut = Date.now() - SEEN_TTL_MS;
  for (const k of Object.keys(seen)) if (seen[k] < cut) delete seen[k];
  writers.seen = store.debouncedWriter('cfwd-seen.json', () => seen, 800);
  writers.pending = store.debouncedWriter('cfwd-pending.json', () => pending.map((j) => ({ ...j, busy: undefined })), 300);
  writers.state = store.debouncedWriter('cfwd-state.json', () => state, 800);
  writers.failed = store.debouncedWriter('cfwd-failed.json', () => failed, 800);
}

function flush() {
  load();
  for (const w of Object.values(writers)) w.flush();
}

function reset() {
  seen = pending = state = failed = null;
  writers = {};
  nameCache.clear();
  subAt.clear();
  for (const k of Object.keys(scanBackoff)) delete scanBackoff[k];
  processing = false;
  workers = 0;
  activeTo.clear();
}

const jsonSafe = (_k, v) => {
  if (v && v.type === 'Buffer' && Array.isArray(v.data)) return Buffer.from(v.data).toString('base64');
  if (v instanceof Uint8Array) return Buffer.from(v).toString('base64');
  return v;
};
const clone = (o) => JSON.parse(JSON.stringify(o, jsonSafe));

function isRuleOcfwd(rule) {
  const mode = String(rule.mode || '').toLowerCase();
  return mode === 'ocfwd' || mode === 'original' || rule.nativeForward === true;
}

function rulesFor(jid) {
  const base = String(jid).replace(/:.*/, '');
  return cf.loadRules().filter((r) => r.enabled !== false && r.from && String(r.from).replace(/:.*/, '') === base);
}

function activeChannels() {
  const set = new Set();
  for (const r of cf.loadRules()) {
    if (r.enabled !== false && r.from && cf.isChannelJid(r.from)) set.add(cf.normalizeChannelJid(r.from));
  }
  return [...set];
}

async function channelName(sock, jid, rule) {
  if (nameCache.has(jid)) return nameCache.get(jid);
  let name = (rule && rule.channelName) || '';
  if (!name && typeof sock.newsletterMetadata === 'function') {
    try {
      const md = await sock.newsletterMetadata('jid', jid);
      name = (md && ((md.thread_metadata && md.thread_metadata.name && md.thread_metadata.name.text) || md.name)) || '';
    } catch (_) {}
  }
  if (name) nameCache.set(jid, name);
  return name;
}

/** Native "forwarded from channel" context (shows the channel tag + View channel button). */
function buildChannelContextInfo(jid, m, name) {
  const ctx = { isForwarded: true, forwardingScore: 1 };
  const sid = nf.findServerId(m);
  if (sid != null) {
    ctx.forwardedNewsletterMessageInfo = {
      newsletterJid: jid,
      serverMessageId: sid,
      newsletterName: name || '',
      contentType: 1,
    };
  }
  return ctx;
}

/**
 * Live channel notifications carry only the client message id, not the numeric server id the
 * native tag/"View channel" button needs. Look the post up in the channel history instead.
 */
async function resolveServerId(sock, jid, m) {
  let sid = nf.findServerId(m);
  if (sid != null) return sid;
  try {
    const list = await nf.fetchChannel(sock, jid, { count: 40 });
    const fp = nf.fingerprint(jid, m.message);
    const hit =
      list.find((x) => x.key.id === m.key.id && nf.findServerId(x) != null) ||
      list.find((x) => nf.fingerprint(jid, x.message) === fp && nf.findServerId(x) != null);
    if (hit) {
      sid = nf.findServerId(hit);
      m.key.server_id = String(sid);
      return sid;
    }
  } catch (e) {
    console.warn('[cfwd] resolve server id', e && e.message);
  }
  return null;
}

function markIds(ids) {
  const now = Date.now();
  for (const i of ids) seen[i] = now;
  writers.seen.save();
}

const FP_WINDOW_MS = 3 * 60 * 1000; // identical content counts as the same post only this close together

function idsFor(jid, m) {
  return [...nf.allIds(m), nf.fingerprint(jid, m.message)];
}

/** A post is a duplicate if any of its ids was seen, or identical content was seen in the last few minutes. */
function isDup(ids) {
  const now = Date.now();
  return ids.some((i) => (i.startsWith('fp:') ? now - (seen[i] || 0) < FP_WINDOW_MS : !!seen[i]));
}

/** Accept a channel post: dedupe, persist jobs, kick the queue. Returns true if newly accepted. */
async function handleMessage(sock, m, config) {
  load();
  if (botState.isIdle()) return false;
  let jid = m && m.key && m.key.remoteJid;
  if (!jid || !cf.isChannelJid(jid)) return false;
  jid = cf.normalizeChannelJid(jid);
  m.key.remoteJid = jid;
  if (!m.message) return false;

  const ids = idsFor(jid, m);
  if (isDup(ids)) {
    const idOnly = ids.filter((i) => !i.startsWith('fp:'));
    if (idOnly.length && !idOnly.some((i) => seen[i])) {
      console.log('[cfwd] skip duplicate (same content within 3 min)', jid, 'id=', m.key.id);
    }
    markIds(ids);
    return false;
  }
  const rules = rulesFor(jid);
  if (!rules.length) return false;

  markIds(ids);
  if (postSec(m) && isStale(m)) {
    console.log('[cfwd] skip old post', jid, 'id=', m.key.id, Math.round((Date.now() / 1000 - postSec(m)) / 60) + ' min old');
    return false;
  }
  const ts = Number(m.messageTimestamp || 0);
  const sec = ts > 1e12 ? Math.floor(ts / 1000) : ts;
  if (sec && sec > (state.cursor[jid] || 0)) {
    state.cursor[jid] = sec;
    writers.state.save();
  }

  const snap = clone({ key: m.key, message: m.message, messageTimestamp: m.messageTimestamp });
  const now = Date.now();
  for (const rule of rules) {
    if (!rule.to) continue;
    pending.push({
      id: ids[0] + '>' + rule.to,
      jid,
      to: rule.to,
      rule: clone(rule),
      msg: snap,
      attempts: 0,
      next: now,
      created: now,
    });
  }
  writers.pending.save();
  console.log('[cfwd] queued', jid, 'id=', m.key.id, 'dests=', rules.length);
  processQueue(sock).catch((e) => console.error('[cfwd] queue', e.message || e));
  return true;
}

async function sendJob(sock, job) {
  const m = job.msg;
  const rule = job.rule;
  const kind = cf.mediaKind(cf.unwrapMessage(m.message));
  const baseText = cf.getCaptionOrText(m.message);
  const degraded = job.attempts >= DEGRADE_AT;
  const settings = cf.loadSettings();

  if (isRuleOcfwd(rule)) {
    const name = await channelName(sock, job.jid, rule);
    if (nf.findServerId(m) == null && job.attempts < 3) {
      const sid = await resolveServerId(sock, job.jid, m);
      if (sid == null) throw new Error('channel server id not available yet');
    }
    const contextInfo = buildChannelContextInfo(job.jid, m, name);
    if (kind && rule.includeMedia !== false && !degraded) {
      const ok = await cf.deliverMedia(sock, job.to, m, baseText, { contextInfo });
      if (!ok) throw new Error('media not delivered');
      return;
    }
    const text = baseText || (kind ? '[' + kind + ' from channel]' : '');
    if (!text) {
      console.log('[cfwd] skip unsupported post type', job.jid, Object.keys(cf.unwrapMessage(m.message) || {}).join(','));
      return;
    }
    await cf.sendWithRetry(sock, job.to, { text, contextInfo });
    return;
  }

  // classic
  if (settings.stripLinks && cf.shouldSkipAsLinkSpam(baseText, !!kind)) {
    console.log('[cfwd] skip link/promo spam', job.jid);
    return;
  }
  const text = cf.transformText(baseText, rule, settings);
  if (kind && rule.includeMedia !== false && !degraded) {
    const ok = await cf.deliverMedia(sock, job.to, m, text);
    if (!ok) throw new Error('media not delivered');
    return;
  }
  if (!text) {
    console.log('[cfwd] skip empty post after cleaning', job.jid, 'id=', m.key.id, kind ? '(' + kind + ' not sent)' : '');
    return;
  }
  await cf.sendWithRetry(sock, job.to, { text });
}

const MAX_WORKERS = 4;
const MEDIA_TIMEOUT_MS = 100000;
const TEXT_TIMEOUT_MS = 30000;
let workers = 0;
const activeTo = new Set(); // busy lanes. A lane is one source channel -> one destination, so order is kept per source
const lane = (j) => j.to + '|' + j.jid + (cf.mediaKind(cf.unwrapMessage(j.msg.message)) ? '|m' : '|t'); // media never blocks text

function withTimeout(p, ms, label) {
  let t;
  return Promise.race([
    p,
    new Promise((_, rej) => {
      t = setTimeout(() => rej(new Error(label + ' timed out')), ms);
    }),
  ]).finally(() => clearTimeout(t));
}

/** True when the socket is known to be closed (the send failed because of us, not the post). */
function sockClosed(sock) {
  const ws = sock && sock.ws;
  if (!ws) return false;
  if (ws.isOpen === false && (ws.isClosed === true || ws.isClosing === true)) return true;
  return ws.isClosed === true || ws.isClosing === true;
}

function isConnError(e) {
  const m = String((e && e.message) || e || '');
  return /connection (closed|terminated|lost|failure)|not open|stream (errored|end)|ws (closed|not)|socket (hang|closed)|ECONNRESET|EPIPE|ENOTFOUND|EAI_AGAIN|ETIMEDOUT/i.test(m);
}

async function worker(sock) {
  for (;;) {
    if (botState.isIdle() || sockClosed(sock)) return;
    const now = Date.now();
    const job = pending
      .filter((j) => j.next <= now && !activeTo.has(lane(j)) && !j.busy)
      .sort((a, b) => a.created - b.created)[0];
    if (!job) return;
    if (isStale(job.msg, job.created)) {
      const i = pending.indexOf(job);
      if (i >= 0) pending.splice(i, 1);
      console.log('[cfwd] dropped stale post', job.jid, '→', job.to, '(older than ' + Math.round(MAX_POST_AGE_S / 60) + ' min)');
      writers.pending.save();
      continue;
    }
    job.busy = true;
    activeTo.add(lane(job));
    try {
      const isMedia = !!cf.mediaKind(cf.unwrapMessage(job.msg.message));
      await withTimeout(sendJob(sock, job), isMedia ? MEDIA_TIMEOUT_MS : TEXT_TIMEOUT_MS, 'send');
      const i = pending.indexOf(job);
      if (i >= 0) pending.splice(i, 1);
      health.noteSendOk();
      console.log('[cfwd] sent', job.jid, '→', job.to, 'try', job.attempts + 1, 'took', Math.round((Date.now() - job.created) / 1000) + 's');
      kick(sock, job.to);
    } catch (e) {
      const offline = isConnError(e) || sockClosed(sock);
      if (offline && Date.now() - job.created < MAX_JOB_AGE_MS) {
        // The connection dropped, not the post: wait for the reconnect without using up a try.
        job.next = Date.now() + 10000;
        console.warn('[cfwd] offline, will retry', job.to, e && e.message);
        job.busy = false;
        activeTo.delete(lane(job));
        writers.pending.save();
        return;
      }
      job.attempts += 1;
      if (job.attempts >= MAX_ATTEMPTS || Date.now() - job.created >= MAX_JOB_AGE_MS) {
        const i = pending.indexOf(job);
        if (i >= 0) pending.splice(i, 1);
        failed.push({ id: job.id, to: job.to, jid: job.jid, error: String((e && e.message) || e), at: Date.now() });
        if (failed.length > 50) failed.shift();
        writers.failed.save();
        console.error('[cfwd] gave up', job.id, e && e.message);
      } else {
        const sec = job.attempts <= EARLY_S.length ? EARLY_S[job.attempts - 1] : BACKOFF_S[Math.min(job.attempts - EARLY_S.length - 1, BACKOFF_S.length - 1)];
        job.next = Date.now() + sec * 1000;
        console.warn('[cfwd] retry in', sec + 's', job.to, e && e.message);
      }
    } finally {
      job.busy = false;
      activeTo.delete(lane(job));
    }
    writers.pending.save();
    await cf.sleep(60 + Math.floor(Math.random() * 140));
  }
}

async function processQueue(sock) {
  load();
  if (botState.isIdle() || !sock) return;
  const runs = [];
  while (workers < MAX_WORKERS && pending.some((j) => j.next <= Date.now() && !j.busy && !activeTo.has(lane(j)))) {
    workers++;
    runs.push(
      worker(sock)
        .catch((e) => console.error('[cfwd] worker', e && e.message))
        .finally(() => {
          workers--;
        })
    );
  }
  await Promise.all(runs);
}

async function ensureSubscribed(sock, jid) {
  if (typeof sock.subscribeNewsletterUpdates !== 'function') return;
  if (Date.now() - (subAt.get(jid) || 0) < RESUB_MS) return;
  try {
    await sock.subscribeNewsletterUpdates(jid);
    subAt.set(jid, Date.now());
  } catch (e) {
    console.warn('[cfwd] subscribe', jid, e && e.message);
    subAt.set(jid, Date.now() - RESUB_MS + 60 * 1000); // retry in ~1 min
  }
}

const scanning = new Set(); // channels being fetched right now: one slow channel never holds up the others

/** We just posted into `jid`; if another rule forwards FROM it, pick the post up now instead of at the next tick. */
function kick(sock, jid) {
  try {
    if (!activeChannels().includes(cf.normalizeChannelJid(jid))) return;
  } catch (_) { return; }
  const t = setTimeout(() => scanOne(sock, cf.normalizeChannelJid(jid), {}, Math.floor(Date.now() / 1000)).catch(() => {}), 700);
  if (t.unref) t.unref();
}

/** Fetch recent posts for a ruled channel and queue anything not yet seen. */
async function scanOne(sock, jid, config, nowSec) {
  if (scanning.has(jid)) return 0;
  scanning.add(jid);
  try {
    return await scanOneInner(sock, jid, config, nowSec);
  } finally {
    scanning.delete(jid);
  }
}

async function scanOneInner(sock, jid, config, nowSec) {
  const wait = scanBackoff[jid];
  if (wait && Date.now() < wait.until) return 0;
  await withTimeout(ensureSubscribed(sock, jid), 30000, 'subscribe').catch(() => {});
  state.sid = state.sid || {};
  let after = state.sid[jid] || 0;
  // Safety net: every 30s also look at the newest posts without the cursor. If the cursor ever
  // ran ahead of the real posts (odd server id), the channel would look "stuck"; this recovers it.
  const full = after && Date.now() - (fullAt[jid] || 0) > 30000;
  if (full) fullAt[jid] = Date.now();
  let list;
  try {
    list = await withTimeout(nf.fetchChannel(sock, jid, full ? { count: 20 } : { count: after ? SCAN_COUNT : 30, afterServerId: after }), 40000, 'fetch');
  } catch (e) {
    lastScan[jid] = { at: Date.now(), count: 0, err: String((e && e.message) || e) };
    // Back off 5s, 10s, 20s … up to 60s so a struggling channel is not hammered (rate limits)
    const fails = ((wait && wait.fails) || 0) + 1;
    scanBackoff[jid] = { fails, until: Date.now() + Math.min(60000, 5000 * Math.pow(2, fails - 1)) };
    health.noteScanFail();
    console.warn('[cfwd] fetch', jid, e && e.message, '(fail #' + fails + ')');
    return 0;
  }
  delete scanBackoff[jid];
  health.noteScanOk();
  // First run for a channel: only recent posts count, older history is marked seen, not forwarded.
  const minTs = Math.max(after ? nowSec - MAX_LOOKBACK_S : nowSec - FIRST_LOOKBACK_S, state.skip || 0);
  let added = 0;
  let maxSid = after;
  let failedSid = 0; // lowest server id whose handling threw: the cursor must stay below it so it is retried
  for (const m of list) {
    const sid = nf.findServerId(m);
    try {
      if (sid && sid > maxSid) maxSid = sid;
      const ts = Number(m.messageTimestamp || 0);
      const sec = ts > 1e12 ? Math.floor(ts / 1000) : ts;
      if (sec && sec < minTs) {
        markIds(idsFor(jid, m));
        continue;
      }
      if (await handleMessage(sock, m, config)) added++;
    } catch (e) {
      console.error('[cfwd] scan item', e && e.message);
      if (sid && (!failedSid || sid < failedSid)) failedSid = sid;
    }
  }
  if (failedSid && maxSid >= failedSid) maxSid = Math.max(after, failedSid - 1);
  if (full && list.length) {
    const top = list.reduce((x, m) => Math.max(x, nf.findServerId(m) || 0), 0);
    if (top && top < after) {
      console.warn('[cfwd] cursor was ahead of channel', jid, after, '->', top);
      state.sid[jid] = top;
      writers.state.save();
      after = top;
      maxSid = top;
    }
  }
  if (maxSid > after) {
    state.sid[jid] = maxSid;
    writers.state.save();
  }
  lastScan[jid] = { at: Date.now(), count: list.length, added };
  if (added) console.log('[cfwd] scan caught', added, 'post(s) from', jid);
  return added;
}

async function scan(sock, config) {
  load();
  if (botState.isIdle() || !sock) return 0;
  const nowSec = Math.floor(Date.now() / 1000);
  const res = await Promise.all(activeChannels().map((jid) => scanOne(sock, jid, config, nowSec)));
  return res.reduce((a, b) => a + b, 0);
}

/** `.start fresh`: ignore everything posted while idle. */
function skipToNow() {
  load();
  const nowSec = Math.floor(Date.now() / 1000);
  state.skip = nowSec;
  writers.state.save();
}

function status() {
  load();
  return {
    pending: pending.length,
    failed: failed.slice(-5),
    cursors: { ...state.cursor },
    seen: Object.keys(seen).length,
    channels: activeChannels().length,
    scans: JSON.parse(JSON.stringify(lastScan)),
  };
}

function clearPending() {
  load();
  const n = pending.length;
  pending.length = 0;
  writers.pending.save();
  return n;
}

module.exports = {
  handleMessage,
  processQueue,
  scan,
  skipToNow,
  status,
  clearPending,
  flush,
  buildChannelContextInfo,
  channelName,
  isRuleOcfwd,
  resolveServerId,
  _reset: reset,
  _pending: () => (load(), pending),
  ensureSubscribed,
  forceResubscribe: () => {
    subAt.clear();
    for (const k of Object.keys(scanBackoff)) delete scanBackoff[k];
  },
  sockClosed,
  isConnError,
};
