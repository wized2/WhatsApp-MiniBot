/**
 * Newsletter (channel) fetch helpers.
 * Parses the raw binary node tree returned by sock.newsletterFetchMessages into
 * regular WAMessage-like objects (decoding the protobuf `plaintext` payloads),
 * and keeps the channel server ids needed for the native "forwarded from channel" tag.
 */
const crypto = require('crypto');

let _proto = null;
function proto() {
  if (!_proto) _proto = require('baileys').proto;
  return _proto;
}

function asBuffer(c) {
  if (!c) return null;
  if (Buffer.isBuffer(c)) return c;
  if (c instanceof Uint8Array) return Buffer.from(c);
  if (typeof c === 'object' && c.type === 'Buffer' && Array.isArray(c.data)) return Buffer.from(c.data);
  return null;
}

function kids(node) {
  return Array.isArray(node && node.content) ? node.content : [];
}

function decodePlaintext(buf) {
  try {
    return proto().Message.decode(buf).toJSON();
  } catch (_) {
    return null;
  }
}

/** Walk a node tree and collect every <message> node. */
function collectMessageNodes(node, out, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 12) return out;
  if (node.tag === 'message' && node.attrs) out.push(node);
  for (const c of kids(node)) collectMessageNodes(c, out, depth + 1);
  return out;
}

/** Convert one <message> node to a WAMessage-like object, or null. */
function nodeToMessage(jid, node) {
  const attrs = node.attrs || {};
  const serverId = attrs.server_id || attrs['server-id'] || attrs.id || null;
  const id = attrs.message_id || attrs.id || attrs.server_id || attrs['server-id'];
  if (!id) return null;
  let message = null;
  for (const c of kids(node)) {
    if (c && c.tag === 'plaintext') {
      const buf = asBuffer(c.content);
      if (buf) message = decodePlaintext(buf);
      else if (typeof c.content === 'string') message = { conversation: c.content };
    }
  }
  if (!message || !Object.keys(message).length) return null;
  const key = { remoteJid: jid, id: String(id), fromMe: false };
  if (serverId != null) key.server_id = String(serverId);
  const t = Number(attrs.t) || Math.floor(Date.now() / 1000);
  return { key, message, messageTimestamp: t };
}

function parseFetchResult(jid, result) {
  const out = [];
  const seen = new Set();
  for (const n of collectMessageNodes(result, [])) {
    const m = nodeToMessage(jid, n);
    if (m && !seen.has(m.key.id)) {
      seen.add(m.key.id);
      out.push(m);
    }
  }
  // Some Baileys builds already return decoded arrays.
  const arr = Array.isArray(result) ? result : Array.isArray(result && result.messages) ? result.messages : [];
  for (const m of arr) {
    if (!m || !m.message) continue;
    const id = (m.key && m.key.id) || m.id;
    if (!id || seen.has(String(id))) continue;
    seen.add(String(id));
    const key = { ...(m.key || {}), remoteJid: (m.key && m.key.remoteJid) || jid, id: String(id) };
    if (key.server_id == null && m.server_id != null) key.server_id = String(m.server_id);
    out.push({ ...m, key });
  }
  out.sort((a, b) => Number(a.messageTimestamp || 0) - Number(b.messageTimestamp || 0));
  return out;
}

/** Best server message id (integer-like) for forwardedNewsletterMessageInfo. */
function findServerId(m) {
  const cands = [m && m.key && m.key.server_id, m && m.server_id, m && m.key && m.key.id];
  for (const c of cands) {
    if (c != null && /^\d+$/.test(String(c))) return parseInt(String(c), 10);
  }
  return null;
}

/** All ids a message may be known by (live path vs poll path can differ). */
function allIds(m) {
  const ids = new Set();
  const k = (m && m.key) || {};
  const jid = k.remoteJid || '';
  if (k.id) ids.add(jid + '|' + k.id);
  if (k.server_id != null) ids.add(jid + '|s' + k.server_id);
  return [...ids];
}

/** Content fingerprint: survives id differences between live and poll paths. */
function fingerprint(jid, message) {
  let raw = '';
  try {
    const msg = message || {};
    const node =
      msg.imageMessage || msg.videoMessage || msg.documentMessage || msg.audioMessage || msg.stickerMessage || null;
    const text =
      msg.conversation ||
      (msg.extendedTextMessage && msg.extendedTextMessage.text) ||
      (node && node.caption) ||
      '';
    const sha = node && node.fileSha256 ? String(node.fileSha256) : '';
    raw = jid + '|' + text + '|' + sha;
  } catch (_) {}
  return 'fp:' + crypto.createHash('sha1').update(raw).digest('hex');
}

/**
 * Fetch posts the way WhatsApp Web does: iq to s.whatsapp.net -> <messages type="jid" jid=.. count=..>.
 * (Baileys rc14's newsletterFetchMessages uses the "message_updates" request, which hangs on
 * many channels.) `afterServerId` returns only posts newer than that server id.
 */
async function fetchChannel(sock, jid, { count = 50, afterServerId = 0 } = {}) {
  if (typeof sock.query === 'function' && typeof sock.generateMessageTag === 'function') {
    const attrs = { count: String(count), type: 'jid', jid };
    if (afterServerId) attrs.after = String(afterServerId);
    const result = await sock.query({
      tag: 'iq',
      attrs: { id: sock.generateMessageTag(), type: 'get', xmlns: 'newsletter', to: 's.whatsapp.net' },
      content: [{ tag: 'messages', attrs }],
    });
    return parseFetchResult(jid, result);
  }
  if (typeof sock.newsletterFetchMessages !== 'function') return [];
  const result = await sock.newsletterFetchMessages(jid, count, 0, afterServerId || 0);
  return parseFetchResult(jid, result);
}

module.exports = { parseFetchResult, nodeToMessage, collectMessageNodes, findServerId, allIds, fingerprint, fetchChannel };
