/**
 * Status saver: copies contacts' WhatsApp statuses (text, photo, video, voice) to one chat.
 * The chat can be a phone number, a group (id or invite link) or a channel link.
 * Config lives in status-saver.json next to the other bot data.
 */
const store = require('./jsonStore');
const cf = require('./channelForward');

const FILE = 'status-saver.json';
const DEFAULTS = { enabled: false, target: '', label: '', only: [], skipOwn: true };
const seen = new Map(); // status id -> ts (bounded)
let chain = Promise.resolve();
let stats = { saved: 0, failed: 0, last: 0, lastError: '' };

function load() {
  const o = store.readJson(FILE, {});
  return { ...DEFAULTS, ...(o && typeof o === 'object' ? o : {}) };
}
function save(cfg) {
  store.writeJson(FILE, cfg);
  return cfg;
}

const digits = (x) => String(x || '').split('@')[0].split(':')[0].replace(/\D/g, '');

/** Number, group id/link or channel link -> { jid, label }. */
async function resolveTarget(sock, input, hereJid) {
  const raw = String(input || '').trim();
  if (!raw) throw new Error('Give a number, group link/id or channel link.');
  if (/^here$/i.test(raw) && hereJid) return { jid: hereJid, label: 'this chat' };
  const g = raw.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);
  if (g) {
    const info = await sock.groupGetInviteInfo(g[1]);
    if (!info || !info.id) throw new Error('Could not read that group link. Is it valid?');
    return { jid: info.id, label: 'group ' + (info.subject || info.id) };
  }
  if (/whatsapp\.com\/channel\//i.test(raw)) {
    const r = await cf.resolveChannelFromLink(sock, raw);
    const name = r.meta && (r.meta.name || (r.meta.thread_metadata && r.meta.thread_metadata.name && r.meta.thread_metadata.name.text));
    return { jid: r.jid, label: 'channel ' + (name || r.jid) };
  }
  if (/@(g\.us|s\.whatsapp\.net|newsletter|lid)$/.test(raw)) return { jid: raw, label: raw };
  const d = digits(raw);
  if (d.length >= 7 && d.length <= 15) return { jid: d + '@s.whatsapp.net', label: '+' + d };
  throw new Error('Not a number, group or channel link.');
}

function unwrap(msg) {
  let m = msg || {};
  for (let i = 0; i < 4; i++) {
    const inner = (m.ephemeralMessage || m.viewOnceMessage || m.viewOnceMessageV2 || m.documentWithCaptionMessage || {}).message;
    if (!inner) break;
    m = inner;
  }
  return m;
}

function describe(m) {
  const u = unwrap(m.message);
  if (u.imageMessage) return { kind: 'image', node: u.imageMessage, caption: u.imageMessage.caption || '' };
  if (u.videoMessage) return { kind: 'video', node: u.videoMessage, caption: u.videoMessage.caption || '' };
  if (u.audioMessage) return { kind: 'audio', node: u.audioMessage, caption: '' };
  const t = u.conversation || (u.extendedTextMessage && u.extendedTextMessage.text) || '';
  if (t) return { kind: 'text', text: t };
  return null;
}

async function download(sock, m) {
  const { downloadMediaMessage } = require('baileys');
  return downloadMediaMessage(m, 'buffer', {}, { reuploadRequest: sock.updateMediaMessage });
}

async function saveOne(sock, m, cfg) {
  const d = describe(m);
  if (!d) return;
  const who = digits(m.key.participantPn || m.key.participant || m.participant) || 'unknown';
  const name = m.pushName ? m.pushName + ' ' : '';
  const ts = Number(m.messageTimestamp || 0);
  const when = ts ? new Date((ts > 1e12 ? ts : ts * 1000)).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
  const head = '📌 Status · ' + name + '+' + who + (when ? ' · ' + when : '');
  const to = cfg.target;
  if (d.kind === 'text') {
    await cf.sendWithRetry(sock, to, { text: head + '\n\n' + d.text });
  } else {
    const buffer = await download(sock, m);
    if (!buffer || !buffer.length) throw new Error('empty download');
    const cap = head + (d.caption ? '\n\n' + d.caption : '');
    if (d.kind === 'image') await cf.sendWithRetry(sock, to, { image: buffer, caption: cap, mimetype: d.node.mimetype || 'image/jpeg' });
    else if (d.kind === 'video') await cf.sendWithRetry(sock, to, { video: buffer, caption: cap, mimetype: d.node.mimetype || 'video/mp4' });
    else {
      await cf.sendWithRetry(sock, to, { text: head + ' (voice)' });
      await cf.sendWithRetry(sock, to, { audio: buffer, mimetype: d.node.mimetype || 'audio/ogg; codecs=opus', ptt: !!d.node.ptt });
    }
  }
  stats.saved++;
  stats.last = Date.now();
  console.log('[ss] saved', d.kind, 'from', who, '→', to);
}

/** Called for every status@broadcast message. Never throws into the main handler. */
async function handle(sock, m) {
  const cfg = load();
  if (!cfg.enabled || !cfg.target) return;
  if (!m || !m.message || !m.key) return;
  if (m.key.fromMe && cfg.skipOwn) return;
  if (m.message.protocolMessage || m.message.reactionMessage) return;
  const id = m.key.id;
  if (seen.has(id)) return;
  seen.set(id, Date.now());
  if (seen.size > 2000) for (const k of [...seen.keys()].slice(0, 500)) seen.delete(k);
  const who = digits(m.key.participantPn || m.key.participant || m.participant);
  if (cfg.only.length && !cfg.only.includes(who)) return;
  chain = chain
    .then(() => saveOne(sock, m, cfg))
    .catch((e) => {
      stats.failed++;
      stats.lastError = String((e && e.message) || e);
      console.warn('[ss] failed', stats.lastError);
    })
    .then(() => cf.sleep(400));
  return chain;
}

module.exports = { handle, load, save, resolveTarget, stats: () => ({ ...stats }), describe, digits };
