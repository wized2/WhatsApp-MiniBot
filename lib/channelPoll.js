/**
 * Channel backfill: re-check last 5 minutes every second so missed posts still forward.
 */
const channelForward = require('./channelForward');

const LOOKBACK_MS = 5 * 60 * 1000;
const POLL_MS = 1000;
const FETCH_COUNT = 30;

let timer = null;
let running = false;
let sockRef = null;
let configRef = null;
const subscribed = new Set();

function uniqueChannelJids() {
  const rules = channelForward.loadRules().filter((r) => r.enabled !== false);
  const set = new Set();
  for (const r of rules) {
    if (r.from && channelForward.isChannelJid(r.from)) set.add(r.from);
  }
  return [...set];
}

async function ensureSubscribed(sock, jid) {
  if (subscribed.has(jid)) return;
  if (typeof sock.subscribeNewsletterUpdates !== 'function') return;
  try {
    await sock.subscribeNewsletterUpdates(jid);
    subscribed.add(jid);
    console.log('[cfwd-poll] subscribed live updates', jid);
  } catch (e) {
    console.warn('[cfwd-poll] subscribe', jid, e.message || e);
  }
}

/** Walk Baileys binary node tree for message-like children */
function collectMessageNodes(node, out) {
  if (!node || typeof node !== 'object') return;
  const tag = node.tag || node.name;
  if (tag === 'message' || tag === 'msg' || tag === 'item') {
    out.push(node);
  }
  const content = node.content;
  if (Array.isArray(content)) {
    for (const c of content) collectMessageNodes(c, out);
  } else if (content && typeof content === 'object') {
    collectMessageNodes(content, out);
  }
}

function nodeToWAMessage(jid, node) {
  // Prefer already-decoded message if present
  if (node.message && node.key) {
    return {
      key: {
        remoteJid: node.key.remoteJid || jid,
        id: node.key.id || node.attrs?.id || node.attrs?.server_id,
        fromMe: false,
        participant: node.key.participant,
      },
      message: node.message,
      messageTimestamp: node.messageTimestamp || Number(node.attrs?.t) || Math.floor(Date.now() / 1000),
    };
  }

  const attrs = node.attrs || {};
  const id = attrs.server_id || attrs.id || attrs['server-id'];
  if (!id) return null;

  // Try nested plaintext / media descriptors in content array
  let message = null;
  if (node.message) message = node.message;
  else if (Array.isArray(node.content)) {
    for (const c of node.content) {
      if (c && c.message) {
        message = c.message;
        break;
      }
      // Some builds put type-specific tags
      if (c && c.tag === 'plaintext' && typeof c.content === 'string') {
        message = { conversation: c.content };
        break;
      }
    }
  }

  if (!message) return null;

  return {
    key: {
      remoteJid: jid,
      id: String(id),
      fromMe: false,
    },
    message,
    messageTimestamp: Number(attrs.t) || Math.floor(Date.now() / 1000),
  };
}

async function fetchChannelMessages(sock, jid) {
  if (typeof sock.newsletterFetchMessages !== 'function') {
    return [];
  }
  const since = Math.floor((Date.now() - LOOKBACK_MS) / 1000);
  try {
    const result = await sock.newsletterFetchMessages(jid, FETCH_COUNT, since, 0);
    const nodes = [];
    collectMessageNodes(result, nodes);
    const msgs = [];
    for (const n of nodes) {
      const m = nodeToWAMessage(jid, n);
      if (m && m.message) msgs.push(m);
    }
    // Also handle if baileys already returns messages array
    if (Array.isArray(result?.messages)) {
      for (const m of result.messages) {
        if (m?.message && m?.key) {
          msgs.push({
            ...m,
            key: { ...m.key, remoteJid: m.key.remoteJid || jid },
          });
        }
      }
    }
    return msgs;
  } catch (e) {
    console.warn('[cfwd-poll] fetch', jid, e.message || e);
    return [];
  }
}

async function tick() {
  if (running || !sockRef) return;
  running = true;
  try {
    const jids = uniqueChannelJids();
    for (const jid of jids) {
      await ensureSubscribed(sockRef, jid);
      const list = await fetchChannelMessages(sockRef, jid);
      for (const m of list) {
        try {
          // processMessage has its own dedupe — safe to call aggressively
          await channelForward.processMessage(sockRef, m, configRef || {});
        } catch (e) {
          console.error('[cfwd-poll] process', e.message || e);
        }
      }
    }
  } finally {
    running = false;
  }
}

function startChannelPoll(sock, config) {
  stopChannelPoll();
  sockRef = sock;
  configRef = config;
  subscribed.clear();
  console.log('[cfwd-poll] start · every', POLL_MS, 'ms · lookback', LOOKBACK_MS / 1000, 's');
  // immediate + interval
  tick().catch(() => {});
  timer = setInterval(() => {
    tick().catch(() => {});
  }, POLL_MS);
  if (timer.unref) timer.unref();
}

function stopChannelPoll() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  sockRef = null;
}

module.exports = { startChannelPoll, stopChannelPoll, LOOKBACK_MS, POLL_MS };
