/**
 * Channel-forward engine.
 *  - every accepted post is written to a durable queue BEFORE any send is attempted
 *  - dedupe by several ids (key id, server id, content fingerprint), kept ~72h
 *  - failed sends retry with backoff; media is never silently downgraded until late attempts
 *  - per-channel cursor lets the scanner look back over anything missed (downtime, idle, errors)
 *  - ocfwd sends carry the native "Forwarded from channel" context (tag + View channel button)
 */
const cf = require('./channelForward');
const nf = require('./newsletterFetch');
const store = require('./jsonStore');
const botState = require('./botState');

const SEEN_TTL_MS = 72 * 3600 * 1000;
const BACKOFF_S = [15, 45, 120, 300, 600, 1200, 1800, 3600, 7200];
const MAX_ATTEMPTS = 10;
const DEGRADE_AT = 6; // attempt index from which a media post may go out as text only
const FIRST_LOOKBACK_S = 600;
const MAX_LOOKBACK_S = 24 * 3600;
const SCAN_COUNT = 100;
const RESUB_MS = 10 * 60 * 1000;

let seen = null; // { id: ts }
let pending = null; // [job]
let state = null; // { cursor: {jid: sec} }
let failed = null; // [ {...} ]
let processing = false;
let writers = {};
const nameCache = new Map();
const subAt = new Map();

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
  writers.pending = store.debouncedWriter('cfwd-pending.json', () => pending, 300);
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
  processing = false;
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

function markIds(ids) {
  const now = Date.now();
  for (const i of ids) seen[i] = now;
  writers.seen.save();
}

function idsFor(jid, m) {
  return [...nf.allIds(m), nf.fingerprint(jid, m.message)];
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
  if (ids.some((i) => seen[i])) {
    markIds(ids);
    return false;
  }
  const rules = rulesFor(jid);
  if (!rules.length) return false;

  markIds(ids);
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
    const contextInfo = buildChannelContextInfo(job.jid, m, name);
    if (kind && rule.includeMedia !== false && !degraded) {
      const ok = await cf.deliverMedia(sock, job.to, m, baseText, { contextInfo });
      if (!ok) throw new Error('media not delivered');
      return;
    }
    const text = baseText || (kind ? '[' + kind + ' from channel]' : '');
    if (!text) return;
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
  if (!text) return;
  await cf.sendWithRetry(sock, job.to, { text });
}

async function processQueue(sock) {
  load();
  if (processing || botState.isIdle() || !sock) return;
  processing = true;
  try {
    for (;;) {
      if (botState.isIdle()) break;
      const now = Date.now();
      const job = pending.filter((j) => j.next <= now).sort((a, b) => a.created - b.created)[0];
      if (!job) break;
      try {
        await sendJob(sock, job);
        pending.splice(pending.indexOf(job), 1);
        console.log('[cfwd] sent', job.jid, '→', job.to, 'try', job.attempts + 1);
      } catch (e) {
        job.attempts += 1;
        if (job.attempts >= MAX_ATTEMPTS) {
          pending.splice(pending.indexOf(job), 1);
          failed.push({ id: job.id, to: job.to, jid: job.jid, error: String((e && e.message) || e), at: Date.now() });
          if (failed.length > 50) failed.shift();
          writers.failed.save();
          console.error('[cfwd] gave up', job.id, e && e.message);
        } else {
          const s = BACKOFF_S[Math.min(job.attempts - 1, BACKOFF_S.length - 1)];
          job.next = Date.now() + s * 1000;
          console.warn('[cfwd] retry in', s + 's', job.to, e && e.message);
        }
      }
      writers.pending.save();
      await cf.sleep(300 + Math.floor(Math.random() * 500));
    }
  } finally {
    processing = false;
  }
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

/** Fetch recent posts for every ruled channel and queue anything not yet seen. */
async function scan(sock, config) {
  load();
  if (botState.isIdle() || !sock) return 0;
  let added = 0;
  const nowSec = Math.floor(Date.now() / 1000);
  for (const jid of activeChannels()) {
    await ensureSubscribed(sock, jid);
    const cur = state.cursor[jid];
    const since = Math.max(cur ? cur - 300 : nowSec - FIRST_LOOKBACK_S, nowSec - MAX_LOOKBACK_S);
    let list = [];
    try {
      list = await nf.fetchChannel(sock, jid, { count: SCAN_COUNT, sinceSec: since });
    } catch (e) {
      console.warn('[cfwd] fetch', jid, e && e.message);
      continue;
    }
    for (const m of list) {
      try {
        if (await handleMessage(sock, m, config)) added++;
      } catch (e) {
        console.error('[cfwd] scan item', e && e.message);
      }
    }
  }
  return added;
}

/** `.start fresh`: ignore everything posted while idle. */
function skipToNow() {
  load();
  const nowSec = Math.floor(Date.now() / 1000);
  for (const jid of activeChannels()) state.cursor[jid] = nowSec;
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
  _reset: reset,
  _pending: () => (load(), pending),
  ensureSubscribed,
  forceResubscribe: () => subAt.clear(),
};
