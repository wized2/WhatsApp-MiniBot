/**
 * Aggressive channel backfill: catch posts missed by live upsert.
 * Poll every 1.5s, 10-minute lookback, deep node walk + messages[] shapes.
 */
const channelForward = require('./channelForward');

const LOOKBACK_MS = 10 * 60 * 1000;
const POLL_MS = 1500;
const FETCH_COUNT = 50;

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
    console.log('[cfwd-poll] subscribed', jid);
  } catch (e) {
    console.warn('[cfwd-poll] subscribe', jid, e.message || e);
  }
}

function collectMessageNodes(node, out, depth) {
  if (!node || typeof node !== 'object' || depth > 24) return;
  const tag = node.tag || node.name;
  if (tag === 'message' || node.message || (node.attrs && (node.attrs.id || node.attrs['server-id']))) {
    out.push(node);
  }
  const kids = node.content;
  if (Array.isArray(kids)) {
    for (const c of kids) collectMessageNodes(c, out, depth + 1);
  } else if (kids && typeof kids === 'object') {
    collectMessageNodes(kids, out, depth + 1);
  }
  if (Array.isArray(node.messages)) {
    for (const m of node.messages) out.push(m);
  }
}

function nodeToWAMessage(jid, node) {
  if (!node) return null;
  if (node.key && node.message) {
    return {
      ...node,
      key: { ...node.key, remoteJid: node.key.remoteJid || jid },
    };
  }
  const attrs = node.attrs || {};
  const id = attrs.id || attrs['server-id'] || node.id;
  if (!id) return null;

  let message = node.message || null;
  if (!message && Array.isArray(node.content)) {
    for (const c of node.content) {
      if (c && c.message) {
        message = c.message;
        break;
      }
      if (c && c.tag === 'plaintext' && typeof c.content === 'string') {
        message = { conversation: c.content };
        break;
      }
      // media-ish tags
      if (c && c.tag && /image|video|audio|document|sticker/i.test(c.tag)) {
        const key = c.tag.replace(/Message$/i, '') + 'Message';
        const k = key.charAt(0).toLowerCase() + key.slice(1);
        if (k.endsWith('Message')) message = { [k]: c.attrs || c };
      }
    }
  }
  if (!message) return null;
  return {
    key: { remoteJid: jid, id: String(id), fromMe: false },
    message,
    messageTimestamp: Number(attrs.t) || Math.floor(Date.now() / 1000),
  };
}

async function fetchChannelMessages(sock, jid) {
  if (typeof sock.newsletterFetchMessages !== 'function') return [];
  const since = Math.floor((Date.now() - LOOKBACK_MS) / 1000);
  const out = [];
  try {
    const result = await sock.newsletterFetchMessages(jid, FETCH_COUNT, since, 0);
    const nodes = [];
    collectMessageNodes(result, nodes, 0);
    for (const n of nodes) {
      const m = nodeToWAMessage(jid, n);
      if (m && m.message) out.push(m);
    }
    if (Array.isArray(result?.messages)) {
      for (const m of result.messages) {
        if (m?.message) {
          out.push({
            ...m,
            key: { ...(m.key || {}), remoteJid: (m.key && m.key.remoteJid) || jid, id: m.key?.id || m.id },
          });
        }
      }
    }
  } catch (e) {
    console.warn('[cfwd-poll] fetch', jid, e.message || e);
  }
  return out;
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
  console.log('[cfwd-poll] every', POLL_MS, 'ms · lookback', LOOKBACK_MS / 1000, 's · count', FETCH_COUNT);
  timer = setInterval(() => {
    tick().catch((e) => console.error('[cfwd-poll]', e.message || e));
  }, POLL_MS);
  setTimeout(() => tick().catch(() => {}), 800);
}

function stopChannelPoll() {
  if (timer) clearInterval(timer);
  timer = null;
  sockRef = null;
  running = false;
}

function refreshSubscriptions() {
  subscribed.clear();
}

module.exports = { startChannelPoll, stopChannelPoll, refreshSubscriptions, tick };
